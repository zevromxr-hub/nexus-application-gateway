/* NEXUS | AZEROTH COMPANION v13.1 — Reforged Precision & Mobile Polish.
 * Safe read-only extension. Rank changes call existing native Forge controls;
 * this file makes no network requests and writes no localStorage records.
 */
(()=>{'use strict';
const forge=document.getElementById('talentForge'),root=document.getElementById('nx13Forge'),tree=document.getElementById('nx13Tree'),bridge=window.NexusTalentSourceBridge;
if(!forge||!root||!tree||!bridge||document.getElementById('nx131Toolbar'))return;
const $=id=>document.getElementById(id);
const e=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x};
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),mobile=window.matchMedia('(max-width:900px)');
const tools=e('div','nx131-toolbar');tools.id='nx131Toolbar';
tools.innerHTML=[
 '<div class="nx131-tool-buttons" aria-label="Talent canvas view controls">',
 '<button type="button" id="nx131Compact" aria-pressed="false">◫ COMPACT MAP</button>',
 '<button type="button" id="nx131Focus" disabled>⌖ FOCUS SELECTED</button>',
 '<button type="button" id="nx131Reset">↺ RESET VIEW</button></div>',
 '<div class="nx131-diff-control"><label class="nx131-diff-check">',
 '<input id="nx131Highlight" type="checkbox" disabled> Highlight differences</label>',
 '<p id="nx131Diff" role="status" aria-live="polite">Select a saved draft or checkpoint to compare ranks.</p></div>'
].join('');
const status=$('nx13Status');if(!status)return;
status.before(tools);
const tray=e('div','nx131-tray');tray.id='nx131Tray';tray.hidden=true;
tray.innerHTML=[
 '<button type="button" id="nx131Dismiss" class="nx131-dismiss" aria-label="Close selected talent toolbar">×</button>',
 '<div class="nx131-tray-copy"><small id="nx131TraySource">OFFICIAL NODE / MANUAL RANKS</small>',
 '<strong id="nx131TrayName">Selected talent</strong><span id="nx131TrayMeta">0 / 0 ranks</span></div>',
 '<div class="nx131-tray-controls">',
 '<button type="button" id="nx131Minus" aria-label="Reduce selected talent rank" disabled>−</button>',
 '<button type="button" id="nx131Plus" aria-label="Increase selected talent rank" disabled>+</button>',
 '<button type="button" id="nx131Details">DETAILS ↗</button></div>'
].join('');
root.append(tray);
let selected=0,compact=false,dim=false,shown=false,queued=false,last='';
const snap=()=>{try{return bridge.snapshot()}catch(_){return null}};
const animation=callback=>requestAnimationFrame(callback);
const ranks=raw=>{
 const out=Object.create(null);
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
 for(const [id,v] of Object.entries(raw).slice(0,450)){
  if(!/^[1-9]\d{0,11}$/.test(id))continue;
  const n=Number(v);if(Number.isInteger(n)&&n>=0&&n<=20)out[id]=n;
 }
 return out;
};
function history(){
 try{
  const raw=localStorage.getItem('nexus_forge_reforged_checkpoints_v13');
  if(!raw||raw.length>650000)return [];
  const value=JSON.parse(raw);return Array.isArray(value)?value.filter(x=>x&&typeof x.id==='string'&&typeof x.identity==='string'&&x.rankByNode&&typeof x.rankByNode==='object').slice(0,24):[];
 }catch(_){return []}
}
function comparison(s){
 if(!s?.ready)return null;
 const key=$('nx13Compare')?.value||'';
 if(key.startsWith('draft:')){
  const record=(s.savedDrafts||[]).find(x=>x.savedAt===key.slice(6));
  return record?{name:String(record.name||'Saved build').slice(0,70),data:ranks(record.rankByNode)}:null;
 }
 if(key.startsWith('checkpoint:')){
  const item=history().find(x=>x.id===key.slice(11)&&x.identity===s.identity);
  return item?{name:String(item.name||'Checkpoint').slice(0,70),data:ranks(item.rankByNode)}:null;
 }
 return null;
}
function stats(s,base){
 const live=ranks(s.allocations),before=base.data,ids=new Set((s.catalog||[]).map(x=>String(x.id)).filter(x=>/^[1-9]\d{0,11}$/.test(x)));
 let changed=0,added=0,removed=0;
 for(const id of ids){
  const a=live[id]||0,b=before[id]||0;
  if(a===b)continue;changed++;
  if(a>b)added+=a-b;else removed+=b-a;
 }
 return {changed,added,removed};
}
function displaySelected(id,reveal=false){
 const s=snap(),n=(s?.nodes||[]).find(x=>x.id===Number(id));
 if(!n){selected=0;tray.hidden=true;$('nx131Focus').disabled=true;return}
 selected=Number(id);
 const points=Number(s.allocations?.[String(selected)]||0),max=Number(n.max||0);
 $('nx131TraySource').textContent='BLIZZARD NODE #'+selected+' / MANUAL RANKS';
 $('nx131TrayName').textContent=String(n.name||'Selected node').slice(0,100);
 $('nx131TrayMeta').textContent=points+' / '+max+' planned ranks';
 $('nx131Minus').disabled=points<=0;
 $('nx131Plus').disabled=points>=max||max<=0;
 $('nx131Focus').disabled=false;
 if(reveal&&mobile.matches&&forge.classList.contains('nx13-workshop-open')){tray.hidden=false;shown=true}
}
function gridMode(){
 root.classList.toggle('nx131-compact',compact);
 $('nx131Compact').textContent=compact?'▣ COMFORTABLE MAP':'◫ COMPACT MAP';
 $('nx131Compact').setAttribute('aria-pressed',String(compact));
}
function update(){
 const s=snap();
 gridMode();
 if(!s?.ready){
  $('nx131Diff').textContent='Load Blizzard talent data to activate comparison and mobile node controls.';
  $('nx131Highlight').disabled=true;selected=0;tray.hidden=true;$('nx131Focus').disabled=true;return;
 }
 const base=comparison(s),check=$('nx131Highlight');
 check.disabled=!base;
 if(base){
  const x=stats(s,base);
  $('nx131Diff').textContent=x.changed+' changed reported nodes · +'+x.added+' planned ranks · −'+x.removed+' ranks compared with '+base.name+'. Not a power or game-validity score.';
 }else{
  dim=false;check.checked=false;
  $('nx131Diff').textContent='Choose a saved draft or checkpoint in Compare With to highlight manual rank differences.';
 }
 root.classList.toggle('nx131-diff-focus',dim);
 if(selected)displaySelected(selected,false);
}
function fingerprint(){
 const s=snap();
 return JSON.stringify([s?.ready,s?.identity,s?.active,s?.allocations,$('nx13Compare')?.value,selected,compact,dim,tree.querySelector('.nx13-grid')?.childElementCount]);
}
function schedule(){
 if(queued)return;
 queued=true;animation(()=>{queued=false;const next=fingerprint();if(next!==last){last=next;update()}});
}
function nodeCard(){return selected?tree.querySelector('[data-node="'+selected+'"]'):null}
function centerSelected(){
 const card=nodeCard();
 if(card){card.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'nearest',inline:'center'});card.querySelector('button[data-select]')?.focus({preventScroll:true})}
 else{const search=$('nx13Search');if(search.value){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(centerSelected,170)}}
}
function nativeRank(action){
 if(!selected)return;
 const find=parent=>parent?.querySelector('button[data-rank="'+action+'"][data-id="'+selected+'"]');
 const button=find($('nx13Inspector'))||find(tree);
 if(button&&!button.disabled){button.click();animation(()=>{displaySelected(selected,false);schedule()})}
}
$('nx131Compact').addEventListener('click',()=>{compact=!compact;gridMode();schedule()});
$('nx131Focus').addEventListener('click',centerSelected);
$('nx131Reset').addEventListener('click',()=>{
 const area=root.querySelector('.nx13-scroll');
 area?.scrollTo({left:0,top:0,behavior:reduced.matches?'auto':'smooth'});
 const field=$('nx13Search');field.value='';field.dispatchEvent(new Event('input',{bubbles:true}));
 const checked=$('nx13Only');if(checked?.checked){checked.checked=false;checked.dispatchEvent(new Event('change',{bubbles:true}))}
 dim=false;$('nx131Highlight').checked=false;root.classList.remove('nx131-diff-focus');schedule();
});
$('nx131Highlight').addEventListener('change',event=>{
 if(!comparison(snap())){event.target.checked=false;return}
 dim=event.target.checked;root.classList.toggle('nx131-diff-focus',dim);schedule();
});
tree.addEventListener('click',event=>{
 const button=event.target.closest('[data-select],[data-rank]');if(!button)return;
 const id=Number(button.dataset.select||button.dataset.id);
 if(Number.isSafeInteger(id)&&id>0)animation(()=>{displaySelected(id,true);schedule()});
});
$('nx131Dismiss').addEventListener('click',()=>{tray.hidden=true;shown=false});
$('nx131Minus').addEventListener('click',()=>nativeRank('dec'));
$('nx131Plus').addEventListener('click',()=>nativeRank('inc'));
$('nx131Details').addEventListener('click',()=>{
 const target=$('nx13Inspector');if(!target)return;
 target.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});
 const title=target.querySelector('h4');if(title){title.setAttribute('tabindex','-1');title.focus({preventScroll:true})}
 tray.hidden=true;shown=false;
});
$('nx13Compare')?.addEventListener('change',schedule);
new MutationObserver(schedule).observe(tree,{childList:true,subtree:false});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
document.addEventListener('nexus:view-activated',event=>{if(event.detail?.view==='talents')schedule()});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&!tray.hidden){tray.hidden=true;shown=false}
 if(event.key!=='/'||event.ctrlKey||event.metaKey||event.altKey)return;
 if(!forge.classList.contains('nx13-workshop-open')||!forge.querySelector('.section.active'))return;
 const target=document.activeElement,tag=target?.tagName?.toLowerCase();
 if(['input','select','textarea'].includes(tag)||target?.isContentEditable)return;
 event.preventDefault();$('nx13Search').focus();
});
mobile.addEventListener?.('change',()=>{
 if(!mobile.matches)tray.hidden=true;
 else if(shown&&selected&&forge.classList.contains('nx13-workshop-open'))tray.hidden=false;
});
update();
})();