// Extras: the card draw (가챠) with its card book, the ask window, and three easter eggs.
// Nothing on the rest of the site depends on this file; if it fails, the pages still work.
(async function(){
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const UFO='<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><g transform="rotate(-14 12 12)"><path d="M6.5 9a5.5 5.5 0 0 1 11 0c-1.7-.5-3.6-.7-5.5-.7s-3.8.2-5.5.7z"/><path fill-rule="evenodd" d="M12 9.6c6.1 0 11 2 11 4.4s-4.9 4.4-11 4.4S1 16.4 1 14s4.9-4.4 11-4.4zM4.5 14a1 1 0 1 0 2 0a1 1 0 1 0-2 0zM11 16a1 1 0 1 0 2 0a1 1 0 1 0-2 0zM17.5 14a1 1 0 1 0 2 0a1 1 0 1 0-2 0z"/></g></svg>';

// ---- Settings you may want to change -------------------------------------------------------
const DAILY=5;                       // free draws per day (resets at midnight on the visitor's clock)
const EGG_BONUS=2;                   // extra draws for each easter egg found for the first time
const ODDS={1:60,2:35,3:5};          // ★ cover image, ★★ gallery image, ★★★ 뽑기 한정 image (percent)
const IDLE_MS=120000;                // screensaver after this long without any input
const ALIEN_LINES=['민초는 치약 맛이 아니다. 치약이 민초 맛인 것이다.','지구인 관찰 일지: 또 누른다.','초코칩은 추가가 기본값이다.','이 행성의 민초 보급률은 아직 낮다.','누른다고 아이스크림이 나오진 않는다. 카드는 나올지도.','교신 상태 양호. 민트 농도 양호.'];
// --------------------------------------------------------------------------------------------

// Draw tickets and found easter eggs, kept in this browser only.
const load=()=>{let s={};try{s=JSON.parse(localStorage.getItem('mint-gacha-v1'))||{};}catch{}const d=new Date(),day=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();if(s.day!==day){s.day=day;s.used=0;}s.used=s.used|0;s.bonus=s.bonus|0;s.eggs=Array.isArray(s.eggs)?s.eggs:[];return s;};
const save=s=>{try{localStorage.setItem('mint-gacha-v1',JSON.stringify(s));}catch{}};
const left=s=>Math.max(0,DAILY-s.used)+s.bonus;

function toast(text){let t=$('fun-toast');if(!t){t=document.createElement('div');t.id='fun-toast';t.className='fun-toast';t.setAttribute('role','status');document.body.appendChild(t);}
 // A modal dialog covers the page, so the toast moves inside whichever one is open.
 (document.querySelector('dialog[open]')||document.body).appendChild(t);t.textContent=text;t.classList.add('on');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('on'),4500);}
const EGGS=['mintscreen','alien','saver'];
function foundEgg(name){const s=load();if(s.eggs.includes(name))return;s.eggs.push(name);s.bonus+=EGG_BONUS;save(s);toast(`이스터에그 발견! (${s.eggs.length}/${EGGS.length}) 뽑기권 +${EGG_BONUS}`);renderLeft();}

// ---- Card draw ----------------------------------------------------------------------------
let CARDS=[];
const STARS=t=>'★'.repeat(t);
const safeURL=v=>{if(typeof v!=='string'||!v.trim())return '';try{const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?v:'';}catch{return '';}};
try{
 const r=await fetch('data/works.json',{cache:'no-cache'});
 const works=Object.values(r.ok?await r.json()||{}:{}).filter(w=>w&&/^[a-z0-9-]+$/.test(w.id)&&w.name).sort((a,b)=>String(a.number||'').localeCompare(String(b.number||''),undefined,{numeric:true}));
 const urls=v=>(Array.isArray(v)?v:[]).map(safeURL).filter(Boolean);
 for(const w of works){const work={id:w.id,name:String(w.name),number:String(w.number||'')};
  [[urls([w.image]),1],[urls(w.gallery),2],[urls(w.secretGallery),3]].forEach(([list,tier])=>list.forEach(src=>CARDS.push({work,src,tier})));}
}catch(error){console.error(error);}
const owned=c=>MintDex.read()[MintDex.key(c.work.id,c.src)]||0;

document.body.insertAdjacentHTML('beforeend',`
<dialog class="fun-win gacha" id="gacha" aria-labelledby="gacha-title"><div class="dialogbar"><strong id="gacha-title">card_draw.exe — 카드 뽑기</strong><div class="lightbox-buttons"><button type="button" data-close aria-label="닫기">✕</button></div></div>
<div class="tabs" role="tablist" aria-label="카드 뽑기"><button type="button" class="tab" role="tab" id="gtab-draw" aria-controls="gacha-draw" aria-selected="true">뽑기</button><button type="button" class="tab" role="tab" id="gtab-book" aria-controls="gacha-book" aria-selected="false">카드첩 <span id="gacha-count"></span></button></div>
<div class="gacha-panel" id="gacha-draw" role="tabpanel" aria-labelledby="gtab-draw"><div class="gcard-stage" id="gacha-stage"></div><p class="gacha-msg" id="gacha-msg" role="status"></p><div class="gacha-actions" id="gacha-result" hidden><a class="btn btn-s" id="gacha-go" href="#collection">작품 보기</a><button type="button" class="btn btn-s" id="gacha-zoom-open">크게 보기</button></div><div class="gacha-actions"><button type="button" class="btn btn-p" id="gacha-pull">카드 뽑기</button><span class="gacha-left" id="gacha-left"></span></div><p class="gacha-odds" id="gacha-odds"></p></div>
<div class="gacha-panel" id="gacha-book" role="tabpanel" aria-labelledby="gtab-book" hidden></div></dialog>
<dialog class="fun-win gzoom" id="gzoom" aria-labelledby="gzoom-title"><div class="dialogbar"><strong id="gzoom-title"></strong><div class="lightbox-buttons"><button type="button" data-close aria-label="닫기">✕</button></div></div><div class="lightbox-body"><img id="gzoom-img" alt=""></div><div class="lightbox-foot"><span id="gzoom-tier"></span><a id="gzoom-go" href="#collection">작품 보기</a></div></dialog>
<dialog class="fun-win ask" id="ask-win" aria-labelledby="ask-title"><div class="dialogbar"><strong id="ask-title">ask.exe — 지구에서 보내는 말</strong><div class="lightbox-buttons"><a class="ask-out" id="ask-out" href="https://asked.kr/m1nch0wh4ck" target="_blank" rel="noopener noreferrer">새 창</a><button type="button" data-close aria-label="닫기">✕</button></div></div><div class="ask-body"><p class="ask-wait">애스크를 불러오는 중입니다. 창이 계속 비어 있으면 위의 '새 창'을 눌러 주세요.</p><iframe id="ask-frame" title="민초파왹 애스크" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerpolicy="no-referrer"></iframe></div></dialog>`);
document.querySelectorAll('.fun-win').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-close]'))d.close();});});
window.addEventListener('hashchange',()=>document.querySelectorAll('.fun-win[open]').forEach(d=>d.close()));

