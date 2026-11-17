/* NEXUS | AZEROTH v16.0 — CURATED LIVING WORLD ATLAS
 * The drawn map is not official cartography or player coordinates.
 * Mission records are manual browser-local plans, never game completion.
 * Only user-directed save/status/delete writes nexus_world_atlas_goals_v16.
 */
(()=>{'use strict';
const core=window.NexusWorldEngineCoreV16,root=document.getElementById('nx16Atlas');
if(!core||!root)return;
const $=id=>document.getElementById(id),e=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const K={goals:'nexus_world_atlas_goals_v16',profiles:'nexus_azeroth_companion_genesis_v1',focus:'nexus_player_focus_v11',
 drafts:'nexus_azeroth_talent_forge_v1',items:'nexus_azeroth_item_atlas_v1'};
const read=(key,limit=3200000)=>{try{const v=localStorage.getItem(key);return v&&v.length<limit?JSON.parse(v):null}catch(_){return null}};
const list=raw=>Array.isArray(raw)?raw.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[];
const chars=()=>list(read(K.profiles)?.characters).map(core.characterize).filter(Boolean).slice(0,200);
const drafts=()=>list(read(K.drafts)).filter(d=>d&&typeof d.identity==='string'&&typeof d.name==='string'&&d.rankByNode&&typeof d.rankByNode==='object').slice(0,65);
const items=()=>list(read(K.items)).filter(x=>x&&typeof x.name==='string'&&Number.isSafeInteger(Number(x.id))&&Number(x.id)>0).slice(0,180);
const draftKey=d=>[core.safeText(d.identity,130),core.safeText(d.savedAt,40),core.safeText(d.name,75)].join('::');
let goals=core.cleanGoals(read(K.goals,700000)),regionId='eastern-kingdoms',zoneFilter='';
function status(message){$('nx16GoalStatus').textContent=message}
function write(next){
 try{const raw=JSON.stringify(next);if(raw.length>200000)throw Error('Local mission storage limit reached');
  localStorage.setItem(K.goals,raw);goals=next;return true;
 }catch(_){status('Mission could not be stored. Your previous goals and original companion records remain unchanged.');return false}
}
const url=new URL(location.href),requested=core.zoneById(url.searchParams.get('zone'));
if(requested)regionId=requested.regionId;
$('nx16CountRegions').textContent=String(core.regions.length);
$('nx16CountZones').textContent=String(core.zones.length);
const regionsHost=$('nx16RegionPins'),strip=$('nx16RegionStrip');
for(const region of core.regions){
 const pin=e('button','nx16-map-pin nx16-accent-'+region.accent);
 pin.type='button';pin.dataset.region=region.id;pin.style.left=region.x+'%';pin.style.top=region.y+'%';
 pin.setAttribute('aria-label','Explore '+region.name);pin.innerHTML='<span aria-hidden="true">✦</span><strong></strong>';pin.querySelector('strong').textContent=region.name;
 regionsHost.append(pin);
 const chip=e('button','nx16-region-chip',region.name);chip.type='button';chip.dataset.region=region.id;strip.append(chip);
}
function zoneMatches(zone){
 const q=zoneFilter;if(!q)return true;
 const region=core.regionById(zone.regionId);
 return [zone.name,zone.description,zone.kind,region?.name].some(x=>String(x||'').toLowerCase().includes(q));
}
function updateRegion(){
 const region=core.regionById(regionId)||core.regions[0];
 const all=core.zones.filter(x=>x.regionId===region.id),zones=all.filter(zoneMatches);
 $('nx16RegionName').textContent=region.name;
 $('nx16RegionSummary').textContent=region.group+' · curated research area. Select a destination to connect it with a manual planning objective.';
 const regionArt=$('nx16RegionArt');regionArt.className='nx16-region-art nx16-region-art-'+region.art;
 const regionMeta=$('nx16RegionMeta');regionMeta.replaceChildren();
 regionMeta.append(e('span','',all.length+' curated destination'+(all.length===1?'':'s')),
  e('span','','SCHEMATIC REGION · NO LIVE POSITION'));
 const host=$('nx16Destinations');host.replaceChildren();
 if(!zones.length)host.append(e('p','nx16-empty','No destinations matching the current filter in this region.'));
 zones.forEach(z=>{
  const row=e('article','nx16-destination');row.setAttribute('role','listitem');
  const copy=e('div');copy.append(e('strong','',z.name),e('small','',z.kind+' · '+z.description));
  const action=e('button','','PLAN HERE ↗');action.type='button';action.dataset.zone=z.id;
  row.append(copy,action);host.append(row);
 });
 document.querySelectorAll('[data-region]').forEach(b=>{
  const active=b.dataset.region===region.id;
  b.classList.toggle('nx16-region-active',active);b.setAttribute('aria-pressed',String(active));
  const filterVisible=!zoneFilter||region.name.toLowerCase().includes(zoneFilter)||core.zones.some(z=>z.regionId===region.id&&zoneMatches(z));
  b.hidden=!filterVisible;
 });
}
function setRegion(id){
 if(!core.regionById(id))return;
 regionId=id;updateRegion();updateZones();
}
function updateZones(){
 const select=$('nx16GoalZone'),old=select.value;
 select.replaceChildren();const initial=e('option','','Choose research destination');initial.value='';select.append(initial);
 core.zones.filter(z=>z.regionId===regionId).forEach(z=>{
  const op=e('option','',z.name);op.value=z.id;select.append(op);
 });
 const fromQuery=requested?.id;
 select.value=core.zoneById(old)?.regionId===regionId?old:(fromQuery&&core.zoneById(fromQuery)?.regionId===regionId?fromQuery:'');
}
$('nx16RegionPins').addEventListener('click',event=>{
 const btn=event.target.closest('button[data-region]');if(btn)setRegion(btn.dataset.region);
});
$('nx16RegionStrip').addEventListener('click',event=>{
 const btn=event.target.closest('button[data-region]');if(btn){setRegion(btn.dataset.region);$('nx16RegionName').scrollIntoView({block:'nearest',behavior:'smooth'})}
});
$('nx16Destinations').addEventListener('click',event=>{
 const btn=event.target.closest('button[data-zone]');if(!btn)return;
 $('nx16GoalZone').value=btn.dataset.zone;
 const selected=core.zoneById(btn.dataset.zone);
 $('nx16GoalTitle').value='Explore '+selected.name;
 $('nx16Missions').scrollIntoView({block:'start',behavior:'smooth'});
 $('nx16GoalTitle').focus({preventScroll:true});
});
$('nx16ZoneFilter').addEventListener('input',event=>{
 zoneFilter=core.safeText(event.target.value,95).toLowerCase().trim();
 if(zoneFilter){
  const current=core.zones.filter(z=>z.regionId===regionId&&zoneMatches(z));
  if(!current.length){
   const next=core.regions.find(r=>r.name.toLowerCase().includes(zoneFilter)||
    core.zones.some(z=>z.regionId===r.id&&zoneMatches(z)));
   if(next)regionId=next.id;
  }
 }
 updateRegion();updateZones();
});
function loadAssociations(){
 const select=$('nx16GoalCharacter'),old=select.value;
 select.replaceChildren();const blank=e('option','','Shared / all local characters');blank.value='';select.append(blank);
 chars().forEach(c=>{const op=e('option','',c.name+(c.className?' · '+c.className:''));op.value=c.id;select.append(op)});
 let focus='';try{focus=localStorage.getItem(K.focus)||''}catch(_){}
 select.value=chars().some(x=>x.id===old)?old:chars().some(x=>x.id===focus)?focus:'';
 const build=$('nx16GoalDraft'),oldBuild=build.value;build.replaceChildren();
 const noBuild=e('option','','No build linked');noBuild.value='';build.append(noBuild);
 drafts().forEach(d=>{const option=e('option','',core.safeText(d.name,75)+' · '+core.safeText(d.specName,55));option.value=draftKey(d);build.append(option)});
 build.value=drafts().some(x=>draftKey(x)===oldBuild)?oldBuild:'';
 const item=$('nx16GoalItem'),oldItem=item.value;item.replaceChildren();
 const noItem=e('option','','No item target linked');noItem.value='';item.append(noItem);
 items().forEach(t=>{const op=e('option','',core.safeText(t.name,82)+' · #'+t.id);op.value=String(t.id);item.append(op)});
 item.value=items().some(t=>String(t.id)===oldItem)?oldItem:'';
}
function renderGoals(){
 const all=core.sortedGoals(goals,{status:$('nx16GoalFilter').value});
 $('nx16CountMissions').textContent=String(goals.length);
 $('nx16CountOpen').textContent=String(goals.filter(g=>g.status!=='completed').length);
 const host=$('nx16GoalRows');host.replaceChildren();
 if(!all.length){host.append(e('div','nx16-goal-empty','No matching local missions. Create an objective to begin.'));return}
 const byId=new Map(chars().map(x=>[x.id,x.name]));
 all.forEach(goal=>{
  const area=e('article','nx16-mission-card');
  const top=e('div','nx16-mission-head'),summary=e('div');
  summary.append(e('small','',core.zoneById(goal.zoneId)?.name+' · '+goal.category),
   e('strong','',goal.title));
  const select=e('select','nx16-goal-status');select.dataset.id=goal.id;select.setAttribute('aria-label','Manually set status for '+goal.title);
  for(const [v,label] of [['planned','PLANNED'],['active','IN PROGRESS'],['completed','MANUALLY COMPLETED']]){
   const opt=e('option','',label);opt.value=v;select.append(opt);
  }
  select.value=goal.status;
  top.append(summary,select);area.append(top);
  const info=e('p','',goal.notes||'No notes yet');area.append(info);
  const details=e('div','nx16-mission-links');if(goal.charId&&byId.has(goal.charId))details.append(e('span','','CHARACTER · '+byId.get(goal.charId)));
  if(goal.buildKey)details.append(e('span','','LINKED MANUAL BUILD'));
  if(goal.itemId)details.append(e('span','','ITEM ID · '+goal.itemId));
  const go=e('a','','RESEARCH DESTINATION ↗');go.href='./world-atlas.html?zone='+encodeURIComponent(goal.zoneId);
  const action=e('button','','DELETE');action.type='button';action.dataset.delete=goal.id;
  details.append(go,action);area.append(details);host.append(area);
 });
}
$('nx16GoalForm').addEventListener('submit',event=>{
 event.preventDefault();
 if(goals.length>=120){status('120-mission limit reached. Export your mission log before adding more.');return}
 const zone=$('nx16GoalZone').value,title=core.safeText($('nx16GoalTitle').value,110);
 const charId=$('nx16GoalCharacter').value,buildKey=$('nx16GoalDraft').value,itemId=$('nx16GoalItem').value;
 if(!core.zoneById(zone)||!title){status('Select a known destination and enter a mission title.');return}
 if(charId&&!chars().some(c=>c.id===charId)){status('Choose a valid locally saved character.');return}
 if(buildKey&&!drafts().some(d=>draftKey(d)===buildKey)){status('The linked build is no longer available; please reselect.');return}
 if(itemId&&!items().some(t=>String(t.id)===itemId)){status('The linked item target is no longer available; please reselect.');return}
 const goal=core.newGoal({zoneId:zone,title,category:$('nx16GoalCategory').value,status:'planned',
  charId,buildKey,itemId:itemId||null,notes:$('nx16GoalNotes').value});
 if(!goal){status('Mission details could not be validated.');return}
 if(write([goal,...goals])){
  $('nx16GoalTitle').value='';$('nx16GoalNotes').value='';
  status('Saved local mission for '+core.zoneById(goal.zoneId).name+'. No Blizzard account or game data was changed.');renderGoals();
 }
});
$('nx16GoalFilter').addEventListener('change',renderGoals);
$('nx16GoalRows').addEventListener('change',event=>{
 const select=event.target.closest('select[data-id]');if(!select)return;
 const goal=goals.find(x=>x.id===select.dataset.id);if(!goal)return;
 if(!core.stageKinds.includes(select.value))return;
 const next=goals.map(x=>x.id===goal.id?{...x,status:select.value}:x);
 if(write(next)){status('Manual mission status updated; this is not game-completion verification.');renderGoals()}
 else select.value=goal.status;
});
$('nx16GoalRows').addEventListener('click',event=>{
 const btn=event.target.closest('button[data-delete]');if(!btn)return;
 const goal=goals.find(x=>x.id===btn.dataset.delete);if(!goal)return;
 if(!confirm('Delete this manually saved atlas mission? Other companion objectives and builds remain unchanged.'))return;
 if(write(goals.filter(x=>x.id!==goal.id))){status('Only the selected atlas mission was deleted.');renderGoals()}
});
$('nx16ExportGoals').addEventListener('click',()=>{
 try{
  const data={format:'nexus.world-atlas-manual-goals/1',exportedAt:new Date().toISOString(),source:'Browser-local plans only; no Blizzard completion or account data',goals};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),href=URL.createObjectURL(blob),a=e('a');
  a.href=href;a.download='nexus-world-atlas-v16-missions.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),2000);status('Your local mission log was exported. Review personal details before sharing.');
 }catch(_){status('Export unavailable in this browser. Original missions remain unchanged.')}
});
window.addEventListener('storage',event=>{
 if(event.key===K.goals){goals=core.cleanGoals(read(K.goals,700000));renderGoals()}
 if([K.profiles,K.focus,K.drafts,K.items].includes(event.key))loadAssociations();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){goals=core.cleanGoals(read(K.goals,700000));loadAssociations();renderGoals()}});
updateRegion();updateZones();loadAssociations();renderGoals();
})();