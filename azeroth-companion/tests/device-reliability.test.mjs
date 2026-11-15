/* Azeroth v4.6 website reliability regression — all studio data remains untouched */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const dir=path.resolve(import.meta.dirname,'..');
const read=x=>readFile(path.join(dir,x),'utf8');
const [html,portal,experience,css,workflow,browser]=await Promise.all([
 'index.html','sovereign-portal.js','sovereign-experience.js','sovereign-portal.css',
 '../.github/workflows/azeroth-device-audit.yml','tests/device-audit.browser.mjs'
].map(read));
new vm.Script(portal,{filename:'sovereign-portal.js'});
new vm.Script(experience,{filename:'sovereign-experience.js'});
assert.ok(html.includes('./sovereign-experience.js'),'v4.6 navigation fixes must remain available in the compiled site');
for(const file of ['sovereign-portal.js','sovereign-experience.js','adaptive-navigation.js','command-launcher.js',
 'character-dominion.js','verified-connection.js','player-guide.js','player-field-lab.js']){
 assert.ok(html.includes('./'+file),'Must retain installed '+file);
}
assert.ok(portal.includes('function renderDeck(focusId=null)'),'Quick Deck should be able to retain focus');
assert.ok(portal.includes("focus({preventScroll:true})"),'Keyboard focus must not disappear after checkbox selection');
assert.ok(portal.includes("if(choices.length!==state.favorites.length)")&&portal.includes("state.favorites=choices;persist()"),'Stale shortcuts must be removed from stored list');
assert.ok(portal.includes('persist();renderDeck(id)'),'Changing a checkbox must restore focus to that same option');
assert.ok(experience.includes("sxMobileMedia.addEventListener?.('change'"),'Switching device widths must reset mobile search');
assert.ok(experience.includes("legacySearch.value=''")&&experience.includes("new Event('input',{bubbles:true})"),'Desktop nav must unhide old phone-filtered tools');
assert.ok(experience.includes('drawerObserver.observe(document.body'),'Reopening phone drawer must synchronize grouped navigation');
assert.ok(experience.includes('syncMobileSearch')&&experience.includes('requestAnimationFrame(syncMobileSearch)'),'Mobile search/group sync missing');
assert.ok(css.includes('prefers-reduced-motion')&&css.includes('env(safe-area-inset-bottom'),'Existing accessibility and iPhone safe area styling preserved');
for(const engine of ['chromium','webkit'])assert.ok(browser.includes(engine),'Browser audit must include '+engine);
assert.ok(browser.includes('390,height:844')&&browser.includes('1440,height:900'),'Browser tests must exercise phone and desktop');
assert.ok(browser.includes('Horizontal overflow')&&browser.includes('Unexpected browser JavaScript errors'),'Browser tests must catch layout and runtime problems');
assert.ok(browser.includes("page.locator('.ac-search-wrap input')")&&browser.includes('setViewportSize'),'Browser test must cover phone search and resizing to desktop');
assert.ok(workflow.includes('playwright')&&workflow.includes('device-audit.browser.mjs'),'Hosted browser tests must run in Actions');
assert.ok(workflow.includes('pull_request:')&&workflow.includes('push:'),'Checks must run on PR and release');
for(const secret of ['BLIZZARD_CLIENT_SECRET','AZEROTH_SESSION_SECRET','__Host-nx_bnet_session','access_token'])assert.ok(!portal.includes(secret)&&!experience.includes(secret),'Public site-shell may not read account secrets');
assert.ok(!portal.includes("fetch(")&&!portal.includes('/api/me/'),'Device reliability must not introduce new account API access');
console.log('Azeroth v4.6 website device reliability static guards passed.');
