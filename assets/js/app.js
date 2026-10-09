// COMING NEXT / LOG / INFO are edited in Pages CMS (_data/upcoming, _data/logs, _data/info.json) and exported by data/site.json.
// Loaded separately so a problem here never hides the work collection.
(async function(){
 const $=id=>document.getElementById(id);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const str=v=>typeof v==='string'?v.trim():'';
 const items=v=>(Array.isArray(v)?v:Object.values(v&&typeof v==='object'?v:{})).filter(x=>x&&typeof x==='object'&&str(x.title)&&x.visible!==false);
 // Internal screens or https:// only. Anything else (javascript:, data:, ...) becomes plain text.
 const safeLink=v=>{v=str(v);if(/^#(home|collection|notes|about|contact|work\/[a-z0-9-]+)$/.test(v))return v;try{return new URL(v).protocol==='https:'?v:'';}catch{return '';}};
 const linkAttrs=href=>href.startsWith('#')?`href="${esc(href)}"`:`href="${esc(href)}" target="_blank" rel="noopener noreferrer"`;
 const lines=t=>esc(t).replace(/\n/g,'<br>');
 const paragraphs=t=>str(t).replace(/\r\n?/g,'\n').split(/\n[ \t]*\n+/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${lines(s)}</p>`).join('');
 const DATE=/^(\d{4})-(\d{2})-(\d{2})$/;
 const byId=(a,b)=>str(a.id).localeCompare(str(b.id));
 function renderUpcoming(data){
  const num=v=>v===''||v==null||!isFinite(v)?Infinity:Number(v);
  const list=items(data).sort((a,b)=>num(a.order)-num(b.order)||str(a.title).localeCompare(str(b.title),'ko')||byId(a,b));
  const box=$('home-news');
  box.innerHTML=list.length?'<h2>COMING NEXT</h2>'+list.map(x=>{const href=safeLink(x.link);const title=href?`<a ${linkAttrs(href)}>${esc(str(x.title))}</a>`:`<span class="news-title">${esc(str(x.title))}</span>`;return `<div class="news-item">${str(x.status)?`<span class="news-status">${esc(str(x.status))}</span>`:''}${title}${str(x.summary)?`<small>${lines(str(x.summary))}</small>`:''}</div>`;}).join(''):'';
  box.hidden=!list.length;
 }
 function renderLogs(data){
  // Newest date first; records without a date keep a fixed order after dated ones.
  const list=items(data).map(x=>({...x,date:DATE.test(str(x.date))?str(x.date):''})).sort((a,b)=>(a.date&&b.date?b.date.localeCompare(a.date):!a.date-!b.date)||byId(a,b));
  $('log-list').innerHTML=list.map(x=>{const tag=str(x.tag)||str(x.category);const d=x.date.match(DATE);return `<article class="note">${tag?`<span class="note-tag">${esc(tag)}</span>`:''}${d?`<time class="note-date" datetime="${x.date}">${d[1]}.${d[2]}.${d[3]}</time>`:''}<h3>${esc(str(x.title))}</h3>${paragraphs(x.body)}</article>`;}).join('');
  $('log-empty').hidden=list.length!==0;
 }
 // The CMS rich-text field stores HTML. Rebuild it from scratch keeping only basic text formatting.
 function cleanRichText(html){
  const KEEP=new Set(['P','BR','STRONG','B','EM','I','U','S','A','UL','OL','LI']);
  const DROP=new Set(['SCRIPT','STYLE','TEMPLATE','IFRAME','OBJECT','EMBED','NOSCRIPT','SVG','MATH','IMG','VIDEO','AUDIO','SOURCE','FORM','INPUT','TEXTAREA','SELECT','BUTTON','LINK','META','TITLE']);
  const copy=(from,to)=>{for(const n of from.childNodes){
   if(n.nodeType===3){to.appendChild(document.createTextNode(n.nodeValue));continue;}
   if(n.nodeType!==1||DROP.has(n.tagName))continue;
   if(!KEEP.has(n.tagName)){copy(n,to);continue;}
   const el=document.createElement(n.tagName);
   if(n.tagName==='A'){const href=safeLink(n.getAttribute('href'));if(!href){copy(n,to);continue;}el.setAttribute('href',href);if(!href.startsWith('#')){el.target='_blank';el.rel='noopener noreferrer';}}
   copy(n,el);to.appendChild(el);
  }};
  const parsed=new DOMParser().parseFromString(String(html||''),'text/html');
  const out=document.createDocumentFragment();let loose=null;
  for(const n of parsed.body.childNodes){
   // Loose text or inline marks outside a paragraph get their own <p> so they keep the read_me styling.
   if(n.nodeType===1&&['P','UL','OL'].includes(n.tagName)){loose=null;copy({childNodes:[n]},out);continue;}
   if(n.nodeType===1&&['DIV','H1','H2','H3','H4','H5','H6','BLOCKQUOTE'].includes(n.tagName)){loose=null;const p=document.createElement('p');copy(n,p);out.appendChild(p);continue;}
   if(!loose){loose=document.createElement('p');out.appendChild(loose);}
   copy({childNodes:[n]},loose);
  }
  [...out.childNodes].forEach(el=>{if(!el.textContent.trim())el.remove();});
  return out;
 }
 function renderInfo(info){
  info=info&&typeof info==='object'?info:{};
  $('about-title').textContent=str(info.heading)||'Info';
  const intro=str(info.intro).replace(/\r\n?/g,'\n');$('info-intro').innerHTML=lines(intro);$('info-intro').hidden=!intro;
  const note=str(info.introNote);$('info-note').textContent=note;$('info-note').hidden=!note;
  $('info-readme').replaceChildren(cleanRichText(info.readme));
 }
 try{
  const response=await fetch('data/site.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('홈페이지 정보를 불러오지 못했습니다.');
  const data=await response.json()||{};
  for(const [name,fn] of [['upcoming',renderUpcoming],['logs',renderLogs],['info',renderInfo]]){try{fn(data[name]);}catch(error){console.error(name,error);}}
 }catch(error){
  console.error(error);
  $('log-empty').textContent='기록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';$('log-empty').hidden=false;
  const p=document.createElement('p');p.textContent='정보를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';$('info-readme').replaceChildren(p);
 }
})();
(async function(){
try {
 const response=await fetch('data/works.json',{cache:'no-cache'});
 if(!response.ok)throw new Error('작품 목록을 불러오지 못했습니다.');
 const records=await response.json();
 const list=v=>Array.isArray(v)?v:[];
 const safeURL=v=>{if(typeof v!=='string'||!v.trim())return '';try{const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?v:'';}catch{return '';}};
 const WORKS=Object.values(records||{}).filter(w=>w&&/^[a-z0-9-]+$/.test(w.id)&&w.name).map(w=>({
  ...w, name:String(w.name),number:String(w.number||''),description:String(w.description||''),
  image:safeURL(w.image),genres:list(w.genres),romance:list(w.romance),keywords:list(w.keywords),
  gallery:list(w.gallery).map(safeURL).filter(Boolean),
  platforms:list(w.platforms).map(p=>({...p,url:safeURL(p.url),safety:list(p.safety)}))
 })).sort((a,b)=>a.number.localeCompare(b.number,undefined,{numeric:true}));
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const viewport=$('screen-viewport');let currentRoute=null;const scrollPositions=new Map();let lastCard=null;
function matchesWork(w){
 const q=$('search').value.trim().toLowerCase();
 if(![w.name,w.tagline||'',w.description,...w.keywords,...w.genres].join(' ').toLowerCase().includes(q))return false;
 if($('genre').value!=='all'&&!w.genres.includes($('genre').value))return false;
 if($('cast').value!=='all'&&w.type!==$('cast').value)return false;
 if($('romance').value!=='all'&&!w.romance.includes($('romance').value))return false;
 // Platform details may be left blank while a work is being prepared.
 if(['platform','status','safety'].every(id=>$(id).value==='all'))return true;
 return w.platforms.some(p=>($('platform').value==='all'||p.name===$('platform').value)&&($('status').value==='all'||p.status===$('status').value)&&($('safety').value==='all'||p.safety.includes($('safety').value)));
}
function tags(w){return [...w.genres,w.type,...w.romance,...w.keywords].filter(Boolean).map(t=>`<span class="work-tag">${esc(t)}</span>`).join('');}
function renderCards(){const found=WORKS.filter(matchesWork);$('cards').innerHTML=found.map(w=>`<article class="sleeve"><button type="button" class="card-button" data-id="${esc(w.id)}" aria-label="${esc(w.name)} 작품 소개 열기"><div class="card-art${w.image?'':' no-art'}"><span class="card-star" aria-hidden="true">✦</span><span class="card-star other" aria-hidden="true">✷</span>${w.image?`<img src="${esc(w.image)}" alt="" loading="lazy">`:`<div class="typo-cover ${w.coverLines?'long-cover':''}">${(w.coverLines||[w.name[0],w.name.slice(1)]).map(esc).join('<br>')}<small>CHARACTER / ${esc(w.number)}</small></div>`}</div><div class="nameplate"><h3>${esc(w.name)}</h3><p>No.${esc(w.number)} / m1nch0wh4ck</p></div></button><div class="card-meta">${w.platforms.map(p=>`<span>${esc(p.label||p.name)}${p.status==='공개 중'?'':' · '+esc(p.status)}</span>`).join('')}</div><p class="card-summary">${esc(w.tagline||w.description)}</p><div class="work-tags">${w.keywords.slice(0,3).map(k=>`<span class="work-tag">${esc(k)}</span>`).join('')}</div></article>`).join('');$('empty').hidden=found.length!==0;$('result-count').textContent=`${found.length} / ${WORKS.length} WORKS`;}
function block(title,text){return text?`<section class="detail-block"><h3>${title}</h3><p>${esc(text)}</p></section>`:'';}
function showWork(w){document.title=`${w.name} · 민초파왹`;$('detail-content').innerHTML=`<div class="detail-header has-art"><div class="detail-cover">${w.image?`<img src="${esc(w.image)}" alt="${esc(w.name)}">`:esc(w.name)}</div><div><span class="mono">COLLECTION / No.${esc(w.number)}</span><h2 id="detail-title">${esc(w.name)}</h2>${w.platforms.map(p=>`<span class="badge">${esc(p.label||p.name)} · ${esc(p.status)}</span>`).join(' ')}<div class="work-tags">${tags(w)}</div></div></div>${w.tagline?`<p class="detail-tagline">${esc(w.tagline)}</p>`:''}${block('작품 소개',w.description||'상세 소개를 준비하고 있습니다.')}${block('유저 역할',w.role)}${block('시작 상황',w.start)}${block('플레이 안내',w.notes)}${w.gallery.length?`<section class="detail-block"><h3>이미지 갤러리</h3><div class="gallery">${w.gallery.map((src,i)=>`<img src="${esc(src)}" alt="${esc(w.name)} 이미지 ${i+1}" loading="lazy">`).join('')}</div></section>`:''}<section class="detail-block"><h3>플레이 플랫폼</h3><ul class="platform-list">${w.platforms.map(p=>`<li><strong>${esc(p.name)}</strong> · ${esc(p.status)}${p.safety.length?' · '+p.safety.map(esc).join(' / '):''}${p.releaseNote?`<br><small>${esc(p.releaseNote)}</small>`:''}</li>`).join('')}</ul>${w.platforms.some(p=>p.url)?'':'<p>작품 바로가기 링크를 준비하고 있습니다.</p>'}<div class="detail-actions">${w.platforms.filter(p=>p.url).map(p=>`<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.label||p.name)}에서 플레이</a>`).join('')}<button type="button" id="copy-link">소개 주소 복사</button></div><p id="share-state" class="share-state" role="status"></p></section>`;$('copy-link').addEventListener('click',copyLink);}
function readRoute(){
 const hash=location.hash||'#home';
 const work=hash.match(/^#work\/([a-z0-9-]+)$/);
 if(work){const item=WORKS.find(w=>w.id===work[1]);return item?{key:hash,screen:'work',nav:'collection',label:'COLLECTION / '+item.name,item}:{key:hash,screen:'missing',nav:'collection',label:'NOT FOUND'};}
 const alias={'#home':'home','#collection':'collection','#notes':'notes','#about':'about','#contact':'about'};
 const screen=alias[hash];return screen?{key:'#'+screen,screen,nav:screen,label:({home:'HOME',collection:'COLLECTION',notes:'LOG',about:'INFO'})[screen]}:{key:hash,screen:'missing',nav:'',label:'NOT FOUND'};
}
function syncRoute(){
 const r=readRoute();if(currentRoute===r.key)return;
 if(currentRoute!==null)scrollPositions.set(currentRoute,viewport.scrollTop);
 if(r.item)showWork(r.item);else document.title=({home:'민초파왹',collection:'작품 수집첩',notes:'제작 노트',about:'Info',missing:'페이지 없음'})[r.screen]+' · m1nch0wh4ck';
 document.querySelectorAll('.route-screen').forEach(el=>{el.hidden=el.id!=='screen-'+r.screen;});
 document.querySelectorAll('[data-nav]').forEach(el=>{if(el.dataset.nav===r.nav)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 $('route-address').textContent=r.label;
 const initial=currentRoute===null;currentRoute=r.key;
 if(!initial){const focus=r.screen==='collection'&&lastCard?.isConnected?lastCard:($('screen-'+r.screen).querySelector('h1,h2')||viewport);if(focus!==lastCard)focus.setAttribute('tabindex','-1');focus.focus({preventScroll:true});}
 viewport.scrollTop=scrollPositions.get(r.key)||0;
}
async function copyLink(){const state=$('share-state');if(location.protocol==='file:'){state.textContent='웹에 게시한 뒤 작품별 소개 주소를 복사할 수 있습니다.';return;}const text=location.href;try{await navigator.clipboard.writeText(text);state.textContent='소개 주소를 복사했습니다.';}catch{state.textContent='주소를 선택해 복사해 주세요: '+text;state.style.userSelect='all';}}
$('cards').addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(!b)return;lastCard=b;location.hash='work/'+b.dataset.id;});
$('search').addEventListener('input',renderCards);['platform','genre','cast','romance','safety','status'].forEach(id=>$(id).addEventListener('change',renderCards));$('reset-filters').addEventListener('click',()=>{$('search').value='';['platform','genre','cast','romance','safety','status'].forEach(id=>$(id).value='all');renderCards();});
if('scrollRestoration' in history)history.scrollRestoration='manual';
window.addEventListener('hashchange',syncRoute);renderCards();syncRoute();

} catch(error){
 const panel=document.getElementById('screen-viewport');
 const message=document.createElement('p');message.className='section';message.setAttribute('role','alert');
 message.textContent='작품 정보를 불러오지 못했습니다. 잠시 후 새로고침해 주세요. 처음 게시하셨다면 GitHub Pages 배포 완료 여부를 확인해 주세요.';
 panel.replaceChildren(message);console.error(error);
}
})();
