(async function(){
try {
 const response=await fetch('data/works.json');
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
 return w.platforms.some(p=>($('platform').value==='all'||p.name===$('platform').value)&&($('status').value==='all'||p.status===$('status').value)&&($('safety').value==='all'||p.safety.includes($('safety').value)));
}
function tags(w){return [...w.genres,w.type,...w.romance,...w.keywords].filter(Boolean).map(t=>`<span class="work-tag">${esc(t)}</span>`).join('');}
function renderCards(){const found=WORKS.filter(matchesWork);$('cards').innerHTML=found.map(w=>`<article class="sleeve"><button type="button" class="card-button" data-id="${esc(w.id)}" aria-label="${esc(w.name)} 작품 소개 열기"><div class="card-art"><span class="card-star" aria-hidden="true">✦</span><span class="card-star other" aria-hidden="true">✷</span>${w.image?`<img src="${esc(w.image)}" alt="" loading="lazy">`:`<div class="typo-cover ${w.coverLines?'long-cover':''}">${(w.coverLines||[w.name[0],w.name.slice(1)]).map(esc).join('<br>')}<small>CHARACTER / ${esc(w.number)}</small></div>`}</div><div class="nameplate"><h3>${esc(w.name)}</h3><p>No.${esc(w.number)} / m1nch0wh4ck</p></div></button><div class="card-meta">${w.platforms.map(p=>`<span>${esc(p.label||p.name)}${p.status==='공개 중'?'':' · '+esc(p.status)}</span>`).join('')}</div><p class="card-summary">${esc(w.tagline||w.description)}</p><div class="work-tags">${w.keywords.slice(0,3).map(k=>`<span class="work-tag">${esc(k)}</span>`).join('')}</div></article>`).join('');$('empty').hidden=found.length!==0;$('result-count').textContent=`${found.length} / ${WORKS.length} WORKS`;}
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
