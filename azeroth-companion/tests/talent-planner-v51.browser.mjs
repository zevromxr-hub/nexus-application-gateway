/* NEXUS | AZEROTH v5.1 — Talent Forge Planner browser integration
 * Uses an explicit SYNTHETIC talent API fixture, not real player/Blizzard data.
 * Authenticated APIs are unavailable. No actual WoW-valid build is asserted.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const URL='http://127.0.0.1:4173/azeroth-companion/';
const INDEX={success:true,data:{spec_talent_trees:[
 {name:'Fixture Specialization',key:{href:'https://us.api.blizzard.com/data/wow/talent-tree/111/playable-specialization/222'}}
]}};
const TREE={success:true,data:{
 id:111,playable_specialization:{id:222,name:'Fixture Specialization'},
 class_talent_nodes:[
  {id:1001,name:'Fixture Class Node',display_row:0,display_col:0,ranks:[
   {tooltip:{talent:{name:'Fixture Class Rank 1'},spell_tooltip:{description:'Synthetic test first rank'}}},
   {tooltip:{talent:{name:'Fixture Class Rank 2'},spell_tooltip:{description:'Synthetic test second rank'}}}
  ]},
  {id:1002,name:'Fixture Choice Node',display_row:0,display_col:2,ranks:[
   {choice_of_tooltips:[
    {talent:{name:'Fixture Choice A'},spell_tooltip:{description:'First synthetic option'}},
    {talent:{name:'Fixture Choice B'},spell_tooltip:{description:'Second synthetic option'}}
   ]}
  ]}
 ],
 spec_talent_nodes:[{id:2001,name:'Fixture Specialization Talent',display_row:0,display_col:1,ranks:[
  {tooltip:{talent:{name:'Fixture Spec Talent'},spell_tooltip:{description:'Synthetic spec talent'}}}
 ]}],
 hero_talent_trees:[{name:'Fixture Hero',hero_talent_nodes:[
  {id:3001,name:'Fixture Hero Talent',display_row:1,display_col:1,ranks:[{tooltip:{talent:{name:'Fixture Hero Talent'}}}]}
 ]}]
}};
async function run(engine,phone){
 const browser=await engine.launch({headless:true});
 let context;
 try{
  context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:900},
   isMobile:phone,hasTouch:phone,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://nexus-azeroth-api.zevromxr.workers.dev/**',route=>{
   const url=route.request().url();
   const data=url.includes('/api/talent-index/us')?INDEX:url.includes('/api/talent-tree/us/111/222')?TREE:null;
   return route.fulfill({status:data?200:503,contentType:'application/json',
    headers:{'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'},
    body:JSON.stringify(data||{success:false,message:'API disabled during website test'})});
  });
  async function navigate(){
   if(phone)await page.locator('.ac-mobile-bar [data-ac-more]').click();
   await page.locator('.sidebar button[data-view="talents"]').click();
   await page.locator('[data-section="talents"].active').waitFor({timeout:6000});
  }
  async function load(){
   await page.locator('#tfSpec option[value="0"]').waitFor({state:'attached',timeout:12000});
   await page.locator('#tfSpec').selectOption('0');
   await page.locator('#tfLoad').click();
   await page.locator('#tfTree [data-tf-inc="1001"]').waitFor({timeout:12000});
  }
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('body.nx-v5-ready').waitFor({timeout:25000});
  await navigate();await load();
  assert.ok(await page.locator('#tfPlanner').isVisible(),'Integrated planner must appear');
  assert.ok((await page.locator('#tfPlanAdvisories').textContent()).includes('legal loadout checker'),'Planner should disclaim game validation');
  await page.locator('[data-tf-inc="1001"]').click();
  await page.locator('[data-tf-inc="1002"]').click();
  await page.locator('#tfChoice1002').selectOption('1');
  await page.locator('#tfPlanActivity').selectOption('raid');
  await page.locator('#tfPlanRole').selectOption('damage');
  await page.locator('#tfPlanStyle').selectOption('burst');
  await page.locator('#tfPlanGoalClass').fill('1');
  await page.locator('#tfPlanGoalClass').press('Tab');
  await page.locator('#tfPlanNotes').fill('Synthetic raid encounter: test a burst opener.');
  const review=await page.locator('#tfPlanAdvisories').textContent();
  assert.ok(review.includes('personal target'),'Exceeding a manual target should produce an advisory');
  await page.locator('#tfSave').click();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_azeroth_talent_forge_v1')));
  assert.equal(stored[0].format,'nexus-azeroth-talent-draft-v1','Legacy save format must be preserved');
  assert.equal(stored[0].planner.activity,'raid');
  assert.equal(stored[0].planner.role,'damage');
  assert.equal(stored[0].planner.notes,'Synthetic raid encounter: test a burst opener.');
  assert.equal(stored[0].choiceByNode['1002'],1);
  await page.locator('#tfPlanDuplicate').click();
  const copied=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_azeroth_talent_forge_v1')));
  assert.equal(copied.length,2,'Duplicating must create a separate saved draft');
  assert.ok(copied[0].name.endsWith('Copy'));
  await page.locator('[data-tf-inc="1001"]').click();
  await page.locator('#tfPlanNotes').fill('Unsaved recovery note for the current build.');
  await page.waitForTimeout(900);
  const auto=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_azeroth_talent_planner_autorecover_v51')));
  assert.equal(auto['us/111/222'].rankByNode['1001'],2,'Working rank must be recovered');
  assert.ok(auto['us/111/222'].planner.notes.includes('Unsaved recovery note'),'Working notes must be recovered');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('body.nx-v5-ready').waitFor({timeout:25000});
  await navigate();await load();
  assert.ok(await page.locator('#tfPlanRecover').isVisible(),'Recoverable unsaved draft should be offered, never silently overwritten');
  await page.locator('#tfPlanRestore').click();
  assert.ok(await page.locator('#tfPlanRecover').isHidden());
  assert.equal(await page.locator('#tfPlanNotes').inputValue(),'Unsaved recovery note for the current build.');
  const currentRank=await page.locator('[data-tf-node="1001"] .tf-node-controls span').textContent();
  assert.ok(currentRank.includes('2 / 2'),'Restored source rank must match');
  const bad={format:'nexus-azeroth-talent-draft-v1',identity:'us/../auth',name:'bad',rankByNode:{1001:2}};
  await page.locator('#tfImport').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
  await page.locator('#tfStatus').getByText('Import failed',{exact:false}).waitFor({state:'visible',timeout:7000});
  assert.ok((await page.locator('#tfStatus').textContent()).includes('Import failed'),'Unsafe imports must be rejected');
  const finish=await page.evaluate(()=>({w:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(finish.w<=finish.client+2,'Planner should not create horizontal overflow '+JSON.stringify(finish));
  assert.deepEqual(errors,[],'No browser JS exceptions');
  console.log('PASS Talent Forge v5.1 '+(phone?'WebKit phone':'Chromium desktop')+' — editing, metadata, saved clones, local recovery and invalid import rejection');
 }finally{await context?.close().catch(()=>{});await browser.close().catch(()=>{})}
}
await run(chromium,false);
await run(webkit,true);
console.log('Talent Forge v5.1 synthetic-fixture browser integration passed.');
