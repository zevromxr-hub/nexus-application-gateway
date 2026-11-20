/* NEXUS | AZEROTH v22 — actual browser acceptance for the three new tools.
 * Synthetic public-API payloads only; NO real WoW accounts or private videos.
 * Desktop Chromium + iPhone-style WebKit, all existing save bytes preserved.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const ROOT='http://127.0.0.1:4173/azeroth-companion/';
const ORIGINAL=[
 'nexus_world_atlas_goals_v16','nexus_atlas_routes_v181',
 'nexus_adventure_operations_v17','nexus_azeroth_companion_genesis_v1',
 'nexus_azeroth_talent_forge_v1'
];
const OLD={
 nexus_world_atlas_goals_v16:[{id:'manual-v22-goal',zoneId:'hallowfall',title:'Prepare research at Hallowfall',
   category:'Equipment research',status:'active',charId:'hero-v22',notes:'Synthetic manual research',createdAt:'2026-11-20T10:00:00Z'}],
 nexus_atlas_routes_v181:{format:'nexus.atlas-routes/1',selected:'',routes:[{
  id:'synthetic-v22-route',title:'My Manual Route',stops:[{zoneId:'hallowfall',done:false}]}]},
 nexus_adventure_operations_v17:{format:'nexus.adventure-operations/1',
  title:'Synthetic Session',entries:[{id:'manual-v22-goal',minutes:45,note:'Synthetic estimate'}]},
 nexus_azeroth_companion_genesis_v1:{characters:[{id:'hero-v22',name:'testhero',realm:'area-52',className:'Mage',spec:'Frost'}],builds:[],collections:[]},
 nexus_azeroth_talent_forge_v1:[{name:'Test v22 build',rankByNode:{a:2},identity:'synthetic-frost'}]
};
async function check(label,browserType,mobile){
 const browser=await browserType.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},
  hasTouch:mobile,isMobile:mobile,reducedMotion:mobile?'reduce':'no-preference',acceptDownloads:true});
 await context.addInitScript(seed=>{
  const existing=seed;
  for(const [key,value] of Object.entries(existing))
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));
  window.__v22Requested=[];
  const native=window.fetch;
  window.fetch=function(...args){window.__v22Requested.push(String(args[0]));return native.apply(this,args)};
 },OLD);
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 const snapshot=()=>page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),ORIGINAL);
 async function load(path){
  const response=await page.goto(ROOT+path,{waitUntil:'domcontentloaded',timeout:40000});
  assert.ok([200,304].includes(response?.status()),path+' should load or be cached');
 }
 try{
  await load('world-atlas.html?zone=hallowfall');
  await page.locator('#nx22Atlas').waitFor({state:'visible',timeout:15000});
  const old=await snapshot();
  assert.equal(await page.locator('#nx22Zone').inputValue(),'hallowfall');
  assert.equal(await page.locator('#nx22MapId').inputValue(),'2215','Curated Hallowfall UI Map ID');
  assert.equal(await page.locator('#nx22Pins button').count(),0);
  await page.locator('#nx22Title').fill('Test Research Location');
  await page.locator('#nx22Kind').selectOption('Collectible');
  await page.locator('#nx22X').fill('52.45');await page.locator('#nx22Y').fill('80.25');
  await page.locator('#nx22Note').fill('Synthetic test marker; not validated gameplay');
  await page.locator('#nx22AtlasForm button[type="submit"]').click();
  assert.equal(await page.locator('#nx22Pins button').count(),1);
  assert.match(await page.locator('.nx22-record-heading').textContent(),/Test Research Location/);
  const waypoints=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_atlas_waypoints_v22')));
  assert.equal(waypoints.length,1);
  assert.deepEqual([waypoints[0].x,waypoints[0].y,waypoints[0].mapId],[52.45,80.25,2215]);
  const macro=await page.evaluate(()=>window.NexusLivingIntelligenceV22.gameWaypointMacro(JSON.parse(localStorage.getItem('nexus_atlas_waypoints_v22'))[0]));
  assert.match(macro,/UiMapPoint\.CreateFromCoordinates\(m,0\.5245,0\.8025\)/);
  const img=page.locator('#nx22Image');
  await img.setInputFiles({name:'user-map.png',mimeType:'image/png',buffer:Buffer.from([
   137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,
   8,6,0,0,0,31,21,196,137])});
  assert.ok(await page.locator('#nx22Grid').evaluate(el=>el.classList.contains('nx22-user-image')));
  await page.locator('#nx22ClearImage').click();
  assert.equal(await page.locator('#nx22Grid').getAttribute('style')?.includes('blob:'),false);
  assert.deepEqual(await snapshot(),old,'Atlas v22 may not alter old Atlas, character, routes or session data');
  await load('character-intelligence.html');
  await page.locator('#nx22CharacterResearch').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_character_research_snapshots_v22')),null,
   'No public gear should be stored without user consent');
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nexus:v22-character-report',{
   detail:{A:{
    selector:{region:'us',realm:'area-52',name:'testhero'},
    profile:{name:'Testhero',realm:{name:'Area 52'},level:80,
     character_class:{name:{en_US:'Mage'}},active_spec:{name:{en_US:'Frost'}},equipped_item_level:630},
    items:[{slotKey:'HEAD',name:'Synthetic Crown',id:11111,level:631},
      {slotKey:'CHEST',name:'Synthetic Chestpiece',id:22222,level:629}],
    fetchedAt:'2026-11-20T12:00:00.000Z'
   },B:null}
  })));
  assert.match(await page.locator('#nx22GearSummary').textContent(),/REPORTED EQUIPMENT SLOTS/);
  assert.match(await page.locator('#nx22GearSummary').textContent(),/630/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_character_research_snapshots_v22')),null,
   'Preview alone must not persist a verified gear report');
  await page.locator('#nx22SaveResearchActions button').first().click();
  const report=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_character_research_snapshots_v22')));
  assert.equal(report.length,1);assert.equal(report[0].character.className,'Mage');
  assert.equal(report[0].source,'blizzard-public-api-via-nexus');
  assert.equal(report[0].items.length,2);
  assert.ok(!JSON.stringify(report).includes('access_token'));
  assert.deepEqual(await snapshot(),old,'Opt-in gear research cannot mutate old character records');
  await load('player-experience.html');
  await page.locator('#nx22NexusGear').waitFor({state:'visible'});
  assert.match(await page.locator('#nx22NexusGearList').textContent(),/Testhero/);
  await load('living-intelligence.html');
  await page.locator('#nx22Director').waitFor({state:'visible'});
  assert.equal(await page.locator('#nx22DirectorGoals').textContent(),'1');
  assert.equal(await page.locator('#nx22DirectorPins').textContent(),'1');
  assert.equal(await page.locator('#nx22DirectorResearch').textContent(),'1');
  await page.locator('#nx22DirectorCharacter').selectOption('hero-v22');
  await page.locator('#nx22DirectorMode').selectOption('equipment');
  await page.locator('#nx22DirectorBudget').selectOption('90');
  await page.locator('#nx22Generate').click();
  assert.match(await page.locator('#nx22DirectorOutcome').textContent(),/EQUIPMENT SESSION/);
  assert.match(await page.locator('.nx22-agenda-title').first().textContent(),/Prepare research at Hallowfall/);
  assert.match(await page.locator('.nx22-agenda-time').first().textContent(),/45 MIN/);
  assert.match(await page.locator('#nx22DirectorResearchPanel').textContent(),/DATED BLIZZARD PUBLIC EQUIPMENT REPORT/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nexus_living_director_v22')),null,
   'Generating a draft must not save settings without consent');
  assert.ok((await page.locator('.nx22-agenda-actions a').allTextContents()).some(x=>/SAVED COORDINATE/.test(x)));
  await page.locator('#nx22SaveSettings').click();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_living_director_v22')));
  assert.equal(saved.mode,'equipment');assert.equal(saved.budget,90);
  await page.locator('input[data-nx22-check]').first().check();
  saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_living_director_v22')));
  assert.ok(saved.checks['goal-manual-v22-goal']);
  assert.deepEqual(await snapshot(),old,'Director checkmarks must never change original Atlas mission status');
  const exportWait=page.waitForEvent('download');
  await page.locator('#nx22ExportPlan').click();
  const exportFile=await exportWait;
  assert.match(exportFile.suggestedFilename(),/\.json$/);
  assert.deepEqual(await page.evaluate(()=>window.__v22Requested),[],'v22 Director must make zero fetch API requests');
  if(mobile){
   const overflow=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
    main:document.querySelector('.nx22-director-main').getBoundingClientRect().right
   }));
   assert.ok(overflow.scroll<=overflow.viewport+6,'iPhone v22 Director global horizontal overflow '+JSON.stringify(overflow));
  }
  assert.deepEqual(errors.filter(s=>/nx22|LivingIntelligence|living-director|atlas-waypoints|character-research/i.test(s)),[],
   'No uncaught v22 script errors');
  await page.screenshot({path:'test-results/azeroth-device-audit/living-intelligence-v22-'+label+'.png',fullPage:true});
  console.log('PASS v22 '+label+': exact user-entered zone pins and image, opt-in reported Blizzard gear snapshot, Character Nexus integration, budgeted session, export and unchanged older data');
 }catch(error){
  await page.screenshot({path:'test-results/azeroth-device-audit/living-intelligence-v22-error-'+label+'.png',fullPage:true}).catch(()=>{});
  throw error;
 }finally{await browser.close()}
}
await check('desktop-chromium',chromium,false);
await check('iphone-webkit',webkit,true);
