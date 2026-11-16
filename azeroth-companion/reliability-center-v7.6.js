/* NEXUS | AZEROTH v7.6 — Connection & Recovery
 * Pure presentation and user-initiated retry controls. Reuses existing Armory
 * forms and their validation; never intercepts requests or alters saved records.
 */
(()=>{'use strict';
const nav=document.querySelector('.sidebar .nav');
const status=document.getElementById('cxStatus');
const character=document.getElementById('cxCharacterForm');
const item=document.getElementById('cxItemForm');
const armory=document.querySelector('[data-section="armory"]');
const codex=document.querySelector('[data-section="codex"]');
if(!nav||!status||!character||!item||!armory||!codex||document.getElementById('nxRecoveryArmory'))return;
const cards=[];
function create(view,form,id,heading){
 const card=document.createElement('section');card.id=id;card.className='nx-recovery panel';
 const top=document.createElement('div');top.className='nx-recovery-heading';
 const title=document.createElement('strong');title.textContent=heading;
 const badge=document.createElement('span');badge.className='nx-recovery-badge';
 top.append(title,badge);
 const info=document.createElement('p');info.className='nx-recovery-info';info.setAttribute('role','status');info.setAttribute('aria-live','polite');
 const guidance=document.createElement('p');guidance.className='nx-recovery-help';
 const actions=document.createElement('div');actions.className='nx-recovery-actions';
 const retry=document.createElement('button');retry.type='button';retry.textContent='RETRY LAST ENTRY';
 const open=document.createElement('button');open.type='button';open.textContent=view==='armory'?'OPEN ITEM CODEX':'OPEN LIVE ARMORY';
 actions.append(retry,open);card.append(top,info,guidance,actions);
 const region=form.closest('.grid');if(region)region.after(card);else form.after(card);
 let attempt=false,lastResult='idle';
 form.addEventListener('submit',()=>{attempt=true;lastResult='pending';update(true)},{capture:true});
 open.addEventListener('click',()=>nav.querySelector('[data-view="'+(view==='armory'?'codex':'armory')+'"]')?.click());
 retry.addEventListener('click',()=>{
  if(!navigator.onLine||form.querySelector('button[type="submit"]')?.disabled)return;
  if(!form.reportValidity())return;
  // Browser-native submit validation and the original handler remain authoritative.
  if(typeof form.requestSubmit==='function')form.requestSubmit();
  else form.querySelector('button[type="submit"]')?.click();
 });
 const obj={view,form,badge,info,guidance,retry,get attempted(){return attempt},get result(){return lastResult},setResult(v){lastResult=v}};
 cards.push(obj);return obj;
}
const a=create('armory',character,'nxRecoveryArmory','Character connection & recovery');
const b=create('codex',item,'nxRecoveryCodex','Item research & recovery');
let latest='idle';
function classify(){
 const text=status.textContent||'';
 const kind=status.dataset.kind||'info';
 if(/character and equipment loaded/i.test(text))return{type:'success',view:'armory',text:'Character and equipment were retrieved successfully.',help:'Profile and equipment came from the existing Blizzard-connected lookup.'};
 if(/character loaded; equipment unavailable/i.test(text))return{type:'partial',view:'armory',text:'Character profile loaded; equipment was unavailable.',help:'This does not mean the character has no items. You can retry when ready.'};
 if(/character lookup failed/i.test(text))return{type:'failed',view:'armory',text:'The last character lookup was unsuccessful.',help:remedy(text)};
 if(/item lookup failed/i.test(text))return{type:'failed',view:'codex',text:'The last item lookup was unsuccessful.',help:remedy(text)};
 if(/official blizzard item data loaded/i.test(text))return{type:'success',view:'codex',text:'Item information retrieved successfully.',help:'The details in Item Codex come from the existing official-data response.'};
 if(/loading public blizzard profile/i.test(text))return{type:'pending',view:'armory',text:'Loading public character information…',help:'The original lookup may make separate profile and equipment requests.'};
 if(/loading item from blizzard/i.test(text))return{type:'pending',view:'codex',text:'Retrieving item details…',help:'No automatic retries will be made.'};
 if(kind==='warn')return{type:'caution',view:null,text:'A companion action needs attention.',help:text.slice(0,220)};
 return null;
}
function remedy(message){
 if(/timed out|timeout/i.test(message))return'The lookup exceeded the request time limit. Check your connection and retry manually.';
 if(/unable to reach|network|offline|failed to fetch/i.test(message))return'The data service could not be reached. Check your connection; no account changes were made.';
 if(/HTTP 429|rate limit/i.test(message))return'The service may be limiting requests. Avoid repeated rapid retries.';
 if(/HTTP 5\d\d|unavailable|service/i.test(message))return'The upstream service may be unavailable. Try again later.';
 return'Check the region, realm slug or item ID, then retry. Unsuccessful lookups do not erase saved information.';
}
function update(skipOldResult=false){
 const outcome=skipOldResult?null:classify();
 if(outcome){latest=outcome.type;if(outcome.view)cards.find(x=>x.view===outcome.view)?.setResult(outcome.type)}
 const online=navigator.onLine;
 for(const card of cards){
  const current=outcome?.view===card.view?outcome:null;
  let tone='ready',headline='',message='';
  if(!online){tone='offline';headline='BROWSER REPORTS OFFLINE';message='Connection unavailable according to this browser. Existing saved work remains on this device.'}
  else if(current){tone=current.type;headline=current.text;message=current.help}
  else if(card.result==='success'){tone='success';headline='Previous lookup completed';message='Load another character or item to refresh the information.'}
  else if(card.result==='partial'){tone='partial';headline='Last profile loaded with incomplete equipment';message='Manual retry is available.'}
  else if(card.result==='failed'){tone='failed';headline='Previous lookup was unsuccessful';message='Review the original status message and retry manually.'}
  else if(card.result==='pending'){tone='pending';headline='Lookup requested';message='See the existing Armory or Codex status for progress.'}
  else{headline='Ready for a source-backed lookup';message='Online status only indicates browser connectivity; it does not verify the Blizzard service is available.'}
  card.badge.textContent=online?'CONNECTION AVAILABLE':'BROWSER OFFLINE';
  card.badge.dataset.tone=tone;
  card.info.textContent=headline;
  card.guidance.textContent=message;
  const busy=!!card.form.querySelector('button[type="submit"]:disabled');
  card.retry.disabled=!online||busy;
  card.retry.textContent=busy?'LOOKUP IN PROGRESS':'RETRY LAST ENTRY';
 }
}
const observer=new MutationObserver(()=>queueMicrotask(update));
observer.observe(status,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['data-kind']});
window.addEventListener('online',update);
window.addEventListener('offline',update);
document.addEventListener('nexus:armory-intelligence-ready',()=>queueMicrotask(update));
status.addEventListener('click',update);
for(const card of cards)card.form.addEventListener('submit',()=>queueMicrotask(()=>update(true)));
update();
})();