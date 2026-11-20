/* NEXUS | AZEROTH v22.1 — real maps first in desktop Chromium/iPhone WebKit.
 * Stub only external image delivery, never claim a live network success.
 * Verify helpful map opening, sourced location selection, zoom, panning and
 * an actionable source fallback when a remote map is unavailable.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const base='http://127.0.0.1:4173/azeroth-companion/world-atlas.html';
const gif=Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==','base64');
const old={
 nexus_world_atlas_goals_v16:[{
  id:'manual-v221-existing',zoneId:'hallowfall',title:'Keep original map goal',
  category:'Explore',status:'active',createdAt:'2026-11-20T00:00:00Z'}],
 nexus_atlas_routes_v181:{format:'nexus.atlas-routes/1',routes:[]},
 nexus_azeroth_companion_genesis_v1:{characters:[]},
 nexus_atlas_waypoints_v22:[{
  id:'manual-v221-pin',zoneId:'hallowfall',mapId:2215,x:49.12,y:55.34,
  title:'My saved manual waypoint',kind:'Landmark',note:'This is NOT source-verified',
  createdAt:'2026-11-20T00:00:00Z'
 }]
};
async function run(label,engine,mobile){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({
  viewport:mobile?{width:390,height:844}:{width:1440,height:900},
  hasTouch:mobile,isMobile:mobile,reducedMotion:mobile?'reduce':'no-preference'
 });
 const page=await context.newPage(),errors=[];
 await context.addInitScript(entries=>{
  for(const [key,value] of Object.entries(entries))localStorage.setItem(key,JSON.stringify(value));
 },old);
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://thewowdb.com/assets/wowdex/maps/worldmap/**',route=>{
  if(route.request().url().endsWith('/2255.jpg'))
   return route.abort('failed');
  return route.fulfill({status:200,contentType:'image/gif',body:gif});
 });
 const before=()=>page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(old));
 try{
  const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:40000});
  assert.ok([200,304].includes(response?.status()));
  await page.locator('#nx221RealAtlas').waitFor({state:'visible',timeout:20000});
  await page.locator('#nx221MapImage').waitFor({state:'visible',timeout:12000});
  const savedBefore=await before();
  assert.equal(await page.locator('#nx221ZoneTitle').textContent(),'HALLOWFALL');
  assert.equal(await page.locator('#nx221MapImage').getAttribute('src'),
   'https://thewowdb.com/assets/wowdex/maps/worldmap/2215.jpg');
  assert.match(await page.locator('#nx221Count').textContent(),/11 LOCATIONS/);
  assert.equal(await page.locator('#nx221PinLayer button').count(),11);
  assert.equal(await page.locator('#nx221RealAtlas').evaluate(el=>el.compareDocumentPosition(document.querySelector('.nx16-atlas-hero')) & Node.DOCUMENT_POSITION_FOLLOWING),4);
  assert.equal(await page.locator('button.nx221-map-pin[data-kind="Personal"]').count(),1,
   'Already saved manual pins must overlay actual images and remain separate');
  await page.locator('#nx221Search').fill('Dawnbreaker');
  assert.equal(await page.locator('.nx221-place').count(),1);
  await page.locator('.nx221-place').click();
  assert.match(await page.locator('#nx221SelectedInfo').textContent(),/54\.9/);
  assert.match(await page.locator('#nx221SelectedInfo').textContent(),/63\.1/);
  assert.equal(await page.locator('#nx221Copy').isEnabled(),true);
  assert.ok((await page.locator('#nx221OpenResearch').getAttribute('href')).includes('thewowdb.com/zone/hallowfall'));
  await page.locator('#nx221Search').fill('');
  await page.locator('.nx221-zone-tab').filter({hasText:'The Ringing Deeps'}).click();
  assert.equal(await page.locator('#nx221ZoneTitle').textContent(),'THE RINGING DEEPS');
  assert.equal(await page.locator('#nx221PinLayer button').count(),10);
  assert.match(await page.locator('#nx221ZoneInfo').textContent(),/2214/);
  assert.equal(await page.locator('#nx221MapImage').getAttribute('src'),
   'https://thewowdb.com/assets/wowdex/maps/worldmap/2214.jpg');
  await page.locator('#nx221ZoomIn').click();
  assert.match(await page.locator('#nx221MapSurface').getAttribute('style'),/scale\(1\.25\)/);
  await page.locator('#nx221Reset').click();
  assert.match(await page.locator('#nx221MapSurface').getAttribute('style'),/scale\(1\)/);
  await page.locator('.nx221-zone-tab').filter({hasText:'Azj-Kahet'}).click();
  await page.locator('#nx221MapFailure').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#nx221MapSurface').isHidden(),true);
  assert.match(await page.locator('#nx221MapFallback').getAttribute('href'),/warcraft\.wiki\.gg\/wiki\/Azj-Kahet/);
  assert.match(await page.locator('#nx221MapFailure').textContent(),/Map image unavailable from its source/);
  await page.locator('.nx221-zone-tab').filter({hasText:'Hallowfall'}).click();
  assert.equal(await page.locator('#nx221MapFailure').isHidden(),true);
  assert.deepEqual(await before(),savedBefore,
   'Real map-first feature may not mutate stored user pins, goals, routes or characters');
  const unexpected=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('221')||k.includes('real_map')));
  assert.deepEqual(unexpected,[],'Real map-first feature must not save unnecessary new browser records');
  if(mobile){
   const sizes=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
   assert.ok(sizes.scrollWidth<=sizes.width+6,'iPhone page should not overflow horizontally '+JSON.stringify(sizes));
  }
  assert.deepEqual(errors.filter(x=>/nx221|atlas-real-map-v22\.1/i.test(x)),[],
   'Real map viewer should not produce uncaught script errors');
  await page.screenshot({path:'test-results/azeroth-device-audit/atlas-real-map-v221-'+label+'.png',fullPage:true});
  console.log('PASS v22.1 '+label+': real image renders first, mapped source POIs, saved manual pins, search, zoom, external image failure fallback and unchanged previous user data.');
 }catch(error){
  await page.screenshot({path:'test-results/azeroth-device-audit/atlas-real-map-v221-error-'+label+'.png',fullPage:true}).catch(()=>{});
  throw error;
 }finally{await browser.close()}
}
await run('desktop-chromium',chromium,false);
await run('iphone-webkit',webkit,true);
