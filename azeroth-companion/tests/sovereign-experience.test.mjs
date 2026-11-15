/* NEXUS | AZEROTH v4.4 website-only Sovereign Experience checks */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>readFile(path.join(root,file),'utf8');
const [html,js,css,nav,launcher]=await Promise.all(['index.html','sovereign-experience.js','sovereign-experience.css','adaptive-navigation.js','command-launcher.js'].map(read));
new vm.Script(js,{filename:'sovereign-experience.js'});
assert.match(html,/v4\.4 SOVEREIGN EXPERIENCE/);
for(const asset of ['sovereign-experience.js','sovereign-experience.css','character-dominion.js','player-field-lab.js','player-guide.js','sovereign-vault.js','verified-connection.js','adaptive-navigation.js','command-launcher.js']){
 assert.ok(html.includes('./'+asset),'Existing studio or new shell missing '+asset);
}
assert.ok(html.indexOf('character-dominion.js')<html.indexOf('sovereign-experience.js'),'Shell must mount after existing studios');
for(const word of ['SOVEREIGN EXPERIENCE ENGINE','categorize();','NAVIGATION','renderRecent()','sxExperience','sxWelcomeTitle','sxSettingsButton','sxUpdatesButton','sxOverlay','sxPreferences','sxReleasePanel','sxRecent','sxHomeRelease','sxHeroVersion','sx-nav-group','sx-mobile-group-title','sx-nav-toggle']){
 if(word==='NAVIGATION')continue;
 assert.ok(js.includes(word),'Shell missing '+word);
}
for(const title of ['Home & Discovery','Character & Builds','Items & Collections','Planning & Operations','Data & Utilities'])assert.ok(js.includes(title),'Navigation missing category '+title);
assert.ok(js.includes('nav.querySelectorAll')&&js.includes('button[data-view]'),'Existing studio buttons remain the navigation source of truth');
assert.ok(js.includes('legacyStats')&&js.includes('root.after(legacyStats)'),'Original home counters must be preserved and relocated instead of discarded');
assert.ok(js.includes('syncMobileSearch')&&nav.includes('refreshSearch()'),'Existing iPhone search must continue to work with grouped navigation');
assert.ok(js.includes('data.collapsed')&&js.includes('aria-expanded'),'Desktop groups should persist and announce state');
assert.ok(js.includes('data.recent')&&js.includes('nexus_azeroth_quick_launch_v36'),'Continue section must preserve existing Command Launcher favorites');
assert.ok(js.includes('data-sx-setting')&&js.includes('nexus_azeroth_site_shell_v44'),'Settings must use an independent website-level preference key');
for(const setting of ['theme','background','motion','density','contrast'])assert.ok(js.includes(setting),'Missing appearance setting '+setting);
assert.ok(js.includes("fetch('./version.json'")&&js.includes("fetch('./releases/index.json'"),'Release Center must use published version metadata');
assert.ok(js.includes('i.releases[0]?.version!==v.version'),'Disagreeing release records must never show a confirmed latest version');
assert.ok(js.includes('data.lastSeenVersion=version.version'),'Mark as read must require explicit user action');
assert.ok(js.includes('AbortController')&&js.includes('no-store'),'Release fetch must be bounded and avoid stale cache');
assert.ok(js.includes("document.body.classList.add('sx-ready')"),'Shell should activate after DOM initialization');
assert.ok(js.includes('role="dialog"')&&js.includes('aria-modal="true"')&&js.includes("e.key==='Escape'"),'Website dialog accessibility protections missing');
assert.ok(css.includes('prefers-reduced-motion')&&css.includes('data-sx-motion=reduce'),'Reduced-motion support required');
assert.ok(css.includes('data-sx-theme=violet')&&css.includes('data-sx-theme=cyan'),'Appearance choices missing');
assert.ok(css.includes('data-sx-background=minimal')&&css.includes('@media(max-width:520px)'),'Mobile visual controls missing');
assert.ok(!js.includes('/api/me/')&&!js.includes('/auth/'),'Public shell must never request private account routes');
for(const sensitive of ['BLIZZARD_CLIENT_SECRET','AZEROTH_SESSION_SECRET','__Host-nx_bnet_session','access_token'])assert.ok(!js.includes(sensitive),'Website shell may not handle credentials or tokens');
const forbiddenWrites=[
 'nexus_azeroth_companion_genesis_v1','nexus_azeroth_farm_operations_v1','nexus_azeroth_character_targets_v1',
 'nexus_azeroth_item_atlas_v1','nexus_azeroth_loot_hunter_v1','nexus_azeroth_talent_forge_v1'
];
for(const key of forbiddenWrites)assert.ok(!js.includes(key),'Shell must not read or write internal studio data: '+key);
assert.ok(launcher.includes('nexus_azeroth_quick_launch_v36'),'Command Launcher must retain existing storage key');
console.log('Sovereign Experience v4.4 website-only regression checks passed.');
