/* NEXUS | AZEROTH v3.8 — verified account status bridge.
 * The Cloudflare Worker validates the Blizzard session and returns an encrypted,
 * short-lived status receipt. No access tokens, cookies or user identities are sent
 * to GitHub Pages. Green verification is time-limited and never persisted.
 */
(()=>{'use strict';
const WORKER='https://nexus-azeroth-api.zevromxr.workers.dev';
const badge=document.querySelector('.ud-account-badge');
const status=document.getElementById('udSessionText');
const portal=document.getElementById('udPortal');
if(!badge)return;
const text=badge.querySelector('span:last-child');
let validUntil=0;
const checkURL=WORKER+'/account/verify-companion';
badge.href=checkURL;
badge.removeAttribute('target');
badge.setAttribute('aria-label','Verify your Battle.net connection with Blizzard');
if(portal){portal.href=checkURL;portal.removeAttribute('target');portal.textContent='VERIFY BATTLE.NET CONNECTION'}
function update(kind,message,detail){
 badge.classList.remove('ud-verified','ud-checking','ud-unverified');
 badge.classList.add(kind==='verified'?'ud-verified':kind==='checking'?'ud-checking':'ud-unverified');
 if(text)text.textContent=message;
 badge.setAttribute('aria-label',message+' — select to check through Blizzard');
 if(status)status.textContent=detail;
}
function expire(){
 if(validUntil&&Date.now()>=validUntil){
  validUntil=0;
  update('unverified','Verification expired','Your last verification is no longer current. Select Check Connection to validate the Battle.net session again.');
 }
}
function checkState(){
 const hash=location.hash.startsWith('#nxverify=')?location.hash.slice('#nxverify='.length):'';
 if(!hash)return;
 try{history.replaceState(history.state,'',location.pathname+location.search)}catch(_){}
 if(hash==='disconnected'){
  update('unverified','Not connected','No active Battle.net session was found on the secure portal. Open My Azeroth to sign in, then select Verify & Return.');
  return;
 }
 if(hash==='unavailable'){
  update('unverified','Verification unavailable','The secure portal could not confirm Blizzard access. Try again shortly.');
  return;
 }
 let ticket;
 try{ticket=decodeURIComponent(hash)}catch(_){
  update('unverified','Invalid verification','The verification response could not be read. Please check again.');return;
 }
 if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(ticket)||ticket.length>6000){
  update('unverified','Invalid verification','The verification response is invalid. Please check again.');return;
 }
 update('checking','Checking connection','Confirming your short-lived verification receipt with the secure Cloudflare service…');
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),12000);
 fetch(WORKER+'/api/companion/verify',{
  method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},
  body:JSON.stringify({ticket}),signal:controller.signal
 }).then(async r=>{
  const d=await r.json().catch(()=>null);
  if(!r.ok||!d?.connected||d?.success!==true)throw Error('Not verified');
  const limit=Number(d.validUntil),issued=Number(d.verifiedAt);
  if(!Number.isFinite(limit)||!Number.isFinite(issued)||limit<=Date.now()||limit>Date.now()+121000||issued>Date.now()+10000||!['us','eu','kr','tw'].includes(d.region))throw Error('Expired verification');
  validUntil=limit;
  const time=new Date(issued).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  update('verified','Connected · Verified','Blizzard connection verified in '+d.region.toUpperCase()+' at '+time+'. This is a recent server check, not continuous monitoring; verification must be refreshed when it expires.');
  setTimeout(expire,Math.max(0,limit-Date.now()+50));
 }).catch(()=>{
  update('unverified','Verification failed','The receipt could not be verified. Recheck through the secure Battle.net portal; no account connection is assumed.');
 }).finally(()=>clearTimeout(timer));
}
update('unverified','Check connection','The website has not yet received a verified session receipt. Select Check Connection to validate your Battle.net session securely.');
checkState();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)expire()});
window.addEventListener('pageshow',expire);
})();
