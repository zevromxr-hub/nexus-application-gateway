/* Atlas Intelligence v24 in-app workflow regression.
   Offline stubs are limited to external map artwork and existing Blizzard gateway. */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const gif=Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==','base64');
for(const [label,engine,mobile] of [['iphone-webkit',webkit,true],['desktop-chromium',chromium,false]]){
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://thewowdb.com/assets/wowdex/maps/worldmap/**',r=>r.fulfill({status:200,contentType:'image/gif',body:gif}));
 await page.route('https://nexus-azeroth-api.zevromxr.workers.dev/**',r=>{
  const u=new URL(r.request().url()),item=u.pathname.startsWith('/api/item/');
  r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({
   success:true,data:item?{id:123456,name:'Atlas Test Item',quality:'Rare',level:80}:{
   page:1,pageCount:1,items:[{id:123456,name:'Atlas Test Item',quality:'Rare',level:80}]}
  })});
 });
 try{
  await page.goto('http://127.0.0.1:4173/azeroth-companion/world-atlas.html?zone=ringing-deeps',{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('.nx240-official-button').waitFor({state:'visible',timeout:15000});
  assert.ok(await page.locator('#nx232MapDialog').count()===1,'iPhone native fullscreen modal must survive');
  await page.locator('#nx221Search').fill('The Stonevault');
  await page.locator('.nx230-result').filter({hasText:'The Stonevault'}).first().click();
  await page.locator('.nx240-boss-list').waitFor({state:'visible'});
  assert.match(await page.locator('.nx240-boss-list').textContent(),/E\.D\.N\.A/);
  await page.locator('.nx240-boss-list button').filter({hasText:'E.D.N.A.'}).first().click();
  assert.match(await page.locator('#nx230Detail').textContent(),/Instance: The Stonevault/);
  await page.locator('#nx221Search').fill('Thunderfury');
  await page.locator('.nx230-result').filter({hasText:'Thunderfury'}).first().click();
  await page.locator('.nx240-steps li').first().waitFor();
  assert.match(await page.locator('#nx230Detail').textContent(),/Bindings of the Windseeker/i);
  assert.equal(await page.locator('.nx240-card-sources').count(),1);
  assert.equal(await page.locator('.nx240-card-sources').getAttribute('open'),null,'External sources should start collapsed');
  await page.locator('.nx240-actions button').filter({hasText:'SAVE TO ITEM ATLAS'}).click();
  await page.locator('.nx240-actions button').filter({hasText:'ADD FARM GOAL'}).click();
  assert.equal(await page.locator('.nx240-actions button').filter({hasText:'+ LOG ATTEMPT'}).count(),1);
  await page.locator('.nx240-actions button').filter({hasText:'+ LOG ATTEMPT'}).click();
  const save=await page.evaluate(()=>({
   items:JSON.parse(localStorage.getItem('nexus_azeroth_item_atlas_v1')||'[]'),
   farm:JSON.parse(localStorage.getItem('nexus_azeroth_loot_hunter_v1')||'[]')
  }));
  assert.equal(save.items[0].id,19019);
  assert.equal(save.items[0].status,'wishlist');
  assert.equal(save.farm[0].id,19019);
  assert.equal(save.farm[0].attempts,1);
  await page.locator('#nx221Search').fill('Atlas Test');
  await page.locator('.nx240-official-button').click();
  await page.locator('.nx240-official-row button').first().waitFor({state:'visible'});
  await page.locator('.nx240-official-row button').first().click();
  await page.locator('#nx230Detail').waitFor({state:'visible'});
  assert.match(await page.locator('#nx230Detail').textContent(),/Official Blizzard item #123456/);
  assert.match(await page.locator('#nx230Detail').textContent(),/Acquisition source is not verified/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nexus_atlas_waypoints_v22')||'[]'));
  assert.deepEqual(saved,[], 'New item research must not mutate saved map waypoints');
  assert.deepEqual(errors,[],label+' browser errors');
  console.log('PASS v24 '+label+' item lookup, acquisition steps, boss index, same-device trackers and source disclosure');
 }finally{await ctx.close();await browser.close()}
}
