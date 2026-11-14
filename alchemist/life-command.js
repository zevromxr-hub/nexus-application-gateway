// PROXIMUS | Companion Edition v3.3 — Life Command
// Private planning on the current browser/device. No background notifications or accounts.
import {$,wrap} from './core.js';
import {saveOrShare} from './portable-kit.js';
import {
 LIFE_STORAGE,LIFE_SCHEMA,LIFE_LIMIT,normalizeLifeData,normalizeLifeItem,
 lifeStats,filterLife,nextOccurrence,dayDistance,localDay,toggleLifeDone,
 streakFor,isCompleted,lifeCalendar,lifeExport,lifeImport
} from './life-command-core.js';

function id(){
 if(crypto.randomUUID)return crypto.randomUUID();
 const a=new Uint8Array(16);crypto.getRandomValues(a);
 return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
}
function dateText(d){
 if(!d)return 'No due date';
 const date=new Date(d+'T12:00:00');
 return Number.isNaN(date.valueOf())?d:date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}
function textNode(tag,value,cls=''){
 const n=document.createElement(tag);n.textContent=value;if(cls)n.className=cls;return n;
}
export function initLifeCommand(app){
 const root=$('lifeCommandStudio');
 if(!root)return;
 const el=id=>$(id),holder=el('lifeList'),status=el('lifeStatus');
 const today=()=>localDay();
 let state=normalizeLifeData(),editId=null,scope='active';
 try{state=normalizeLifeData(JSON.parse(localStorage.getItem(LIFE_STORAGE)||'{}'));}catch(e){}
 function say(msg,error=false){status.textContent=msg;status.dataset.error=error?'true':'false';}
 function persist(){
  try{
   localStorage.setItem(LIFE_STORAGE,JSON.stringify(state));
   document.dispatchEvent(new Event('proximus-life-changed'));
   return true;
  }catch(e){
   say('Device storage unavailable or full. Export Life Command JSON to keep your changes.',true);
   return false;
  }
 }
 const form=el('lifeForm');
 const title=el('lifeTitle'),kind=el('lifeKind'),date=el('lifeDate'),repeat=el('lifeRepeat'),
  priority=el('lifePriority'),category=el('lifeCategory'),note=el('lifeNote');
 function clearForm(){
  form.reset();editId=null;el('lifeSave').textContent='＋ Add to Life Command';
  el('lifeCancelEdit').hidden=true;
 }
 function populate(item){
  title.value=item.title;kind.value=item.kind;date.value=item.date;
  repeat.value=item.repeat;priority.value=item.priority;
  category.value=item.category;note.value=item.note;
  editId=item.id;el('lifeSave').textContent='Save changes';el('lifeCancelEdit').hidden=false;
  title.focus();form.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 function updateSummary(){
  const stats=lifeStats(state.items,today());
  el('lifeTotal').textContent=String(stats.total);
  el('lifeDue').textContent=String(stats.soon);
  el('lifeDone').textContent=String(stats.doneToday);
  el('lifeRoutines').textContent=String(stats.routines);
  el('lifeCount').textContent=state.items.length+' / '+LIFE_LIMIT+' personal entries · local only';
  el('lifeAttention').textContent=stats.overdue>0?
   stats.overdue+' overdue item'+(stats.overdue===1?'':'s')+' · review your plans.':
   stats.soon>0?stats.soon+' items due in the next 7 days.':'Your upcoming dates are clear.';
 }
 function render(){
  updateSummary();holder.replaceChildren();
  const list=filterLife(state.items,{query:el('lifeSearch').value,kind:el('lifeFilterKind').value,
    status:el('lifeFilterStatus').value,today:today()});
  for(const item of list.slice(0,250)){
   const card=document.createElement('article');
   card.className='life-entry'+(isCompleted(item,today())?' done':'');
   const head=document.createElement('div');head.className='life-entry-head';
   const complete=document.createElement('button');complete.className='life-done-button';
   complete.type='button';complete.textContent=isCompleted(item,today())?'✓':'○';
   complete.setAttribute('aria-label',(isCompleted(item,today())?'Mark incomplete: ':'Complete: ')+item.title);
   complete.addEventListener('click',()=>{
    const idx=state.items.findIndex(x=>x.id===item.id);if(idx<0)return;
    state.items[idx]=toggleLifeDone(state.items[idx],today());
    persist();render();
   });
   const text=document.createElement('div');text.className='life-entry-title';
   const label=textNode('strong',item.title);
   const detail=textNode('small',[item.kind.toUpperCase(),item.category,
    item.date?dateText(nextOccurrence(item,today())):'No due date',
    item.repeat==='none'?'':item.repeat+' repeat'].filter(Boolean).join(' · '));
   text.append(label,detail);head.append(complete,text);
   const extra=document.createElement('div');extra.className='life-entry-extra';
   if(item.priority==='high')extra.append(textNode('span','HIGH PRIORITY','life-pill urgent'));
   const due=nextOccurrence(item,today()),days=dayDistance(today(),due);
   if(days!==null&&!isCompleted(item,today())){
    extra.append(textNode('span',days<0?'OVERDUE':days===0?'DUE TODAY':days===1?'TOMORROW':
     days<=7?'IN '+days+' DAYS':'UPCOMING','life-pill'+(days<0?' urgent':'')));
   }
   if(item.repeat==='daily'){
    const streak=streakFor(item,today());
    extra.append(textNode('span','✦ '+streak+'-day streak','life-pill'));
   }
   if(item.note)extra.append(textNode('p',item.note,'life-note'));
   const actions=document.createElement('div');actions.className='life-entry-actions';
   const edit=document.createElement('button');edit.className='small-btn';edit.textContent='Edit';
   edit.addEventListener('click',()=>populate(item));
   const remove=document.createElement('button');remove.className='small-btn';remove.textContent='Delete';
   remove.addEventListener('click',()=>{
    if(!confirm('Delete "'+item.title+'"? It will be removed only from this device.'))return;
    state.items=state.items.filter(x=>x.id!==item.id);
    if(editId===item.id)clearForm();
    persist();render();say('Deleted one Life Command entry.');
   });
   actions.append(edit,remove);card.append(head,extra,actions);holder.append(card);
  }
  if(!list.length){
   const empty=textNode('div',state.items.length?'Nothing matches this view. Try a different filter.':
    'Create your first task, recurring routine, or important date above.','life-empty');
   holder.append(empty);
  }
  if(list.length>250)holder.append(textNode('p','Showing 250 entries. Refine your search to see more.','hint'));
 }
 form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!title.value.trim())return say('Enter a title first.',true);
  if(!editId&&state.items.length>=LIFE_LIMIT)return say('Your planner is at the 350-item limit. Export and archive old entries.',true);
  const old=state.items.find(x=>x.id===editId);
  const now=Date.now(),next=normalizeLifeItem({
   id:old?.id||id(),title:title.value,kind:kind.value,date:date.value,
   repeat:repeat.value,priority:priority.value,category:category.value,
   note:note.value,created:old?.created||now,updated:now,
   done:old?.done||false,doneDays:old?.doneDays||[]
  });
  if(next.repeat==='none'&&old?.repeat!=='none')next.done=false;
  if(next.repeat!=='none'&&old?.repeat==='none')next.doneDays=[];
  const index=state.items.findIndex(x=>x.id===next.id);
  if(index<0)state.items.unshift(next);else state.items[index]=next;
  persist();clearForm();render();say('Saved '+next.title+' privately on this device.');
 });
 el('lifeCancelEdit').addEventListener('click',clearForm);
 for(const e of [el('lifeSearch'),el('lifeFilterKind'),el('lifeFilterStatus')])e.addEventListener('input',render);
 el('lifeToday').addEventListener('click',()=>{
  el('lifeFilterStatus').value='active';el('lifeSearch').value='';
  el('lifeFilterKind').value='all';render();
 });
 el('lifeExport').addEventListener('click',wrap(async()=>{
  await saveOrShare(new Blob([lifeExport(state)],{type:'application/json'}),
   'PROXIMUS-LIFE-COMMAND-BACKUP.json');
  say('Life Command backup shared or saved. Keep this file outside the browser.');
 }));
 el('lifeCalendar').addEventListener('click',wrap(async()=>{
  const content=lifeCalendar(state.items);
  if(!content.includes('BEGIN:VEVENT'))throw Error('Add at least one entry with a date before exporting a calendar.');
  await saveOrShare(new Blob([content],{type:'text/calendar;charset=utf-8'}),
   'PROXIMUS-LIFE-COMMAND.ics');
  say('Calendar exported. Open the .ics file in a compatible calendar application to import dated plans.');
 }));
 el('lifeImport').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];e.target.value='';
  if(!file)return;
  if(file.size>500000)throw Error('Life Command backup exceeds 500 KB.');
  const incoming=lifeImport(await file.text());
  const replace=confirm('Replace all current Life Command items with the imported backup? Press Cancel to MERGE instead.');
  if(replace)state=incoming;
  else{
   const map=new Map(state.items.map(x=>[x.id,x]));
   for(const x of incoming.items)if(!map.has(x.id))map.set(x.id,x);
   state=normalizeLifeData({items:[...map.values()]});
  }
  persist();clearForm();render();say('Imported '+incoming.items.length+' entries · '+(replace?'replaced':'merged')+' local planner.');
 }));
 el('lifeClearCompleted').addEventListener('click',()=>{
  const count=state.items.filter(x=>x.repeat==='none'&&x.done).length;
  if(!count)return say('No finished one-time tasks to clear.');
  if(!confirm('Archive by deleting '+count+' completed one-time task(s)? Save a backup first if needed.'))return;
  state.items=state.items.filter(x=>x.repeat!=='none'||!x.done);
  persist();render();say('Removed '+count+' completed one-time tasks.');
 });
 document.addEventListener('proximus-workspace-restored',()=>{
  try{state=normalizeLifeData(JSON.parse(localStorage.getItem(LIFE_STORAGE)||'{}'));render();}
  catch(e){say('Could not reload Life Command preferences.',true);}
 });
 window.addEventListener('focus',render);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
 render();say('Life Command is ready · tasks and routines are saved locally in this browser.');
}
