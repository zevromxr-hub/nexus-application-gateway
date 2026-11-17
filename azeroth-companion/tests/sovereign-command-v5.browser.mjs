/* NEXUS | AZEROTH v5.0 — Sovereign Command full website interaction test
 * Localhost-only; remote authenticated Worker is deliberately unavailable.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const URL='http://127.0.0.1:4173/azeroth-companion/?enter=1';
async function run(label,browserType,phone){
 const browser=await browserType.launch({headless:true});let context;
 try{
  context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:900},isMobile:phone,hasTouch:phone,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://nexus-azeroth-api.zevromxr.workers.dev/**',route=>route.fulfill({
   status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'},
   body:'{"message":"Private account API is not available in website-shell tests"}'
  }));
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('body.nx-v5-ready').waitFor({timeout:25000});
  await page.waitForFunction(() => /Azeroth v\d+\.\d+\.\d+/i.test(document.querySelector('#sxHeroVersion')?.textContent||''),null,{timeout:12000});
  assert.ok(await page.locator('#nxCommandV5').isVisible(),'v5 command experience should be visible on Home');
  assert.equal(await page.locator('[data-nx-journey]').count(),3,'Three guided entry paths expected');
  assert.equal(await page.locator('[data-nx-journey="new"]').getAttribute('aria-pressed'),'true','New player must be first default');
  assert.equal(await page.locator('#nxJourneySteps button').count(),3,'New player path should offer three installed tools');
  await page.locator('[data-nx-journey="returning"]').click();
  assert.equal(await page.locator('[data-nx-journey="returning"]').getAttribute('aria-pressed'),'true');
  assert.ok((await page.locator('#nxJourneyTitle').textContent()).includes('next objective'));
  await page.locator('[data-nx-go="dominion"]').click();
  await page.locator('section[data-section="dominion"].active').waitFor({timeout:5000});
  assert.match(await page.title(),/Character Dominion/i,'Page title must follow active tool');
  assert.equal(await page.locator('.sidebar [data-view="dominion"]').getAttribute('aria-current'),'page','Current tool must be announced');
  await page.locator('#spContextHome').click();
  await page.locator('section[data-section="overview"].active').waitFor({timeout:5000});
  await page.locator('[data-nx-journey="group"]').click();
  assert.equal(await page.locator('[data-nx-journey="group"]').getAttribute('aria-pressed'),'true');
  assert.ok((await page.locator('#nxJourneyTitle').textContent()).includes('adventure'));
  // The former War Room may be retired from primary navigation. Never revive an inaccessible button.
  const warroom=page.locator('.sidebar [data-view="warcraft"]');
  if(await warroom.count()>0&&await warroom.getAttribute('data-nx-retired')==='true'){
   assert.equal(await page.locator('#nxJourneySteps [data-nx-go="warcraft"]').count(),0,'Retired War Room must not be promoted as a guided shortcut');
   assert.ok(await page.locator('#nxJourneySteps button').count()>0,'Group journey must still offer active tools');
  }else{
   assert.ok(await page.locator('#nxJourneySteps [data-nx-go="warcraft"]').count()>0,'Active War Room must be offered to group journey');
  }
  await page.locator('#nxFindTools').click();
  assert.ok(await page.locator('.az-launcher').isVisible(),'New website finder must reuse existing command launcher');
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('.az-launcher').isHidden(),'Existing launcher should still dismiss correctly');
  await page.locator('#sxSettingsButton').click();
  await page.locator('[data-nx-setting="text"]').selectOption('large');
  await page.locator('[data-nx-setting="home"]').selectOption('quiet');
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#sxOverlay').isHidden(),'Existing appearance dialog must still close normally');
  assert.equal(await page.evaluate(()=>document.body.dataset.nxText),'large');
  assert.equal(await page.evaluate(()=>document.body.dataset.nxHome),'quiet');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('body.nx-v5-ready').waitFor({timeout:25000});
  assert.equal(await page.evaluate(()=>document.body.dataset.nxText),'large','Reading comfort should persist');
  assert.equal(await page.evaluate(()=>document.body.dataset.nxHome),'quiet','Homepage atmosphere should persist');
  assert.equal(await page.locator('[data-nx-journey="group"]').getAttribute('aria-pressed'),'true','Last path should persist');
  await page.evaluate(()=>document.querySelector('.nx-skip-link').click());
  assert.ok(await page.evaluate(()=>document.activeElement===document.querySelector('main.main')),'Skip link must focus the existing main landmark regardless of its original ID');
  await page.locator('#sxSettingsButton').click();
  await page.locator('#sxResetSettings').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.body.dataset.nxText),'standard','Restore defaults should reset v5 reading settings too');
  assert.equal(await page.evaluate(()=>document.body.dataset.nxHome),'cinematic');
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await page.waitForTimeout(200);
  const backTop=page.locator('#nxToTop');
  assert.ok(await backTop.isVisible(),'Long pages should expose return-to-top');
  await backTop.click();
  // Smooth scrolling is asynchronous and can take longer than 350ms on large pages.
  await page.waitForFunction(()=>window.scrollY<300,null,{timeout:6000});
  assert.ok(await page.evaluate(()=>window.scrollY)<300,'Return-to-top should scroll toward the beginning');
  const dimensions=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(dimensions.page<=dimensions.viewport+2,'Website should not horizontally overflow '+JSON.stringify(dimensions));
  assert.deepEqual(errors,[],'No page JavaScript errors expected');
  console.log('PASS Azeroth v5.0 '+label+' — journeys, safe navigation, settings, persistence, skip link and return-to-top');
 }finally{await context?.close().catch(()=>{});await browser.close().catch(()=>{})}
}
await run('desktop Chromium',chromium,false);
await run('mobile WebKit',webkit,true);
console.log('Azeroth v5.0 Sovereign Command browser audits passed.');
