/* NEXUS | v19 — desktop Chromium & iPhone-like WebKit visual QA.
 * Real local-first app pages, synthetic storage only. Does not test real devices or WoW accounts.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const ROOT='http://127.0.0.1:4173/';
const SOURCES=['nexus_world_atlas_goals_v16','nexus_adventure_intelligence_v165',
 'nexus_adventure_operations_v17','nexus_atlas_routes_v181',
 'nexus_azeroth_talent_forge_v1','nexus_azeroth_item_atlas_v1',
 'nexus_azeroth_companion_genesis_v1','nexus_sov_gateway_v1'];
async function check(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},
  hasTouch:mobile,isMobile:mobile,reducedMotion:mobile?'reduce':'no-preference'});
 await context.addInitScript(()=>{
  const values={
   nexus_world_atlas_goals_v16:JSON.stringify([{id:'manual-visual-100',zoneId:'stormwind-city',title:'Original mission',status:'planned',category:'Explore'}]),
   nexus_adventure_intelligence_v165:JSON.stringify({bookmarks:['stormwind-city'],records:{}}),
   nexus_adventure_operations_v17:JSON.stringify({format:'nexus.adventure-operations/1',title:'Original Session',entries:[]}),
   nexus_atlas_routes_v181:JSON.stringify({format:'nexus.atlas-routes/1',selected:'',routes:[]}),
   nexus_azeroth_talent_forge_v1:JSON.stringify([{name:'Original Forge Draft'}]),
   nexus_azeroth_item_atlas_v1:JSON.stringify([{id:19019,name:'Synthetic Item'}]),
   nexus_azeroth_companion_genesis_v1:JSON.stringify({characters:[{id:'synthetic-one',name:'Synthetic Hero'}]}),
   nexus_sov_gateway_v1:JSON.stringify({favorites:['azeroth'],recent:[]})
  };
  for(const [key,value] of Object.entries(values))if(!localStorage.getItem(key))localStorage.setItem(key,value);
 });
 const page=await context.newPage();
 const issues=[];page.on('pageerror',err=>issues.push(String(err)));
 async function visit(path,surface){
  const response=await page.goto(ROOT+path,{waitUntil:'domcontentloaded',timeout:40000});
  assert.equal(response?.status(),200,path+' should load');
  await page.locator('#nx19VisualMode').waitFor({timeout:15000});
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.nx19Surface),surface);
  assert.equal(await page.locator('#nx19VisualMode summary').count(),1);
  const width=await page.evaluate(()=>({body:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(width.body<=width.client+6,path+' horizontal overflow '+JSON.stringify(width));
 }
 async function setMode(value){
  await page.locator('#nx19VisualMode summary').click();
  await page.locator('#nx19Preset').selectOption(value);
  assert.equal(await page.locator('#nx19Preset').inputValue(),value);
  await page.waitForFunction(p=>document.documentElement.dataset.nx19Resolved===p,value);
  await page.locator('#nx19ModeClose').click();
  assert.equal(await page.locator('#nx19VisualMode').getAttribute('open'),null);
 }
 const snapshot=()=>page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),SOURCES);
 try{
  await visit('hub/','gateway');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.nx19Resolved),mobile?'quiet':'balanced');
  const before=await snapshot();
  await setMode('cinematic');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.nx19Preset),'cinematic');
  if(mobile){
   const animation=await page.locator('.hero').evaluate(e=>getComputedStyle(e,'::after').animationName);
   assert.equal(animation,'none','Cinematic mode still respects OS reduced motion');
  }
  await visit('azeroth-companion/world-atlas.html','atlas');
  assert.equal(await page.locator('#nx19Preset').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.nx19Resolved),'cinematic');
  await setMode('quiet');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.nx19Resolved),'quiet');
  assert.match(await page.locator('#nx18FilterStats').textContent(),/curated destinations|regions/);
  await visit('azeroth-companion/command-center.html','command');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.nx19Resolved),'quiet');
  await visit('alchemist/','creator');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.nx19Preset),'quiet');
  assert.ok(await page.locator('#layoutChoice').count()===1,'Existing creator device setting is preserved');
  await visit('azeroth-companion/?enter=1','azeroth');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.nx19Resolved),'quiet');
  assert.ok(await page.locator('#nxPerformanceOverdrive').count()<=1,'Native Talent Forge performance setting not duplicated');
  const after=await snapshot();
  assert.deepEqual(after,before,'Visual controls must not alter the gateway, account, mission or Forge records');
  assert.deepEqual(issues.filter(s=>s.includes('nexus-experience-v19')),[],'No visual-engine script exceptions');
  await page.screenshot({path:'test-results/azeroth-device-audit/nexus-v19-'+label+'.png',fullPage:true});
  console.log('PASS v19 '+label+': responsive presentation modes, reduced motion, premium Atlas, creator settings and byte-for-byte data isolation');
 }catch(err){
  await page.screenshot({path:'test-results/azeroth-device-audit/nexus-v19-error-'+label+'.png',fullPage:true}).catch(()=>{});
  throw err;
 }finally{await browser.close()}
}
await check('desktop-chromium',chromium,false);
await check('iphone-webkit',webkit,true);
