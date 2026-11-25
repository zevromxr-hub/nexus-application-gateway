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
  assert.match(await page.locator('#versionInfo').textContent(),/3\.7\.1/);
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
  await card.scrollIntoViewIfNeeded();
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
  await card.scrollIntoViewIfNeeded();
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
  await page.evaluate(()=>document.querySelector('.video-vault-card')?.scrollIntoView({block:'center'}));
  await page.locator('.video-vault-card .video-vault-art-image').waitFor({state:'attached',timeout:14000});
  // The interface lists artwork IDs only, and retrieves binary data on demand.
  await page.waitForFunction(()=>/1 personal cover/.test(document.querySelector('#videoVaultCoverIntegrity')?.textContent||''),null,{timeout:12000});
  // Create a genuinely orphaned test cover and remove it via explicit confirmation.
  await page.evaluate(async()=>{
   const db=await new Promise((res,rej)=>{const q=indexedDB.open('proximus-video-vault-covers-v370',1);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
   await new Promise((res,rej)=>{const tx=db.transaction('covers','readwrite');
    tx.objectStore('covers').put({id:'smoke-orphan-abc',mime:'image/gif',data:new Uint8Array([71,73,70]).buffer,image:null,savedAt:Date.now()});
    tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});
   db.close();
  });
  page.once('dialog',d=>d.accept());
  await page.locator('#videoVaultCleanCovers').click();
  await page.waitForFunction(async()=>{
   const db=await new Promise((res,rej)=>{const q=indexedDB.open('proximus-video-vault-covers-v370',1);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
   const exists=await new Promise((res,rej)=>{const tx=db.transaction('covers','readonly');
    const q=tx.objectStore('covers').get('smoke-orphan-abc');q.onsuccess=()=>res(!!q.result);q.onerror=()=>rej(q.error)});
   db.close();return !exists;
  },null,{timeout:15000});
  assert.equal(await page.locator('.video-vault-card').count(),1,'Artwork cleanup cannot remove original movies');
  // Deleting the test movie must also delete its *separately stored* personal cover.
  if(!mobile){
   const geometry=await page.evaluate(()=>{
    const btn=document.querySelector('.video-vault-card [aria-label="Remove Local Sample Movie.mp4 from saved Video Vault"]');
    const nav=document.querySelector('.rail'),shell=document.querySelector('.shell');
    const br=btn?.getBoundingClientRect(),nr=nav?.getBoundingClientRect(),sr=shell?.getBoundingClientRect();
    return {button:br?{left:br.left,right:br.right,top:br.top}:null,
     rail:nr?{left:nr.left,right:nr.right}:null,shell:sr?{left:sr.left,right:sr.right}:null,
     overflow:document.documentElement.scrollWidth-innerWidth,
     ancestors:(()=>{
      const out=[];let el=btn;
      while(el&&out.length<10){
       const box=el.getBoundingClientRect(),style=getComputedStyle(el);
       out.push({tag:el.tagName,className:String(el.className).slice(0,60),
        left:Math.round(box.left),width:Math.round(box.width),scrollLeft:el.scrollLeft,
        scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,overflowX:style.overflowX,
        transform:style.transform});
       el=el.parentElement;
      }
      return out;
     })()};
   });
   console.log('DESKTOP VAULT GEOMETRY '+JSON.stringify(geometry));
   assert.ok(geometry.shell.left>=geometry.rail.right-2,'Desktop workspace must begin to the right of fixed rail');
   assert.ok(geometry.button.left>=geometry.rail.right-2,'Video controls must not be positioned under fixed studio navigation');
  }
  page.once('dialog',d=>d.accept());
  await page.locator('.video-vault-card [aria-label="Remove Local Sample Movie.mp4 from saved Video Vault"]').click();
  await page.waitForFunction(async()=>{
   const db=await new Promise((res,rej)=>{const q=indexedDB.open('proximus-video-vault-covers-v370',1);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
   const cover=await new Promise((res,rej)=>{const tx=db.transaction('covers','readonly');
    const q=tx.objectStore('covers').get('smoke-clip-1234');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
   db.close();return !cover;
  },null,{timeout:15000});
  assert.deepEqual(errors,[],name+' JavaScript errors');
  console.log('PASS '+name+' vivid background, master GIF, lazy personal cover, orphan cleanup and movie-deletion integrity');
 }catch(e){
  console.error('FAIL '+name+' '+String(e));
  await page.screenshot({path:'/tmp/proximus-v37-'+name+'.png',fullPage:false}).catch(()=>{});
  throw e;
 }finally{await ctx.close();await browser.close()}
}
