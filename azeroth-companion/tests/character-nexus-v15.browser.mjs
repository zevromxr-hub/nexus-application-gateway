/* NEXUS | AZEROTH v15 — browser smoke with simulated public Blizzard responses.
 * No real credentials or game-account calls; not a substitute for player testing.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
const BASE='http://127.0.0.1:4173/azeroth-companion/';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
async function run(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 await context.addInitScript(()=>{
  const draft={name:'Frost Test Draft',identity:'us/123/456',region:'us',specName:'Frost',savedAt:'2026-11-17T00:00:00Z',rankByNode:{'100':1},choiceByNode:{}};
  localStorage.setItem('nexus_azeroth_companion_genesis_v1',JSON.stringify({characters:[{id:'test-character',name:'Arcanist',className:'Mage',spec:'Frost',realm:'area-52',region:'us',version:'Retail'}],builds:[],tasks:[],collections:[]}));
  localStorage.setItem('nexus_azeroth_talent_forge_v1',JSON.stringify([draft]));
  localStorage.setItem('nexus_player_build_links_v11',JSON.stringify({'us/123/456::2026-11-17T00:00:00Z::Frost Test Draft':'test-character'}));
  localStorage.setItem('nexus_player_quests_v11',JSON.stringify([{id:'quest-a',charId:'test-character',title:'Plan a dungeon',kind:'Raiding',done:false,createdAt:'2026-11-17T00:00:00Z'}]));
  localStorage.setItem('nexus_azeroth_item_atlas_v1',JSON.stringify([{id:19019,region:'us',name:'Sample Helm',status:'wishlist',notes:'',updated:'2026-11-17'}]));
 });
 const page=await context.newPage(),errors=[];
 try{
  page.on('pageerror',err=>errors.push(String(err)));
  await page.route('https://nexus-azeroth-api.zevromxr.workers.dev/**',async route=>{
   const uri=new URL(route.request().url()),path=uri.pathname;
   const data=path.startsWith('/api/character/')?{
    name:'Arcanist',level:80,realm:{name:'Area 52'},character_class:{name:'Mage'},active_spec:{name:'Frost'},average_item_level:620,equipped_item_level:620
   }:path.startsWith('/api/equipment/')?{
    equipped_items:[{slot:{type:'HEAD',name:'Head'},item:{id:19019},name:'Sample Helm',level:{value:620}}]
   }:null;
   await route.fulfill({status:data?200:404,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({success:!!data,data})});
  });
  await page.goto(BASE+'player-experience.html',{waitUntil:'domcontentloaded'});
  await page.locator('#nx15Nexus').waitFor();
  assert.match(await page.locator('#nx15CharacterName').textContent(),/ARCANIST/);
  assert.equal((await page.locator('#nx15BuildCount').textContent()).trim(),'1');
  assert.equal((await page.locator('#nx15GoalCount').textContent()).trim(),'1');
  assert.match(await page.locator('#nx15GearTargets').textContent(),/Sample Helm/);
  assert.match(await page.locator('#nx15Equipped').textContent(),/Load public character equipment/);
  await page.locator('#nx15Fetch').click();
  await page.waitForFunction(()=>document.getElementById('nx15FetchStatus')?.textContent?.includes('BLIZZARD PUBLIC RESEARCH'),null,{timeout:10000});
  assert.match(await page.locator('#nx15PublicFacts').textContent(),/MAGE|Mage/);
  assert.match(await page.locator('#nx15Equipped').textContent(),/Sample Helm/);
  assert.match(await page.locator('#nx15GearTargets').textContent(),/SAME ID IN PUBLIC EQUIPMENT/);
  const before=await page.evaluate(()=>localStorage.getItem('nexus_azeroth_talent_forge_v1'));
  await page.locator('#nx15Remember').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_character_research_links_v15')));
  assert.equal(saved['test-character'].realm,'area-52');
  const bundle=await page.evaluate(()=>window.NexusCharacterNexusCore.packageFrom({character:{name:'Guest Mage',className:'Mage',spec:'Frost',realm:'area-52'},drafts:[{name:'Shared Frost',identity:'us/123/456',rankByNode:{'100':1}}]}));
  await page.locator('#nx15ImportFile').setInputFiles({name:'guest.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bundle))});
  await page.waitForFunction(()=>document.getElementById('nx15AcceptImport')?.disabled===false,null,{timeout:5000});
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#nx15AcceptImport').click();
  assert.match(await page.locator('#nx15GuestShelf').textContent(),/Guest Mage/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_azeroth_talent_forge_v1')),before,'Guest import must not rewrite original saved talent drafts');
  assert.equal(await page.locator('#px11ViewJourney').count(),1,'Original v11 Adventure Log preserved');
  const frame=await page.locator('#nx15Nexus').boundingBox();
  assert.ok(frame&&frame.width>0,'Character Nexus should render as a visible, measurable workspace');
  assert.deepEqual(errors,[],'No JavaScript page errors on '+label);
  await page.screenshot({path:'test-results/azeroth-device-audit/character-v15-'+label+'.png',fullPage:true}).catch(()=>{});
  console.log('PASS Character Nexus v15 '+label+' local profile, mocked public gear, source labels, guest isolation and original adventure workspace');
 }catch(error){
  await page.screenshot({path:'test-results/azeroth-device-audit/character-v15-error-'+label+'.png',fullPage:true}).catch(()=>{});
  throw error;
 }finally{await browser.close()}
}
await run('desktop-chromium',chromium,false);
await run('iphone-webkit',webkit,true);
