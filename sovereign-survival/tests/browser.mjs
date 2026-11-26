/* SOVEREIGN SURVIVAL v1.2 NIGHTFALL: real combat UI in desktop Chromium and mobile WebKit */
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
  assert.match(await page.title(),/NIGHTFALL v1\.2/);
  await page.waitForFunction(()=>document.body.dataset.realm==='sanctum',null,{timeout:10000});
  assert.equal(await page.locator('body').getAttribute('data-realm'),'sanctum');
  assert.equal(await page.locator('#recordElites').textContent(),'0');
  assert.equal(await page.locator('#recordBosses').textContent(),'0');
  assert.ok(await page.locator('#arenaCanvas').evaluate(el=>el.width>300&&el.height>300));
  // v1.1 title screen must function like a game menu instead of a tool dashboard.
  assert.equal(await page.locator('.side-column').count(),0,'No permanent tools sidebar during battle');
  assert.equal(await page.locator('.intro').count(),0,'No landing dashboard above the game');
  const viewport=await page.locator('#gameFrame').evaluate(el=>({
   height:Math.round(el.getBoundingClientRect().height),
   available:Math.round(window.innerHeight),
   width:Math.round(el.getBoundingClientRect().width)
  }));
  assert.ok(Math.abs(viewport.height-viewport.available)<4,'The battlefield must fill the visible screen');
  assert.ok(viewport.width>=380,'The arena should fill the available screen width');
  await page.locator('#menuRecords').click();
  assert.equal(await page.locator('#recordsOverlay').isVisible(),true,'Hall of Legends opens from main menu');
  assert.equal(await page.locator('#recordRuns').textContent(),'0');
  await page.locator('#recordsOverlay .auxBack').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),true);
  await page.locator('#menuGuide').click();
  assert.equal(await page.locator('#guideOverlay').isVisible(),true,'The initiation guide opens');
  assert.ok((await page.locator('#guideOverlay').textContent()).includes('Ravagers'));
  assert.ok((await page.locator('#guideOverlay').textContent()).includes('rift'));
  await page.locator('#guideOverlay .auxBack').click();
  await page.locator('#menuSettings').click();
  assert.equal(await page.locator('#settingsOverlay').isVisible(),true);
  await page.locator('#qualityToggle').click();
  assert.ok((await page.locator('#qualityToggle').textContent()).includes('Eco'));
  await page.locator('#settingsOverlay .auxBack').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),true);
  await page.locator('#startRun').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),false);
  assert.equal(await page.locator('#waveText').textContent(),'01');
  assert.equal(await page.locator('#riftCount').isVisible(),false,'Rift UI stays hidden before rifts exist');
  await page.waitForTimeout(550);
  assert.ok((await page.locator('#stageLabel').textContent()).includes('WAVE 1'));
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
  await page.locator('#pauseWarbook').click();
  assert.equal(await page.locator('#warbookOverlay').isVisible(),true,'The in-run Codex replaces the side dashboard');
  assert.equal(await page.locator('#buildList').count(),1,'Original upgrade list is preserved in Codex');
  assert.equal(await page.locator('.bestiary-entry').count(),6,'All six enemy archetypes are visible in Codex');
  assert.ok((await page.locator('#warbookOverlay').textContent()).includes('RAVAGER'));
  await page.locator('#warbookOverlay .auxBack').click();
  assert.equal(await page.locator('#pauseOverlay').isVisible(),true);
  await page.locator('#pauseSettings').click();
  assert.equal(await page.locator('#settingsOverlay').isVisible(),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#pauseOverlay').isVisible(),true,'Escape returns from settings without resuming combat');
  await page.waitForTimeout(300);
  await page.locator('#resumeRun').click();
  assert.equal(await page.locator('#pauseOverlay').isVisible(),false);
  await page.locator('#pauseButton').click();
  await page.locator('#abandonRun').click();
  assert.equal(await page.locator('#pauseOverlay').isVisible(),false);
  assert.equal(await page.locator('#recordRuns').textContent(),'2','Starting a new run increments local record');
  await page.locator('#pauseButton').click();
  await page.locator('#retreatToMenu').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),true,'Title menu is reachable from pause');
  await page.locator('#menuRecords').click();
  assert.equal(await page.locator('#recordRuns').textContent(),'2');
  await page.locator('#recordsOverlay .auxBack').click();
  assert.equal(await page.locator('#menuOverlay').count(),1);
  // A legacy v1.1 record object must retain its original values in v1.2.
  await page.evaluate(()=>localStorage.setItem('proximus-sovereign-survival-v1',
   JSON.stringify({best:7500,bestWave:12,runs:17,kills:321})));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#menuRecords').click();
  assert.equal(await page.locator('#recordBest').textContent(),'7,500');
  assert.equal(await page.locator('#recordWave').textContent(),'12');
  assert.equal(await page.locator('#recordRuns').textContent(),'17');
  assert.equal(await page.locator('#recordKills').textContent(),'321');
  assert.equal(await page.locator('#recordElites').textContent(),'0','New values default without resetting older records');
  assert.equal(await page.locator('#recordBosses').textContent(),'0');
  assert.deepEqual(errors,[],'No client runtime exceptions');
  console.log('PASS '+name+' gameplay startup, controls, pause/restart and local records');
 }catch(e){
  await page.screenshot({path:'/tmp/sovereign-survival-'+name+'.png',fullPage:false}).catch(()=>{});
  throw new Error(name+' '+e.message+'; page errors: '+errors.join(' | '));
 }finally{await context.close();await browser.close()}
}
