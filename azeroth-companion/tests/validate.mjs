import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const read=p=>readFile(path.join(root,p),'utf8');
const html=await read('azeroth-companion/index.html');
const preservation=await read('azeroth-companion/account-persistence-v7.9.1.js');
const updatedReceipt=await read('azeroth-companion/verified-connection.js');
const privateWorker=await read('azeroth-companion/backend/worker-v7.9.1-single.js');
new vm.Script(preservation);
new vm.Script(updatedReceipt);
assert.match(html,/account-persistence-v7\.9\.1\.js\?v=791/,'Saved progress panel must load');
assert.match(html,/account-persistence-v7\.9\.1\.css\?v=791/,'Saved progress styles must load');
assert.match(html,/scripts-experience-v5\.2\.js\?v=791/,'Updated verification bundle must bypass cache');
assert.match(preservation,/nexus_azeroth_talent_forge_v1/,'Local saved Talent Forge progress must remain independent of login');
assert.ok(!preservation.includes('localStorage.setItem'),'Account persistence view must not write or clear saved records');
assert.match(updatedReceipt,/end-start>900000/,'Proof should be limited to 15 minutes');
assert.match(privateWorker,/Math\.min\(86400/,'Account cookie must not exceed 24 hours');
assert.match(privateWorker,/Number\(d\.expires_in\)/,'Account cookie must honor Blizzard token expiry');
assert.match(privateWorker,/checkedAt\+900000/,'Server verified receipt must expire at most 15 minutes');
assert.match(privateWorker,/\/api\/me\/unlocks\//,'Private unlock explorer must exist');
assert.match(privateWorker,/\/api\/me\/achievements/,'Character achievements endpoint must exist');
assert.ok(!privateWorker.includes('localStorage.setItem'),'Cloudflare Worker must not store user plans in localStorage');
const parsedWorker=privateWorker.replace(/export default\s*\{/,'const workerDefault={');
const privatePortal=vm.runInNewContext(parsedWorker+';({page:PAGE_791,client:CLIENT_791})');
new vm.Script(privatePortal.client);
assert.match(privatePortal.page,/id="unlocksPanel"/,'Private portal must expose unlock browser');
assert.match(privatePortal.client,/showUnlocks/,'Private portal client must render unlocked entries');

const acquisition=await read('azeroth-companion/acquisition-specialization-v7.9.js');
new vm.Script(acquisition);
assert.match(html,/acquisition-specialization-v7\.9\.js\?v=790/,'Acquisition and specialization intelligence must load');
assert.match(html,/acquisition-specialization-v7\.9\.css\?v=790/,'Acquisition and specialization styles must load');
for(const name of ['loot-sources.json','nexus_azeroth_loot_hunter_v1','NexusTalentSourceBridge','nxAiFilter','nxSpecCategory','nxSpecList'])
 assert.ok(acquisition.includes(name),'Source intelligence integration missing: '+name);
assert.ok(!acquisition.includes('localStorage.setItem'),'Research modules must not change saved goals or talents');
assert.ok(!acquisition.includes('nexus:loot-track'),'Research modules must not automatically change tracking');

const warcraftResearch=await read('azeroth-companion/warcraft-research-v7.8.js');
new vm.Script(warcraftResearch);
assert.match(html,/warcraft-research-v7\.8\.js\?v=780/,'Warcraft Research must load');
assert.match(html,/warcraft-research-v7\.8\.css\?v=780/,'Warcraft Research styles must load');
for(const name of ['nexus:armory-intelligence-ready','nexus_azeroth_item_atlas_v1','nexus_azeroth_loot_hunter_v1','nexus_azeroth_character_targets_v1','nexus:loot-track','NexusTalentSourceBridge','cxItemForm','nxWrFilter'])
 assert.ok(warcraftResearch.includes(name),'Warcraft Research integration missing '+name);
assert.ok(!warcraftResearch.includes('fetch('),'Research board must not add API requests');
assert.ok(!warcraftResearch.includes('localStorage.setItem'),'Research board must only invoke existing Loot Hunter events');
assert.match(warcraftResearch,/shown\.slice\(0,visible\)/,'Research cards should be rendered in batches');

const welcome=await read('azeroth-companion/welcome-soundtrack-v7.7.2.js');
const welcomeStyles=await read('azeroth-companion/welcome-soundtrack-v7.7.2.css');
const soundtrackConfig=JSON.parse(await read('azeroth-companion/site-soundtrack.json'));
new vm.Script(welcome);
assert.match(html,/welcome-soundtrack-v7\.7\.2\.js\?v=772/,'Welcome music module must load');
assert.match(html,/welcome-soundtrack-v7\.7\.2\.css\?v=772/,'Welcome music stylesheet must load');
assert.match(html,/hyper-access-v7\.1\.css\?v=772/,'Desktop launcher position must cache refresh');
assert.match(welcomeStyles,/\.nx-welcome-mobile-slot/,'Welcome one-tap action belongs in mobile header');
assert.match(welcome,/nxMusicAudio/,'Welcome music uses the existing audio instance');
assert.match(welcome,/navigator|matchMedia/,'Autoplay flow must adapt to browser');
assert.ok(!welcome.includes('localStorage.'),'No alteration of private playlists');
assert.equal(soundtrackConfig.file,'./assets/nexus-intro.mp3');
const hyperCSS=await read('azeroth-companion/hyper-access-v7.1.css');
assert.match(hyperCSS,/@media\(min-width:801px\)/,'Desktop-only right stack required');
assert.match(hyperCSS,/right:max\(16px,env\(safe-area-inset-right\)\)/,'Desktop stack aligns with Founder');
 
const founder=await read('azeroth-companion/founder-bubble-v7.7.1.js');
const founderStyles=await read('azeroth-companion/founder-bubble-v7.7.1.css');
new vm.Script(founder);
assert.match(html,/founder-bubble-v7\.7\.1\.js\?v=771/,'Founder shortcut must load');
assert.match(html,/founder-bubble-v7\.7\.1\.css\?v=771/,'Founder styles must load');
assert.doesNotMatch(html,/<a class="nx-developer-nav-link"/,'Old sidebar developer link must be removed');
assert.match(founder,/\.\/developer\.html/,'Founder shortcut must open existing identity page');
assert.match(founder,/zevro-music-crest\.webp/,'Founder shortcut must use official existing crest');
assert.match(founder,/nxFounderMobileSlot/,'Founder mobile header slot expected');
assert.match(founderStyles,/@media\(max-width:800px\)/,'Founder bubble must fit mobile');
assert.ok(!founder.includes('fetch('),'Founder bubble must not contact network services');
assert.ok(!founder.includes('localStorage.'),'Founder bubble must not alter saved records');
 
const integrity=await read('azeroth-companion/integrity-center-v7.7.js');
const playerChecklist=await read('azeroth-companion/player-test-checklist.html');
new vm.Script(integrity);
assert.match(html,/integrity-center-v7\.7\.js\?v=770/,'Integrity Center module must be loaded');
assert.match(html,/integrity-center-v7\.7\.css\?v=770/,'Integrity Center styles must be loaded');
assert.match(integrity,/nxIntegrityRun/,'Local diagnostic action required');
assert.match(integrity,/nxIntegrityResults/,'Local diagnostic results required');
assert.match(integrity,/player-test-checklist\.html/,'Tester checklist must be linked');
assert.ok(!integrity.includes('fetch('),'Read-only integrity checks must never call the network');
assert.ok(!integrity.includes('localStorage.'),'Read-only integrity checks must not touch saved records');
assert.match(playerChecklist,/\[NOT VERIFIED\]/,'Tester checklist must retain unverified state');
const qaScripts=[...playerChecklist.matchAll(/<script>([\s\S]*?)<\/script>/g)];
for(const q of qaScripts)new vm.Script(q[1]);

const recovery=await read('azeroth-companion/reliability-center-v7.6.js');
new vm.Script(recovery);
assert.match(html,/reliability-center-v7\.6\.js\?v=760/,'v7.6 recovery module must be linked');
assert.match(html,/reliability-center-v7\.6\.css\?v=760/,'v7.6 recovery styles must be linked');
for(const id of ['cxCharacterForm','cxItemForm','cxStatus','nxRecoveryArmory','nxRecoveryCodex'])
 assert.ok(recovery.includes(id),'Missing recovery integration: '+id);
assert.ok(recovery.includes('requestSubmit'),'Recovery must use native form validation');
assert.ok(recovery.includes("addEventListener('offline'"),'Browser offline state must be handled');
assert.ok(!recovery.includes('fetch('),'Recovery should not make independent remote requests');
assert.ok(!recovery.includes('localStorage.'),'Recovery must not touch saved records');

const performanceOverdrive=await read('azeroth-companion/performance-overdrive-v7.5.js');
new vm.Script(performanceOverdrive);
assert.match(html,/performance-overdrive-v7\.5\.js\?v=750/,'Performance profile must load');
assert.match(html,/performance-overdrive-v7\.5\.css\?v=750/,'Performance profile styles must load');
assert.match(html,/sovereign-intelligence-v7\.3\.js\?v=750/,'Updated equipment list must bypass stale cache');
assert.match(performanceOverdrive,/nx-performance-lite/,'Lightweight mode must remain optional');
assert.ok(!performanceOverdrive.includes('fetch('),'Performance mode must not make network requests');
const equipmentIntelligence=await read('azeroth-companion/sovereign-intelligence-v7.3.js');
assert.match(equipmentIntelligence,/sorted\.slice\(0,visibleLimit\)/,'Bounded equipment list expected');
assert.match(equipmentIntelligence,/document\.createDocumentFragment\(\)/,'Equipment rendering should use a fragment');

const mastery=await read('azeroth-companion/sovereign-mastery-v7.4.js');
new vm.Script(mastery);
assert.match(html,/sovereign-mastery-v7\.4\.js\?v=740/,'v7.4 mastery module must load');
assert.match(html,/sovereign-mastery-v7\.4\.css\?v=740/,'v7.4 mastery styles must load');
assert.match(mastery,/nexus:armory-intelligence-ready/,'Mastery reads only sanitized Armory results');
assert.match(mastery,/NexusTalentSourceBridge/,'Talent context reads the existing source snapshot');
assert.ok(!mastery.includes('fetch('),'Mastery must not create extra network requests');
assert.ok(!mastery.includes('localStorage.'),'Mastery must not change stored builds');

const intelligence=await read('azeroth-companion/sovereign-intelligence-v7.3.js');
new vm.Script(intelligence);
assert.match(html,/sovereign-intelligence-v7\.3\.js\?v=750/,'v7.3 intelligence must load after existing Armory');
assert.match(html,/sovereign-intelligence-v7\.3\.css\?v=730/,'v7.3 intelligence CSS must load');
assert.match(html,/scripts-core-v4\.8\.js\?v=730/,'Fresh Armory event source required');
const publicArmory=await read('azeroth-companion/connected-armory.js');
const publishedCore=await read('azeroth-companion/scripts-core-v4.8.js');
assert.match(publicArmory,/nexus:armory-intelligence-ready/,'Armory must emit normalized public response');
assert.match(publishedCore,/nexus:armory-intelligence-ready/,'Compiled bundle must emit normalized public response');
assert.match(intelligence,/nexus:armory-intelligence-ready/,'Intelligence must consume the normalized response');
assert.ok(!intelligence.includes('fetch('),'Intelligence layer must not generate new remote requests');

const developer=await read('azeroth-companion/developer.html');
const publicHistory=await read('azeroth-companion/release-notes.html');
assert.match(founder,/\.\/developer\.html/,'Developer Identity redirect must remain available through Founder shortcut');
assert.match(developer,/zevro-music-crest\.webp/,'Developer profile must use verified existing crest');
assert.match(publicHistory,/\.\/releases\/index\.json/,'First-party update page must read release records');
assert.doesNotMatch(html,/GitHub/i,'No repository-platform branding in public homepage');
assert.doesNotMatch(developer,/github/i,'No repository-platform branding in developer page');
assert.doesNotMatch(publicHistory,/github/i,'No repository-platform branding in public release page');
const hyperAccess=await read('azeroth-companion/hyper-access-v7.1.js');
const polish=await read('azeroth-companion/performance-polish-v7.1.js');new vm.Script(polish);
assert.match(html,/performance-polish-v7\.1\.js\?v=712/,'Image performance module included');
assert.match(hyperAccess,/siteTop\.append\(mobileMusicSlot\)/,'Mobile Hyper Music must live in the main top header');
assert.match(hyperAccess,/mobileMusicSlot\.append\(music\)/,'Mobile launcher must move into the header flow');
assert.match(hyperAccess,/document\.body\.append\(music\)/,'Desktop launcher must stay floating');
assert.match(html,/hyper-access-v7\.1\.js\?v=712/,'Mobile patch cache refresh must load');
new vm.Script(hyperAccess);
assert.match(html,/hyper-access-v7\.1\.js\?v=712/,'Hyper Music addon must be deployed');
assert.match(html,/scripts-core-v4\.8\.js\?v=730/,'Compiled core must be cache-refreshed');
assert.match(html,/scripts-experience-v5\.2\.js\?v=791/,'Compiled experience must be cache-refreshed');
for(const id of ['nxHyperMusic','nxRetiredArchive','nxMusicOpen','nxMusicDock']){
 assert.ok(hyperAccess.includes(id),'Missing Hyper Access hook: '+id);
}
const oldVault=await read('azeroth-companion/player-utility.js');
const backupVault=await read('azeroth-companion/sovereign-vault.js');
const compiledCore=await read('azeroth-companion/scripts-core-v4.8.js');
assert.match(oldVault,/data-section="weekly-vault"/,'The old Weekly Vault must have its unique route');
assert.match(compiledCore,/data-section="weekly-vault"/,'The published core bundle must share the fix');
assert.match(backupVault,/data-section="vault"/,'The Sovereign Data Vault must retain its original route');

assert.match(html,/warcraft-overdrive\.js/);assert.match(html,/warcraft-overdrive\.css/);
assert.match(html,/id="nxCanonicalVersion"[^>]*>AZEROTH v7\.9\.6/);
assert.match(html,/player-utility\.js/);
assert.match(html,/player-utility\.css/);
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);assert.ok(inline.length>=1,'At least one inline companion script required');
inline.forEach(s=>new vm.Script(s));
const js=await read('azeroth-companion/warcraft-overdrive.js');new vm.Script(js);
for(const id of ['wowRouteForm','wowCraftForm','wowGearFields','wowWeeklyForm','wowEncounterForm','wowReleaseHistory','wowCheckUpdates','wowExport'])assert.ok(js.includes(id),'Missing '+id);
const version=JSON.parse(await read('azeroth-companion/version.json'));
const index=JSON.parse(await read('azeroth-companion/releases/index.json'));
assert.equal(version.version,'7.9.6');
assert.equal(version.channel,'staging','New progression endpoints must remain staged until live Cloudflare testing');
assert.equal(index.releases[0].version,'7.9.3','Discord release index must remain on last published release during staging');
const previousRelease=JSON.parse(await read('azeroth-companion/releases/v7.9.3.json'));
assert.equal(previousRelease.version,'7.9.3');
assert.ok(previousRelease.features.length>=5);
const progression=await read('azeroth-companion/progression-intelligence.html');
assert.match(html,/progression-intelligence\.html/,'Progression navigation must exist');
assert.match(progression,/\/api\/progression\//,'Progression page must use restricted public proxy');
for(const section of ['mythic','raids','reputations'])assert.ok(progression.includes(section),'Missing progression section '+section);
for(const code of progression.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(code[1]);
const handoffBridge795=await read('azeroth-companion/character-handoff-v7.9.5.js');
new vm.Script(handoffBridge795);
assert.match(await read('azeroth-companion/character-intelligence.html'),/character-handoff-v7\.9\.5\.js/,'Gear comparison must include research handoff');
assert.match(progression,/character-handoff-v7\.9\.5\.js/,'Progression must include research handoff');
for(const item of ['progression-intelligence.html','character-intelligence.html','URLSearchParams','region','realm','character','clipboard.writeText'])
 assert.ok(handoffBridge795.includes(item),'Missing handoff behavior: '+item);
assert.ok(!handoffBridge795.includes('fetch('),'Research handoff must not make new requests');
assert.ok(!handoffBridge795.includes('localStorage'),'Research handoff must never alter stored plans');
assert.ok(!handoffBridge795.includes('access_token'),'Research link must not include account tokens');
const handbook795=await read('azeroth-companion/player-handbook.html');
const checklist795=await read('azeroth-companion/player-test-checklist.html');
const getting795=await read('azeroth-companion/getting-started.html');
const changelog795=await read('azeroth-companion/CHANGELOG.md');
for(const page of [handbook795,checklist795,getting795])assert.match(page,/7\.9\.5/,'Guide and tester copy must match version');
assert.match(checklist795,/v7\.9\.5 reverse handoff/,'Tester report must include reverse handoff');
assert.match(changelog795,/v7\.9\.5/,'History must document v7.9.5');
const report796=await read('azeroth-companion/progress-report-v7.9.6.js');
new vm.Script(report796);
assert.match(progression,/progress-report-v7\.9\.6\.js\?v=796/,'Combined progress report must load');
for(const expected of ['mythic','raids','reputations','AbortController','EXPORT COMBINED JSON','COPY SUMMARY','JSON.stringify','cache:'])
 assert.ok(report796.includes(expected),'Combined report missing: '+expected);
assert.ok(!report796.includes('localStorage'),'Combined report must not modify saved data');
assert.ok(!report796.includes('access_token'),'Combined report must not expose Blizzard OAuth tokens');
const changelog796=await read('azeroth-companion/CHANGELOG.md');
const handbook796=await read('azeroth-companion/player-handbook.html');
const getting796=await read('azeroth-companion/getting-started.html');
const checklist796=await read('azeroth-companion/player-test-checklist.html');
const deviceQA796=await read('azeroth-companion/QA-DEVICE-ACCEPTANCE.md');
const releasePage796=await read('azeroth-companion/release-notes.html');
for(const doc of [changelog796,handbook796,getting796,checklist796,deviceQA796,releasePage796])assert.match(doc,/7\.9\.6/,'Release documentation out of sync');
assert.match(checklist796,/v7\.9\.6 partial failure/,'Developer checklist requires partial failure check');
assert.match(changelog796,/Character Progress Report/,'Changelog must document report');
const progressWorker=await read('azeroth-companion/backend/worker-v7.9.4-single.js');
new vm.Script(progressWorker.replace('export default {','const workerDefault={'));
for(const route of ['mythic-keystone-profile','encounters/raids','reputations','spell-media','/api/me/','/api/companion/verify'])
 assert.ok(progressWorker.includes(route),'Progression Worker must preserve '+route);
assert.ok(!progression.includes('BLIZZARD_CLIENT_SECRET'),'No Blizzard credentials in public research page');
const hub=await read('hub/index.html');assert.match(hub,/id:'azeroth'/);assert.match(hub,/v7\.9\.6 • Progress Report Preview/);
for(const keep of ["id:'reactor'","id:'foundry'","id:'alchemist'"])assert.ok(hub.includes(keep));
const {payload}=await import('../scripts/announce-release.mjs');
const body=payload({version:'7.9.3'},previousRelease);
assert.match(body.embeds[0].title,/AZEROTH COMPANION/);
assert.equal(body.allowed_mentions.parse.length,0);assert.ok(!JSON.stringify(body).includes('DISCORD_RELEASE_WEBHOOK'));
const utility=await read('azeroth-companion/player-utility.js');new vm.Script(utility);
for(const name of ['Party Architect','Weekly Vault','Devourer','puImportParty','puCopyParty','puExportVault','puCharacter','puPartyFeedback'])assert.ok(utility.includes(name),'Missing player utility '+name);
assert.ok(!utility.includes('fetch('),'Player utility must work locally without third-party requests');
const css=await read('azeroth-companion/player-utility.css');assert.ok(css.includes('@media(max-width:760px)'));
assert.match(html,/connected-armory\.js/);
assert.match(html,/connected-armory\.css/);
const live=await read('azeroth-companion/connected-armory.js');new vm.Script(live);
assert.ok(live.includes('nexus-azeroth-api.zevromxr.workers.dev'));
for(const part of ['cxCharacterForm','cxItemForm','cxEquipment','cxWishlist','cxRecent','/api/item/','/api/character/'])assert.ok(live.includes(part),'Missing connected feature '+part);
assert.ok(!live.includes('BLIZZARD_CLIENT_SECRET')&&!live.includes('BLIZZARD_CLIENT_ID'),'Do not expose Blizzard credentials in the browser');
assert.ok(!live.includes('access_token'),'Do not expose OAuth tokens in the browser');
assert.match(await read('azeroth-companion/connected-armory.css'),/@media\(max-width:600px\)/);

// Optional v2.1 item discovery must be backwards compatible with v2.0.
assert.match(html,/item-discovery\.js/);
assert.match(html,/item-discovery\.css/);
const discovery=await read('azeroth-companion/item-discovery.js');new vm.Script(discovery);
const backend=await read('azeroth-companion/backend/worker.js');
new vm.Script(backend.replace(/^import .*?;\s*/,'').replace('export default','const worker ='));
for(const route of ['search','media','equipment','character','BLIZZARD_CLIENT_SECRET'])assert.ok(backend.includes(route),'Missing backend route or secret binding '+route);
assert.ok(discovery.includes('data-cxopen')&&discovery.includes('/api/search/'),'Item discovery must open existing v2.0 item inspector');

const loot=await read('azeroth-companion/loot-hunter.js');new vm.Script(loot);
assert.match(html,/loot-hunter\.js/);assert.match(html,/loot-hunter\.css/);
for(const name of ['lootCatalog','lootBoard','lootWish','lootExport','lootImport','loot-sources.json'])assert.ok(loot.includes(name),'Missing Loot Hunter '+name);
const sources=JSON.parse(await read('azeroth-companion/loot-sources.json'));
assert.ok(Array.isArray(sources.items)&&sources.items.length>=4);
for(const item of sources.items)assert.ok(Number.isSafeInteger(item.id)&&/^https:\/\/(www\.)?(wowhead\.com|warcraft\.wiki\.gg)\//.test(item.guide)&&Array.isArray(item.steps));

assert.match(html,/talent-forge\.js/);
assert.match(html,/talent-forge\.css/);
const talentAtlasCanvas=await read('azeroth-companion/talent-canvas-v5.3.js');
new vm.Script(talentAtlasCanvas);
assert.match(html,/talent-canvas-v5\.3\.js/);
assert.match(html,/talent-canvas-v5\.3\.css/);
for(const name of ['pointerdown','pointermove','setPointerCapture','tfCanvasMap','applyScale','drawMap','MutationObserver'])
 assert.ok(talentAtlasCanvas.includes(name),'Talent Atlas missing '+name);
const atlasStyle=await read('azeroth-companion/talent-canvas-v5.3.css');
assert.ok(atlasStyle.includes('touch-action:none')&&atlasStyle.includes('.tf-canvas-stage'));
const mediaFinal=await read('azeroth-companion/local-media-studio-v5.9.js');
const mediaFinalCSS=await read('azeroth-companion/local-media-studio-v5.9.css');
const treeFinal=await read('azeroth-companion/talent-finale-v5.9.js');
const treeFinalCSS=await read('azeroth-companion/talent-finale-v5.9.css');
new vm.Script(mediaFinal);new vm.Script(treeFinal);
for(const id of ['nxMediaStudio','nxMediaBackdrop','nxMediaVisibility','nxMediaShade','nxMediaBlur','nxMediaFit','nxMediaToggle','nxMusicDock','nxMusicAudio','nxMusicSeek','nxMusicVolume','nxMusicShuffle','nxMusicRepeat'])
 assert.ok(mediaFinal.includes(id),'Final private media missing '+id);
for(const id of ['indexedDB','objectStoreNames','URL.createObjectURL','URL.revokeObjectURL','File','file.size','storage.estimate','audio.play','audio.pause','playsInline'])
 assert.ok(mediaFinal.includes(id),'Final media safety guard missing '+id);
assert.ok(!mediaFinal.includes('fetch('),'Private media module must never upload or request user media');
for(const id of ['nxTreeFinalControls','nxTreeFocus','nxTreeJump','nx-skill-thumb','nx-skill-hero','/api/spell-media/'])
 assert.ok((treeFinal+treeFinalCSS).includes(id),'Final skill media / focus missing '+id);
assert.match(html,/local-media-studio-v5\.9\.js/);
assert.match(html,/local-media-studio-v5\.9\.css/);
assert.match(html,/talent-finale-v5\.9\.js/);
assert.match(html,/talent-finale-v5\.9\.css/);
assert.ok(mediaFinalCSS.includes('nx-media-canvas')&&mediaFinalCSS.includes('.nx-music-dock[hidden]'));
assert.ok((await read('azeroth-companion/talent-forge.js')).includes('spellId:detailId(tip.spell?.id)'),'All-pool talent search should include genuine source spell IDs');
const visualCore=await read('azeroth-companion/visual-architect-core-v5.8.js');
const visualUI=await read('azeroth-companion/visual-architect-v5.8.js');
const visualCSS=await read('azeroth-companion/visual-architect-v5.8.css');
new vm.Script(visualCore);new vm.Script(visualUI);
const scenarioSandbox={module:{exports:{}}};new vm.Script(visualCore).runInNewContext(scenarioSandbox);
const visual=scenarioSandbox.module.exports;
const vaNodes=[{id:1001,name:'Official Test A',max:2,category:'class'},{id:2001,name:'Official Test B',max:1,category:'spec'}];
const vaBase=visual.copySnapshot({identity:'us/1/2',rankByNode:{1001:1},choiceByNode:{1001:0}},'us/1/2');
assert.equal(visual.copySnapshot({identity:'other'},'us/1/2'),null,'Scenario identities cannot cross specializations');
const vaModified=visual.adjust(vaBase,vaNodes,1001,1);
assert.equal(vaModified.rankByNode['1001'],2);
assert.equal(vaBase.rankByNode['1001'],1,'What-if edit must be isolated');
assert.equal(visual.adjust(vaModified,vaNodes,1001,1),null,'No scenario can exceed a source-returned maximum');
assert.equal(visual.summary(vaModified,vaNodes,[]).total,2);
assert.equal(visual.difference(vaBase,vaModified,vaNodes).length,1);
for(const id of ['tfVisualArchitect','tfVaNodeA','tfVaNodeB','tfVaPlusA','tfVaMinusB','tfVaDiff','tfVaCopy'])assert.ok(visualUI.includes(id),'v5.8 missing '+id);
assert.ok(visualCSS.includes('@media(max-width:850px)'),'Must support mobile scenario stacking');
assert.match(html,/visual-architect-core-v5\.8\.js/);
assert.match(html,/visual-architect-v5\.8\.js/);
assert.match(html,/visual-architect-v5\.8\.css/);
const cmdCore=await read('azeroth-companion/talent-command-core-v5.7.js');new vm.Script(cmdCore);
const cmdUI=await read('azeroth-companion/talent-command-v5.7.js');new vm.Script(cmdUI);
const cmdCSS=await read('azeroth-companion/talent-command-v5.7.css');
const sandbox={module:{exports:{}}};new vm.Script(cmdCore).runInNewContext(sandbox);
const talentCommandEngine=sandbox.module.exports;
const fixture={identity:'us/111/222',catalog:[
 {id:1001,name:'Source Start',category:'class',max:2},
 {id:1002,name:'Source Middle',category:'class',max:1},
 {id:1003,name:'Source End',category:'class',max:1}
],allocations:{1003:1},linkEdges:[{from:1001,to:1002,resolved:true},{from:1002,to:1003,resolved:true},{from:9999,to:1003,resolved:false}]};
assert.equal(talentCommandEngine.audit(fixture).review.length,2,'Must flag empty and unresolved source references without legality claims');
assert.equal(talentCommandEngine.trace(fixture,1003).levels.length,2,'Must follow two levels of real upstream references');
assert.equal(talentCommandEngine.trace(fixture,1003).unresolved[0],9999,'Must retain unresolved source node IDs');
const tested=talentCommandEngine.preview(fixture,1002,1);
assert.equal(tested.from,0);assert.equal(tested.to,1);
assert.equal(talentCommandEngine.audit(fixture).total,1,'Point previews must never mutate saved allocations');
assert.equal(tested.after.total,2,'Preview should show changed allocated total');
assert.equal(talentCommandEngine.preview(fixture,1003,1),null,'Cannot exceed source-returned maximum rank');
for(const sym of ['tfCmdSearch','tfCmdPathFocus','tfCmdPreview','tfCmdApply','tfCmdInspect','tf-cmd-tree-hint'])assert.ok((cmdUI+cmdCSS).includes(sym),'v5.7 missing '+sym);
assert.match(html,/talent-command-v5\.7\.js/);
assert.match(html,/talent-command-core-v5\.7\.js/);
assert.match(html,/talent-command-v5\.7\.css/);
const media56=await read('azeroth-companion/official-media-v5.6.js');new vm.Script(media56);
const media56CSS=await read('azeroth-companion/official-media-v5.6.css');
for(const feature of ['nxVisualIntel','nxOfficialIconSize','nxSourceCoverage','nx-gear-compare-icons','/api/media/','IntersectionObserver','source completeness','nexus_azeroth_media_scale_v56'])
 assert.ok((media56+media56CSS).toLowerCase().includes(feature.toLowerCase()),'Missing v5.6 media feature '+feature);
assert.match(html,/official-media-v5\.6\.js/);
assert.match(html,/official-media-v5\.6\.css/);
const buildIntel=await read('azeroth-companion/talent-build-intel-v5.5.js');new vm.Script(buildIntel);
const buildIntelCSS=await read('azeroth-companion/talent-build-intel-v5.5.css');
for(const id of ['tfBuildIntel','tfBiNode','tfBiConnections','tfBiReview','tfBiSaveA','tfBiSaveB','tfBiDiff','tfBiInspect'])
 assert.ok(buildIntel.includes(id),'Missing v5.5 Build Intelligence '+id);
for(const marker of ['savedDrafts:','linkEdges:','catalog:','allocations:'])
 assert.ok((await read('azeroth-companion/talent-forge.js')).includes(marker),'Missing source bridge '+marker);
assert.match(html,/talent-build-intel-v5\.5\.js/);
assert.match(html,/talent-build-intel-v5\.5\.css/);
assert.ok(buildIntelCSS.includes('@media(max-width:520px)'));
const sourceStudio=await read('azeroth-companion/talent-source-plus-v5.4.js');new vm.Script(sourceStudio);
const sourceStudioCSS=await read('azeroth-companion/talent-source-plus-v5.4.css');
for(const symbol of ['NexusTalentSourceBridge','tfLabTalentA','tfLabTalentB','tfLabGearForm','tfMediaStatus','api/spell-media/'])assert.ok((sourceStudio+(symbol==='NexusTalentSourceBridge'?'':'' )+await read('azeroth-companion/talent-forge.js')).includes(symbol),'Source Studio missing '+symbol);
assert.match(html,/talent-source-plus-v5\.4\.js/);
assert.match(html,/talent-source-plus-v5\.4\.css/);
assert.ok(sourceStudioCSS.includes('.tf-lab-pair'));
const worker54=await read('azeroth-companion/backend/worker-v5.4-spell-media-reference.js');
new vm.Script(worker54.replace(/^import .*?;\\s*/,'').replace('export default','const worker ='));
assert.ok(worker54.includes("type==='spell-media'")&&worker54.includes('/data/wow/media/spell/'));
const talent=await read('azeroth-companion/talent-forge.js');
new vm.Script(talent);
for(const required of ['tfRegion','tfSpec','tfTree','tfSave','tfImport','tfExport','tfSaved','class_talent_nodes','spec_talent_nodes','hero_talent_trees','/api/talent-index/','/api/talent-tree/'])assert.ok(talent.includes(required),'Talent Forge missing '+required);
assert.ok(!talent.includes('BLIZZARD_CLIENT_SECRET')&&!talent.includes('BLIZZARD_CLIENT_ID'));
assert.match(backend,/talent-index/);
assert.match(backend,/talent-tree/);

for(const feature of ['tfFindNode','tfLayout','tfBudget','tfUndo','tfRedo','recordUndo','travelHistory'])assert.ok(talent.includes(feature),'Missing v2.4 talent functionality '+feature);
assert.ok((await read('azeroth-companion/talent-forge.css')).includes('.tf-positioned'),'Visual position-aware tree CSS missing');
assert.ok(talent.includes('nexus_azeroth_talent_forge_v1'),'Preserve existing v2.3 local draft key');
for(const feature of ['tfHeroTree','tfCompare','tfCompareSummary','countPointChanges','tf-default-points','heroSelection','NexusTalentLayout','indexRequest'])assert.ok(talent.includes(feature),'Missing v2.5 Talent Intelligence feature '+feature);
assert.ok((await read('azeroth-companion/talent-forge.css')).includes('.tf-node.tf-more'));
assert.ok(talent.includes('nexus_azeroth_talent_forge_v1'),'Preserve legacy talent save compatibility');
for(const feature of ['tfShowLinks','tfRelations','tfRelationDetails','relationshipEdges','focusRelations','renderLinks','locked_by'])assert.ok(talent.includes(feature),'Missing v2.6 source connection feature '+feature);
const talentCSS=await read('azeroth-companion/talent-forge.css');
assert.ok(talentCSS.includes('.tf-link-layer')&&talentCSS.includes('.tf-node.tf-focused'));
assert.ok(talent.includes('nexus_azeroth_talent_forge_v1'),'Preserve old talent draft storage');

assert.match(html,/talent-paths\.js/);
assert.ok(html.indexOf('talent-paths.js')<html.indexOf('talent-forge.js'),'Path analyzer must load before Talent Forge');
const paths=await read('azeroth-companion/talent-paths.js');new vm.Script(paths);
const ctx={module:{exports:{}}};new vm.Script(paths).runInNewContext(ctx);
const analyze=ctx.module.exports.analyze;
assert.equal(typeof analyze,'function');
const nodes=[
 {id:10,locked_by:[30]},
 {id:20,locked_by:[10,{id:99}]},
 {id:30,locked_by:[20]},
 {id:40}
];
const a=analyze(nodes,{'20':1,'10':0,'30':1});
assert.equal(a.summary.nodes,4);
assert.equal(a.summary.linked,3);
assert.equal(a.summary.unresolved,1);
assert.equal(a.summary.flagged,1);
assert.equal(a.summary.satisfied,1);
assert.equal(a.ancestors(20).length,2,'Cycle-safe graph traversal should terminate');
assert.equal(a.details(20).unresolved.length,1);
const noLinks=analyze([{id:1},{id:2}],{'2':1});
assert.equal(noLinks.summary.flagged,0,'Missing link data must not be misrepresented as invalid');
for(const name of ['tfPathIntel','tfReviewOnly','renderPathIntel','tfPathDetails','pathAnalysis'])assert.ok(talent.includes(name),'Missing Talent Path Intelligence '+name);
assert.ok(talent.includes('nexus_azeroth_talent_forge_v1'),'Old saved talent data key must remain unchanged');


assert.match(html,/talent-layout\.js/);
assert.ok(html.indexOf('talent-layout.js')<html.indexOf('talent-forge.js'));
const layoutScript=await read('azeroth-companion/talent-layout.js');
new vm.Script(layoutScript);
const layoutContext={module:{exports:{}}};
new vm.Script(layoutScript).runInNewContext(layoutContext);
const arrange=layoutContext.module.exports.arrange;
const placement=arrange([
 {id:1,display_row:0,display_col:0},
 {id:2,display_row:0,display_col:0},
 {id:3,display_row:0,display_col:1},
 {id:4},
 {id:5,display_row:-1,display_col:-1}
]);
assert.equal(placement.total,5);
assert.equal(placement.locations[1].row,1);
assert.equal(placement.locations[1].col,1);
assert.equal(placement.locations[3].col,2);
assert.equal(placement.adjusted,3);
assert.equal(new Set(Object.values(placement.locations).map(x=>x.row+':'+x.col)).size,5,'Every talent should have a unique grid cell');
assert.ok(placement.locations[2].adjusted&&placement.locations[4].adjusted);
assert.ok(talent.includes('POSITION ADJUSTED')&&talent.includes('NexusTalentLayout'));
assert.ok(!talent.includes('Compact cards are used to prevent visual overlap.'),'Regression: forced cards fallback should be removed');

assert.match(html,/armory-bridge-core\.js/);assert.match(html,/armory-loot-bridge\.js/);assert.match(html,/armory-loot-bridge\.css/);
const core=await read('azeroth-companion/armory-bridge-core.js'),bridge=await read('azeroth-companion/armory-loot-bridge.js');
new vm.Script(core);new vm.Script(bridge);
const context={module:{exports:{}}};new vm.Script(core).runInNewContext(context);
const api=context.module.exports;
assert.equal(api.item({id:19019,name:'Thunderfury',region:'us'}).id,19019);
assert.equal(api.item({id:-4,name:'Invalid'}),null);
assert.equal(api.profile({region:'us',realm:'area-52',name:'fighter'}).realm,'area-52');
assert.equal(api.profile({realm:'!!!',name:'fighter'}),null);
const dedup=api.addProfile([{region:'us',realm:'area-52',name:'fighter'}],{region:'us',realm:'area-52',name:'fighter'});
assert.equal(dedup.length,1);
const stat=api.summary([{id:19019},{id:32458}], [{id:19019,done:false,attempts:2}]);
assert.equal(stat.untrackedWishlist,1);assert.equal(stat.farming,1);
assert.ok(bridge.includes('nexus:loot-track')&&bridge.includes('data-ab-track')&&bridge.includes('abBookmarkCurrent'));
assert.ok(loot.includes('nexus:loot-track')&&loot.includes('nexus:loot-updated'));
assert.ok(!bridge.includes('BLIZZARD_CLIENT_SECRET')&&!bridge.includes('BLIZZARD_CLIENT_ID'));
assert.match(html,/farming-operations\.js/);assert.match(html,/farming-operations\.css/);
const farming=await read('azeroth-companion/farming-operations.js');
new vm.Script(farming);
for(const token of ['nexus_azeroth_farm_operations_v1','nexus_azeroth_loot_hunter_v1','foImportProfiles','foSessionItem','foSessionCharacter','foLog','foAssignments','foExport','foImport','nexus-farming-operations-v1','foSessionDate'])assert.ok(farming.includes(token),'Farming Operations missing '+token);
assert.ok(farming.includes('slice(-500)'),'Session log retention bound missing');
assert.ok(farming.includes('Loot Hunter global attempt counts were not modified.'),'Must label separate counters');
assert.ok((await read('azeroth-companion/farming-operations.css')).includes('@media(max-width:860px)'),'Mobile CSS missing');
assert.ok(!farming.includes('BLIZZARD_CLIENT_SECRET')&&!farming.includes('BLIZZARD_CLIENT_ID'));
assert.match(html,/personal-azeroth\.js/);assert.match(html,/personal-azeroth\.css/);
const personal=await read('azeroth-companion/personal-azeroth.js');new vm.Script(personal);
const moduleCode=await read('azeroth-companion/backend/personal-portal.js');
new vm.Script(moduleCode.replace('export async function handlePersonal','async function handlePersonal'));
for(const protectedField of ['AZEROTH_SESSION_SECRET','wow.profile','__Host-nx_bnet_session','__Host-nx_bnet_state','/api/me/characters','/api/me/collections/mounts','/api/me/collections/pets'])assert.ok(moduleCode.includes(protectedField),'Missing personal portal '+protectedField);
assert.ok(backend.includes("from './personal-portal.js'"));
const singleWorker=await read('azeroth-companion/backend/worker-v3-single.js');
assert.ok(!singleWorker.includes("import {handlePersonal} from './personal-portal.js'"),'Single-file dashboard build must not require a separate module');
new vm.Script(singleWorker.replace('export default','const worker ='));
for(const marker of ['handlePersonal','__Host-nx_bnet_session','AZEROTH_SESSION_SECRET','/api/me/characters','talent-index','type===\'item\''])assert.ok(singleWorker.includes(marker),'Single-file deployment missing '+marker);
await import('./personal-portal.test.mjs');
assert.ok(moduleCode.includes('/api/me/collection-intelligence'));
assert.ok(moduleCode.includes('matchOwnedMounts'));
assert.ok(moduleCode.includes("status:known.has(foldMount(t.mountName))?'reported-owned':'not-confirmed'"));
assert.ok(singleWorker.includes('/api/me/collection-intelligence'));
assert.match(html,/item-atlas\.js/);assert.match(html,/item-atlas\.css/);
const atlas=await read('azeroth-companion/item-atlas.js');new vm.Script(atlas);
for(const marker of ['nexus_azeroth_item_atlas_v1','/api/search/','/api/item/','atlasSearchResults','atlasIdForm','atlasBoard','atlasImport','atlasExport','nexus-azeroth-item-atlas-v1','itemAtlas'])assert.ok(atlas.includes(marker),'Item Atlas missing '+marker);
assert.ok(atlas.includes("owned:'I own this (manual)'"));
assert.ok(atlas.includes('MAX=5000'));
assert.ok((await read('azeroth-companion/item-atlas.css')).includes('@media(max-width:620px)'));
assert.ok(backend.includes("page>50"));
assert.ok(singleWorker.includes("page>50"));
assert.ok(backend.includes('resultCountCapped'));
assert.ok(!atlas.includes('BLIZZARD_CLIENT_SECRET')&&!atlas.includes('AZEROTH_SESSION_SECRET'));
assert.ok(html.includes('character-targets.js'));assert.ok(html.includes('character-targets.css'));
const targets=await read('azeroth-companion/character-targets.js');new vm.Script(targets);
for(const marker of ['nexus_azeroth_character_targets_v1','nexus_azeroth_item_atlas_v1','nexus_azeroth_farm_operations_v1','ctAssign','ctExport','ctImport','ctBoard','nexus-azeroth-character-targets-v1'])assert.ok(targets.includes(marker),'Missing Character Targets '+marker);
assert.ok(targets.includes('MAX=1500'));
assert.ok((await read('azeroth-companion/character-targets.css')).includes('@media(max-width:760px)'));
assert.ok(bridge.includes('const arm=document.querySelector('),'Armory bridge must use querySelector, not getElementById');
assert.ok(moduleCode.includes("path==='/api/me/equipment'"),'Private equipment API must exist');
assert.ok(moduleCode.includes('const authorized='),'Equipment endpoint must verify account ownership');
assert.ok(moduleCode.includes("if(!authorized)return response"),'Equipment endpoint must deny cross-account lookup');
assert.ok(singleWorker.includes("path==='/api/me/equipment'"));
assert.ok(!targets.includes('BLIZZARD_CLIENT_SECRET')&&!targets.includes('AZEROTH_SESSION_SECRET'));
assert.match(html,/progress-command\.js/);assert.match(html,/progress-command\.css/);
const command=await read('azeroth-companion/progress-command.js');new vm.Script(command);
for(const marker of ['nexus_azeroth_item_atlas_v1','nexus_azeroth_character_targets_v1','nexus_azeroth_loot_hunter_v1','nexus_azeroth_farm_operations_v1','pcMetrics','pcCharacters','pcObjectives','pcInsights','pcSnapshot','nexus-azeroth-progress-summary-v1'])assert.ok(command.includes(marker),'Progress Command missing '+marker);
assert.ok(!command.includes('BLIZZARD_CLIENT_SECRET')&&!command.includes('AZEROTH_SESSION_SECRET')&&!command.includes('/api/me/'),'Public progress view must not touch private account APIs');
assert.ok(command.includes('targetOrphans')&&command.includes('contradictions'),'Cross-studio discrepancies must be review-only');
assert.ok(command.includes('readOnly:true'),'Snapshot must identify itself as a read-only summary');
assert.ok((await read('azeroth-companion/progress-command.css')).includes('@media(max-width:750px)'),'Mobile Progress Command CSS missing');
await import('./sovereign-v4.test.mjs');
await import('./player-guide.test.mjs');
await import('./player-field-lab.test.mjs');
await import('./character-dominion.test.mjs');
await import('./sovereign-experience.test.mjs');
await import('./sovereign-portal.test.mjs');
await import('./device-reliability.test.mjs');
await import('./lean-launch.test.mjs');
await import('./intelligent-startup.test.mjs');
await import('./experience-stability.test.mjs');
await import('./sovereign-command-v5.test.mjs');
await import('./talent-planner-v51.test.mjs');
console.log('Azeroth Companion validation passed: script syntax, integrations, metadata, release payload, preserved hub entries.');
