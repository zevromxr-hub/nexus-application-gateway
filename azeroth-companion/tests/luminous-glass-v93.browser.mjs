/* NEXUS v9.3 luminous-glass visual safety regression.
 * Uses only localhost static previews and asserts UI/readability geometry.
 * Does not contact Blizzard accounts or modify player records.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const base='http://127.0.0.1:4173/azeroth-companion/';
const external=[
 ['character-intelligence.html','.panel'],
 ['progression-intelligence.html','.panel'],
 ['sovereign-ascension.html','.panel'],
 ['addon-nexus.html','.section'],
 ['azeroth-assistant.html','.panel']
];
const sample=async element=>element.evaluate(el=>{
 const c=getComputedStyle(el),r=el.getBoundingClientRect();
 return {background:c.backgroundImage,border:c.borderColor,borderWidth:c.borderTopWidth,
 shadow:c.boxShadow,width:r.width,height:r.height};
});
async function run(name,engine,mobile){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({
  viewport:mobile?{width:390,height:844}:{width:1380,height:900},
  isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'
 });
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(base+'?enter=1',{waitUntil:'domcontentloaded'});
  await page.locator('main.main').waitFor();
  await page.locator('.sidebar button[data-view="loot"]').waitFor({timeout:16000});
  await page.locator('.sidebar button[data-view="loot"]').evaluate(el=>el.click());
  await page.locator('#lootHunter .section.active').waitFor({timeout:12000});
  const panel=await sample(page.locator('#lootHunter .panel').first());
  assert.match(panel.background,/radial-gradient/,'Loot working panel lacks luminous layer');
  assert.match(panel.shadow,/inset/,'Loot panel lacks embossed glass edge');
  assert.equal(panel.borderWidth,'1px');
  const metrics=await sample(page.locator('#lootHunter .loot-metrics > div').first());
  assert.match(metrics.background,/radial-gradient/,'Loot metric is still a flat fill');
  assert.match(metrics.shadow,/inset/,'Metric lacks depth');
  const field=page.locator('#lootSearch');await field.focus();
  const fieldStyle=await field.evaluate(el=>{
    const c=getComputedStyle(el);return{image:c.backgroundImage,outline:c.outlineStyle,color:c.color};
  });
  assert.match(fieldStyle.image,/linear-gradient/,'Search input should be a glass field');
  assert.notEqual(fieldStyle.outline,'none','Keyboard focus must remain visible');
  assert.ok(fieldStyle.color!=='rgba(0, 0, 0, 0)','Input needs legible text');
  const button=page.locator('#lootHunter button').first();
  if(await button.count()){
    const t=await button.evaluate(el=>getComputedStyle(el).transitionDuration);
    assert.ok(t.split(',').every(s=>parseFloat(s)===0),'Reduced-motion must disable decorative button transitions');
  }
  for(const [file,selector] of external){
    await page.goto(base+file,{waitUntil:'domcontentloaded'});
    const card=page.locator(selector).first();await card.waitFor({timeout:10000});
    const style=await sample(card);
    assert.match(style.background,/radial-gradient/,'External studio lacks glass panel: '+file);
    assert.match(style.shadow,/inset/,'External studio lacks edge depth: '+file);
    const dims=await page.evaluate(()=>({w:document.documentElement.scrollWidth,c:document.documentElement.clientWidth}));
    assert.ok(dims.w<=dims.c+3,'Horizontal overflow on '+file+' '+JSON.stringify(dims));
  }
  await page.goto(base+'citadel-entry.html',{waitUntil:'domcontentloaded'});
  await page.locator('.citadel-panel').first().waitFor();
  const citadel=await sample(page.locator('.citadel-panel').first());
  assert.match(citadel.background,/radial-gradient/,'Citadel shortcuts must share the glass theme');
  assert.ok(citadel.shadow!=='none');
  const dim=await page.evaluate(()=>({w:document.documentElement.scrollWidth,c:document.documentElement.clientWidth}));
  assert.ok(dim.w<=dim.c+3,'Citadel overflows '+JSON.stringify(dim));
  assert.deepEqual(errors,[],'Browser page errors');
  console.log('PASS NEXUS v9.3 Luminous Glass '+name+' — Loot Hunter, metrics, forms, 5 studios, citadel and responsive focus');
 }catch(e){
  await page.screenshot({path:'test-results/azeroth-device-audit/luminous-glass-v93-'+name+'.png',fullPage:true}).catch(()=>{});
  throw e;
 }finally{await context.close();await browser.close()}
}
await run('desktop-chromium',chromium,false);
await run('phone-webkit',webkit,true);
