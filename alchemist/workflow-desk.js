// PROXIMUS | ASSET ALCHEMIST — Workflow Desk
// Notes, checklists and focus sessions for mouse/touch with portable JSON backup.
import {$,notice,download,textFile,wrap} from './core.js';
const STORE='proximus-alchemist-workflow-v1';
const uid=()=>Array.from(crypto.getRandomValues(new Uint8Array(8))).map(x=>x.toString(16).padStart(2,'0')).join('');
const clean=(s,max)=>String(s??'').slice(0,max);
export function normalizeWorkflow(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid workflow document');
 const notes=Array.isArray(value.notes)?value.notes.slice(0,100).map(x=>({
  id:clean(x?.id||uid(),42),title:clean(x?.title||'Untitled note',90),body:clean(x?.body||'',25000),
  updated:clean(x?.updated||new Date().toISOString(),40)
 })):[];
 const tasks=Array.isArray(value.tasks)?value.tasks.slice(0,150).map(x=>({
  id:clean(x?.id||uid(),42),text:clean(x?.text||'',240),done:!!x?.done
 })).filter(x=>x.text):[];
 const focus=[5,10,15,20,25,30,45,60].includes(Number(value.focus))?Number(value.focus):25;
 return {schema:'proximus.workflow/1',notes,tasks,focus};
}
export function workflowStats(data){
 const total=data.tasks.length,complete=data.tasks.filter(x=>x.done).length;
 return {total,complete,remaining:total-complete,percent:total?Math.round(complete/total*100):0};
}
export function initWorkflowDesk(app){
 const empty=()=>normalizeWorkflow({notes:[],tasks:[],focus:25});
 let data=empty(),selected=null,savePending=null;
 const notesList=$('deskNoteList'),tasksList=$('deskTasks'),title=$('deskTitle'),body=$('deskBody'),taskInput=$('deskTaskInput');
 const state=$('deskState'),status=$('deskStatus');
 function save(){
  try{localStorage.setItem(STORE,JSON.stringify(data));state.textContent='Saved locally · '+new Date().toLocaleTimeString();}catch(e){state.textContent='Storage full · export a backup from this tab';}
 }
 function deferSave(){clearTimeout(savePending);savePending=setTimeout(save,250);}
 function renderNotes(){
  notesList.replaceChildren();
  for(const note of data.notes){
   const row=document.createElement('div');row.className='desk-note-row';
   const btn=document.createElement('button');btn.type='button';btn.className='desk-note-choice'+(note.id===selected?' selected':'');btn.textContent=note.title||'Untitled note';
   btn.addEventListener('click',()=>{commitNote();selected=note.id;renderNotes();renderEditor();});
   row.append(btn);notesList.append(row);
  }
  if(!data.notes.length)notesList.textContent='Create your first note.';
  $('deskNoteCount').textContent=String(data.notes.length)+' notes';
 }
 function renderEditor(){
  const note=data.notes.find(x=>x.id===selected);
  title.disabled=!note;body.disabled=!note;$('deskDeleteNote').disabled=!note;
  title.value=note?.title||'';body.value=note?.body||'';
  $('deskChars').textContent=(note?.body.length||0)+' / 25000 characters';
 }
 function commitNote(){
  const note=data.notes.find(x=>x.id===selected);if(!note)return;
  note.title=clean(title.value.trim()||'Untitled note',90);
  note.body=clean(body.value,25000);note.updated=new Date().toISOString();deferSave();
 }
 function renderTasks(){
  tasksList.replaceChildren();
  for(const task of data.tasks){
   const row=document.createElement('div');row.className='desk-task';
   const check=document.createElement('input');check.type='checkbox';check.checked=task.done;
   check.setAttribute('aria-label','Mark task complete');
   check.addEventListener('change',()=>{task.done=check.checked;renderTasks();deferSave();});
   const content=document.createElement('span');content.textContent=task.text;
   if(task.done)content.className='desk-done';
   const remove=document.createElement('button');remove.textContent='×';remove.className='small-btn';remove.title='Remove task';remove.addEventListener('click',()=>{data.tasks=data.tasks.filter(x=>x.id!==task.id);renderTasks();deferSave();});
   row.append(check,content,remove);tasksList.append(row);
  }
  if(!data.tasks.length)tasksList.textContent='Add a task to build your checklist.';
  const stats=workflowStats(data);
  $('deskTaskStats').textContent=stats.complete+' completed · '+stats.remaining+' remaining';
  $('deskProgress').value=stats.percent;$('deskProgress').setAttribute('aria-label','Checklist '+stats.percent+'% complete');
 }
 function addNote(){
  if(data.notes.length>=100)throw Error('Note limit reached; export a backup.');
  commitNote();
  const note={id:uid(),title:'New note',body:'',updated:new Date().toISOString()};
  data.notes.unshift(note);selected=note.id;renderNotes();renderEditor();deferSave();title.focus();title.select();
 }
 $('deskAddNote').addEventListener('click',wrap(addNote));
 $('deskDeleteNote').addEventListener('click',()=>{
  if(!selected)return;
  data.notes=data.notes.filter(x=>x.id!==selected);selected=data.notes[0]?.id||null;
  renderNotes();renderEditor();deferSave();
 });
 title.addEventListener('input',()=>{commitNote();renderNotes();});
 body.addEventListener('input',()=>{commitNote();$('deskChars').textContent=body.value.length+' / 25000 characters';});
 function addTask(){
  const value=taskInput.value.trim();if(!value)return;
  if(data.tasks.length>=150)throw Error('Task limit reached; export a backup.');
  data.tasks.push({id:uid(),text:clean(value,240),done:false});taskInput.value='';
  renderTasks();deferSave();
 }
 $('deskTaskAdd').addEventListener('click',wrap(addTask));
 taskInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();try{addTask();}catch(err){notice(err.message,true);}}});
 $('deskTasksClear').addEventListener('click',()=>{
  data.tasks=data.tasks.filter(x=>!x.done);renderTasks();deferSave();
 });
 async function backup(add){
  commitNote();save();
  const blob=textFile({...data,exported_at:new Date().toISOString()}),name='PROXIMUS-WORKFLOW-BACKUP.json';
  if(add)app.addAsset(name,blob,'Workflow Desk');else download(blob,name);
  status.textContent='Workflow backup created · '+data.notes.length+' notes · '+data.tasks.length+' tasks';
 }
 $('deskBackup').addEventListener('click',wrap(()=>backup(false)));
 $('deskToPack').addEventListener('click',wrap(()=>backup(true)));
 $('deskImport').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>4000000)throw Error('Workflow backup exceeds 4 MB.');
  const parsed=JSON.parse(await file.text());
  if(parsed.schema!=='proximus.workflow/1')throw Error('This file is not a PROXIMUS workflow backup.');
  commitNote();data=normalizeWorkflow(parsed);
  selected=data.notes[0]?.id||null;renderNotes();renderEditor();renderTasks();
  $('deskFocusMinutes').value=String(data.focus);stopFocus();save();
  e.target.value='';
  status.textContent='Workflow backup imported · '+data.notes.length+' notes · '+data.tasks.length+' tasks';
 }));
 // Focus timer uses wall clock time so pauses/resumes survive mobile tab suspension.
 const timer=$('deskTimer'),focusSelect=$('deskFocusMinutes');
 let remaining=25*60,endAt=0,running=false,interval=null;
 const clock=seconds=>Math.floor(Math.max(0,seconds)/60).toString().padStart(2,'0')+':'+Math.floor(Math.max(0,seconds)%60).toString().padStart(2,'0');
 function paintTimer(){timer.textContent=clock(remaining);$('deskTimerButton').textContent=running?'❚❚ Pause focus':'▶ Start focus';}
 function stopFocus(){
  running=false;clearInterval(interval);interval=null;remaining=Number(focusSelect.value)*60;paintTimer();
 }
 function updateTimer(){
  if(!running)return;
  remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));paintTimer();
  if(remaining===0){running=false;clearInterval(interval);interval=null;
   status.textContent='Focus session complete. Take a break.';paintTimer();}
 }
 $('deskTimerButton').addEventListener('click',()=>{
  if(running){updateTimer();running=false;clearInterval(interval);interval=null;}
  else{if(remaining<=0)remaining=Number(focusSelect.value)*60;
   running=true;endAt=Date.now()+remaining*1000;interval=setInterval(updateTimer,350);}
  paintTimer();
 });
 $('deskTimerReset').addEventListener('click',stopFocus);
 focusSelect.addEventListener('change',()=>{data.focus=Number(focusSelect.value);deferSave();stopFocus();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateTimer();});
 window.addEventListener('pagehide',()=>{clearInterval(interval);clearTimeout(savePending);commitNote();save();},{once:true});
 // Restore saved notes / checklist without altering other Asset Alchemist storage.
 try{
  const persisted=localStorage.getItem(STORE);
  if(persisted)data=normalizeWorkflow(JSON.parse(persisted));
 }catch(e){data=empty();}
 if(!data.notes.length)data.notes.push({id:uid(),title:'My first note',body:'',updated:new Date().toISOString()});
 selected=data.notes[0]?.id||null;
 renderNotes();renderEditor();renderTasks();
 focusSelect.value=String(data.focus);stopFocus();
 status.textContent='Workspace ready · notes, checklists and focus timer';
}
