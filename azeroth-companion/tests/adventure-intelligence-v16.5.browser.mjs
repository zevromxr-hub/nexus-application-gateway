/* NEXUS | AZEROTH v16.5 — advisory connected adventure browser checks.
 * Desktop Chromium and iPhone-style WebKit. No real player account or network data.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
const base='http://127.0.0.1:4173/azeroth-companion/';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
async function check(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({
  viewport:mobile?{width:390,height:844}:{width:1440,height:900},
  isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce',acceptDownloads:true
 });
 await context.addInitScript(()=>{
  const hero={id:'nx165-hero',name:'Arcanist',className:'Mage',spec:'Frost',region:'us',realm:'area-52'};
  const draft={name:'My Frost Research',identity:'us/123/456',region:'us',specName:'Frost',
   savedAt:'2026-11-17',rankByNode:{'100':1},choiceByNode:{}};
  const goal={id:'manual-expedition-001',zoneId:'stormwind-city',title:'Prepare for Stormwind research',
   category:'Equipment research',status:'active',charId:'nx165-hero',
   buildKey:'us/123/456::2026-11-17::My Frost Research',itemId:19019,notes:'Manual test',
   createdAt:'2026-11-17T00:00:00Z'};
  localStorage.setItem('nexus_azeroth_companion_genesis_v1',JSON.stringify({characters:[hero],tasks:[],collections:[],builds:[]}));
  localStorage.setItem('nexus_player_focus_v11','nx165-hero');
  localStorage.setItem('nexus_azeroth_talent_forge_v1',JSON.stringify([draft]));
  localStorage.setItem('nexus_azeroth_item_atlas_v1',JSON.stringify([{id:19019,region:'us',status:'wishlist',name:'Manual Item'}]));
  localStorage.setItem('nexus_world_atlas_goals_v16',JSON.stringify([goal]));
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base+'command-center.html',{waitUntil:'domcontentloaded'});
  await page.locator('#nx165WarPulse').waitFor();
  await page.waitForFunction(()=>document.getElementById('nx165PulseTitle')?.textContent?.includes('Stormwind'),null,{timeout:12000});
  assert.match(await page.locator('#nx165PulseTitle').textContent(),/Stormwind/);
  assert.ok((await page.locator('#nx165PulseOpen').getAttribute('href')).includes('mission=manual-expedition-001'));
  await page.goto(base+'world-atlas.html?zone=stormwind-city',{waitUntil:'domcontentloaded'});
  await page.locator('#nx165AtlasAscension').waitFor();
  await page.waitForFunction(()=>document.getElementById('nx165ActiveMissions')?.textContent==='1',null,{timeout:9000});
  assert.equal(await page.locator('.nx165-region-bar').count(),8);
  assert.match(await page.locator('#nx165NextGoalText').textContent(),/Stormwind/);
  const pin=page.locator('#nx16Destinations button[data-nx165-bookmark="stormwind-city"]');
  await pin.waitFor();await pin.click();
  assert.equal((await page.locator('#nx165BookmarkCount').textContent()).trim(),'1');
  const bookmarks=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_adventure_intelligence_v165')).bookmarks);
  assert.ok(bookmarks.includes('stormwind-city'));
  const draftBefore=await page.evaluate(()=>localStorage.getItem('nexus_azeroth_talent_forge_v1'));
  const goalBefore=await page.evaluate(()=>localStorage.getItem('nexus_world_atlas_goals_v16'));
  const prepare=page.locator('#nx16GoalRows a.nx165-open-expedition').first();
  await prepare.waitFor();
  await prepare.click();
  await page.locator('#nx165Console').waitFor();
  await page.waitForFunction(()=>document.getElementById('nx165SelectedName')?.textContent?.includes('Stormwind'),null,{timeout:9000});
  assert.match(await page.locator('#nx165SelectedName').textContent(),/Stormwind/);
  assert.ok(await page.locator('#nx165StepsList input[type="checkbox"]').count()>=4);
  await page.locator('#nx165StepsList input[type="checkbox"]').first().check();
  assert.notEqual((await page.locator('#nx165ProgressNumber').textContent()).trim(),'0%');
  await page.locator('#nx165PrioritySelect').selectOption('high');
  await page.locator('#nx165Pin').click();
  await page.locator('#nx165Notes').fill('Verify current source and review local equipment goals');
  await page.locator('#nx165SaveNotes').click();
  await page.locator('#nx165StepText').fill('Check current dungeon availability manually');
  await page.locator('#nx165AddStep button[type="submit"]').click();
  assert.match(await page.locator('#nx165StepsList').textContent(),/dungeon availability/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_azeroth_talent_forge_v1')),draftBefore);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_world_atlas_goals_v16')),goalBefore);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_adventure_intelligence_v165')));
  assert.equal(stored.records['manual-expedition-001'].priority,'high');
  assert.equal(stored.records['manual-expedition-001'].pinned,true);
  assert.equal(stored.records['manual-expedition-001'].steps.filter(s=>s.done).length,1);
  assert.ok(stored.records['manual-expedition-001'].notes.includes('Verify current source'));
  await page.screenshot({path:'test-results/azeroth-device-audit/expedition-v165-'+label+'.png',fullPage:true});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#nx165Console').waitFor();
  assert.equal((await page.locator('#nx165PrioritySelect').inputValue()),'high');
  assert.ok((await page.locator('#nx165Notes').inputValue()).includes('Verify current source'));
  assert.ok(await page.locator('#nx165StepsList input[type="checkbox"]').first().isChecked());
  await page.goto(base+'player-experience.html',{waitUntil:'domcontentloaded'});
  await page.locator('#nx16CharacterWorld').waitFor();
  assert.match(await page.locator('#nx16WorldCharacterGoals').textContent(),/Stormwind/);
  assert.equal(await page.locator('#px11Station').count(),1,'Original player workspaces preserved');
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_azeroth_talent_forge_v1')),draftBefore,'No original draft changes allowed');
  assert.deepEqual(errors,[],'No page errors in '+label);
  console.log('PASS v16.5 '+label+' connected War Room, World Atlas bookmarks, Expedition Console, persisted prep state, source links and preserved drafts');
 }catch(error){
  await page.screenshot({path:'test-results/azeroth-device-audit/expedition-v165-error-'+label+'.png',fullPage:true}).catch(()=>{});
  throw error;
 }finally{await browser.close()}
}
await check('desktop-chromium',chromium,false);
await check('iphone-webkit',webkit,true);
