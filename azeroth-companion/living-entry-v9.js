/* NEXUS | AZEROTH v9 — living cinematic entry at the canonical application URL.
 * Non-destructive welcome layer; user enters the existing main app in-place.
 * No Blizzard requests, account access, saved-plan reads or modifications.
 */
(()=>{'use strict';
const KEY='nexus_living_entry_seen_v9';
const params=new URLSearchParams(location.search);
let seen=false;try{seen=sessionStorage.getItem(KEY)==='entered'}catch(_){}
if(params.get('enter')==='1'||params.get('app')==='1'){seen=true;try{sessionStorage.setItem(KEY,'entered')}catch(_){}}
const forced=params.get('gateway')==='1'||params.get('welcome')==='1';
const sourceLink=document.querySelector('.sidebar a[href="./living-azeroth.html"]');
if(sourceLink){sourceLink.href='./?gateway=1';sourceLink.title='Return to the cinematic entrance';}
if(seen&&!forced)return;
if(document.getElementById('lv9EntryGate'))return;
const make=(tag,cl,txt)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(txt!==undefined)e.textContent=txt;return e;};
const modal=make('section','lv9-entry-gate lv9-visual');modal.id='lv9EntryGate';
modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Living Azeroth cinematic welcome');
const wrap=make('div','lv9-entry-wrap');modal.append(wrap);
const nav=make('header','lv9-entry-top');
const brand=make('strong','lv9-entry-brand','NEXUS | AZEROTH COMPANION');
const menu=make('div','lv9-entry-menu');
const guide=make('a','lv9-entry-toplink','Player guide');guide.href='./player-handbook.html';
const appTop=make('button','lv9-entry-toplink','ENTER APPLICATION');appTop.type='button';appTop.dataset.enterApp='true';
menu.append(guide,appTop);nav.append(brand,menu);wrap.append(nav);
const hero=make('section','lv9-hero');
const content=make('div','lv9-hero-content');
content.append(make('div','lv9-entry-eyebrow','LIVING AZEROTH · THE CINEMATIC GATEWAY · v9.0'));
const h=make('h1');h.append(document.createTextNode('YOUR WORLD. '),make('em',null,'YOUR LEGEND.'));content.append(h);
content.append(make('p','lv9-entry-hero-sub','Enter a living fantasy command center. Discover characters, forge talent paths, explore equipment and track your adventures—with the full companion just one click away.'));
const actions=make('div','lv9-entry-hero-actions lv9-actions');
const enter=make('button','lv9-button','ENTER AZEROTH COMPANION');enter.type='button';enter.id='lv9EnterApp';enter.dataset.enterApp='true';
const explore=make('a','lv9-button secondary','EXPLORE THE FIVE CHAMBERS');explore.href='#lv9EntryChambers';
actions.append(enter,explore);content.append(actions);
content.append(make('p','lv9-entry-help','No new download or account required. Existing Battle.net connections, saved builds and studios remain exactly where you left them.'));
hero.append(content);
const sky=make('div','lv9-cinematic-sky');sky.setAttribute('aria-hidden','true');for(let i=0;i<14;i++){const p=make('i');p.style.setProperty('--x',((i*37+11)%97)+'%');p.style.setProperty('--dur',(8+(i%5)*1.7)+'s');p.style.setProperty('--delay',(-i*.91)+'s');sky.append(p)}hero.append(sky);wrap.append(hero);
const modebar=make('div','lv9-entry-mode');const label=make('strong',null,'Visual atmosphere');const help=make('span',null,'Choose your experience:');const select=make('select');select.setAttribute('aria-label','Visual effects mode');for(const [value,title] of [['cinematic','Cinematic'],['balanced','Balanced'],['performance','Performance']]){const o=make('option',null,title);o.value=value;select.append(o)}modebar.append(label,help,select);wrap.append(modebar);
const heading=make('div','lv9-entry-divider');heading.id='lv9EntryChambers';const title=make('div');title.append(make('h2',null,'Choose your destination'),make('p',null,'Five illustrated gateways to working Azeroth studios.'));heading.append(title);
const enter2=make('button','lv9-entry-toplink','Open the full companion');enter2.type='button';enter2.dataset.enterApp='true';heading.append(enter2);wrap.append(heading);
const cards=make('nav','lv9-destinations');cards.setAttribute('aria-label','Select an Azeroth studio');
const portals=[
{glyph:'✦',name:'Sovereign Ascension',caption:'Your character command center',color:'amber',href:'./sovereign-ascension.html'},
{glyph:'✧',name:'Talent Forge',caption:'Builds, skills and specialization',color:'violet',href:'./?enter=1&studio=talents'},
{glyph:'⚔',name:'The Living Armory',caption:'Blizzard-reported equipment intelligence',color:'cyan',href:'./character-intelligence.html'},
{glyph:'✥',name:'Adventure Journal',caption:'Mythic+, raids and reputations',color:'red',href:'./progression-intelligence.html'},
{glyph:'☼',name:'ZevRo | Azeroth Oracle',caption:'Guided questions and mission planning',color:'green',href:'./azeroth-assistant.html'}
];
for(const p of portals){const link=make('a','lv9-portal');link.href=p.href;link.dataset.color=p.color;link.append(make('span','lv9-portal-symbol',p.glyph),make('strong',null,p.name),make('small',null,p.caption));cards.append(link)}wrap.append(cards);
const quick=make('nav','lv9-entry-quick');quick.setAttribute('aria-label','Additional companion shortcuts');
for(const [name,url] of [['Character research','./character-intelligence.html'],['Player handbook','./player-handbook.html'],['Developer test requests','./player-test-checklist.html#developerRequests'],['NEXUS Gateway','../hub/']]){const link=make('a',null,name);link.href=url;quick.append(link)}wrap.append(quick);
const footcard=make('section','lv9-entry-footcard');const footText=make('div');footText.append(make('strong',null,'Ready to explore the full experience?'),make('small',null,'One click opens your existing companion with all navigation, music, account controls and saved plans intact.'));const footButton=make('button','lv9-button','OPEN COMPLETE COMPANION');footButton.type='button';footButton.dataset.enterApp='true';footcard.append(footText,footButton);wrap.append(footcard);
wrap.append(make('footer','lv9-entry-footnote','POWERED BY ZEVRO | NEXUS · Independent World of Warcraft fan companion · Illustrations are atmospheric artwork, not in-game character data'));
document.body.append(modal);
const layout=document.querySelector('body>.layout');
const previous=document.activeElement;
function saveEntered(){try{sessionStorage.setItem(KEY,'entered')}catch(_){}}
function close(){saveEntered();modal.hidden=true;modal.remove();document.body.classList.remove('lv9-entry-open');if(layout)layout.removeAttribute('inert');const main=document.querySelector('main.main');if(main){main.setAttribute('tabindex','-1');main.focus({preventScroll:true});window.scrollTo(0,0);}else if(previous?.isConnected)previous.focus();}
modal.querySelectorAll('[data-enter-app]').forEach(b=>b.addEventListener('click',close));
modal.querySelectorAll('a.lv9-portal,a[href^="./player"],a[href="../hub/"]').forEach(a=>a.addEventListener('click',saveEntered));
modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();return}if(e.key!=='Tab')return;const visible=[...modal.querySelectorAll('a[href],button:not([disabled]),select:not([disabled])')].filter(n=>n.getClientRects().length);const first=visible[0],last=visible[visible.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
document.body.classList.add('lv9-entry-open');if(layout)layout.setAttribute('inert','');
const modes=new Set(['cinematic','balanced','performance']);const pref='nexus_visual_mode_v9';
let current='balanced';try{const stored=localStorage.getItem(pref);if(modes.has(stored))current=stored}catch(_){}
function setMode(v){if(!modes.has(v))return;for(const option of modes){modal.classList.toggle('lv9-mode-'+option,option===v);document.body.classList.toggle('lv9-mode-'+option,option===v);}select.value=v;try{localStorage.setItem(pref,v)}catch(_){}}
setMode(current);select.addEventListener('change',()=>setMode(select.value));
enter.focus({preventScroll:true});
})();