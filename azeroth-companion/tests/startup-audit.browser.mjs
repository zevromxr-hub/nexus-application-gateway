/* NEXUS | AZEROTH v4.8 — view-activated startup browser audit.
 * Local site, no Blizzard login, no simulated private player ownership.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const URL='http://127.0.0.1:4173/azeroth-companion/';
async function run(label,engine,phone){
 const browser=await engine.launch({headless:true});let page,context;
 try{
  context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:900},isMobile:phone,hasTouch:phone,reducedMotion:'reduce'});
  page=await context.newPage();
  const requests=[],errors=[];
  page.on('request',request=>requests.push(request.url()));
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://nexus-azeroth-api.zevromxr.workers.dev/**',route=>route.fulfill({
   status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'},
   body:JSON.stringify({message:'Private API intentionally unavailable in browser smoke test'})
  }));
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('body.sp-portal-ready').waitFor();
  await page.locator('#sxHeroVersion').getByText('Azeroth v5.2.0').waitFor({timeout:12000});
  assert.equal(await page.evaluate(()=>typeof window.NexusStartup?.whenView),'function','View-aware startup scheduler must be available');
  const count=pattern=>requests.filter(url=>pattern.test(url)).length;
  assert.equal(count(/\/api\/talent-index\//),0,'Unused Talent Forge must not fetch Blizzard index on Home');
  assert.equal(count(/\/loot-sources\.json/),0,'Unused Loot Hunter must not download its catalog on Home');
  assert.equal(count(/\/version\.json(?:\?|$)/),1,'One startup release-version request is sufficient');
  assert.equal(count(/\/releases\/index\.json(?:\?|$)/),1,'One startup release-index request is sufficient');
  for(const id of ['#cdMetrics','#udMetrics','#pcMetrics','#pflChecklist']){
   assert.equal(await page.locator(id).evaluate(el=>el.childElementCount),0,'Hidden rollup should not render until visited: '+id);
  }
  async function go(id){
   if(phone){
    await page.locator('.ac-mobile-bar [data-ac-more]').click();
    await page.locator('.sidebar [data-view="'+id+'"]').click();
   }else await page.locator('.sidebar [data-view="'+id+'"]').click();
  }
  await go('dominion');
  assert.ok(await page.locator('#cdMetrics > div').count()>0,'Dominion must render local goals on selection');
  await go('dashboard');
  assert.ok(await page.locator('#udRoster').locator('div').count()>0,'Unified Dashboard must render on selection');
  await go('command');
  assert.ok(await page.locator('#pcMetrics').locator('div').count()>0,'Progress Command must render on selection');
  await go('fieldlab');
  assert.equal(await page.locator('#pflChecklist [data-pfl-check]').count(),12,'Field Lab must render checklist when opened');
  await go('loot');
  await page.waitForTimeout(150);
  assert.equal(count(/\/loot-sources\.json/),1,'Loot catalog should be fetched once after visit');
  await go('talents');
  await page.waitForTimeout(150);
  assert.equal(count(/\/api\/talent-index\//),1,'Talents index should be requested once upon visit');
  await go('guide');
  await page.locator('#pgAppVersion').getByText('Azeroth v5.2.0').waitFor({timeout:12000});
  assert.ok(count(/\/version\.json(?:\?|$)/)>=2,'Player Guide must load its version info on opening');
  await go('releases');
  await page.locator('#wowVersion').getByText('v5.2.0').waitFor({timeout:12000});
  assert.ok(count(/\/version\.json(?:\?|$)/)>=3,'Release Center must load its reference info on opening');
  assert.deepEqual(errors,[],'No browser JavaScript errors allowed');
  console.log('PASS v5.0 startup '+label+' — one initial release check, zero unused talent/loot requests, 4 deferred local rollups and all on-demand views operational');
 }finally{await context?.close().catch(()=>{});await browser.close().catch(()=>{})}
}
await run('desktop-chromium',chromium,false);
await run('mobile-webkit',webkit,true);
console.log('Azeroth v5.0 preserved Intelligent Startup browser audit passed.');
