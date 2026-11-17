/* NEXUS | AZEROTH v16.5 — ADVENTURE INTELLIGENCE CORE
 * Client-only personal mission preparedness, not official in-game readiness.
 * All output is bounded manual planning data. No credentials, network or storage.
 */
(()=>{'use strict';
const text=(v,n=120)=>typeof v==='string'?v.trim().slice(0,n):'';
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const normId=v=>typeof v==='string'&&/^[a-z0-9-]{5,85}$/i.test(v)?v:null;
const priorities=['high','normal','low'];
const kinds=['Explore','Build prep','Equipment research','Collection','Dungeon prep','Raid prep','Other'];
const library={
 'Explore':['Review the destination and its available research','Choose a character and review the intended activity','Record travel or access questions to verify in-game','Prepare equipment and consumables manually','Review results and update this personal mission'],
 'Build prep':['Open Talent Forge and review the relevant specialization','Review manually saved ranks and selected talent choices','Check the build against current official spell data','Note encounter or activity-specific adjustments','Export or back up the manual build draft'],
 'Equipment research':['Open the Armory and inspect publicly reported equipment','Confirm the target item ID in Item Atlas','Compare source-reported item details without assuming an upgrade','Record the acquisition route to verify in-game','Update the tracked item target after review'],
 'Collection':['Review the chosen collection or acquisition goal','Check the source and the current game version','Record any prerequisites requiring confirmation','Plan the character and build for the activity','Update the personal collection notes'],
 'Dungeon prep':['Confirm dungeon and difficulty in the current game version','Review the selected character and its manual build','Research gear, encounters and support resources','Prepare a party or personal practice plan','Record completion notes manually'],
 'Raid prep':['Verify raid, difficulty and access requirements in-game','Review character and source-backed specialization data','Research boss mechanics and available role guidance','Review manually tracked equipment and consumables','Record group strategy and preparation notes'],
 'Other':['Define a specific outcome for this objective','Identify a reliable reference or source','Review the relevant character or build','Record the next practical action','Review findings and update your mission']
};
const templates=Object.freeze(Object.fromEntries(Object.entries(library).map(([k,v])=>[k,Object.freeze(v)])));
function normalizeStep(raw){
 if(!object(raw))return null;
 const title=text(raw.title,135),id=normId(raw.id);if(!title||!id)return null;
 return {id,title,done:raw.done===true};
}
function normalizeRecord(value,id){
 if(!object(value)||!normId(id))return null;
 const steps=[],seen=new Set();
 for(const entry of (Array.isArray(value.steps)?value.steps:[]).slice(0,32)){
  const step=normalizeStep(entry);
  if(!step||seen.has(step.id))continue;seen.add(step.id);steps.push(step);
  if(steps.length===20)break;
 }
 return {priority:priorities.includes(value.priority)?value.priority:'normal',
  pinned:value.pinned===true,notes:text(value.notes,1100),steps,
  updatedAt:text(value.updatedAt,36),version:1};
}
function normalizeState(value){
 const input=object(value)?value:{},records={},bookmarks=[];
 const source=object(input.records)?input.records:{};
 for(const [id,raw]of Object.entries(source).slice(0,140)){
  if(!normId(id)||Object.keys(records).length>=120)continue;
  const valid=normalizeRecord(raw,id);if(valid)records[id]=valid;
 }
 const seen=new Set();
 for(const zoneId of (Array.isArray(input.bookmarks)?input.bookmarks:[]).slice(0,100)){
  if(!window.NexusWorldEngineCoreV16?.zoneById(zoneId)||seen.has(zoneId))continue;
  seen.add(zoneId);bookmarks.push(zoneId);if(bookmarks.length===45)break;
 }
 return {format:'nexus.adventure-intelligence/1',records,bookmarks};
}
const stamp=()=>new Date().toISOString();
const makeId=()=>{try{return crypto.randomUUID()}catch(_){return 'step-'+Date.now()+'-'+Math.random().toString(36).slice(2,10)}};
function generateSteps(goal){
 const kind=kinds.includes(goal?.category)?goal.category:'Other';
 return (templates[kind]||templates.Other).map((title,i)=>({id:'step-'+(i+1)+'-'+Math.random().toString(36).slice(2,10),title,done:false}));
}
function ensureRecord(state,goal){
 const base=normalizeState(state),id=normId(goal?.id);
 if(!id)return null;
 const existing=base.records[id];if(existing)return {...existing,steps:existing.steps.map(x=>({...x}))};
 return {priority:'normal',pinned:false,notes:'',steps:generateSteps(goal),updatedAt:stamp(),version:1};
}
function rankGoals(goals,state){
 const current=normalizeState(state),weights={high:0,normal:1,low:2};
 return (Array.isArray(goals)?goals:[]).filter(g=>g&&normId(g.id)).slice(0,150)
  .map(goal=>({goal,plan:current.records[goal.id]||null}))
  .sort((a,b)=>(Number(b.plan?.pinned===true)-Number(a.plan?.pinned===true))||
   ((a.goal.status==='completed')-(b.goal.status==='completed'))||
   ((weights[a.plan?.priority||'normal']??1)-(weights[b.plan?.priority||'normal']??1))||
   ((a.goal.status==='active'?0:1)-(b.goal.status==='active'?0:1))||
   String(b.goal.createdAt||'').localeCompare(String(a.goal.createdAt||'')));
}
function inspect(goal,record,{characters=[],drafts=[],items=[]}={}){
 const r=record?normalizeRecord(record,goal?.id):null;
 const steps=r?.steps||[],done=steps.filter(s=>s.done).length;
 const cleanChars=Array.isArray(characters)?characters:[],cleanDrafts=Array.isArray(drafts)?drafts:[],cleanItems=Array.isArray(items)?items:[];
 const character=goal?.charId?cleanChars.find(c=>c?.id===goal.charId):null;
 const draft=goal?.buildKey?cleanDrafts.find(d=>[text(d?.identity,130),text(d?.savedAt,40),text(d?.name,75)].join('::')===goal.buildKey):null;
 const item=goal?.itemId?cleanItems.find(i=>Number(i?.id)===Number(goal.itemId)):null;
 return {done,total:steps.length,percent:steps.length?Math.round(done*100/steps.length):0,
  state:r?.priority||'normal',pinned:r?.pinned===true,
  linked:{character:!!character,draft:!!draft,item:!!item},
  labels:{character:text(character?.name,75),draft:text(draft?.name,75),item:text(item?.name,90)},
  notices:[
   goal?.charId&&!character?'The manually linked character is no longer available in this browser.':null,
   goal?.buildKey&&!draft?'The manually linked Forge draft is no longer available in this browser.':null,
   goal?.itemId&&!item?'The manually linked item ID is not currently in the local Item Atlas.':null
  ].filter(Boolean),
  disclaimer:'Planning checklist completion only. Does not measure actual gear readiness, DPS, boss eligibility or verified game completion.'};
}
function brief(goal,record,details={}){
 const inspection=inspect(goal,record,details),r=normalizeRecord(record||{},goal?.id)||{notes:'',steps:[]};
 return {format:'nexus.expedition-brief/1',exportedAt:stamp(),
  source:'Locally saved manual planning data — no account, location or game achievement verification',
  mission:{title:text(goal?.title,110),destination:window.NexusWorldEngineCoreV16?.zoneById(goal?.zoneId)?.name||'Unknown',
   goalId:normId(goal?.id),status:text(goal?.status,20),type:text(goal?.category,40)},
  planning:{priority:r.priority,notes:r.notes,steps:r.steps,completed:r.steps.filter(s=>s.done).length,
   total:r.steps.length,percent:inspection.percent},
  links:{character:inspection.labels.character||null,draft:inspection.labels.draft||null,
   item:inspection.labels.item||null},disclaimer:inspection.disclaimer};
}
function checklistText(goal,record,details={}){
 const b=brief(goal,record,details),steps=b.planning.steps;
 return [
 'NEXUS | EXPEDITION BRIEF — PERSONAL MANUAL PLAN',
 b.mission.title+' · '+b.mission.destination,
 'Priority: '+b.planning.priority+' · Planning checklist: '+b.planning.completed+'/'+b.planning.total,
 ...steps.map(s=>(s.done?'[x] ':'[ ] ')+s.title),
 'Notes: '+(b.planning.notes||'None'),
 b.disclaimer
 ].join('\n').slice(0,8000);
}
window.NexusAdventureIntelligenceV165=Object.freeze({templates,kinds,priorities,text,normId,normalizeStep,
 normalizeRecord,normalizeState,generateSteps,ensureRecord,rankGoals,inspect,brief,checklistText,makeId,stamp});
})();