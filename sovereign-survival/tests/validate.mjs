/* SOVEREIGN SURVIVAL v1.5 EXPEDITIONS: interactive quests, phased bosses, relic blueprints and offline safety */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRun,advance,spawnWave,chooseUpgrade,UPGRADES,ABILITIES,EVOLUTIONS,activateAbility,evolutionActive,ENEMY_TYPES,WORLD,ARENAS,EXPEDITIONS,expeditionStatus,isBoss,arenaForWave,runSummary,durationLabel} from '../core.js';
import {PROGRESSION_KEY,CHAMPIONS,RELICS,MAX_RELICS,normalizeProgress,
 championUnlocked,chooseChampion,purchaseRelic,toggleRelic,resolveLoadout,blueprintUnlocked,
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
assert.equal(RELICS.length,6);
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

// v1.4 champion abilities operate in the original simulation and respect
// game phase/cooldown; effects are not substituted for combat damage.
assert.equal(Object.keys(ABILITIES).length,3);
assert.deepEqual(EVOLUTIONS.map(e=>e.id),['blade','barrage','ward']);
for(const c of CHAMPIONS)assert.ok(ABILITIES[c.id]?.cooldown>0);
const nova=createRun(102,{champion:'warden'});
const nEnemy=nova.enemies[0];nEnemy.x=nova.player.x+90;nEnemy.y=nova.player.y;
nEnemy.hp=nEnemy.maxHp=400;nEnemy.speed=0;nEnemy.attack=100;nEnemy.shoot=100;
nova.enemies=[nEnemy];nova.player.fireCooldown=999;
const nX=nEnemy.x,nHP=nEnemy.hp;
advance(nova,{ability:true},1/60);
assert.ok(nEnemy.x>nX+80,'Astral Nova must knock enemies away');
assert.ok(nEnemy.hp<nHP,'Astral Nova must deal actual damage');
assert.ok(nova.player.abilityCooldown>8,'Astral Nova cooldown starts immediately');
assert.equal(nova.events.some(e=>e.type==='ability'&&e.id==='nova'),true);
assert.equal(activateAbility(nova),false,'Cannot cast twice while on cooldown');
nova.phase='upgrade';nova.player.abilityCooldown=0;
assert.equal(activateAbility(nova),false,'Cannot cast powers while choosing an upgrade');

const glacial=createRun(103,{champion:'sentinel'});
const fEnemy=glacial.enemies[0];fEnemy.x=glacial.player.x+65;fEnemy.y=glacial.player.y;
fEnemy.attack=0;fEnemy.shoot=0;fEnemy.speed=100;glacial.enemies=[fEnemy];
glacial.player.fireCooldown=999;
advance(glacial,{ability:true},1/60);
assert.ok(glacial.player.barrierTime>2,'Bulwark activates a timed protective barrier');
assert.ok(fEnemy.frozenFor>2,'Nearby enemies receive an actual freeze');
const frozenX=fEnemy.x;
for(let i=0;i<9;i++)advance(glacial,{},1/60);
assert.equal(fEnemy.x,frozenX,'Frozen enemies cannot move toward player');
const glacialHP=glacial.player.hp;
glacial.hostile.push({x:glacial.player.x,y:glacial.player.y,vx:0,vy:0,r:12,ttl:1,damage:60,kind:'hexer'});
advance(glacial,{},1/60);
assert.equal(glacial.player.hp,glacialHP,'Bulwark protects from genuine hostile projectile damage');

const ember=createRun(104,{champion:'reaver'});
const eEnemy=ember.enemies[0];eEnemy.x=ember.player.x+115;eEnemy.y=ember.player.y;
eEnemy.hp=eEnemy.maxHp=500;eEnemy.attack=100;eEnemy.shoot=100;eEnemy.speed=0;
ember.enemies=[eEnemy];ember.player.angle=0;ember.player.fireCooldown=999;
const emberHP=eEnemy.hp;
advance(ember,{ability:true},1/60);
assert.ok(eEnemy.hp<emberHP,'Infernal Cleave deals immediate directional damage');
assert.ok(eEnemy.burnTime>2.9,'Infernal Cleave ignites enemies');
const afterSlash=eEnemy.hp;
for(let i=0;i<35;i++)advance(ember,{},1/60);
assert.ok(eEnemy.hp<afterSlash,'Burning damage actually ticks over time');
assert.equal(ember.player.abilityCooldown>0,true);

function evolve(id,seed){
 const run=createRun(seed);
 for(let i=0;i<3;i++){
  run.phase='upgrade';run.options=[id];
  assert.equal(chooseUpgrade(run,id),true,'Evolution ranks must remain normal upgrade selections');
 }
 assert.equal(evolutionActive(run,id),true,'Rank 3 awakens '+id);
 assert.ok(run.events.some(e=>e.type==='evolution'&&e.id===id));
 return run;
}
const blades=evolve('blade',501),tgt=blades.enemies[0];
tgt.x=blades.player.x+103;tgt.y=blades.player.y;tgt.hp=tgt.maxHp=999;
tgt.speed=0;tgt.attack=100;tgt.shoot=100;blades.enemies=[tgt];
blades.player.fireCooldown=0;
advance(blades,{},1/60);blades.player.fireCooldown=0;advance(blades,{},1/60);
assert.ok(blades.effects.some(e=>e.kind==='sovereignSlash'),'Sovereign Blades must create a real sweeping attack');
assert.ok(tgt.hp<tgt.maxHp,'Sovereign Blades must damage targets');
const storm=evolve('barrage',502),stormTarget=storm.enemies[0];
stormTarget.x=storm.player.x+80;stormTarget.y=storm.player.y;stormTarget.hp=stormTarget.maxHp=900;
stormTarget.speed=0;stormTarget.attack=100;stormTarget.shoot=100;storm.enemies=[stormTarget];
for(let i=0;i<14;i++)advance(storm,{},1/60);
assert.ok(storm.shots.some(b=>b.storm),'Celestial Storm splits impact projectiles into actual child shots');
assert.ok(storm.shots.some(b=>b.storm&&b.split===false),'Child shots must not recursively explode');
const aegis=evolve('ward',503),attacker=aegis.enemies[0];
attacker.x=aegis.player.x;attacker.y=aegis.player.y;attacker.attack=0;attacker.shoot=100;
attacker.speed=0;aegis.enemies=[attacker];aegis.player.fireCooldown=999;
const shieldHP=aegis.player.hp;
advance(aegis,{},1/60);
assert.equal(aegis.player.hp,shieldHP,'Immortal Aegis must absorb first incoming hit');
assert.ok(aegis.player.aegisCooldown>14,'Aegis must have a meaningful defensive cooldown');
aegis.player.invulnerable=0;attacker.attack=0;
advance(aegis,{},1/60);
assert.ok(aegis.player.hp<shieldHP,'Aegis cannot block a second hit during cooldown');
assert.equal(evolutionActive(createRun(504),'ward'),false,'Evolutions are temporary per run');
// v1.5 REALM EXPEDITIONS: each arena creates interactable combat objectives.
assert.equal(Object.keys(EXPEDITIONS).length,4);
assert.equal(initial.expedition.type,'wardstone');
assert.equal(expeditionStatus(initial).name,'WARDSTONE DEFENSE');
assert.equal(initial.enemies.some(e=>e.siege),true,'The Citadel really attracts siege attackers');
const wardDefense=createRun(8001),ward=wardDefense.expedition.target;
const saboteur=wardDefense.enemies.find(e=>e.siege);
saboteur.x=ward.x+12;saboteur.y=ward.y;saboteur.speed=0;saboteur.attack=0;
wardDefense.enemies=[saboteur];wardDefense.player.fireCooldown=999;
const intact=ward.hp;advance(wardDefense,{},1/60);
assert.ok(ward.hp<intact,'Siege enemies must actually damage the wardstone');
assert.ok(expeditionStatus(wardDefense).progress<1,'Wardstone bar tracks real damage');
const defended=createRun(8002);defended.enemies=[];
advance(defended,{},1/60);
assert.equal(defended.expedition.status,'complete','Clearing wave with living wardstone completes quest');
assert.equal(defended.expeditionsCompleted,1);
assert.ok(defended.expeditionRenown>0);
assert.equal(runSummary(defended).expeditionsCompleted,1);
const fallenWard=createRun(8003);fallenWard.expedition.target.hp=0;
advance(fallenWard,{},1/60);
assert.equal(fallenWard.expedition.status,'failed','Destroyed wardstone fails objective without ending the run');
assert.equal(fallenWard.phase,'running');

const purge=createRun(8011);
spawnWave(purge);spawnWave(purge); // Wave 3, Ashen Rift
assert.equal(purge.expedition.type,'portals');
assert.equal(purge.expedition.items.length,2);
assert.ok(purge.expedition.items.every(q=>q.active&&q.hp>0));
const spawnBefore=purge.enemies.length;
purge.expedition.items[0].spawnTimer=0;
purge.player.fireCooldown=999;
advance(purge,{},1/60);
assert.ok(purge.enemies.length>spawnBefore,'An intact portal spawns actual enemy reinforcements');
const guards=purge.enemies[0];guards.hp=99999;guards.x=100;guards.y=100;
guards.attack=999;guards.shoot=999;guards.speed=0;
purge.enemies=[guards];purge.hazards=[];
for(const portal of purge.expedition.items)
 purge.shots.push({x:portal.x,y:portal.y,vx:0,vy:0,r:6,ttl:1,damage:portal.hp+8,split:false});
advance(purge,{},1/60);advance(purge,{},1/60);
assert.equal(purge.expedition.status,'complete','Destroying both real portals completes the purge');
assert.equal(purge.expedition.items.filter(q=>q.active).length,0);
assert.ok(purge.score>0,'Completed expeditions award real score');

const shrine=createRun(8021);
for(let i=0;i<4;i++)spawnWave(shrine); // Wave 5, Moonlit Ruins
assert.equal(shrine.expedition.type,'shrine');
const watcher=shrine.enemies[0];watcher.hp=99999;watcher.attack=999;watcher.shoot=999;
watcher.speed=0;watcher.x=100;watcher.y=100;
shrine.enemies=[watcher];shrine.hazards=[];
shrine.player.x=shrine.expedition.target.x;shrine.player.y=shrine.expedition.target.y;
shrine.player.fireCooldown=999;
for(let i=0;i<135;i++)advance(shrine,{},1/25);
assert.equal(shrine.expedition.status,'complete','Standing at moon shrine finishes charge');
assert.ok(shrine.player.blessingTime>20,'Shrine completion activates a real temporary blessing');
assert.ok(shrine.player.hp<=shrine.player.maxHp);

const throne=createRun(8031);
for(let i=0;i<6;i++)spawnWave(throne); // Wave 7, Void Throne
assert.equal(throne.expedition.type,'seals');
const guard=throne.enemies[0];guard.hp=99999;guard.speed=0;
guard.attack=999;guard.shoot=999;guard.x=100;guard.y=100;
throne.enemies=[guard];throne.hazards=[];throne.player.fireCooldown=999;
throne.player.invulnerable=100;
for(const seal of throne.expedition.items){
 throne.player.x=seal.x;throne.player.y=seal.y;
 for(let i=0;i<57;i++)advance(throne,{},1/25);
}
assert.equal(throne.expedition.status,'complete','Players can activate both Void Seals');
assert.equal(throne.expeditionsCompleted,1);
assert.equal(expeditionStatus(throne).detail,'2 / 2 SEALS AWAKENED');

const ascensionBoss=createRun(8041);
for(let i=0;i<7;i++)spawnWave(ascensionBoss); // Wave 8, Void Tyrant
const voidTyrant=ascensionBoss.enemies.find(e=>e.kind==='tyrant');
assert.ok(voidTyrant&&isBoss(voidTyrant),'Wave 8 must introduce a distinct real boss');
assert.equal(voidTyrant.bossPhase,1);
assert.equal(ascensionBoss.expedition.type,'seals');
ascensionBoss.enemies=[voidTyrant];ascensionBoss.hazards=[];
voidTyrant.x=ascensionBoss.player.x+270;voidTyrant.y=ascensionBoss.player.y;
voidTyrant.speed=0;voidTyrant.attack=999;voidTyrant.shoot=1.2;
voidTyrant.hp=Math.ceil(voidTyrant.maxHp*.58);
ascensionBoss.player.fireCooldown=999;ascensionBoss.player.invulnerable=100;
ascensionBoss.shots.push({x:voidTyrant.x,y:voidTyrant.y,vx:0,vy:0,
 r:8,ttl:1,damage:350,split:false});
advance(ascensionBoss,{},1/60);
assert.equal(voidTyrant.bossPhase,2,'Tyrant enters a different phase below 55% HP');
assert.ok(ascensionBoss.hazards.some(h=>h.kind==='bossPulse'),'Second phase creates a real threatening pulse');
voidTyrant.shoot=0;
advance(ascensionBoss,{},1/60);
assert.equal(ascensionBoss.hostile.length,5,'Enraged Tyrant fires a five-projectile volley');
assert.ok(ascensionBoss.events.some(e=>e.type==='bossAttack'));
assert.equal(ascensionBoss.expedition.status,'active');
assert.ok(ascensionBoss.expedition.progress<2,'Seal objective remains playable during boss fight');

const blueprint=RELICS.find(r=>r.id==='wardlight');
assert.equal(blueprintUnlocked(blueprint,{expeditions:1}),false);
assert.equal(blueprintUnlocked(blueprint,{expeditions:2}),true);
assert.equal(purchaseRelic(rich,'wardlight',{expeditions:1}).success,false,
 'Locked blueprint cannot be purchased merely by having Renown');
const craftBlueprint=purchaseRelic(rich,'wardlight',{expeditions:2});
assert.equal(craftBlueprint.success,true);
const crestRun=createRun(8051,{relics:['wardlight']});
assert.equal(crestRun.player.maxHp,115);
assert.ok(crestRun.player.speed>defaultRun.player.speed);
const heart=RELICS.find(r=>r.id==='voidheart');
assert.equal(blueprintUnlocked(heart,{bosses:1}),false);
assert.equal(blueprintUnlocked(heart,{bosses:2}),true);
assert.equal(purchaseRelic(rich,'voidheart',{bosses:2}).success,true);
assert.equal(createRun(8052,{relics:['voidheart']}).player.leech,5);
const baseReward=renownReward({score:1700,wave:4,kills:20});
const questReward=renownReward({score:1700,wave:4,kills:20,expeditionRenown:62});
assert.equal(questReward-baseReward,62,'Completed quests pay real bonus Renown on run defeat');
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
assert.equal(current.version,'1.5.0');
assert.equal(current.previous_version,'1.4.0');
assert.equal(current.codename,'REALM EXPEDITIONS');
assert.ok(game.includes('function openAux('));
assert.ok(game.includes('document.body.dataset.gameView=mode'));
assert.ok(game.includes('auxReturn'));
assert.ok(game.includes('maxPixels=quality'));
assert.ok(read('renderer.js').includes("e.aimLocked"),'Warnings must follow locked aimed attacks');
assert.ok(read('renderer.js').includes('drawHazards(ctx,s,view,quality)'), 'Real rift warnings must be drawn');
assert.ok(read('renderer.js').includes("e.kind==='hexer'"), 'Hexer visual rendering must be distinctive');
assert.ok(read('renderer.js').includes("e.kind==='ravager'"), 'Ravager visual rendering must be distinctive');
assert.ok(read('index.html').includes('warbound-v1.1.css'));
assert.ok(read('index.html').includes('SOVEREIGN SURVIVAL — REALM EXPEDITIONS v1.5'));
assert.ok(read('sw.js').includes('proximus-sovereign-survival-expeditions-v1.5'));
for(const id of ['riftCount','recordElites','recordBosses'])
 assert.equal(html.split('id="'+id+'"').length,2,id+' must appear exactly once');
assert.ok(html.includes('ENEMIES OF THE NIGHTFALL')&&html.includes('RAVAGER'));
assert.ok(game.includes('records.elites+=result.eliteKills'));
assert.ok(game.includes('records.bosses+=result.bossKills'));
assert.ok(game.includes('records.expeditions+=result.expeditionsCompleted'));
assert.ok(game.includes('expeditionStatus(game)'));
assert.ok(read('renderer.js').includes('drawExpedition(ctx,s,view,quality)'),
 'Four world objectives must have genuine arena artwork');
assert.ok(read('renderer.js').includes('drawObjectiveCompass(ctx,s,view)'),
 'Players should see directions to relevant objectives');
assert.ok(read('renderer.js').includes("e.kind==='tyrant'"),'Void Tyrant needs distinct boss art');
for(const id of ['expeditionHud','expeditionName','expeditionFill','expeditionDetail',
 'expeditionState','expeditionDescription','expeditionReward','expeditionIcon',
 'bossName','recordExpeditions','endExpeditionRenown','endExpeditionProgress',
 'blessingBanner','blessingSeconds']){
 assert.equal(html.split('id="'+id+'"').length,2,'Missing/duplicate expedition UI '+id);
}
assert.ok(game.includes("resolveLoadout(progression,records)"));
assert.ok(game.includes("const resultReward=awardRun(progression,result)"));
assert.ok(game.includes("persistProgress();"));
assert.ok(game.includes("function renderArmory()"));
assert.ok(game.includes("ability:abilityQueued"),'Ability must reach actual engine input');
assert.ok(game.includes("k==='q'"),'PC Q shortcut must be implemented');
assert.ok(game.includes("$('abilityButton').addEventListener('click'"),'Mobile ability button must be functional');
assert.ok(read('renderer.js').includes('drawAwakeningEffect('),'Renderer must show champion abilities');
assert.ok(read('renderer.js').includes('e.burnTime>0'),'Burn status must be visible');
assert.ok(read('renderer.js').includes('p.barrierTime>0'),'Bulwark must be visible');
for(const id of ['abilityHud','abilityName','abilityStatus','abilityButton','abilityTouchIcon',
 'abilityMeter','abilityFill','evolutionList']){
 assert.equal(html.split('id="'+id+'"').length,2,id+' is missing or duplicated');
}
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
for(const file of ['warbound-v1.1.css','warbound-scene.svg','nightfall-v1.2.css','armory-v1.3.css','awakening-v1.4.css','expeditions-v1.5.css']){
 assert.ok(worker.includes("'./"+file+"'"),'Offline shell must cache '+file);
 assert.ok(fs.statSync(path.join(root,file)).size>3000,'Real visual asset missing: '+file);
}
assert.ok(css.includes('safe-area')||html.includes('viewport-fit=cover'));
for(const asset of ['index.html','style.css','core.js','renderer.js','game.js','manifest.webmanifest','icon.svg'])
 assert.ok(worker.includes("'./"+asset+"'"),'Offline shell missing '+asset);
assert.ok(!game.includes('fetch(')&&!game.includes('XMLHttpRequest('),'Gameplay must not require remote services');
assert.ok(!worker.includes('alchemist/video-vault'),'Offline scope must never cache Proximus personal media');
console.log('PASS Sovereign Survival Realm Expeditions v1.5: real ward/portal/shrine/seal objectives, quest Renown, two boss phases, unlockable blueprints, saved progress and isolated PWA');
