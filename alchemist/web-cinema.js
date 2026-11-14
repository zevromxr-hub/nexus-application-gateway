// PROXIMUS v3.6.1 Web Cinema Gateway — opt-in website/video embeds and saved-link library.
// Links are metadata only, never scraped, downloaded, proxied or uploaded by PROXIMUS.
import {$,download,textFile} from './core.js';
import {
 WEB_CINEMA_KEY,WEB_CINEMA_LIMIT,WEB_CINEMA_MAX_IMPORT,classifyWebCinemaUrl,
 normalizeWebCinemaLibrary,addWebCinemaLink,filterWebCinemaLibrary,
 webCinemaBackup,readWebCinemaBackup
} from './web-cinema-core.js';

export function initWebCinemaGateway(){
 const root=$('webCinemaGateway'),form=$('webCinemaForm'),input=$('webCinemaUrl'),
  title=$('webCinemaTitle'),collection=$('webCinemaCollection'),
  frame=$('webCinemaFrame'),iframe=$('webCinemaIframe'),video=$('webCinemaVideo'),
  blank=$('webCinemaEmpty'),now=$('webCinemaNow'),tag=$('webCinemaType'),
  status=$('webCinemaStatus'),list=$('webCinemaSavedList');
 if(!root||!form||!iframe||!video)return;
 let saved=[],active=null,currentSavedId=null,history=[],historyIndex=-1,lastPositionSave=0;
 try{saved=normalizeWebCinemaLibrary(JSON.parse(localStorage.getItem(WEB_CINEMA_KEY)||'[]'));}catch{}
 const findCurrent=()=>saved.find(item=>item.id===currentSavedId)||null;
 const say=(message,bad=false)=>{status.textContent=message;status.dataset.error=bad?'true':'false';};
 function write(){
  try{localStorage.setItem(WEB_CINEMA_KEY,JSON.stringify(saved));return true;}
  catch{say('Saved links are available this session, but browser storage is full/unavailable. Export a link backup.',true);return false;}
 }
 function capturePosition(){
  if(active?.kind!=='direct'||!currentSavedId)return;
  const item=findCurrent();
  if(!item||!Number.isFinite(video.currentTime))return;
  item.position=Math.max(0,Math.min(432000,video.currentTime));
  write();
 }
 function stopMedia(){
  if(active?.kind==='direct')capturePosition();
  video.pause();video.removeAttribute('src');video.load();video.hidden=true;
  iframe.removeAttribute('src');iframe.hidden=true;
  blank.hidden=false;
 }
 function controls(){
  $('webCinemaBack').disabled=historyIndex<=0;
  $('webCinemaForward').disabled=historyIndex<0||historyIndex>=history.length-1;
  $('webCinemaReload').disabled=!active;
  $('webCinemaExternal').disabled=!active;
  $('webCinemaFullscreen').disabled=!active||active.kind==='external';
 }
 function activeTitle(){
  return findCurrent()?.title||title.value.trim()||active?.label||'Video or website';
 }
 function navigate(raw,{addHistory=true}={}){
  let link;
  try{link=classifyWebCinemaUrl(raw);}
  catch(error){say(error.message,true);return false;}
  stopMedia();
  // Keep a single active Video Vault video audio source on iPhone and PC.
  const localPlayer=$('videoVaultPlayer');if(localPlayer&&!localPlayer.paused)localPlayer.pause();
  active=link;currentSavedId=saved.find(item=>item.url===link.url)?.id||null;
  input.value=link.url;
  if(currentSavedId){
   const item=findCurrent();
   if(item){title.value=item.title;collection.value=item.collection;item.lastOpen=Date.now();write();}
  }
  if(addHistory){
   history=history.slice(0,historyIndex+1);
   history.push(link.url);if(history.length>40)history.shift();
   historyIndex=history.length-1;
  }
  tag.textContent=({youtube:'YOUTUBE',vimeo:'VIMEO',website:'WEBSITE',direct:'VIDEO FILE',external:'EXTERNAL'})[link.kind]||'LINK';
  now.textContent=activeTitle();controls();renderSaved();
  if(link.kind==='external'){
   say(link.reason+' Use Open externally for this address.',true);return true;
  }
  blank.hidden=true;
  if(link.kind==='direct'){
   video.hidden=false;video.preload='metadata';video.src=link.url;video.load();
   say('Direct media ready. Tap Play. Codec support, range requests and source availability depend on the host and browser.');return true;
  }
  iframe.hidden=false;
  // Trusted official player embeds can use their own origin. Untrusted generic
  // websites run without allow-same-origin, popups or top-navigation permissions.
  const trusted=link.kind==='youtube'||link.kind==='vimeo';
  iframe.setAttribute('sandbox',trusted?'allow-scripts allow-same-origin allow-presentation':'allow-scripts allow-forms allow-presentation');
  iframe.setAttribute('allow',trusted?'fullscreen; picture-in-picture; encrypted-media; autoplay':'fullscreen; picture-in-picture');
  iframe.referrerPolicy=trusted?'strict-origin-when-cross-origin':'no-referrer';
  iframe.src=link.embed;
  say(trusted?'Official embedded player requested. If its owner blocks embedding, use Open externally.':
   'Website preview requested in an isolated frame. If it stays blank or blocks features, use Open externally.');
  return true;
 }
 function renderSaved(){
  const visible=filterWebCinemaLibrary(saved,{search:$('webCinemaSearch').value,filter:$('webCinemaFilter').value});
  $('webCinemaCount').textContent=saved.length+' / '+WEB_CINEMA_LIMIT+' links · '+visible.length+' shown';
  list.replaceChildren();
  if(!visible.length){
   const empty=document.createElement('p');empty.className='web-cinema-blank';
   empty.textContent=saved.length?'No links match these filters.':'No saved links yet. Paste an address and choose Save for later.';
   list.append(empty);return;
  }
  for(const item of visible){
   const card=document.createElement('article');card.className='web-cinema-saved-row';
   const label=document.createElement('div');label.className='web-cinema-saved-label';
   const strong=document.createElement('strong');strong.textContent=item.title;
   const subtitle=document.createElement('small');subtitle.textContent=
    item.collection+' · '+item.kind.toUpperCase()+
    (item.kind==='direct'&&item.position>0?' · Resume '+Math.floor(item.position)+'s':'')+
    ' · '+item.url;
   label.append(strong,subtitle);
   const actions=document.createElement('div');actions.className='web-cinema-saved-actions';
   const button=(caption,tip,fn)=>{
    const el=document.createElement('button');el.type='button';el.className='small-btn';
    el.textContent=caption;el.title=tip;el.setAttribute('aria-label',tip);
    el.addEventListener('click',fn);return el;
   };
   const play=button('▶ Watch','Open '+item.title,()=>{
    if(!root.open)root.open=true;
    title.value=item.title;collection.value=item.collection;
    navigate(item.url);frame.scrollIntoView({behavior:'auto',block:'nearest'});
   });
   const fav=button(item.favorite?'★':'☆',item.favorite?'Unfavorite '+item.title:'Favorite '+item.title,()=>{
    item.favorite=!item.favorite;write();renderSaved();
   });fav.classList.add('web-cinema-star');fav.setAttribute('aria-pressed',String(item.favorite));
   const edit=button('Edit','Edit title and collection for '+item.title,()=>{
    const name=prompt('Title for this saved link:',item.title);
    if(name===null)return;
    const folder=prompt('Collection:',item.collection);
    if(folder===null)return;
    item.title=String(name).replace(/[\u0000-\u001f]/g,' ').trim().slice(0,120)||item.title;
    item.collection=String(folder).replace(/[\u0000-\u001f]/g,' ').trim().slice(0,40)||'General';
    if(item.id===currentSavedId){title.value=item.title;collection.value=item.collection;now.textContent=item.title;}
    write();renderSaved();
   });
   const remove=button('Remove','Remove saved link '+item.title,()=>{
    if(!confirm('Remove "'+item.title+'" from saved links on this device? This does not delete the original online video.'))return;
    saved=saved.filter(x=>x.id!==item.id);
    if(currentSavedId===item.id)currentSavedId=null;
    write();renderSaved();say('Saved link removed. The original website or media was not changed.');
   });
   actions.append(play,fav,edit,remove);card.append(label,actions);list.append(card);
  }
 }
 function saveLink(){
  const raw=input.value.trim()||active?.url;
  if(!raw){say('Paste a website or video link first.',true);input.focus();return;}
  try{
   const output=addWebCinemaLink(saved,raw,title.value,collection.value);
   saved=output.items;
   if(active?.url===output.item.url)currentSavedId=output.item.id;
   if(!title.value.trim())title.value=output.item.title;
   if(!collection.value.trim())collection.value=output.item.collection;
   write();renderSaved();
   say(output.duplicate?'This link was already saved. Select Watch in your library to reopen it.':
    'Link saved privately to this browser. You can reopen it later under Saved links.');
  }catch(error){say(error.message,true);}
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();navigate(input.value);
 });
 $('webCinemaSave').addEventListener('click',saveLink);
 $('webCinemaBack').addEventListener('click',()=>{
  if(historyIndex>0){historyIndex--;navigate(history[historyIndex],{addHistory:false});}
 });
 $('webCinemaForward').addEventListener('click',()=>{
  if(historyIndex<history.length-1){historyIndex++;navigate(history[historyIndex],{addHistory:false});}
 });
 $('webCinemaReload').addEventListener('click',()=>{if(active)navigate(active.url,{addHistory:false});});
 $('webCinemaStop').addEventListener('click',()=>{
  stopMedia();say('Playback and website preview stopped. Use Reload or a saved link to view again.');
 });
 $('webCinemaExternal').addEventListener('click',()=>{
  if(!active)return;
  window.open(active.url,'_blank','noopener,noreferrer');
 });
 $('webCinemaFullscreen').addEventListener('click',async()=>{
  try{
   if(frame.requestFullscreen)await frame.requestFullscreen();
   else if(active?.kind==='direct'&&video.webkitEnterFullscreen)video.webkitEnterFullscreen();
   else say('Fullscreen is not available in this browser. Use the player controls or Open externally.');
  }catch{say('Fullscreen was denied by the browser. Use the player controls or Open externally.',true);}
 });
 video.addEventListener('loadedmetadata',()=>{
  const item=findCurrent();
  if(item&&item.position>0&&Number.isFinite(video.duration)&&item.position<video.duration-4){
   try{video.currentTime=item.position;}catch{}
   say('Restored direct-video position at '+Math.floor(item.position)+' seconds. Tap Play to resume.');
  }
 });
 video.addEventListener('timeupdate',()=>{
  if(Date.now()-lastPositionSave>=5000){lastPositionSave=Date.now();capturePosition();}
 });
 video.addEventListener('pause',capturePosition);
 video.addEventListener('ended',()=>{const item=findCurrent();if(item){item.position=0;write();renderSaved();}});
 video.addEventListener('error',()=>{
  if(!video.hidden)say('This source could not be played. It may be unavailable, expired, protected, or use a codec unsupported by this browser. Try Open externally.',true);
 });
 $('webCinemaSearch').addEventListener('input',renderSaved);
 $('webCinemaFilter').addEventListener('change',renderSaved);
 $('webCinemaExport').addEventListener('click',()=>{
  download(textFile(webCinemaBackup(saved)),'PROXIMUS-WEB-CINEMA-SAVED-LINKS.json');
  say('Link backup exported. It contains addresses and titles, not media files. Store it privately.');
 });
 $('webCinemaImport').addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';
  if(!file)return;
  try{
   if(file.size>WEB_CINEMA_MAX_IMPORT)throw Error('Link backup is too large (750 KB maximum).');
   const imported=readWebCinemaBackup(JSON.parse(await file.text()));
   const before=saved.length;saved=normalizeWebCinemaLibrary([...saved,...imported]);
   const added=saved.length-before;write();renderSaved();
   say('Imported '+added+' new saved links. Existing favorites and notes were preserved.');
  }catch(error){say('Import failed: '+error.message,true);}
 });
 root.addEventListener('toggle',()=>{if(!root.open&&active){stopMedia();say('Viewer paused while Gateway is collapsed. Saved links remain available.');}});
 document.addEventListener('proximus-view-changed',event=>{
  if(event.detail?.studio!=='videos'&&active){stopMedia();}
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&active){stopMedia();}
 });
 // Starting a locally saved Video Vault film stops the separate external viewer.
 $('videoVaultPlayer')?.addEventListener('play',()=>{
  if(active&&(!video.hidden||!iframe.hidden)){stopMedia();say('External preview paused while playing a local Video Vault video.');}
 });
 window.addEventListener('storage',event=>{
  if(event.key!==WEB_CINEMA_KEY)return;
  try{saved=normalizeWebCinemaLibrary(JSON.parse(event.newValue||'[]'));renderSaved();}
  catch{}
 });
 controls();renderSaved();
}
