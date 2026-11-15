/* NEXUS | AZEROTH — v4.7 browser-level device audit
 * Hosted GitHub Actions supplies Chromium/WebKit and local HTTP serving.
 * No Blizzard credentials, API connectivity, or user data are required.
 */
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const BASE='http://127.0.0.1:4173/azeroth-companion/';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
function check(condition,message){assert.ok(condition,message)}
async function captured(label,func){
 let browser,context,page,errors=[];
 try{
  const engine=label.includes('webkit')?webkit:chromium;
  browser=await engine.launch({headless:true});
  context=await browser.newContext({
   viewport:label.includes('phone')?{width:390,height:844}:{width:1440,height:900},
   isMobile:label.includes('phone'),
   hasTouch:label.includes('phone'),
   deviceScaleFactor:label.includes('phone')?2:1,
   reducedMotion:'reduce'
  });
  page=await context.newPage();
  const localStatic=[];
  page.on('request',request=>{
   try{
    const url=new URL(request.url());
    if(url.origin===new URL(BASE).origin&&url.pathname.startsWith('/azeroth-companion/')&&/\.(?:js|css)$/.test(url.pathname))
     localStatic.push(url.pathname);
   }catch(_){}
  });
  // A localhost test origin is intentionally NOT authorized to query the live
  // Blizzard-backed Cloudflare API. Stub only that external dependency with a
  // non-success response; never simulate authenticated accounts or game data.
  await page.route('https://nexus-azeroth-api.zevromxr.workers.dev/**',route=>
   route.fulfill({status:503,contentType:'application/json',
    headers:{'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'},
    body:JSON.stringify({message:'Remote API disabled during local website-shell test'})}));
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('body.sp-portal-ready').waitFor({timeout:25000});
  await func(page);
  const size=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  check(size.page<=size.viewport+2,'Horizontal overflow: '+JSON.stringify(size));
  const cssRequests=[...new Set(localStatic.filter(p=>p.endsWith('.css')))];
  const jsRequests=[...new Set(localStatic.filter(p=>p.endsWith('.js')))];
  check(cssRequests.length===2,'Expected 2 CSS requests from the v4.7 source bundles, saw '+JSON.stringify(cssRequests));
  check(jsRequests.length===2,'Expected 2 JS requests from the v4.7 source bundles, saw '+JSON.stringify(jsRequests));
  const timings=await page.evaluate(()=>{
   const n=performance.getEntriesByType('navigation')[0];
   return {domContentLoadedMs:Math.round(n?.domContentLoadedEventEnd||0),loadMs:Math.round(n?.loadEventEnd||0)};
  });
  console.log('RESOURCE BUDGET '+label+' 2 CSS + 2 JS; navigation timings '+JSON.stringify(timings));
  check(errors.length===0,'Unexpected browser JavaScript errors: '+errors.slice(0,8).join('; '));
  console.log('PASS '+label+' width='+size.viewport+'px');
 }catch(e){
  console.error('FAIL '+label+' '+String(e));
  if(page)await page.screenshot({path:'test-results/azeroth-device-audit/'+label+'.png',fullPage:true,timeout:8000}).catch(()=>{});
  throw e;
 }finally{await context?.close().catch(()=>{});await browser?.close().catch(()=>{})}
}
await captured('chromium-desktop',async page=>{
 check(await page.locator('#sxExperience').isVisible(),'Cinematic homepage should be visible');
 check(await page.locator('#spQuickDeck').isVisible(),'My Quick Deck should be on Home');
 check(await page.locator('section[data-section="overview"] > .stats').count()===1,'Original overview metric counters should remain in Home');
 check((await page.locator('.sx-nav-group').count())>=4,'All studio categories must be present');
 await page.locator('#spCustomize').click();
 await page.locator('[data-sp-favorite="collections"]').check();
 const focus=await page.evaluate(()=>document.activeElement?.dataset?.spFavorite);
 check(focus==='collections','Quick Deck editor must preserve keyboard focus after checkbox updates');
 await page.locator('#spDoneShortcuts').click();
 check(await page.locator('#spFavorites [data-sp-go="collections"]').count()===1,'Selected quick destination must appear');
 await page.locator('#sxSettingsButton').click();
 await page.locator('[data-sx-setting="theme"]').selectOption('violet');
 await page.keyboard.press('Escape');
 check(await page.locator('#sxOverlay').isHidden(),'Escape should close appearance dialog');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('body.sp-portal-ready').waitFor();
 check(await page.evaluate(()=>document.body.dataset.sxTheme)==='violet','Appearance setting should survive reload');
 check(await page.locator('#spFavorites [data-sp-go="collections"]').count()===1,'Quick Deck should survive reload');
 await page.locator('#spTourButton').click();
 check(await page.locator('#spTour').isVisible(),'Website tour must open on demand');
 await page.locator('#spTourNext').click();
 check((await page.locator('#spTourTitle').textContent()).includes('Discover'),'Tour next should work');
 await page.keyboard.press('Escape');
 check(await page.locator('#spTour').isHidden(),'Escape should dismiss tour');
 await page.locator('#sxUpdatesButton').click();
 await page.locator('#sxReleaseVersion').getByText('Azeroth v5.7.0').waitFor({timeout:12000});
 await page.keyboard.press('Escape');
 await page.locator('.sidebar [data-view="dominion"]').click();
 await page.locator('#spContext').waitFor({state:'visible',timeout:5000});
 await page.locator('#spContextHome').click();
 check(await page.locator('section[data-section="overview"]').evaluate(el=>el.classList.contains('active')),'Return Home must restore overview');
});
for(const engine of ['chromium','webkit']){
 await captured(engine+'-phone',async page=>{
  check(await page.locator('#sxExperience').isVisible(),'Home must load on mobile engine');
  check(await page.locator('#spQuickDeck').isVisible(),'Quick Deck must fit mobile');
  const menu=page.locator('.ac-mobile-bar [data-ac-more]');
  await menu.click();
  check(await page.locator('body.ac-menu-open').count()===1,'Mobile All Tools drawer must open');
  const search=page.locator('.ac-search-wrap input');
  await search.fill('Atlas');
  check(await page.locator('.sidebar [data-view="atlas"]').isVisible(),'Mobile search must find Atlas');
  check(await page.locator('.sidebar [data-view="dominion"]').isHidden(),'Mobile search should hide unrelated tools');
  await page.locator('.ac-mobile-close').click();
  await menu.click();
  check(await page.locator('.sidebar [data-view="dominion"]').isVisible(),'Opening drawer again must reset prior search');
  await page.locator('.sidebar [data-view="dominion"]').click();
  await page.locator('#spContext').waitFor({state:'visible',timeout:5000});
  await page.locator('#spContextHome').click();
  await page.locator('#spCustomize').click();
  check(await page.locator('#spDeckEditor').isVisible(),'Quick Deck editor should be usable on phone');
  await page.locator('#spDoneShortcuts').click();
  await page.locator('#spTourButton').click();
  await page.locator('#spTourNext').click();
  await page.locator('[data-sp-close]').last().click();
  check(await page.locator('#spTour').isHidden(),'Website tour should be dismissible on phone');
  // Responsive switching is a frequent desktop/iPhone mismatch bug.
  await page.setViewportSize({width:1280,height:800});
  await page.waitForTimeout(250);
  check(await page.locator('.sidebar [data-view="dominion"]').isVisible(),'Desktop transition must restore all navigation links');
  check(await page.locator('.sidebar [data-view="atlas"]').isVisible(),'Desktop transition must preserve other grouped links');
 });
}
console.log('All v5.0 desktop/mobile Chromium and mobile WebKit browser audits passed.');
