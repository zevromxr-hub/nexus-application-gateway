/* NEXUS | AZEROTH v17 — simulated desktop Chromium / iPhone WebKit acceptance.
 * Browser-local synthetic data only; never claims physical-device or in-game verification.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const BASE='http://127.0.0.1:4173/azeroth-companion/';
async function run(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},
  isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce',acceptDownloads:true});
 await ctx.addInitScript(()=>{
  const g1={id:'manual-v17-goal-001',title:'Prepare for Hallowfall',zoneId:'hallowfall',
   category:'Raid prep',status:'active',charId:'manual-v17-mage',
   buildKey:'us/123/456::2026-11-17::Mage Draft',itemId:19019,
   notes:'Manual test',createdAt:'2026-11-17T00:00:00Z'};
  const g2={...g1,id:'manual-v17-goal-002',title:'Explore Stormwind',
   zoneId:'stormwind-city',category:'Explore',status:'planned'};
  localStorage.setItem('nexus_world_atlas_goals_v16',JSON.stringify([g1,g2]));
  localStorage.setItem('nexus_azeroth_companion_genesis_v1',JSON.stringify({characters:[{id:'manual-v17-mage',name:'Synthetic Mage',className:'Mage'}]}));
  localStorage.setItem('nexus_azeroth_talent_forge_v1',JSON.stringify([{name:'Mage Draft',identity:'us/123/456',savedAt:'2026-11-17'}]));
  localStorage.setItem('nexus_azeroth_item_atlas_v1',JSON.stringify([{id:19019,name:'Manual Item'}]));
  localStorage.setItem('nexus_adventure_intelligence_v165',JSON.stringify({
   format:'nexus.adventure-intelligence/1',
   records:{'manual-v17-goal-001':{priority:'high',pinned:true,notes:'unmodified',steps:[{id:'step-0001',title:'Research encounter',done:true},{id:'step-0002',title:'Review build',done:false}]}},
   bookmarks:['hallowfall']}));
 });
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 try{
  await page.goto(BASE+'adventure-operations.html',{waitUntil:'domcontentloaded'});
  await page.locator('#nx17Root').waitFor();
  await page.locator('.nx17-library-card').first().waitFor();
  assert.equal(await page.locator('.nx17-library-card').count(),2);
  const saved=await page.evaluate(()=>({
   goals:localStorage.getItem('nexus_world_atlas_goals_v16'),
   plans:localStorage.getItem('nexus_adventure_intelligence_v165'),
   chars:localStorage.getItem('nexus_azeroth_companion_genesis_v1'),
   forge:localStorage.getItem('nexus_azeroth_talent_forge_v1')
  }));
  await page.locator('button[data-add="manual-v17-goal-001"]').click();
  await page.locator('button[data-add="manual-v17-goal-002"]').click();
  assert.equal(await page.locator('.nx17-agenda-card').count(),2);
  assert.equal((await page.locator('#nx17Checks').textContent()).trim(),'1 / 7');
  assert.match(await page.locator('.nx17-connection.nx17-present').first().textContent(),/Synthetic Mage/);
  await page.locator('button[data-action="up"][data-mission="manual-v17-goal-002"]').click();
  await page.locator('select[data-duration="manual-v17-goal-002"]').selectOption('60');
  const box=page.locator('input[data-entrynote="manual-v17-goal-002"]');
  await box.fill('Review destination before entering game');await box.press('Tab');
  await page.locator('#nx17Name').fill('My Synthetic Adventure');
  await page.locator('#nx17Notes').fill('These notes are only in the browser');
  await page.locator('#nx17SessionForm button[type="submit"]').click();
  let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_adventure_operations_v17')));
  assert.equal(state.entries.length,2);
  assert.equal(state.entries[0].id,'manual-v17-goal-002');
  assert.equal(state.entries[0].minutes,60);
  assert.equal(state.title,'My Synthetic Adventure');
  assert.equal(state.entries[0].note,'Review destination before entering game');
  assert.equal((await page.locator('#nx17Budget').textContent()).trim(),'60m');
  const dlPromise=page.waitForEvent('download');
  await page.locator('#nx17Export').click();
  const dl=await dlPromise;
  assert.match(dl.suggestedFilename(),/nexus-adventure-operations-v17-session\.json/);
  const payload={format:'nexus.adventure-operations-backup/1',session:state};
  await page.locator('#nx17ImportFile').setInputFiles({
   name:'session.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))
  });
  assert.match(await page.locator('#nx17ImportPreview').textContent(),/2 objectives/);
  assert.equal(await page.locator('#nx17Import').isEnabled(),true);
  page.once('dialog',d=>d.accept());
  await page.locator('#nx17Import').click();
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.nx17-agenda-card').count(),2);
  const after=await page.evaluate(()=>({
   goals:localStorage.getItem('nexus_world_atlas_goals_v16'),
   plans:localStorage.getItem('nexus_adventure_intelligence_v165'),
   chars:localStorage.getItem('nexus_azeroth_companion_genesis_v1'),
   forge:localStorage.getItem('nexus_azeroth_talent_forge_v1')
  }));
  assert.deepEqual(after,saved,'Original account, goal, checklist and build records must remain unchanged');
  assert.equal(errors.length,0,'Browser page errors: '+errors.join('; '));
  if(mobile){
   const dim=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(dim.scroll<=dim.width+5,'iPhone viewport must not overflow: '+JSON.stringify(dim));
  }
  console.log('PASS '+label+' v17 session assembly, ordering, time, export/import, persistence and source isolation');
 }finally{await browser.close()}
}
await run('desktop Chromium',chromium,false);
await run('iPhone-style WebKit',webkit,true);