const cardHTML=(c,cls='')=>`<div class="gcard t${c.tier} ${cls}"><div class="gcard-in"><div class="gcard-back"><span>${UFO}</span><b>?</b></div><div class="gcard-front"><img src="${esc(c.src)}" alt="${esc(c.work.name)}"><span class="gcard-tier">${STARS(c.tier)}</span><span class="gcard-plate"><small>No.${esc(c.work.number)}</small><b>${esc(c.work.name)}</b></span></div></div></div>`;
function renderLeft(){if(!$('gacha-left'))return;const n=left(load());$('gacha-left').textContent=`남은 뽑기 ${n}회`;$('gacha-pull').disabled=busy||n<1||!CARDS.length;$('gacha-count').textContent=`${CARDS.filter(owned).length}/${CARDS.length}`;}
let busy=false,last=null;
function pick(){const tiers=[1,2,3].filter(t=>CARDS.some(c=>c.tier===t));let roll=Math.random()*tiers.reduce((n,t)=>n+ODDS[t],0);const tier=tiers.find(t=>(roll-=ODDS[t])<0)||tiers[0];const pool=CARDS.filter(c=>c.tier===tier);return pool[Math.floor(Math.random()*pool.length)];}
const wait=ms=>new Promise(r=>setTimeout(r,calm?0:ms));
async function pull(){
 const s=load();if(busy||left(s)<1||!CARDS.length)return;
 busy=true;if(s.used<DAILY)s.used++;else s.bonus--;save(s);
 const c=pick();last=c;const count=MintDex.add(c.work.id,c.src);
 $('gacha-result').hidden=true;$('gacha-msg').textContent='교신 중…';renderLeft();
 $('gacha-stage').innerHTML=cardHTML(c,'shake');const el=$('gacha-stage').firstElementChild;
 // The picture is loaded before the card turns over, so the reveal never shows an empty frame.
 const img=el.querySelector('img');await Promise.all([wait(700),img.decode?img.decode().catch(()=>{}):null]);
 el.classList.remove('shake');el.classList.add('flipped');await wait(450);
 $('gacha-msg').innerHTML=`<b>${STARS(c.tier)}</b> ${esc(c.work.name)} — ${count===1?'새 카드!':`이미 가진 카드 (${count}장째)`}`;
 $('gacha-go').href='#work/'+c.work.id;$('gacha-result').hidden=false;
 busy=false;renderLeft();window.dispatchEvent(new Event('mint:dex'));
 if(left(load())<1)$('gacha-msg').insertAdjacentHTML('beforeend','<br><small>오늘 뽑기를 다 썼습니다. 내일 다시 충전됩니다.</small>');
}
function zoom(c){$('gzoom-img').src=c.src;$('gzoom-img').alt=c.work.name;$('gzoom-title').textContent=`${c.work.name} — No.${c.work.number}`;$('gzoom-tier').textContent=STARS(c.tier);$('gzoom-go').href='#work/'+c.work.id;$('gzoom').showModal();}
function renderBook(){
 const works=[...new Set(CARDS.map(c=>c.work))];
 $('gacha-book').innerHTML=`<p class="gacha-progress">모은 카드 <b>${CARDS.filter(owned).length}</b> / ${CARDS.length}</p>`+works.map(w=>{const cards=CARDS.filter(c=>c.work===w);return `<section class="gbook-work"><h3><small>No.${esc(w.number)}</small> ${esc(w.name)} <span>${cards.filter(owned).length}/${cards.length}</span></h3><div class="gbook-grid">${cards.map(c=>{const n=owned(c);const i=CARDS.indexOf(c);return n?`<button type="button" class="gbook-card" data-card="${i}" aria-label="${esc(w.name)} ${STARS(c.tier)} 카드 크게 보기">${cardHTML(c,'flipped mini')}${n>1?`<span class="gbook-n">×${n}</span>`:''}</button>`:`<div class="gbook-card none" aria-label="아직 없는 ${STARS(c.tier)} 카드">${`<div class="gcard t${c.tier} mini"><div class="gcard-in"><div class="gcard-back"><span>${UFO}</span><b>?</b></div></div></div>`}<span class="gbook-n">${STARS(c.tier)}</span></div>`;}).join('')}</div></section>`;}).join('');
}
function tab(name){for(const n of ['draw','book']){$('gtab-'+n).setAttribute('aria-selected',String(n===name));$('gacha-'+n).hidden=n!==name;}if(name==='book')renderBook();}
function openGacha(){if(!CARDS.length)return;const tiers=[1,2,3].filter(t=>CARDS.some(c=>c.tier===t));const sum=tiers.reduce((n,t)=>n+ODDS[t],0);
 $('gacha-odds').textContent='확률  '+tiers.map(t=>`${STARS(t)} ${Math.round(ODDS[t]/sum*100)}%`).join(' · ')+`  ·  하루 ${DAILY}회`;
 if(!$('gacha-stage').firstElementChild){$('gacha-stage').innerHTML=`<div class="gcard t1"><div class="gcard-in"><div class="gcard-back"><span>${UFO}</span><b>?</b></div></div></div>`;$('gacha-msg').textContent='카드를 뽑아 캐릭터를 수집해 보세요.';}
 tab('draw');renderLeft();if(!$('gacha').open)$('gacha').showModal();}
