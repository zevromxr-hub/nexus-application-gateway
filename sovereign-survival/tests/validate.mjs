/* SOVEREIGN SURVIVAL v1.3 ASCENSION: permanent progression, combat AI, privacy and PWA */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRun,advance,spawnWave,chooseUpgrade,UPGRADES,ENEMY_TYPES,WORLD,ARENAS,arenaForWave,runSummary,durationLabel} from '../core.js';
import {PROGRESSION_KEY,CHAMPIONS,RELICS,MAX_RELICS,normalizeProgress,
 championUnlocked,chooseChampion,purchaseRelic,toggleRelic,resolveLoadout,
 startingStats,renownReward,awardRun} from '../progression.js';
const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const initial=createRun(12345),again=createRun(12345);
assert.equal(initial.phase,'running');
assert.equal(initial.wave,1);
assert.equal(initial.enemies.length,9);
assert.deepEqual(initial.enemies,again.enemies,'Seeded wave spawns must be deterministic');
assert.equal(initial.player.hp,100);assert.equal(initial.player.maxHp,100);
assert.ok(UPGRADES.length>=8);assert.equal(new Set(UPGRADES.map(x=>x.id)).size,UPGRADES.length);
for(const e of initial.enemies)assert.ok(ENEMY_TYPES[e.kind]);
const move=createRun(9),px=move.player.x;
advance(move,{dx:1,dy:0},1/30);assert.ok(move.player.x>px);
const locked=createRun(19),before=locked.time;
advance(locked,{dx:0,dy:0},-100);assert.equal(locked.time,before,'Invalid negative delta cannot move time');
const dash=createRun(22),p=dash.player;
advance(dash,{dx:1,dy:0,dash:true},1/60);
assert.ok(p.dashCooldown>0&&p.dashTime>0&&p.invulnerable>0);
const previous=p.dashCooldown;
advance(dash,{dx:1,dy:0,dash:true},1/60);
assert.ok(p.dashCooldown<previous,'Dash cannot be retriggered before cooldown');
const action=createRun(35);
const target=action.enemies[0];
target.hp=1;target.maxHp=1;target.x=action.player.x+50;target.y=action.player.y;
for(let i=0;i<12;i++)advance(action,{dx:0,dy:0,aim:{x:target.x,y:target.y}},1/60);
assert.ok(action.kills>=1,'Auto attack must actually defeat an enemy');
assert.ok(action.score>0,'Enemy defeat must award points');
assert.ok(action.orbs.length>0,'Defeated enemies leave soul energy');
const hurt=createRun(29);
hurt.enemies=[{...hurt.enemies[0],x:hurt.player.x,y:hurt.player.y,attack:0,shoot:20}];
advance(hurt,{},1/60);assert.ok(hurt.player.hp<100,'Touching enemies should hurt champion');
const armor=createRun(23);armor.phase='upgrade';armor.options=['ward','blade','dash'];
assert.equal(chooseUpgrade(armor,'invisible'),false,'Cannot award arbitrary powers');
assert.equal(chooseUpgrade(armor,'ward'),true);
assert.ok(armor.player.damageReduction>0);
assert.equal(armor.phase,'running');
const experience=createRun(55);
experience.orbs.push({x:experience.player.x,y:experience.player.y,r:7,value:experience.nextXP});
advance(experience,{},1/60);
assert.equal(experience.level,2);
assert.equal(experience.phase,'upgrade');
assert.equal(experience.options.length,3);
const rankChoice=experience.options[0],rankBefore=experience.ranks[rankChoice];
assert.equal(chooseUpgrade(experience,rankChoice),true);
assert.equal(experience.ranks[rankChoice],rankBefore+1);
const standing=experience.time;
advance(experience,{},1/60);
assert.ok(experience.time>standing,'Game resumes after selecting power');
const waves=createRun(7);
waves.enemies.length=0;
spawnWave(waves);spawnWave(waves);spawnWave(waves);
assert.equal(waves.wave,4);
const boss=waves.enemies.find(e=>e.kind==='monarch');
assert.ok(boss&&boss.hp>500,'Wave 4 must contain a genuine boss');
boss.x=waves.player.x+270;boss.y=waves.player.y;boss.shoot=0;
waves.enemies=[boss];
advance(waves,{},1/60);
assert.equal(waves.hostile.length,3,'Boss fires three real damaging projectiles');
// New enemies are real deterministic entities and appear at known progression points.
const nightfall=createRun(2026);
spawnWave(nightfall); // Wave 2
spawnWave(nightfall); // Wave 3
assert.equal(nightfall.wave,3);
assert.ok(nightfall.enemies.some(e=>e.kind==='hexer'),'The Hexer arrives at Wave 3');
assert.ok(nightfall.hazards.length>0,'Rift hazards arrive at Wave 3');
assert.equal(arenaForWave(3).id,'ember');
spawnWave(nightfall);spawnWave(nightfall); // Wave 5
assert.equal(nightfall.wave,5);
assert.ok(nightfall.enemies.some(e=>e.kind==='ravager'),'The Ravager arrives at Wave 5');
assert.ok(nightfall.enemies.some(e=>e.elite),'Elite variants can appear after Wave 3');
assert.equal(arenaForWave(5).id,'moon');
assert.equal(new Set(ARENAS.map(a=>a.id)).size,4);
assert.equal(arenaForWave(7).id,'throne');
assert.equal(arenaForWave(9).id,'sanctum');
// Hexer spells lock aim during telegraph instead of tracking a moving player.
const hex=createRun(77);
spawnWave(hex);spawnWave(hex);
const caster=hex.enemies.find(e=>e.kind==='hexer');
hex.enemies=[caster];hex.hazards=[];
caster.x=hex.player.x+330;caster.y=hex.player.y;caster.speed=0;caster.shoot=.50;
advance(hex,{},1/60);
assert.equal(caster.aimLocked,true,'Caster locks an aim direction before shooting');
const lockedAim=caster.aimAngle;
hex.player.y+=230;
for(let i=0;i<39;i++)advance(hex,{},1/60);
const bolt=hex.hostile.find(b=>b.kind==='hexer');
assert.ok(bolt,'Hexer releases a real damaging bolt');
assert.ok(Math.abs(Math.atan2(bolt.vy,bolt.vx)-lockedAim)<.001,
 'Bolt must follow the warned, locked direction, not track the moved player');
