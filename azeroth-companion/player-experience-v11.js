/* NEXUS | AZEROTH v11.0 — Sovereign Player Experience.
 * Original local save records are READ ONLY.
 * Mutations limited to four NEW namespaced v11 keys:
 *   nexus_player_focus_v11, nexus_player_build_links_v11,
 *   nexus_player_quests_v11, nexus_player_history_v11
 * plus the existing session-entry marker used only on full-app navigation.
 * No fetch, authentication, Blizzard secrets or automatic game-data claims.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const KEY={
 core:'nexus_azeroth_companion_genesis_v1',
 talent:'nexus_azeroth_talent_forge_v1',
 focus:'nexus_player_focus_v11',
 links:'nexus_player_build_links_v11',
 quests:'nexus_player_quests_v11',
 history:'nexus_player_history_v11',
 board:'nexus_command_center_goals_v10',
 entry:'nexus_living_entry_seen_v9'
};
const e=(tag,cl,value)=>{const el=document.createElement(tag);if(cl)el.className=cl;if(value!==undefined)el.textContent=String(value);return el};
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const clean=(v,n=100)=>typeof v==='string'?v.trim().slice(0,n):'';
const list=(v,n)=>Array.isArray(v)?v.filter(obj).slice(0,n):[];
const read=(key,max=3200000)=>{try{const raw=localStorage.getItem(key);return raw&&raw.length<=max?JSON.parse(raw):null}catch(_){return null}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){announce('Browser storage unavailable. Nothing was changed.');return false}};
let toastTimer=0;
function announce(msg){const el=$('px11Toast');el.textContent=msg;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3500)}
function markEntered(){try{sessionStorage.setItem(KEY.entry,'entered')}catch(_){}}
document.querySelectorAll('[data-px-app]').forEach(a=>a.addEventListener('click',markEntered));
const rawCore=read(KEY.core);
const core=obj(rawCore)?rawCore:{};
const charList=list(core.characters,250).filter(x=>clean(x.name)&&clean(x.id,110));
const chars=[...new Map(charList.map(x=>[x.id,x])).values()];
const mainBuilds=list(core.builds,600).filter(x=>clean(x.title));
const tasks=list(core.tasks,1200);
const collections=list(core.collections,1000);
function rankMap(v){
 if(!obj(v))return {};
 const map=Object.create(null);for(const [id,raw] of Object.entries(v).slice(0,400)){
  const n=Number(raw);
  if(/^[1-9]\d{0,11}$/.test(id)&&Number.isInteger(n)&&n>=0&&n<=20)map[id]=n;
 }
 return map;
}
function rankCount(v){return Object.values(rankMap(v)).reduce((a,b)=>a+b,0)}
const sourceDrafts=list(read(KEY.talent),70).filter(x=>clean(x.name)&&clean(x.identity,130)&&obj(x.rankByNode));
const drafts=sourceDrafts.map((x,i)=>({
 key:(clean(x.identity,130)+'::'+clean(x.savedAt,40)+'::'+clean(x.name,75)),
 name:clean(x.name,75),identity:clean(x.identity,130),savedAt:clean(x.savedAt,40),rankByNode:rankMap(x.rankByNode),choiceByNode:rankMap(x.choiceByNode),
 region:clean(x.region,4),specName:clean(x.specName,95),planner:obj(x.planner)?x.planner:{},originIndex:i
}));
const chosen=(()=>{try{return localStorage.getItem(KEY.focus)||''}catch(_){return ''}})();
let activeId=chars.some(c=>c.id===chosen)?chosen:(chars[0]?.id||'');
let links=obj(read(KEY.links,150000))?read(KEY.links,150000):{};
links=Object.fromEntries(Object.entries(links).filter(([k,v])=>typeof k==='string'&&k.length<260&&typeof v==='string'&&v.length<150).slice(0,220));
let quests=list(read(KEY.quests,210000),150).map(x=>({
 id:clean(x.id,80),charId:clean(x.charId,140),title:clean(x.title,100),kind:clean(x.kind,50),done:x.done===true,createdAt:clean(x.createdAt,36)
})).filter(x=>x.id&&x.title&&x.charId);
let history=list(read(KEY.history,1100000),40).map(x=>({
 id:clean(x.id,80),name:clean(x.name,75),identity:clean(x.identity,130),sourceKey:clean(x.sourceKey,260),
 rankByNode:rankMap(x.rankByNode),choiceByNode:rankMap(x.choiceByNode),savedAt:clean(x.savedAt,40),
 charId:clean(x.charId,140),createdAt:clean(x.createdAt,36)
})).filter(x=>x.id&&x.name&&x.identity);
const board=list(read(KEY.board,150000),140);
const selected=()=>chars.find(x=>x.id===activeId)||null;
const taskMatches=t=>!t.charId||t.charId===activeId;
function empty(host,msg,help){const box=e('div','px11-empty',msg);if(help)box.append(e('p','',help));host.append(box)}
function row(host,title,description,actionLabel,action){
 const div=e('div','px11-row'),copy=e('div','px11-row-copy');
 copy.append(e('strong','',title),e('small','',description));div.append(copy);
 if(actionLabel){const b=e('button','',actionLabel);b.type='button';if(typeof action==='function')b.addEventListener('click',action);div.append(b)}
 host.append(div);return div;
}
function detail(label,value){const d=e('div','px11-detail');d.append(e('small','',label),e('strong','',value||'Not specified'));$('px11DossierDetails').append(d)}
function updateHero(){
 const c=selected(),select=$('px11CharacterSelect');
 select.value=activeId;
 $('px11PortraitName').textContent=c?clean(c.name,55).toUpperCase():'UNWRITTEN LEGEND';
 $('px11PortraitMeta').textContent=c?[clean(c.className,40),clean(c.spec,45),clean(c.realm,60)].filter(Boolean).join(' · ')||'Manual saved profile':'Create a local character to begin.';
 $('px11HeroStatus').textContent=c?'Showing browser-local manual profile: '+clean(c.name,60)+'.': 'Create a manual profile in the complete companion to begin.';
}
function renderMetrics(){
 const related=quests.filter(q=>q.charId===activeId&&!q.done);
 const original=tasks.filter(t=>taskMatches(t)&&t.done!==true);
 const relatedBuilds=mainBuilds.filter(b=>b.charId===activeId).length+drafts.filter(b=>links[b.key]===activeId).length;
 $('px11MetricCharacters').textContent=String(chars.length);
 $('px11MetricBuilds').textContent=String(relatedBuilds);
 $('px11MetricObjectives').textContent=String(related.length+original.length);
 $('px11MetricHistory').textContent=String(history.filter(x=>x.charId===activeId).length);
}
function renderOverview(){
 const c=selected(),detailHost=$('px11DossierDetails'),buildHost=$('px11AssociatedBuilds');
 detailHost.replaceChildren();buildHost.replaceChildren();
 $('px11DossierName').textContent=c?clean(c.name,75):'Choose your legend';
 $('px11DossierText').textContent=c?'A manual planning profile associated with this browser—not a verified World of Warcraft account profile.':'Create a character in the complete companion to personalize this workspace.';
 if(!c){empty(buildHost,'No character selected.','Saved build associations appear after selecting a manual profile.');return}
 detail('Class',clean(c.className,45));detail('Specialization',clean(c.spec,50));detail('Realm',clean(c.realm,75));detail('Game Version',clean(c.version,36));
 const relatedMain=mainBuilds.filter(b=>b.charId===activeId).slice(0,12);
 const relatedTalents=drafts.filter(b=>links[b.key]===activeId).slice(0,12);
 relatedMain.forEach(b=>row(buildHost,clean(b.title,75),'Build Architect · '+(clean(b.mode,45)||'Manual build reference'),'OPEN',()=>navigate('./?enter=1&view=builds')));
 relatedTalents.forEach(b=>row(buildHost,b.name,'Talent Forge draft · '+rankCount(b.rankByNode)+' recorded ranks','COMPARE',()=>{chooseTab('builds');$('px11BuildA').value='draft:'+b.key;renderComparison()}));
 if(!relatedMain.length&&!relatedTalents.length)empty(buildHost,'No builds associated yet.','Build Architect profiles can be assigned directly in the original companion. Talent Forge drafts can be associated in the Build Intelligence tab.');
}
function navigate(url){if(url.startsWith('./?enter=1'))markEntered();location.assign(url)}
function populateSelect(el,items,first){
 const current=el.value;el.replaceChildren(e('option','',first));el.firstChild.value='';
 for(const item of items){const option=e('option','',item.label);option.value=item.value;el.append(option)}
 if(items.some(x=>x.value===current))el.value=current;
}
function getRecord(value){
 if(value.startsWith('draft:'))return drafts.find(x=>'draft:'+x.key===value)||null;
 if(value.startsWith('history:'))return history.find(x=>'history:'+x.id===value)||null;
 return null;
}
function draftOptions(){
 return drafts.map(x=>({value:'draft:'+x.key,label:x.name+' · '+(x.specName||x.identity)+' · '+rankCount(x.rankByNode)+' ranks'}));
}
function renderBuildSelections(){
 populateSelect($('px11BuildA'),draftOptions(),'Choose a saved Talent Forge draft');
 const comparisons=[...draftOptions(),...history.map(x=>({value:'history:'+x.id,label:'CHECKPOINT · '+x.name+' · '+x.createdAt.slice(0,10)}))];
 populateSelect($('px11BuildB'),comparisons,'Choose saved draft / historical checkpoint');
 populateSelect($('px11LinkDraft'),draftOptions(),'Choose a saved Talent Forge draft');
}
function renderComparison(){
 const a=getRecord($('px11BuildA').value),b=getRecord($('px11BuildB').value);
 const host=$('px11CompareOutput');host.replaceChildren();
 if(!a||!b){host.append(e('p','','Select two saved drafts or a saved checkpoint to compare their recorded allocations.'));return}
 if(a.identity!==b.identity){host.append(e('strong','','Different specialization identities.'));host.append(e('p','','These saved drafts use different tree/spec identities. Comparing node ranks could be misleading; choose matching specializations.'));return}
 const am=rankMap(a.rankByNode),bm=rankMap(b.rankByNode);
 const ids=[...new Set([...Object.keys(am),...Object.keys(bm)])].sort((u,v)=>Number(u)-Number(v));
 const diffs=ids.map(id=>({id,from:am[id]||0,to:bm[id]||0})).filter(d=>d.from!==d.to);
 const sumA=Object.values(am).reduce((a,b)=>a+b,0),sumB=Object.values(bm).reduce((a,b)=>a+b,0);
 host.append(e('strong','',a.name+' → '+b.name));
 host.append(e('p','','Recorded ranks: '+sumA+' → '+sumB+' · '+diffs.length+' changed node IDs · '+(sumB-sumA>=0?'+':'')+(sumB-sumA)+' net planned ranks.'));
 host.append(e('p','','Only numeric node IDs and manual rank values are compared. Talent prerequisite validity, choice node rules, class balance and current meta are not asserted.'));
 const listEl=e('div','px11-diff-list');
 if(!diffs.length)listEl.append(e('p','','No rank changes in the recorded node IDs.'));
 diffs.slice(0,80).forEach(d=>{const line=e('div','px11-diff');line.append(e('span','','Node #'+d.id),e('span','',d.from+' → '+d.to));listEl.append(line)});
 if(diffs.length>80)listEl.append(e('p','','Showing the first 80 of '+diffs.length+' changed IDs.'));
 host.append(listEl);
}
const buildA=$('px11BuildA'),buildB=$('px11BuildB');
buildA.addEventListener('change',renderComparison);buildB.addEventListener('change',renderComparison);
$('px11Compare').addEventListener('click',renderComparison);
function download(data,file){
 try{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=e('a');
 a.href=url;a.download=file;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 return true}catch(_){announce('Export unavailable in this browser.');return false}
}
$('px11ExportDraft').addEventListener('click',()=>{
 const b=getRecord(buildA.value);if(!b){announce('Choose a saved Talent Forge draft first.');return}
 const original=sourceDrafts[b.originIndex];
 if(!original){announce('Select an original draft, not a history checkpoint.');return}
 const draft={format:'nexus-azeroth-talent-draft-v1',name:b.name,identity:b.identity,region:b.region,specName:b.specName,rankByNode:{...b.rankByNode},choiceByNode:{...b.choiceByNode},planner:b.planner,savedAt:b.savedAt,notice:'Local manual planning draft; not validated for game import or prerequisites.'};
 if(download(draft,'nexus-saved-talent-draft-v11.json'))announce('Draft exported for safekeeping.');
});
$('px11Checkpoint').addEventListener('click',()=>{
 const b=getRecord(buildA.value);if(!b||!buildA.value.startsWith('draft:')){announce('Select an original Talent Forge draft A to save a checkpoint.');return}
 if(history.length>=40){announce('40 checkpoints stored. Export or remove an older checkpoint first.');return}
 const id=globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2);
 const snapshot={id,name:b.name,identity:b.identity,sourceKey:b.key,rankByNode:{...b.rankByNode},choiceByNode:{...b.choiceByNode},savedAt:b.savedAt,charId:links[b.key]||activeId||'',createdAt:new Date().toISOString()};
 if(write(KEY.history,[snapshot,...history])){history=[snapshot,...history];renderBuildSelections();renderHistory();renderMetrics();announce('Historical checkpoint saved independently.')}
});
function renderAssociations(){
 const host=$('px11LinkedDrafts');host.replaceChildren();
 if(!selected()){empty(host,'Choose a character to associate builds.');return}
 const related=drafts.filter(b=>links[b.key]===activeId);
 if(!related.length){empty(host,'No Talent Forge drafts associated with this character yet.');return}
 related.slice(0,20).forEach(b=>row(host,b.name,'Manual link · '+(b.specName||b.identity)+' · '+rankCount(b.rankByNode)+' ranks','UNLINK',()=>{
  const next={...links};delete next[b.key];
  if(write(KEY.links,next)){links=next;renderAssociations();renderOverview();renderMetrics();announce('Local association removed. Original draft unchanged.')}
 }));
}
$('px11AttachDraft').addEventListener('click',()=>{
 const d=getRecord($('px11LinkDraft').value);
 if(!selected()||!d){announce('Choose a saved character and an existing Talent Forge draft.');return}
 const next={...links,[d.key]:activeId};
 if(write(KEY.links,next)){links=next;renderAssociations();renderOverview();renderMetrics();announce('Draft associated locally. Original Talent Forge data unchanged.')}
});
$('px11UnlinkDraft').addEventListener('click',()=>{
 const d=getRecord($('px11LinkDraft').value);if(!d){announce('Select an associated draft to unlink.');return}
 const next={...links};delete next[d.key];
 if(write(KEY.links,next)){links=next;renderAssociations();renderOverview();renderMetrics();announce('Association removed. Original draft unchanged.')}
});
function renderHistory(){
 const host=$('px11CheckpointList');host.replaceChildren();
 if(!history.length){empty(host,'No checkpoints yet.','Select a saved draft A and choose Save Checkpoint.');return}
 history.slice(0,20).forEach(s=>row(host,s.name,'Saved '+s.createdAt.slice(0,16).replace('T',' ')+' · '+rankCount(s.rankByNode)+' ranks', 'REMOVE',()=>{
  if(!confirm('Remove this historical checkpoint? Original Talent Forge drafts will not be affected.'))return;
  const next=history.filter(x=>x.id!==s.id);
  if(write(KEY.history,next)){history=next;renderHistory();renderBuildSelections();renderMetrics();renderComparison();announce('Checkpoint removed.')}
 }));
}
function renderGoals(){
 const host=$('px11QuestList');host.replaceChildren();
 if(!selected()){empty(host,'Choose a manual character to maintain a personal quest log.');return}
 const related=quests.filter(x=>x.charId===activeId);
 if(!related.length)empty(host,'No personal objectives yet.','The Adventure Log is separate from original companion tasks.');
 related.forEach(q=>{
  const card=e('div','px11-row'+(q.done?' px11-quest-done':'')),check=e('input','px11-quest-check');
  check.type='checkbox';check.checked=q.done;check.setAttribute('aria-label','Mark '+q.title+' '+(q.done?'incomplete':'complete'));
  check.addEventListener('change',()=>{
   const next=quests.map(x=>x.id===q.id?{...x,done:check.checked}:x);
   if(write(KEY.quests,next)){quests=next;renderGoals();renderMetrics()}else check.checked=q.done;
  });
  const copy=e('div','px11-row-copy');copy.append(e('strong','',q.title),e('small','',q.kind+' · '+(q.done?'Marked complete manually':'Personal planning goal')));
  const del=e('button','','REMOVE');del.type='button';del.setAttribute('aria-label','Remove '+q.title);
  del.addEventListener('click',()=>{
   if(!confirm('Remove this locally saved personal objective?'))return;
   const next=quests.filter(x=>x.id!==q.id);
   if(write(KEY.quests,next)){quests=next;renderGoals();renderMetrics();announce('Objective removed.')}
  });
  card.append(check,copy,del);host.append(card);
 });
 const existing=$('px11ExistingGoals');existing.replaceChildren();
 const originalTasks=tasks.filter(t=>taskMatches(t)&&t.done!==true&&clean(t.title,100));
 const originalCollections=collections.filter(c=>c.done!==true&&clean(c.name,100));
 const boardGoals=board.filter(b=>b.done!==true&&clean(b.title,100));
 const combined=[
  ...originalTasks.map(x=>({title:clean(x.title,100),detail:'Companion task · '+clean(x.goal,45)})),
  ...originalCollections.map(x=>({title:clean(x.name,100),detail:'Global collection objective'})),
  ...boardGoals.map(x=>({title:clean(x.title,100),detail:'Command Center board · global'}))
 ];
 if(!combined.length)empty(existing,'No open original companion or global board objectives found.');
 else{
  combined.slice(0,6).forEach(x=>row(existing,x.title,x.detail,'VIEW',()=>navigate('./?enter=1&view=progress')));
  if(combined.length>6)existing.append(e('p','px11-note','Showing 6 of '+combined.length+' manual original objectives.'));
 }
}
$('px11QuestForm').addEventListener('submit',event=>{
 event.preventDefault();const title=clean($('px11QuestTitle').value,100),kind=clean($('px11QuestKind').value,50);
 if(!selected()){announce('Select or create a manual character first.');return}
 if(!title){announce('Enter an objective title.');return}
 if(quests.length>=150){announce('Quest log full. Export a backup and remove older objectives first.');return}
 const id=globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2);
 const next=[{id,charId:activeId,title,kind,done:false,createdAt:new Date().toISOString()},...quests];
 if(write(KEY.quests,next)){quests=next;$('px11QuestForm').reset();renderGoals();renderMetrics();announce('Personal objective saved in your browser.')}
});
function chooseTab(name,focus=false){
 if(!['overview','builds','journey'].includes(name))return;
 for(const value of ['overview','builds','journey']){
  const key=value[0].toUpperCase()+value.slice(1),tab=$('px11Tab'+key),view=$('px11View'+key);
  const on=value===name;tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;view.hidden=!on;
 }
 if(focus)$('px11Tab'+name[0].toUpperCase()+name.slice(1)).focus();
}
document.querySelectorAll('[data-px11-tab]').forEach(b=>{
 b.addEventListener('click',()=>chooseTab(b.dataset.px11Tab));
 b.addEventListener('keydown',event=>{
  if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();
  const arr=['overview','builds','journey'],i=arr.indexOf(b.dataset.px11Tab);
  const n=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:2))%3;chooseTab(arr[n],true);
 });
});
$('px11OpenBuildTab').addEventListener('click',()=>chooseTab('builds',true));
const selector=$('px11CharacterSelect');
for(const c of chars){
 const op=e('option','',clean(c.name,75)+' · '+(clean(c.className,38)||'Manual profile'));
 op.value=c.id;selector.append(op);
}
selector.value=activeId;
selector.addEventListener('change',()=>{
 activeId=chars.some(c=>c.id===selector.value)?selector.value:'';
 if(activeId)write(KEY.focus,activeId);
 refresh();
});
function refresh(){updateHero();renderMetrics();renderOverview();renderAssociations();renderHistory();renderGoals();renderComparison()}
renderBuildSelections();refresh();chooseTab('overview');
/* Lightweight decorative ambient layer, automatically disabled on low-power or reduced-motion. */
const media=window.matchMedia('(prefers-reduced-motion: reduce)');
const saver=!!navigator.connection?.saveData;
let preferredMode='balanced';try{const p=localStorage.getItem('nexus_visual_mode_v9');if(['cinematic','balanced','performance'].includes(p))preferredMode=p}catch(_){}
if(!media.matches&&!saver&&preferredMode!=='performance'&&!(navigator.deviceMemory&&navigator.deviceMemory<=2)){
 const host=$('px11Atmosphere'),mobile=window.matchMedia('(max-width:680px)').matches;
 if(host){
  const count=mobile?(preferredMode==='balanced'?7:11):(preferredMode==='balanced'?13:23),fragment=document.createDocumentFragment();
  const hash=n=>{const x=Math.sin(n*81.19)*43758.9;return x-Math.floor(x)};
  for(let i=0;i<count;i++){
   const flake=e('i');flake.style.setProperty('--x',(hash(i+3)*100).toFixed(2)+'%');
   flake.style.setProperty('--sz',(1.5+hash(i+4)*2.8).toFixed(1)+'px');
   flake.style.setProperty('--op',(0.12+hash(i+5)*0.37).toFixed(2));
   flake.style.setProperty('--dur',(12+hash(i+9)*17).toFixed(1)+'s');
   flake.style.setProperty('--delay',(-hash(i+8)*29).toFixed(1)+'s');
   flake.style.setProperty('--dx',((hash(i+13)-.5)*84).toFixed(1)+'px');fragment.append(flake);
  }
  host.append(fragment);
  document.addEventListener('visibilitychange',()=>document.body.classList.toggle('px11-paused',document.hidden),{passive:true});
 }
}
})();
