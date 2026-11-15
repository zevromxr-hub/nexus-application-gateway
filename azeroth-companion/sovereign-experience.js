/* NEXUS | AZEROTH v4.4 — SOVEREIGN EXPERIENCE ENGINE
 * Additive WEBSITE SHELL only: homepage, navigation organization, appearance and
 * published release notices. No studio data/API writes or authentication changes.
 */
(()=>{'use strict';
const main=document.querySelector('.main'),nav=document.querySelector('.sidebar .nav'),overview=main?.querySelector('[data-section="overview"]'),top=main?.querySelector('.top');
if(!main||!nav||!overview||!top||document.getElementById('sxExperience'))return;
const KEY='nexus_azeroth_site_shell_v44';
const TYPES={theme:['gold','violet','cyan'],background:['cinematic','soft','minimal'],motion:['auto','reduce'],density:['comfortable','compact'],contrast:['standard','high']};
const defaults={theme:'gold',background:'cinematic',motion:'auto',density:'comfortable',contrast:'standard'};
let data={...defaults,recent:[],collapsed:[],lastSeenVersion:''},version=null,releases=[],lastOpener=null,modal=null,loadPromise=null;
const $=id=>document.getElementById(id);
const text=x=>String(x??'').slice(0,160);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(){
 try{
  const x=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!x||Array.isArray(x)||typeof x!=='object')return;
  for(const [k,allowed]of Object.entries(TYPES))if(allowed.includes(x[k]))data[k]=x[k];
  if(Array.isArray(x.recent))data.recent=[...new Set(x.recent.filter(v=>typeof v==='string'&&/^[a-z0-9-]{2,30}$/.test(v)))].slice(0,8);
  if(Array.isArray(x.collapsed))data.collapsed=x.collapsed.filter(v=>typeof v==='string'&&/^[a-z]+$/.test(v)).slice(0,8);
  if(typeof x.lastSeenVersion==='string'&&/^\d+\.\d+\.\d+$/.test(x.lastSeenVersion))data.lastSeenVersion=x.lastSeenVersion;
 }catch(_){}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(_){/* preferences are optional */}}
read();
function apply(){
 const body=document.body;
 for(const k of Object.keys(TYPES))body.dataset['sx'+k[0].toUpperCase()+k.slice(1)]=data[k];
 for(const sel of document.querySelectorAll('[data-sx-setting]'))if(sel.value!==data[sel.dataset.sxSetting])sel.value=data[sel.dataset.sxSetting];
}
const groups=[
 {id:'home',title:'Home & Discovery',icon:'⌂',views:['overview','guide','releases','fieldlab']},
 {id:'character',title:'Character & Builds',icon:'♜',views:['dominion','dashboard','characters','personal','armory','targets','talents','equipment','builds']},
 {id:'items',title:'Items & Collections',icon:'✧',views:['atlas','codex','loot','collections']},
 {id:'planning',title:'Planning & Operations',icon:'◈',views:['warcraft','dungeons','professions','progress','command','party','quick']},
 {id:'system',title:'Data & Utilities',icon:'⌘',views:['vault','data']}
];
const buttonMap=()=>new Map([...nav.querySelectorAll('button[data-view]')].map(b=>[b.dataset.view,b]));
function categorize(){
 const all=buttonMap(),used=new Set();
 for(const g of groups){
  const owned=g.views.filter(id=>all.has(id));if(!owned.length)continue;
  const box=document.createElement('section');box.className='sx-nav-group';box.dataset.sxGroupId=g.id;
  if(data.collapsed.includes(g.id))box.dataset.collapsed='true';
  const title=document.createElement('button');title.className='sx-nav-toggle';title.type='button';title.dataset.sxGroupToggle=g.id;title.setAttribute('aria-expanded',String(!data.collapsed.includes(g.id)));title.innerHTML='<span aria-hidden="true">'+g.icon+'</span><span>'+g.title+'</span><span class="sx-chevron" aria-hidden="true">⌄</span>';
  const mobileTitle=document.createElement('div');mobileTitle.className='sx-mobile-group-title';mobileTitle.textContent=g.title;
  const items=document.createElement('div');items.className='sx-nav-items';items.id='sx-group-'+g.id;title.setAttribute('aria-controls',items.id);
  for(const id of owned){items.append(all.get(id));used.add(id)}
  box.append(title,mobileTitle,items);nav.append(box);
 }
 const remaining=[...all].filter(([id])=>!used.has(id));
 if(remaining.length){
  const box=document.createElement('section');box.className='sx-nav-group';box.dataset.sxGroupId='other';
  const heading=document.createElement('div');heading.className='sx-mobile-group-title sx-other-title';heading.textContent='More tools';
  const items=document.createElement('div');items.className='sx-nav-items';
  for(const [,btn]of remaining)items.append(btn);
  box.append(heading,items);nav.append(box);
 }
}
categorize();
// Keep the existing iPhone All Tools filter useful after moving links into groups.
// This reads the original search field without modifying the adaptive-navigation studio.
const legacySearch=document.querySelector('.ac-search-wrap input');
function syncMobileSearch(){
 const filtering=Boolean(legacySearch?.value.trim());
 for(const group of nav.querySelectorAll('.sx-nav-group')){
  group.hidden=filtering&&![...group.querySelectorAll('button[data-view]')].some(b=>!b.hidden);
 }
}
legacySearch?.addEventListener('input',()=>requestAnimationFrame(syncMobileSearch));
document.addEventListener('click',e=>{
 if(e.target.closest('[data-ac-more]'))requestAnimationFrame(syncMobileSearch);
});
// The adaptive drawer resets its search when reopened. Reset group visibility too.
// When widening from phone to desktop, remove the old mobile-only filter so all
// studio buttons and categories become available again.
const sxMobileMedia=window.matchMedia('(max-width: 800px)');
sxMobileMedia.addEventListener?.('change',()=>{
 if(!sxMobileMedia.matches&&legacySearch){
  legacySearch.value='';
  legacySearch.dispatchEvent(new Event('input',{bubbles:true}));
 }
 requestAnimationFrame(syncMobileSearch);
});
const drawerObserver=new MutationObserver(rs=>{
 if(rs.some(r=>r.attributeName==='class'&&document.body.classList.contains('ac-menu-open')))
  requestAnimationFrame(syncMobileSearch);
});
drawerObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
nav.addEventListener('click',e=>{
 const toggle=e.target.closest('[data-sx-group-toggle]');
 if(toggle){
  const id=toggle.dataset.sxGroupToggle,group=toggle.closest('.sx-nav-group');
  const collapsed=group.dataset.collapsed!=='true';
  if(collapsed)group.dataset.collapsed='true';else delete group.dataset.collapsed;
  toggle.setAttribute('aria-expanded',String(!collapsed));
  data.collapsed=collapsed?[...new Set([...data.collapsed,id])]:data.collapsed.filter(x=>x!==id);
  save();return;
 }
 const btn=e.target.closest('button[data-view]');if(btn)recordVisit(btn.dataset.view);
});
function recordVisit(view){
 if(!/^[a-z0-9-]{2,30}$/.test(view))return;
 data.recent=[view,...data.recent.filter(x=>x!==view)].slice(0,8);save();
 renderRecent();
 requestAnimationFrame(updateSelectedView);
}
document.addEventListener('click',e=>{
 const jump=e.target.closest('[data-jump]');if(jump)recordVisit(jump.dataset.jump);
});
function updateSelectedView(){
 const active=nav.querySelector('button[data-view].active');
 const id=active?.dataset.view||'overview';
 document.body.classList.toggle('sx-home',id==='overview');
 const wrapper=active?.closest('.sx-nav-group');
 if(wrapper&&wrapper.dataset.collapsed==='true'&&window.matchMedia('(min-width:801px)').matches){
  delete wrapper.dataset.collapsed;
  wrapper.querySelector('[data-sx-group-toggle]')?.setAttribute('aria-expanded','true');
  const g=wrapper.dataset.sxGroupId;
  data.collapsed=data.collapsed.filter(x=>x!==g);save();
 }
}
const activeObserver=new MutationObserver(records=>{
 if(records.some(x=>x.type==='attributes'&&x.attributeName==='class'))requestAnimationFrame(updateSelectedView);
});
activeObserver.observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
function navigate(id){
 const btn=buttonMap().get(id);if(!btn)return;
 btn.click();recordVisit(id);
 window.scrollTo({top:0,behavior:'instant'});
}
const root=document.createElement('div');root.id='sxExperience';root.className='sx-experience';
root.innerHTML='<div class="sx-welcome"><div class="sx-welcome-inner"><span class="sx-eyebrow">NEXUS / SOVEREIGN COMMAND</span><h2 id="sxWelcomeTitle">Your adventure begins here.</h2><p class="sx-welcome-copy">One home for your character research, collection goals, party plans and saved progress. Explore freely or connect to Battle.net when you want official account information.</p><div class="sx-hero-actions"><button class="sx-action-primary" type="button" data-sx-go="dominion">OPEN CHARACTER COMMAND</button><button type="button" data-sx-go="guide">GETTING STARTED</button><button type="button" data-sx-go="personal">MY AZEROTH ACCOUNT</button></div><div class="sx-welcome-foot"><span>✦ <strong id="sxHeroVersion">Checking published version…</strong></span><span>Unofficial read-only companion · PC & mobile</span></div></div><div class="sx-art-seal" aria-hidden="true">✧</div></div>'+
 '<div class="sx-home-split"><section class="sx-home-block"><div class="sx-home-head"><div><span class="sx-eyebrow">YOUR WORKSPACE</span><h3>Continue where you left off</h3></div><button type="button" data-sx-launcher>FIND ANY TOOL</button></div><div id="sxRecent" class="sx-recent"><p class="sx-muted">Open a tool to begin building your recent activity.</p></div></section><section class="sx-home-block"><div class="sx-home-head"><div><span class="sx-eyebrow">LATEST INTELLIGENCE</span><h3>What’s new in Azeroth</h3></div><button type="button" data-sx-updates>ALL UPDATES</button></div><strong class="sx-release-name" id="sxHomeRelease">Checking latest release…</strong><p class="sx-muted" id="sxHomeReleaseNote">Release information is loaded from this website’s published version manifest.</p><button class="sx-text-action" type="button" data-sx-go="releases">OPEN FULL RELEASE CENTER</button></section></div>'+
 '<div class="sx-discover-head"><span class="sx-eyebrow">EXPLORE YOUR COMPANION</span><h3>Choose your next destination</h3></div><div class="sx-destinations"><button type="button" data-sx-go="dominion"><span class="sx-dest-icon" aria-hidden="true">♜</span><strong>Characters</strong><small>Command your saved goals and character research</small><span class="sx-dest-arrow" aria-hidden="true">↗</span></button><button type="button" data-sx-go="atlas"><span class="sx-dest-icon" aria-hidden="true">✧</span><strong>Collections & Items</strong><small>Research items and organize acquisition targets</small><span class="sx-dest-arrow" aria-hidden="true">↗</span></button><button type="button" data-sx-go="warcraft"><span class="sx-dest-icon" aria-hidden="true">◈</span><strong>Adventure Planning</strong><small>Prepare dungeon, crafting and weekly objectives</small><span class="sx-dest-arrow" aria-hidden="true">↗</span></button><button type="button" data-sx-go="vault"><span class="sx-dest-icon" aria-hidden="true">⌘</span><strong>Sovereign Data Vault</strong><small>Export and protect local progress on this device</small><span class="sx-dest-arrow" aria-hidden="true">↗</span></button></div>'+
 '<div class="sx-home-notice">Battle.net connection and private collections stay in the secure My Azeroth portal. Saved plans on this page are local to your browser unless you export them yourself.</div>';
overview.prepend(root);
// Keep the original overview's working character/task/collection metrics, but
// display them ONLY on Home instead of above every separate studio.
const legacyStats=main.querySelector(':scope > .stats');
if(legacyStats)root.after(legacyStats);
function labelFor(id){const b=buttonMap().get(id);return b?b.textContent.replace(/^[^a-zA-Z0-9]+/,'').trim()||id:id}
function renderRecent(){
 const region=$('sxRecent');if(!region)return;
 const launch=(()=>{try{const v=JSON.parse(localStorage.getItem('nexus_azeroth_quick_launch_v36')||'null');return Array.isArray(v?.pinned)?v.pinned.filter(x=>typeof x==='string').slice(0,3):[]}catch(_){return[]}})();
 const keys=[...new Set([...launch,...data.recent.filter(x=>x!=='overview')])].filter(id=>buttonMap().has(id)).slice(0,6);
 region.replaceChildren();
 if(!keys.length){const p=document.createElement('p');p.className='sx-muted';p.textContent='No recent tools yet. Try Character Dominion, Item Atlas, or the Information & Guide.';region.append(p);return}
 for(const id of keys){const btn=document.createElement('button');btn.type='button';btn.dataset.sxGo=id;
  const symbol=document.createElement('span');symbol.className='sx-recent-symbol';symbol.textContent=launch.includes(id)?'★':'↗';
  const label=document.createElement('span');label.textContent=labelFor(id);
  btn.append(symbol,label);region.append(btn);
 }
}
renderRecent();
const toolbar=document.createElement('div');toolbar.className='sx-toolbar';
toolbar.innerHTML='<button type="button" id="sxUpdatesButton" class="sx-tool-button" aria-label="Open Azeroth release updates" title="Azeroth updates"><span aria-hidden="true">♧</span><i id="sxUnread" hidden></i></button><button type="button" id="sxSettingsButton" class="sx-tool-button" aria-label="Open website appearance settings" title="Appearance settings"><span aria-hidden="true">⚙</span></button>';
const chip=top.querySelector('.chip');if(chip)chip.before(toolbar);else top.append(toolbar);
const overlay=document.createElement('div');overlay.id='sxOverlay';overlay.className='sx-overlay';overlay.hidden=true;
overlay.innerHTML='<div class="sx-overlay-scrim" data-sx-close></div><section class="sx-dialog" role="dialog" aria-modal="true" aria-labelledby="sxDialogTitle" tabindex="-1"><div class="sx-dialog-head"><div><span class="sx-eyebrow">NEXUS / SITE EXPERIENCE</span><h2 id="sxDialogTitle">Website settings</h2></div><button type="button" class="sx-close" data-sx-close aria-label="Close panel">×</button></div><div class="sx-dialog-content">'+
 '<div id="sxPreferences"><p class="sx-muted">Personalize the website shell without changing studio functionality, Battle.net permissions or saved gameplay records. Settings remain on this browser.</p><div class="sx-settings-grid">'+
 '<label>Accent style<select data-sx-setting="theme"><option value="gold">Assassin Gold (default)</option><option value="violet">Dominion Violet</option><option value="cyan">Astral Cyan</option></select></label>'+
 '<label>Background visibility<select data-sx-setting="background"><option value="cinematic">Cinematic (default)</option><option value="soft">Softened</option><option value="minimal">Minimal</option></select></label>'+
 '<label>Visual motion<select data-sx-setting="motion"><option value="auto">Respect device setting</option><option value="reduce">Reduce animations</option></select></label>'+
 '<label>Navigation spacing<select data-sx-setting="density"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>'+
 '<label>Contrast<select data-sx-setting="contrast"><option value="standard">Default</option><option value="high">Higher contrast</option></select></label>'+
 '</div><div class="sx-dialog-actions"><button type="button" id="sxResetSettings">RESTORE DEFAULT APPEARANCE</button></div><p class="sx-help">Changes apply immediately to the site frame and background. Each existing studio retains its own controls and gameplay data.</p></div>'+
 '<div id="sxReleasePanel" hidden><p class="sx-muted" id="sxReleaseStatus">Checking published release details…</p><div class="sx-release-hero"><strong id="sxReleaseVersion">Azeroth companion</strong><span id="sxReleaseSubtitle"></span></div><h3>Latest release highlights</h3><div class="sx-changes" id="sxReleaseChanges"></div><h3>Recent releases</h3><div class="sx-history" id="sxReleaseHistory"></div><div class="sx-dialog-actions"><button type="button" id="sxRefreshRelease">CHECK FOR UPDATES</button><button type="button" class="sx-action-primary" id="sxMarkRead">MARK THIS RELEASE AS READ</button><button type="button" data-sx-go="releases">OPEN RELEASE CENTER</button></div></div>'+
 '</div></section>';
document.body.append(overlay);
function openDialog(type){
 const isRelease=type==='updates';
 lastOpener=document.activeElement;modal=type;overlay.hidden=false;document.body.classList.add('sx-dialog-open');
 $('sxDialogTitle').textContent=isRelease?'Azeroth release updates':'Website settings';
 $('sxPreferences').hidden=isRelease;$('sxReleasePanel').hidden=!isRelease;
 apply();
 overlay.querySelector('.sx-dialog').focus({preventScroll:true});
 if(isRelease)void loadRelease();
}
function closeDialog(){
 if(overlay.hidden)return;overlay.hidden=true;modal=null;document.body.classList.remove('sx-dialog-open');
 if(lastOpener?.isConnected)lastOpener.focus({preventScroll:true});
}
overlay.addEventListener('click',e=>{if(e.target.closest('[data-sx-close]'))closeDialog()});
document.addEventListener('keydown',e=>{
 if(overlay.hidden)return;
 if(e.key==='Escape'){e.preventDefault();closeDialog();return}
 if(e.key!=='Tab')return;
 const focusable=[...overlay.querySelectorAll('button:not([disabled]):not([hidden]),select:not([disabled]),a[href]')].filter(el=>el.getClientRects().length&&el.closest('[hidden]')===null);
 if(!focusable.length)return;
 const first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
$('sxUpdatesButton').addEventListener('click',()=>openDialog('updates'));
$('sxSettingsButton').addEventListener('click',()=>openDialog('settings'));
$('sxResetSettings').addEventListener('click',()=>{Object.assign(data,defaults);save();apply()});
overlay.addEventListener('change',e=>{
 const field=e.target.closest('[data-sx-setting]');if(!field)return;
 const k=field.dataset.sxSetting;if(!Object.hasOwn(TYPES,k)||!TYPES[k].includes(field.value))return;
 data[k]=field.value;save();apply();
});
function updateNotice(){
 $('sxUnread').hidden=!version||data.lastSeenVersion===version.version;
 $('sxUpdatesButton').setAttribute('aria-label',version&&data.lastSeenVersion!==version.version?'New Azeroth release '+version.version+'. Open updates':'Open Azeroth release updates');
}
async function loadRelease(force=false){
 if(loadPromise&&!force)return loadPromise;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
 const task=(async()=>{
  try{
   $('sxReleaseStatus').textContent='Checking release metadata…';
   const [vResponse,iResponse]=await Promise.all([fetch('./version.json',{cache:'no-store',signal:controller.signal}),fetch('./releases/index.json',{cache:'no-store',signal:controller.signal})]);
   if(!vResponse.ok||!iResponse.ok)throw Error('Release server unavailable');
   const [v,i]=await Promise.all([vResponse.json(),iResponse.json()]);
   if(!/^\d+\.\d+\.\d+$/.test(v.version)||!Array.isArray(i.releases)||i.releases[0]?.version!==v.version)throw Error('Release records do not agree');
   version={version:v.version,title:text(v.subtitle),date:text(v.release_date),changes:Array.isArray(v.changes)?v.changes.filter(s=>typeof s==='string').slice(0,8):[]};
   releases=i.releases.filter(x=>x&&/^\d+\.\d+\.\d+$/.test(x.version)).slice(0,8);
   $('sxHeroVersion').textContent='Azeroth v'+version.version;
   $('sxHomeRelease').textContent='v'+version.version+' · '+version.title;
   $('sxHomeReleaseNote').textContent=version.changes[0]?text(version.changes[0]):'Open Release Center to read the official changelog.';
   $('sxReleaseStatus').textContent='Published '+(version.date||'date unavailable')+' · GitHub Pages release record';
   $('sxReleaseVersion').textContent='Azeroth v'+version.version;
   $('sxReleaseSubtitle').textContent=version.title;
   $('sxReleaseChanges').replaceChildren();
   for(const change of version.changes){const p=document.createElement('p');p.textContent='✓ '+text(change);$('sxReleaseChanges').append(p)}
   $('sxReleaseHistory').replaceChildren();
   for(const release of releases){const row=document.createElement('div'),name=document.createElement('strong'),day=document.createElement('small');name.textContent='v'+release.version+' · '+text(release.title);day.textContent=text(release.date);row.append(name,day);$('sxReleaseHistory').append(row)}
   updateNotice();
  }catch(_){
   $('sxReleaseStatus').textContent='Cannot confirm the latest published release right now. The rest of Azeroth remains available.';
   if(!version){$('sxHeroVersion').textContent='Release information unavailable';$('sxHomeRelease').textContent='Release information unavailable';$('sxHomeReleaseNote').textContent='Try again using Check for Updates or open the Release Center.'}
  }finally{clearTimeout(timeout)}
 })();
 loadPromise=task;
 try{await task}finally{if(loadPromise===task)loadPromise=null}
}
$('sxRefreshRelease').addEventListener('click',()=>{void loadRelease(true)});
$('sxMarkRead').addEventListener('click',()=>{
 if(!version){$('sxReleaseStatus').textContent='Release verification is unavailable. Recheck before marking as read.';return}
 data.lastSeenVersion=version.version;save();updateNotice();$('sxReleaseStatus').textContent='v'+version.version+' marked as read on this device.';
});
document.addEventListener('click',e=>{
 const action=e.target.closest('[data-sx-go],[data-sx-updates],[data-sx-launcher]');
 if(!action)return;
 if(action.hasAttribute('data-sx-go')){
  const target=action.dataset.sxGo;closeDialog();navigate(target);
 }else if(action.hasAttribute('data-sx-updates'))openDialog('updates');
 else if(action.hasAttribute('data-sx-launcher'))document.querySelector('.azl-trigger')?.click();
});
apply();
document.body.classList.add('sx-ready');updateSelectedView();
$('sxWelcomeTitle').textContent=data.recent.length?'Welcome back to Azeroth.':'Your adventure begins here.';
renderRecent();
void loadRelease();
})();