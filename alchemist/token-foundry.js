// PROXIMUS | ASSET ALCHEMIST — Token Foundry owner interface.
// All vault records are encrypted before entering browser storage.
// A static site cannot enforce a server-verified paid license; local redemption
// is a private management tool, not a network access control system.
import {$,download,wrap,safe} from './core.js';
import {saveOrShare} from './portable-kit.js';
import {
 newEncryptedVault,openEncryptedVault,sealInventory,normalizeInventory,makeRecord,
 evaluateToken,recordState,inventoryCSV,inventoryTXT,inventoryStats,logEvent,maskedToken
} from './token-crypto.js';

const DB='proximus-token-foundry-private-v1',STORE='vault',STORAGE_KEY='owner',FALLBACK='proximus-token-envelope-v1';
const MAX_BATCH=50,MAX_TOTAL=5000;
const encoder=(v,type='application/json')=>new Blob([v],{type:type+';charset=utf-8'});
const stamp=()=>new Date().toISOString(),dated=(part,ext)=>'PROXIMUS-TOKEN-FOUNDRY-'+part+'-'+stamp().slice(0,10)+'.'+ext;
function element(tag,text,cls=''){const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node;}
function openDB(){return new Promise((resolve,reject)=>{
 if(typeof indexedDB==='undefined')return reject(Error('Browser storage unavailable'));
 const req=indexedDB.open(DB,1);
 req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Cannot open private token storage'));
});}
async function getEnvelope(){
 try{
  const db=await openDB();
  try{
   const record=await new Promise((resolve,reject)=>{
    const req=db.transaction(STORE).objectStore(STORE).get(STORAGE_KEY);
    req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
   });
   if(record)return record;
  }finally{db.close();}
 }catch(e){}
 try{const s=localStorage.getItem(FALLBACK);return s?JSON.parse(s):null;}catch(e){return null;}
}
async function putEnvelope(value){
 let ok=false;
 try{
  const db=await openDB();
  try{
   await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,STORAGE_KEY);
    tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||Error('Could not save tokens'));
   });
   ok=true;
  }finally{db.close();}
 }catch(e){}
 try{
  if(ok)localStorage.removeItem(FALLBACK);
  else{localStorage.setItem(FALLBACK,JSON.stringify(value));ok=true;}
 }catch(e){}
 if(!ok)throw Error('Encrypted token vault could not be stored on this device. Check browser storage settings.');
}
async function clip(value){
 if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return;}
 const area=document.createElement('textarea');area.value=value;area.readOnly=true;area.style.position='fixed';area.style.opacity='0';
 document.body.append(area);area.focus();area.select();
 const ok=document.execCommand?.('copy');area.remove();
 if(!ok)throw Error('Copy is not supported. Use a file export instead.');
}
export function initTokenFoundry(app){
 const q=$,stat=q('tokenStatus'),list=q('tokenInventory'),audit=q('tokenAudit'),batch=q('tokenBatch');
 if(!q('tokenVaultSetup'))return;
 let vault=null,latest=[],selected=new Set(),inFlight=Promise.resolve(),lastActivity=Date.now(),hiddenAt=0,creating=false;
 const tell=(s,error=false)=>{stat.textContent=s;stat.dataset.error=error?'true':'false';};
 const lockedView=mode=>{
  q('tokenVaultSetup').hidden=mode!=='setup';q('tokenVaultUnlock').hidden=mode!=='unlock';
  q('tokenVaultMain').hidden=mode!=='main';
  q('tokenSecurityState').textContent=mode==='main'?'UNLOCKED · ENCRYPTED DEVICE INVENTORY':mode==='setup'?'CREATE PRIVATE TOKEN VAULT':'LOCKED · VAULT PASSPHRASE REQUIRED';
 };
 const requireVault=()=>{if(!vault)throw Error('Unlock your encrypted vault first.');lastActivity=Date.now();return vault;};
 function clearSensitive(){
  latest=[];selected.clear();list.replaceChildren();audit.replaceChildren();batch.replaceChildren();
  for(const id of ['tokenPassSetup','tokenPassConfirm','tokenPassUnlock','tokenValidationInput','tokenImportPass','tokenNewPass','tokenOldPass'])q(id).value='';
  q('tokenBatchCount').textContent='0 newly generated';
 }
 function lock(reason='Vault locked.'){
  vault=null;clearSensitive();lockedView('unlock');tell(reason);
 }
 let autosave=Promise.resolve();
 async function persist(){
  const v=requireVault();
  autosave=autosave.catch(()=>{}).then(async()=>{
   if(vault!==v)return;
   const sealed=await sealInventory(v.inventory,v.key,v.salt,v.iterations);
   await putEnvelope(sealed);
   if(vault===v)v.envelope=sealed;
  });
  return await autosave;
 }
 function log(action,r,detail=''){logEvent(requireVault().inventory,action,r,detail);}
 function counts(){
  const st=inventoryStats(requireVault().inventory);
  q('tokenStatTotal').textContent=st.total;
  q('tokenStatActive').textContent=st.active;
  q('tokenStatInactive').textContent=st.disabled+st.revoked;
  q('tokenStatExpired').textContent=st.expired+st.exhausted;
  q('tokenInventorySummary').textContent=st.total+' saved · '+st.active+' active · '+st.revoked+' revoked';
 }
 function showBatch(){
  batch.replaceChildren();
  for(const r of latest){
   const row=element('div',undefined,'token-batch-row');
   const code=element('code',r.code,'token-batch-code');
   const info=element('span',r.kind+' · '+(r.product||'general')+' · '+r.strength+' bit','hint');
   const copy=element('button','Copy','small-btn');copy.type='button';
   copy.addEventListener('click',wrap(async()=>{await clip(r.code);tell('Token copied to clipboard.');}));
   row.append(code,info,copy);batch.append(row);
  }
  if(!latest.length)batch.append(element('p','Generate your first batch to display new codes here.','hint'));
  q('tokenBatchCount').textContent=latest.length+' newly generated';
 }
 function showAudit(){
  audit.replaceChildren();
  const events=requireVault().inventory.events.slice(-35).reverse();
  for(const e of events){
   const row=element('div',undefined,'token-audit-row');
   row.append(element('time',e.at.slice(0,19).replace('T',' ')),element('strong',e.action),element('span',e.detail));audit.append(row);
  }
  if(!events.length)audit.append(element('p','Changes to your token inventory will appear here.','hint'));
 }
 function records(){
  const term=q('tokenSearch').value.trim().toLowerCase(),filter=q('tokenFilter').value;
  return requireVault().inventory.records.filter(r=>{
   const status=recordState(r);if(filter!=='all'&&status!==filter)return false;
   return !term||[r.code,r.label,r.product,r.assignedTo,r.kind,r.notes].join(' ').toLowerCase().includes(term);
  }).reverse();
 }
 function showInventory(){
  list.replaceChildren();const results=records(),visible=results.slice(0,180);
  q('tokenVisibleCount').textContent=results.length+' matching records'+(results.length>180?' · showing 180':'');
  for(const r of visible){
   const row=element('div',undefined,'token-record');
   const check=element('input');check.type='checkbox';check.checked=selected.has(r.id);check.setAttribute('aria-label','Select token '+(r.label||r.id));
   check.addEventListener('change',()=>{if(check.checked)selected.add(r.id);else selected.delete(r.id);});
   const main=element('div',undefined,'token-record-info');
   const name=element('strong',r.label||r.product||'Access token');
   const state=element('span',recordState(r).toUpperCase(),'token-state state-'+recordState(r));
   const details=element('small',r.kind+' · '+(r.product||'general')+' · '+r.uses+'/'+r.maxUses+' uses · '+r.strength+'-bit'+(r.expires?' · '+r.expires:''));
   const code=element('code',maskedToken(r.code),'token-masked');
   main.append(name,state,details,code);
   if(r.assignedTo)main.append(element('small','Recipient: '+r.assignedTo));
   const buttons=element('div',undefined,'token-record-actions');
   const reveal=element('button','Reveal','small-btn');
   reveal.addEventListener('click',()=>{
    const hidden=code.textContent===maskedToken(r.code);
    code.textContent=hidden?r.code:maskedToken(r.code);reveal.textContent=hidden?'Hide':'Reveal';lastActivity=Date.now();
   });
   const copy=element('button','Copy','small-btn');copy.addEventListener('click',wrap(async()=>{await clip(r.code);tell('Token copied.');}));
   buttons.append(reveal,copy);
   if(!r.revokedAt){
    const toggle=element('button',r.enabled?'Disable':'Enable','small-btn');
    toggle.addEventListener('click',wrap(async()=>{
     requireVault();r.enabled=!r.enabled;r.updated=stamp();log(r.enabled?'enabled':'disabled',r,r.label||r.product);
     await persist();render();tell('Token '+(r.enabled?'enabled':'disabled')+'.');
    }));
    const revoke=element('button','Revoke','small-btn token-danger');
    revoke.addEventListener('click',wrap(async()=>{
     if(!confirm('Revoke this code in the local owner inventory? Remote systems cannot be affected without a connected validation server.'))return;
     requireVault();r.revokedAt=stamp();r.updated=r.revokedAt;r.enabled=false;
     log('revoked',r,r.label||r.product);await persist();render();tell('Token revoked in this vault.');
    }));
    buttons.append(toggle,revoke);
   }
   row.append(check,main,buttons);list.append(row);
  }
  if(!visible.length)list.append(element('p','No tokens match your filters.','hint'));
 }
 function render(){if(!vault)return;counts();showBatch();showInventory();showAudit();}
 async function initialize(){
  const pass=q('tokenPassSetup').value,confirmPass=q('tokenPassConfirm').value;
  if(pass!==confirmPass)throw Error('Your passphrases do not match.');
  if(pass.length<12||pass.length>128)throw Error('Choose a passphrase between 12 and 128 characters.');
  if(await getEnvelope())throw Error('A vault already exists on this browser. Unlock or import it.');
  const created=await newEncryptedVault(pass);await putEnvelope(created.envelope);
  vault=created;lockedView('main');render();
  q('tokenPassSetup').value=q('tokenPassConfirm').value='';
  tell('New encrypted token vault created. Export an encrypted backup to protect it.');
 }
 q('tokenInitialize').addEventListener('click',wrap(async()=>{
  if(creating)return;creating=true;try{await initialize();}finally{creating=false;}
 }));
 q('tokenUnlockGo').addEventListener('click',wrap(async()=>{
  if(creating)return;creating=true;
  try{
   const envelope=await getEnvelope();
   if(!envelope){lockedView('setup');throw Error('Create your encrypted token vault first.');}
   const opened=await openEncryptedVault(envelope,q('tokenPassUnlock').value);
   vault=opened;lockedView('main');q('tokenPassUnlock').value='';render();
   tell('Encrypted inventory unlocked · '+vault.inventory.records.length+' tokens.');
  }finally{creating=false;}
 }));
 q('tokenLock').addEventListener('click',()=>lock('Token vault locked. Enter your passphrase to reopen it.'));
 q('tokenGenerate').addEventListener('click',wrap(async()=>{
  const v=requireVault(),howMany=Math.floor(Number(q('tokenQuantity').value)||1);
  if(howMany<1||howMany>MAX_BATCH)throw Error('Generate 1–50 tokens per batch.');
  if(v.inventory.records.length+howMany>MAX_TOTAL)throw Error('Maximum 5,000 records reached. Export an encrypted backup before starting a new vault.');
  const settings={
   prefix:q('tokenPrefix').value,strength:Number(q('tokenStrength').value),kind:q('tokenKind').value,
   product:q('tokenProduct').value.trim(),label:q('tokenLabel').value.trim(),
   assignedTo:q('tokenRecipient').value.trim(),notes:q('tokenNotes').value.trim(),
   expires:q('tokenExpires').value,maxUses:Number(q('tokenMaxUses').value)
  };
  q('tokenGenerate').disabled=true;
  try{
   latest=[];const hashes=new Set(v.inventory.records.map(x=>x.digest));
   for(let i=0;i<howMany;i++){
    let record=await makeRecord(settings);
    while(hashes.has(record.digest))record=await makeRecord(settings);
    hashes.add(record.digest);v.inventory.records.push(record);latest.push(record);
    log('created',record,record.kind+' · '+(record.product||'general'));
   }
   await persist();render();tell(howMany+' cryptographically random tokens created and encrypted in your private inventory.');
  }finally{q('tokenGenerate').disabled=false;}
 }));
 q('tokenValidate').addEventListener('click',wrap(async()=>{
  const v=requireVault(),value=q('tokenValidationInput').value.trim();
  if(!value)throw Error('Enter a token to verify.');
  const consume=q('tokenConsume').checked;
  const result=await evaluateToken(v.inventory,value,{consume,product:q('tokenValidateProduct').value.trim()});
  q('tokenValidationResult').textContent=result.ok?
   'VALID · '+(result.record.label||result.record.product||result.record.kind)+' · uses '+result.record.uses+'/'+result.record.maxUses:
   'DENIED · '+result.state.toUpperCase();
  q('tokenValidationResult').dataset.ok=String(result.ok);
  if(consume&&result.ok){await persist();render();}
  tell(consume&&result.ok?'Token marked as redeemed in this local inventory.':'Token lookup completed on this device.');
 }));
 q('tokenSearch').addEventListener('input',showInventory);
 q('tokenFilter').addEventListener('change',showInventory);
 q('tokenCopyBatch').addEventListener('click',wrap(async()=>{
  if(!latest.length)throw Error('Generate a token batch first.');
  await clip(latest.map(r=>r.code).join('\n'));tell(latest.length+' tokens copied.');
 }));
 async function shareBatch(){
  if(!latest.length)throw Error('Generate a token batch first.');
  const csv='code,type,product,label\n'+latest.map(r=>[r.code,r.kind,r.product,r.label].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n')+'\r\n';
  return await saveOrShare(encoder(csv,'text/csv'),dated('NEW-TOKENS','csv'));
 }
 q('tokenExportBatch').addEventListener('click',wrap(async()=>{const result=await shareBatch();tell(result==='shared'?'New codes shared to your device':'New code batch downloaded.');}));
 q('tokenExportCSV').addEventListener('click',wrap(async()=>{
  const inventory=requireVault().inventory;
  const result=await saveOrShare(encoder(inventoryCSV(inventory),'text/csv'),dated('INVENTORY','csv'));
  tell(result==='shared'?'CSV shared securely via your device':'Inventory CSV exported. Handle this unencrypted file carefully.');
 }));
 q('tokenExportTXT').addEventListener('click',wrap(async()=>{
  const result=await saveOrShare(encoder(inventoryTXT(requireVault().inventory),'text/plain'),dated('CODES','txt'));
  tell(result==='shared'?'TXT shared via device':'Codes TXT exported. Handle the unencrypted file carefully.');
 }));
 q('tokenExportEncrypted').addEventListener('click',wrap(async()=>{
  const v=requireVault();
  // The last successful save yields a sealed envelope; no encryption after the
  // user's tap so the platform can display the iPhone native Share sheet.
  await saveOrShare(encoder(JSON.stringify(v.envelope,null,2)),dated('ENCRYPTED-BACKUP','json'));
  tell('Encrypted vault backup exported. Keep your passphrase separately.');
 }));
 q('tokenImportFile').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>3500000)throw Error('Encrypted backup exceeds the 3.5 MB import limit.');
  const value=JSON.parse(await file.text());
  const pass=q('tokenImportPass').value;
  const next=await openEncryptedVault(value,pass);
  if(await getEnvelope()&&!confirm('Replace the encrypted local vault with this imported backup? Export your existing backup first.'))return;
  await putEnvelope(next.envelope);
  vault=next;lockedView('main');render();
  q('tokenImportPass').value='';e.target.value='';
  tell('Encrypted vault imported and unlocked · '+vault.inventory.records.length+' tokens.');
 }));
 q('tokenClearSelection').addEventListener('click',()=>{selected.clear();showInventory();});
 q('tokenBulkDisable').addEventListener('click',wrap(async()=>{
  const v=requireVault();if(!selected.size)throw Error('Select tokens in the inventory first.');
  let count=0;for(const r of v.inventory.records)if(selected.has(r.id)&&!r.revokedAt&&r.enabled){
   r.enabled=false;r.updated=stamp();log('disabled',r,'Bulk action');count++;
  }
  await persist();render();tell(count+' token(s) disabled locally.');
 }));
 q('tokenBulkRevoke').addEventListener('click',wrap(async()=>{
  const v=requireVault();if(!selected.size)throw Error('Select tokens in the inventory first.');
  if(!confirm('Permanently revoke '+selected.size+' selected local tokens?'))return;
  let count=0;for(const r of v.inventory.records)if(selected.has(r.id)&&!r.revokedAt){
   r.revokedAt=r.updated=stamp();r.enabled=false;log('revoked',r,'Bulk action');count++;
  }
  await persist();selected.clear();render();tell(count+' tokens revoked locally.');
 }));
 q('tokenRemoveRevoked').addEventListener('click',wrap(async()=>{
  const v=requireVault(),count=v.inventory.records.filter(x=>x.revokedAt).length;
  if(!count)throw Error('No revoked token records to remove.');
  if(!confirm('Remove '+count+' revoked records from your encrypted local inventory? Back up first.'))return;
  v.inventory.records=v.inventory.records.filter(x=>!x.revokedAt);
  log('cleanup',null,'Removed '+count+' revoked records');await persist();render();tell(count+' archived records removed.');
 }));
 q('tokenBackupAudit').addEventListener('click',wrap(async()=>{
  const inv=requireVault().inventory;
  await saveOrShare(encoder(JSON.stringify({schema:'proximus.token-audit/1',events:inv.events},null,2)),dated('AUDIT','json'));
 }));
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)hiddenAt=Date.now();
  else{if(hiddenAt&&Date.now()-hiddenAt>12*60000&&vault)lock('Vault locked after being away.');hiddenAt=0;}
 });
 const idle=setInterval(()=>{if(vault&&Date.now()-lastActivity>30*60000)lock('Token vault locked after 30 minutes of inactivity.');},60000);
 q('tokenVaultMain').addEventListener('pointerdown',()=>{lastActivity=Date.now();});
 window.addEventListener('pagehide',()=>{vault=null;clearInterval(idle);},{once:true});
 showBatch();lockedView('unlock');
 void getEnvelope().then(value=>{
  if(!vault)lockedView(value?'unlock':'setup');
  tell(value?'Encrypted token vault found. Enter its passphrase to continue.':'Create your owner vault to begin generating tokens.');
 }).catch(err=>{lockedView('setup');tell('Local storage status: '+err.message,true);});
}
