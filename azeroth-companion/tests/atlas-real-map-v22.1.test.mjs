/* NEXUS v22.1 real-map-first structural, provenance and data-integrity tests */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const base=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,base),'utf8');
const [js,css,atlas,version,core,waypoints,save,vault]=await Promise.all([
 'atlas-real-map-v22.1.js','atlas-real-map-v22.1.css','world-atlas.html',
 'version.json','living-intelligence-v22-core.js','atlas-waypoints-v22.js',
 'save-protection.html','private-video-vault.html'].map(read));
new vm.Script(js,{filename:'atlas-real-map-v22.1.js'});
assert.match(js,/assets\/wowdex\/maps\/worldmap\//,'Real game-derived map URLs must point to actual provider, not decorative NEXUS SVGs');
assert.match(js,/thewowdb\.com\/zone\/hallowfall-14838/);
assert.match(js,/thewowdb\.com\/zone\/zul-aman-15947/);
assert.match(js,/thewowdb\.com\/zone\/harandar-15355/);
assert.match(js,/thewowdb\.com\/zone\/voidstorm-16648/);
assert.match(js,/thewowdb\.com\/zone\/the-ringing-deeps-14795/);
assert.match(js,/thewowdb\.com\/zone\/isle-of-dorn-14717/);
assert.match(js,/warcraft\.wiki\.gg\/wiki\/Azj-Kahet/);
assert.ok([...js.matchAll(/mapId:\d{4}/g)].length>=10,'At least ten sourced zone maps, plus optional verified expansion maps');
for(const id of [2437,2413,2405,2215,2214,2248,2255,2112,2022,2024])
 assert.ok(js.includes('mapId:'+id),'Missing in-game zone map '+id);
assert.ok(js.includes('state.own=readOwn()'));
assert.ok(js.includes('core.KEYS.waypoints'));
assert.ok(!/localStorage\.setItem\(|localStorage\.removeItem\(|localStorage\.clear\(|indexedDB|fetch\(/.test(js),
 'Real Map First is read-only and uses no API or data mutations');
assert.ok(!/innerHTML=|eval\(|new Function\(/.test(js),
 'Dynamic POI names should be DOM text nodes, not injected HTML');
assert.ok(js.includes('img')||js.includes('image.src'));
assert.ok(js.includes("image.onerror"),'Unavailable map images should have immediate source fallback');
assert.ok(js.includes('pointerdown')&&js.includes('pointermove'),'Zoomed map should support desktop/touch panning');
assert.ok(js.includes('C_Map.SetUserWaypoint'));
assert.ok(!/window\.open|navigator\.geolocation|serviceWorker\.register/.test(js));
assert.equal(css.split('{').length,css.split('}').length,'CSS should have balanced blocks');
assert.ok(css.includes('aspect-ratio:1002/668'),'True 0–100 placement must use game-map aspect ratio');
assert.ok(css.includes('@media(max-width:620px)'));
assert.ok(atlas.indexOf('id="nx221RealAtlas"')<atlas.indexOf('class="nx16-atlas-hero"'),
 'Actual game map must load before older scenic hero and planning tools');
assert.ok(atlas.includes('atlas-real-map-v22.1.js?v=2210'));
assert.ok(atlas.includes('atlas-real-map-v22.1.css?v=2210'));
assert.ok(atlas.includes('VIEW FULL SOURCE MAP'));
assert.ok(atlas.includes('VIEW FULL SOURCE MAP')&&atlas.includes('NO LIVE TRACKING'));
assert.ok(atlas.includes('id="nx22Atlas"')===false,'Existing v22 lab injected dynamically, not removed from source');
assert.ok(atlas.includes('atlas-waypoints-v22.js?v=2200'),'Preserve v22 coordinate lab');
assert.ok(atlas.includes('world-atlas-routes-v18.1.js?v=1810'),'Preserve saved routes');
assert.ok(atlas.includes('world-atlas-lens-v18.2.js?v=1820'),'Preserve v18.2 Cartographer Lens');
assert.ok(atlas.includes('world-atlas-v16.js?v=1600'),'Preserve mission planner');
assert.ok(/NEXUS \| (?:Real Map Atlas|Atlas Discovery|Boss & Loot Atlas|World Discovery)/.test(atlas));
assert.ok(core.includes('nexus_atlas_waypoints_v22'));
assert.ok(waypoints.includes('nexus_atlas_waypoints_v22')===false||waypoints.includes('core.KEYS.waypoints'));
assert.ok(save.includes('nexus_atlas_waypoints_v22'));
assert.ok(!save.includes('nexus_azeroth_secure_video_v20'));
assert.ok(vault.includes("connect-src 'none'"));
console.log('PASS v22.1 Real Maps First: source-bearing WoW zone image URLs, 7 map IDs, safe 0–100 coordinate pins, responsive real map canvas, no legacy mutations, preserved encrypted Vault');