// Ravagers must stop, telegraph, then rush down the announced lane.
const rav=createRun(105);
for(let i=0;i<4;i++)spawnWave(rav);
const charger=rav.enemies.find(e=>e.kind==='ravager');
rav.enemies=[charger];rav.hazards=[];
charger.x=rav.player.x+310;charger.y=rav.player.y;charger.shoot=100;charger.speed=88;
charger.chargeCooldown=0;charger.chargeWindup=0;charger.chargeActive=0;
const stand=charger.x;
advance(rav,{},1/60);
assert.ok(charger.chargeWindup>0,'Charge announces its windup');
assert.equal(charger.x,stand,'Ravager must stop during its telegraph');
for(let i=0;i<44;i++)advance(rav,{},1/60);
assert.ok(charger.chargeActive>0,'Ravager must perform a real charge');
assert.ok(charger.x<stand-4,'Ravager actually moves along its charge path');
// A warning rift is harmless until its visible activation; dash immunity still works.
const rift=createRun(313);
spawnWave(rift);spawnWave(rift);
assert.ok(rift.hazards.length>0);
const hazard=rift.hazards[0];
rift.enemies=[{...rift.enemies[0],x:100,y:100,speed:0,attack:100,shoot:100}];
rift.player.x=hazard.x;rift.player.y=hazard.y;rift.player.invulnerable=0;
hazard.timer=.5;
advance(rift,{},1/60);
assert.equal(rift.player.hp,100,'Telegraphed but inactive rift must not hurt');
hazard.timer=hazard.telegraph-.015;
advance(rift,{},1/30);
assert.ok(rift.player.hp<100,'Active rift must inflict contact damage');
const remaining=rift.player.hp;
rift.player.invulnerable=.6;
advance(rift,{},1/30);
assert.equal(rift.player.hp,remaining,'Invulnerability protects from a repeated rift hit');
// Elite enemies must give enhanced local rewards without online storage.
const elite=createRun(44),eliteTarget=elite.enemies[0];
eliteTarget.elite=true;eliteTarget.hp=1;eliteTarget.maxHp=1;
eliteTarget.x=elite.player.x+55;eliteTarget.y=elite.player.y;
elite.enemies=[eliteTarget];
for(let i=0;i<12;i++)advance(elite,{aim:{x:eliteTarget.x,y:eliteTarget.y}},1/60);
assert.equal(elite.eliteKills,1,'Elite kills are recorded');
assert.ok(elite.score>=ENEMY_TYPES.wraith.score*2);
assert.ok(elite.orbs.some(o=>o.value===ENEMY_TYPES.wraith.xp*2));
assert.equal(runSummary(elite).eliteKills,1);
assert.equal(runSummary(elite).bossKills,0);

