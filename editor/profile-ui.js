import {defaultProfile,normalizeProfile,generateProfile,mergeCms,value,imageURL,manualId,esc,FIELDS,LIMIT,SAFETY} from './profile.js';
const $=id=>document.getElementById(id),STORE='lumo-studio-profile-v1',BACKUP=STORE+'-previous';
const LABELS={name:'작품명',number:'수집첩 번호',image:'이미지 주소 (https://)',safety:'세이프티 라벨',tagline:'한 줄 소개',tags:'표시할 태그 (쉼표로 구분)',note:'상태 문구'};
let p,output='',timer,dirty=false,loadFailed=false,ctx;
export const getProfile=()=>p;

function save(){clearTimeout(timer);try{if(loadFailed)throw Error();const prev=localStorage.getItem(STORE);if(prev)localStorage.setItem(BACKUP,prev);localStorage.setItem(STORE,JSON.stringify(p));dirty=false;ctx.status('이 기기에 자동 저장됨');return true;}catch{dirty=true;ctx.status('기기 저장 실패 · 소개페이지 JSON으로 백업해 주세요');return false;}}
function changed(){dirty=true;ctx.status('저장 중…');clearTimeout(timer);timer=setTimeout(save,350);if(ctx.visible('p-preview'))renderProfilePreview();}
export const flushProfile=()=>dirty?save():true;
// 다른 파일로 교체할 때: 현재 내용을 직전 사본으로 남기고, 새 내용이 저장된 뒤에만 화면에 적용
export function replaceProfile(next){const v=normalizeProfile(next),old=p;p=v;if(!save()){p=old;return false;}populate();return true;}

