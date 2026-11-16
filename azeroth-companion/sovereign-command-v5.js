/* NEXUS | AZEROTH v5.0 — SOVEREIGN COMMAND EXPERIENCE
 * Website presentation and discovery only. No studio storage, Blizzard tokens,
 * authenticated calls, character inventories, or account permissions.
 */
(()=>{'use strict';
const home=document.getElementById('sxExperience');
const nav=document.querySelector('.sidebar .nav');
const main=document.querySelector('main.main');
const prefs=document.getElementById('sxPreferences');
const toolbar=document.querySelector('.main .top .sx-toolbar');
if(!home||!nav||!main||!prefs||!toolbar||document.getElementById('nxCommandV5'))return;
const KEY='nexus_azeroth_sovereign_v5';
const presets={text:'standard',home:'cinematic',journey:'new'};
const allowed={text:['standard','comfortable','large'],home:['cinematic','quiet'],journey:['new','returning','group']};
let data={...presets};
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
  for(const [name,options]of Object.entries(allowed))if(options.includes(raw[name]))data[name]=raw[name];
 }
}catch(_){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(_){/* personal site preferences are optional */}};
function apply(){
 document.body.dataset.nxText=data.text;
 document.body.dataset.nxHome=data.home;
 for(const input of document.querySelectorAll('[data-nx-setting]')){
  const key=input.dataset.nxSetting;
  if(Object.hasOwn(allowed,key)&&input.value!==data[key])input.value=data[key];
 }
}
const paths={
 new:{
  eyebrow:'DISCOVER YOUR COMPANION',
  title:'Start with the essentials',
  detail:'Learn which records are manual, explore your tools, and build your first goals without needing a Battle.net login.',
  steps:[
   ['guide','Read the player guide','Understand account connection, collections, and which features use official public data'],
   ['characters','Create a character profile','Organize an optional local character roster and basic planning notes'],
   ['atlas','Discover items','Research items and start recording goals without assuming Blizzard ownership']
  ]
 },
 returning:{
  eyebrow:'CONTINUE YOUR JOURNEY',
  title:'Pick up your next objective',
  detail:'Return to saved planning records and prepare your next activities. Everything here is local to this browser unless you exported it.',
  steps:[
   ['dominion','Open Character Dominion','Review manually tracked priorities and recently recorded activity'],
   ['command','Review progress','Find the next unfinished planning objectives and revisit saved goals'],
   ['vault','Protect your data','Export selected local planning records before moving browsers or devices']
  ]
 },
 group:{
  eyebrow:'PLAN WITH FRIENDS',
  title:'Prepare your next adventure',
  detail:'Use planning tools together, then share decisions with friends yourself. Local records are not synchronized automatically.',
  steps:[
   ['warcraft','Open War Room','Review activities, routes and preparation tools before the group meets'],
   ['dungeons','Review dungeon planning','Check available route and encounter planning tools'],
   ['guide','Use the group-play guide','See practical examples for preparing with friends']
  ]
 }
};
const existing=()=>new Map([...nav.querySelectorAll('button[data-view]')].filter(b=>b.dataset.nxRetired!=='true').map(b=>[
 b.dataset.view,b.textContent.replace(/^[^a-zA-Z0-9]+/,'').trim()||b.dataset.view
]));
function openTool(id){
 const btn=[...nav.querySelectorAll('button[data-view]')].find(b=>b.dataset.view===id);
 if(btn){btn.click();window.scrollTo({top:0,behavior:'instant'})}
}
const section=document.createElement('section');
section.id='nxCommandV5';section.className='nx-command-v5';
section.setAttribute('aria-labelledby','nxCommandHeading');
section.innerHTML='<div class="nx-command-top"><div><span class="sx-eyebrow">NEXUS / SOVEREIGN COMMAND v5</span><h3 id="nxCommandHeading">Choose your journey</h3><p>Every player can begin at a different point. These are guided shortcuts into the tools already available in Azeroth.</p></div><button type="button" id="nxFindTools">FIND ANY TOOL <span aria-hidden="true">⌕</span></button></div>'+
 '<div class="nx-path-tabs" role="group" aria-label="Choose a website journey">'+
 '<button type="button" data-nx-journey="new" aria-pressed="false"><span aria-hidden="true">✦</span> NEW PLAYER</button>'+
 '<button type="button" data-nx-journey="returning" aria-pressed="false"><span aria-hidden="true">◈</span> RETURNING PLAYER</button>'+
 '<button type="button" data-nx-journey="group" aria-pressed="false"><span aria-hidden="true">♜</span> PLAYING WITH FRIENDS</button>'+
 '</div><div class="nx-command-story" id="nxCommandStory"><span class="sx-eyebrow" id="nxJourneyEyebrow"></span><h4 id="nxJourneyTitle"></h4><p id="nxJourneyDetail"></p><div id="nxJourneySteps" class="nx-journey-steps"></div></div>'+
 '<div class="nx-command-trust"><span><strong>Local planning</strong> — saved in this browser</span><span><strong>Blizzard account</strong> — separate secure My Azeroth portal</span><span><strong>Updates</strong> — published release information</span></div>';
