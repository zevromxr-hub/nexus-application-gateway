/* SOVEREIGN SURVIVAL browser smoke: true game interaction in Chromium/WebKit */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
for(const [name,engine,mobile] of [['desktop-chromium',chromium,false],['iphone-webkit',webkit,true]]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:880},
  isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(String(err)));
 try{
  await page.goto('http://127.0.0.1:4173/sovereign-survival/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#startRun').waitFor({state:'visible',timeout:18000});
  assert.equal(await page.locator('#menuOverlay').isVisible(),true);
  assert.ok(await page.locator('#arenaCanvas').evaluate(el=>el.width>300&&el.height>300));
  await page.locator('#startRun').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),false);
  assert.equal(await page.locator('#waveText').textContent(),'01');
  await page.waitForTimeout(550);
  assert.ok((await page.locator('#stageLabel').textContent()).includes('WAVE 1'));
  await page.locator('#qualityToggle').click();
  assert.ok((await page.locator('#qualityToggle').textContent()).includes('Eco'));
  if(mobile){
   assert.equal(await page.locator('#joystickZone').isVisible(),true);
   await page.locator('#dashButton').click();
  }else{
   await page.keyboard.down('d');await page.waitForTimeout(280);await page.keyboard.up('d');
   await page.keyboard.press('Shift');
  }
  await page.locator('#pauseButton').click();
  assert.equal(await page.locator('#pauseOverlay').isVisible(),true);
  await page.waitForTimeout(300);
  await page.locator('#resumeRun').click();
  assert.equal(await page.locator('#pauseOverlay').isVisible(),false);
  await page.locator('#pauseButton').click();
  await page.locator('#abandonRun').click();
  assert.equal(await page.locator('#pauseOverlay').isVisible(),false);
  assert.equal(await page.locator('#recordRuns').textContent(),'2','Starting a new run increments local record');
  assert.equal(await page.locator('#menuOverlay').count(),1);
  assert.deepEqual(errors,[],'No client runtime exceptions');
  console.log('PASS '+name+' gameplay startup, controls, pause/restart and local records');
 }catch(e){
  await page.screenshot({path:'/tmp/sovereign-survival-'+name+'.png',fullPage:false}).catch(()=>{});
  throw new Error(name+' '+e.message+'; page errors: '+errors.join(' | '));
 }finally{await context.close();await browser.close()}
}
