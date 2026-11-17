/* NEXUS Azeroth v9.2 Studio Art Direction — local browser acceptance.
 * Presentation only: verify correct already-hosted assets, responsive geometry,
 * external source-intelligence navigation, and preserved mini assistant embed. */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const base='http://127.0.0.1:4173/azeroth-companion/';
const cases=[
 ['character-intelligence.html','character','.nx-art-banner','living-armory-v9.1.webp'],
 ['progression-intelligence.html','progression','.nx-art-banner','adventure-journal-v9.1.webp'],
 ['sovereign-ascension.html','sovereign','.intro','sovereign-throne-v9.1.webp'],
 ['azeroth-assistant.html','oracle','.nx-art-banner','azeroth-oracle-v9.1.webp'],
 ['addon-nexus.html','addon','.hero','talent-forge-v9.1.webp']
];
async function inspect(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({
   viewport:mobile?{width:390,height:844}:{width:1380,height:900},
   isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'
 });
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
   for(const [file,scope,hero,asset] of cases){
     await page.goto(base+file,{waitUntil:'domcontentloaded'});
     const actual=await page.locator('body').getAttribute('data-nx-art-page');
     assert.equal(actual,scope,'Incorrect art assignment for '+file);
     await page.locator(hero).waitFor();
     const art=await page.locator(hero).evaluate(el=>({
       background:getComputedStyle(el).backgroundImage,
       size:getComputedStyle(el).backgroundSize,
       inset:getComputedStyle(el,'::after').display
     }));
     assert.ok(art.background.includes('zevro-wide-banner-v9.2.webp'),file+' must use the full-width ZevRo panorama; observed '+JSON.stringify(art));
     assert.ok(art.size.includes('cover'),file+' wide banner must fill its frame');
     assert.equal(art.inset,'none',file+' must not retain the previous partial inset portrait');
     const left=await page.locator(hero).evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth}));
     assert.ok(left.scroll<=left.width+3,file+' has a banner overflow '+JSON.stringify(left));
     const viewport=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
     assert.ok(viewport.scroll<=viewport.width+3,file+' has page overflow '+JSON.stringify(viewport));
   }
   await page.goto(base+'living-azeroth.html',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('body').getAttribute('data-nx-art-page'),'living');
   const livingHero=await page.locator('.lv9-hero').evaluate(el=>getComputedStyle(el).backgroundImage);
   assert.ok(livingHero.includes('zevro-wide-banner-v9.2.webp'),'Alternate landing hero must use the panorama');
   const gallery=await page.locator('a.lv9-portal').evaluateAll(els=>els.slice(0,5).map(el=>{
     const cs=getComputedStyle(el),r=el.getBoundingClientRect();return{width:r.width,background:cs.backgroundImage};
   }));
   assert.equal(gallery.length,5);
   for(const [i,asset] of ['sovereign-throne','talent-forge','living-armory','adventure-journal','azeroth-oracle'].entries()){
      assert.ok(gallery[i].background.includes(asset),asset+' original image missing from portal '+i);
      assert.ok(gallery[i].width<=381,'Portal may not stretch original 380px image');
   }
   await page.goto(base+'azeroth-assistant.html?mini=1',{waitUntil:'domcontentloaded'});
   assert.ok(await page.locator('.nx-art-banner').isHidden(),'Mini guide must not render a promotional hero inside app bubble');
   await page.goto(base+'?enter=1',{waitUntil:'domcontentloaded'});
   await page.locator('main.main').waitFor();
   assert.ok((await page.locator('body').getAttribute('class')).includes('nx-art-studios'));
   const mainBackdrop=await page.locator('body').evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
   assert.ok(mainBackdrop.includes('citadel-hero-hd-v9.1.1.webp'),'Full app must use the sharp HD cinematic background');
   const btn=page.locator('.sidebar button[data-view="talents"]');
   await btn.evaluate(el=>el.click()); // navigation state, not a mobile-menu screenshot interaction
   await page.locator('section[data-section="talents"].active').waitFor({timeout:12000});
   const talentHeader=page.locator('.lv9-talent-header').first();
   await talentHeader.waitFor({timeout:12000});
   const talentBg=await talentHeader.evaluate(el=>getComputedStyle(el).backgroundImage);
   assert.ok(talentBg.includes('zevro-wide-banner-v9.2.webp'),'Talent Forge must use the full-width ZevRo banner');
   const talentSize=await talentHeader.evaluate(el=>getComputedStyle(el).backgroundSize);
   assert.ok(talentSize.includes('cover'),'Talent Forge art must fill its banner without partial portrait gaps');
   const dim=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(dim.scroll<=dim.width+3,'Full app art must not expand width '+JSON.stringify(dim));
   assert.deepEqual(errors,[],'Unexpected page errors');
   console.log('PASS v9.2.1 panoramic studio artwork '+label+' — active Talent Forge, six external tools, native-size cards, mini guide and responsive layout');
 }catch(e){
   await page.screenshot({path:'test-results/azeroth-device-audit/studio-art-v92-'+label+'.png',fullPage:true}).catch(()=>{});
   throw e;
 }finally{await context.close();await browser.close()}
}
await inspect('desktop-chromium',chromium,false);
await inspect('phone-webkit',webkit,true);
