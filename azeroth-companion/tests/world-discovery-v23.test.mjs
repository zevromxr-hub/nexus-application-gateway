import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const here=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,here),'utf8');
const [html,base,unified,discovery,loot,v23,css,version,index]=await Promise.all([
 'world-atlas.html','atlas-real-map-v22.1.js','unified-maps-v22.2.js',
 'atlas-discovery-v22.3.js','boss-loot-intelligence-v22.4.js',
 'world-discovery-v23.js','world-discovery-v23.css','version.json','releases/index.json'].map(read));
for(const [name,src] of [['real-map',base],['unified',unified],['discovery',discovery],['loot',loot],['v23',v23]])
 new vm.Script(src,{filename:name});
assert.match(html,/data-nx-version="23\.0\.[01]"/);
assert.ok(html.indexOf('world-discovery-v23.js?v=2300')<html.indexOf('atlas-discovery-v22.3.js?v=2230'));
assert.ok(discovery.includes('if(window.NexusAtlasV23)return;'));
assert.ok(loot.includes('if(window.NexusAtlasV23)return;'));
for(const id of [2393,2395])assert.ok(base.includes('mapId:'+id),'Missing Midnight game map '+id);
for(const name of ['Murder Row','Great Vault','Portal Room','To the Central Tower'])assert.ok(base.includes(name));
assert.ok(base.includes('FULLSCREEN')&&base.includes('pinchStart'));
assert.ok(v23.includes('NexusRealMapDiscoveryV223'));
for(const t of ['Thunderfury','Invincible','Nerub-ar Palace','Abundance','The Stonevault'])assert.ok(v23.includes(t),'Missing research topic '+t);
assert.ok(v23.includes("www.wowhead.com/item=")&&v23.includes('VIEW')===false);
assert.ok(v23.includes('worldofwarcraft')===false,'Do not invent item icon URLs');
assert.ok(!/localStorage\.(setItem|removeItem|clear)\(|eval\(|new Function\(/.test(v23));
assert.ok(css.includes('nx230-map-fullscreen'));
assert.match(JSON.parse(version).version,/^23\.0\.[01]$/);
assert.match(JSON.parse(index).releases[0].version,/^23\.0\.[01]$/);
assert.equal(css.split('{').length,css.split('}').length);
console.log('PASS v23 World Discovery source checks; interactive browser and external provider acceptance separate');
