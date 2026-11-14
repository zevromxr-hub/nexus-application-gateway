// PROXIMUS v3.5.1 Sonic Dimension — real-audio reactions, scene/backup and compatibility tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
 SONIC_KEY,SONIC_SCHEMA,SONIC_WORLDS,normalizeSonic,sonicWorld,nextSonicWorld,sonicBackup,
 readSonicBackup,sonicPerformance,sonicLevels,shouldCycleSonic,safeSonicColor,drawSonicDimension
} from '../sonic-dimension.js';
const ROOT=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('index.html'),app=read('reactor-studio.js'),css=read('sonic-dimension.css');
const sw=read('sw.js'),sync=read('workspace-sync.js'),recovery=read('recovery-center.js');
const coreIds=SONIC_WORLDS.map(x=>x.id);
assert.deepEqual(coreIds,['nebula','cyber','celestial','ember','aurora']);
assert.equal(SONIC_KEY,'proximus-sonic-dimension-v1');
assert.equal(normalizeSonic().enabled,false,'Existing Reactor must remain the default visual mode');
assert.equal(normalizeSonic({enabled:true,world:'aurora',intensity:999,autoCycle:true,linkedScene:true,beatColors:false}).intensity,160);
assert.equal(normalizeSonic({enabled:1,world:'unsafe',intensity:0,linkedScene:3}).enabled,false);
assert.equal(normalizeSonic({world:'unsafe',intensity:0}).intensity,30);
assert.equal(sonicWorld('anything').id,'nebula');
assert.equal(nextSonicWorld('aurora'),'nebula');
assert.equal(nextSonicWorld('cyber'),'celestial');
const setup=normalizeSonic({enabled:true,world:'ember',intensity:145,autoCycle:true,linkedScene:true});
const backup=sonicBackup(setup);
assert.equal(backup.schema,SONIC_SCHEMA);
assert.deepEqual(readSonicBackup(JSON.parse(JSON.stringify(backup))),setup);
assert.throws(()=>readSonicBackup({schema:'anything',settings:setup}),/valid Sonic/);
assert.throws(()=>readSonicBackup({schema:SONIC_SCHEMA,settings:null}),/valid Sonic/);
assert.equal(safeSonicColor('red'),'#a17aff');
assert.equal(safeSonicColor('#AaBBcc'),'#aabbcc');
assert.equal(sonicPerformance('eco').stars,35);
assert.ok(sonicPerformance('cinema').stars>sonicPerformance('balanced').stars);
assert.equal(sonicPerformance('cinema',true).animated,false);
const noMusic=sonicLevels({bass:1,sub:1,mid:1,treble:1},1000,900,160,false);
assert.deepEqual(noMusic,{bass:0,sub:0,mid:0,treble:0,energy:0,kick:0},'No source must never fabricate reactions');
const music=sonicLevels({bass:.8,sub:.55,mid:.2,treble:.15},1000,960,125,true);
assert.ok(music.bass>.9,'Real bass should drive reactive amplitude');
assert.ok(music.kick>.8,'Confirmed recent kick should trigger a real impact');
const quiet=sonicLevels({bass:0,sub:0,mid:0,treble:0},3000,-10000,100,true);
assert.equal(quiet.energy,0);
assert.equal(quiet.kick,0);
assert.equal(shouldCycleSonic({autoCycle:true,active:true,beats:8,previousBeats:0,now:12050,lastChangeAt:0}),true);
assert.equal(shouldCycleSonic({autoCycle:true,active:true,beats:7,previousBeats:0,now:12050,lastChangeAt:0}),false);
assert.equal(shouldCycleSonic({autoCycle:true,active:true,beats:8,previousBeats:0,now:6000,lastChangeAt:0}),false);
assert.equal(shouldCycleSonic({autoCycle:true,active:false,beats:8,previousBeats:0,now:12050,lastChangeAt:0}),false);
function fakeContext(){
 let events=0;
 const grad=()=>({addColorStop(){events++;}});
 const methods=['save','restore','fillRect','beginPath','ellipse','arc','stroke','fill','translate','rotate','moveTo','lineTo','closePath','bezierCurveTo'];
 const obj={createRadialGradient:grad,createLinearGradient:grad};
 for(const key of methods)obj[key]=()=>{events++;};
 return {ctx:obj,count:()=>events};
}
for(const world of coreIds){
 const mock=fakeContext();
 const levels=drawSonicDimension(mock.ctx,{world,now:1100,width:960,height:540,
  bands:{bass:.7,sub:.52,mid:.4,treble:.3},lastKick:1000,active:true,quality:'balanced',
  intensity:145,beatShift:3,colorOverride:'#ae88ef'});
 assert.ok(mock.count()>45,world+' should produce a detailed original world');
 assert.ok(levels.kick>.1,world+' should use measured transient input');
 const idle=fakeContext();
 const silence=drawSonicDimension(idle.ctx,{world,width:640,height:360,quality:'eco',active:false,now:10000,lastKick:9400});
 assert.equal(silence.energy,0);
 assert.equal(silence.kick,0);
 assert.ok(idle.count()>25,'Idle '+world+' must draw ambient world rather than blank output');
}
const ids=['reactorDimensionJump','reactorDimensionEnabled','reactorDimensionAuto','reactorDimensionWorld','reactorDimensionIntensity',
'reactorDimensionIntensityOut','reactorDimensionLink','reactorDimensionColors','reactorDimensionNext','reactorDimensionReset',
'reactorDimensionExport','reactorDimensionPack','reactorDimensionImport','reactorDimensionStatus','reactorDimensionNow'];
for(const id of ids)assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Missing or duplicated control '+id);
assert.equal([...html.matchAll(/<section class="studio" data-panel="([^"]+)"/g)].length,20,'Do not add another top-level studio');
assert.equal([...html.matchAll(/class="nav[^"]*" data-view="([^"]+)"/g)].length,20,'Do not clutter navigation');
assert.ok(app.includes('drawSonicDimension(ctx,'));
assert.ok(app.includes('if(sonicSettings.enabled){'));
assert.ok(app.includes('readSonicBackup'));
assert.ok(app.includes('nextSonicWorld'));
assert.ok(app.includes('sonic:{...sonicSettings}'),'Legacy presets must allow saving the new world state');
assert.ok(app.includes("SETTINGS='proximus-reactor-settings-v1'"),'Original Reactor IV save key must remain');
assert.ok(sw.includes("'./sonic-dimension.js'")&&sw.includes("'./sonic-dimension.css'"),'Offline cache must include Sonic source');
assert.ok(sync.includes(SONIC_KEY)&&recovery.includes(SONIC_KEY),'Cross-device settings backup must preserve Sonic');
assert.ok(sync.includes('proximus-overdrive-settings-v1')&&recovery.includes('proximus-overdrive-settings-v1'),'Convergence color settings must be portable');
assert.ok(css.includes('@media(max-width:390px)')&&css.includes('prefers-reduced-motion'));
assert.ok(read('entertainment-overdrive.js').includes('proximus-overdrive-scene-changed'));
console.log('PASS: Sonic Dimension v3.5.1 — 5 audio-driven worlds, responsive painter, true measured hits, cooldowns, shared palettes, legacy Reactor and offline storage compatibility.');
