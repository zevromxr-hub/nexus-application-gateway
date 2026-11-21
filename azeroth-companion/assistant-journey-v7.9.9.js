/* NEXUS | AZEROTH v24.0.1 — guided player action plans.
 * Static, first-party knowledge; no Blizzard tokens, AI API, or automatic mutations.
 */
(()=>{'use strict';
const root=document.querySelector('main');if(!root||!document.getElementById('askForm'))return;
const plans=[
{id:'build',name:'Build a character',intro:'Create and preserve a practical talent plan.',steps:[
 ['Start with the class and specialization','Open Talent Forge and choose your intended class and spec. Confirm any Blizzard-reported IDs against in-game data.','./'],
 ['Allocate and inspect ranks','Inspect talents, prerequisites, ranks and descriptive effects; adjust your draft manually.','./'],
 ['Compare equipped gear','Check the current public equipment profile if available; item level alone does not establish effectiveness.','./character-intelligence.html'],
 ['Protect your work','Save your local draft and export a backup from Data & Backup.','./']]},
{id:'progress',name:'Research my progression',intro:'See Blizzard-reported Mythic+, raids and reputations together.',steps:[
 ['Choose a public character','Enter the correct region, realm slug and name. No Battle.net sign-in is required for public lookups.','./progression-intelligence.html'],
 ['Run a combined report','Select Build Character Progress Report and review statuses independently. Missing results do not prove missing progress.','./progression-intelligence.html'],
 ['Inspect a specific activity','Use individual Mythic+, Raids or Reputations tabs for more detailed research.','./progression-intelligence.html'],
 ['Save a snapshot','Copy the summary or export JSON for comparison later. No automatic data syncing occurs.','./progression-intelligence.html']]},
{id:'gear',name:'Compare characters and gear',intro:'Assess reported equipment without inventing an upgrade score.',steps:[
 ['Load character A','Choose region, exact realm slug and character name in Character Intelligence.','./character-intelligence.html'],
 ['Add an optional comparator','Compare corresponding equipment slots and inspect item IDs and item levels.','./character-intelligence.html'],
 ['Research relevant items','Search Blizzard items in the World Atlas or Item Codex; consider specialization and actual game effects, not just item level.','./world-atlas.html'],
 ['Record decisions','Create a local goal and back up your plan. Character research does not change the game.','./']]},
{id:'account',name:'Connect and protect my Battle.net session',intro:'Use read-only account services and preserve separate local records.',steps:[
 ['Open secure My Azeroth','Select region and sign in through Blizzard, requesting only the listed wow.profile permissions.','https://nexus-azeroth-api.zevromxr.workers.dev/account'],
 ['Confirm verification','Use Verify & Return if shown. The public status receipt can expire before the underlying OAuth access token.','https://nexus-azeroth-api.zevromxr.workers.dev/account'],
 ['Research available collections','Inspect supported mounts, pets and unlocks; no complete bag/bank/currency inventory is available.','https://nexus-azeroth-api.zevromxr.workers.dev/account'],
 ['Back up browser-local plans','Use Data & Backup before clearing website data or changing devices. Disconnect does not automatically delete local drafts.','./']]},
{id:'farming',name:'Discover and farm an item',intro:'Use Atlas Intelligence to research, track, and revisit supported sources without leaving the map.',steps:[
 ['Find the item or boss','Search World Atlas for a supported item, boss, raid, or dungeon. For uncatalogued item names, use Search Official Blizzard Items.','./world-atlas.html'],
 ['Inspect acquisition guidance','Open the in-app result card, review documented boss or item acquisition steps, and use the map entrance where known. Complete loot tables and resource spawns are not claimed.','./world-atlas.html'],
 ['Save a personal farming goal','Choose Add Farm Goal and use manual checklist and attempt logging; your progress is not verified by game data.','./world-atlas.html'],
 ['Export a backup','Use Save Protection to keep personal records before changing browser, device or site data.','./save-protection.html']]},
{id:'atlas',name:'Find a place on a real WoW map',intro:'Use supported game-derived maps and verified example pins, including iPhone fullscreen controls.',steps:[
 ['Open World Atlas','Choose a zone or search dungeons, raids, gathering-related places and travel nodes across sourced maps.','./world-atlas.html'],
 ['Select a documented marker','Use Show On Map to focus the associated zone. Read map X/Y, reference and available in-app context.','./world-atlas.html'],
 ['Use mobile fullscreen safely','On iPhone, Fullscreen opens a native modal. Exit Map is in the top header; View Destination Details returns to the Atlas card.','./world-atlas.html'],
 ['Copy the waypoint','Choose Copy Game Pin and paste the generated supported UI Map macro into the WoW client yourself. Unsupported maps may reject it.','./world-atlas.html']]},
{id:'testing',name:'Help test current Azeroth',intro:'Check features safely and give the developer useful information.',steps:[
 ['Open Developer Test Requests','Choose only checks you can perform. Prioritize iPhone Atlas fullscreen exit, pin selection, in-app item lookup, farming checklist and current assistant answers.','./player-test-checklist.html#developerRequests'],
 ['Test with a real public character if possible','Verify Blizzard Mythic+, raid and reputation results against known in-game activity, not assumptions.','./progression-intelligence.html'],
 ['Record expected versus actual','Include browser, device, observed result and sanitized error messages; never include tokens or passwords.','./player-test-checklist.html#developerRequests'],
 ['Copy your report','Generate a local report and share it manually through an existing community channel.','./player-test-checklist.html#developerRequests']]}
];
const section=document.createElement('section');section.id='nxJourneyPlanner';section.className='panel';section.setAttribute('aria-label','Azeroth guided action planner');
section.innerHTML='<h2>Mission Architect · Guided Action Plans</h2><p class="small">Choose your goal to build a practical, sourced checklist. This planner does not inspect your game account or change saved companion data.</p><label class="nx-journey-label" for="nxJourneyGoal">Your current goal</label><select id="nxJourneyGoal" class="nx-journey-select"></select><div class="actions"><button type="button" id="nxJourneyGenerate" class="primary">GENERATE ACTION PLAN</button><button type="button" id="nxJourneyCopy" disabled>COPY PLAN</button><button type="button" id="nxJourneyExport" disabled>EXPORT PLAN</button></div><div id="nxJourneyResults" aria-live="polite"></div><p id="nxJourneyStatus" class="small" role="status">Plans are created only when you select Generate.</p>';
const layout=root.querySelector('.layout');if(layout)layout.insertAdjacentElement('afterend',section);else root.append(section);
const select=section.querySelector('#nxJourneyGoal'),results=section.querySelector('#nxJourneyResults'),status=section.querySelector('#nxJourneyStatus');
for(const p of plans){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;select.append(option)}
let active=null;
function textLine(tag,text){const e=document.createElement(tag);e.textContent=text;return e}
function render(p){results.replaceChildren();results.append(textLine('h3',p.name),textLine('p',p.intro));const list=document.createElement('ol');list.className='nx-journey-steps';for(const [name,detail,link] of p.steps){const li=document.createElement('li');const heading=textLine('strong',name),body=textLine('p',detail),a=textLine('a','OPEN RELEVANT STUDIO');a.href=link;a.rel='noopener noreferrer';if(document.documentElement.classList.contains('nx-mini'))a.target='_blank';li.append(heading,body,a);list.append(li)}results.append(list)}
function summary(){if(!active)return '';return ['NEXUS | AZEROTH MISSION ARCHITECT v24.0.1',active.name,active.intro,'',...active.steps.flatMap(([name,detail,link],i)=>[(i+1)+'. '+name,detail,link,'']),'Guided documentation only; review current game and API data independently.'].join('\n')}
section.querySelector('#nxJourneyGenerate').addEventListener('click',()=>{active=plans.find(p=>p.id===select.value)||plans[0];render(active);section.querySelector('#nxJourneyCopy').disabled=false;section.querySelector('#nxJourneyExport').disabled=false;status.textContent='Four guided steps ready. No game data or local plans were changed.'});
section.querySelector('#nxJourneyCopy').addEventListener('click',async()=>{if(!active)return;try{await navigator.clipboard.writeText(summary());status.textContent='Action plan copied. You can share it manually.'}catch(_){status.textContent='Clipboard unavailable. Use Export Plan instead.'}});
section.querySelector('#nxJourneyExport').addEventListener('click',()=>{if(!active)return;const file=new Blob([JSON.stringify({format:'nexus-azeroth-mission-plan-v799',goal:active.id,title:active.name,intro:active.intro,steps:active.steps.map(([name,details,link],i)=>({order:i+1,name,details,link})),createdAt:new Date().toISOString(),disclaimer:'Local guidance; no Blizzard account or saved-plan data'},null,2)],{type:'application/json'}),url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='nexus-azeroth-action-plan.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);status.textContent='Action plan exported locally.'});
const context=new URLSearchParams(location.search).get('topic')||'';if(/talent|build/i.test(context))select.value='build';else if(/progress|mythic/i.test(context))select.value='progress';else if(/armory|gear/i.test(context))select.value='gear';else if(/data|backup/i.test(context))select.value='account';
})();