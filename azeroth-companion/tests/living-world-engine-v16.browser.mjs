/* NEXUS | AZEROTH v16 — advisory desktop & iPhone WebKit browser smoke
 * No real Blizzard accounts. Seeds only synthetic browser-local manual profiles.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
const base='http://127.0.0.1:4173/azeroth-companion/';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
async function check(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 await context.addInitScript(()=>{
  const char={id:'test-hero',name:'Arcanist',className:'Mage',spec:'Frost',realm:'area-52',region:'us'};
  const draft={name:'Frost Research',identity:'us/123/456',region:'us',specName:'Frost',savedAt:'2026-11-17T00:00:00Z',rankByNode:{'100':1},choiceByNode:{}};
  localStorage.setItem('nexus_azeroth_companion_genesis_v1',JSON.stringify({characters:[char],tasks:[],collections:[],builds:[]}));
  localStorage.setItem('nexus_player_focus_v11','test-hero');
  localStorage.setItem('nexus_azeroth_talent_forge_v1',JSON.stringify([draft]));
  localStorage.setItem('nexus_azeroth_item_atlas_v1',JSON.stringify([{id:19019,name:'Test Research Helm',status:'wishlist',region:'us'}]));
  localStorage.setItem('nexus_world_atlas_goals_v16',JSON.stringify([{id:'manual-existing-100',zoneId:'stormwind-city',
   title:'Prepare for a city adventure',category:'Explore',status:'planned',charId:'test-hero',buildKey:'',itemId:null,
   notes:'Tester goal',createdAt:'2026-11-17T00:00:00Z'}]));
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 try{
  await page.goto(base+'command-center.html',{waitUntil:'domcontentloaded'});
  await page.locator('#nx16WarRoom').waitFor();
  await page.waitForFunction(()=>/Arcanist/i.test(document.getElementById('nx16WarName')?.textContent||''),null,{timeout:7000});
  assert.match(await page.locator('#nx16WarName').textContent(),/Arcanist/i);
  assert.equal((await page.locator('#nx16WarGoals').textContent()).trim(),'1');
  await page.locator('#nx16LaunchSearch').click();
  await page.locator('#nx16SearchField').fill('Stormwind');
  assert.match(await page.locator('#nx16SearchResults').textContent(),/Stormwind City/);
  await page.locator('#nx16CloseSearch').click();
  await page.screenshot({path:'test-results/azeroth-device-audit/world-v16-war-room-'+label+'.png',fullPage:true});
  await page.goto(base+'world-atlas.html?zone=stormwind-city',{waitUntil:'domcontentloaded'});
  await page.locator('.nx16-map-pin').first().waitFor();
  assert.match(await page.locator('#nx16RegionName').textContent(),/Eastern Kingdoms/);
  assert.equal(await page.locator('.nx16-map-pin').count(),8);
  assert.equal((await page.locator('#nx16GoalZone').inputValue()),'stormwind-city');
  assert.match(await page.locator('#nx16GoalRows').textContent(),/Prepare for a city adventure/);
  const original=await page.evaluate(()=>localStorage.getItem('nexus_azeroth_talent_forge_v1'));
  await page.locator('#nx16GoalTitle').fill('Research Stormwind city equipment');
  await page.locator('#nx16GoalCategory').selectOption('Equipment research');
  await page.locator('#nx16GoalForm button[type="submit"]').click();
  assert.equal(await page.locator('.nx16-mission-card').count(),2);
  assert.equal((await page.locator('#nx16CountMissions').textContent()).trim(),'2');
  assert.equal((await page.locator('#nx16CountOpen').textContent()).trim(),'2');
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_azeroth_talent_forge_v1')),original,'Atlas may not rewrite native Forge drafts');
  await page.locator('.nx16-goal-status').first().selectOption('completed');
  assert.equal((await page.locator('#nx16CountOpen').textContent()).trim(),'1');
  await page.locator('#nx16RegionStrip button[data-region="khaz-algar"]').click();
  assert.match(await page.locator('#nx16Destinations').textContent(),/Azj-Kahet/);
  await page.screenshot({path:'test-results/azeroth-device-audit/world-v16-atlas-'+label+'.png',fullPage:true});
  await page.goto(base+'player-experience.html',{waitUntil:'domcontentloaded'});
  await page.locator('#nx16CharacterWorld').waitFor();
  assert.match(await page.locator('#nx16WorldCharacterStatus').textContent(),/open local world objective/);
  assert.equal(await page.locator('#px11Station').count(),1,'Original v11 character workspaces preserved');
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_azeroth_talent_forge_v1')),original,'All original data preserved after cross-studio navigation');
  await page.screenshot({path:'test-results/azeroth-device-audit/world-v16-character-'+label+'.png',fullPage:true});
  assert.deepEqual(errors,[],'No JavaScript page errors on '+label);
  console.log('PASS v16 '+label+': War Room, local Command Search, world pins, mission isolation, status updates, Character Nexus bridge.');
 }catch(error){
  await page.screenshot({path:'test-results/azeroth-device-audit/world-v16-failure-'+label+'.png',fullPage:true}).catch(()=>{});
  throw error;
 }finally{await browser.close()}
}
await check('desktop-chromium',chromium,false);
await check('iphone-webkit',webkit,true);
