/* NEXUS | AZEROTH v24.0.1 — Player Information & Guide
 * Documentation-only: no extra Blizzard scopes, no account secrets, no player-data changes.
 * Companion release metadata is fetched from the existing validated release manifest.
 * WoW patch reference is explicitly dated editorial content, NOT automatic patch detection.
 */
(()=>{'use strict';
const nav=document.querySelector('.sidebar .nav'),main=document.querySelector('.main'),footer=main?.querySelector('.footer');
if(!nav||!main||!footer)return;
const WORKER='https://nexus-azeroth-api.zevromxr.workers.dev/account';
const PATCH='https://worldofwarcraft.blizzard.com/en-us/content-update-notes';
const DOCUMENTED_PATCH='12.1.5',PATCH_REVIEW_DATE='2026-11-15';
const flag='nexus_azeroth_player_guide_v41';
const steps=[
 ['Launch and explore','Open the live web companion on iPhone or PC. Use All Tools on mobile or the left navigation on desktop. No install or Battle.net account is required for manual planners.','overview'],
 ['Connect Battle.net (optional)','Open My Azeroth, select your Blizzard account region, authorize the read-only wow.profile scope, and choose Verify & Return. The green Connected · Verified badge represents a short-lived server check, not permanent login.','personal'],
 ['Find a character','On the secure portal, use My Characters when Blizzard provides a roster. Open a character in Public Armory. Use Add to My Planners beside Public Armory (part of the Connected Character Center) to save a character selector with your consent, then open Character Dominion to manage their goals.','armory'],
 ['Find a destination or loot source','Open World Atlas to search sourced real zone maps, inspect selected dungeon and raid boss lineups, and look up Blizzard items without leaving the Atlas. The item or location catalog is not exhaustive.','atlas'],
 ['Research items and equipment','Use Item Codex to look up an item ID, Item Atlas to research and manually organize goals, and Live Armory to inspect Blizzard-reported public gear where available.','atlas'],
 ['Create progression targets','Assign item goals in Character Targets, research acquisition in Loot Hunter, then log manual attempts and character sessions in Farming Operations.','targets'],
 ['Organize group play','Prepare weekly goals in War Room, sketch dungeon routes, write raid encounter notes and assemble a party plan for your friends. Share exported notes or route text deliberately.','warcraft'],
 ['Explore talents','Use Talent Forge to inspect Blizzard-provided Retail tree information and experiment with local drafts. These drafts are not guaranteed to be in-game-valid import strings.','talents'],
 ['Review progress','Open Unified Character Dashboard and Progress Command for summaries of locally saved goals and farming sessions. Counts represent manual records unless explicitly labeled Blizzard-reported.','dashboard'],
 ['Protect your data','Open Sovereign Data Vault, export selected planning sections, save the JSON file somewhere safe and optionally transfer it to another device. Import only trusted backups after reviewing the restore preview.','vault']
];
const sections=[
 {id:'personal',title:'My Azeroth & Connection',desc:'Secure Battle.net authorization, personal characters, mounts, pets and equipped gear where provided. Authentication is hosted on Cloudflare; the public website does not receive Blizzard OAuth tokens.',view:'personal',tag:'Account'},
 {id:'armory',title:'Live Character Armory',desc:'Look up public Retail character profiles and equipped gear by region, realm and character name. Data can lag behind the game and does not show bags or bank inventory.',view:'armory',tag:'Blizzard-reported'},
 {id:'codex',title:'Item Codex & Discovery',desc:'Search and inspect official Retail items by name or numeric ID. Discoverable results depend on Blizzard index coverage and are not a guarantee of a complete item catalog.',view:'codex',tag:'Blizzard data'},
 {id:'world-atlas',title:'World Atlas & Atlas Intelligence',desc:'Search game-derived zone maps, documented entrances, travel and gathering-related landmarks. Inspect curated instance bosses, supported item acquisition steps, and official item records through the existing read-only gateway. Manually track Loot Hunter goals and attempts on this device. iPhone fullscreen has a native Exit Map control. Complete loot tables, spawn heatmaps and interior floor maps are not claimed.',url:'./world-atlas.html',tag:'Maps & loot research'},
 {id:'atlas',title:'Universal Item Atlas',desc:'Save your own item wishlist, farming targets, ownership notes and priorities. The “owned” marker is manually set by you, not automatically verified.',view:'atlas',tag:'Manual tracking'},
 {id:'dominion',title:'Character Dominion',desc:'Select a saved character, see next manual item objectives and logged farming sessions together, assign Atlas items and open public Blizzard profile research on demand.',view:'dominion',tag:'Character command'},
 {id:'targets',title:'Character Targets',desc:'Assign personal item goals and priorities to local character profiles, whether typed by hand or explicitly imported from a selected character link.',view:'targets',tag:'Manual tracking'},
 {id:'loot',title:'Loot Hunter',desc:'Research curated acquisition references, maintain loot wishlists and record farming attempts. Guides should be checked against the current game patch.',view:'loot',tag:'Reference & planner'},
 {id:'farm',title:'Farming Operations',desc:'Log character-specific farming sessions and assignments. Attempts are entered by players; the site does not monitor the WoW client.',view:'loot',tag:'Manual tracking'},
 {id:'warcraft',title:'War Room & Weekly Planning',desc:'Track weekly plans, raid preparation and encounter notes. Organize who will do what with friends without controlling the game.',view:'warcraft',tag:'Group planning'},
 {id:'dungeons',title:'Dungeon Routes',desc:'Write an ordered route or checklist and share the text with your party. This is planning guidance, not live pathfinding or a Mythic+ game addon.',view:'dungeons',tag:'Group planning'},
 {id:'professions',title:'Crafting Lab',desc:'Estimate crafting material costs and profitability using prices you enter yourself. It does not provide live Auction House quotes.',view:'professions',tag:'Manual estimates'},
 {id:'equipment',title:'Gear Analyzer',desc:'Compare player-entered stat priorities and equipment choices; results are estimates rather than simulation or automatically optimized builds.',view:'equipment',tag:'Manual comparison'},
 {id:'talents',title:'Talent Forge',desc:'Explore Blizzard Retail talent nodes and draft research builds. Imports, prerequisites and patch compatibility are not guaranteed in-game.',view:'talents',tag:'Research tool'},
 {id:'utility',title:'Party Architect & Weekly Vault',desc:'Organize class/role composition and weekly reward plans. These are personal planning records, not character eligibility verification.',view:'party',tag:'Group planning'},
 {id:'dashboard',title:'Unified Character Dashboard',desc:'View saved characters, item goals and farming summaries together. It does not silently download or certify a player’s private inventory.',view:'dashboard',tag:'Manual summary'},
 {id:'progress',title:'Progress Command',desc:'Spot overlapping goals and inconsistencies between local modules without automatically rewriting your records.',view:'command',tag:'Manual summary'},
 {id:'vault',title:'Sovereign Data Vault',desc:'Make one selective export for supported local modules and review restores. There is no background cross-device synchronization.',view:'vault',tag:'Backup'}
];
const faqs=[
 ['Is Azeroth an addon or a game modification?','No. It is a separate browser-based companion. It does not install into World of Warcraft, read game memory, automate movement, provide combat advantages or change your Blizzard account.'],
 ['Do I need to own World of Warcraft to use it?','No. Anyone can explore the manual planners and public research tools. A Battle.net account is optional for the secure portal, while useful personal WoW character data requires Blizzard to return game records for that account and region.'],
 ['Why do I see Connected · Verified but no characters?','Blizzard can authenticate your Battle.net account even when it has no WoW character records. Connection verification and game character availability are separate.'],
 ['Will the green account badge stay on permanently?','No. Its status is a recent verification receipt, currently lasting up to two minutes. After it expires you can select Check Connection to verify again through the first-party portal.'],
 ['Can I research boss loot or farm an item without leaving World Atlas?','For documented sources, yes. Open World Atlas, select a boss or item, and inspect supported acquisition steps and related sample loot. Search Official Blizzard Items is read-only and does not automatically verify drop sources. Add Farm Goal to record manual attempts and checklist progress; use optional source references only when needed.'],
 ['Can I exit the Atlas fullscreen map on iPhone?','Yes. Fullscreen opens a native modal; Exit Map stays in the header. Tap a marker to see its coordinates, then choose View Destination Details to return to the main Atlas card. If a previous overlay appears, open the current page directly in Safari.'],
 ['Will old or duplicate studios eventually be removed?','The owner has requested a site-wide usefulness and overlap audit. No destructive removal is approved yet. Any later consolidation must preserve original saved data, links and rollback options, and update both the handbook and assistant.'],
 ['Does Item Atlas automatically know what I own?','No. Item Atlas ownership and farming status are manually recorded. Where provided, the private account portal separately shows Blizzard-reported mounts, pets and equipped items, not full bags, bank or live inventory.'],
 ['Can I use it with a party or guild?','Yes. Share manually prepared routes, lists, exported planning data and notes with people you trust. The site does not currently offer live shared accounts, cross-player syncing or guild dashboards.'],
 ['Can I move data between an iPhone and PC?','Yes, with a user-controlled Sovereign Data Vault export/import file. It is not automatic sync. Always keep a backup and review the restore preview before replacing existing sections.'],
 ['Does it support WoW Classic, PTR or beta?','No verified API integration or game-version support is claimed for Classic, PTR or beta. Some generic manual notes may still be useful there, but connected character, item and talent features are designed around modern Retail Blizzard APIs.'],
 ['Do I need to download anything?','No native installation is required for the hosted companion. Open its HTTPS URL in a modern browser. The app has a web-app manifest for supported Home Screen installations, but complete offline operation has not been established.'],
 ['Who operates this companion?','NEXUS is an independent, unofficial World of Warcraft fan companion. It is not affiliated with or endorsed by Blizzard Entertainment. The secure login is handled by Blizzard via the Cloudflare-hosted authorization portal.']
];
const roadmap=[
 ['Next reliability work','Expand end-to-end browser testing, verify backups across devices, confirm real-player account data and keep a clean Worker recovery process.','Planned'],
 ['Character Dominion follow-ons','Continue improving character identity, goals and public gear research after real-player feedback, without exposing private account data on the public website.','Exploration'],
 ['Collection Atlas improvements','Improve mount and pet reference information, sorting, acquisition notes and supported collection comparisons; never fabricate ownership.','Exploration'],
 ['Party & dungeon workflow','Better group preparation, portable route checklists and planning handoffs, without intrusive game automation.','Exploration'],
 ['Release & compatibility upkeep','Maintain release manifests, Discord announcements, game-patch reference reviews and compatibility notes as Blizzard changes Retail.','Ongoing']
];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const b=document.createElement('button');b.type='button';b.dataset.view='guide';b.textContent='ⓘ Information & Guide';nav.prepend(b);
const host=document.createElement('div');host.id='nexusPlayerGuide';
host.innerHTML='<section class="section" data-section="guide">'+
 '<div class="pg-kicker">NEXUS / PLAYER INTELLIGENCE & GUIDES</div>'+
 '<div class="pg-hero"><div><h2>Information & Player Guide</h2><p>Learn what Azeroth does, how to get started, how to plan real gameplay with friends, what data is reliable, and where development is heading.</p><div class="pg-hero-actions"><button type="button" class="primary" data-pg-nav="overview">OPEN THE COMPANION</button><button type="button" data-pg-nav="personal">CONNECT BATTLE.NET</button><button type="button" data-pg-nav="vault">BACK UP MY DATA</button></div></div><div class="pg-hero-mark" aria-hidden="true">⚔</div></div>'+
 '<div class="pg-index" aria-label="Guide sections"><a href="#pg-start">GETTING STARTED</a><a href="#pg-features">TOOLS & BENEFITS</a><a href="#pg-friends">PLAY WITH FRIENDS</a><a href="#pg-versions">VERSIONS & COMPATIBILITY</a><a href="#pg-roadmap">ROADMAP</a><a href="#pg-faq">FAQ</a></div>'+
 '<div class="pg-metrics" aria-label="Guide overview"><div><strong>Free to explore</strong><span>Optional Battle.net connection</span></div><div><strong>PC + iPhone</strong><span>Browser-based planning</span></div><div><strong>Read-only API</strong><span>No game modifications</span></div><div><strong>Manual + verified</strong><span>Clearly different data sources</span></div></div>'+
 '<section class="pg-section" id="pg-start"><div class="pg-heading"><div><div class="pg-eyebrow">01 / START HERE</div><h3>Your first 10 minutes</h3><p>Follow these steps in order. You can skip account connection if you only want to explore and plan.</p></div><button type="button" id="pgReset">RESET CHECKLIST</button></div><div class="pg-steps" id="pgSteps"></div><p class="pg-note" id="pgStepStatus" role="status"></p></section>'+
 '<section class="pg-section" id="pg-features"><div class="pg-eyebrow">02 / WHAT YOU CAN DO</div><h3>Tools, practical uses and benefits</h3><p>Use the search to find a tool, then select Open to jump into the real working section.</p><label class="pg-search-label" for="pgToolSearch">Find a feature<input id="pgToolSearch" type="search" placeholder="Search characters, mounts, talents, routes, backup…"></label><div class="pg-tool-grid" id="pgToolGrid"></div><p id="pgToolCount" class="pg-note"></p></section>'+
 '<section class="pg-section" id="pg-friends"><div class="pg-eyebrow">03 / REAL GAMEPLAY & GROUPS</div><h3>How it helps during a WoW session</h3><div class="pg-examples">'+
 '<article><strong>Before a dungeon or raid</strong><p>Open War Room, set tonight’s goals, build a party role plan, and share a prepared dungeon route or encounter notes. Your group has a checklist before logging in.</p><button type="button" data-pg-nav="warcraft">OPEN WAR ROOM</button></article>'+
 '<article><strong>While farming a mount or item</strong><p>Research the item in Codex/Atlas, record a Loot Hunter objective, assign it to a character and manually log each farming session. Check progress together later.</p><button type="button" data-pg-nav="loot">OPEN LOOT HUNTER</button></article>'+
 '<article><strong>When choosing gear or talents</strong><p>Review publicly reported character gear where available, use Talent Forge to research possibilities, then compare your own plans. Verify actual results in-game.</p><button type="button" data-pg-nav="talents">OPEN TALENT FORGE</button></article>'+
 '<article><strong>Between PC and phone</strong><p>Export the full set of selected local planners using Sovereign Data Vault, send the file to your other device, preview and selectively import it.</p><button type="button" data-pg-nav="vault">OPEN DATA VAULT</button></article></div><p class="pg-note">There is currently no live party synchronization, live game tracking or multiplayer matchmaking. Share only information you choose to share.</p></section>'+
 '<section class="pg-section" id="pg-versions"><div class="pg-eyebrow">04 / RELEASES & GAME COMPATIBILITY</div><h3>Which versions does Azeroth support?</h3><p>The companion’s release number and Blizzard’s game patch are different things. Read both before assuming a feature is supported.</p><div class="pg-versions-grid"><div class="pg-version-panel"><small>CURRENT HOSTED COMPANION</small><strong id="pgAppVersion">Checking release…</strong><span id="pgAppSubtitle">Reading the published version manifest</span><div class="pg-small" id="pgAppDate"></div><button type="button" id="pgCheckVersion">CHECK LATEST RELEASE</button></div><div class="pg-version-panel"><small>MODERN WORLD OF WARCRAFT RETAIL</small><strong>Midnight · 12.1.5</strong><span>Latest official live Retail content patch referenced in this guide</span><div class="pg-small">Reference checked: November 15, 2026 · Patch compatibility testing is not certified per build</div><a href="'+PATCH+'" target="_blank" rel="noopener noreferrer">VIEW OFFICIAL BLIZZARD PATCH NOTES</a></div></div>'+
 '<div class="pg-compatibility"><div class="pg-compat-row"><strong>Modern Retail</strong><span class="pg-support">PRIMARY API TARGET</span><p>Armory, item, character, equipment and talent research use modern Retail Blizzard API routes. Returned records depend on API availability and supported regions; not a tested guarantee for every game client build.</p></div><div class="pg-compat-row"><strong>Classic / Anniversary / Season of Discovery</strong><span class="pg-unsupported">NOT VERIFIED FOR CONNECTED DATA</span><p>Generic planning notes may still be useful, but no Classic-specific Blizzard API integration, accurate Classic talents or official Classic patch support is claimed.</p></div><div class="pg-compat-row"><strong>PTR / Beta / future Retail patches</strong><span class="pg-unsupported">NOT CERTIFIED</span><p>Changes to game rules, item availability or API responses may affect tools. Check official Blizzard updates; future compatibility requires review and testing.</p></div><div class="pg-compat-row"><strong>Browser platforms</strong><span class="pg-support">WEB COMPANION</span><p>Designed for current desktop and mobile browsers, including iPhone Safari. No Windows installer or in-game addon required; unsupported browsers and complete offline caching are not guaranteed.</p></div></div><h4>Recent companion releases</h4><div class="pg-release-list" id="pgRecentReleases"><div class="pg-note">Fetching release history…</div></div><p class="pg-note" id="pgVersionStatus" role="status">Version information is read from this site’s published release manifest; it does not inspect your installed WoW game client.</p><button type="button" data-pg-nav="releases">OPEN FULL RELEASE CENTER</button></section>'+
 '<section class="pg-section" id="pg-roadmap"><div class="pg-eyebrow">05 / FUTURE DEVELOPMENT</div><h3>What we want to improve next</h3><p>These are development priorities, not released features or promised delivery dates.</p><div class="pg-roadmap" id="pgRoadmap"></div></section>'+
 '<section class="pg-section" id="pg-faq"><div class="pg-eyebrow">06 / HONEST ANSWERS</div><h3>Frequently asked questions</h3><div id="pgFAQ" class="pg-faq"></div><div class="pg-links"><a href="'+WORKER+'/privacy" target="_blank" rel="noopener noreferrer">ACCOUNT PRIVACY</a><a href="./release-notes.html" target="_blank" rel="noopener noreferrer">RELEASE NOTES</a><a href="'+PATCH+'" target="_blank" rel="noopener noreferrer">OFFICIAL WOW UPDATES</a></div></section>'+
 '<footer class="pg-footer">Powered by ZevRo Development | NEXUS · An independent, unofficial World of Warcraft fan companion. Not affiliated with or endorsed by Blizzard Entertainment.</footer>'+
 '</section>';
main.insertBefore(host,footer);
const $=id=>document.getElementById(id);
let done={};try{const v=JSON.parse(localStorage.getItem(flag)||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))done=v}catch(_){}
const save=()=>{try{localStorage.setItem(flag,JSON.stringify(done))}catch(_){/* nonessential guide progress */}};
function jump(view){
 const button=[...nav.querySelectorAll('button[data-view]')].find(x=>x.dataset.view===view);
 if(!button){$('pgVersionStatus').textContent='This tool is unavailable in the current site layout.';return}
 button.click();
 window.scrollTo({top:0,behavior:'instant'});
}
host.addEventListener('click',e=>{const go=e.target.closest('button[data-pg-nav]');if(go)jump(go.dataset.pgNav)});
function renderSteps(){
 $('pgSteps').innerHTML=steps.map(([title,desc,view],i)=>'<article class="pg-step"><label><input type="checkbox" data-pg-done="'+i+'" '+(done[i]?'checked':'')+' aria-label="Mark step '+(i+1)+' complete"><span class="pg-step-num">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+escape(title)+'</strong><small>'+escape(desc)+'</small></span></label><button type="button" data-pg-nav="'+escape(view)+'">OPEN TOOL</button></article>').join('');
 $('pgStepStatus').textContent=steps.filter((_,i)=>!!done[i]).length+' of '+steps.length+' guide steps marked complete on this device. Checklist progress is a personal reminder, not proof of game activity.';
}
$('pgSteps').addEventListener('change',e=>{const n=e.target.closest('input[data-pg-done]');if(!n)return;done[n.dataset.pgDone]=n.checked;save();renderSteps()});
$('pgReset').addEventListener('click',()=>{done={};save();renderSteps()});
function renderTools(q=''){
 const term=q.trim().toLocaleLowerCase();
 const filtered=sections.filter(s=>(s.title+' '+s.desc+' '+s.tag).toLocaleLowerCase().includes(term));
 $('pgToolGrid').innerHTML=filtered.map(x=>'<article class="pg-tool"><span>'+escape(x.tag)+'</span><h4>'+escape(x.title)+'</h4><p>'+escape(x.desc)+'</p><button type="button" data-pg-nav="'+escape(x.view)+'">OPEN TOOL</button></article>').join('')||'<div class="pg-note">No matching tool. Try a broader term.</div>';
 $('pgToolCount').textContent=filtered.length+' of '+sections.length+' documented feature areas shown.';
}
$('pgToolSearch').addEventListener('input',e=>renderTools(e.target.value));
$('pgRoadmap').innerHTML=roadmap.map(([title,desc,status])=>'<article><div><strong>'+escape(title)+'</strong><small>'+escape(status)+'</small></div><p>'+escape(desc)+'</p></article>').join('');
$('pgFAQ').innerHTML=faqs.map(([q,a])=>'<details><summary>'+escape(q)+'</summary><p>'+escape(a)+'</p></details>').join('');
async function fetchVersion(){
 const state=$('pgVersionStatus');state.textContent='Checking the published Azeroth release manifest…';$('pgCheckVersion').disabled=true;
 try{
  const [vResponse,iResponse]=await Promise.all([fetch('./version.json',{cache:'no-store'}),fetch('./releases/index.json',{cache:'no-store'})]);
  if(!vResponse.ok||!iResponse.ok)throw Error('Published release files are unavailable');
  const [v,index]=await Promise.all([vResponse.json(),iResponse.json()]);
  if(!/^\d+\.\d+\.\d+$/.test(v.version)||!Array.isArray(index.releases)||index.releases[0]?.version!==v.version)throw Error('Published release records disagree');
  $('pgAppVersion').textContent='Azeroth v'+v.version;
  $('pgAppSubtitle').textContent=String(v.subtitle||'Current companion release').slice(0,140);
  $('pgAppDate').textContent='Release date: '+String(v.release_date||'not listed').slice(0,20);
  $('pgRecentReleases').replaceChildren();
  for(const item of index.releases.slice(0,8)){
   const div=document.createElement('div'),name=document.createElement('strong'),sub=document.createElement('span');
   name.textContent='v'+String(item.version).slice(0,20)+' · '+String(item.title).slice(0,160);
   sub.textContent=String(item.date||'').slice(0,20);
   div.append(name,sub);$('pgRecentReleases').append(div);
  }
  state.textContent='Release metadata checked. Retail game patch information above is a dated reference and may change independently.';
 }catch(_){
  $('pgAppVersion').textContent='Release status unavailable';
  $('pgAppSubtitle').textContent='Open Release Center for an alternate view';
  $('pgRecentReleases').textContent='Could not load published release history. Local guide content remains available.';
  state.textContent='Could not verify the live manifest. No release number is assumed.';
 }finally{$('pgCheckVersion').disabled=false}
}
$('pgCheckVersion').addEventListener('click',fetchVersion);
renderSteps();renderTools();if(window.NexusStartup?.whenView)window.NexusStartup.whenView('guide',()=>void fetchVersion());else void fetchVersion();
})();