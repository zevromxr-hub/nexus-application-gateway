/* Citadel Awakening v9.1 — standalone gateway browser QA.
 * All static/local and intentionally no credentialed external API tests.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const BASE='http://127.0.0.1:4173/azeroth-companion/';
async function run(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1380,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 const page=await ctx.newPage(),errors=[],resources=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',req=>resources.push(req.url()));
 try{
  await page.goto(BASE+'citadel-entry.html',{waitUntil:'domcontentloaded'});
  await page.locator('#nxCitadel .portal-wrap').first().waitFor();
  assert.equal(await page.locator('.portal-wrap').count(),5);
  assert.ok(await page.locator('#nxHero').isVisible());
  assert.equal(resources.filter(s=>/scripts-(core|experience).*\.js/.test(s)).length,0,'Gateway must not download app bundles');
  assert.equal(resources.filter(s=>/nexus-azeroth-api.*workers/.test(s)).length,0,'No private account call on gateway');
  await page.locator('[data-preview="forge"]').click();
  assert.equal(await page.locator('#nxHero').getAttribute('data-scene'),'forge');
  assert.match(await page.locator('#nxHeroDestination').getAttribute('href'),/studio=talents/);
  assert.equal(await page.locator('#nxHeroDestination').getAttribute('data-destination'),'forge');
  await page.locator('[data-pin="forge"]').click();
  assert.equal(await page.locator('[data-pin="forge"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#nxPinned a').count(),1);
  await page.locator('#nxStudioSearch').fill('reputation');
  assert.equal(await page.locator('.portal-wrap:not([data-filtered="true"])').count(),1);
  await page.locator('#nxStudioSearch').fill('');
  await page.locator('#nxMode').selectOption('performance');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#nxMode').inputValue(),'performance');
  assert.equal(await page.locator('#nxPinned a').count(),1);
  await page.locator('#nxEnterApp').click();
  await page.waitForURL(/\/azeroth-companion\/\?enter=1/,{timeout:16000});
  assert.ok(await page.locator('main.main').isVisible(),'Original full companion must survive');
  assert.equal(await page.locator('#lv9EntryGate').count(),0,'Avoid old duplicated welcome');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('nexus_living_entry_seen_v9')),'entered');
  const dim=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(dim.scroll<=dim.width+3,'No horizontal overflow '+JSON.stringify(dim));
  assert.deepEqual(errors,[]);
  console.log('PASS v9.1 Citadel '+label+' lightweight entry, five chambers, search, pins, modes and full app');
 }catch(e){await page.screenshot({path:'test-results/azeroth-device-audit/citadel-v91-'+label+'.png',fullPage:true}).catch(()=>{});throw e}
 finally{await ctx.close();await browser.close()}
}
await run('desktop-chromium',chromium,false);
await run('phone-webkit',webkit,true);