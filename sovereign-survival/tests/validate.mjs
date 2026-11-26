/* SOVEREIGN SURVIVAL GENESIS: engine, upgrades, boss, controls and asset safety */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRun,advance,spawnWave,chooseUpgrade,UPGRADES,ENEMY_TYPES,WORLD,runSummary,durationLabel} from '../core.js';
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
const doomed=createRun(17);
doomed.player.hp=1;doomed.player.invulnerable=0;
doomed.enemies=[{...doomed.enemies[0],x:doomed.player.x,y:doomed.player.y,attack:0}];
advance(doomed,{},1/60);
assert.equal(doomed.phase,'gameover','Player can lose the game');
assert.equal(runSummary(doomed).score,0);
assert.equal(durationLabel(125),'2:05');
for(const file of ['core.js','renderer.js','game.js','sw.js']){
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
assert.equal(current.version,'1.1.0');
assert.equal(current.previous_version,'1.0.0');
assert.equal(current.codename,'WARBOUND INTERFACE');
assert.ok(game.includes('function openAux('));
assert.ok(game.includes('document.body.dataset.gameView=mode'));
assert.ok(game.includes('auxReturn'));
assert.ok(game.includes('maxPixels=quality'));
assert.ok(read('renderer.js').includes("e.shoot<.8"),'Monarch warning must be drawn before attack');
assert.ok(read('index.html').includes('warbound-v1.1.css'));
assert.ok(read('index.html').includes('SOVEREIGN SURVIVAL — WARBOUND v1.1'));
assert.ok(read('sw.js').includes('proximus-sovereign-survival-warbound-v1.1'));
for(const file of ['warbound-v1.1.css','warbound-scene.svg']){
 assert.ok(worker.includes("'./"+file+"'"),'Offline shell must cache '+file);
 assert.ok(fs.statSync(path.join(root,file)).size>3000,'Real visual asset missing: '+file);
}
assert.ok(css.includes('safe-area')||html.includes('viewport-fit=cover'));
for(const asset of ['index.html','style.css','core.js','renderer.js','game.js','manifest.webmanifest','icon.svg'])
 assert.ok(worker.includes("'./"+asset+"'"),'Offline shell missing '+asset);
assert.ok(!game.includes('fetch(')&&!game.includes('XMLHttpRequest('),'Gameplay must not require remote services');
assert.ok(!worker.includes('alchemist/video-vault'),'Offline scope must never cache Proximus personal media');
console.log('PASS Sovereign Survival Warbound v1.1: full screen cinema, menu pages, original combat, boss warnings, local storage and PWA isolation');
