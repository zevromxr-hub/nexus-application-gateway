/* NEXUS | AZEROTH v7.9.6 — read-only consolidated progression report.
 * Deliberately separate from the existing single-category research flows.
 * Never persists personal data, changes OAuth sessions, or silently retries.
 */
(()=>{'use strict';
const API='https://nexus-azeroth-api.zevromxr.workers.dev';
const sections=[['mythic','Mythic+'],['raids','Raids'],['reputations','Reputations']];
const form=document.getElementById('form'),status=document.getElementById('status');
if(!form||!status)return;
const $=id=>document.getElementById(id);
const panel=document.createElement('section');
panel.className='panel';panel.id='nxReportPanel';panel.setAttribute('aria-label','Combined character progression report');
const title=document.createElement('h2');title.textContent='Character Progress Report · v7.9.6';
const description=document.createElement('p');description.textContent='One deliberate request checks Mythic+, raids and reputations in sequence. Each category has a separate result, so one unavailable API does not hide successful data from the others. No automatic saving or account login required.';
const controls=document.createElement('div');controls.className='row';
const load=document.createElement('button');load.type='button';load.id='nxReportLoad';load.className='primary';load.textContent='BUILD CHARACTER PROGRESS REPORT';
const cancel=document.createElement('button');cancel.type='button';cancel.id='nxReportCancel';cancel.textContent='CANCEL';cancel.disabled=true;
const download=document.createElement('button');download.type='button';download.id='nxReportDownload';download.textContent='EXPORT COMBINED JSON';download.disabled=true;
const copy=document.createElement('button');copy.type='button';copy.id='nxReportCopy';copy.textContent='COPY SUMMARY';copy.disabled=true;
controls.append(load,cancel,download,copy);
const progress=document.createElement('p');progress.id='nxReportStatus';progress.className='status';progress.setAttribute('role','status');progress.textContent='Choose a public character above, then build a report.';
const cards=document.createElement('div');cards.className='grid';cards.id='nxReportResults';
const caution=document.createElement('p');caution.className='hint';caution.textContent='Not an ownership audit or complete historical record. Empty responses never prove a player has no runs, raid completions or reputations. Data is Blizzard-reported and can lag behind gameplay.';
panel.append(title,description,controls,progress,cards,caution);
const formPanel=form.closest('section.panel');
if(!formPanel)return;
formPanel.insertAdjacentElement('afterend',panel);
let active=null,report=null,sequence=0;
const display=(text,error=false)=>{progress.textContent=text;progress.classList.toggle('error',error)};
const count=data=>Array.isArray(data)?data.length:0;
const summaryOf=(kind,data)=>{if(!data||typeof data!=='object')return 'No structured response';
 if(kind==='mythic'){const runs=count(data.current_period?.best_runs)+count(data.best_runs);const seasons=count(data.seasons);const rating=data.current_mythic_rating?.rating;return [rating===undefined?'Rating unavailable':'Rating '+rating,runs+' best runs reported',seasons+' season references'].join(' · ')}
 if(kind==='raids'){const expansions=Array.isArray(data.expansions)?data.expansions:[];const raids=expansions.reduce((n,e)=>n+count(e?.instances),0);return expansions.length+' expansion groups · '+raids+' raid entries (not live lockouts)'}
 return count(data.reputations)+' reported reputation entries (may be incomplete)';
};
function selected(){const f=new FormData(form);const region=String(f.get('region')||'').trim().toLowerCase(),realm=String(f.get('realm')||'').trim().toLowerCase(),name=String(f.get('character')||'').trim().toLowerCase();
if(!['us','eu','kr','tw'].includes(region)||!/^[a-z0-9-]{2,80}$/.test(realm)||!/^[a-z0-9-]{2,50}$/.test(name))throw Error('Enter a valid region, realm slug and character name first.');
return {region,realm,name};}
function render(report){cards.replaceChildren();for(const [kind,label] of sections){const result=report.results[kind];const tile=document.createElement('article');tile.className='tile';const heading=document.createElement('strong');heading.textContent=label+' · '+(result.status==='available'?'Response received':result.status==='unavailable'?'Unavailable':result.status==='cancelled'?'Cancelled':'Not checked');const detail=document.createElement('small');detail.textContent=result.status==='available'?result.summary:result.message||'No data';tile.append(heading,detail);cards.append(tile)}}
async function request(section,identity,signal){const path='/api/progression/'+[identity.region,identity.realm,identity.name,section].join('/');const response=await fetch(API+path,{signal,cache:'no-store',headers:{Accept:'application/json'}});let body;try{body=await response.json()}catch{throw Error('Unreadable response from Blizzard gateway')}if(!response.ok||body?.success!==true)throw Error(body?.message||'API request failed (HTTP '+response.status+')');return {status:'available',summary:summaryOf(section,body.data),fetchedAt:body.fetchedAt||new Date().toISOString(),data:body.data}}
function ready(isLoading){load.disabled=isLoading;cancel.disabled=!isLoading;download.disabled=isLoading||!report;copy.disabled=isLoading||!report}
load.addEventListener('click',async()=>{let identity;try{identity=selected()}catch(e){display(e.message,true);return}
active?.abort();const job=++sequence,ac=new AbortController();active=ac;report={format:'nexus-azeroth-character-report-v796',character:identity,startedAt:new Date().toISOString(),results:{mythic:{status:'pending'},raids:{status:'pending'},reputations:{status:'pending'}}};cards.replaceChildren();ready(true);
for(let i=0;i<sections.length;i++){if(ac.signal.aborted||job!==sequence)break;const [kind,label]=sections[i];display('Checking '+label+' ('+(i+1)+' / '+sections.length+')…');
let timeout;try{timeout=setTimeout(()=>ac.abort(),15000);report.results[kind]=await request(kind,identity,ac.signal)}catch(error){report.results[kind]={status:ac.signal.aborted?'cancelled':'unavailable',message:ac.signal.aborted?'Request stopped or timed out':String(error?.message||'Blizzard data unavailable').slice(0,180)}}finally{clearTimeout(timeout)}
render(report)}
if(job!==sequence)return;
for(const [kind] of sections)if(report.results[kind].status==='pending')report.results[kind]={status:'cancelled',message:'Not requested after cancellation'};
report.finishedAt=new Date().toISOString();render(report);const ok=sections.filter(([k])=>report.results[k].status==='available').length;display(ok+' / 3 categories responded; '+(3-ok)+' unavailable or cancelled. Individual results are not player achievements.',ok===0);
active=null;ready(false)});
cancel.addEventListener('click',()=>{active?.abort();display('Cancelling remaining report requests…')});
function plain(){if(!report)return '';const v=['NEXUS | AZEROTH CHARACTER PROGRESS REPORT','Character: '+report.character.name+' · '+report.character.realm+' · '+report.character.region,'Date: '+(report.finishedAt||report.startedAt),''];for(const [kind,label] of sections){const r=report.results[kind];v.push(label+': '+r.status.toUpperCase()+' — '+(r.summary||r.message||'Not checked'))}v.push('Blizzard API data may be delayed/incomplete. No results indicate complete game progression.');return v.join('\n')}
copy.addEventListener('click',async()=>{if(!report)return;try{await navigator.clipboard.writeText(plain());display('Read-only report summary copied; share only if you choose.')}catch(_){display('Clipboard unavailable in this browser; use Export Combined JSON instead.',true)}});
download.addEventListener('click',()=>{if(!report)return;const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nexus-character-progress-report.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)});
window.addEventListener('pagehide',()=>active?.abort(),{once:true});
})();