/* PROXIMUS v3.7 visual smoke: local GIF art, personal covers, and storage
   Tested in emulated iPhone WebKit and desktop Chromium, not physical hardware. */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const gif=Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==','base64');
for(const [name,engine,mobile] of [['iphone-webkit',webkit,true],['desktop-chromium',chromium,false]]){
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:880},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:4173/alchemist/',{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator(mobile?'#commandOpenMedia':'#mediaOpen').waitFor({state:'visible',timeout:16000});
  assert.match(await page.locator('#versionInfo').textContent(),/3\.7\.0/);
  await page.locator(mobile?'#commandOpenMedia':'#mediaOpen').click();
  await page.locator('#mediaTarget').selectOption('background');
  await page.locator('#mediaFile').setInputFiles({name:'vivid.gif',mimeType:'image/gif',buffer:gif});
  await page.locator('#mediaSave').click();
  await page.waitForFunction(()=>document.body.classList.contains('has-ambient')&&document.querySelector('#ambientMedia img'),null,{timeout:12000});
  await page.locator('#mediaCinematicPreset').click();
  await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#ambientMedia').style.opacity)-.85)<.001,null,{timeout:12000});
  assert.equal(await page.locator('#mediaVisualProfile').inputValue(),'cinema');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('proximus-visual-pop-v370')).preview),'cinema');
  await page.locator('#mediaTarget').selectOption('master');
  await page.locator('#mediaFile').setInputFiles({name:'master.gif',mimeType:'image/gif',buffer:gif});
  await page.locator('#mediaMasterApply').click();
  assert.ok(await page.locator('#heroOrb img.personal-media').count()>=1);
  await page.locator('#mediaClose').click();
  // Populate *test-only* local video metadata. Existing original blob/storage is
  // intentionally never modified or deleted by the cover layer.
  await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('proximus-video-vault-v1',2);q.onupgradeneeded=()=>{for(const n of ['items','files','chunks'])if(!q.result.objectStoreNames.contains(n))q.result.createObjectStore(n,{keyPath:'id'})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
   await new Promise((resolve,reject)=>{const tx=db.transaction('items','readwrite');
     tx.objectStore('items').put({id:'smoke-clip-1234',name:'Local Sample Movie.mp4',mime:'video/mp4',bytes:12345,added:Date.now(),updated:Date.now(),favorite:false,collection:'Unsorted',position:0,watched:0,poster:null});
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
   db.close();
  });
  await page.locator(mobile?'#mobileDock [data-mobile-target="videos"]':'#vaultJump').click();
  await page.locator('#videoVaultRefresh').click();
  const card=page.locator('.video-vault-card').filter({hasText:'Local Sample Movie.mp4'});
  await card.waitFor({state:'visible',timeout:15000});
  const cover=card.locator('button', {hasText:'✧ GIF/Video Cover'});
  await cover.waitFor({state:'attached',timeout:15000});
  await card.locator('input[type=file]').setInputFiles({name:'personal.gif',mimeType:'image/gif',buffer:gif});
  await card.locator('.video-vault-art-image').waitFor({state:'attached',timeout:15000});
  const saved=await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('proximus-video-vault-v1',2);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
   const item=await new Promise((resolve,reject)=>{const tx=db.transaction('items','readonly');const q=tx.objectStore('items').get('smoke-clip-1234');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
   db.close();return {bytes:item.bytes,cover:item.coverBlob?.size||0,originalName:item.name};
  });
  assert.equal(saved.bytes,12345,'Movie metadata must remain unchanged');
  assert.equal(saved.originalName,'Local Sample Movie.mp4');
  assert.ok(saved.cover>0,'Animated cover should be saved locally as a separate blob');
  await page.locator('#videoVaultRefresh').click();
  await page.locator('.video-vault-card .video-vault-art-image').waitFor({state:'attached'});
  assert.deepEqual(errors,[],name+' JavaScript errors');
  console.log('PASS '+name+' vivid background, master GIF, personal video cover and local data persistence');
 }catch(e){
  console.error('FAIL '+name+' '+String(e));
  await page.screenshot({path:'/tmp/proximus-v37-'+name+'.png',fullPage:false}).catch(()=>{});
  throw e;
 }finally{await ctx.close();await browser.close()}
}
