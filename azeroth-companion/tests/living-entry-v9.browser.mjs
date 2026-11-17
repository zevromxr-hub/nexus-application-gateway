/* Living Azeroth cinematic gateway acceptance — all local, no real credentials. */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const BASE='http://127.0.0.1:4173/azeroth-companion/';
async function check(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1365,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
 await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#lv9EntryGate').waitFor({timeout:15000});
 assert.equal(await page.locator('#lv9EntryGate .lv9-portal').count(),5,'Entry must show five illustrated destinations');
 assert.ok(await page.locator('#lv9EnterApp').isVisible(),'Enter Companion action must be visible');
 assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('lv9-entry-open')),'Gateway locks underlying scroll while open');
 const art=await page.locator('#lv9EntryGate .lv9-hero').evaluate(el=>getComputedStyle(el).backgroundImage);
 assert.match(art,/radiant-warrior-background\.webp/,'Intro must use local premium character art');
 await page.locator('#lv9EnterApp').click();
 await page.waitForFunction(()=>!document.querySelector('#lv9EntryGate'),null,{timeout:8000});
 assert.ok(await page.locator('main.main').isVisible(),'Full original companion must remain present after Enter');
 assert.ok(await page.locator('aside.sidebar .nav').isVisible(),'Original app sidebar remains accessible');
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('nexus_living_entry_seen_v9')),'entered');
 await page.reload({waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#lv9EntryGate').count(),0,'Returning within same tab must not trap the user in the gate');
 await page.goto(BASE+'?gateway=1',{waitUntil:'domcontentloaded'});
 await page.locator('#lv9EntryGate').waitFor({timeout:8000});
 await page.locator('#lv9EntryGate .lv9-portal').first().waitFor();
 const dimensions=await page.evaluate(()=>({scroll:document.querySelector('#lv9EntryGate').scrollWidth,width:document.querySelector('#lv9EntryGate').clientWidth}));
 assert.ok(dimensions.scroll<=dimensions.width+3,'Gateway has unwanted horizontal overflow: '+JSON.stringify(dimensions));
 assert.deepEqual(errors,[],'No browser errors expected');
 console.log('PASS Living Azeroth intro '+label+' five destinations, enter, session persistence, forced reopen, art and layout');
 }catch(err){await page.screenshot({path:'test-results/azeroth-device-audit/living-entry-'+label+'.png',fullPage:true}).catch(()=>{});throw err}
 finally{await ctx.close();await browser.close()}
}
await check('desktop-chromium',chromium,false);
await check('phone-webkit',webkit,true);
