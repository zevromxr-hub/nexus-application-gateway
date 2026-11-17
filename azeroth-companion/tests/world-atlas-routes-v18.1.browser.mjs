/* NEXUS | AZEROTH v18.1 — Chromium desktop / iPhone-style WebKit route QA.
 * Synthetic local profiles and Atlas goals only; no live Blizzard data.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
const base='http://127.0.0.1:4173/azeroth-companion/';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
async function check(name,engine,mobile){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},
  isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce',acceptDownloads:true});
 await context.addInitScript(()=>{
  const goal={id:'manual-v181-123',zoneId:'stormwind-city',title:'Plan my capital equipment',category:'Equipment research',
   status:'active',charId:'player-one',buildKey:'',itemId:19019,notes:'Original goal must be unchanged',createdAt:'2026-11-17T00:00:00Z'};
  localStorage.setItem('nexus_world_atlas_goals_v16',JSON.stringify([goal]));
  localStorage.setItem('nexus_azeroth_companion_genesis_v1',JSON.stringify({characters:[{id:'player-one',name:'Test Mage',className:'Mage'}]}));
  localStorage.setItem('nexus_azeroth_talent_forge_v1',JSON.stringify([{name:'Test Draft',rankByNode:{1:1}}]));
  localStorage.setItem('nexus_azeroth_item_atlas_v1',JSON.stringify([{id:19019,name:'Test item'}]));
  localStorage.setItem('nexus_adventure_operations_v17',JSON.stringify({format:'nexus.adventure-operations/1',title:'Original Session',entries:[{id:'manual-v181-123',minutes:10,note:''}]}));
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base+'world-atlas.html?zone=stormwind-city',{waitUntil:'domcontentloaded'});
  await page.locator('#nx181RouteStudio').waitFor();
  await page.locator('#nx18ChartPins button[data-zone="stormwind-city"]').waitFor();
  const before=await page.evaluate(()=>({
   goals:localStorage.getItem('nexus_world_atlas_goals_v16'),
   forge:localStorage.getItem('nexus_azeroth_talent_forge_v1'),
   items:localStorage.getItem('nexus_azeroth_item_atlas_v1'),
   operations:localStorage.getItem('nexus_adventure_operations_v17')
  }));
  assert.equal((await page.locator('#nx181StatRoutes').textContent()).trim(),'0 / 6');
  await page.locator('#nx181NewName').fill('My Capital Run');
  await page.locator('#nx181Create').click();
  assert.equal((await page.locator('#nx181StatRoutes').textContent()).trim(),'1 / 6');
  await page.locator('#nx181Editor button[data-action="pin"]').click();
  assert.equal((await page.locator('#nx181StatStops').textContent()).trim(),'1 / 12');
  await page.locator('#nx181ZonePicker').selectOption('orgrimmar');
  await page.locator('#nx181Editor button[data-action="add"]').click();
  assert.equal((await page.locator('#nx181StatStops').textContent()).trim(),'2 / 12');
  assert.equal(await page.locator('.nx181-stop').count(),2);
  assert.match(await page.locator('#nx181Board').textContent(),/Stormwind City/);
  assert.match(await page.locator('#nx181Board').textContent(),/Orgrimmar/);
  await page.locator('#nx181Board button[data-action="up"][data-zone="orgrimmar"]').click();
  assert.match(await page.locator('.nx181-stop').first().textContent(),/Orgrimmar/);
  await page.locator('#nx181Board button[data-action="done"][data-zone="orgrimmar"]').click();
  assert.equal((await page.locator('#nx181StatDone').textContent()).trim(),'1 / 2');
  await page.locator('#nx181Board input[data-note="orgrimmar"]').fill('Visit city research panel');
  await page.locator('#nx181Board button[data-action="note"][data-zone="orgrimmar"]').click();
  await page.locator('#nx16RegionStrip button[data-region="kalimdor"]').click();
  await page.waitForFunction(()=>document.querySelector('#nx18Chart')?.dataset.region==='kalimdor');
  assert.equal((await page.locator('#nx18ChartPins button[data-zone="orgrimmar"] .nx181-route-marker').textContent()).trim(),'1');
  await page.locator('#nx181Export').click();
  const originalState=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_atlas_routes_v181')));
  assert.equal(originalState.routes[0].stops[0].zoneId,'orgrimmar');
  assert.equal(originalState.routes[0].stops[0].done,true);
  assert.equal(originalState.routes[0].stops[0].note,'Visit city research panel');
  const routeId=originalState.routes[0].id;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#nx181RouteStudio').waitFor();
  assert.equal((await page.locator('#nx181StatStops').textContent()).trim(),'2 / 12');
  assert.equal(await page.locator('#nx181Choose').inputValue(),routeId);
  await page.locator('button[data-template="khaz"]').click();
  assert.equal((await page.locator('#nx181StatRoutes').textContent()).trim(),'2 / 6');
  assert.equal((await page.locator('#nx181StatStops').textContent()).trim(),'4 / 12');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#nx181Group').click();
  const after=await page.evaluate(()=>({
   goals:localStorage.getItem('nexus_world_atlas_goals_v16'),
   forge:localStorage.getItem('nexus_azeroth_talent_forge_v1'),
   items:localStorage.getItem('nexus_azeroth_item_atlas_v1'),
   operations:localStorage.getItem('nexus_adventure_operations_v17')
  }));
  assert.deepEqual(after,before,'All original user data must remain byte-for-byte unchanged');
  assert.deepEqual(errors,[],'No page errors for '+name);
  if(mobile){
   const size=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(size.scroll<=size.width+5,'Mobile should avoid horizontal overflow: '+JSON.stringify(size));
  }
  await page.screenshot({path:'test-results/azeroth-device-audit/atlas-v181-'+name+'.png',fullPage:true});
  console.log('PASS v18.1 '+name+': atlas route creation, pin insertion, reordering, manual notes/checks, template, persistence, existing source isolation.');
 }catch(error){
  await page.screenshot({path:'test-results/azeroth-device-audit/atlas-v181-error-'+name+'.png',fullPage:true}).catch(()=>{});
  throw error;
 }finally{await browser.close()}
}
await check('desktop-chromium',chromium,false);
await check('iphone-webkit',webkit,true);