// Ascension Armory is a real, persistent progression layer, not a menu mockup.
const blank=normalizeProgress(null);
assert.equal(PROGRESSION_KEY,'proximus-sovereign-survival-armory-v1');
assert.deepEqual(blank,{version:1,renown:0,lifetimeRenown:0,
 champion:'warden',owned:[],equipped:[]});
assert.equal(CHAMPIONS.length,3);
assert.equal(RELICS.length,4);
assert.equal(MAX_RELICS,2);
assert.equal(championUnlocked('warden',{}),true);
assert.equal(championUnlocked('sentinel',{kills:39}),false);
assert.equal(championUnlocked('sentinel',{kills:40}),true);
assert.equal(championUnlocked('reaver',{bestWave:3}),false);
assert.equal(championUnlocked('reaver',{bestWave:4}),true);
assert.equal(chooseChampion(blank,'sentinel',{kills:39}).success,false,'Locked champion cannot be selected');
const sentinelSelection=chooseChampion(blank,'sentinel',{kills:40});
assert.equal(sentinelSelection.success,true);
const defaultRun=createRun(1234),sentinelRun=createRun(1234,{champion:'sentinel',relics:[]});
assert.equal(defaultRun.player.hp,100);
assert.equal(sentinelRun.player.hp,130);
assert.equal(sentinelRun.player.maxHp,130);
assert.ok(sentinelRun.player.speed<defaultRun.player.speed);
assert.ok(sentinelRun.player.damageReduction>0);
const reaverRun=createRun(1234,{champion:'reaver'});
assert.equal(reaverRun.player.hp,80);
assert.ok(reaverRun.player.damage>defaultRun.player.damage);
assert.ok(reaverRun.player.rate<defaultRun.player.rate);
const reward=renownReward({score:1500,wave:4,kills:35,eliteKills:2,bossKills:1});
assert.ok(reward>10);
const firstAward=awardRun(blank,{score:1500,wave:4,kills:35,eliteKills:2,bossKills:1});
assert.equal(firstAward.earned,reward);
assert.equal(firstAward.progress.renown,reward);
assert.equal(blank.renown,0,'Previous immutable state is not mutated');
assert.equal(firstAward.progress.lifetimeRenown,reward);
const rich=normalizeProgress({renown:500,lifetimeRenown:600,owned:[],equipped:[]});
const forge=purchaseRelic(rich,'nightglass');
assert.equal(forge.success,true);
assert.equal(forge.progress.renown,455);
assert.deepEqual(forge.progress.owned,['nightglass']);
assert.equal(purchaseRelic(forge.progress,'nightglass').success,false,'Purchased relic is not double-billed');
assert.equal(purchaseRelic(blank,'nightglass').success,false,'Insufficient Renown blocks purchase');
assert.equal(toggleRelic(blank,'nightglass').success,false,'Unowned relics cannot be equipped');
const firstEquip=toggleRelic(forge.progress,'nightglass');
assert.equal(firstEquip.success,true);
assert.deepEqual(firstEquip.progress.equipped,['nightglass']);
const moonForge=purchaseRelic(firstEquip.progress,'moonwell');
const secondEquip=toggleRelic(moonForge.progress,'moonwell');
assert.equal(secondEquip.success,true);
assert.equal(secondEquip.progress.equipped.length,2);
const phantomForge=purchaseRelic(secondEquip.progress,'phantom');
assert.equal(toggleRelic(phantomForge.progress,'phantom').success,false,'Only two slots allowed');
const unequipped=toggleRelic(phantomForge.progress,'nightglass');
assert.equal(unequipped.success,true);
assert.deepEqual(unequipped.progress.equipped,['moonwell']);
assert.deepEqual(normalizeProgress({owned:['nightglass','nightglass','bogus'],
 equipped:['bogus','nightglass','nightglass'],champion:'invalid',renown:-500}).equipped,
 ['nightglass'],'Save data must be sanitized');