function populate(){for(const k of ['nameKo','handle','nameJa','introHeading','introQuote','introSmall','future'])$('p-'+k).value=p[k];renderNotes();renderWorks();renderProfilePreview();}
function renderNotes(){$('p-notes').innerHTML=p.notes.map((n,i)=>`<div class="patch"><label for="p-note-${i}-title">안내 ${i+1} 제목</label><input id="p-note-${i}-title" data-note="${i}" data-key="title" value="${esc(n.title)}"><label for="p-note-${i}-text">안내 ${i+1} 내용</label><textarea id="p-note-${i}-text" rows="3" data-note="${i}" data-key="text">${esc(n.text)}</textarea><button data-del-note="${i}">이 안내 삭제</button></div>`).join('');}
function fetchedText(){return p.cmsFetchedAt?'마지막 불러오기: '+new Date(p.cmsFetchedAt).toLocaleString('ko-KR'):'아직 홈페이지 작품을 불러오지 않았습니다. 기본 3개 작품이 들어 있습니다.';}
function workHTML(w,i){
 const cms=w.source==='cms',img=value(w,'image'),badImg=img.trim()&&!imageURL(img);
 const fields=FIELDS.map(k=>{const own=cms&&Object.prototype.hasOwnProperty.call(w.override,k),id=`w-${i}-${k}`,v=esc(value(w,k));
  if(k==='safety'){const on=value(w,k).split(',').map(s=>s.trim());return `<fieldset class="safety"><legend>${LABELS[k]}${own?' <span class="badge">수정함</span>':''}</legend>${SAFETY.map((s,n)=>`<label class="check"><input type="checkbox" data-safety="${i}" value="${s}"${on.includes(s)?' checked':''}> ${s}</label>`).join('')}${own?`<button data-reset="${i}" data-key="safety" aria-label="세이프티 라벨 홈페이지 값으로 되돌리기">↺ 홈페이지 값</button>`:''}${cms?'<p class="small">홈페이지의 루모 플랫폼 값을 기본으로 씁니다. 둘 다 끄면 라벨이 나오지 않습니다.</p>':''}</fieldset>`;}
  return `<label for="${id}">${LABELS[k]}${own?' <span class="badge">수정함</span>':''}</label><div class="field-row">${k==='tagline'?`<textarea id="${id}" rows="2" data-work="${i}" data-key="${k}">${v}</textarea>`:`<input id="${id}" data-work="${i}" data-key="${k}" value="${v}"${k==='image'?' inputmode="url" autocapitalize="none" spellcheck="false"':''}>`}${own?`<button data-reset="${i}" data-key="${k}" title="홈페이지 값으로 되돌리기" aria-label="${LABELS[k]} 홈페이지 값으로 되돌리기">↺</button>`:''}</div>${k==='image'?`<p class="small${badImg?' danger':''}" id="w-${i}-image-hint">${badImg?'https:// 로 시작하는 이미지 주소가 아니어서 이름 표지로 대신 표시합니다.':'GIF도 그대로 표시됩니다. 이미지 파일은 저장하지 않고 주소만 사용합니다.'}</p>`:''}${k==='tags'&&w.base.keywords.length?`<button class="small-btn" data-keywords="${i}">홈페이지 키워드 넣기: ${esc(w.base.keywords.join(', '))}</button>`:''}`;}).join('');
 return `<details class="box work${w.show?' on':''}"${w.open?' open':''} data-index="${i}"><summary><span class="work-order">${i+1}</span> ${esc(value(w,'name')||'이름 없는 작품')} ${w.show?'<span class="badge safe">표시</span>':'<span class="badge">숨김</span>'} ${cms?'':'<span class="badge">직접 추가</span>'}${w.missing?' <span class="badge unsafe">홈페이지에서 사라짐</span>':''}</summary>
 <label class="check"><input type="checkbox" data-show="${i}"${w.show?' checked':''}> 루모 소개에 표시</label>
 <div class="tools"><button data-move="${i}" data-dir="-1" ${i===0?'disabled':''}>▲ 위로</button><button data-move="${i}" data-dir="1" ${i===p.works.length-1?'disabled':''}>▼ 아래로</button>${!cms||w.missing?`<button data-remove-work="${i}">삭제</button>`:''}</div>
 ${cms?`<p class="small">홈페이지 ID: ${esc(w.id)}${w.base.platforms?' · '+esc(w.base.platforms):''}</p>`:''}${w.missing?'<p class="small danger">최근 불러온 홈페이지 목록에 없습니다. 필요 없으면 직접 삭제하세요.</p>':''}${fields}</details>`;
}
function renderWorks(){const shown=p.works.filter(w=>w.show).length;$('p-fetched').textContent=fetchedText();$('p-work-count').textContent=`표시 ${shown}개 / 전체 ${p.works.length}개`;$('p-work-count').classList.toggle('danger',!shown);$('p-works-list').innerHTML=p.works.map(workHTML).join('')||'<p class="box">작품이 없습니다. 홈페이지에서 불러오거나 직접 추가해 주세요.</p>';}
function previewDoc(html){return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:6px;background:#f1f2ed;color:#141516">'+html+'</body></html>';}
export function renderProfilePreview(){output=generateProfile(p);$('p-code').value=output;const over=output.length>LIMIT;$('p-copy').disabled=$('p-html-save').disabled=over;$('p-count').textContent=output.length.toLocaleString()+' / 100,000자';$('p-limit').textContent=over?`100,000자를 ${(output.length-LIMIT).toLocaleString()}자 넘었습니다. 복사·저장하려면 소개 문구나 표시 작품을 줄여 주세요.`:'공백과 HTML·CSS 코드를 포함한 글자 수입니다.'+(p.works.some(w=>w.show)?'':' 표시할 작품이 없어 수집첩 칸은 빠집니다.');$('p-limit').classList.toggle('danger',over);if(ctx.visible('p-preview'))$('p-frame').srcdoc=previewDoc(output);}

async function refreshCms(){
 const b=$('p-refresh');b.disabled=true;ctx.say('홈페이지 작품 목록을 불러오는 중…');
 try{const res=await fetch('../data/works.json',{cache:'no-cache'});if(!res.ok)throw Error('홈페이지 응답 오류('+res.status+')');let raw;try{raw=await res.json();}catch{throw Error('홈페이지 작품 데이터를 읽을 수 없습니다.');}
  const r=mergeCms(p,raw);p.works.forEach(w=>{const n=r.profile.works.find(x=>x.id===w.id);if(n)n.open=w.open;});p=r.profile;save();renderWorks();renderProfilePreview();
  ctx.say(`불러오기 완료 · 갱신 ${r.updated}개, 새 작품 ${r.added}개(숨김 상태로 추가)${r.missing?`, 사라진 작품 ${r.missing}개`:''}`);}
 catch(e){ctx.say((e instanceof TypeError?'인터넷 연결을 확인해 주세요.':e.message)+' 기존 목록과 작성 내용은 그대로 두었습니다.');}
 finally{b.disabled=false;}
}
export function initProfile(c){
 ctx=c;
 try{const raw=localStorage.getItem(STORE);p=raw?normalizeProfile(JSON.parse(raw)):defaultProfile();}catch{loadFailed=true;p=defaultProfile();ctx.say('소개페이지 저장 내용을 읽지 못했습니다. 기존 저장소는 덮어쓰지 않습니다. 보관한 JSON을 불러와 주세요.');}
 populate();if(!loadFailed&&!localStorage.getItem(STORE))save();
 for(const k of ['nameKo','handle','nameJa','introHeading','introQuote','introSmall','future'])$('p-'+k).addEventListener('input',e=>{p[k]=e.target.value;changed();});
 $('p-notes').oninput=e=>{const {note,key}=e.target.dataset;if(key){p.notes[+note][key]=e.target.value;changed();}};
 $('p-notes').onclick=e=>{const b=e.target.closest('[data-del-note]');if(b&&confirm('이 안내를 삭제할까요?')){p.notes.splice(+b.dataset.delNote,1);renderNotes();changed();}};
 $('p-add-note').onclick=()=>{p.notes.push({title:String(p.notes.length+1).padStart(2,'0')+' / NOTE',text:''});renderNotes();changed();$(`p-note-${p.notes.length-1}-text`).focus();};
 $('p-works-list').addEventListener('toggle',e=>{const d=e.target;if(d.matches?.('details.work'))p.works[+d.dataset.index].open=d.open;},true);
 $('p-works-list').oninput=e=>{const t=e.target,i=+t.dataset.work,w=p.works[i];
  if(t.dataset.show!==undefined){p.works[+t.dataset.show].show=t.checked;changed();renderWorks();return;}
  if(t.dataset.safety!==undefined){const j=+t.dataset.safety,v=[...t.closest('fieldset').querySelectorAll('input:checked')].map(x=>x.value).join(',');if(p.works[j].source==='cms')p.works[j].override.safety=v;else p.works[j].base.safety=v;changed();renderWorks();return;}
  if(!w||!t.dataset.key)return;const k=t.dataset.key;
  if(w.source==='cms'){const first=!Object.prototype.hasOwnProperty.call(w.override,k);w.override[k]=t.value;
   // 수정 배지·되돌리기 버튼은 목록을 다시 그리지 않고 붙여 입력 중 포커스가 유지되게 함
   if(first){document.querySelector(`label[for="${t.id}"]`).insertAdjacentHTML('beforeend',' <span class="badge">수정함</span>');t.parentElement.insertAdjacentHTML('beforeend',`<button data-reset="${i}" data-key="${k}" title="홈페이지 값으로 되돌리기" aria-label="${LABELS[k]} 홈페이지 값으로 되돌리기">↺</button>`);}}
  else w.base[k]=t.value;
  if(k==='image'){const bad=t.value.trim()&&!imageURL(t.value),h=$(`w-${i}-image-hint`);h.classList.toggle('danger',!!bad);h.textContent=bad?'https:// 로 시작하는 이미지 주소가 아니어서 이름 표지로 대신 표시합니다.':'GIF도 그대로 표시됩니다. 이미지 파일은 저장하지 않고 주소만 사용합니다.';}
  changed();};
 $('p-works-list').onclick=e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();
  if(b.dataset.move){const i=+b.dataset.move,j=i+ +b.dataset.dir;[p.works[i],p.works[j]]=[p.works[j],p.works[i]];}
  else if(b.dataset.reset){delete p.works[+b.dataset.reset].override[b.dataset.key];}
  else if(b.dataset.keywords){const w=p.works[+b.dataset.keywords];w.override.tags=w.base.keywords.join(', ');}
  else if(b.dataset.removeWork){const w=p.works[+b.dataset.removeWork];if(!confirm(`‘${value(w,'name')||'이름 없는 작품'}’을 루모 소개 목록에서 삭제할까요? 홈페이지에는 영향이 없습니다.`))return;p.works.splice(+b.dataset.removeWork,1);}
  else return;renderWorks();changed();};
 $('p-add-work').onclick=()=>{p.works.push({id:manualId(),source:'manual',show:true,missing:false,open:true,base:{name:'새 작품',number:'',image:'',safety:'',tagline:'',tags:'',note:'',keywords:[],platforms:''},override:{}});renderWorks();changed();$(`w-${p.works.length-1}-name`).focus();};
 $('p-refresh').onclick=refreshCms;
 $('p-copy').onclick=async()=>{renderProfilePreview();if(output.length>LIMIT)return;try{await navigator.clipboard.writeText(output);ctx.say('HTML을 복사했습니다. 루모 제작자 소개에 붙여넣어 주세요.');}catch{$('p-code-details').open=true;selectCode();ctx.say('자동 복사가 막혔습니다. 선택된 코드를 직접 복사해 주세요.');}};
 const selectCode=()=>{$('p-code').focus();$('p-code').select();$('p-code').setSelectionRange(0,output.length);};
 $('p-select-code').onclick=selectCode;
 $('p-html-save').onclick=()=>{renderProfilePreview();if(output.length<=LIMIT)ctx.download(output,'lumo-creator-profile.html','text/html');};
 $('p-export').onclick=()=>ctx.download(JSON.stringify(p,(k,v)=>k==='open'?undefined:v,2),'lumo-creator-profile.json','application/json');
 window.addEventListener('storage',e=>{if(e.key===STORE){loadFailed=true;ctx.status('다른 창에서 변경됨 · 현재 내용은 JSON 백업 후 다시 열어 주세요');}});
}