$('gacha-pull').addEventListener('click',pull);
$('gtab-draw').addEventListener('click',()=>tab('draw'));$('gtab-book').addEventListener('click',()=>tab('book'));
$('gacha-zoom-open').addEventListener('click',()=>last&&zoom(last));
$('gacha-book').addEventListener('click',e=>{const b=e.target.closest('[data-card]');if(b)zoom(CARDS[Number(b.dataset.card)]);});
window.addEventListener('mint:gacha',openGacha);
if(CARDS.length)document.querySelectorAll('[data-open-gacha]').forEach(b=>{b.hidden=false;b.addEventListener('click',openGacha);});

// ---- Ask window: the ask page inside a window on this site ----------------------------------
// Plain clicks open the window; ctrl/shift/middle clicks still open a new tab as before.
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="https://asked.kr/"]');if(!a||a.id==='ask-out'||e.defaultPrevented||e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
 e.preventDefault();const f=$('ask-frame');if(f.getAttribute('src')!==a.href)f.src=a.href;$('ask-out').href=a.href;$('ask-win').showModal();});

// ---- Easter egg 1: the title bar × shows a mint screen instead of closing ---------------------
const closeBox=document.querySelector('.titlebar .window-controls span:last-child');
if(closeBox){closeBox.classList.add('egg-close');closeBox.addEventListener('click',()=>{
 const el=document.createElement('div');el.className='mintscreen';el.setAttribute('role','alertdialog');el.setAttribute('aria-label','민트스크린');el.tabIndex=-1;
 el.innerHTML=`<div><p class="mintscreen-face">👽</p><h2>MINT_CHOCO_OVERFLOW</h2><p>민트초코 농도가 허용치를 초과했습니다.<br>이 창은 닫히지 않습니다. 지구인의 기기는 안전합니다.</p><p class="mintscreen-code">STOP: 0xM1NT_CH0C0 (extra mint, extra chips)</p><p class="mintscreen-tip">아무 곳이나 누르면 돌아갑니다 _</p></div>`;
 document.body.appendChild(el);el.focus();
 const end=()=>{el.remove();document.removeEventListener('keydown',end);foundEgg('mintscreen');};
 // Armed a moment later so the tap that opened it does not close it again.
 setTimeout(()=>{el.addEventListener('click',end);document.addEventListener('keydown',end);},250);
});}

