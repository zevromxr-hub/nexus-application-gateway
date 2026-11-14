// PROXIMUS | Companion Edition v3.3 — Life Command data engine
// Local-first, dependency-free. Never stores credentials or sends personal plans to a server.
export const LIFE_STORAGE='proximus-life-command-v1';
export const LIFE_SCHEMA='proximus.life-command/1';
export const LIFE_LIMIT=350;
export const LIFE_KINDS=['task','routine','event'];
export const LIFE_REPEAT=['none','daily','weekly','monthly'];
export const LIFE_PRIORITY=['low','normal','high'];
const iso=/^\d{4}-\d{2}-\d{2}$/;
const str=(v,n)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
export function validDay(day){
 if(typeof day!=='string'||!iso.test(day))return false;
 const date=new Date(day+'T12:00:00Z');
 return !Number.isNaN(date.valueOf())&&date.toISOString().slice(0,10)===day;
}
export function localDay(date=new Date()){
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),
 String(date.getDate()).padStart(2,'0')].join('-');
}
function dateUTC(day){return new Date(day+'T12:00:00Z');}
function isoUTC(d){return d.toISOString().slice(0,10);}
export function addDays(day,days){
 if(!validDay(day)||!Number.isInteger(days))throw Error('Invalid date shift.');
 const d=dateUTC(day);d.setUTCDate(d.getUTCDate()+days);return isoUTC(d);
}
export function dayDistance(from,to){
 if(!validDay(from)||!validDay(to))return null;
 return Math.round((dateUTC(to)-dateUTC(from))/86400000);
}
export function nextMonthly(day,months){
 const d=dateUTC(day),desired=d.getUTCDate();
 const y=d.getUTCFullYear(),m=d.getUTCMonth()+months;
 const first=new Date(Date.UTC(y,m,1,12));
 const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0,12)).getUTCDate();
 first.setUTCDate(Math.min(desired,last));return isoUTC(first);
}
export function normalizeLifeItem(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid Life Command record.');
 const id=str(raw.id,90);
 if(!/^[a-zA-Z0-9-]{8,90}$/.test(id))throw Error('Invalid Life Command record ID.');
 const title=str(raw.title,110);
 if(!title)throw Error('Every item needs a title.');
 const kind=LIFE_KINDS.includes(raw.kind)?raw.kind:'task';
 const repeat=LIFE_REPEAT.includes(raw.repeat)?raw.repeat:'none';
 const date=validDay(raw.date)?raw.date:'';
 const created=Number.isFinite(Number(raw.created))?Number(raw.created):Date.now();
 const doneDays=Array.isArray(raw.doneDays)?[...new Set(raw.doneDays.filter(validDay))].sort().slice(-366):[];
 return {
  id,title,kind,repeat,date,priority:LIFE_PRIORITY.includes(raw.priority)?raw.priority:'normal',
  category:str(raw.category,38)||'Personal',note:str(raw.note,800),
  created,updated:Number.isFinite(Number(raw.updated))?Number(raw.updated):created,
  done:repeat==='none'&&raw.done===true,doneDays
 };
}
export function normalizeLifeData(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {schema:LIFE_SCHEMA,items:[]};
 const seen=new Set(),items=[];
 for(const value of (Array.isArray(raw.items)?raw.items:[]).slice(0,LIFE_LIMIT*2)){
  if(items.length>=LIFE_LIMIT)break;
  try{
   const item=normalizeLifeItem(value);
   if(!seen.has(item.id)){seen.add(item.id);items.push(item);}
  }catch(e){}
 }
 return {schema:LIFE_SCHEMA,items};
}
export function nextOccurrence(item,today){
 const task=normalizeLifeItem(item);
 if(!task.date)return '';
 if(!validDay(today))throw Error('Invalid current day.');
 if(task.repeat==='none')return task.date;
 if(task.date>=today)return task.date;
 if(task.repeat==='daily')return today;
 if(task.repeat==='weekly'){
  const diff=dayDistance(task.date,today);
  return addDays(task.date,Math.ceil(diff/7)*7);
 }
 // Monthly anniversary: align to original day-of-month, clamp short months.
 const a=dateUTC(task.date),b=dateUTC(today);
 let months=(b.getUTCFullYear()-a.getUTCFullYear())*12+(b.getUTCMonth()-a.getUTCMonth());
 let next=nextMonthly(task.date,months);
 if(next<today)next=nextMonthly(task.date,months+1);
 return next;
}
export function isCompleted(item,today){
 const task=normalizeLifeItem(item);
 return task.repeat==='none'?task.done:task.doneDays.includes(today);
}
export function toggleLifeDone(item,today){
 if(!validDay(today))throw Error('Invalid completion date.');
 const task=normalizeLifeItem(item);
 if(task.repeat==='none'){task.done=!task.done;}
 else{const entries=new Set(task.doneDays);if(entries.has(today))entries.delete(today);else entries.add(today);
  task.doneDays=[...entries].sort().slice(-366);}
 task.updated=Date.now();return task;
}
export function streakFor(item,today){
 const task=normalizeLifeItem(item);
 if(!validDay(today)||task.repeat!=='daily')return 0;
 const completions=new Set(task.doneDays);
 let from=completions.has(today)?today:addDays(today,-1),streak=0;
 while(streak<366&&completions.has(from)){streak++;from=addDays(from,-1);}
 return streak;
}
export function lifeStats(items,today){
 let active=0,doneToday=0,overdue=0,soon=0,routines=0;
 for(const raw of items){
  let item;try{item=normalizeLifeItem(raw);}catch(e){continue;}
  if(isCompleted(item,today)){doneToday++;continue;}
  active++;if(item.repeat!=='none')routines++;
  const due=nextOccurrence(item,today),days=dayDistance(today,due);
  if(days!==null&&days<0)overdue++;
  else if(days!==null&&days<=7)soon++;
 }
 return {total:items.length,active,doneToday,overdue,soon,routines};
}
export function filterLife(items,{query='',kind='all',status='active',today=localDay()}={}){
 const q=String(query).trim().toLowerCase();
 return items.filter(raw=>{
  let item;try{item=normalizeLifeItem(raw);}catch(e){return false;}
  if(kind!=='all'&&item.kind!==kind)return false;
  if(q&&!(item.title+' '+item.category+' '+item.note).toLowerCase().includes(q))return false;
  const done=isCompleted(item,today);
  if(status==='done'&&!done)return false;
  if(status==='active'&&done)return false;
  if(status==='overdue'&&!(item.repeat==='none'&&!done&&item.date&&item.date<today))return false;
  return true;
 }).sort((a,b)=>{
  const da=nextOccurrence(a,today)||'9999-12-31',db=nextOccurrence(b,today)||'9999-12-31';
  const ap={high:0,normal:1,low:2};
  return da.localeCompare(db)||ap[a.priority]-ap[b.priority]||a.title.localeCompare(b.title);
 });
}
function icsEscape(s){return str(s,800).replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n');}
export function lifeCalendar(items){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PROXIMUS//Life Command//EN','CALSCALE:GREGORIAN'];
 for(const raw of items){
  let x;try{x=normalizeLifeItem(raw);}catch(e){continue;}
  if(!x.date)continue;
  const day=x.date.replaceAll('-','');
  lines.push('BEGIN:VEVENT','UID:'+x.id+'@proximus.local','DTSTART;VALUE=DATE:'+day,
    'DTEND;VALUE=DATE:'+addDays(x.date,1).replaceAll('-',''),
    'SUMMARY:'+icsEscape(x.title));
  if(x.note)lines.push('DESCRIPTION:'+icsEscape(x.note));
  if(x.repeat!=='none')lines.push('RRULE:FREQ='+({daily:'DAILY',weekly:'WEEKLY',monthly:'MONTHLY'})[x.repeat]);
  lines.push('END:VEVENT');
 }
 lines.push('END:VCALENDAR');
 return lines.join('\r\n')+'\r\n';
}
export function lifeExport(data){
 return JSON.stringify({schema:LIFE_SCHEMA,exported:new Date().toISOString(),
 items:normalizeLifeData(data).items},null,2);
}
export function lifeImport(text){
 if(String(text).length>500000)throw Error('Life Command backup exceeds 500 KB.');
 const data=JSON.parse(text);
 if(data?.schema!==LIFE_SCHEMA||!Array.isArray(data.items))throw Error('Unsupported Life Command backup.');
 return normalizeLifeData(data);
}
