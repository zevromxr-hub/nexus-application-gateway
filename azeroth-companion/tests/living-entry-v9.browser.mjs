/* Canonical v9 entrance preserved as the lightweight v9.1 Citadel on first visit. */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const BASE='http://127.0.0.1:4173/azeroth-companion/';
async function check(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1365,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(BASE,{waitUntil:'commit',timeout:30000}).catch(()=>{});
  await page.waitForURL(/citadel-entry\.html/,{timeout:14000});
  await page.locator('#nxCitadel').waitFor();
  assert.equal(await page.locator('.portal-wrap').count(),5,'Five cinematic chambers');
  assert.equal(await page.locator('main.main').count(),0,'Do not load full app behind gateway');
  const art=await page.locator('#nxHero').evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
  assert.match(art,mobile?/(?:radiant-warrior-background|sovereign-throne-v9\.1)\.webp/:/(?:radiant-warrior-background|sovereign-throne-v9\.1|citadel-hero-hd-v9\.1\.1)\.webp/,'Hero must show the device-appropriate original portrait or HD landscape art');
  await page.locator('#nxEnterApp').click();
  await page.waitForURL(/\?enter=1/);
  assert.ok(await page.locator('main.main').isVisible());
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('nexus_living_entry_seen_v9')),'entered');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#nxCitadel').count(),0,'Returning tab should bypass welcome');
  await page.goto(BASE+'?gateway=1',{waitUntil:'commit'}).catch(()=>{});
  await page.waitForURL(/citadel-entry\.html/,{timeout:14000});
  await page.locator('#nxCitadel .portal-wrap').first().waitFor();
  const dim=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(dim.scroll<=dim.width+3,'Gateway overflow '+JSON.stringify(dim));
  assert.deepEqual(errors,[]);
  console.log('PASS v9 entry compatibility '+label);
 }catch(e){await page.screenshot({path:'test-results/azeroth-device-audit/living-entry-'+label+'.png',fullPage:true}).catch(()=>{});throw e}
 finally{await ctx.close();await browser.close()}
}
await check('desktop-chromium',chromium,false);
await check('phone-webkit',webkit,true);