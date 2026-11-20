/* NEXUS | AZEROTH v22 — LIVING ADVENTURE DIRECTOR
 * Deterministic local planning from original v16 goals/v17 sessions/v22 map
 * pins and opt-in saved Blizzard PUBLIC research. Never writes older keys,
 * redirects login, fabricates progress, or fetches private Blizzard profiles.
 */
(()=>{'use strict';
const core=window.NexusLivingIntelligenceV22,root=document.getElementById('nx22Director');
if(!core||!root)return;
const $=id=>document.getElementById(id),el=(tag,cls,value)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n
};
const oldKeys={goals:'nexus_world_atlas_goals_v16',routes:'nexus_atlas_routes_v181',
 operations:'nexus_adventure_operations_v17',profile:'nexus_azeroth_companion_genesis_v1'};
const read=(key,max=550000)=>{
 try{const raw=localStorage.getItem(key);return raw&&raw.length<=max?JSON.parse(raw):null}catch(_){return null}
};
const save=next=>{
 try{localStorage.setItem(core.KEYS.director,JSON.stringify(core.normalDirector(next)));return true}
 catch(_){notice('Browser could not save these optional planning preferences.',true);return false}
};
const names=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).slice(0,200):[];
let raw=null,settings=core.normalDirector(read(core.KEYS.director,9000)),currentPlan=null,currentResearch=null;
function notice(msg,error=false){$('nx22DirectorStatus').textContent=msg;$('nx22DirectorStatus').dataset.error=String(error)}
function cleanCharacter(c){return c&&typeof c==='object'&&typeof c.id==='string'&&typeof c.name==='string'?
 {id:c.id.slice(0,150),name:c.name.slice(0,80),realm:String(c.realm||'').slice(0,80),spec:String(c.spec||'').slice(0,60)}:null}
