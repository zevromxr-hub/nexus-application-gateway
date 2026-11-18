/* NEXUS v18.2 — synthetic desktop Chromium + iPhone WebKit Cartographer Lens acceptance.
 * All mission/profile/route records are synthetic and private to the test browser.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const BASE='http://127.0.0.1:4173/azeroth-companion/';
async function audit(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 await ctx.addInitScript(()=>{
  const goal={id:'manual-lens-0001',zoneId:'stormwind-city',title:'Synthetic Stormwind Prep',category:'Equipment research',status:'active',charId:'demo-hero',buildKey:'',itemId:19019,notes:'Owner test only',createdAt:'2026-11-17T00:00:00Z'};
  localStorage.setItem('nexus_world_atlas_goals_v16',JSON.stringify([goal]));
  localStorage.setItem('nexus_adventure_intelligence_v165',JSON.stringify({format:'nexus.adventure-intelligence/1',bookmarks:['stormwind-city'],records:{}}));
  localStorage.setItem('nexus_adventure_operations_v17',JSON.stringify({format:'nexus.adventure-operations/1',title:'Synthetic v17',entries:[{id:'manual-lens-0001',minutes:20,note:''}]}));
  localStorage.setItem('nexus_atlas_routes_v181',JSON.stringify({format:'nexus.atlas-routes/1',selected:'route-lens-001',routes:[{id:'route-lens-001',title:'Synthetic Adventure',notes:'Private itinerary',updatedAt:'2026-11-17',stops:[{zoneId:'stormwind-city',note:'Demo',done:false},{zoneId:'hallowfall',note:'',done:false}]}]}));
  localStorage.setItem('nexus_azeroth_companion_genesis_v1',JSON.stringify({characters:[{id:'demo-hero',name:'Test Adventurer',className:'Mage'}]}));
  localStorage.setItem('nexus_azeroth_talent_forge_v1',JSON.stringify([{name:'Original Frost Draft',rankByNode:{a:1}}]));
 });
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(BASE+'world-atlas.html?zone=stormwind-city',{waitUntil:'domcontentloaded'});
  await page.locator('#nx182Lens').waitFor();
  await page.locator('#nx182RegionTitle').waitFor();
  assert.equal(await page.locator('.nx182-region-tile').count(),8);
  assert.match(await page.locator('#nx182RegionTitle').textContent(),/KINGDOMS OF THE EAST/);
  assert.match(await page.locator('#nx182DossierTitle').textContent(),/Stormwind City/);
  assert.match(await page.locator('#nx182DossierSubtitle').textContent(),/city research/i);
  assert.equal(await page.locator('#nx182Suggestions li').count(),3);
  assert.match(await page.locator('#nx182Records').textContent(),/Synthetic Adventure/);
  assert.match(await page.locator('#nx182Records').textContent(),/Synthetic Stormwind Prep/);
  const before=await page.evaluate(()=>Object.fromEntries(
    ['nexus_world_atlas_goals_v16','nexus_adventure_intelligence_v165','nexus_adventure_operations_v17','nexus_atlas_routes_v181','nexus_azeroth_talent_forge_v1'].map(k=>[k,localStorage.getItem(k)])));
  await page.locator('#nx182Search').fill('Azj-Kahet');
  await page.locator('#nx182Results button[data-zone="azj-kahet"]').click();
  await page.waitForFunction(()=>document.querySelector('#nx18Chart')?.dataset.region==='khaz-algar');
  await page.waitForFunction(()=>/AZJ-KAHET/i.test(document.getElementById('nx182DossierTitle')?.textContent||''));
  assert.match(await page.locator('#nx182RegionTitle').textContent(),/WORLD BENEATH/);
  assert.match(await page.locator('#nx182DossierType').textContent(),/ZONE/);
  await page.locator('#nx182Plan').click();
  assert.equal(await page.locator('#nx16GoalZone').inputValue(),'azj-kahet');
  assert.match(await page.locator('#nx16GoalTitle').inputValue(),/Explore Azj-Kahet/);
  await page.locator('.nx182-region-tile[data-region="northrend"]').click();
  await page.waitForFunction(()=>document.querySelector('#nx18Chart')?.dataset.region==='northrend');
  await page.waitForFunction(()=>/Icebound/.test(document.getElementById('nx182RegionMotto')?.textContent||''));
  assert.match(await page.locator('#nx182RegionMotto').textContent(),/Icebound/);
  assert.match(await page.locator('#nx182SceneArt').getAttribute('src'),/nexus-region-northrend-v182\.svg$/);
  const priorFocus=await page.locator('#nx182Density').getAttribute('aria-pressed');
  await page.locator('#nx182Density').click();
  const focus=await page.locator('#nx182Density').getAttribute('aria-pressed');
  assert.equal(focus,priorFocus==='true'?'false':'true','Focus Pins must toggle the previous state regardless of device or reduced-motion defaults');
  await page.locator('#nx18Filter').selectOption('goals');
  assert.match(await page.locator('#nx182Status').textContent(),/1 manual goal/);
  const after=await page.evaluate(()=>Object.fromEntries(
    ['nexus_world_atlas_goals_v16','nexus_adventure_intelligence_v165','nexus_adventure_operations_v17','nexus_atlas_routes_v181','nexus_azeroth_talent_forge_v1'].map(k=>[k,localStorage.getItem(k)])));
  assert.deepEqual(after,before,'v18.2 must be read-only relative to all existing player records');
  assert.deepEqual(errors,[],'No page exceptions from new Lens or preserved legacy chart');
  if(mobile){
   const width=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
   assert.ok(width.document<=width.viewport+5,'iPhone must not have global horizontal overflow: '+JSON.stringify(width));
  }
  await page.screenshot({path:'test-results/azeroth-device-audit/cartographer-v182-'+label+'.png',fullPage:true});
  console.log('PASS v18.2 '+label+': premium region panorama, curated source labels, destination jump, native mission handoff, clear focus mode and saved source isolation.');
 }catch(err){
  await page.screenshot({path:'test-results/azeroth-device-audit/cartographer-v182-error-'+label+'.png',fullPage:true}).catch(()=>{});
  throw err;
 }finally{await browser.close()}
}
await audit('desktop-chromium',chromium,false);
await audit('iphone-webkit',webkit,true);