const split=home.querySelector('.sx-home-split');
if(split)home.insertBefore(section,split);else home.append(section);
function renderJourney(){
 const selected=paths[data.journey];
 for(const btn of section.querySelectorAll('[data-nx-journey]'))
  btn.setAttribute('aria-pressed',String(btn.dataset.nxJourney===data.journey));
 document.getElementById('nxJourneyEyebrow').textContent=selected.eyebrow;
 document.getElementById('nxJourneyTitle').textContent=selected.title;
 document.getElementById('nxJourneyDetail').textContent=selected.detail;
 const steps=document.getElementById('nxJourneySteps');steps.replaceChildren();
 const names=existing();
 for(const [id,label,description]of selected.steps){
  if(!names.has(id))continue; // avoid dead links if a studio is retired
  const btn=document.createElement('button');btn.type='button';btn.dataset.nxGo=id;
  const top=document.createElement('strong');top.textContent=label;
  const sub=document.createElement('small');sub.textContent=description;
  const arrow=document.createElement('span');arrow.className='nx-step-arrow';
  arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';
  btn.append(top,sub,arrow);steps.append(btn);
 }
}
section.addEventListener('click',event=>{
 const tab=event.target.closest('[data-nx-journey]');
 if(tab){
  if(allowed.journey.includes(tab.dataset.nxJourney)){
   data.journey=tab.dataset.nxJourney;save();renderJourney();
  }
  return;
 }
 const action=event.target.closest('[data-nx-go]');
 if(action)openTool(action.dataset.nxGo);
});
document.getElementById('nxFindTools').addEventListener('click',()=>document.querySelector('.azl-trigger')?.click());
renderJourney();

// Accessible navigation: a skip link, meaningful page titles and a concise
// announcement when the active studio changes. Never move focus away while
// players are typing or using studio controls.
main.id=main.id||'nxMain';
main.setAttribute('tabindex','-1');
const skip=document.createElement('a');
skip.className='nx-skip-link';skip.href='#'+main.id;skip.textContent='Skip to main content';
document.body.insertBefore(skip,document.body.firstChild);
skip.addEventListener('click',event=>{
 event.preventDefault();main.focus({preventScroll:true});main.scrollIntoView({behavior:'instant',block:'start'});
});
const announcer=document.createElement('div');
announcer.id='nxPageAnnouncer';announcer.className='nx-screen-reader-only';
announcer.setAttribute('role','status');announcer.setAttribute('aria-live','polite');
announcer.setAttribute('aria-atomic','true');document.body.append(announcer);
const baseTitle='NEXUS | AZEROTH COMPANION';
let current='';
function synchronizeLocation(view){
 if(typeof view!=='string'||view===current)return;
 const names=existing();
 if(!names.has(view))return;
 current=view;
 const title=names.get(view);
 document.title=view==='overview'?baseTitle:title+' | NEXUS AZEROTH';
 for(const button of nav.querySelectorAll('button[data-view]')){
  if(button.dataset.view===view)button.setAttribute('aria-current','page');
  else button.removeAttribute('aria-current');
 }
 if(view!=='overview')announcer.textContent=title+' section opened';
}
function syncCurrent(){
 const active=nav.querySelector('button[data-view].active');
 synchronizeLocation(active?.dataset.view||'overview');
}
document.addEventListener('nexus:view-activated',event=>synchronizeLocation(event.detail?.view));
syncCurrent();

// Site-shell-only display options. Existing studio themes and local gameplay
// settings remain unchanged; these preferences are scoped to website UI.
const box=document.createElement('fieldset');box.className='nx-display-settings';
box.innerHTML='<legend>v5 Experience & readability</legend>'+
 '<label>Website text comfort<select data-nx-setting="text">'+
 '<option value="standard">Standard</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label>'+
 '<label>Homepage atmosphere<select data-nx-setting="home">'+
 '<option value="cinematic">Cinematic</option><option value="quiet">Quiet and focused</option></select></label>'+
 '<p>These choices affect website navigation, home cards and guidance—not studio data, Blizzard account access, or gameplay.</p>';
const controls=prefs.querySelector('.sx-settings-grid');
if(controls)controls.after(box);else prefs.append(box);
box.addEventListener('change',event=>{
 const field=event.target.closest('[data-nx-setting]');if(!field)return;
 const key=field.dataset.nxSetting;
 if(!Object.hasOwn(allowed,key)||!allowed[key].includes(field.value))return;
 data[key]=field.value;save();apply();
});
document.getElementById('sxResetSettings')?.addEventListener('click',()=>{
 data={...presets};save();apply();renderJourney();
});
apply();
const search=document.querySelector('.azl-trigger');
if(search)search.setAttribute('aria-keyshortcuts','Control+K Meta+K');

// A discreet return-to-top affordance for long desktop/mobile pages.
const toTop=document.createElement('button');toTop.type='button';
toTop.id='nxToTop';toTop.className='nx-to-top';toTop.textContent='↑';
toTop.title='Return to top';toTop.setAttribute('aria-label','Return to top');
toTop.hidden=true;document.body.append(toTop);
toTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
let scrollFrame=0;
function checkScroll(){
 scrollFrame=0;
 const shown=window.scrollY>640;
 if(toTop.hidden===shown)toTop.hidden=!shown;
}
window.addEventListener('scroll',()=>{
 if(scrollFrame)return;
 scrollFrame=requestAnimationFrame(checkScroll);
},{passive:true});
document.addEventListener('nexus:view-activated',()=>requestAnimationFrame(checkScroll));
checkScroll();
document.body.classList.add('nx-v5-ready');
})();