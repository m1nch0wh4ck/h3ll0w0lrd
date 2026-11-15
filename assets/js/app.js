// Small window buttons (– □ ×) drawn in the title bar of card and memo windows.
const WINDOW_CONTROLS='<svg aria-hidden="true" width="52" height="16" viewBox="0 0 52 16"><path fill="#c6ccc7" d="M0 0h16v16H0zM18 0h16v16H18zM36 0h16v16H36z"/><path fill="none" stroke="#141615" stroke-width="2" d="M4 11h7M22 5h8M22 5v7h8V5M40 4l8 8M48 4l-8 8"/></svg>';
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
 // The CMS keeps 세이프티 / 언세이프티 as stored values; the screen shows the short names.
 const safeName=s=>({'세이프티':'세이프','언세이프티':'언세이프'})[s]||s;
 function renderUpcoming(data,allWorks){
  const num=v=>v===''||v==null||!isFinite(v)?Infinity:Number(v);
  const manual=items(data).sort((a,b)=>num(a.order)-num(b.order)||str(a.title).localeCompare(str(b.title),'ko')||byId(a,b));
  // Platforms marked 제작 중 / 리뉴얼 예정 in the work collection follow the hand-written items automatically.
  const works=Object.values(allWorks&&typeof allWorks==='object'?allWorks:{}).filter(w=>w&&/^[a-z0-9-]+$/.test(w.id)&&str(w.name)).sort((a,b)=>String(a.number||'').localeCompare(String(b.number||''),undefined,{numeric:true}));
  const auto=works.flatMap(w=>(Array.isArray(w.platforms)?w.platforms:[]).filter(p=>p&&['제작 중','리뉴얼 예정'].includes(p.status)).map(p=>({title:[str(w.name),[str(p.name),(Array.isArray(p.safety)?p.safety:[]).map(safeName).join('/')].filter(Boolean).join(' ')].join(' · '),status:p.status,link:'#work/'+w.id})));
  const list=[...manual,...auto];
  const box=$('home-news');
  box.innerHTML=list.length?'<div class="news-head"><h2 id="news-title">공개 예정</h2><a href="#notes">제작 노트 전체 보기</a></div><div class="news-list">'+list.map(x=>{const href=safeLink(x.link);const title=href?`<a ${linkAttrs(href)}>${esc(str(x.title))}</a>`:esc(str(x.title));return `<article class="news-item">${str(x.status)?`<span class="news-status">${esc(str(x.status))}</span>`:''}<h3>${title}</h3>${str(x.summary)?`<p>${lines(str(x.summary))}</p>`:''}</article>`;}).join('')+'</div>':'';
  box.hidden=!list.length;
 }
 function renderLogs(data){
  // Each record is a memo (notepad) window: title bar, a bar with tag and date, white text area.
  // Newest date first; records without a date keep a fixed order after dated ones.
  const list=items(data).map(x=>({...x,date:DATE.test(str(x.date))?str(x.date):''})).sort((a,b)=>(a.date&&b.date?b.date.localeCompare(a.date):!a.date-!b.date)||byId(a,b));
  $('log-list').innerHTML=list.map(x=>{const tag=str(x.tag)||str(x.category);const d=x.date.match(DATE);return `<article class="note"><div class="tbar" aria-hidden="true"><span>${d?`log_${d[1]}${d[2]}${d[3]}`:'memo'}.txt — 메모장</span><span class="wctl">${WINDOW_CONTROLS}</span></div>${tag||d?`<div class="note-menu">${tag?`<span class="note-tag">${esc(tag)}</span>`:''}${d?`<time class="note-date" datetime="${x.date}">${d[1]}.${d[2]}.${d[3]}</time>`:''}</div>`:''}<div class="note-body"><h3>${esc(str(x.title))}</h3>${paragraphs(x.body)}</div></article>`;}).join('');
  $('log-empty').hidden=list.length!==0;
  // Status bar (bottom of the window): date of the newest dated record.
  const latest=list.find(x=>x.date);if(latest){const d=latest.date.match(DATE);$('status-log').textContent=`최근 기록 ${d[1]}.${d[2]}.${d[3]}`;}
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
  for(const [name,fn] of [['upcoming',renderUpcoming],['logs',renderLogs],['info',renderInfo]]){try{fn(data[name],data.works);}catch(error){console.error(name,error);}}
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
// The CMS keeps 세이프티 / 언세이프티 as stored values; the screen shows the short names.
const safeName=s=>({'세이프티':'세이프','언세이프티':'언세이프'})[s]||s;
const safeText=list=>list.map(s=>esc(safeName(s))).join(' / ');
// Platform tag: a small UFO in the platform's colour box (멜로이 pink, 루모 green, anything else grey).
const UFO='<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><g transform="rotate(-14 12 12)"><path d="M6.5 9a5.5 5.5 0 0 1 11 0c-1.7-.5-3.6-.7-5.5-.7s-3.8.2-5.5.7z"/><path fill-rule="evenodd" d="M12 9.6c6.1 0 11 2 11 4.4s-4.9 4.4-11 4.4S1 16.4 1 14s4.9-4.4 11-4.4zM4.5 14a1 1 0 1 0 2 0a1 1 0 1 0-2 0zM11 16a1 1 0 1 0 2 0a1 1 0 1 0-2 0zM17.5 14a1 1 0 1 0 2 0a1 1 0 1 0-2 0z"/></g></svg>';
const platformTag=name=>name?`<b class="pfm ${({'멜로이':'pfm-m','루모':'pfm-l'})[name]||'pfm-x'}">${UFO}${esc(name)}</b>`:'';
const statusChip=s=>s?`<span class="st" data-status="${esc(s)}">${esc(s)}</span>`:'';
// Card lines: entries with the same platform and status share one line (세이프 / 언세이프).
function platformLines(w){const out=[];w.platforms.forEach(p=>{let g=out.find(x=>x.name===p.name&&x.status===p.status);if(!g){g={name:p.name,status:p.status,safety:[]};out.push(g);}p.safety.forEach(s=>{if(!g.safety.includes(s))g.safety.push(s);});});return out;}
const TRANSPORT='<svg aria-hidden="true" width="94" height="16" viewBox="0 0 94 16"><path fill="#141615" d="M2 3l9 5-9 5zM20 3h3v10h-3zM26 3h3v10h-3zM38 3h10v10H38zM64 3h2v10h-2zM75 3v10l-8-5zM82 3l8 5-8 5zM91 3h2v10h-2z"/><path stroke="#747d76" d="M56.5 1v14"/></svg>';
// Collection card: an old media-player window. The top part (title bar to play buttons) is one link to the work.
function renderCards(){const found=WORKS.filter(matchesWork);$('cards').innerHTML=found.map(w=>{const lines=platformLines(w);const summary=w.tagline||w.description;const keys=w.keywords.slice(0,3);return `<article class="win"><a class="card" href="#work/${esc(w.id)}" data-id="${esc(w.id)}" aria-label="${esc(w.name)} 작품 소개 열기"><span class="tbar"><span>${esc(w.id)}.avi</span><span class="wctl">${WINDOW_CONTROLS}</span></span><span class="scr${w.image?'':' no-art'}">${w.image?`<img src="${esc(w.image)}" alt="" loading="lazy">`:`<span class="typo-cover">${(w.coverLines||[w.name[0],w.name.slice(1)]).map(esc).join('<br>')}</span>`}</span><span class="plate"><span class="no">No.${esc(w.number)}</span><span class="nm" role="heading" aria-level="3">${esc(w.name)}</span></span><span class="seek"><i></i></span><span class="tp">${TRANSPORT}</span></a><div class="info">${lines.length?`<div class="prow">${lines.map(p=>`<div class="pl">${platformTag(p.name)}<span>${safeText(p.safety)}</span>${statusChip(p.status)}</div>`).join('')}</div>`:''}${summary?`<div class="row"><span class="lab">소개</span><p class="tx">${esc(summary)}</p></div>`:''}${keys.length?`<div class="row"><span class="lab">태그</span><p class="tg">${keys.map(k=>'#'+esc(k)).join(' ')}</p></div>`:''}</div></article>`;}).join('');$('empty').hidden=found.length!==0;$('result-count').textContent=`${WORKS.length}편 중 ${found.length}편`;}
function block(title,text){return text?`<section class="detail-block"><h3>${title}</h3><p>${esc(text)}</p></section>`:'';}
// Detail page play list: one big platform tag, then one indented line per entry (세이프 / 언세이프) with its 열기 button.
function playSection(w){
 const names=[...new Set(w.platforms.map(p=>p.name))];
 const groups=names.map(n=>`<div class="play-group">${platformTag(n)}${w.platforms.filter(p=>p.name===n).map(p=>`<div class="play-row"><span class="play-what">${p.safety.length?`<b>${safeText(p.safety)}</b>`:''}${statusChip(p.status)}${p.releaseNote?`<small>${esc(p.releaseNote)}</small>`:''}</span>${p.url?`<a class="btn btn-s" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc([p.name,...p.safety.map(safeName)].filter(Boolean).join(' '))} 열기 (새 창)">열기</a>`:''}</div>`).join('')}</div>`).join('');
 return `<section class="play" aria-labelledby="play-title"><h3 id="play-title">플레이</h3>${groups}${w.platforms.some(p=>p.url)?'':'<p class="play-none">작품 바로가기 링크를 준비하고 있습니다.</p>'}<button type="button" class="btn btn-s" id="copy-link">이 작품 링크 복사</button><p id="share-state" class="share-state" role="status"></p></section>`;
}
function showWork(w){document.title=`${w.name} · 민초파왹`;const meta=[...w.genres,w.type,...w.romance,...w.keywords].filter(Boolean);$('detail-content').innerHTML=`<a class="back" href="#collection"><svg aria-hidden="true" width="14" height="12" viewBox="0 0 14 12"><path d="M14 6H2M7 1L2 6l5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>수집첩으로 돌아가기</a><div class="detail-header"><div class="detail-cover${w.image?'':' no-art'}">${w.image?`<img src="${esc(w.image)}" alt="${esc(w.name)}">`:esc(w.name)}</div><div class="detail-main"><div class="detail-title"><span class="mono">COLLECTION / No.${esc(w.number)}</span><h2 id="detail-title">${esc(w.name)}</h2>${w.tagline?`<p class="detail-tagline">${esc(w.tagline)}</p>`:''}${meta.length?`<p class="detail-tags">${meta.map(esc).join(' · ')}</p>`:''}</div>${playSection(w)}</div></div>${block('작품 소개',w.description||'상세 소개를 준비하고 있습니다.')}${block('유저 역할',w.role)}${block('시작 상황',w.start)}${block('플레이 안내',w.notes)}${galleryViewer(w)}`;$('copy-link').addEventListener('click',copyLink);if(w.gallery.length)bindViewer(w);}
// Gallery: an old-style image viewer window (preview + thumbnail list); the preview opens the original in a dialog.
const imgName=i=>'IMG_'+String(i+1).padStart(2,'0');
function galleryViewer(w){if(!w.gallery.length)return '';return `<section class="detail-block"><h3>이미지 갤러리</h3><div class="viewer"><div class="viewer-bar"><span>gallery_viewer.exe — ${esc(w.name)}</span><span aria-hidden="true">_ □ ×</span></div><div class="viewer-body"><button type="button" class="viewer-preview" id="viewer-open" aria-label="원본 크게 보기"><img id="viewer-main" src="${esc(w.gallery[0])}" alt="${esc(w.name)} ${imgName(0)}"></button><ul class="viewer-thumbs" aria-label="${esc(w.name)} 이미지 목록">${w.gallery.map((src,i)=>`<li><button type="button" class="viewer-thumb" data-i="${i}" aria-pressed="${i===0}" aria-label="${imgName(i)} 미리보기"><span class="viewer-thumb-art"><img src="${esc(src)}" alt="" loading="lazy"></span><span>${imgName(i)}</span><small></small></button></li>`).join('')}</ul></div><div class="viewer-status"><span>${w.gallery.length} object(s)</span><span id="viewer-info">${imgName(0)}</span><span class="viewer-tip">미리보기를 누르면 원본 크게 보기</span></div></div></section>`;}
function bindViewer(w){
 let cur=0;const thumbs=[...document.querySelectorAll('.viewer-thumb')];const sizes=[];
 const info=()=>{$('viewer-info').textContent=imgName(cur)+(sizes[cur]?' · '+sizes[cur]:'');};
 thumbs.forEach((b,i)=>{const img=b.querySelector('img');const done=()=>{if(img.naturalWidth){sizes[i]=img.naturalWidth+'×'+img.naturalHeight;b.querySelector('small').textContent=sizes[i];if(i===cur)info();}};if(img.complete)done();else img.addEventListener('load',done);});
 const select=i=>{cur=i;$('viewer-main').src=w.gallery[i];$('viewer-main').alt=`${w.name} ${imgName(i)}`;thumbs.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));info();};
 $('detail-content').querySelector('.viewer-thumbs').addEventListener('click',e=>{const b=e.target.closest('.viewer-thumb');if(b)select(Number(b.dataset.i));});
 $('detail-content').querySelector('.viewer-thumbs').addEventListener('dblclick',e=>{const b=e.target.closest('.viewer-thumb');if(b)openLightbox(w,Number(b.dataset.i),b);});
 $('viewer-open').addEventListener('click',()=>openLightbox(w,cur,$('viewer-open')));
}
const lightbox=$('lightbox');let lb=null;
function showLightbox(i){const n=lb.w.gallery.length;lb.i=(i+n)%n;const src=lb.w.gallery[lb.i];$('lightbox-img').src=src;$('lightbox-img').alt=`${lb.w.name} ${imgName(lb.i)}`;$('lightbox-title').textContent=`${lb.w.name} — ${imgName(lb.i)} (${lb.i+1}/${n})`;$('lightbox-raw').href=src;$('lightbox-size').textContent='';$('lightbox-prev').hidden=$('lightbox-next').hidden=n<2;}
function openLightbox(w,i,trigger){lb={w,i,trigger};showLightbox(i);if(!lightbox.open)lightbox.showModal();}
$('lightbox-img').addEventListener('load',()=>{const img=$('lightbox-img');$('lightbox-size').textContent=img.naturalWidth+'×'+img.naturalHeight;});
$('lightbox-prev').addEventListener('click',()=>showLightbox(lb.i-1));$('lightbox-next').addEventListener('click',()=>showLightbox(lb.i+1));$('lightbox-close').addEventListener('click',()=>lightbox.close());
lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'&&lb.w.gallery.length>1)showLightbox(lb.i-1);if(e.key==='ArrowRight'&&lb.w.gallery.length>1)showLightbox(lb.i+1);});
lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
lightbox.addEventListener('close',()=>{if(lb?.trigger?.isConnected)lb.trigger.focus();});
window.addEventListener('hashchange',()=>{if(lightbox.open)lightbox.close();});
function readRoute(){
 let hash=location.hash||'#home';
 const work=hash.match(/^#work\/([a-z0-9-]+)$/);
 if(work){const item=WORKS.find(w=>w.id===work[1])||WORKS.find(w=>list(w.oldIds).includes(work[1]));
  // An old shared address (예전 주소용 이름) opens the work and the address bar switches to its current id.
  if(item&&item.id!==work[1]){history.replaceState(null,'','#work/'+item.id);hash='#work/'+item.id;}
  return item?{key:hash,screen:'work',nav:'collection',label:'COLLECTION / '+item.name,item}:{key:hash,screen:'missing',nav:'collection',label:'NOT FOUND'};}
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
$('cards').addEventListener('click',e=>{const a=e.target.closest('a[data-id]');if(a)lastCard=a;});
// Phones: the filter choices stay folded behind the 필터 button so the cards show first.
$('filter-toggle').addEventListener('click',()=>{const open=$('filters').classList.toggle('open');$('filter-toggle').setAttribute('aria-expanded',String(open));});
// Window status bar: number of works.
$('status-works').textContent=`작품 ${WORKS.length}편`;
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
