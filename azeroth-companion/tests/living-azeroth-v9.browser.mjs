/* NEXUS Living Azeroth v9 — browser-only visual smoke audit.
 * No real Blizzard credentials, account records, or network game data.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
const BASE='http://127.0.0.1:4173/azeroth-companion/';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
async function check(label,engine,mobile){const browser=await engine.launch({headless:true}),context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1400,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
try{
page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://nexus-azeroth-api.zevromxr.workers.dev/**',route=>route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({message:'Blizzard gateway intentionally unavailable in visual smoke tests'})}));
await page.goto(BASE+'living-azeroth.html',{waitUntil:'domcontentloaded'});
assert.equal(await page.locator('.lv9-portal').count(),5,'All five illustrated chambers must be present');
assert.ok(await page.locator('.lv9-hero').isVisible());
await page.selectOption('#lv9Mode','performance');
assert.ok(await page.evaluate(()=>document.body.classList.contains('lv9-mode-performance')),'Performance mode must apply');
await page.reload({waitUntil:'domcontentloaded'});
assert.equal(await page.locator('#lv9Mode').inputValue(),'performance','Visual mode should survive reload');
await page.selectOption('#lv9Mode','balanced');
await page.goto(BASE+'sovereign-ascension.html',{waitUntil:'domcontentloaded'});
await page.locator('#lv9SovereignMast').waitFor();
assert.equal(await page.locator('#lv9SovereignMast .lv9-portal').count(),5,'Sovereign destination chambers preserved');
assert.ok(await page.locator('#nxReadLocal').isVisible(),'Legacy v8 local review must remain');
await page.goto(BASE+'character-intelligence.html',{waitUntil:'domcontentloaded'});
await page.locator('#lv9ArmoryStage').waitFor();
assert.ok((await page.locator('#lv9ArmoryStage').textContent()).includes('Equipment has not been loaded'),'No invented equipment before a Blizzard lookup');
await page.evaluate(()=>{const host=document.getElementById('itemsA');const item=document.createElement('div');item.className='item';item.innerHTML='<strong>HEAD · Synthetic Example Helm</strong><small>Item ID 123 · item level 600</small>';host.append(item)});
await page.locator('#lv9ArmoryStage .lv9-slot').waitFor();
await page.locator('#lv9ArmoryStage .lv9-slot').first().click();
assert.ok((await page.locator('#lv9ArmoryStage .lv9-equip-detail').textContent()).includes('Synthetic Example Helm'));
await page.goto(BASE+'progression-intelligence.html',{waitUntil:'domcontentloaded'});
await page.locator('#lv9QuestJournal').waitFor();
await page.locator('#lv9QuestJournal [data-kind="raids"]').click();
assert.equal(await page.locator('#lv9QuestJournal [data-kind="raids"]').getAttribute('aria-pressed'),'true');
await page.goto(BASE+'azeroth-assistant.html',{waitUntil:'domcontentloaded'});
await page.locator('#lv9OracleHeader').waitFor();
await page.locator('#question').fill('How do I compare equipment?');
await page.locator('#askForm button[type=submit]').click();
await page.waitForFunction(() => document.getElementById('lv9OracleStatus')?.textContent?.includes('Oracle responded'),null,{timeout:8000});
const size=await page.evaluate(()=>({page:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
assert.ok(size.page<=size.width+3,'No horizontal overflow at '+label+': '+JSON.stringify(size));
assert.deepEqual(errors,[],'No unexpected JavaScript errors in '+label);
console.log('PASS Living Azeroth '+label+' five chambers, modes, armory, progression and Oracle');
}catch(e){await page.screenshot({path:'test-results/azeroth-device-audit/living-v9-'+label+'.png',fullPage:true}).catch(()=>{});throw e}
finally{await context.close();await browser.close()}}
await check('desktop-chromium',chromium,false);
await check('phone-webkit',webkit,true);
