/* v23.0.1 — isolated fullscreen regression in emulated iPhone WebKit and desktop Chromium.
   This does not substitute for a physical iPhone or prove external map-host uptime. */
import assert from 'node:assert/strict';
import {webkit,chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const pixel=Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==','base64');
for(const [label,engine,mobile] of [['iphone-webkit',webkit,true],['desktop-chromium',chromium,false]]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},
  isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];
 const baseline='[{"id":"sample","zoneId":"hallowfall","mapId":2215,"x":49,"y":54,"title":"Keep my saved pin","kind":"Landmark"}]';
 await page.addInitScript(value=>localStorage.setItem('nexus_atlas_waypoints_v22',value),baseline);
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://thewowdb.com/assets/wowdex/maps/worldmap/**',r=>r.fulfill({status:200,contentType:'image/gif',body:pixel}));
 try{
  await page.goto('http://127.0.0.1:4173/azeroth-companion/world-atlas.html?zone=hallowfall',{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('#nx221MapViewport').waitFor({state:'visible',timeout:15000});
  await page.locator('.nx230-fullscreen').click();
  assert.equal(await page.locator('.nx230-map-fullscreen').count(),1,'Map should be expanded');
  assert.equal(await page.locator('#nx221MapViewport').evaluate(e=>e.parentElement===document.body),true,'Fullscreen should be portaled to body');
  assert.equal(await page.locator('.nx230-map-close').isVisible(),true,'Close control should be on screen');
  const closeBox=await page.locator('.nx230-map-close').boundingBox();
  assert.ok(closeBox&&closeBox.x>=0&&closeBox.y>=0&&closeBox.x+closeBox.width<= (mobile?390:1440)+1,'Close must remain within viewport');
  await page.locator('.nx230-map-fullscreen .nx221-map-pin[data-kind="Dungeon"]').first().click({timeout:10000});
  assert.equal(await page.locator('.nx230-map-selection').isVisible(),true,'Map selection should appear inside fullscreen');
  assert.match(await page.locator('.nx230-map-selection').textContent(),/UI Map 2215/);
  assert.equal(await page.locator('#nx230Detail').isHidden(),false,'World Discovery context should update with pin selection');
  await page.locator('.nx230-map-selection-actions button').first().click();
  assert.equal(await page.locator('.nx230-map-fullscreen').count(),0,'View details should exit fullscreen');
  assert.equal(await page.locator('#nx221MapViewport').evaluate(e=>e.parentElement.classList.contains('nx221-stage-main')),true,'Map should restore into its original layout');
  assert.equal(await page.locator('#nx221Selected').isVisible(),true,'Waypoint details should remain accessible');
  await page.locator('.nx230-fullscreen').click();
  await page.locator('.nx230-map-close').click();
  assert.equal(await page.locator('.nx230-map-fullscreen').count(),0,'Top-right exit button should always close fullscreen');
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('nx230-map-open')),false,'Scroll lock should be removed');
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_atlas_waypoints_v22')),baseline,'Saved pins must remain unchanged');
  assert.deepEqual(errors,[],'Unexpected browser JavaScript errors');
  console.log('PASS '+label+' fullscreen exit, selection, detail handoff, layout restoration, storage');
 }catch(e){
  console.error('FAIL '+label+' '+String(e));
  await page.screenshot({path:'test-results/azeroth-device-audit/map-fullscreen-'+label+'.png',fullPage:false}).catch(()=>{});
  throw e;
 }finally{await context.close();await browser.close()}
}
