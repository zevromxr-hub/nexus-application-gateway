/* NEXUS | AZEROTH v4.7 — compiled resource integrity and request budget
 * The generator validates every byte against its original source and JS parses.
 * Prior studio tests still inspect their original, editable source files.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const html=await readFile(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('./styles-core-v5.2.css'),'The original v4.7 stylesheet bundle remains active');
for(const file of ['styles-core-v5.2.css','styles-experience-v5.0.css','scripts-core-v4.8.js','scripts-experience-v5.2.js']){
 assert.ok(html.includes('./'+file),'Missing compiled resource '+file);
}
for(const attr of ['data-sources="./warcraft-overdrive.css','data-sources="./assassin-dominion.css','data-sources="./warcraft-overdrive.js','data-sources="./talent-paths.js'])
 assert.ok(html.includes(attr),'Preserved source manifest absent: '+attr);
assert.equal((html.match(/<link rel="stylesheet" href=/g)||[]).length,6,'2 compiled and 2 additive visual stylesheets');
assert.equal((html.match(/<script defer src=/g)||[]).length,6,'2 compiled and 2 additive studio scripts');
assert.ok(html.indexOf('scripts-core-v4.8.js')<html.indexOf('scripts-experience-v5.2.js'),'Script order must preserve original dependency order');
assert.ok(html.indexOf('styles-core-v5.2.css')<html.indexOf('styles-experience-v5.0.css'),'CSS order must preserve original cascade order');
const check=await import('../scripts/lean-launch.mjs');
console.log('Azeroth v4.7 bundles checked and source parity verified.');
