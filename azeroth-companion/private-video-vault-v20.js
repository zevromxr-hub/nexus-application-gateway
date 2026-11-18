/* NEXUS v20 — private media UI. Only ciphertext and encrypted metadata reach IndexedDB.
 * All names, decrypted blobs and keys remain in memory while unlocked.
 * Lock clears active player URLs and plaintext UI, including history/visibility transitions.
 */
(()=>{'use strict';
const core=window.NexusSecureVideoVaultV20;
if(!core||!document.getElementById('nv20Gate'))return;
const $=id=>document.getElementById(id);
const el=(tag,cls,content)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(content!==undefined)node.textContent=String(content);return node};
const state={key:null,clips:[],busy:false,epoch:0,url:null,gate:'checking',hiddenAt:0,timer:null};
function say(message,error=false){
 $('nv20Alert').textContent=message;$('nv20Alert').dataset.error=String(error);
}
function setBusy(value){
 state.busy=!!value;
 for(const id of ['nv20GateSubmit','nv20Restore','nv20Backup','nv20Lock','nv20Persist']){
  const button=$(id);if(button)button.disabled=value||(id==='nv20Restore'&&!$('nv20RestoreFile').files.length);
 }
 $('nv20Files').disabled=value;
}
function gate(mode){
 state.gate=mode;
 const configured=mode==='unlock',creating=mode==='create';
 $('nv20Gate').hidden=false;$('nv20Workspace').hidden=true;
 $('nv20ConfirmWrap').hidden=!creating;
 $('nv20GateLabel').textContent=configured?'RETURN TO YOUR ARCHIVE':creating?'FIRST-TIME OWNER SETUP':'SECURE BROWSER REQUIREMENTS';
 $('nv20GateTitle').textContent=configured?'Unlock your encrypted collection.':creating?'Create your private vault password.':'Encrypted storage unavailable.';
 $('nv20GateDescription').textContent=configured?
  'Your password unlocks your encrypted local library. The password and decrypted video bytes never leave this browser.':
  creating?'Choose a strong private password of at least 12 characters. Keep an encrypted backup and the password in safe places.':
  'This page requires HTTPS, Web Crypto and IndexedDB. Browser private mode may not support durable storage.';
 $('nv20GateSubmit').textContent=configured?'UNLOCK PRIVATE VIDEOS':creating?'CREATE ENCRYPTED VAULT':'UNAVAILABLE';
 $('nv20GateSubmit').disabled=!configured&&!creating;
 $('nv20RestoreEntry').hidden=!creating;
 $('nv20Password').value='';$('nv20Confirm').value='';
 $('nv20Password').required=configured||creating;
 $('nv20Confirm').required=creating;
 $('nv20Restore').disabled=!$('nv20RestoreFile').files.length;
}
function closePlayer(){
 const video=$('nv20Video');
 try{video.pause();video.removeAttribute('src');video.load()}catch(_){}
 if(state.url){URL.revokeObjectURL(state.url);state.url=null}
 $('nv20PlayerPanel').hidden=true;
}
function lock(reason='Private vault locked. Enter your password to see your encrypted videos.'){
 state.epoch++;
 state.key=null;state.clips=[];
 closePlayer();
 $('nv20Grid').replaceChildren();$('nv20Search').value='';
 $('nv20Empty').hidden=false;gate('unlock');
 say(reason);
}
function available(){
 if(!state.key){say('Unlock your vault before performing this action.',true);return false}
 if(state.busy){say('An encrypted vault operation is already running. Finish it before starting another.');return false}
 return true;
}
function printableSize(n){
 if(!Number.isFinite(n)||n<0)return '—';
 if(n<1048576)return Math.ceil(n/1024)+' KB';
 return (n/1048576).toFixed(n/1048576<10?1:0)+' MB';
}
async function refreshStorage(){
 const quota=await core.estimate().catch(()=>null);
 $('nv20Quota').textContent=quota&&quota.quota?printableSize(quota.usage)+' / '+printableSize(quota.quota):'BROWSER-DEFINED';
}
function updateNumbers(){
 $('nv20Count').textContent=String(state.clips.length);
 $('nv20Size').textContent=printableSize(state.clips.reduce((a,c)=>a+(c.size||0),0));
 const limit=core.fileLimit();$('nv20Limit').textContent=printableSize(limit);
 $('nv20LimitNote').textContent='Maximum individual clip: '+printableSize(limit)+'. This is a safety cap, not a storage guarantee. Playback memory and codec support vary by device.';
 refreshStorage();
}
function button(name,action,id,cls){
 const item=el('button',cls,name);item.type='button';item.dataset.action=action;
 if(id)item.dataset.id=id;
 return item;
}
function draw(){
 const host=$('nv20Grid');host.replaceChildren();
 const query=$('nv20Search').value.trim().toLowerCase();
 const matches=state.clips.filter(c=>(c.name+' '+(c.note||'')).toLowerCase().includes(query));
 $('nv20Empty').hidden=matches.length!==0;
 $('nv20Empty').textContent=state.clips.length?
  'Nothing matched that private search. Try a different name or note.':
  'Your vault is empty. Import a video to create your first encrypted collection entry.';
 for(const info of matches){
  const card=el('article','nv20-clip'),cover=el('div','nv20-clip-cover');
  const fav=button(info.favorite?'★':'☆','favorite',info.id,'nv20-favorite');
  fav.setAttribute('aria-label',info.favorite?'Remove '+info.name+' from favorites':'Favorite '+info.name);
  cover.append(el('span','nv20-play-mark','▶'),el('span','nv20-cover-code',info.damaged?'RECORD INTEGRITY ERROR':'CIPHER SEALED · LOCAL'),fav);
  const content=el('div','nv20-clip-body');
  content.append(el('strong','nv20-clip-title',info.name),el('span','nv20-clip-meta',printableSize(info.size)+' · '+(info.createdAt?new Date(info.createdAt).toLocaleDateString():'Date unavailable')));
  if(info.note)content.append(el('p','nv20-clip-note',info.note));
  const actions=el('div','nv20-clip-actions');
  actions.append(button('▶ PLAY','play',info.id),button('✎ EDIT','edit',info.id),button('DELETE','delete',info.id));
  content.append(actions);card.append(cover,content);host.append(card);
 }
 updateNumbers();
}
async function refresh(){
 const key=state.key,epoch=state.epoch;
 const rows=await core.list(key);
 if(!state.key||state.key!==key||state.epoch!==epoch)return;
 state.clips=rows;
 draw();
}
function beginUnlocked(key){
 state.epoch++;
 state.key=key;
 $('nv20Gate').hidden=true;$('nv20Workspace').hidden=false;
 say('Your private encrypted vault is unlocked on this device. Lock it when finished.');
 updateNumbers();
}
$('nv20PasswordForm').addEventListener('submit',async event=>{
 event.preventDefault();if(state.busy)return;
 const password=$('nv20Password').value,create=state.gate==='create';
 if(password.length<12||password.length>512){say('Use a password of at least 12 characters.',true);return}
 if(create&&password!==$('nv20Confirm').value){say('The confirmation password does not match.',true);return}
 setBusy(true);say(create?'Creating a password-protected encrypted vault…':'Checking your private password…');
 try{
  const key=create?await core.create(password):await core.unlock(password);
  beginUnlocked(key);await refresh();
 }catch(error){say(error.message||'Unable to unlock local encrypted storage.',true)}
 finally{$('nv20Password').value='';$('nv20Confirm').value='';setBusy(false)}
});
$('nv20Lock').addEventListener('click',()=>{
 if(state.busy){say('An encrypted operation is running. Let it finish before locking.');return}
 lock();
});
$('nv20Files').addEventListener('change',async event=>{
 const files=Array.from(event.target.files||[]);
 event.target.value='';
 if(!files.length||!available())return;
 const key=state.key,epoch=state.epoch;setBusy(true);
 let success=0;
 try{
  for(const [position,file] of files.entries()){
   if(state.key!==key||state.epoch!==epoch)throw Error('Vault locked; file import cancelled');
   say('Encrypting '+(position+1)+' of '+files.length+': '+file.name+'…');
   await core.importVideo(key,file,(done,total)=>{
    say('Encrypting '+(position+1)+' of '+files.length+' · '+done+'/'+total+' parts locally. Do not navigate away until finished.');
   },()=>state.key===key&&state.epoch===epoch);
   success++;
  }
  await refresh();
  say('Secured '+success+' video'+(success===1?'':'s')+' with AES-256-GCM. Export an encrypted archive for safekeeping.');
 }catch(error){await refresh().catch(()=>{});say('Imported '+success+' successfully. '+(error.message||'A browser storage operation failed.'),true)}
 finally{setBusy(false)}
});
$('nv20Search').addEventListener('input',()=>{if(state.key)draw()});
$('nv20Grid').addEventListener('click',async event=>{
 const hit=event.target.closest('button[data-action]');if(!hit||!available())return;
 const id=hit.dataset.id,info=state.clips.find(c=>c.id===id);if(!info)return;
 const act=hit.dataset.action;
 if(act==='edit'){
  if(info.damaged){say('A damaged entry cannot be edited. Restore your original encrypted backup.',true);return}
  const card=hit.closest('.nv20-clip'),old=card.querySelector('.nv20-clip-editor');
  if(old){old.remove();return}
  const editor=el('form','nv20-clip-editor');
  const title=el('label','','VIDEO TITLE');
  const name=el('input');name.value=info.name;name.maxLength=220;name.required=true;name.setAttribute('aria-label','Private video title');title.append(name);
  const noteLabel=el('label','','PERSONAL NOTES');
  const notes=el('textarea');notes.value=info.note||'';notes.maxLength=450;notes.rows=3;notes.setAttribute('aria-label','Private video notes');noteLabel.append(notes);
  const save=el('button','','SAVE ENCRYPTED DETAILS');save.type='submit';
  editor.append(title,noteLabel,save);
  editor.addEventListener('submit',async e=>{
   e.preventDefault();if(!available())return;
   setBusy(true);
   try{await core.updateInfo(state.key,id,{name:name.value,note:notes.value});await refresh();say('Private title and notes re-encrypted and saved.')}
   catch(error){say(error.message||'Cannot save encrypted details.',true)}
   finally{setBusy(false)}
  });
  card.querySelector('.nv20-clip-body').append(editor);
  name.focus();return;
 }
 if(act==='delete'){
  if(!confirm('Permanently delete this encrypted video from THIS browser? This cannot be undone without an earlier .nxvault backup.'))return;
  setBusy(true);
  try{if($('nv20NowPlaying').dataset.id===id)closePlayer();
    await core.removeClip(id);await refresh();say('Encrypted video deleted from this device. Other saved companion data was untouched.');
  }catch(error){say(error.message||'Cannot delete encrypted video.',true)}
  finally{setBusy(false)}
  return;
 }
 if(act==='favorite'){
  if(info.damaged){say('Cannot modify damaged encrypted metadata.',true);return}
  setBusy(true);
  try{await core.updateInfo(state.key,id,{favorite:!info.favorite});await refresh();say('Encrypted favorite preference saved.')}
  catch(error){say(error.message||'Cannot update favorite.',true)}
  finally{setBusy(false)}return;
 }
 if(act==='play'){
  if(info.damaged){say('Video metadata integrity failed. Restore from an earlier encrypted backup.',true);return}
  const key=state.key,epoch=state.epoch;setBusy(true);closePlayer();
  say('Decrypting '+info.name+' to temporary playback memory…');
  try{
   const blob=await core.playback(key,id,(done,total)=>{
    say('Decrypting encrypted parts into playback memory: '+done+'/'+total+'.');
   },()=>state.key===key&&state.epoch===epoch);
   if(state.key!==key||state.epoch!==epoch)throw Error('Vault locked during decryption');
   state.url=URL.createObjectURL(blob);
   const video=$('nv20Video');video.src=state.url;video.load();
   $('nv20NowPlaying').textContent=info.name;$('nv20NowPlaying').dataset.id=id;
   $('nv20PlayerPanel').hidden=false;
   $('nv20PlayerPanel').scrollIntoView({block:'start',behavior:'smooth'});
   say('Private player is ready. Press Play below; no video bytes were uploaded.');
  }catch(error){closePlayer();say(error.message||'Unable to decrypt this video.',true)}
  finally{setBusy(false)}
 }
});
$('nv20Stop').addEventListener('click',()=>{closePlayer();say('Player closed. Temporary decrypted media URL revoked.')});
$('nv20Backup').addEventListener('click',async()=>{
 if(!available())return;
 setBusy(true);say('Preparing a ciphertext-only encrypted backup. No video is decrypted or uploaded.');
 try{
  const blob=await core.exportEncrypted(done=>{if(done%8===0)say('Collecting encrypted archive parts: '+done+' segments…')});
  const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='nexus-private-video-vault-v20.nxvault';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  say('Encrypted archive prepared ('+printableSize(blob.size)+'). Save it safely along with your separately stored password.');
 }catch(error){say('Backup failed: '+(error.message||'Browser could not build the archive'),true)}
 finally{setBusy(false)}
});
$('nv20RestoreFile').addEventListener('change',event=>{
 $('nv20Restore').disabled=!(event.target.files&&event.target.files.length);
 if(event.target.files?.[0])say('Encrypted archive selected. Confirm restore only if this browser has no existing vault.');
});
$('nv20Restore').addEventListener('click',async()=>{
 const file=$('nv20RestoreFile').files?.[0];if(!file||state.busy||state.gate!=='create')return;
 if(!confirm('Restore this encrypted archive into this EMPTY local browser vault? The original password is still required to unlock. No public upload occurs.'))return;
 setBusy(true);say('Restoring encrypted bytes locally…');
 try{
  const result=await core.restoreEncrypted(file,(done,total)=>{
   if(done%6===0||done===total)say('Restoring encrypted parts '+done+'/'+total+'…');
  });
  gate('unlock');
  say('Restored '+result.clips+' encrypted video records. Enter the ORIGINAL backup password to open them.');
 }catch(error){say('Could not restore the encrypted archive: '+(error.message||'Invalid or interrupted backup'),true)}
 finally{$('nv20RestoreFile').value='';setBusy(false)}
});
$('nv20Persist').addEventListener('click',async()=>{
 if(!available())return;
 try{
  if(typeof navigator.storage?.persist!=='function'){$('nv20Persistence').textContent='This browser does not offer a persistent-storage request. Keep a backup.';return}
  const granted=await navigator.storage.persist();
  $('nv20Persistence').textContent=granted?
   'This browser granted persistent-site-storage mode. Backups remain necessary for device loss or manual browser-data clearing.':
   'Persistent storage was not granted. Maintain an encrypted backup outside this browser.';
  refreshStorage();
 }catch(_){$('nv20Persistence').textContent='Persistent storage request was unavailable. Keep an encrypted backup.'}
});
function handleHidden(){
 if(document.hidden){
  state.hiddenAt=Date.now();
  state.timer=setTimeout(()=>{
   if(document.hidden&&state.key&&!state.busy)lock('The vault automatically locked after remaining in the background.');
  },45000);
 }else{
  clearTimeout(state.timer);state.timer=null;
  if(state.hiddenAt&&Date.now()-state.hiddenAt>=45000&&state.key&&!state.busy){
   lock('The private vault was locked after the app was in the background.');
  }
  state.hiddenAt=0;
 }
}
document.addEventListener('visibilitychange',handleHidden);
window.addEventListener('pagehide',()=>{if(state.key)lock('Vault locked when navigating away.');});
(async()=>{
 try{
  await core.open();
  const meta=await core.get('config','vault');
  if(!meta)gate('create');else gate('unlock');
  say(meta?'Encrypted private vault detected on this browser. Enter your password to unlock.':
   'No private videos exist on this browser yet. Create a password or restore an encrypted backup.');
 }catch(error){gate('error');say(error.message||'Secure browser storage is unavailable.',true)}
})();
})();