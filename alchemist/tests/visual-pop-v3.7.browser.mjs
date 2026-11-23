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
  await page.locator('#commandOpenMedia:visible, #mediaOpen:visible').first().waitFor({state:'visible',timeout:16000});
  assert.match(await page.locator('#versionInfo').textContent(),/3\.7\.0/);
  await page.locator('#commandOpenMedia:visible, #mediaOpen:visible').first().click();
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
  await page.waitForFunction(()=>Boolean(
   document.querySelector('#heroOrb img.personal-media')||
   document.querySelector('.dashboard-thumb img.personal-media')||
   document.querySelector('.studio-personal-thumb img.personal-media')
  ),null,{timeout:14000});
  // Reuse saved Master artwork: icon crop and PNG generation must be completely local.
  await page.locator('#homeIconUseMaster').click();
  await page.waitForFunction(()=>String(document.querySelector('#homeIconStatus')?.textContent).includes('Using your existing Master artwork'),null,{timeout:12000});
  await page.locator('#homeIconZoom').evaluate(node=>{
   node.value='175';node.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('proximus-personal-home-icon-v370')||'{}').zoom===175,null,{timeout:9000});
  const icon=await page.evaluate(()=>{
   const data=JSON.parse(localStorage.getItem('proximus-personal-home-icon-v370')||'{}');
   return {hasLocalSource:String(data.source||'').startsWith('data:image/jpeg;base64,'),
    canvasWidth:document.querySelector('#homeIconPreview')?.width,
    canvasHeight:document.querySelector('#homeIconPreview')?.height,
    hasInstructions:document.querySelector('#homeIconHelp')?.textContent.includes('Shortcuts')};
  });
  assert.equal(icon.hasLocalSource,true,'Custom iPhone icon source is browser-local');
  assert.equal(icon.canvasWidth,180);assert.equal(icon.canvasHeight,180);
  assert.equal(icon.hasInstructions,true);
  const iconDownload=page.waitForEvent('download',{timeout:10000});
  await page.locator('#homeIconExport180').click();
  const exported=await iconDownload;assert.match(exported.suggestedFilename(),/180\.png$/);
  await page.locator('#mediaClose').click();
  // Critical: browser-local artwork must survive a fresh iPhone Home Screen-style
  // app reload, not just appear optimistically before IndexedDB finishes.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('has-ambient')&&
    document.querySelector('#ambientMedia img')&&document.querySelector('#heroOrb img.personal-media'),null,{timeout:15000});
  assert.equal(await page.evaluate(()=>Math.round(Number(document.querySelector('#ambientMedia').style.opacity)*100)),85);
  // Populate *test-only* local video metadata. Existing original blob/storage is
  // intentionally never modified or deleted by the cover layer.
  await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('proximus-video-vault-v1',2);q.onupgradeneeded=()=>{for(const n of ['items','files','chunks'])if(!q.result.objectStoreNames.contains(n))q.result.createObjectStore(n,{keyPath:'id'})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
   await new Promise((resolve,reject)=>{const tx=db.transaction('items','readwrite');
     tx.objectStore('items').put({id:'smoke-clip-1234',name:'Local Sample Movie.mp4',mime:'video/mp4',bytes:12345,added:Date.now(),updated:Date.now(),favorite:false,collection:'Unsorted',position:0,watched:0,poster:null});
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
   db.close();
  });
  await page.locator('#commandOpenVideos:visible, #mobileDock [data-mobile-target="videos"]:visible, .nav[data-view="videos"]:visible, #vaultJump:visible').first().click();
  await page.locator('#videoVaultRefresh').click();
  const card=page.locator('.video-vault-card').filter({hasText:'Local Sample Movie.mp4'});
  await card.waitFor({state:'visible',timeout:15000});
  const cover=card.locator('button', {hasText:'✧ GIF/Video Cover'});
  await cover.waitFor({state:'attached',timeout:15000});
  await card.locator('input[type=file]').setInputFiles({name:'personal.gif',mimeType:'image/gif',buffer:gif});
  await page.waitForTimeout(1800);
  console.log('COVER DEBUG '+name+' '+JSON.stringify(await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('proximus-video-vault-v1',2);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
   const item=await new Promise((resolve,reject)=>{const tx=db.transaction('items','readonly');const req=tx.objectStore('items').get('smoke-clip-1234');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
   db.close();
   const artDb=await new Promise((resolve,reject)=>{const req=indexedDB.open('proximus-video-vault-covers-v370',1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
   const art=await new Promise((resolve,reject)=>{const tx=artDb.transaction('covers','readonly');const req=tx.objectStore('covers').get('smoke-clip-1234');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});artDb.close();
   return {
    localStatus:document.querySelector('#videoVaultStatus')?.textContent,
    originalHasNewCover:item?.coverBlob instanceof Blob,coverSize:art?.data?.byteLength||0,
    cards:document.querySelectorAll('#videoVaultGrid .video-vault-card').length,
    decorated:[...document.querySelectorAll('#videoVaultGrid .video-vault-card')].map(x=>({
     title:x.querySelector('strong')?.textContent,enhanced:x.dataset.coverEnhanced,
     image:!!x.querySelector('.video-vault-art-image'),controls:x.querySelectorAll('button').length
    })),
    artError:document.querySelector('#notice')?.textContent
   };
  })));
  await card.locator('.video-vault-art-image').waitFor({state:'attached',timeout:10000});
  const saved=await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('proximus-video-vault-v1',2);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
   const item=await new Promise((resolve,reject)=>{const tx=db.transaction('items','readonly');const q=tx.objectStore('items').get('smoke-clip-1234');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
   db.close();
    const artDb=await new Promise((resolve,reject)=>{const q=indexedDB.open('proximus-video-vault-covers-v370',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
    const art=await new Promise((resolve,reject)=>{const tx=artDb.transaction('covers','readonly');const q=tx.objectStore('covers').get('smoke-clip-1234');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});artDb.close();
    return {bytes:item.bytes,cover:art?.data?.byteLength||0,originalName:item.name,originalHasNewCover:!!item.coverBlob};
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
