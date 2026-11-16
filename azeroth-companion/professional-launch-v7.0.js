/* NEXUS | AZEROTH v7.0 Professional Launch Experience.
 * Additive website guidance only. Does not alter Talent Forge, account login,
 * existing storage formats, service workers, or Discord notifications.
 */
(()=>{'use strict';
const overview=document.querySelector('[data-section="overview"]'),nav=document.querySelector('.nav');
if(!overview||!nav||document.getElementById('nxLaunchCenter'))return;
const launch=document.createElement('section');launch.id='nxLaunchCenter';launch.className='nx-launch-center';launch.setAttribute('aria-label','Getting started and application settings');
launch.innerHTML='<div class="nx-launch-header"><div><span class="nx-launch-kicker">NEXUS / LAUNCH EDITION</span><h3>Welcome to Azeroth Companion</h3><p>Plan your character, discover talents, and keep your progress organized. Start with any tool below.</p></div><button id="nxLaunchCollapse" type="button" aria-expanded="true">HIDE GUIDE</button></div>'+
'<div id="nxLaunchContent"><div class="nx-launch-shortcuts">'+
'<button type="button" data-nx-open="characters"><span aria-hidden="true">♙</span><strong>Characters</strong><small>Create a roster profile</small></button>'+
'<button type="button" data-nx-open="builds"><span aria-hidden="true">⚔</span><strong>Build Architect</strong><small>Plan equipment and builds</small></button>'+
'<button type="button" data-nx-open="progress"><span aria-hidden="true">✧</span><strong>Progression</strong><small>Track your objectives</small></button>'+
'<button type="button" id="nxLaunchTalent"><span aria-hidden="true">✦</span><strong>Talent Forge</strong><small>Explore the talent planner</small></button></div>'+
'<div class="nx-launch-service"><section><h4>Install on your device</h4><p id="nxInstallHelp">Use your browser’s installation or Add to Home Screen option for quick access.</p><button type="button" id="nxInstallNow" hidden>INSTALL APPLICATION</button></section>'+
'<section><h4>Release status</h4><p id="nxVersionStatus">Check that this device is using the latest published version.</p><button type="button" id="nxCheckVersion">CHECK FOR UPDATES</button></section></div>'+
'<details class="nx-launch-details"><summary>About your data and this project</summary><p>Manual companion information and talent drafts generally stay in this browser unless you export them. Signing in with Battle.net uses online Blizzard services and is a separate feature. Local browser data does not automatically synchronize between your phone and PC.</p><p>This is an independent, unofficial companion and is not affiliated with Blizzard Entertainment.</p><div class="nx-launch-links"><a href="./privacy.html">Privacy and data guide</a><a href="./getting-started.html">Getting started help</a><a href="https://github.com/zevromxr-hub/nexus-application-gateway/blob/main/azeroth-companion/CHANGELOG.md" target="_blank" rel="noopener noreferrer">Release history</a></div></details></div>';
const heading=overview.querySelector('h2');if(heading)heading.after(launch);else overview.prepend(launch);
const el=id=>document.getElementById(id);
function navigate(name){nav.querySelector('[data-view="'+name+'"]')?.click()}
launch.querySelectorAll('[data-nx-open]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nxOpen)));
el('nxLaunchTalent').addEventListener('click',()=>{
 const find=document.getElementById('talentForge');
 if(find){
  const section=find.closest('[data-section]');
  if(section)navigate(section.dataset.section);
  requestAnimationFrame(()=>find.scrollIntoView({behavior:'smooth',block:'start'}));
  return
 }
 navigate('builds');
});
const KEY='nexus-azeroth-launch-guide-hidden-v7';
let collapsed=false;
try{collapsed=localStorage.getItem(KEY)==='1'}catch(_){}
function setCollapsed(value){collapsed=value;el('nxLaunchContent').hidden=value;el('nxLaunchCollapse').textContent=value?'SHOW GUIDE':'HIDE GUIDE';el('nxLaunchCollapse').setAttribute('aria-expanded',String(!value));try{localStorage.setItem(KEY,value?'1':'0')}catch(_){}}
setCollapsed(collapsed);
el('nxLaunchCollapse').addEventListener('click',()=>setCollapsed(!collapsed));
const install=el('nxInstallNow'),help=el('nxInstallHelp');let deferredInstall=null;
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
const standalone=window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true;
if(standalone){help.textContent='You are running the installed web-app experience on this device.'}
else if(ios){help.textContent='On iPhone: open in Safari, use Share → Add to Home Screen, then select Add. Installed web apps use the same website and online connections.'}
else{help.textContent='On desktop or Android: use your browser’s Install app option when available. Installation support depends on the browser.'}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(!standalone){install.hidden=false;help.textContent='This browser supports direct installation. Use Install Application or your browser’s menu.'}});
install.addEventListener('click',async()=>{if(!deferredInstall)return;const prompt=deferredInstall;deferredInstall=null;install.hidden=true;try{await prompt.prompt();await prompt.userChoice}catch(_){help.textContent='Use the installation option in your browser menu if available.'}});
window.addEventListener('appinstalled',()=>{install.hidden=true;help.textContent='Application installed. Your content remains linked to this browser profile.'});
let checking=false;
el('nxCheckVersion').addEventListener('click',async()=>{
 if(checking)return;checking=true;const btn=el('nxCheckVersion'),status=el('nxVersionStatus');btn.disabled=true;status.textContent='Checking the published release manifest…';
 try{
  const url=new URL('./version.json',location.href);url.searchParams.set('check',Date.now().toString());
  const response=await fetch(url,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('status');
  const release=await response.json();
  if(!/^\d+\.\d+\.\d+$/.test(release.version||''))throw Error('version');
  const baked=document.documentElement.dataset.nxBundleVersion||'7.0.0';
  const version=release.version;
  status.replaceChildren();
  const label=document.createElement('span');
  label.textContent=version===baked?'Published release: v'+version+' · this page matches.':'Published release: v'+version+' · this page was loaded from v'+baked+'.';
  status.append(label);
  if(version!==baked){const action=document.createElement('button');action.type='button';action.className='nx-refresh-button';action.textContent='RELOAD UPDATED WEBSITE';action.addEventListener('click',()=>location.reload());status.append(' ',action)}
 }catch(_){status.textContent='Release check unavailable. You can continue using the companion; check your connection or try again.'}
 finally{checking=false;btn.disabled=false}
});
})();