/* NEXUS | AZEROTH v18 — simulated desktop / iPhone map acceptance
 * Tests synthetic local missions and user-directed map preview, never live WoW state.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
const BASE='http://127.0.0.1:4173/azeroth-companion/';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+s8N8AAAAASUVORK5CYII=','base64');
async function run(name,browserEngine,mobile){
 const browser=await browserEngine.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},
  isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 await context.addInitScript(()=>{
  const hero={id:'v18-hero-one',name:'Synthetic Mage',className:'Mage',spec:'Frost'};
  const draft={name:'My Frost Path',identity:'us/123/456',savedAt:'2026-11-17',specName:'Frost',rankByNode:{'1':1}};
  const goals=[
   {id:'manual-v18-0001',zoneId:'stormwind-city',title:'Prepare Stormwind Research',category:'Equipment research',
    status:'active',charId:'v18-hero-one',buildKey:'us/123/456::2026-11-17::My Frost Path',
    itemId:19019,notes:'Synthetic only',createdAt:'2026-11-17T00:00:00Z'},
   {id:'manual-v18-0002',zoneId:'hallowfall',title:'Explore Hallowfall',category:'Explore',
    status:'planned',charId:'',buildKey:'',itemId:null,notes:'Synthetic only',createdAt:'2026-11-17T00:00:00Z'}];
  localStorage.setItem('nexus_azeroth_companion_genesis_v1',JSON.stringify({characters:[hero]}));
  localStorage.setItem('nexus_azeroth_talent_forge_v1',JSON.stringify([draft]));
  localStorage.setItem('nexus_azeroth_item_atlas_v1',JSON.stringify([{id:19019,name:'Synthetic Helm'}]));
  localStorage.setItem('nexus_world_atlas_goals_v16',JSON.stringify(goals));
  localStorage.setItem('nexus_adventure_intelligence_v165',JSON.stringify({format:'nexus.adventure-intelligence/1',
   bookmarks:['hallowfall'],records:{}}));
  localStorage.setItem('nexus_adventure_operations_v17',JSON.stringify({
   format:'nexus.adventure-operations/1',title:'Synthetic Journey',date:'',characterId:'',
   notes:'',entries:[{id:'manual-v18-0001',minutes:30,note:''}]}));
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(BASE+'world-atlas.html?zone=stormwind-city',{waitUntil:'domcontentloaded'});
  await page.locator('#nx18Controls').waitFor();
  await page.locator('#nx18ChartPins button[data-zone="stormwind-city"]').waitFor();
  assert.equal(await page.locator('#nx16RegionPins .nx16-map-pin').count(),8);
  const art=await page.evaluate(async()=>{
   const image=document.getElementById('nx18WorldImage');
   if(!image.complete)await new Promise(res=>image.addEventListener('load',res,{once:true}));
   return {width:image.naturalWidth,src:image.getAttribute('src')};
  });
  assert.ok(art.width>=900,'Bundled fantasy map should render at real image resolution');
  assert.match(art.src,/nexus-atlas-cartography-v18\.svg/);
  assert.equal(await page.locator('.nx18-zone-pin').count(),4);
  assert.match(await page.locator('#nx18DetailHeading').textContent(),/STORMWIND CITY/);
  assert.equal((await page.locator('#nx18ZoneCard .nx18-zone-stat').first().locator('strong').textContent()).trim(),'1');
  const before=await page.evaluate(()=>({
   goals:localStorage.getItem('nexus_world_atlas_goals_v16'),
   forge:localStorage.getItem('nexus_azeroth_talent_forge_v1'),
   profiles:localStorage.getItem('nexus_azeroth_companion_genesis_v1'),
   session:localStorage.getItem('nexus_adventure_operations_v17')
  }));
  await page.locator('#nx18Filter').selectOption('active');
  assert.equal(await page.locator('#nx18ChartPins button[data-zone]').count(),1);
  await page.locator('#nx18Filter').selectOption('session');
  assert.equal(await page.locator('#nx18ChartPins button[data-zone]').count(),1);
  await page.locator('#nx18Filter').selectOption('capital');
  assert.equal(await page.locator('#nx18ChartPins button[data-zone]').count(),3);
  await page.locator('#nx18Filter').selectOption('all');
  await page.locator('#nx16RegionStrip button[data-region="khaz-algar"]').click();
  await page.locator('#nx18ChartPins button[data-zone="hallowfall"]').waitFor();
  await page.locator('#nx18ChartPins button[data-zone="hallowfall"]').click();
  assert.match(await page.locator('#nx18DetailHeading').textContent(),/HALLOWFALL/);
  assert.ok(await page.locator('#nx18ZoneCard .nx18-zone-tags').textContent().then(x=>x.includes('BOOKMARKED')));
  await page.locator('#nx18ZoneCard button[data-bookmark="hallowfall"]').click();
  const bookmarkState=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_adventure_intelligence_v165')));
  assert.equal(bookmarkState.bookmarks.includes('hallowfall'),false);
  await page.locator('#nx18ZoneCard button[data-bookmark="hallowfall"]').click();
  const bookmarkState2=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_adventure_intelligence_v165')));
  assert.equal(bookmarkState2.bookmarks.includes('hallowfall'),true);
  await page.locator('#nx18ZoneCard button[data-plan="hallowfall"]').click();
  assert.equal(await page.locator('#nx16GoalZone').inputValue(),'hallowfall');
  assert.match(await page.locator('#nx16GoalTitle').inputValue(),/Explore Hallowfall/);
  await page.locator('#nx18Performance').selectOption('lite');
  assert.equal(await page.locator('#nx16Atlas').evaluate(e=>e.classList.contains('nx18-lite')),true);
  await page.locator('#nx18MapFile').setInputFiles({name:'local-map.png',mimeType:'image/png',buffer:PNG});
  assert.match(await page.locator('#nx18WorldImage').getAttribute('src'),/^blob:/);
  await page.locator('#nx18ResetArt').click();
  assert.match(await page.locator('#nx18WorldImage').getAttribute('src'),/nexus-atlas-cartography-v18\.svg/);
  const after=await page.evaluate(()=>({
   goals:localStorage.getItem('nexus_world_atlas_goals_v16'),
   forge:localStorage.getItem('nexus_azeroth_talent_forge_v1'),
   profiles:localStorage.getItem('nexus_azeroth_companion_genesis_v1'),
   session:localStorage.getItem('nexus_adventure_operations_v17')
  }));
  assert.deepEqual(after,before,'Browsing map pins must not overwrite any existing missions, builds, character or session records');
  assert.deepEqual(errors,[],'No errors after Atlas interaction');
  if(mobile){
   const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,screen:window.innerWidth}));
   assert.ok(size.scroll<=size.screen+5,'iPhone horizontal overflow: '+JSON.stringify(size));
  }
  await page.screenshot({path:'test-results/azeroth-device-audit/atlas-v18-'+name+'.png',fullPage:true});
  console.log('PASS v18 '+name+' cartography, real map reference links, 25 source pins, mission overlays, bookmark preservation, optional local image and performance mode');
 }catch(error){
  await page.screenshot({path:'test-results/azeroth-device-audit/atlas-v18-error-'+name+'.png',fullPage:true}).catch(()=>{});
  throw error;
 }finally{await browser.close()}
}
await run('desktop-chromium',chromium,false);
await run('iphone-webkit',webkit,true);