/* NEXUS | AZEROTH v22 — real-source integrity and three-feature unit acceptance */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const paths=['living-intelligence-v22-core.js','atlas-waypoints-v22.js',
 'character-research-v22.js','living-director-v22.js'];
const src=await Promise.all(paths.map(read));
for(let i=0;i<paths.length;i++)new vm.Script(src[i],{filename:paths[i]});
const frame={window:{},crypto:{randomUUID:()=>'b7adf406-5da0-4eb6-b6d9-22cc2f07d88a'}};
new vm.Script(src[0]).runInNewContext(frame);
const c=frame.window.NexusLivingIntelligenceV22;
assert.equal(c.VERSION,'22.0.0');
assert.equal(c.ZONES.length,25);
assert.equal(Object.keys(c.mapIDs).length,7);
assert.equal(c.mapIDs.hallowfall,2215);
assert.equal(c.mapIDs['azj-kahet'],2255);
assert.equal(c.mapIDs['ringing-deeps'],2214);
assert.equal(c.mapIDs['isle-of-dorn'],2248);
assert.equal(c.mapIDs['valdrakken'],2112);
assert.equal(c.mapIDs['waking-shores'],2022);
assert.equal(c.mapIDs['azure-span'],2024);
assert.equal(c.percent(-1),null);assert.equal(c.percent(101),null);
assert.equal(c.percent('0'),0);assert.equal(c.percent('100'),100);
assert.equal(c.percent(''),null);assert.equal(c.percent('abc'),null);
assert.equal(c.mapId(''),null);assert.equal(c.mapId(-1),null);
assert.equal(c.mapId(2215),2215);assert.equal(c.mapId('2215'),2215);
const waypoint={id:'manual-22-location-1',zoneId:'hallowfall',mapId:2215,
 x:52.45,y:80.25,title:'My first exact coordinate',kind:'Collectible',note:'User source',createdAt:'2026-11-20T20:00:00.000Z'};
assert.ok(c.waypoint(waypoint));
assert.equal(c.waypoint({...waypoint,x:110}),null);
assert.equal(c.waypoint({...waypoint,mapId:null}),null);
assert.equal(c.waypoint({...waypoint,zoneId:'imaginary'}),null);
assert.equal(c.waypoint({...waypoint,title:''}),null);
assert.equal(c.waypoint({...waypoint,id:'../bad/path'}),null);
const clean=c.cleanWaypoints([waypoint,waypoint,null,{...waypoint,id:'another-22-waypoint',y:0}]);
assert.equal(clean.length,2);
assert.equal(clean[1].y,0);
const macro=c.gameWaypointMacro(waypoint);
assert.match(macro,/C_Map\.CanSetUserWaypointOnMap\(m\)/);
assert.match(macro,/UiMapPoint\.CreateFromCoordinates\(m,0\.5245,0\.8025\)/);
assert.ok(macro.startsWith('/run local m=2215'));
assert.ok(!macro.includes('http')&&!macro.includes('eval('));
const newWay=c.addWaypoint(clean,{zoneId:'hallowfall',mapId:2215,x:10,y:11,title:'Manual test',kind:'Landmark'});
assert.equal(newWay.length,3);
assert.equal(c.removeWaypoint(newWay,newWay[0].id).length,2);
assert.throws(()=>c.addWaypoint([], {...waypoint,x:999}),/zone/i);
const rawProfile={selector:{region:'us',realm:'area-52',name:'testhero'},
 profile:{name:'Testhero',realm:{name:'Area 52'},character_class:{name:{en_US:'Mage'}},
  active_spec:{name:{en_US:'Frost'}},level:80,equipped_item_level:630},
 items:[{slotKey:'HEAD',name:'Synthetic Helm',id:12345,level:633},
  {slotKey:'CHEST',name:'Synthetic Robe',id:23456,level:625}],
 fetchedAt:'2026-11-20T12:00:00.000Z'};
const normalized=c.normalizeResearch(rawProfile);
assert.equal(normalized.character.className,'Mage');
assert.equal(normalized.character.spec,'Frost');
assert.equal(normalized.character.equippedItemLevel,630);
assert.equal(normalized.source,'blizzard-public-api-via-nexus');
assert.equal(c.normalizeResearch({selector:rawProfile.selector,items:rawProfile.items}),null);
const research=c.cleanResearch([normalized,normalized]);
assert.equal(research.length,1);
assert.equal(c.slotSummary(research[0]).reportedSlots,2);
assert.equal(c.slotSummary(research[0]).reportedAverage,629);
const reSaved=c.upsertResearch([],normalized);
assert.equal(reSaved[0].character.className,'Mage','Normalized public API report must preserve class on save');
assert.equal(reSaved[0].character.spec,'Frost','Normalized public API report must preserve specialization on save');
assert.equal(reSaved[0].items.length,2);
const profile2={...rawProfile,selector:{region:'eu',realm:'argent-dawn',name:'testhero'}};
assert.equal(c.upsertResearch(research,profile2).length,2);
assert.equal(c.normalizeStoredResearch({...normalized,source:'unknown'}),null);
const settings=c.normalDirector({budget:90,mode:'equipment',focus:'char-local-1',
 checks:{'goal-manual-v22-1':true,'../../attack':true}});
