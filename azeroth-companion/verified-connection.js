/* NEXUS | AZEROTH v3.9 — Connected Player Experience.
 * A server-validated, short-lived proof is the ONLY basis for green verification.
 * Store only that encrypted status proof within this tab's sessionStorage to allow
 * server revalidation on refresh. Never store Battle.net tokens, cookies or identity.
 */
(()=>{'use strict';
const WORKER='https://nexus-azeroth-api.zevromxr.workers.dev';
const CHECK=WORKER+'/account/verify-companion';
const API=WORKER+'/api/companion/verify';
const STORAGE='nexus_azeroth_verified_receipt_v39';
const badge=document.querySelector('.ud-account-badge');
const status=document.getElementById('udSessionText');
const portal=document.getElementById('udPortal');
const personal=document.getElementById('paStatus');
const sessionBox=document.querySelector('#unifiedDashboard .ud-session');
if(!badge)return;
const badgeText=badge.querySelector('span:last-child');
let validUntil=0,verifiedAt=0,region='',timer=null,inflight=0;
let details=null,detailRegion=null,detailTime=null,detailFresh=null,avatar=null;
function safeRead(){try{return sessionStorage.getItem(STORAGE)||''}catch(_){return''}}
function safeSave(ticket){try{if(ticket)sessionStorage.setItem(STORAGE,ticket);else sessionStorage.removeItem(STORAGE)}catch(_){}}
function formatTime(ms){return new Date(ms).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}
function clock(){const left=Math.max(0,Math.ceil((validUntil-Date.now())/1000));return Math.floor(left/60)+':'+String(left%60).padStart(2,'0')}
function createDetails(){
 if(!sessionBox)return;
 details=document.createElement('div');details.className='nx-account-details';details.setAttribute('aria-live','off');
 const title=document.createElement('div');title.className='nx-account-title';title.textContent='Verified session details';
 const stats=document.createElement('div');stats.className='nx-account-stats';
 const make=(label)=>{const wrap=document.createElement('div');const n=document.createElement('small');n.textContent=label;const v=document.createElement('strong');v.textContent='—';wrap.append(n,v);stats.append(wrap);return v};
 detailRegion=make('Account region');detailTime=make('Last verified');detailFresh=make('Proof expires');
 details.append(title,stats);
 const note=document.createElement('p');note.textContent='A verified Battle.net session does not guarantee World of Warcraft characters. Game data appears when Blizzard provides it.';details.append(note);
 const actions=document.createElement('div');actions.className='nx-account-actions';
 const recheck=document.createElement('a');recheck.className='nx-recheck';recheck.href=CHECK;recheck.textContent='↻ Verify again';recheck.setAttribute('aria-label','Recheck Battle.net connection securely');
 const account=document.createElement('a');account.href=WORKER+'/account';account.className='nx-open-account';account.textContent='Open My Azeroth';account.rel='noopener noreferrer';account.target='_blank';
 actions.append(recheck,account);details.append(actions);
 const copy=sessionBox.querySelector('.ud-session-copy');(copy||sessionBox).append(details);
 const existing=sessionBox.querySelector('#udAvatar');if(existing){existing.setAttribute('title','Locally selected character initials — not a Blizzard account portrait')}
}
createDetails();
badge.href=CHECK;badge.removeAttribute('target');badge.removeAttribute('rel');badge.setAttribute('aria-label','Check Battle.net connection');
if(portal){portal.href=CHECK;portal.removeAttribute('target');portal.removeAttribute('rel');portal.textContent='CHECK CONNECTION / VERIFY'}
if(personal){personal.textContent='Account status is verified on the secure portal. Return using Verify & Return; an account may be connected even with no WoW characters.'}
function update(kind,label,description){
 badge.classList.remove('ud-verified','ud-checking','ud-unverified');badge.classList.add('ud-'+kind);
 if(badgeText)badgeText.textContent=label;
 badge.setAttribute('aria-label',label+'. Check your Battle.net connection through the secure portal');
 if(status)status.textContent=description;
 if(details){details.dataset.state=kind;detailRegion.textContent=region?region.toUpperCase():'—';detailTime.textContent=verifiedAt?formatTime(verifiedAt):'—';detailFresh.textContent=kind==='verified'?clock():'Not current'}
 document.dispatchEvent(new CustomEvent('nexus:account-status',{detail:{state:kind,region:kind==='verified'?region:null,verifiedAt:kind==='verified'?verifiedAt:null}}));
}
function stopClock(){if(timer!==null){clearInterval(timer);timer=null}}
function expire(){
 if(validUntil&&Date.now()>=validUntil){stopClock();validUntil=0;region='';safeSave('');update('unverified','Verification expired','Your previous verification has expired. Use Check Connection to verify your Battle.net session again.');return}
 if(validUntil&&details)detailFresh.textContent=clock();
}
function invalid(message,description){stopClock();validUntil=0;verifiedAt=0;region='';safeSave('');update('unverified',message,description)}
function validateTicket(ticket){
 return typeof ticket==='string'&&ticket.length<=6000&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(ticket);
}
async function verify(ticket){
 if(!validateTicket(ticket)){invalid('Invalid verification','The connection receipt was invalid. Select Check Connection to try again.');return}
 const current=++inflight;
 update('checking','Checking connection','Asking the secure Cloudflare service to verify the short-lived account receipt…');
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const resp=await fetch(API,{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({ticket}),signal:controller.signal});
  const data=await resp.json().catch(()=>null);
  if(!resp.ok||data?.success!==true||data?.connected!==true)throw Error('Not verified');
  const end=Number(data.validUntil),start=Number(data.verifiedAt),now=Date.now();
  if(!['us','eu','kr','tw'].includes(data.region)||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>now+10000||end<=now||end>now+121000||end-start>120000)throw Error('Receipt expired');
  if(current!==inflight)return;
  validUntil=end;verifiedAt=start;region=data.region;
  safeSave(ticket);
  stopClock();
  update('verified','Connected · Verified','Battle.net account verification confirmed in '+region.toUpperCase()+' at '+formatTime(start)+'. Status expires automatically and can be refreshed securely.');
  timer=setInterval(expire,1000);
 }catch(_){
  if(current===inflight)invalid('Connection not verified','The account proof could not be confirmed or has expired. Use Check Connection to try again.');
 }finally{clearTimeout(timeout)}
}
function consumeReturn(){
 // The Worker returns a fragment, never credentials. Remove the receipt from the URL immediately.
 if(!location.hash.startsWith('#nxverify='))return false;
 const input=location.hash.slice('#nxverify='.length);
 try{history.replaceState(history.state,'',location.pathname+location.search)}catch(_){}
 if(input==='disconnected'){invalid('Not connected','No active Battle.net session was found. Open the secure My Azeroth portal to sign in and select Verify & Return.');return true}
 if(input==='unavailable'){invalid('Verification unavailable','The secure service could not confirm the Blizzard token. Try Check Connection again.');return true}
 let ticket;
 try{ticket=decodeURIComponent(input)}catch(_){invalid('Invalid verification','The verification response was unreadable.');return true}
 void verify(ticket);return true;
}
update('unverified','Check connection','Select Check Connection to validate your existing Battle.net session. Verification is independent of WoW character ownership.');
if(!consumeReturn()){
 const stored=safeRead();
 if(stored){void verify(stored)}
}
document.addEventListener('nexus:account-status',e=>{
 if(!personal)return;
 const d=e.detail||{};
 if(d.state==='verified')personal.textContent='Connected · Verified ('+(d.region||'').toUpperCase()+'). Verification is recent and time-limited; click Verify Again to refresh.';
 else if(d.state==='checking')personal.textContent='Checking your Battle.net account connection securely…';
 else personal.textContent='No current verified session on this website. Open the secure My Azeroth portal to sign in, then choose Verify & Return.';
});
// The initial account state was rendered before the status listener was installed.
// Bring the My Azeroth panel into sync without waiting for another event.
if(personal){
 const current=badge.classList.contains('ud-verified')?'verified':badge.classList.contains('ud-checking')?'checking':'unverified';
 document.dispatchEvent(new CustomEvent('nexus:account-status',{detail:{state:current,region:current==='verified'?region:null,verifiedAt:current==='verified'?verifiedAt:null}}));
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)expire()});
window.addEventListener('pageshow',expire);
})();
