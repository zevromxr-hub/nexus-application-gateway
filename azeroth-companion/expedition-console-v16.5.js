/* NEXUS | AZEROTH v16.5 — EXPEDITION CONSOLE
 * All readiness and checklist progress are MANUAL. No live game/APIs, no auth.
 * Writes only nexus_adventure_intelligence_v165 after user actions.
 * Original Atlas goals, character profiles, Forge ranks and item records read-only.
 */
(()=>{'use strict';
const root=document.getElementById('nx165Console'),
 world=window.NexusWorldEngineCoreV16,engine=window.NexusAdventureIntelligenceV165;
if(!root||!world||!engine)return;
const $=id=>document.getElementById(id);
const elem=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=String(value);return el};
const K={plans:'nexus_adventure_intelligence_v165',goals:'nexus_world_atlas_goals_v16',
 profiles:'nexus_azeroth_companion_genesis_v1',focus:'nexus_player_focus_v11',
 drafts:'nexus_azeroth_talent_forge_v1',items:'nexus_azeroth_item_atlas_v1'};
const read=(key,limit=2400000)=>{try{const raw=localStorage.getItem(key);return raw&&raw.length<limit?JSON.parse(raw):null}catch(_){return null}};
const list=raw=>Array.isArray(raw)?raw.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[];
const getChars=()=>list(read(K.profiles)?.characters).map(world.characterize).filter(Boolean).slice(0,220);
const getDrafts=()=>list(read(K.drafts)).filter(d=>d&&typeof d.name==='string'&&typeof d.identity==='string').slice(0,100);
const getItems=()=>list(read(K.items)).filter(i=>i&&typeof i.name==='string'&&Number(i.id)>0).slice(0,180);
let goals=world.cleanGoals(read(K.goals,700000)),
 state=engine.normalizeState(read(K.plans,350000)),selectedId='',noteDirty=false;
const drafts=new Map();
const requested=new URL(location.href).searchParams.get('mission');
const charOptions=getChars();
const chooseGoal=id=>goals.find(g=>g.id===id)||null;
const notice=message=>$('nx165Toast').textContent=message;
function freshGoals(){goals=world.cleanGoals(read(K.goals,700000));}
function saveState(next,word){
 try{
  const verified=engine.normalizeState(next);
  const serialized=JSON.stringify(verified);
  if(serialized.length>330000)throw Error('The private planning storage limit has been reached');
  localStorage.setItem(K.plans,serialized);
  state=verified;if(word)notice(word);return true;
 }catch(_){notice('Browser storage could not save this change. Original mission and Forge records are unchanged.');return false}
}
function planFor(goal){
 if(!goal)return null;
 const current=state.records[goal.id]||drafts.get(goal.id);
 if(current)return current;
 const generated=engine.ensureRecord(state,goal);if(generated)drafts.set(goal.id,generated);
 return generated;
}
function savePlan(goal,next,message){
 if(!goal||!next)return false;
 const normalized=engine.normalizeRecord({...next,updatedAt:engine.stamp()},goal.id);
 if(!normalized)return false;
 const records={...state.records,[goal.id]:normalized};
 if(saveState({...state,records},message)){drafts.set(goal.id,normalized);return true}
 return false;
}
function detailFor(goal,plan){
 return engine.inspect(goal,plan,{characters:getChars(),drafts:getDrafts(),items:getItems()});
}
function fillCharacters(){
 const select=$('nx165CharFilter'),old=select.value,options=getChars();
 select.replaceChildren();
 const any=elem('option','','All local characters');any.value='';select.append(any);
 options.forEach(c=>{const el=elem('option','',c.name+(c.className?' · '+c.className:''));el.value=c.id;select.append(el)});
 select.value=options.some(c=>c.id===old)?old:'';
}
function scopedGoals(){
 const charId=$('nx165CharFilter').value,
 status=$('nx165StatusFilter').value,
 q=engine.text($('nx165Query').value,110).toLowerCase();
 return engine.rankGoals(goals,state).map(x=>x.goal).filter(g=>
  (!charId||!g.charId||g.charId===charId)&&(!status||g.status===status)&&
  (!q||[g.title,g.notes,g.category,world.zoneById(g.zoneId)?.name].some(v=>String(v||'').toLowerCase().includes(q)))
 );
}
function updateStats(){
 $('nx165Total').textContent=String(goals.length);
 $('nx165Priority').textContent=String(goals.filter(g=>state.records[g.id]?.priority==='high').length);
 const stored=goals.map(g=>state.records[g.id]).filter(Boolean);
 $('nx165Steps').textContent=String(stored.reduce((a,r)=>a+r.steps.length,0));
 $('nx165Completed').textContent=String(stored.reduce((a,r)=>a+r.steps.filter(s=>s.done).length,0));
}
function renderQueue(){
 const host=$('nx165MissionQueue');host.replaceChildren();
 const missions=scopedGoals();
 $('nx165QueueCount').textContent=missions.length+' mission'+(missions.length===1?'':'s');
 if(!missions.length){host.append(elem('p','nx165-queue-empty',goals.length?'No missions match the current filters.':'No World Atlas missions yet. Create your first mission in the Atlas.'));return}
 missions.forEach(g=>{
  const plan=planFor(g),info=detailFor(g,plan),button=elem('button','nx165-queue-item');
  button.type='button';button.dataset.mission=g.id;button.classList.toggle('nx165-active',g.id===selectedId);
  button.setAttribute('aria-pressed',String(g.id===selectedId));
  const top=elem('span','nx165-queue-tag',(plan.pinned?'★ PINNED · ':'')+plan.priority.toUpperCase()+' PRIORITY');
  const heading=elem('strong','',g.title);
  const caption=elem('small','',(world.zoneById(g.zoneId)?.name||'Research destination')+' · '+g.status);
  const progress=elem('span','nx165-queue-progress',info.done+'/'+info.total+' CHECKS');
  button.append(top,heading,caption,progress);host.append(button);
 });
}
function renderSteps(goal,plan){
 const host=$('nx165StepsList');host.replaceChildren();
 if(!plan.steps.length)host.append(elem('p','nx165-no-steps','This expedition has no preparation tasks. Add a personal step below or reset the category template.'));
 plan.steps.forEach((step,i)=>{
  const row=elem('div','nx165-step');
  const input=elem('input');input.type='checkbox';input.checked=step.done;
  input.id='nx165-check-'+i;input.dataset.step=step.id;input.setAttribute('aria-label','Complete manual preparation step: '+step.title);
  const label=elem('label','',step.title);label.htmlFor=input.id;
  const remove=elem('button','','×');remove.type='button';remove.dataset.removeStep=step.id;remove.setAttribute('aria-label','Remove preparation step: '+step.title);
  row.append(input,label,remove);row.classList.toggle('nx165-done',step.done);host.append(row);
 });
}
function linkCard(title,value,source,connected){
 const card=elem('div','nx165-linked-card');card.classList.toggle('nx165-found',connected);
 card.append(elem('small','',title),elem('strong','',value),elem('span','',source));return card;
}
function renderSelected(){
 const goal=chooseGoal(selectedId),empty=$('nx165Empty'),active=$('nx165Active');
 if(!goal){
  active.hidden=true;empty.hidden=false;
  $('nx165SelectedName').textContent='SELECT AN EXPEDITION.';
  $('nx165SelectedZone').textContent='Create or choose a mission from the World Atlas.';
  $('nx165SelectedCategory').textContent='MISSION INTELLIGENCE';
  $('nx165Pin').disabled=true;$('nx165OpenZone').href='./world-atlas.html';return;
 }
 empty.hidden=true;active.hidden=false;
 const plan=planFor(goal),info=detailFor(goal,plan),zone=world.zoneById(goal.zoneId);
 $('nx165SelectedName').textContent=goal.title;
 $('nx165SelectedCategory').textContent=goal.category.toUpperCase()+' · '+goal.status.toUpperCase();
 $('nx165SelectedZone').textContent=(zone?.name||'Curated destination')+' · '+(world.regionById(zone?.regionId)?.name||'World Atlas');
 $('nx165OpenZone').href='./world-atlas.html?zone='+encodeURIComponent(goal.zoneId);
 const pinned=$('nx165Pin');pinned.disabled=false;
 pinned.textContent=plan.pinned?'★ PINNED':'☆ PIN MISSION';pinned.setAttribute('aria-pressed',String(plan.pinned));
 $('nx165PrioritySelect').value=plan.priority;
 $('nx165ProgressNumber').textContent=info.percent+'%';
 $('nx165ProgressFill').style.width=info.percent+'%';
 $('nx165ProgressCaption').textContent=info.done+' of '+info.total+' steps manually marked complete';
 renderSteps(goal,plan);
 $('nx165Notes').value=plan.notes;noteDirty=false;
 const links=$('nx165LinkedRecords');links.replaceChildren();
 links.append(linkCard('LOCAL CHARACTER',goal.charId?(info.labels.character||'LINK UNAVAILABLE'):'NOT LINKED',
  info.linked.character?'Manual profile exists in this browser':'No verified live character ownership',info.linked.character));
 links.append(linkCard('TALENT FORGE DRAFT',goal.buildKey?(info.labels.draft||'LINK UNAVAILABLE'):'NOT LINKED',
  info.linked.draft?'Manual saved draft present':'No live build optimization claimed',info.linked.draft));
 links.append(linkCard('ITEM ATLAS RECORD',goal.itemId?(info.labels.item||'LINK UNAVAILABLE'):'NOT LINKED',
  info.linked.item?'Manual tracked ID #'+goal.itemId:'No official gear acquisition verified',info.linked.item));
 const warnings=$('nx165LinkWarnings');warnings.replaceChildren();
 if(!info.notices.length)warnings.append(elem('span','','Linked records are browser-local references only, not Blizzard-verified readiness.'));
 info.notices.forEach(x=>warnings.append(elem('span','nx165-link-warning','⚠ '+x)));
}
function redraw(){
 updateStats();
 const filtered=scopedGoals();
 if(!filtered.some(g=>g.id===selectedId))selectedId=filtered[0]?.id||'';
 renderQueue();renderSelected();
}
function switchGoal(next){
 if(next===selectedId)return;
 if(noteDirty&&!confirm('Your field notes are not saved. Switch missions and discard unsaved changes?'))return;
 selectedId=next;redraw();
 const url=new URL(location.href);if(next)url.searchParams.set('mission',next);else url.searchParams.delete('mission');
 history.replaceState(null,'',url.pathname+url.search+url.hash);
}
$('nx165MissionQueue').addEventListener('click',event=>{
 const button=event.target.closest('button[data-mission]');if(button)switchGoal(button.dataset.mission);
});
$('nx165CharFilter').addEventListener('change',()=>{if(noteDirty&&!confirm('Discard unsaved field notes when changing the character filter?')){return}noteDirty=false;redraw()});
for(const id of ['nx165StatusFilter','nx165Query'])$(id).addEventListener(id==='nx165Query'?'input':'change',()=>{
 if(noteDirty){notice('Save your field notes before switching to another mission.');return}redraw();
});
$('nx165PrioritySelect').addEventListener('change',event=>{
 const goal=chooseGoal(selectedId),plan=planFor(goal);if(!goal||!plan)return;
 if(!engine.priorities.includes(event.target.value))return;
 if(savePlan(goal,{...plan,priority:event.target.value},'Personal mission priority saved.'))redraw();
});
$('nx165Pin').addEventListener('click',()=>{
 const goal=chooseGoal(selectedId),plan=planFor(goal);if(!goal||!plan)return;
 if(savePlan(goal,{...plan,pinned:!plan.pinned},'Personal mission pin updated.'))redraw();
});
$('nx165StepsList').addEventListener('change',event=>{
 const checkbox=event.target.closest('input[data-step]');if(!checkbox)return;
 const goal=chooseGoal(selectedId),plan=planFor(goal);if(!goal||!plan)return;
 const steps=plan.steps.map(s=>s.id===checkbox.dataset.step?{...s,done:checkbox.checked}:s);
 if(savePlan(goal,{...plan,steps},'Personal preparation progress saved.')){updateStats();renderQueue();renderProgress(goal)}
 else checkbox.checked=!checkbox.checked;
});
function renderProgress(goal){
 const plan=planFor(goal),info=detailFor(goal,plan);
 $('nx165ProgressNumber').textContent=info.percent+'%';
 $('nx165ProgressFill').style.width=info.percent+'%';
 $('nx165ProgressCaption').textContent=info.done+' of '+info.total+' steps manually marked complete';
 renderSteps(goal,plan);
}
$('nx165StepsList').addEventListener('click',event=>{
 const button=event.target.closest('button[data-remove-step]');if(!button)return;
 const goal=chooseGoal(selectedId),plan=planFor(goal);if(!goal||!plan)return;
 if(!confirm('Remove this personal checklist item? This will not change the World Atlas goal.'))return;
 const steps=plan.steps.filter(s=>s.id!==button.dataset.removeStep);
 if(savePlan(goal,{...plan,steps},'Checklist item removed.')){updateStats();renderQueue();renderProgress(goal)}
});
$('nx165AddStep').addEventListener('submit',event=>{
 event.preventDefault();
 const goal=chooseGoal(selectedId),plan=planFor(goal);if(!goal||!plan)return;
 if(plan.steps.length>=20){notice('Maximum 20 personal preparation steps per mission.');return}
 const title=engine.text($('nx165StepText').value,135);if(!title)return;
 const steps=[...plan.steps,{id:engine.makeId(),title,done:false}];
 if(savePlan(goal,{...plan,steps},'Preparation step added.')){
  $('nx165StepText').value='';updateStats();renderQueue();renderProgress(goal)
 }
});
$('nx165Reset').addEventListener('click',()=>{
 const goal=chooseGoal(selectedId),plan=planFor(goal);if(!goal||!plan)return;
 if(!confirm('Replace this mission’s preparation checklist with its original category template? This resets only v16.5 checklist progress.'))return;
 if(savePlan(goal,{...plan,steps:engine.generateSteps(goal)},'Manual preparation template restored.')){
  updateStats();renderQueue();renderProgress(goal)
 }
});
$('nx165Notes').addEventListener('input',()=>{noteDirty=true;notice('Field notes changed but not saved. Choose Save Field Notes.')});
$('nx165SaveNotes').addEventListener('click',()=>{
 const goal=chooseGoal(selectedId),plan=planFor(goal);if(!goal||!plan)return;
 const notes=engine.text($('nx165Notes').value,1100);
 if(savePlan(goal,{...plan,notes},'Private field notes saved locally.'))noteDirty=false;
});
function prepareBrief(){
 const goal=chooseGoal(selectedId);if(!goal)return null;
 const plan=planFor(goal);return {goal,plan,details:{characters:getChars(),drafts:getDrafts(),items:getItems()}};
}
$('nx165Export').addEventListener('click',()=>{
 const data=prepareBrief();if(!data)return;
 if(noteDirty){notice('Save your field notes before exporting, or your unsaved changes will not be included.');return}
 try{
  const bundle=engine.brief(data.goal,data.plan,data.details),blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'});
  const uri=URL.createObjectURL(blob),a=elem('a');a.href=uri;a.download='nexus-expedition-brief-v16.5.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(uri),2600);
  notice('Manual Expedition Brief downloaded. Review notes and names before sharing.');
 }catch(_){notice('The export could not be created by this browser. Original records remain unchanged.')}
});
$('nx165Copy').addEventListener('click',async()=>{
 const data=prepareBrief();if(!data)return;
 if(noteDirty){notice('Save the edited notes before copying this checklist.');return}
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard write unavailable');
  await navigator.clipboard.writeText(engine.checklistText(data.goal,data.plan,data.details));
  notice('Personal preparation checklist copied; it is not in-game verification.');
 }catch(_){notice('Clipboard access was unavailable. Use Export Expedition Brief instead.')}
});
window.addEventListener('storage',event=>{
 if(event.key===K.plans){state=engine.normalizeState(read(K.plans,350000));drafts.clear();if(!noteDirty)redraw();}
 if(event.key===K.goals){freshGoals();if(!noteDirty)redraw();}
 if([K.profiles,K.drafts,K.items].includes(event.key)){fillCharacters();if(!noteDirty)redraw();}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!noteDirty){freshGoals();state=engine.normalizeState(read(K.plans,350000));fillCharacters();redraw()}});
fillCharacters();
selectedId=engine.normId(requested)&&chooseGoal(requested)?requested:engine.rankGoals(goals,state)[0]?.goal?.id||'';
redraw();
})();