/* NEXUS | AZEROTH v8.0 — Sovereign workspace browser smoke tests.
 * Local synthetic data, zero real Blizzard credentials or player information.
 */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
const URL='http://127.0.0.1:4173/azeroth-companion/sovereign-ascension.html';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
async function inspect(label,browserType,mobile){const browser=await browserType.launch({headless:true});const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1365,height:900},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
try{
page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://nexus-azeroth-api.zevromxr.workers.dev/**',r=>r.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({message:'Synthetic test: public Blizzard API deliberately unavailable'})}));
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
await page.locator('#nxReadLocal').waitFor();
await page.evaluate(()=>{localStorage.setItem('nexus_azeroth_companion_genesis_v1',JSON.stringify({characters:[{name:'Synthetic',realm:'area-52'}]}));localStorage.setItem('nexus_azeroth_talent_forge_v1',JSON.stringify([{name:'Synthetic A',identity:'us/1/2',rankByNode:{100:2,200:1}},{name:'Synthetic B',identity:'us/1/2',rankByNode:{100:1,300:1}}]));localStorage.setItem('nexus_azeroth_character_targets_v1',JSON.stringify([{name:'Synthetic goal',itemId:123,done:false}]));});
const original=await page.evaluate(()=>localStorage.getItem('nexus_azeroth_talent_forge_v1'));
await page.locator('#nxReadLocal').click();
await page.locator('#nxSovereignMetrics').getByText('2 saved builds').waitFor({timeout:10000});
await page.selectOption('#nxBuildA','0');await page.selectOption('#nxBuildB','1');
await page.locator('#nxCompare').click();
await page.locator('#nxBuildResults').getByText('Node 100:',{exact:false}).waitFor();
await page.locator('#nxMission').click();
await page.locator('#nxMissionResults').getByText('Refine my build').waitFor();
await page.locator('#nxAdvisor').click();
await page.locator('#nxAdvice').getByText('manual Talent Forge drafts',{exact:false}).waitFor();
await page.selectOption('#nxGoal','gear');await page.locator('#nxMission').click();
await page.locator('#nxMissionResults').getByText('Research equipment').waitFor();
await page.locator('[name="realm"]').fill('area-52');await page.locator('[name="character"]').fill('synthetic');
await page.locator('#nxPublicLoad').click();
await page.locator('#nxPublicStatus').getByText('unavailable',{exact:false}).waitFor({timeout:12000});
const after=await page.evaluate(()=>localStorage.getItem('nexus_azeroth_talent_forge_v1'));
assert.equal(after,original,'v8 preview must not alter existing saved Talent Forge data');
const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
assert.ok(dimensions.scroll<=dimensions.width+3,'Responsive overflow '+JSON.stringify(dimensions));
assert.deepEqual(errors,[],'No browser JS exceptions expected');
console.log('PASS Sovereign v8 '+label+' local read, talent comparison, missions, assistant evidence, API failure, storage preservation');
}catch(error){await page.screenshot({path:'test-results/azeroth-device-audit/sovereign-v8-'+label+'.png',fullPage:true}).catch(()=>{});throw error}
finally{await ctx.close();await browser.close()}}
await inspect('desktop-chromium',chromium,false);
await inspect('phone-webkit',webkit,true);
