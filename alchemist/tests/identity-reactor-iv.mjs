// PROXIMUS 3.0 — visual identity and real-audio Reactor IV deterministic checks
import assert from 'node:assert/strict';
import {
 IDENTITY_STORAGE,IDENTITY_SCHEMA,IDENTITY_PALETTES,DEFAULT_IDENTITY,
 normalizeIdentity,identityForHour,colorsForIdentity,identityAsCSS,
 identityBackup,readIdentityBackup,safeHex
} from '../visual-identity-core.js';
import {
 REACTOR_IV_PRESETS,REACTOR_MASKS,REACTOR_TRANSITIONS,
 normalizeEffectSettings,normalizeSceneOrder,nextSceneInOrder,effectLevels,
 transitionProgress,pulseDecay
} from '../reactor-iv.js';
const original=normalizeIdentity(DEFAULT_IDENTITY);
assert.equal(original.schema,IDENTITY_SCHEMA);
assert.equal(original.palette,'sovereign');
assert.deepEqual(original.exempt,['tokens']);
assert.equal(Object.keys(IDENTITY_PALETTES).length,6);
assert.equal(safeHex('#AaBbcC'),'#aabbcc');
assert.equal(safeHex('javascript:alert(1)'),'#b38aff');
assert.equal(normalizeIdentity({palette:'evil',glow:99,fontScale:3,borderStyle:'script',exempt:['tokens','../script','reactor']}).palette,'sovereign');
const repaired=normalizeIdentity({palette:'abyss',glow:99,fontScale:3,borderStyle:'script',exempt:['tokens','../script','reactor'],
 customColors:{accent:'#123456',secondary:'bogus'}});
assert.equal(repaired.glow,1);
assert.equal(repaired.fontScale,1.2);
assert.equal(repaired.borderStyle,'soft');
assert.deepEqual(repaired.exempt,['tokens','reactor']);
assert.equal(repaired.customColors.accent,'#123456');
assert.equal(repaired.customColors.secondary,IDENTITY_PALETTES.abyss.secondary);
const timed=normalizeIdentity({palette:'sovereign',schedule:{enabled:true,day:'solar',night:'abyss',start:8,end:20}});
assert.equal(identityForHour(timed,9),'solar');
assert.equal(identityForHour(timed,19),'solar');
assert.equal(identityForHour(timed,20),'abyss');
assert.equal(colorsForIdentity(timed,22).colors.accent,IDENTITY_PALETTES.abyss.accent);
const overnight=normalizeIdentity({schedule:{enabled:true,day:'frost',night:'ember',start:20,end:8}});
assert.equal(identityForHour(overnight,22),'frost');
assert.equal(identityForHour(overnight,10),'ember');
const variables=identityAsCSS({colors:IDENTITY_PALETTES.emerald},.65);
assert.equal(variables['--identity-accent'],IDENTITY_PALETTES.emerald.accent);
assert.equal(variables['--identity-glow-strength'],'0.65');
const backup=identityBackup(timed);
assert.equal(backup.schema,IDENTITY_SCHEMA);
assert.equal(readIdentityBackup(JSON.parse(JSON.stringify(backup))).schedule.day,'solar');
assert.throws(()=>readIdentityBackup({schema:'wrong',identity:timed}),/Unsupported/);
assert.equal(IDENTITY_STORAGE,'proximus-visual-identity-v1');

assert.equal(Object.keys(REACTOR_IV_PRESETS).length,5);
assert.deepEqual(REACTOR_MASKS,['none','halo','wings','bars','eclipse']);
assert.ok(REACTOR_TRANSITIONS.includes('sweep'));
const settings=normalizeEffectSettings({preset:'celestial',mask:'evil',sub:10,bass:-2,
 particles:7,shock:10,sceneOrder:['portal','portal','rings','evil']});
assert.equal(settings.sub,3);
assert.equal(settings.bass,.1);
assert.equal(settings.particles,2);
assert.equal(settings.shock,2);
assert.equal(settings.mask,REACTOR_IV_PRESETS.celestial.mask);
assert.deepEqual(settings.sceneOrder,['portal','portal','rings']);
assert.equal(normalizeEffectSettings().mask,'wings');
assert.equal(nextSceneInOrder('portal',['sovereign','portal','rings']),'rings');
assert.equal(nextSceneInOrder('rings',['sovereign','portal','rings']),'sovereign');
assert.deepEqual(normalizeSceneOrder(['invalid']),['sovereign','portal','rings','wave']);
const idle=effectLevels({sub:0,bass:0,mid:0,treble:0},REACTOR_IV_PRESETS.dominion);
assert.equal(idle.impact,0,'Idle audio cannot generate a fake bass shockwave');
assert.equal(idle.emissive,0);
assert.equal(idle.shimmer,0);
const sub=effectLevels({sub:1,bass:0,mid:0,treble:0},{preset:'abyss'});
assert.ok(sub.aura>.5);
assert.equal(sub.impact,0,'Sub-only energy should not fabricate a kick shockwave');
const bass=effectLevels({sub:0,bass:.7,mid:0,treble:0},{preset:'dominion'},true);
assert.ok(bass.impact>0.5);
const treble=effectLevels({sub:0,bass:0,mid:0,treble:.8},{preset:'frost'});
assert.ok(treble.shimmer>.5);
assert.equal(treble.impact,0);
assert.equal(transitionProgress(500,0,1000),.5);
assert.equal(transitionProgress(1200,0,1000),1);
assert.equal(pulseDecay(1000,-10000),0);
assert.ok(pulseDecay(1100,1000)>.5);
console.log('PASS v3.0: global themes, color sanitation, day/night schedule, portable identity, studio exceptions, five Reactor IV presets, masks, beat/frequency routing and scene transitions.');
