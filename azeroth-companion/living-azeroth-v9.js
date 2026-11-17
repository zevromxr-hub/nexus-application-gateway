/* NEXUS | AZEROTH COMPANION v9.0 LIVING AZEROTH
 * Additive presentation only. No account API, original rank control, or legacy-save mutation.
 * The only browser write is the optional v9 visual-performance preference.
 */
(()=>{'use strict';
const $=s=>document.querySelector(s), node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el};
const modeKey='nexus_visual_mode_v9',modes=new Set(['cinematic','balanced','performance']);
let mode='balanced';try{const v=localStorage.getItem(modeKey);if(modes.has(v))mode=v}catch(_){}
document.body.classList.add('lv9-visual');const setMode=v=>{if(!modes.has(v))return;mode=v;for(const n of modes)document.body.classList.toggle('lv9-mode-'+n,n===v);try{localStorage.setItem(modeKey,v)}catch(_){}};
setMode(mode);
function chooser(){const row=node('div',undefined,'lv9-modebar');const label=node('strong','Visual atmosphere');const text=node('span','Choose effects for your device:');const select=node('select');select.setAttribute('aria-label','Living Azeroth visual effects');for(const [v,t] of [['cinematic','Cinematic'],['balanced','Balanced'],['performance','Performance']]){const option=node('option',t);option.value=v;select.append(option)}select.value=mode;select.addEventListener('change',()=>setMode(select.value));row.append(label,text,select);return row}
function particles(host){if(host.querySelector('.lv9-cinematic-sky'))return;const sky=node('div',undefined,'lv9-cinematic-sky');sky.setAttribute('aria-hidden','true');for(let i=0;i<17;i++){const el=node('i');el.style.setProperty('--x',((i*47+13)%96)+'%');el.style.setProperty('--dur',(7+(i%5)*2)+'s');el.style.setProperty('--delay',(-i*1.23)+'s');el.style.setProperty('--dx',((i%2?1:-1)*(20+i*3))+'px');sky.append(el)}host.append(sky)}
const portals=[
{title:'Sovereign Ascension',description:'Unified character command',symbol:'✦',color:'amber',url:'./sovereign-ascension.html'},
{title:'Talent Forge',description:'Forge your next build',symbol:'✧',color:'violet',url:'./?studio=talents',section:'talents'},
{title:'Character Armory',description:'Inspect equipped relics',symbol:'⚔',color:'cyan',url:'./character-intelligence.html'},
{title:'Adventure Journal',description:'Raids, Mythic+ and Renown',symbol:'✥',color:'red',url:'./progression-intelligence.html'},
{title:'Azeroth Oracle',description:'Ask a guided question',symbol:'☼',color:'green',url:'./azeroth-assistant.html'}
];
function portal(p){const a=node('a',undefined,'lv9-portal');a.href=p.url;a.dataset.color=p.color;a.append(node('span',p.symbol,'lv9-portal-symbol'),node('strong',p.title),node('small',p.description));return a}
function main(){const root=$('main.main'),hero=root?.querySelector('.hero');if(!root||!hero||$('#lv9HomeGate'))return;
const container=node('section',undefined,'lv9-visual');container.id='lv9HomeGate';const heading=node('h2','Choose your destination','lv9-section-title');const grid=node('nav',undefined,'lv9-destinations');grid.setAttribute('aria-label','Living Azeroth visual destinations');portals.forEach(x=>grid.append(portal(x)));container.append(chooser(),heading,grid);hero.insertAdjacentElement('afterend',container);hero.classList.add('lv9-main-hero');particles(hero);root.classList.add('lv9-world-shell');
const original=hero.querySelector('h1');if(original)original.style.textShadow='0 6px 25px #030615';
for(const p of container.querySelectorAll('a[href*="studio=talents"]'))p.addEventListener('click',e=>{const b=$('[data-view="talents"]')||$('[data-sx-go="talents"]');if(b){e.preventDefault();b.click()}});
function update(){const overview=$('section[data-section="overview"]'),active=$('section[data-section].active');container.hidden=!!(active&&active!==overview);if(container.hidden)container.style.display='none';else container.style.display='';}
const sections=root.querySelectorAll('section[data-section]');if(sections.length){let pending=false;const watch=new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update()})});sections.forEach(n=>watch.observe(n,{attributes:true,attributeFilter:['class']}));update()}}
function sovereign(){const root=$('main.wrap'),summary=$('#nxSovereignSummary');if(!root||!summary||$('#lv9SovereignMast'))return;
const section=node('section',undefined,'lv9-visual');section.id='lv9SovereignMast';
const hero=node('div',undefined,'lv9-hero'),content=node('div',undefined,'lv9-hero-content');content.append(node('div','NEXUS // THE SOVEREIGN CHRONICLE','lv9-kicker'));
const h=node('h1');h.append(document.createTextNode('YOUR LEGEND. '),node('em','YOUR COMMAND.'));content.append(h,node('p','Explore your recorded characters, compare talent paths and research official equipment from one cinematic command hall. Every fact keeps its source.'));
const actions=node('div',undefined,'lv9-actions');for(const [label,url] of [['ENTER THE ARMORY','./character-intelligence.html'],['EXPLORE PROGRESSION','./progression-intelligence.html'],['ASK THE ORACLE','./azeroth-assistant.html']]){const a=node('a',label,'lv9-button'+(actions.children.length?' secondary':''));a.href=url;actions.append(a)}content.append(actions);hero.append(content);particles(hero);
section.append(hero,chooser());const title=node('h2','The Five Great Chambers','lv9-section-title'),grid=node('div',undefined,'lv9-destinations');portals.forEach(p=>grid.append(portal(p)));section.append(title,grid);summary.insertAdjacentElement('beforebegin',section);
const cards=$('#nxPublicCards');if(cards)cards.classList.add('lv9-gear-preview');
}
const slotGlyph=s=>{s=String(s||'').toUpperCase();if(s.includes('HEAD'))return '♜';if(s.includes('SHOULDER'))return '✦';if(s.includes('CHEST'))return '◆';if(s.includes('HAND'))return '✊';if(s.includes('WAIST'))return '◇';if(s.includes('LEG'))return '▥';if(s.includes('FOOT'))return '◈';if(s.includes('TRINKET'))return '☼';if(s.includes('FINGER'))return '◉';if(s.includes('WEAPON')||s.includes('HAND'))return '⚔';if(s.includes('NECK'))return '✧';return '✥'};
function figure(holder,readItems){let last='';const render=()=>{const values=readItems().slice(0,25);const signature=JSON.stringify(values);if(signature===last)return;last=signature;holder.replaceChildren();const header=node('div',undefined,'lv9-runestones');header.append(node('span',values.length+' equipment entries returned by Blizzard','lv9-rune'));holder.append(header);
if(!values.length){const empty=node('p','Equipment has not been loaded, or this Blizzard response contains no supported equipped-item entries. No ownership assumptions are made.');holder.append(empty);return}
const stage=node('div',undefined,'lv9-figure'),left=node('div',undefined,'lv9-slot-col'),center=node('div',undefined,'lv9-figure-center'),right=node('div',undefined,'lv9-slot-col');
const detail=node('div','Select a reported slot to inspect its official item information.','lv9-equip-detail');
values.forEach((entry,i)=>{const b=node('button',undefined,'lv9-slot');b.type='button';b.setAttribute('aria-pressed','false');b.title=entry.text;const glyph=node('span',slotGlyph(entry.slot),'lv9-slot-glyph');const name=node('span',entry.slot);b.append(glyph,name);b.addEventListener('click',()=>{stage.querySelectorAll('.lv9-slot').forEach(n=>n.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');detail.replaceChildren();detail.append(node('strong',entry.text));const desc=node('p',entry.sub||'No more reported information.');detail.append(desc);if(entry.link){const a=node('a','View official item research');a.href=entry.link;a.target='_blank';a.rel='noopener noreferrer';detail.append(a)}});(i%2?right:left).append(b)});
stage.append(left,center,right);holder.append(stage,detail)};return render}
function character(){const host=$('#itemsA');if(!host||$('#lv9ArmoryStage'))return;
const container=node('section',undefined,'lv9-visual');container.id='lv9ArmoryStage';container.append(node('h2','The Living Armory','lv9-section-title'));const intro=node('p','Choose an equipped slot to inspect the real item returned by Blizzard. Empty or missing slots are never presented as unequipped.');container.append(intro);const stage=node('div',undefined,'lv9-chapter');container.append(stage,chooser());host.closest('section.panel')?.insertAdjacentElement('afterend',container);
const render=figure(stage,()=>[...host.querySelectorAll('.item')].map(el=>{const s=el.querySelector('strong')?.textContent||'',sub=el.querySelector('small')?.textContent||'',link=el.querySelector('a')?.href||'';const i=s.indexOf(' · ');return{slot:i>=0?s.slice(0,i):'Slot',text:s,sub,link}}));
new MutationObserver(render).observe(host,{childList:true,subtree:false});render();
}
function progress(){const form=$('#form'),cards=$('#cards');if(!form||!cards||$('#lv9QuestJournal'))return;
const section=node('section',undefined,'lv9-visual');section.id='lv9QuestJournal';section.append(node('div','THE ADVENTURE CHRONICLE','lv9-kicker'),node('h2','Choose Your Next Chapter','lv9-section-title'));
const tabs=node('div',undefined,'lv9-chronicle');const specs=[['mythic','✥','MYTHIC+','Dungeon routes and official recorded runs'],['raids','⚔','RAID CHRONICLE','Encounter records returned by Blizzard'],['reputations','♜','FACTION LEDGER','Standings and Renown where supported']];
let active='mythic';for(const [key,icon,title,desc] of specs){const b=node('button',undefined,'lv9-journal-card');b.type='button';b.dataset.kind=key;b.setAttribute('aria-pressed',String(key===active));b.append(node('span',icon,'lv9-mark'),node('strong',title),node('small',desc));b.addEventListener('click',()=>{active=key;tabs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelector('[data-tab="'+key+'"]')?.click();});tabs.append(b)}
section.append(tabs);const hint=node('div','Choose a chapter above, enter a public character, then select Load. Visual cards below reflect only Blizzard data actually returned.','lv9-inspector');section.append(hint,chooser());form.closest('section.panel')?.insertAdjacentElement('beforebegin',section);
const update=()=>{for(const original of cards.querySelectorAll('.tile'))original.classList.add('lv9-chapter')};
new MutationObserver(update).observe(cards,{childList:true});update();
const results=$('#nxReportResults');if(results)new MutationObserver(()=>{results.querySelectorAll('.tile').forEach(el=>el.classList.add('lv9-chapter'))}).observe(results,{childList:true});
}
function assistant(){const messages=$('#messages');if(!messages||$('#lv9OracleHeader'))return;
const heading=$('main .eyebrow');const section=node('section',undefined,'lv9-visual');section.id='lv9OracleHeader';section.classList.add('lv9-adventure');
const portrait=node('div',undefined,'lv9-adventure-portrait');portrait.setAttribute('role','img');portrait.setAttribute('aria-label','Original violet-and-gold Azeroth Oracle illustration');
const content=node('div');content.append(node('div','YOUR GUIDED ORACLE','lv9-kicker'),node('strong','ZevRo | Azeroth Assistant'),node('p','The oracle draws from the companion’s curated knowledge. Choose a question, discover a studio, or begin a mission. No imaginary Blizzard data and no private account access.'));
const badge=node('span','● Oracle ready · Guided knowledge, not a live AI','lv9-status');badge.id='lv9OracleStatus';content.append(badge);section.append(portrait,content);
const parent=$('main');const layout=parent?.querySelector('.layout');if(layout)layout.insertAdjacentElement('beforebegin',section);else heading?.insertAdjacentElement('afterend',section);
const watch=()=>{const count=messages.querySelectorAll('.bubble').length;const current=$('#lv9OracleStatus');if(!current)return;current.textContent=count>1?'✦ Oracle responded · Check the cited studio':'● Oracle ready · Guided knowledge, not a live AI';};new MutationObserver(watch).observe(messages,{childList:true});
if(document.documentElement.classList.contains('nx-mini')){section.style.padding='10px';section.style.margin='7px 0';portrait.style.minHeight='125px';section.style.gridTemplateColumns='95px minmax(0,1fr)';content.querySelector('p').hidden=true}
}
function talent(){const root=$('#talentForge');if(!root)return;
if(!$('#lv9TalentHeader')){const panel=node('div',undefined,'lv9-visual lv9-talent-header');panel.id='lv9TalentHeader';panel.append(node('div','THE ASCENSION LABORATORY','lv9-kicker'),node('strong','Shape Your Talent Path'),node('p','Inspect official talent names, descriptions and node IDs. Illuminate your allocated choices and inspect each rank without changing the original planner controls.'));root.prepend(panel)}
const tree=$('#tfTree')||root.querySelector('[data-tf-node]')?.parentElement;if(!tree)return;
let inspector=$('#lv9TalentInspector');if(!inspector){inspector=node('section',undefined,'lv9-talent-inspector');inspector.id='lv9TalentInspector';inspector.setAttribute('role','status');inspector.append(node('strong','Select a talent node to inspect it visually'),node('p','No talents have been inspected. Blizzard node data appears when the Talent Forge is loaded.'));tree.insertAdjacentElement('beforebegin',inspector)}
if(tree.dataset.lv9Watching)return;tree.dataset.lv9Watching='true';let selected=null;
const update=()=>{for(const n of tree.querySelectorAll('[data-tf-node]')){n.classList.toggle('lv9-allocated',n.classList.contains('tf-selected'));n.classList.toggle('lv9-selected',n===selected)}};
tree.addEventListener('click',e=>{const card=e.target.closest('[data-tf-node]');if(!card)return;selected=card;update();inspector.replaceChildren();const title=card.querySelector('strong')?.textContent||'Talent node',description=card.querySelector('p')?.textContent||'Description not reported',rank=card.querySelector('.tf-node-controls span')?.textContent||'Rank unavailable';const id=card.dataset.tfNode||'unavailable';inspector.append(node('strong','✦ '+title+' · Node ID '+id),node('p',description+'\nAllocated rank: '+rank+'. Verify build validity in-game.'));});
const obs=new MutationObserver(()=>requestAnimationFrame(update));obs.observe(tree,{childList:true});update();
}
if($('main.main')&&new URLSearchParams(location.search).get('studio')==='talents'){let tries=0;const route=()=>{const b=document.querySelector('.sidebar [data-view="talents"]')||document.querySelector('[data-sx-go="talents"]')||document.querySelector('[data-ac-go="talents"]');if(b){b.click();return}if(tries++<16)setTimeout(route,180)};setTimeout(route,200)}
if($('#itemsA'))character();if($('#cards'))progress();if($('#messages'))assistant();if($('#nxSovereignSummary'))sovereign();if($('main.main'))main();
if($('#talentForge'))talent();if($('main.main')){let scheduled=false;const watch=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;if($('#talentForge'))talent()})});watch.observe($('main.main'),{childList:true,subtree:true})}
})();