function refresh(){
 raw={goals:names(read(oldKeys.goals,650000)),routes:read(oldKeys.routes,200000),
  operations:read(oldKeys.operations,250000),profile:read(oldKeys.profile,700000),
  waypoints:core.cleanWaypoints(read(core.KEYS.waypoints,200000)),
  research:core.cleanResearch(read(core.KEYS.research,160000))};
 const all=names(raw.profile?.characters).map(cleanCharacter).filter(Boolean).slice(0,150);
 const select=$('nx22DirectorCharacter'),previous=select.value||settings.focus;
 select.replaceChildren();
 const any=el('option','','All browser-local characters');any.value='';select.append(any);
 for(const c of all){const opt=el('option','',c.name+(c.realm?' · '+c.realm:''));opt.value=c.id;select.append(opt)}
 const focus=all.find(x=>x.id===previous)?previous:'';
 select.value=focus;settings.focus=focus;
 $('nx22DirectorGoals').textContent=String(raw.goals.filter(g=>g.status==='active'||g.status==='planned').length);
 $('nx22DirectorPins').textContent=String(raw.waypoints.length);
 $('nx22DirectorSessions').textContent=String(names(raw.operations?.entries).length);
 $('nx22DirectorResearch').textContent=String(raw.research.length);
 generate();
}
function selectResearch(){
 if(!raw.research.length)return null;
 const char=names(raw.profile?.characters).find(c=>c.id===settings.focus);
 if(!char)return settings.focus?null:raw.research[0];
 return raw.research.find(r=>{
  const name=String(char.name||'').toLowerCase(),realm=String(char.realm||'').toLowerCase().replace(/\s+/g,'-');
  return r.selector.name===name&&(!realm||r.selector.realm===realm)
 })||null;
}
function rowLink(url,title,cls=''){
 const a=el('a',cls,title);a.href=url;return a
}
function generate(){
 settings=core.normalDirector({...settings,focus:$('nx22DirectorCharacter').value,
  mode:$('nx22DirectorMode').value,budget:Number($('nx22DirectorBudget').value)});
 currentResearch=selectResearch();
 currentPlan=core.plan({
  settings,goals:raw.goals,waypoints:raw.waypoints,operations:raw.operations,research:currentResearch
 });
 renderPlan();renderPrep();renderResearch();
}
function renderResearch(){
 const host=$('nx22DirectorResearchPanel');host.replaceChildren();
 host.append(el('strong','',currentResearch?'DATED BLIZZARD PUBLIC EQUIPMENT REPORT':'OPTIONAL BLIZZARD CHARACTER RESEARCH'));
 if(currentResearch){
  const r=currentResearch,stats=core.slotSummary(r);
  host.append(el('span','',r.character.name+' · '+r.character.className+' · '+r.character.spec),
   el('small','','Captured '+new Date(r.fetchedAt).toLocaleString()+
    ' · '+stats.reportedSlots+' reported equipment slots · equipped item level '+(stats.reportedEquippedItemLevel??'unavailable')));
  host.append(el('p','', 'Research snapshot only—its equipment state is not refreshed or verified against gameplay right now.'));
 }else{
  host.append(el('p','','No matching opt-in Blizzard gear snapshot saved for this selection. That does not mean your character has no gear.'));
 }
 host.append(rowLink('./character-intelligence.html','RESEARCH EQUIPMENT ↗','nx22-link'));
}
function renderPlan(){
 const plan=currentPlan,host=$('nx22DirectorAgenda');host.replaceChildren();
 $('nx22DirectorOutcome').textContent=settings.mode.toUpperCase()+' SESSION · '+settings.budget+' MIN BUDGET';
 const completed=plan.scheduled.filter(s=>settings.checks[s.id]).length;
 $('nx22DirectorSummary').textContent=plan.scheduled.length+' action'+(plan.scheduled.length===1?'':'s')+
  ' · '+plan.estimatedMinutes+' min suggested · '+completed+' marked done manually';
 const zoneMap=core.zoneMap;
 for(const [i,step] of plan.scheduled.entries()){
  const article=el('article','nx22-agenda-card'),head=el('div','nx22-agenda-card-head');
  const num=el('span','nx22-agenda-number',String(i+1).padStart(2,'0'));
  const title=el('div','nx22-agenda-title');title.append(el('strong','',step.title),
   el('small','',step.kind==='goal'?(zoneMap.get(step.zoneId)?.name||step.zoneId)+' · '+step.source:'CURATED STARTING POINT · '+step.source));
  head.append(num,title,el('span','nx22-agenda-time',step.minutes+' MIN'));
  const details=el('p','',step.detail);
  const actions=el('div','nx22-agenda-actions');
  const check=el('label','nx22-agenda-check'),input=el('input');input.type='checkbox';
  input.dataset.nx22Check=step.id;input.checked=!!settings.checks[step.id];
  check.append(input,el('span','',input.checked?'MANUALLY MARKED COMPLETE':'MARK COMPLETE MANUALLY'));
  actions.append(check,rowLink(step.href,step.kind==='goal'?'OPEN DESTINATION ↗':'OPEN WORLD ATLAS ↗'));
  const waypoint=raw.waypoints.filter(p=>p.zoneId===step.zoneId);
  if(waypoint.length){
   actions.append(rowLink('./world-atlas.html?zone='+encodeURIComponent(step.zoneId)+'#nx22Atlas',
    waypoint.length+' EXACT SAVED COORDINATE'+(waypoint.length===1?'':'S')+' ↗'));
  }
  article.append(head,details,actions);host.append(article);
 }
}
function renderPrep(){
 const host=$('nx22DirectorPrep');host.replaceChildren();
 for(const item of currentPlan.preparation){
  const card=el('article','nx22-prep-card');
  card.append(el('span','nx22-eyebrow',item.source.toUpperCase()),
   el('strong','',item.title),el('p','',item.detail),
   rowLink(item.href,'OPEN RELATED STUDIO ↗'));
  host.append(card);
 }
}
$('nx22DirectorForm').addEventListener('submit',event=>{
 event.preventDefault();generate();
 notice('Generated a proposed session from your own plans. Only checking a step or explicitly saving preferences writes v22 data.');
 $('nx22DirectorAgenda').scrollIntoView({behavior:'smooth',block:'nearest'});
});
$('nx22SaveSettings').addEventListener('click',()=>{
 generate();
 if(save(settings))notice('Saved your v22 focus, activity preference, budget and manual checkmarks locally. All older studios are unchanged.');
});
$('nx22DirectorAgenda').addEventListener('change',event=>{
 const chk=event.target.closest('input[data-nx22-check]');
 if(!chk||!currentPlan?.scheduled.some(s=>s.id===chk.dataset.nx22Check))return;
 const next={...settings,checks:{...settings.checks}};
 if(chk.checked)next.checks[chk.dataset.nx22Check]=true;
 else delete next.checks[chk.dataset.nx22Check];
 if(!save(next)){chk.checked=!chk.checked;return}
 settings=core.normalDirector(next);renderPlan();
 notice('Updated only this manual v22 briefing checkbox—not World of Warcraft quest or achievement data.');
});
const describe=()=>{
 const plan=currentPlan;
 return [
  'NEXUS | AZEROTH v22 LIVING INTELLIGENCE',
  'Local manual planning · '+new Date().toLocaleString(),
  'Activity '+settings.mode+' · '+settings.budget+' min budget · '+plan.estimatedMinutes+' min suggested',
  'Equipment research '+(currentResearch?'Blizzard public snapshot captured '+currentResearch.fetchedAt:'Not saved/linked'),
  'SESSION STEPS:',
  ...plan.scheduled.map((s,i)=>(settings.checks[s.id]?'[x] ':'[ ] ')+(i+1)+'. '+s.title+' · '+s.minutes+' min (estimate)'+
    (s.zoneId?' · '+core.zoneMap.get(s.zoneId)?.name:'')+' · '+s.source),
  'PREPARATION:',
  ...plan.preparation.map(s=>'[ ] '+s.title+' · '+s.source),
  plan.disclaimer
 ].join('\n');
};
$('nx22CopyPlan').addEventListener('click',async()=>{
 const value=describe();
 try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
 else{const t=el('textarea');t.value=value;document.body.append(t);t.select();
  if(!document.execCommand('copy'))throw Error('Clipboard blocked');t.remove()}
  notice('Copied a source-labeled local adventure briefing. No server requests were made.');
 }catch(_){notice('Clipboard unavailable. Use Export JSON instead.',true)}
});
$('nx22ExportPlan').addEventListener('click',()=>{
 const data={format:'nexus.living-intelligence-brief/1',version:core.VERSION,
  exportedAt:new Date().toISOString(),settings:{mode:settings.mode,budget:settings.budget},
  plan:currentPlan,research:currentResearch?{
   selector:currentResearch.selector,fetchedAt:currentResearch.fetchedAt,
   source:currentResearch.source,reportedEquipmentCount:currentResearch.items.length
  }:null};
 const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(b),
  a=el('a');a.href=url;a.download='nexus-v22-personal-adventure-brief.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 notice('Exported the plan as JSON with source labels; the existing Adventure Operations session was not overwritten.');
});
window.addEventListener('storage',event=>{
 if([core.KEYS.waypoints,core.KEYS.research,core.KEYS.director,...Object.values(oldKeys)].includes(event.key)){
  if(event.key===core.KEYS.director){
   settings=core.normalDirector(read(core.KEYS.director,9000));
   $('nx22DirectorMode').value=settings.mode;$('nx22DirectorBudget').value=String(settings.budget);
  }
  refresh();
 }
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
$('nx22DirectorMode').value=settings.mode;
$('nx22DirectorBudget').value=String(settings.budget);
refresh();
notice('Ready. Your original World Atlas, Adventure Operations and Character Nexus data were read without modifying them.');
})();