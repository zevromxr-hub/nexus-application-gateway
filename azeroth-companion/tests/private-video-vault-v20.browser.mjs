/* NEXUS | AZEROTH v20 — real browser encrypted-vault acceptance
 * Desktop Chromium and simulated iPhone WebKit, local synthetic video only.
 * No actual user media, passwords, Blizzard API, internet video or remote uploads.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
await mkdir('test-results/azeroth-device-audit',{recursive:true});
const ROOT='http://127.0.0.1:4173/azeroth-companion/';
const PASSWORD='Azeroth private archive test 2026! 💫';
const SECRET='Sensitive Personal Recording 2026.mp4';
async function check(label,engine,mobile){
 const browser=await engine.launch({headless:true}),context=await browser.newContext({
  viewport:mobile?{width:390,height:844}:{width:1440,height:900},
  isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce',acceptDownloads:true
 });
 const page=await context.newPage(),errors=[],remote=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',request=>{const url=request.url();if(url.startsWith('blob:')||url.startsWith('data:'))return; if(!url.startsWith('http://127.0.0.1:4173/'))remote.push(url)});
 try{
  await page.goto(ROOT+'private-video-vault.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('nv20GateTitle')?.textContent?.includes('Create your private vault'));
  assert.equal(await page.locator('#nv20Workspace').isHidden(),true);
  assert.equal(await page.locator('#nv20ConfirmWrap').isHidden(),false);
  await page.locator('#nv20Password').fill(PASSWORD);
  await page.locator('#nv20Confirm').fill(PASSWORD);
  await page.locator('#nv20GateSubmit').click();
  await page.locator('#nv20Workspace').waitFor({state:'visible'});
  assert.equal(await page.locator('#nv20Count').textContent(),'0');
  // Verify no server requests were performed by the vault, including during encryption.
  assert.deepEqual(remote,[],'Vault should make no remote requests');
  // Real bytes are synthetic and not a valid playable movie; we are testing encryption,
  // local persistence, metadata privacy, object URL creation and the password boundary.
  const bytes=Buffer.concat([Buffer.from([0,0,0,24,102,116,121,112,105,115,111,109]),
    Buffer.from('PRIVATE_SYNTHETIC_VIDEO_CONTENT_V20_TEST_ABC123')]);
  await page.locator('#nv20Files').setInputFiles([{name:SECRET,mimeType:'video/mp4',buffer:bytes}]);
  await page.waitForFunction(()=>document.getElementById('nv20Count')?.textContent==='1');
  assert.equal(await page.locator('.nv20-clip-title').textContent(),SECRET);
  const raw=await page.evaluate(()=>new Promise((resolve,reject)=>{
   const req=indexedDB.open('nexus_azeroth_secure_video_v20');
   req.onerror=()=>reject(req.error);req.onsuccess=()=>{
    const db=req.result,tx=db.transaction(['config','clips','parts'],'readonly');
    const out={};
    for(const name of ['config','clips','parts']){
     const r=tx.objectStore(name).getAll();r.onsuccess=()=>{out[name]=r.result.map(x=>({
      ...x,iv:Array.from(x.iv||[]),salt:x.salt?Array.from(x.salt):undefined,
      ct:x.ct?Array.from(new Uint8Array(x.ct)).slice(0,32):undefined
     }))};
    }
    tx.oncomplete=()=>{db.close();resolve(out)};
    tx.onerror=()=>reject(tx.error);
   };
  }));
  assert.equal(raw.config.length,1);assert.equal(raw.clips.length,1);assert.equal(raw.parts.length,1);
  assert.equal(raw.config[0].iterations,600000);
  assert.equal(raw.config[0].salt.length,16);
  assert.equal(raw.clips[0].iv.length,12);
  assert.equal(raw.parts[0].iv.length,12);
  assert.equal(raw.clips[0].name,undefined,'Video names must be encrypted');
  assert.equal(raw.clips[0].mime,undefined,'Mime/metadata must be encrypted');
  assert.ok(!JSON.stringify(raw).includes('Sensitive Personal Recording'),'Encrypted DB must not contain plaintext title');
  assert.notDeepEqual(raw.clips[0].iv,raw.parts[0].iv,'Separate metadata and video chunks must have unique IVs');
  const existing=['nexus_world_atlas_goals_v16','nexus_atlas_routes_v181','nexus_azeroth_talent_forge_v1'];
  const prior=await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),existing);
  await page.locator('button[data-action="edit"]').click();
  await page.locator('.nv20-clip-editor input').fill('My Secret Master Clip');
  await page.locator('.nv20-clip-editor textarea').fill('My own private note');
  await page.locator('.nv20-clip-editor button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelector('.nv20-clip-title')?.textContent==='My Secret Master Clip');
  await page.locator('button[data-action="favorite"]').click();
  await page.waitForFunction(()=>document.querySelector('.nv20-favorite')?.textContent==='★');
  // Ensure playback is assembled into a temporary blob URL, not a public file link.
  await page.locator('button[data-action="play"]').click();
  await page.locator('#nv20PlayerPanel').waitFor({state:'visible'});
  assert.match(await page.locator('#nv20Video').getAttribute('src'),/^blob:/);
  await page.locator('#nv20Stop').click();
  assert.equal(await page.locator('#nv20Video').getAttribute('src'),null);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#nv20Backup').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/\.nxvault$/);
  const savedPath='test-results/azeroth-device-audit/vault-v20-'+label+'.nxvault';
  await download.saveAs(savedPath);
  const archive=await readFile(savedPath);
  assert.ok(archive.length>100);
  assert.equal(archive.toString('ascii',0,4),'NXV1');
  assert.ok(!archive.includes(Buffer.from('My Secret Master Clip')),'Encrypted backup must not reveal names');
  assert.ok(!archive.includes(Buffer.from('My own private note')),'Encrypted backup must not reveal notes');
  await page.locator('#nv20Lock').click();
  await page.locator('#nv20Gate').waitFor({state:'visible'});
  assert.equal(await page.locator('#nv20Workspace').isHidden(),true);
  assert.equal(await page.locator('.nv20-clip-title').count(),0,'Titles must be cleared after lock');
  await page.locator('#nv20Password').fill('The wrong password 987654321!');
  await page.locator('#nv20GateSubmit').click();
  await page.waitForFunction(()=>document.getElementById('nv20Alert')?.textContent?.includes('Incorrect vault password'));
  assert.equal(await page.locator('#nv20Workspace').isHidden(),true);
  await page.locator('#nv20Password').fill(PASSWORD);
  await page.locator('#nv20GateSubmit').click();
  await page.locator('#nv20Workspace').waitFor({state:'visible'});
  assert.equal(await page.locator('.nv20-clip-title').textContent(),'My Secret Master Clip');
  assert.match(await page.locator('.nv20-clip-note').textContent(),/private note/);
  // Backups move encrypted content across isolated browser profiles, never via GitHub.
  const second=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:850},
   isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
  const fresh=await second.newPage();fresh.on('pageerror',e=>errors.push(String(e)));
  await fresh.goto(ROOT+'private-video-vault.html',{waitUntil:'domcontentloaded'});
  await fresh.waitForFunction(()=>document.getElementById('nv20GateTitle')?.textContent?.includes('Create your private vault'));
  await fresh.locator('#nv20RestoreFile').setInputFiles(savedPath);
  fresh.once('dialog',dialog=>dialog.accept());
  await fresh.locator('#nv20Restore').click();
  await fresh.waitForFunction(()=>document.getElementById('nv20GateTitle')?.textContent?.includes('Unlock your encrypted'));
  await fresh.locator('#nv20Password').fill(PASSWORD);
  await fresh.locator('#nv20GateSubmit').click();
  await fresh.locator('#nv20Workspace').waitFor({state:'visible'});
  assert.equal(await fresh.locator('.nv20-clip-title').textContent(),'My Secret Master Clip');
  await second.close();
  const after=await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),existing);
  assert.deepEqual(after,prior,'Vault must not touch companion mission/talent/route storage');
  if(mobile){
   const widths=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(widths.scroll<=widths.viewport+5,'No iPhone global horizontal overflow: '+JSON.stringify(widths));
  }
  assert.deepEqual(errors,[],'Vault UI should have no page exceptions');
  assert.deepEqual(remote,[],'No server media uploads or remote connections allowed');
  await page.screenshot({path:'test-results/azeroth-device-audit/vault-v20-'+label+'.png',fullPage:true});
  console.log('PASS v20 '+label+': real AES encryption and locked titles, wrong-password rejection, encrypted import/edit/favorite, temporary playback, portable restore, source isolation.');
 }catch(e){
  await page.screenshot({path:'test-results/azeroth-device-audit/vault-v20-error-'+label+'.png',fullPage:true}).catch(()=>{});
  throw e;
 }finally{await browser.close()}
}
await check('desktop-chromium',chromium,false);
await check('iphone-webkit',webkit,true);
