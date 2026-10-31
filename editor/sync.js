// 기기 간 동기화 (Supabase). 기기 저장이 기본이고, 서버는 기기 사이를 잇는 역할만 합니다.
// 서버에 닿지 않으면(오프라인·프로젝트 일시 정지) 이 기기에만 저장하고 편집은 계속됩니다.
import {SUPABASE_URL, SUPABASE_KEY} from './sync-config.js';

const CONF = 'lumo-sync-config', SESSION = 'lumo-sync-session', META = 'lumo-sync-meta';
const MAX_BYTES = 4500000;
const $ = id => document.getElementById(id);
let app, timer, running = false, again = false, pendingRemote = null;

const read = k => {try {return JSON.parse(localStorage.getItem(k) || 'null');} catch {return null;}};
const write = (k, v) => {try {v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v));} catch {}};

function config() {
  if (SUPABASE_URL && SUPABASE_KEY) return {url: SUPABASE_URL.replace(/\/+$/, ''), key: SUPABASE_KEY, fixed: true};
  const c = read(CONF);
  return c?.url && c?.key ? {url: c.url, key: c.key, fixed: false} : null;
}

// secret·service_role 키는 받지 않습니다.
function badKey(key) {
  if (/^sb_secret_/i.test(key)) return true;
  const part = key.split('.')[1];
  if (!part) return false;
  try {return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role';} catch {return false;}
}

function device() {return matchMedia('(pointer:coarse)').matches ? '모바일' : 'PC';}

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function setState(text, kind = '') {
  const el = $('sync-state');
  if (!el) return;
  el.textContent = text;
  el.dataset.kind = kind;
  const d = $('sync-status');
  if (d) d.textContent = text;
}

// ───────── 인증 ─────────
async function authCall(path, body) {
  const c = config();
  const res = await fetch(c.url + '/auth/v1/' + path, {method: 'POST', headers: {apikey: c.key, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const v = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(Error(v.msg || v.error_description || v.message || '로그인 실패(' + res.status + ')'), {status: res.status});
  return v;
}

function keep(v) {
  const s = {access: v.access_token, refresh: v.refresh_token, exp: Date.now() + (v.expires_in || 3600) * 1000, email: v.user?.email || read(SESSION)?.email || ''};
  write(SESSION, s);
  return s;
}

async function token(force = false) {
  const s = read(SESSION);
  if (!s?.refresh) return null;
  if (!force && s.access && s.exp > Date.now() + 60000) return s.access;
  try {return keep(await authCall('token?grant_type=refresh_token', {refresh_token: s.refresh})).access;}
  catch (e) {
    // 서버에 닿지 않은 것과 로그인이 풀린 것을 구분합니다. 풀린 경우에만 세션을 지웁니다.
    if (e.status === 400 || e.status === 401 || e.status === 403) {write(SESSION, null); throw Object.assign(Error('로그인이 만료되었습니다. 다시 로그인해 주세요.'), {loggedOut: true});}
    throw e;
  }
}

async function rest(method, query, body, extra = {}) {
  const c = config();
  let t = await token();
  if (!t) throw Object.assign(Error('로그인이 필요합니다.'), {loggedOut: true});
  const go = tk => fetch(c.url + '/rest/v1/studio_state' + query, {method, headers: {apikey: c.key, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json', Prefer: 'return=representation', ...extra}, body: body ? JSON.stringify(body) : undefined});
  let res = await go(t);
  if (res.status === 401) res = await go(await token(true));
  const v = await res.json().catch(() => null);
  if (!res.ok) throw Error(v?.message || '서버 오류(' + res.status + ')');
  return v;
}

// ───────── 동기화 ─────────
async function snapshotText() {return JSON.stringify(app.getSnapshot(), (k, v) => k === 'open' ? undefined : v);}

async function push(text, baseVersion) {
  if (text.length > MAX_BYTES) throw Error('스튜디오 내용이 너무 커서 서버에 올리지 못했습니다. JSON 백업을 사용해 주세요.');
  const data = JSON.parse(text);
  if (baseVersion == null) {
    const rows = await rest('POST', '', {data, version: 1, device: device()});
    return rows[0].version;
  }
  const rows = await rest('PATCH', '?version=eq.' + baseVersion, {data, version: baseVersion + 1, device: device()});
  if (!rows.length) return null; // 그 사이 다른 기기가 먼저 올림
  return rows[0].version;
}

async function runSync() {
  if (!config() || !read(SESSION)) {setState(config() ? '동기화 꺼짐 · 로그인 전' : '동기화 꺼짐 · 이 기기에만 저장', 'off'); return;}
  if (app.isBlocked()) {setState('동기화 멈춤 · 기기 저장 상태를 먼저 확인해 주세요', 'warn'); return;}
  if (pendingRemote) return; // 충돌 선택 대기 중
  setState('동기화 중…', 'busy');
  const text = await snapshotText(), localHash = await hash(text), meta = read(META);
  const rows = await rest('GET', '?select=version,data,device,updated_at');
  const remote = rows[0] || null;
  const localChanged = !meta || meta.hash !== localHash;
  const remoteChanged = remote && (!meta || meta.version !== remote.version);
  if (!remote) {
    const v = await push(text, null);
    write(META, {version: v, hash: localHash});
    return setState('동기화됨 · 서버에 처음 올렸습니다', 'ok');
  }
  if (!localChanged && !remoteChanged) return setState('동기화됨', 'ok');
  if (localChanged && !remoteChanged) {
    const v = await push(text, remote.version);
    if (v == null) return runSync();
    write(META, {version: v, hash: localHash});
    return setState('동기화됨 · 이 기기 내용을 올렸습니다', 'ok');
  }
  if (!localChanged && remoteChanged) {
    await take(remote);
    return setState('동기화됨 · 다른 기기(' + (remote.device || '?') + ') 내용을 받았습니다', 'ok');
  }
  // 양쪽 다 바뀜: 자동으로 덮어쓰지 않고 고르게 합니다.
  pendingRemote = remote;
  setState('동기화 확인 필요 · 두 기기 내용이 다릅니다', 'warn');
  openConflict(remote, !meta);
}

async function take(remote) {
  if (!app.applySnapshot(remote.data)) throw Error('기기 저장에 실패해 다른 기기 내용을 적용하지 않았습니다.');
  write(META, {version: remote.version, hash: await hash(await snapshotText())});
}

export async function syncNow() {
  clearTimeout(timer);
  if (running) {again = true; return;}
  running = true;
  try {await runSync();}
  catch (e) {
    if (e.loggedOut) setState('동기화 꺼짐 · ' + e.message, 'off');
    else setState('서버 연결 안 됨 · 이 기기에만 저장', 'warn');
    if (!navigator.onLine) setState('오프라인 · 이 기기에만 저장', 'warn');
  } finally {
    running = false;
    if (again) {again = false; scheduleSync(500);}
  }
}

// 저장할 때마다 부르면 잠시 모았다가 한 번에 올립니다.
export function scheduleSync(delay = 4000) {
  if (!config() || !read(SESSION)) return;
  clearTimeout(timer);
  timer = setTimeout(syncNow, delay);
}

// ───────── 화면 ─────────
function fmt(t) {try {return new Date(t).toLocaleString('ko-KR');} catch {return t;}}

function openConflict(remote, first) {
  $('conflict-text').textContent = first
    ? '이 기기에서 처음 동기화합니다. 서버에는 ' + (remote.device || '다른 기기') + '에서 ' + fmt(remote.updated_at) + '에 올린 내용이 있습니다. 어느 쪽을 남길지 골라 주세요.'
    : '마지막 동기화 이후 이 기기와 다른 기기(' + (remote.device || '?') + ', ' + fmt(remote.updated_at) + ') 양쪽에서 내용이 바뀌었습니다. 어느 쪽을 남길지 골라 주세요.';
  $('sync-conflict').showModal();
}

async function resolve(choice) {
  const remote = pendingRemote;
  $('sync-conflict').close();
  if (!remote || choice === 'later') {pendingRemote = null; setState('동기화 보류 · 다음에 다시 묻습니다', 'warn'); return;}
  pendingRemote = null;
  try {
    if (choice === 'take') {
      await take(remote);
      setState('동기화됨 · 다른 기기 내용으로 바꿨습니다(이 기기 내용은 직전 사본으로 남음)', 'ok');
    } else {
      const text = await snapshotText();
      const v = await push(text, remote.version);
      if (v == null) return syncNow();
      write(META, {version: v, hash: await hash(text)});
      setState('동기화됨 · 이 기기 내용을 올렸습니다(서버에 직전본 보관)', 'ok');
    }
  } catch (e) {setState('동기화 실패 · ' + e.message, 'warn');}
}

function renderDialog() {
  const c = config(), s = read(SESSION);
  $('sync-config-box').hidden = !!c?.fixed;
  $('sync-url').value = c && !c.fixed ? c.url : '';
  $('sync-key').value = c && !c.fixed ? c.key : '';
  $('sync-login-box').hidden = !!s;
  $('sync-account-box').hidden = !s;
  $('sync-email-shown').textContent = s?.email || '';
}

async function login() {
  const url = $('sync-url').value.trim().replace(/\/+$/, ''), key = $('sync-key').value.trim();
  if (!config()?.fixed) {
    if (!/^https:\/\/[^/]+$/i.test(url) || !key) {app.say('Project URL(https://…)과 공개 키를 입력해 주세요.'); return;}
    if (badKey(key)) {app.say('secret·service_role 키는 쓸 수 없습니다. Publishable(또는 anon) 키를 넣어 주세요.'); return;}
    write(CONF, {url, key});
  }
  const email = $('sync-email').value.trim(), password = $('sync-password').value;
  if (!email || !password) {app.say('이메일과 비밀번호를 입력해 주세요.'); return;}
  try {
    keep(await authCall('token?grant_type=password', {email, password}));
    $('sync-password').value = '';
    renderDialog();
    $('sync-dialog').close();
    app.say('로그인했습니다. 동기화를 시작합니다.');
    await syncNow();
  } catch (e) {app.say(e.status === 400 ? '이메일 또는 비밀번호가 맞지 않습니다.' : '서버에 연결하지 못했습니다. 주소·키와 인터넷 연결, Supabase 프로젝트 일시 정지 여부를 확인해 주세요.');}
}

async function logout() {
  const s = read(SESSION);
  write(SESSION, null);
  write(META, null);
  try {if (s?.access) await fetch(config().url + '/auth/v1/logout', {method: 'POST', headers: {apikey: config().key, Authorization: 'Bearer ' + s.access}});} catch {}
  renderDialog();
  setState('동기화 꺼짐 · 로그아웃함', 'off');
}

export function initSync(hooks) {
  app = hooks;
  $('sync-state').onclick = () => {renderDialog(); $('sync-dialog').showModal();};
  $('sync-close').onclick = () => $('sync-dialog').close();
  $('sync-login').onclick = login;
  $('sync-logout').onclick = logout;
  $('sync-now').onclick = () => syncNow();
  $('sync-forget').onclick = () => {write(CONF, null); renderDialog(); setState('동기화 꺼짐 · 이 기기에만 저장', 'off');};
  $('conflict-take').onclick = () => resolve('take');
  $('conflict-push').onclick = () => resolve('push');
  $('conflict-later').onclick = () => resolve('later');
  document.addEventListener('visibilitychange', () => {if (!document.hidden) scheduleSync(800);});
  window.addEventListener('online', () => scheduleSync(800));
  syncNow();
}
