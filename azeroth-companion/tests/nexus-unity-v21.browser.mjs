/* NEXUS | AZEROTH v21 — desktop + simulated iPhone Unity acceptance.
 * Reads a synthetic user profile; no real Blizzard account, videos, passwords,
 * image uploads, external connections, or fake verified in-game records.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const URL='http://127.0.0.1:4173/azeroth-companion/';
const keys=['nexus_world_atlas_goals_v16','nexus_atlas_routes_v181','nexus_adventure_operations_v17',
 'nexus_azeroth_companion_genesis_v1','nexus_azeroth_talent_forge_v1'];
async function audit(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,
  isMobile:mobile,reducedMotion:mobile?'reduce':'no-preference'});
 await context.addInitScript(()=>{
  const data={
   nexus_world_atlas_goals_v16:[{id:'manual-v21-1',title:'Research Stormwind Equipment',zoneId:'stormwind-city',status:'active',category:'Equipment research'}],
   nexus_atlas_routes_v181:{format:'nexus.atlas-routes/1',selected:'route-v21-1',routes:[
    {id:'route-v21-1',title:'Personal Capital Tour',stops:[{zoneId:'stormwind-city',done:false},{zoneId:'hallowfall',done:false}]}]},
   nexus_adventure_operations_v17:{format:'nexus.adventure-operations/1',title:'Personal Journey',entries:[{id:'manual-v21-1',minutes:30,note:''}]},
   nexus_azeroth_companion_genesis_v1:{characters:[{id:'test-hero',name:'Test Adventurer',className:'Mage'}],builds:[],collections:[]},
   nexus_azeroth_talent_forge_v1:[{name:'Test Frost Design',rankByNode:{a:1}}]
  };
  for(const [key,value] of Object.entries(data))if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));
 });
 const page=await context.newPage(),issues=[],unexpected=[];
 page.on('pageerror',e=>issues.push(String(e)));
 page.on('request',r=>{
  const url=r.url();
  if(url.startsWith('blob:')||url.startsWith('data:')||url.startsWith('http://127.0.0.1:4173/'))return;
  // v22.1: ONLY explicitly sourced WoW zone map images may originate off-site.
  // All other unexpected remote scripts, trackers, API calls and media remain failures.
  if(r.resourceType()==='image'&&/^https:\/\/thewowdb\.com\/assets\/wowdex\/maps\/worldmap\/(?:2437|2413|2405|2215|2214|2248|2255|2112|2022|2024)\.jpg$/.test(url))return;
  unexpected.push(url);
 });
 const snapshot=()=>page.evaluate(k=>Object.fromEntries(k.map(x=>[x,localStorage.getItem(x)])),keys);
 async function visit(path){
  const res=await page.goto(URL+path,{waitUntil:'domcontentloaded',timeout:40000});
  assert.ok([200,304].includes(res?.status()),path+' should load or safely reuse a cached page (HTTP 304)');
  await page.locator('#nx21Launch').waitFor({timeout:15000});
  assert.equal(await page.locator('#nx21Dialog').count(),1);
 }
 async function open(){
  await page.locator('#nx21Launch').click();
  await page.locator('#nx21Dialog').waitFor({state:'visible'});
  assert.ok(await page.locator('#nx21Search').isVisible());
  const rect=await page.locator('#nx21Dialog').boundingBox();
  assert.ok(rect&&rect.x>=-2&&rect.width<=(mobile?392:1442),'Dialog must be contained in viewport');
 }
 try{
  await visit('command-center.html');
  await page.locator('#nx21Bridge').waitFor();
  assert.equal(await page.locator('#nx21BridgeCards .nx21-showcase').count(),4);
  assert.match(await page.locator('#nx21BridgeStatus').textContent(),/1 ACTIVE GOALS/);
  const originals=await snapshot();
  await open();
  assert.match(await page.locator('#nx21Personal').textContent(),/1/);
  await page.locator('#nx21Search').fill('Stormwind');
  await page.locator('.nx21-result-manual,.nx21-manual-result').first().waitFor();
  assert.ok((await page.locator('.nx21-manual-result a').first().getAttribute('href')).includes('zone=stormwind-city'));
  await page.locator('#nx21Search').fill('World Atlas');
  await page.locator('button[data-nx21-pin="atlas"]').click();
  assert.equal(await page.locator('button[data-nx21-pin="atlas"]').getAttribute('aria-pressed'),'true');
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_azeroth_unity_v21')));
  assert.ok(state.pinned.includes('atlas'));assert.ok(state.recent.includes('command'));
  await page.locator('button[data-nx21-group="Pinned"]').click();
  assert.equal(await page.locator('.nx21-result[data-nx21-id="atlas"]').count(),1);
  await page.locator('[data-nx21-tab="journeys"]').click();
  assert.equal(await page.locator('#nx21Journeys .nx21-journey').count(),4);
  assert.ok((await page.locator('#nx21Journeys a').count())>=12);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#nx21Dialog').isVisible(),false);
  assert.deepEqual(await snapshot(),originals,'Unity may not change any older goal, route, session, talent or character record');
  await visit('world-atlas.html?zone=stormwind-city');
  await page.keyboard.press('Control+k');
  await page.locator('#nx21Dialog').waitFor({state:'visible'});
  const cont=page.locator('#nx21Personal .nx21-continue');
  assert.match(await cont.textContent(),/Research Stormwind Equipment/);
  assert.match(await cont.getAttribute('href'),/zone=stormwind-city/);
  await page.locator('#nx21Close').click();
  await visit('?enter=1');
  assert.equal(await page.locator('#nx21HomeHub').count(),1);
  assert.match(await page.locator('#nx21HomeStatus').textContent(),/1 ACTIVE GOALS/);
  const mainCss=await page.locator('link[href*="studio-art-direction-v9.2.css"]').count();
  assert.equal(mainCss,1,'Main companion must reuse existing CSS, not duplicate Unity CSS network file');
  const externalUI=await page.locator('script[src*="nexus-unity-v21"]').count();
  assert.equal(externalUI,0,'Main companion must bundle v21 Unity JS into existing performance asset');
  await visit('player-experience.html');
  await open();
  assert.equal(await page.locator('#nx21Dialog').isVisible(),true);
  await page.locator('#nx21Close').click();
  await visit('private-video-vault.html');
  await page.locator('#nv20Gate').waitFor();
  await open();
  assert.match(await page.locator('#nx21Personal').textContent(),/secure Vault remains isolated/);
  assert.equal(await page.locator('.nx21-result[data-nx21-id="vault"]').count(),1);
  await page.locator('#nx21Search').fill('My Secret Recording');
  assert.equal(await page.locator('.nx21-manual-result').count(),0,'Vault search must never inspect video filenames');
  await page.locator('#nx21Close').click();
  await visit('save-protection.html');
  await open();await page.locator('#nx21Close').click();
  assert.deepEqual(await snapshot(),originals,'Browser-local plans remain byte-for-byte unchanged after cross-studio navigation');
  assert.deepEqual(unexpected,[],'No unintended cross-origin resource requests');
  assert.deepEqual(issues.filter(x=>/nexus-unity|NexusUnity|nx21/i.test(x)),[],'No v21 JavaScript errors');
  if(mobile){
   await visit('command-center.html');
   await open();
   const r=await page.locator('#nx21Dialog').boundingBox();
   assert.ok(r&&r.width<=392&&r.x>=-1,'iPhone dialog must not overflow viewport');
   await page.locator('#nx21Close').click();
  }
  await page.screenshot({path:'test-results/azeroth-device-audit/sovereign-unity-v21-'+label+'.png',fullPage:true});
  console.log('PASS v21 '+label+': 21-page Unity launcher, mission search, pinned studios, four guided journeys, deep links, main bundle parity, private Vault isolation and local records preserved.');
 }catch(error){
  await page.screenshot({path:'test-results/azeroth-device-audit/sovereign-unity-v21-error-'+label+'.png',fullPage:true}).catch(()=>{});
  throw error;
 }finally{await browser.close()}
}
await audit('desktop-chromium',chromium,false);
await audit('iphone-webkit',webkit,true);