assert.equal(resolveLoadout({champion:'reaver',owned:[],equipped:[]},{bestWave:3}).champion,
 'warden','Old/invalid locked selections fall back safely');
assert.equal(resolveLoadout(sentinelSelection.progress,{kills:40}).champion,'sentinel');
const armoryRun=createRun(789,{champion:'sentinel',relics:['nightglass','moonwell']});
assert.equal(armoryRun.player.hp,155);
assert.ok(armoryRun.player.damage>defaultRun.player.damage);
assert.deepEqual(armoryRun.startingLoadout.relics,['nightglass','moonwell']);
const speedy=createRun(789,{champion:'warden',relics:['phantom','chalice']});
assert.ok(speedy.player.speed>defaultRun.player.speed);
assert.equal(speedy.player.leech,2);
assert.equal(runSummary(armoryRun).champion,'sentinel');
assert.deepEqual(JSON.parse(JSON.stringify(firstEquip.progress)),firstEquip.progress,
 'Armory data must round-trip through localStorage serialization');

const doomed=createRun(17);
doomed.player.hp=1;doomed.player.invulnerable=0;
doomed.enemies=[{...doomed.enemies[0],x:doomed.player.x,y:doomed.player.y,attack:0}];
advance(doomed,{},1/60);
assert.equal(doomed.phase,'gameover','Player can lose the game');
assert.equal(runSummary(doomed).score,0);
assert.equal(durationLabel(125),'2:05');
for(const file of ['core.js','renderer.js','game.js','progression.js','sw.js']){
 const r=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
 assert.equal(r.status,0,file+': '+r.stderr);
}
const html=read('index.html'),game=read('game.js'),css=read('style.css'),manifest=JSON.parse(read('manifest.webmanifest')),worker=read('sw.js');
assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'./');
for(const id of ['arenaCanvas','startRun','menuOverlay','pauseOverlay','upgradeOverlay','endOverlay',
 'joystickZone','joystickKnob','dashButton','upgradeOptions','retryRun','pauseButton',
 'healthText','hpFill','waveText','recordBest','soundToggle','qualityToggle'])
 assert.equal(html.split('id="'+id+'"').length,2,'Missing or duplicate '+id);
assert.ok(game.includes('requestAnimationFrame(loop)'));
assert.ok(game.includes("window.addEventListener('keydown'"));
assert.ok(game.includes("zone.addEventListener('pointerdown'"));
assert.ok(game.includes("document.addEventListener('visibilitychange'"));
assert.ok(game.includes("register('./sw.js'"));
assert.ok(css.includes('@media(pointer:coarse)'));
const warbound=read('warbound-v1.1.css');
assert.ok(warbound.includes('height:100dvh'),'Game must fill the mobile viewport');
assert.ok(warbound.includes('warbound-scene.svg'),'Main menu must show original cinematic artwork');
assert.ok(warbound.includes('[data-game-view="menu"]'),'Different overlays must have appropriate HUD visibility');
assert.ok(!html.includes('class="side-column"'),'Tools sidebar must not appear during actual game');
assert.ok(!html.includes('class="intro"'),'The main game should not begin with an app dashboard');
for(const id of ['menuRecords','menuGuide','menuSettings','recordsOverlay','guideOverlay',
 'settingsOverlay','warbookOverlay','pauseWarbook','pauseSettings','retreatToMenu','endMenu','recordKills'])
 assert.equal(html.split('id="'+id+'"').length,2,id+' must appear once');
