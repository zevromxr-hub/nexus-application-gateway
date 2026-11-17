/* NEXUS | AZEROTH v17 — SOVEREIGN ADVENTURE OPERATIONS
 * Pure, bounded manual session planning. No credentials, browser storage or networking.
 * Existing v16 World Atlas goals and v16.5 preparation records are READ ONLY.
 */
(()=>{'use strict';
const KEY='nexus_adventure_operations_v17';
const FORMAT='nexus.adventure-operations/1';
const clean=(v,max=120)=>typeof v==='string'?v.trim().slice(0,max):'';
const validId=v=>typeof v==='string'&&/^[a-z0-9-]{5,85}$/i.test(v);
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const cleanDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v?v:'';
const minutes=v=>v===''||v===null||v===undefined?0:(Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<=240?Number(v):0);
const empty=()=>({format:FORMAT,title:'My Adventure Session',date:'',characterId:'',notes:'',entries:[]});
function normalizeEntry(raw){
 if(!isObj(raw)||!validId(raw.id))return null;
 return {id:raw.id,minutes:minutes(raw.minutes),note:clean(raw.note,400)};
}
function normalizeState(raw){
 const src=isObj(raw)?raw:{},entries=[],seen=new Set();
 for(const value of (Array.isArray(src.entries)?src.entries:[]).slice(0,80)){
  const e=normalizeEntry(value);
  if(!e||seen.has(e.id))continue;
  entries.push(e);seen.add(e.id);
  if(entries.length>=18)break;
 }
 return {format:FORMAT,title:clean(src.title,90)||'My Adventure Session',date:cleanDate(src.date),
  characterId:clean(src.characterId,150),notes:clean(src.notes,900),entries};
}
function add(state,id){
 const s=normalizeState(state);
 if(!validId(id)||s.entries.some(e=>e.id===id)||s.entries.length>=18)return s;
 return {...s,entries:[...s.entries,{id,minutes:0,note:''}]};
}
function remove(state,id){
 const s=normalizeState(state);return {...s,entries:s.entries.filter(e=>e.id!==id)};
}
function move(state,id,delta){
 const s=normalizeState(state),i=s.entries.findIndex(e=>e.id===id),next=i+(delta===-1?-1:delta===1?1:0);
 if(i<0||next<0||next>=s.entries.length||next===i)return s;
 const entries=s.entries.slice(),tmp=entries[i];entries[i]=entries[next];entries[next]=tmp;
 return {...s,entries};
}
function update(state,id,patch){
 const s=normalizeState(state);
 if(!isObj(patch))return s;
 return {...s,entries:s.entries.map(e=>e.id!==id?e:{
  ...e,...('minutes'in patch?{minutes:minutes(patch.minutes)}:{}),
  ...('note'in patch?{note:clean(patch.note,400)}:{})})};
}
function overview(state,goals,records,contexts={}){
 const s=normalizeState(state),world=window.NexusWorldEngineCoreV16,engine=window.NexusAdventureIntelligenceV165;
 const safeGoals=world?world.cleanGoals(goals):[],byId=new Map(safeGoals.map(g=>[g.id,g]));
 const safeRecords=isObj(records)?records:{};
 const rows=s.entries.map((entry,index)=>{
  const goal=byId.get(entry.id)||null;
  const record=goal?(safeRecords[goal.id]||engine?.ensureRecord({records:safeRecords},goal)):null;
  const inspection=goal&&engine?engine.inspect(goal,record,contexts):null;
  const zone=goal&&world?world.zoneById(goal.zoneId):null;
  return {index,entry,goal,record,inspection,zone,missing:!goal};
 });
 const available=rows.filter(x=>!x.missing),checked=available.reduce((sum,x)=>sum+(x.inspection?.done||0),0),
 total=available.reduce((sum,x)=>sum+(x.inspection?.total||0),0);
 const budget=rows.reduce((sum,x)=>sum+x.entry.minutes,0);
 const linkage=available.reduce((count,x)=>count+['character','draft','item'].filter(k=>x.inspection?.linked?.[k]).length,0);
 return {rows,available:available.length,missing:rows.length-available.length,checked,total,
  budget,planned:rows.length,connections:linkage,percent:total?Math.round(100*checked/total):0};
}
function brief(state,goals,records,contexts={}){
 const s=normalizeState(state),view=overview(s,goals,records,contexts);
 return {format:'nexus.adventure-session-brief/1',generatedAt:new Date().toISOString(),
  source:'Private browser-local manual plan only. No account, live readiness or gameplay verification.',
  session:{title:s.title,date:s.date||null,characterId:s.characterId||null,notes:s.notes,plannedMinutes:view.budget},
  preparation:{checked:view.checked,total:view.total,percent:view.percent},
  objectives:view.rows.map(row=>({
   position:row.index+1,goalId:row.entry.id,missing:row.missing,
   title:row.goal?.title||'Original Atlas mission unavailable',
   destination:row.zone?.name||'Unavailable',category:row.goal?.category||null,
   manualStatus:row.goal?.status||null,plannedMinutes:row.entry.minutes,
   note:row.entry.note,
   preparationChecks:row.inspection?{done:row.inspection.done,total:row.inspection.total}:null,
   links:row.inspection?{
    character:row.inspection.labels.character||null,
    draft:row.inspection.labels.draft||null,
    item:row.inspection.labels.item||null,
    notices:row.inspection.notices.slice(0,3)
   }:null
  })),
  disclaimer:'Times are personal estimates, not travel times. Checklist percentages are manual planning actions; no character ownership, gear power, quest progress or game eligibility is verified.'};
}
function briefingText(b){
 const rows=b.objectives.map(r=>r.position+'. '+r.title+' · '+r.destination+
  (r.missing?' [source missing]':'')+' | personal estimate '+(r.plannedMinutes||'unspecified')+
  ' min | '+(r.preparationChecks?(r.preparationChecks.done+'/'+r.preparationChecks.total+' manual checks'):'no source')+
  (r.note?' | '+r.note:''));
 return ['NEXUS | SOVEREIGN ADVENTURE OPERATIONS — MANUAL SESSION',b.session.title,
  'Planned day: '+(b.session.date||'Not scheduled')+' · Personal time budget: '+b.session.plannedMinutes+' minutes',
  'Preparation actions: '+b.preparation.checked+'/'+b.preparation.total,
  ...rows,'Session notes: '+(b.session.notes||'None'),b.disclaimer].join('\n').slice(0,13000);
}
window.NexusAdventureOperationsV17=Object.freeze({KEY,FORMAT,empty,clean,cleanDate,validId,
 minutes,normalizeEntry,normalizeState,add,remove,move,update,overview,brief,briefingText});
})();