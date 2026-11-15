/* NEXUS | AZEROTH v4.9 — Website stability browser audit.
 * Checks one view activation per navigation, no duplicate shell writes,
 * and usable long task lists in desktop Chromium and mobile WebKit.
 * All test records exist only in isolated localhost browser storage.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const BASE='http://127.0.0.1:4173/azeroth-companion/';
async function run(label,engine,phone){
 const browser=await engine.launch({headless:true});
 let context;
 try{
  context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:900},isMobile:phone,hasTouch:phone,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  await page.addInitScript(()=>{
   window.__stabilityAudit={activations:[],shellWrites:0};
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){
    if(key==='nexus_azeroth_site_shell_v44')window.__stabilityAudit.shellWrites++;
    return original.call(this,key,value);
   };
   const tasks=Array.from({length:320},(_,i)=>({id:'audit-'+i,title:'QA Planning Objective '+String(i).padStart(3,'0'),goal:'Custom',charId:'',done:false}));
   localStorage.setItem('nexus_azeroth_companion_genesis_v1',JSON.stringify({characters:[],builds:[],tasks,collections:[]}));
   document.addEventListener('nexus:view-activated',event=>window.__stabilityAudit.activations.push(event.detail?.view));
  });
  await page.route('https://nexus-azeroth-api.zevromxr.workers.dev/**',route=>
   route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({message:'Not available in isolated site UI audit'})}));
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('body.sp-portal-ready').waitFor();
  await page.locator('#sxHeroVersion').getByText('Azeroth v4.9.0').waitFor({timeout:12000});
  const metrics=()=>page.evaluate(()=>({...window.__stabilityAudit}));
  const select=async id=>{
   if(phone){await page.locator('.ac-mobile-bar [data-ac-more]').click();await page.locator('.sidebar [data-view="'+id+'"]').click()}
   else await page.locator('.sidebar [data-view="'+id+'"]').click();
  };
  const first=await metrics();
  assert.equal(first.activations.length,0,'Home startup must not emit duplicate view activations');
  await select('dominion');
  const afterFirst=await metrics();
  assert.deepEqual(afterFirst.activations,['dominion'],'First selection must emit one view event');
  assert.equal(afterFirst.shellWrites-first.shellWrites,1,'First view selection should write shell recents exactly once');
  await select('dominion');
  const afterRepeat=await metrics();
  assert.deepEqual(afterRepeat.activations,['dominion'],'Re-selecting active studio must not trigger heavy view refresh');
  assert.equal(afterRepeat.shellWrites,afterFirst.shellWrites,'Re-selecting active studio must not rewrite site preferences');
  await select('atlas');
  const afterAtlas=await metrics();
  assert.deepEqual(afterAtlas.activations,['dominion','atlas'],'New selection must activate one view exactly once');
  assert.equal(afterAtlas.shellWrites-afterRepeat.shellWrites,1,'New view should update recent tools once');
  await page.locator('#spContextHome').click();
  const afterHome=await metrics();
  assert.deepEqual(afterHome.activations,['dominion','atlas','overview']);
  await page.locator('#spFavorites [data-sp-go="dominion"]').click();
  const afterDeck=await metrics();
  assert.deepEqual(afterDeck.activations,['dominion','atlas','overview','dominion'],'Quick Deck should use one central router event');
  assert.equal(afterDeck.shellWrites-afterHome.shellWrites,1,'Quick Deck navigation must not double-save recents');
  // Test long-list paint containment without altering, truncating, or paging original records.
  await select('progress');
  const entries=page.locator('#taskList > .entry');
  assert.equal(await entries.count(),320,'All 320 synthetic task records must remain available');
  const last=entries.last();
  await last.scrollIntoViewIfNeeded();
  assert.ok((await last.textContent()).includes('QA Planning Objective 319'),'Last list item should remain reachable');
  const browserSupports=await page.evaluate(()=>CSS.supports('content-visibility','auto'));
  if(browserSupports){
   assert.equal(await last.evaluate(el=>getComputedStyle(el).contentVisibility),'auto','Long task rows should use browser offscreen paint containment');
  }
  await last.locator('input[type="checkbox"]').check();
  assert.equal((await page.locator('#countPlans').textContent()).trim(),'319','Long-list row controls must preserve local task changes');
  assert.deepEqual(errors,[],'Site should not emit uncaught JavaScript errors');
  console.log('PASS '+label+' · single route event, no duplicate history writes, full list scroll and update');
 }finally{await context?.close().catch(()=>{});await browser.close().catch(()=>{})}
}
await run('desktop Chromium',chromium,false);
await run('phone WebKit',webkit,true);
console.log('NEXUS | AZEROTH v4.9 website stability browser audit passed.');