// ---- Easter egg 2: poke the alien five times ---------------------------------------------------
const hero=document.querySelector('.hero-visual');
if(hero){let pokes=0,line=-1,timer;hero.addEventListener('click',()=>{if(++pokes<5)return;
 let b=hero.querySelector('.alien-says');if(!b){b=document.createElement('p');b.className='alien-says';b.setAttribute('role','status');hero.appendChild(b);}
 line=(line+1+Math.floor(Math.random()*(ALIEN_LINES.length-1)))%ALIEN_LINES.length;b.textContent=ALIEN_LINES[line];b.classList.add('on');
 clearTimeout(timer);timer=setTimeout(()=>b.classList.remove('on'),4000);foundEgg('alien');});}

// ---- Easter egg 3: screensaver, a mint choco cone bouncing around --------------------------------
if(!calm){let idle,saver=null;
 const CONE='<svg viewBox="0 0 64 96" width="64" height="96" aria-hidden="true"><path d="M14 44h36L32 94z" fill="#c98a4b" stroke="#141615" stroke-width="3"/><path d="M20 56l18 20M44 54L28 80" stroke="#141615" stroke-width="2"/><circle cx="32" cy="28" r="24" fill="currentColor" stroke="#141615" stroke-width="3"/><path d="M20 22l5 3M38 14l4 5M42 32l-5 3M24 38l4-4M30 24l3 3" stroke="#141615" stroke-width="4"/></svg>';
 const COLORS=['#00efb2','#ff3688','#83e30e','#6fd3ff','#f1f2ed'];
 const stop=()=>{if(!saver)return;cancelAnimationFrame(saver.raf);saver.el.remove();saver=null;foundEgg('saver');};
 const start=()=>{if(saver||document.hidden||document.querySelector('dialog[open],.mintscreen'))return arm();
  const el=document.createElement('div');el.className='saver';el.innerHTML=`<i>${CONE}</i><p>아무 키나 누르면 돌아갑니다</p>`;document.body.appendChild(el);
  const cone=el.firstElementChild;let x=Math.random()*(innerWidth-64),y=Math.random()*(innerHeight-96),dx=2.2,dy=1.8,color=0;
  saver={el,raf:0};const step=()=>{x+=dx;y+=dy;let hit=false;if(x<0||x>innerWidth-64){dx=-dx;x=Math.max(0,Math.min(x,innerWidth-64));hit=true;}if(y<0||y>innerHeight-96){dy=-dy;y=Math.max(0,Math.min(y,innerHeight-96));hit=true;}
   if(hit){color=(color+1)%COLORS.length;cone.style.color=COLORS[color];}cone.style.transform=`translate(${x}px,${y}px)`;if(saver)saver.raf=requestAnimationFrame(step);};
  cone.style.color=COLORS[0];step();};
 const arm=()=>{clearTimeout(idle);idle=setTimeout(start,IDLE_MS);};
 ['pointerdown','pointermove','keydown','wheel','touchstart','scroll'].forEach(type=>addEventListener(type,()=>{if(saver)stop();arm();},{capture:true,passive:true}));
 arm();
}
})();
