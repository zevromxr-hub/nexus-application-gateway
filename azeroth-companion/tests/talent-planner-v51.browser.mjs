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
   {tooltip:{talent:{id:71001,name:'Fixture Class Rank 1'},spell_tooltip:{spell:{id:81001,name:'Fixture Spell'},description:'Synthetic test first rank'}}},
   {tooltip:{talent:{id:71002,name:'Fixture Class Rank 2'},spell_tooltip:{spell:{id:81002,name:'Fixture Spell 2'},description:'Synthetic test second rank'}}}
  ]},
  {id:1002,name:'Fixture Choice Node',display_row:0,display_col:2,locked_by:[{id:1001}],ranks:[
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
   const data=url.includes('/api/talent-index/us')?INDEX:url.includes('/api/talent-tree/us/111/222')?TREE:url.includes('/api/item/us/19019')?{success:true,data:{id:19019,name:'Synthetic Sword',level:80,quality:{name:'Legendary'},preview_item:{stats:[{type:{name:'Strength'},value:25}]}}}:url.includes('/api/item/us/19020')?{success:true,data:{id:19020,name:'Synthetic Staff',level:83,quality:{name:'Epic'},preview_item:{stats:[{type:{name:'Strength'},value:20}]}}}:url.includes('/api/spell-media/us/81001')?{success:true,data:{id:81001,assets:[{key:'icon',url:'https://render.worldofwarcraft.com/fixture-icon.jpg'}]}}:null;
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
  await page.locator('.tf-canvas-stage').waitFor({timeout:6000});
  assert.ok(await page.locator('#tfCanvasTools').isVisible(),'Talent Atlas controls must be available in tree layout');
  const originalZoom=await page.locator('#tfCanvasZoom').textContent();
  await page.locator('#tfCanvasTools [data-canvas="in"]').click();
  const enlargedZoom=await page.locator('#tfCanvasZoom').textContent();
  assert.ok(parseInt(enlargedZoom)>parseInt(originalZoom),'Zoom in should scale the talent canvas');
  await page.locator('#tfCanvasTools [data-canvas="reset"]').click();
  assert.equal((await page.locator('#tfCanvasZoom').textContent()).trim(),'100%','Reset should restore canvas scale');
  assert.ok(await page.locator('#tfCanvasMap').isVisible(),'Tree overview map should be visible');
  if(!phone){
    const n=await page.locator('#tfTree [data-tf-node="1001"]').boundingBox();
    const before=await page.locator('#tfTree').evaluate(el=>el.scrollLeft);
    await page.mouse.move(n.x+n.width/2,n.y+22);
    await page.mouse.down();
    await page.mouse.move(n.x+n.width/2-120,n.y+10,{steps:6});
    await page.mouse.up();
    const after=await page.locator('#tfTree').evaluate(el=>el.scrollLeft);
    assert.ok(after>before,'Desktop drag gesture must pan the talent tree');
  }
  assert.ok(await page.locator('#tfBuildIntel').isVisible(),'Build Intelligence should mount on desktop and mobile');
  await page.locator('#tfBiNode').selectOption('1002');
  const links=await page.locator('#tfBiConnections').textContent();
  assert.ok(links.includes('Fixture Class Node')&&links.includes('Reported downstream links'),'Source-linked node explorer must show real fixture references');
  assert.ok(await page.locator('#tfBiInspect').isEnabled(),'New inspector should open existing rank detail controls');
  await page.locator('#tfBiInspect').click();
  assert.ok((await page.locator('#tfSourceTalent').textContent()).includes('Node ID: #1002'),'Source spotlight must delegate to existing official inspector');
  assert.ok(await page.locator('#tfCompareLab').isVisible(),'Source comparison studio must be available');
  await page.locator('#tfLabTalentA').selectOption('1001');
  await page.locator('#tfLabTalentB').selectOption('1002');
  const talentCompare=await page.locator('#tfLabTalentResults').textContent();
  assert.ok(talentCompare.includes('Synthetic test first rank')&&talentCompare.includes('Node #1001'),'Talent comparison must use returned source rank details');
  await page.locator('#tfLabItemA').fill('19019');
  await page.locator('#tfLabItemB').fill('19020');
  await page.locator('#tfLabGearForm button').click();
  await page.locator('#tfLabGearResults').getByText('Synthetic Staff').waitFor({timeout:7000});
  const gearCompare=await page.locator('#tfLabGearResults').textContent();
  assert.ok(gearCompare.includes('Numeric stat A − B: +5'),'Gear comparison must only subtract supplied matching numeric stats');
  assert.ok(await page.locator('#tfPlanner').isVisible(),'Integrated planner must appear');
  assert.ok(await page.locator('#tfSourceIntel').isVisible(),'Talent source intelligence must appear');
  await page.locator('[data-tf-inspect="1001"]').click();
  const first=await page.locator('#tfSourceTalent').textContent();
  assert.ok(first.includes('Node ID: #1001')&&first.includes('Talent ID: #71001')&&first.includes('Spell ID: #81001'),'Inspector should show only source-supplied IDs');
  assert.ok(first.includes('Synthetic test second rank'),'Rank inspector should include returned descriptions');
  await page.locator('#tfSourceItemId').fill('19019');
  await page.locator('#tfSourceItemForm button').click();
  await page.locator('#tfSourceItem').getByText('Synthetic Sword').waitFor({timeout:7000});
  assert.ok((await page.locator('#tfSourceItem').textContent()).includes('Strength: 25'),'Gear inspector should display Blizzard-returned fixture stats');

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
  await page.locator('#tfBiSaveA').selectOption({index:1});
  await page.locator('#tfBiSaveB').selectOption({index:2});
  assert.ok((await page.locator('#tfBiDiff').textContent()).includes('changed nodes'),'Saved-to-saved comparison must work without writing to local drafts');

  assert.ok(copied[0].name.endsWith('Copy'));
  await page.locator('[data-tf-inc="1001"]').click();
  await page.locator('#tfCompare').selectOption({index:1});
  assert.ok((await page.locator('#tfCompareSummary').textContent()).includes('1→2'),'Saved comparison should name source allocation deltas');
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
  await page.locator('#tfStatus').filter({hasText:'Import failed'}).waitFor({state:'visible',timeout:7000});
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