assert.equal(settings.budget,90);assert.equal(settings.mode,'equipment');
assert.ok(settings.checks['goal-manual-v22-1']);
assert.equal(settings.checks['../../attack'],undefined);
const rawGoals=[{id:'manual-v22-1',title:'Prepare gear in Hallowfall',zoneId:'hallowfall',
 category:'Equipment research',status:'active',charId:'char-local-1'},
 {id:'manual-v22-2',title:'Research Azj-Kahet',zoneId:'azj-kahet',
 category:'Explore',status:'planned',charId:'char-local-1'},
 {id:'manual-v22-3',title:'Unrelated character mission',zoneId:'hallowfall',
 category:'Explore',status:'active',charId:'other-char'}];
const plan=c.plan({goals:rawGoals,waypoints:clean,settings,
 operations:{entries:[{id:'manual-v22-1',minutes:45}]},research:normalized});
assert.equal(plan.scheduled[0].title,'Prepare gear in Hallowfall');
assert.equal(plan.scheduled[0].minutes,45);
assert.equal(plan.scheduled.some(x=>x.title==='Unrelated character mission'),false);
assert.equal(plan.preparation.length,3);
assert.match(plan.preparation[0].source,/Blizzard public API/);
assert.equal(plan.preparation[0].href,'./character-intelligence.html');
assert.match(plan.disclaimer,/not live WoW state/);
const empty=c.plan({settings:{budget:60},goals:[]});
assert.equal(empty.scheduled[0].id,'guide-atlas');
for(const text of src){
 assert.ok(!/eval\(|new Function\(|serviceWorker\.register\(|navigator\.geolocation|localStorage\.clear\(|localStorage\.removeItem\(/.test(text));
}
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(src.join('')),
 'The v22 modules must never make hidden network or API requests');
assert.ok(!/localStorage\.setItem\(|indexedDB\./.test(src[0]),'Core must be pure');
const allowedStorage=[...src.slice(1).join('\n').matchAll(/localStorage\.setItem\(([^,]+),/g)].map(x=>x[1]);
assert.ok(allowedStorage.every(s=>/core\.KEYS\./.test(s)),'Only own versioned new storage may be changed');
assert.equal(allowedStorage.length,3,'Each v22 feature has exactly one new opt-in storage key');
const files=[
 ['world-atlas.html',['living-intelligence-v22-core.js?v=2200','atlas-waypoints-v22.js?v=2200','living-intelligence-v22.css?v=2200']],
 ['character-intelligence.html',['living-intelligence-v22-core.js?v=2200','character-research-v22.js?v=2200']],
 ['player-experience.html',['living-intelligence-v22-core.js?v=2200','character-research-v22.js?v=2200']],
 ['living-intelligence.html',['living-intelligence-v22-core.js?v=2200','living-director-v22.js?v=2200','living-intelligence-v22.css?v=2200']]
];
for(const [file,parts] of files){const page=await read(file);for(const p of parts)assert.ok(page.includes(p),file+' missing '+p)}
const char=await read('character-intelligence.html');
assert.ok(char.includes('nexus:v22-character-report'),'Existing Blizzard fetch should emit sanitized post-response hook');
assert.ok(char.includes('https://nexus-azeroth-api.zevromxr.workers.dev'));
assert.ok(char.includes('"/api/character"')&&char.includes('"/api/equipment"'));
const oldSave=await read('save-protection.html');
for(const key of Object.values(c.KEYS))assert.ok(oldSave.includes(key),'v22 key not backed up: '+key);
assert.ok(!oldSave.includes('nexus_azeroth_secure_video_v20'),'Private Video Vault remains excluded');
const unity=await read('nexus-unity-v21-core.js');
assert.ok(unity.includes("id:'director'")&&unity.includes('./living-intelligence.html'));
const main=await read('index.html');
assert.ok(main.includes('performance-overdrive-v7.5.js?v=2200'));
assert.ok(main.includes('studio-art-direction-v9.2.css?v=2100'));
assert.ok(!main.includes('living-intelligence-v22-core.js'),'Full companion must not add extra v22 startup scripts');
const native=await read('performance-overdrive-v7.5.js');
assert.ok(native.includes(unity),'Unity directory should remain byte-identical in native main bundle');
const vault=await read('private-video-vault.html');
assert.ok(!vault.includes('living-director-v22.js'));
assert.ok(vault.includes("connect-src 'none'"));
const manifest=JSON.parse(await read('site.webmanifest'));
assert.ok(manifest.shortcuts.some(s=>s.url==='./living-intelligence.html'));
const css=await read('living-intelligence-v22.css');
assert.equal(css.split('{').length,css.split('}').length);
assert.ok(css.length<28000);
console.log('PASS v22: 25 zone IDs, 7 sourced UI map IDs, user-entered X/Y, macro format, opt-in public API gear snapshots, manual session planning and strict storage/Private Vault isolation.');