const current=JSON.parse(read('version.json'));
assert.equal(current.version,'1.3.0');
assert.equal(current.previous_version,'1.2.0');
assert.equal(current.codename,'ASCENSION ARMORY');
assert.ok(game.includes('function openAux('));
assert.ok(game.includes('document.body.dataset.gameView=mode'));
assert.ok(game.includes('auxReturn'));
assert.ok(game.includes('maxPixels=quality'));
assert.ok(read('renderer.js').includes("e.aimLocked"),'Warnings must follow locked aimed attacks');
assert.ok(read('renderer.js').includes('drawHazards(ctx,s,view,quality)'), 'Real rift warnings must be drawn');
assert.ok(read('renderer.js').includes("e.kind==='hexer'"), 'Hexer visual rendering must be distinctive');
assert.ok(read('renderer.js').includes("e.kind==='ravager'"), 'Ravager visual rendering must be distinctive');
assert.ok(read('index.html').includes('warbound-v1.1.css'));
assert.ok(read('index.html').includes('SOVEREIGN SURVIVAL — ASCENSION ARMORY v1.3'));
assert.ok(read('sw.js').includes('proximus-sovereign-survival-ascension-v1.3'));
for(const id of ['riftCount','recordElites','recordBosses'])
 assert.equal(html.split('id="'+id+'"').length,2,id+' must appear exactly once');
assert.ok(html.includes('ENEMIES OF THE NIGHTFALL')&&html.includes('RAVAGER'));
assert.ok(game.includes('records.elites+=result.eliteKills'));
assert.ok(game.includes('records.bosses+=result.bossKills'));
assert.ok(game.includes("resolveLoadout(progression,records)"));
assert.ok(game.includes("const resultReward=awardRun(progression,result)"));
assert.ok(game.includes("persistProgress();"));
assert.ok(game.includes("function renderArmory()"));
assert.ok(game.includes("function applyArmoryChange("));
assert.ok(read('renderer.js').includes("p.champion==='sentinel'"));
assert.ok(read('renderer.js').includes("p.champion==='reaver'"));
for(const id of ['armoryOverlay','menuArmory','championCards','relicCards','armoryRenown',
 'armoryFeedback','relicSlots','championsUnlocked','codexHeroName','codexHeroIcon',
 'codexRelics','menuLoadout','runRenown','recordRenown']){
 assert.equal(html.split('id="'+id+'"').length,2,id+' must appear once');
}
assert.ok(read('armory-v1.3.css').includes('.champion-cards'));
assert.ok(game.includes("document.body.dataset.realm=arena.id"));
const nightfallStyle=read('nightfall-v1.2.css');
assert.ok(nightfallStyle.includes('[data-realm="ember"]'));
assert.ok(nightfallStyle.includes('.bestiary-grid'));
for(const file of ['warbound-v1.1.css','warbound-scene.svg','nightfall-v1.2.css','armory-v1.3.css']){
 assert.ok(worker.includes("'./"+file+"'"),'Offline shell must cache '+file);
 assert.ok(fs.statSync(path.join(root,file)).size>3000,'Real visual asset missing: '+file);
}
assert.ok(css.includes('safe-area')||html.includes('viewport-fit=cover'));
for(const asset of ['index.html','style.css','core.js','renderer.js','game.js','manifest.webmanifest','icon.svg'])
 assert.ok(worker.includes("'./"+asset+"'"),'Offline shell missing '+asset);
assert.ok(!game.includes('fetch(')&&!game.includes('XMLHttpRequest('),'Gameplay must not require remote services');
assert.ok(!worker.includes('alchemist/video-vault'),'Offline scope must never cache Proximus personal media');
console.log('PASS Sovereign Survival Ascension v1.3: progression, unlocks, relic forge, 2-slot equipment, gameplay buffs, Nightfall combat, privacy and offline PWA');
