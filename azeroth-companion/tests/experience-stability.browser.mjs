/* NEXUS | AZEROTH v4.9 — real interface-stability browser checks.
 * Local static site only; secure Blizzard API deliberately unavailable.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const URL='http://127.0.0.1:4173/azeroth-companion/';
async function audit(engine,label,mobile){
 const browser=await engine.launch({headless:true});let context;
 try{
  context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://nexus-azeroth-api.zevromxr.workers.dev/**',route=>route.fulfill({status:503,
   contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'},
   body:'{"message":"Private API intentionally disabled during the website-shell audit"}'}));
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('body.sp-portal-ready').waitFor({timeout:20000});
  await page.locator('#sxHeroVersion').getByText('Azeroth v5.5.0').waitFor({timeout:12000});
  // The favorite editor must not replace its entire list on every checkbox.
  await page.locator('#spCustomize').click();
  await page.evaluate(()=>{
   const wrap=document.querySelector('#spDeckChoices');
   window.__nxFirstChoice=wrap.querySelector('input[data-sp-favorite="collections"]');
   window.__nxChoiceMutations=0;
   const observer=new MutationObserver(records=>{
    window.__nxChoiceMutations+=records.filter(r=>r.type==='childList').length;
   });
   observer.observe(wrap,{childList:true,subtree:true});
   window.__nxChoiceObserver=observer;
  });
  await page.locator('[data-sp-favorite="collections"]').check();
  await page.locator('[data-sp-favorite="collections"]').uncheck();
  const state=await page.evaluate(()=>({
   stable:document.querySelector('input[data-sp-favorite="collections"]')===window.__nxFirstChoice,
   mutations:window.__nxChoiceMutations,
   active:document.activeElement?.dataset?.spFavorite,
   count:document.querySelectorAll('#spFavorites [data-sp-go]').length
  }));
  assert.ok(state.stable,'Quick Deck should retain checkbox element identity across changes');
  assert.equal(state.mutations,0,'Favorite changes should not replace checkbox nodes');
  assert.equal(state.active,'collections','Keyboard focus must survive favorite toggling');
  assert.ok(state.count<=6,'Favorite limit must still be enforced');
  await page.locator('#spDoneShortcuts').click();
  // Repeating the same visit must not replace an unchanged Recent Tools button.
  async function navigate(id){
   if(mobile){
    await page.locator('.ac-mobile-bar [data-ac-more]').click();
    await page.locator('.sidebar [data-view="'+id+'"]').click();
   }else await page.locator('.sidebar [data-view="'+id+'"]').click();
  }
  await navigate('dominion');
  await page.locator('#spCurrentView').getByText(/Character Dominion/i).waitFor({timeout:6000});
  await page.evaluate(()=>{window.__nxRecent= document.querySelector('#sxRecent button');});
  await navigate('dominion');
  await page.waitForTimeout(80);
  assert.ok(await page.evaluate(()=>document.querySelector('#sxRecent button')===window.__nxRecent),'Unchanged Recent Tools list should retain its first shortcut');
  await navigate('atlas');
  await page.locator('#spCurrentView').getByText(/Item Atlas/i).waitFor({timeout:6000});
  await navigate('overview');
  assert.ok(await page.locator('#sxExperience').isVisible(),'Home must remain usable');
  // Large-list CSS must not discard real DOM nodes, make buttons unclickable,
  // or create horizontal scrolling. Synthetic records never enter localStorage.
  await navigate('characters');
  const large=await page.evaluate(()=>{
   const list=document.querySelector('#characterList');
   if(!list)return {present:false};
   const frag=document.createDocumentFragment();
   for(let i=0;i<240;i++){
    const item=document.createElement('div');item.className='entry';
    const name=document.createElement('span');name.textContent='Temporary layout-test character '+i;
    const btn=document.createElement('button');btn.type='button';btn.textContent='CHECK';
    btn.dataset.nxSynthetic=String(i);btn.addEventListener('click',()=>{window.__nxLastClicked=i});
    item.append(name,btn);frag.append(item);
   }
   list.replaceChildren(frag);
   const first=list.firstElementChild,last=list.lastElementChild;
   return {present:true,items:list.children.length,
    supported:CSS.supports('content-visibility','auto'),
    style:getComputedStyle(last).contentVisibility,
    intrinsic:getComputedStyle(last).containIntrinsicSize};
  });
  assert.ok(large.present&&large.items===240,'Synthetic long list must mount');
  if(large.supported)assert.equal(large.style,'auto','Offscreen list items should get progressive paint');
  await page.locator('[data-nx-synthetic="239"]').scrollIntoViewIfNeeded();
  await page.locator('[data-nx-synthetic="239"]').click();
  assert.equal(await page.evaluate(()=>window.__nxLastClicked),239,'Last entry should remain interactive after scroll');
  const viewport=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
  assert.ok(viewport.scroll<=viewport.width+2,'Large list must not introduce horizontal overflow');
  assert.deepEqual(errors,[],'Browser JavaScript errors are not allowed');
  console.log('PASS v5.0 stability '+label+' — stable Quick Deck controls, latest navigation and large-list scrolling');
 }finally{await context?.close().catch(()=>{});await browser.close().catch(()=>{})}
}
await audit(chromium,'desktop-chromium',false);
await audit(webkit,'phone-webkit',true);
console.log('Azeroth v5.0 Website Stability browser audits passed.');
