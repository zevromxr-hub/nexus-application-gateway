/* NEXUS | AZEROTH v17 — SOVEREIGN ADVENTURE OPERATIONS
 * All edits are explicit actions. Only nexus_adventure_operations_v17 is written.
 * Atlas goals, v16.5 checklists, character data and Forge drafts are always read-only.
 */
(()=>{'use strict';
const root=document.getElementById('nx17Root'),world=window.NexusWorldEngineCoreV16,
 prep=window.NexusAdventureIntelligenceV165,ops=window.NexusAdventureOperationsV17;
if(!root||!world||!prep||!ops)return;
const $=id=>document.getElementById(id);
const K={goals:'nexus_world_atlas_goals_v16',plans:'nexus_adventure_intelligence_v165',
 profiles:'nexus_azeroth_companion_genesis_v1',drafts:'nexus_azeroth_talent_forge_v1',
 items:'nexus_azeroth_item_atlas_v1'};
const element=(tag,cls,value)=>{const el=document.createElement(tag);
 if(cls)el.className=cls;if(value!==undefined)el.textContent=String(value);return el};
const read=(key,limit=1200000)=>{try{const s=localStorage.getItem(key);return s&&s.length<limit?JSON.parse(s):null}catch(_){return null}};
const objects=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[];
const context=()=>({
 characters:objects(read(K.profiles)?.characters).map(world.characterize).filter(Boolean).slice(0,220),
 drafts:objects(read(K.drafts)).filter(d=>typeof d.name==='string'&&typeof d.identity==='string').slice(0,100),
 items:objects(read(K.items)).filter(i=>typeof i.name==='string'&&Number(i.id)>0).slice(0,180)
});
let goalList=world.cleanGoals(read(K.goals,700000));
let planRecords=prep.normalizeState(read(K.plans,350000)).records;
let lastRaw=null;
try{lastRaw=localStorage.getItem(ops.KEY)}catch(_){}
let state=ops.normalizeState(read(ops.KEY,120000)),formDirty=false,stale=false,pendingImport=null;
const requested=new URL(location.href).searchParams.get('mission');
function tell(message){$('nx17Toast').textContent=message}
function mark(value){$('nx17SavedState').textContent=value}
function sourceRefresh(){
 goalList=world.cleanGoals(read(K.goals,700000));
 planRecords=prep.normalizeState(read(K.plans,350000)).records;
}
function save(next,message){
 try{
  if(stale||localStorage.getItem(ops.KEY)!==lastRaw){stale=true;tell('Another tab changed your v17 session. Reload this page to review its latest changes; no records were overwritten.');mark('OTHER TAB CHANGED SESSION');return false}
  const clean=ops.normalizeState(next),serialized=JSON.stringify(clean);
  if(serialized.length>70000)throw Error('v17 session limit exceeded');
  localStorage.setItem(ops.KEY,serialized);
  lastRaw=serialized;state=clean;stale=false;
  if(message)tell(message);
  renderLibrary();renderAgenda();renderStats();
  mark(formDirty?'DETAILS NOT YET SAVED':'SAVED IN THIS BROWSER');return true;
 }catch(_){tell('Unable to save this session in browser storage. Original mission and build data remain unchanged.');return false}
}
function loadForm(){
 $('nx17Name').value=state.title;$('nx17Date').value=state.date;
 $('nx17Notes').value=state.notes;
 populateCharacters();
 $('nx17Character').value=context().characters.some(c=>c.id===state.characterId)?state.characterId:'';
 formDirty=false;mark('SAVED IN THIS BROWSER');
}
function populateCharacters(){
 const chars=context().characters;
 for(const [id,placeholder] of [['nx17Character','No character selected'],['nx17CharacterFilter','All local characters']]){
  const el=$(id),old=el.value;el.replaceChildren();
  const first=element('option','',placeholder);first.value='';el.append(first);
  chars.forEach(c=>{const option=element('option','',c.name+(c.className?' · '+c.className:''));option.value=c.id;el.append(option)});
  el.value=chars.some(c=>c.id===old)?old:'';
 }
}
function visibleGoals(){
 const q=ops.clean($('nx17Search').value,100).toLowerCase(),status=$('nx17Status').value,
 char=$('nx17CharacterFilter').value;
 return prep.rankGoals(goalList,{records:planRecords}).map(r=>r.goal).filter(g=>
  (!status||g.status===status)&&(!char||!g.charId||g.charId===char)&&
  (!q||[g.title,g.category,g.notes,world.zoneById(g.zoneId)?.name].some(x=>String(x||'').toLowerCase().includes(q))));
}
function renderLibrary(){
 const host=$('nx17Library');host.replaceChildren();
 const goals=visibleGoals(),has=new Set(state.entries.map(e=>e.id));
 $('nx17AvailableCount').textContent=goals.length+' found';
 if(!goals.length){host.append(element('p','nx17-empty',goalList.length?'No local missions match your filters.':'You have no Atlas missions yet. Create one in World Atlas to begin.'));return}
 goals.forEach(goal=>{
  const row=element('article','nx17-library-card');
  if(goal.id===requested)row.classList.add('nx17-requested');
  const zone=world.zoneById(goal.zoneId),meta=element('div','nx17-library-copy');
  meta.append(element('span','nx17-card-kicker',goal.category+' · '+goal.status),element('strong','',goal.title),
   element('small','',zone?.name||'Unknown destination'));
  const btn=element('button','nx17-add',has.has(goal.id)?'IN SESSION ✓':'+ ADD');
  btn.type='button';btn.dataset.add=goal.id;btn.disabled=has.has(goal.id)||state.entries.length>=18;
  btn.setAttribute('aria-label',has.has(goal.id)?'Already in session: '+goal.title:'Add mission: '+goal.title);
  row.append(meta,btn);host.append(row);
 });
}
function renderStats(){
 const view=ops.overview(state,goalList,planRecords,context());
 $('nx17Count').textContent=String(view.planned);
 $('nx17Checks').textContent=view.checked+' / '+view.total;
 $('nx17Budget').textContent=view.budget+'m';
 $('nx17Links').textContent=String(view.connections);
 $('nx17OrderCount').textContent=view.planned+' / 18';
}
function action(tag,text,actionName,id,disabled=false){
 const el=element('button','nx17-action',text);el.type='button';el.dataset.action=actionName;
 el.dataset.mission=id;el.disabled=disabled;return el;
}
function linkedRow(label,detail,ok){
 const div=element('span','nx17-connection '+(ok?'nx17-present':'nx17-unknown'),label+': '+detail);
 return div;
}
function renderAgenda(){
 const host=$('nx17Agenda');host.replaceChildren();
 const view=ops.overview(state,goalList,planRecords,context());
 if(!view.rows.length){
  const empty=element('div','nx17-empty-agenda');
  empty.append(element('strong','','YOUR NEXT CHAPTER STARTS HERE'),element('p','','Choose an existing World Atlas mission from the library. Your original mission data stays unchanged.'));
  const link=element('a','','OPEN WORLD ATLAS ↗');link.href='./world-atlas.html#nx16Missions';empty.append(link);host.append(empty);return;
 }
 view.rows.forEach((r,i)=>{
  const card=element('article','nx17-agenda-card'+(r.missing?' nx17-missing':'')),
   heading=element('div','nx17-agenda-head'),
   number=element('span','nx17-num',String(i+1).padStart(2,'0')),
   headingCopy=element('div','nx17-agenda-title');
  headingCopy.append(element('span','nx17-card-kicker',r.goal?(r.goal.category+' · '+r.goal.status):'ATLAS SOURCE MISSING'),
   element('h4','',r.goal?.title||'This Atlas mission is no longer available'),
   element('small','',r.zone?.name||'Removed or inaccessible Atlas destination'));
  const buttons=element('div','nx17-order-actions');
  buttons.append(action('button','↑','up',r.entry.id,i===0),action('button','↓','down',r.entry.id,i===view.rows.length-1),
   action('button','REMOVE','remove',r.entry.id));
  heading.append(number,headingCopy,buttons);card.append(heading);
  const data=element('div','nx17-agenda-data');
  const gauge=element('div','nx17-gauge');
  if(r.inspection){
   gauge.append(element('strong','',r.inspection.done+'/'+r.inspection.total+' CHECKED BY YOU'),
    element('span','','MANUAL CHECKLIST · '+r.inspection.percent+'%'));
   const rail=element('div','nx17-rail'),fill=element('div','nx17-fill');
   fill.style.width=r.inspection.percent+'%';rail.append(fill);gauge.append(rail);
  }else gauge.append(element('strong','','MISSING ORIGINAL MISSION'),
   element('span','','Remove this entry or restore the Atlas mission from your own backup'));
  data.append(gauge);
  const timeLabel=element('label','nx17-control nx17-time','PERSONAL ESTIMATE');
  const time=element('select');time.dataset.duration=r.entry.id;time.setAttribute('aria-label','Personal time estimate for '+(r.goal?.title||'missing mission'));
  [0,15,30,45,60,90,120,180,240].forEach(n=>{const o=element('option','',n?n+' minutes':'Not estimated');o.value=n;time.append(o)});
  if(![0,15,30,45,60,90,120,180,240].includes(r.entry.minutes)){
   const o=element('option','',r.entry.minutes+' minutes');o.value=r.entry.minutes;time.append(o);
  }
  time.value=String(r.entry.minutes);timeLabel.append(time);data.append(timeLabel);card.append(data);
  const links=element('div','nx17-links');
  if(r.inspection){
   const l=r.inspection;
   links.append(linkedRow('CHARACTER',l.linked.character?l.labels.character:(r.goal?.charId?'Link unavailable':'Not linked'),l.linked.character),
    linkedRow('FORGE',l.linked.draft?l.labels.draft:(r.goal?.buildKey?'Link unavailable':'Not linked'),l.linked.draft),
    linkedRow('ITEM',l.linked.item?l.labels.item:(r.goal?.itemId?'Link unavailable':'Not linked'),l.linked.item));
  }
  card.append(links);
  if(r.inspection?.notices?.length){
   const warning=element('p','nx17-warning',r.inspection.notices.join(' '));card.append(warning);
  }
  const note=element('label','nx17-control nx17-entry-note','PERSONAL OBJECTIVE NOTE');
  const input=element('input');input.type='text';input.maxLength=400;input.value=r.entry.note;
  input.placeholder='The next practical action to check or try';input.dataset.entrynote=r.entry.id;
  note.append(input);card.append(note);
  if(r.goal){
   const a=element('div','nx17-deep-links');
   const prepLink=element('a','','EDIT PREP CHECKLIST ↗');prepLink.href='./expedition-console.html?mission='+encodeURIComponent(r.goal.id);
   const mapLink=element('a','','DESTINATION ↗');mapLink.href='./world-atlas.html?zone='+encodeURIComponent(r.goal.zoneId);
   const forgeLink=element('a','','TALENT FORGE ↗');forgeLink.href='./?enter=1&view=talents';
   a.append(prepLink,mapLink,forgeLink);card.append(a);
  }
  host.append(card);
 });
}
function redraw(){renderLibrary();renderAgenda();renderStats()}
$('nx17Library').addEventListener('click',event=>{
 const btn=event.target.closest('button[data-add]');if(!btn)return;
 const id=btn.dataset.add;
 if(!goalList.some(g=>g.id===id)){tell('That Atlas mission is unavailable. Reload the original Atlas to review it.');return}
 if(state.entries.length>=18){tell('The maximum is 18 session objectives. Remove one to make room.');return}
 save(ops.add(state,id),'Mission added to your private session; original Atlas record unchanged.');
});
$('nx17Agenda').addEventListener('click',event=>{
 const btn=event.target.closest('button[data-action]');if(!btn)return;
 const id=btn.dataset.mission;
 const actionType=btn.dataset.action;
 if(actionType==='remove'){save(ops.remove(state,id),'Removed from this v17 session only. Original Atlas mission preserved.');return}
 if(actionType==='up'||actionType==='down')save(ops.move(state,id,actionType==='up'?-1:1),'Personal session order updated.');
});
$('nx17Agenda').addEventListener('change',event=>{
 const target=event.target;
 if(target.matches('select[data-duration]'))save(ops.update(state,target.dataset.duration,{minutes:target.value}),'Personal time estimate saved. This is not an actual travel or completion time.');
 if(target.matches('input[data-entrynote]'))save(ops.update(state,target.dataset.entrynote,{note:target.value}),'Personal objective note saved.');
});
for(const id of ['nx17Search','nx17Status','nx17CharacterFilter']){
 $(id).addEventListener(id==='nx17Search'?'input':'change',renderLibrary);
}
for(const id of ['nx17Name','nx17Date','nx17Notes','nx17Character']){
 $(id).addEventListener('input',()=>{formDirty=true;mark('DETAILS NOT YET SAVED')});
 $(id).addEventListener('change',()=>{formDirty=true;mark('DETAILS NOT YET SAVED')});
}
$('nx17SessionForm').addEventListener('submit',event=>{
 event.preventDefault();
 if(save({...state,title:$('nx17Name').value,date:$('nx17Date').value,
   characterId:$('nx17Character').value,notes:$('nx17Notes').value},'Session details saved privately.')){
  formDirty=false;mark('SAVED IN THIS BROWSER');loadForm();
 }
});
$('nx17Export').addEventListener('click',()=>{
 try{
  const payload={format:'nexus.adventure-operations-backup/1',exportedAt:new Date().toISOString(),
   session:ops.normalizeState(state),brief:ops.brief(state,goalList,planRecords,context())};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),
    a=element('a');a.href=u;a.download='nexus-adventure-operations-v17-session.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),2500);
  tell('Exported this v17 session and source-labeled briefing. Review your private notes before sharing.');
 }catch(_){tell('Export unavailable. Your original browser records have not changed.')}
});
$('nx17Copy').addEventListener('click',async()=>{
 try{
  if(!navigator.clipboard?.writeText)throw Error('No clipboard');
  await navigator.clipboard.writeText(ops.briefingText(ops.brief(state,goalList,planRecords,context())));
  tell('Copied personal expedition briefing. It contains no OAuth or Blizzard credentials.');
 }catch(_){tell('Clipboard permission was unavailable; use Export JSON Brief instead.')}
});
$('nx17Clear').addEventListener('click',()=>{
 if(!confirm('Reset ONLY the v17 session, including order, session notes and personal estimates? All Atlas missions, existing preparation checklists, Forge drafts and characters will be retained.'))return;
 if(save(ops.empty(),'Cleared the v17 session only; every original mission and build remains unchanged.'))loadForm();
});
$('nx17ImportFile').addEventListener('change',async event=>{
 pendingImport=null;$('nx17Import').disabled=true;$('nx17ImportPreview').textContent='No valid session selected.';
 const file=event.target.files?.[0];if(!file)return;
 if(file.size>100000){$('nx17ImportPreview').textContent='File exceeds the 100 KB safety limit.';return}
 try{
  const raw=JSON.parse(await file.text());
  if(!raw||raw.format!=='nexus.adventure-operations-backup/1'||!raw.session||
   raw.session.format!==ops.FORMAT)throw Error('Invalid format');
  pendingImport=ops.normalizeState(raw.session);
  const available=goalList.filter(g=>pendingImport.entries.some(e=>e.id===g.id)).length;
  $('nx17ImportPreview').textContent='Preview: '+pendingImport.title+' · '+pendingImport.entries.length+
   ' objectives ('+available+' still available in this browser), '+pendingImport.entries.reduce((n,e)=>n+e.minutes,0)+
   ' manually estimated minutes. Review before replacing your v17 session.';
  $('nx17Import').disabled=false;
 }catch(_){$('nx17ImportPreview').textContent='Unrecognized or unsafe v17 session file. No data changed.'}
});
$('nx17Import').addEventListener('click',()=>{
 if(!pendingImport)return;
 if(!confirm('Replace ONLY the local v17 session with the reviewed JSON? Existing v16 Atlas missions and v16.5 checklists will NOT be changed.'))return;
 const candidate=pendingImport;
 if(save(candidate,'Imported v17 session. Check any unavailable Atlas links before using it.')){
  loadForm();pendingImport=null;$('nx17Import').disabled=true;$('nx17ImportFile').value='';
  $('nx17ImportPreview').textContent='Import successful. Original studios were not modified.';
 }
});
window.addEventListener('storage',event=>{
 if(event.key===ops.KEY){stale=true;mark('OTHER TAB CHANGED SESSION');tell('Your v17 session changed in another tab. Reload to review newer changes; unsaved edits here were not overwritten.')}
 if([K.goals,K.plans,K.profiles,K.drafts,K.items].includes(event.key)){
  sourceRefresh();
  const oldChar=$('nx17Character').value,oldFilter=$('nx17CharacterFilter').value;
  populateCharacters();
  $('nx17Character').value=context().characters.some(c=>c.id===oldChar)?oldChar:'';
  $('nx17CharacterFilter').value=context().characters.some(c=>c.id===oldFilter)?oldFilter:'';
  redraw();
 }
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){sourceRefresh();redraw()}});
loadForm();redraw();
})();