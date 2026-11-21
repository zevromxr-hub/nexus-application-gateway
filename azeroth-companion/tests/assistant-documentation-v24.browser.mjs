/* Guided assistant release/documentation smoke test, not gameplay verification. */
import assert from 'node:assert/strict';
import {webkit,chromium} from 'playwright';
const base='http://127.0.0.1:4173/azeroth-companion/azeroth-assistant.html';
for(const [name,engine,mobile] of [['iphone-webkit',webkit,true],['desktop-chromium',chromium,false]]){
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  const versionLoaded=page.waitForResponse(r=>r.url().includes('/azeroth-companion/version.json'),{timeout:25000});
  await page.goto(base+'?mini='+(mobile?'1':'0')+'&v=2401',{waitUntil:'domcontentloaded',timeout:40000});
  await versionLoaded;
  await page.waitForFunction(()=>/documented answers ready/.test(document.querySelector('#status')?.textContent||''),null,{timeout:20000});
  const count=await page.locator('#status').textContent();
  assert.match(count,/35 documented answers ready/);
  async function ask(question,expected){
   await page.locator('#question').fill(question);
   await page.locator('#askForm button[type="submit"]').click();
   const reply=page.locator('.bubble:not(.user) p').last();
   assert.match(await reply.textContent(),expected,question);
  }
  await ask('How do I find a dungeon, raid, boss, resource or location on the Atlas?',/World Atlas/);
  await ask('How do I leave fullscreen or see what I clicked on the iPhone map?',/Exit Map/);
  await ask('Is this a fully verified release?',/v24\.0\.1/);
  if(mobile)assert.equal(await page.locator('html').evaluate(x=>x.classList.contains('nx-mini')),true);
  assert.deepEqual(errors,[],'Assistant browser JavaScript errors: '+errors.join(' | '));
  console.log('PASS '+name+' current guided Atlas answers, version status and mobile mini mode');
 }finally{await ctx.close();await browser.close()}
}
