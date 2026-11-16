import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const read=p=>readFile(path.join(root,p),'utf8');
const html=await read('azeroth-companion/index.html');
assert.match(html,/warcraft-overdrive\.js/);assert.match(html,/warcraft-overdrive\.css/);
assert.match(html,/id="nxCanonicalVersion"[^>]*>AZEROTH v6\.1\.4/);
assert.match(html,/player-utility\.js/);
assert.match(html,/player-utility\.css/);
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);assert.ok(inline.length>=1,'At least one inline companion script required');
inline.forEach(s=>new vm.Script(s));
const js=await read('azeroth-companion/warcraft-overdrive.js');new vm.Script(js);
for(const id of ['wowRouteForm','wowCraftForm','wowGearFields','wowWeeklyForm','wowEncounterForm','wowReleaseHistory','wowCheckUpdates','wowExport'])assert.ok(js.includes(id),'Missing '+id);
const version=JSON.parse(await read('azeroth-companion/version.json'));
const index=JSON.parse(await read('azeroth-companion/releases/index.json'));
const release=JSON.parse(await read('azeroth-companion/releases/v'+version.version+'.json'));
assert.equal(version.version,'6.2.0');assert.equal(index.releases[0].version,version.version);assert.equal(release.version,version.version);
assert.ok(release.features.length>=5);
const hub=await read('hub/index.html');assert.match(hub,/id:'azeroth'/);assert.match(hub,/v6\.1\.4 • Radiant Identity/);
for(const keep of ["id:'reactor'","id:'foundry'","id:'alchemist'"])assert.ok(hub.includes(keep));
const {metadata,payload}=await import('../scripts/announce-release.mjs');const record=await metadata();const body=payload(record.v,record.release);assert.match(body.embeds[0].title,/AZEROTH COMPANION/);
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
