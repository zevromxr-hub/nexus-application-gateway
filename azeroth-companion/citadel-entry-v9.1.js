
/* NEXUS | AZEROTH v9.1 — lightweight standalone Citadel.
 * No Blizzard calls, cookies, credentials, previous save mutations or gameplay data.
 * All new preference/shortcut keys are scoped to the citadel launcher.
 */
(()=>{'use strict';
const seen='nexus_living_entry_seen_v9',modeKey='nexus_visual_mode_v9';
const pinKey='nexus_citadel_pins_v9_1',lastKey='nexus_citadel_last_v9_1';
const modes=['cinematic','balanced','performance'];
const destinations=[
 {key:'sovereign',title:'Sovereign Ascension',sub:'Your character command hall',hero:'YOUR LEGEND. YOUR COMMAND.',desc:'Open character intelligence, compare saved plans and investigate your next objective.',href:'./sovereign-ascension.html'},
 {key:'forge',title:'Talent Forge',sub:'Shape the next build',hero:'FORGE YOUR NEXT BUILD.',desc:'Explore talent paths, allocated ranks and your existing build planner.',href:'./?enter=1&studio=talents'},
 {key:'armory',title:'The Living Armory',sub:'Equipment and item research',hero:'EQUIP YOUR LEGEND.',desc:'Inspect public Blizzard-reported equipment and item research where available.',href:'./character-intelligence.html'},
 {key:'adventure',title:'Adventure Journal',sub:'Dungeons, raids and reputations',hero:'CHOOSE YOUR NEXT CHAPTER.',desc:'Explore Mythic+, raid and reputation records without claiming unsupported progress.',href:'./progression-intelligence.html'},
 {key:'oracle',title:'The Azeroth Oracle',sub:'Guided missions and help',hero:'SEEK KNOWLEDGE.',desc:'Find curated companion guidance, mission planning and explanations.',href:'./azeroth-assistant.html'}
];
const byKey=new Map(destinations.map(d=>[d.key,d]));
const $=(s)=>document.querySelector(s);
const root=$('#nxCitadel');if(!root)return;
const read=(key)=>{try{return localStorage.getItem(key)}catch(_){return null}};
const write=(key,val)=>{try{localStorage.setItem(key,val)}catch(_){}};
let pins=[];try{const p=JSON.parse(read(pinKey)||'[]');if(Array.isArray(p))pins=[...new Set(p.filter(k=>byKey.has(k)))].slice(0,3)}catch(_){}
let selected='sovereign';
const hero=$('#nxHero'),heroTitle=$('#nxHeroTitle'),heroDesc=$('#nxHeroDesc'),heroHref=$('#nxHeroDestination');
function preview(key){const d=byKey.get(key);if(!d)return;selected=key;hero.dataset.scene=key;heroTitle.textContent=d.hero;heroDesc.textContent=d.desc;heroHref.href=d.href;heroHref.dataset.destination=key;heroHref.textContent='ENTER '+d.title.toUpperCase();root.querySelectorAll('[data-preview]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preview===key)))}
root.querySelectorAll('[data-preview]').forEach(b=>b.addEventListener('click',()=>preview(b.dataset.preview)));
root.querySelectorAll('.portal-link').forEach(a=>{a.addEventListener('mouseenter',()=>preview(a.dataset.destination));a.addEventListener('focus',()=>preview(a.dataset.destination))});
function record(key){if(byKey.has(key))write(lastKey,key);try{sessionStorage.setItem(seen,'entered')}catch(_){}}
root.querySelectorAll('[data-destination]').forEach(a=>a.addEventListener('click',()=>record(a.dataset.destination)));
$('#nxEnterApp').addEventListener('click',()=>{try{sessionStorage.setItem(seen,'entered')}catch(_){}});
const quick=$('#nxPinned'),emptyPins=$('#nxPinnedEmpty');
function renderPins(){
 quick.replaceChildren();emptyPins.hidden=!!pins.length;
 for(const key of pins){const d=byKey.get(key),a=document.createElement('a');a.href=d.href;a.textContent=d.title;a.dataset.destination=key;a.addEventListener('click',()=>record(key));quick.append(a)}
 root.querySelectorAll('[data-pin]').forEach(b=>{const isPinned=pins.includes(b.dataset.pin);b.setAttribute('aria-pressed',String(isPinned));b.textContent=isPinned?'★ Saved':'☆ Pin';b.setAttribute('aria-label',(isPinned?'Unpin ':'Pin ')+byKey.get(b.dataset.pin).title)})}
root.querySelectorAll('[data-pin]').forEach(b=>b.addEventListener('click',()=>{
 const key=b.dataset.pin;if(!byKey.has(key))return;
 if(pins.includes(key))pins=pins.filter(k=>k!==key);
 else if(pins.length<3)pins.push(key);
 else{const msg=$('#nxPinStatus');msg.textContent='You can pin up to three destinations. Unpin one to add another.';return}
 write(pinKey,JSON.stringify(pins));$('#nxPinStatus').textContent='Saved to this browser only.';renderPins();
}));
renderPins();
const last=read(lastKey),continueLink=$('#nxContinue');
if(byKey.has(last)){const d=byKey.get(last);continueLink.href=d.href;continueLink.textContent='CONTINUE: '+d.title.toUpperCase();continueLink.dataset.destination=last;continueLink.addEventListener('click',()=>record(last))}
else{continueLink.href='./?enter=1';continueLink.addEventListener('click',()=>{try{sessionStorage.setItem(seen,'entered')}catch(_){}})}

const recentKey='nexus_citadel_recent_view_v91';
try{const recent=JSON.parse(read(recentKey)||'null');if(recent&&typeof recent.view==='string'&&/^[a-z0-9-]{2,30}$/.test(recent.view)){
 const nav=$('#nxContinue');nav.href='./?enter=1&view='+encodeURIComponent(recent.view);nav.textContent='CONTINUE: '+String(recent.label||recent.view).toUpperCase().slice(0,85);
 nav.removeAttribute('data-destination');nav.addEventListener('click',()=>{try{sessionStorage.setItem(seen,'entered')}catch(_){}});
}}catch(_){}
const search=$('#nxStudioSearch'),noResults=$('#nxNoResults'),cards=[...root.querySelectorAll('.portal-wrap')];
search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();let visible=0;for(const card of cards){const d=byKey.get(card.dataset.key);const hit=!q||(d.title+' '+d.sub+' '+d.desc).toLowerCase().includes(q);card.dataset.filtered=String(!hit);visible+=Number(hit)}noResults.hidden=visible>0});
search.addEventListener('keydown',e=>{if(e.key==='Escape'){search.value='';search.dispatchEvent(new Event('input'));search.blur()}});
const select=$('#nxMode'),saved=read(modeKey);
let current=modes.includes(saved)?saved:((matchMedia('(prefers-reduced-motion: reduce)').matches||navigator.connection?.saveData)?'performance':'balanced');
function ensureParticles(){const sky=$('.citadel-ambient');if(!sky||sky.childElementCount||current==='performance'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<13;i++){const p=document.createElement('i');p.style.setProperty('--x',((i*37+11)%97)+'%');p.style.setProperty('--dur',(9+i%4*2)+'s');p.style.setProperty('--delay',(-i*.85)+'s');sky.append(p)}}
function setMode(m){if(!modes.includes(m))return;current=m;for(const mode of modes)document.body.classList.toggle('lv9-mode-'+mode,mode===m);select.value=m;write(modeKey,m);ensureParticles()}
setMode(current);select.addEventListener('change',()=>setMode(select.value));
const changes=$('#nxChanges');
$('#nxChangeLog').addEventListener('toggle',async e=>{
 if(!e.target.open||e.target.dataset.loaded)return;e.target.dataset.loaded='1';
 try{const r=await fetch('./version.json',{credentials:'same-origin'});if(!r.ok)throw Error('unavailable');const v=await r.json();
 changes.replaceChildren();const lead=document.createElement('p');lead.textContent='Current build: '+String(v.version||'unknown')+' · '+String(v.channel||'unverified')+'.';changes.append(lead);
 const ul=document.createElement('ul');for(const item of (Array.isArray(v.changes)?v.changes.slice(0,3):[])){if(typeof item!=='string')continue;const li=document.createElement('li');li.textContent=item.slice(0,240);ul.append(li)}changes.append(ul);
 }catch(_){changes.textContent='Release notes are temporarily unavailable. Open the Player Handbook for current capabilities.'}
});
preview(selected);
let artRequested=false;const updateArt=()=>{if(artRequested)return;artRequested=true;const img=new Image();img.onload=()=>root.classList.add('nx-artpack-ready');img.src='./assets/sovereign-throne-v9.1.webp'};
// Activate preloaded portraits promptly to avoid the old fallback-to-art swap.
updateArt();
})();
