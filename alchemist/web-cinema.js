// PROXIMUS v3.6.1 Web Cinema Gateway — opt-in website/video embeds and saved-link library.
// Links are metadata only, never scraped, downloaded, proxied or uploaded by PROXIMUS.
import {$,download,textFile} from './core.js';
import {
 WEB_CINEMA_KEY,WEB_CINEMA_LIMIT,WEB_CINEMA_MAX_IMPORT,classifyWebCinemaUrl,
 normalizeWebCinemaLibrary,addWebCinemaLink,filterWebCinemaLibrary,
 webCinemaBackup,readWebCinemaBackup
} from './web-cinema-core.js';
import {WEB_CINEMA_COMPAT_MODE_KEY,normalizeFrameMode,webCinemaFramePolicy} from './web-cinema-compat.js';
import {WEB_CINEMA_SOURCE_MODES,normalizeWebCinemaSourceMode,parseWebCinemaPlayerInput,
 normalizeSavedPlayback,webCinemaPlaybackPlan,displayWebCinemaUrl} from './web-cinema-source.js';

export function initWebCinemaGateway(){
 const root=$('webCinemaGateway'),form=$('webCinemaForm'),input=$('webCinemaUrl'),
  title=$('webCinemaTitle'),collection=$('webCinemaCollection'),
  frame=$('webCinemaFrame'),iframe=$('webCinemaIframe'),video=$('webCinemaVideo'),
  blank=$('webCinemaEmpty'),now=$('webCinemaNow'),tag=$('webCinemaType'),
  status=$('webCinemaStatus'),list=$('webCinemaSavedList');
 if(!root||!form||!iframe||!video)return;
 let saved=[],active=null,currentSavedId=null,history=[],historyIndex=-1,lastPositionSave=0;
 const help=$('webCinemaHelp'),helpText=$('webCinemaHelpText');
 const browserIsMobile=/iPhone|iPad|iPod/i.test(navigator.userAgent||'');
 let helpTimer=null,mode='compatible',directTrial=false;
 let draftSource=null,draftForUrl='',activeSource={playerMode:'auto',playerUrl:''};
 const sourceMode=$('webCinemaPlaybackMode'),sourceCode=$('webCinemaEmbedCode'),
  sourceStatus=$('webCinemaSourceStatus');
 function sourceMessage(message,bad=false){
  sourceStatus.textContent=message;sourceStatus.dataset.error=bad?'true':'false';
 }
 function setSourceFields(source){
  const settings=normalizeSavedPlayback(source,{appOrigin:location.origin});
  sourceMode.value=settings.playerMode;
  sourceCode.value=settings.playerUrl;
 }
 function readSourceFields(raw){
  const sourceModeValue=normalizeWebCinemaSourceMode(sourceMode.value);
  if(sourceModeValue==='auto')return {playerMode:'auto',playerUrl:''};
  if(sourceModeValue==='website')return {playerMode:'website',playerUrl:''};
  const original=classifyWebCinemaUrl(raw);
  let rawPlayer=sourceCode.value.trim();
  if(!rawPlayer&&sourceModeValue==='embed'){
   if(!original.embed)throw Error('Paste the provider’s official iframe Embed code or HTTPS player URL in Player source.');
   rawPlayer=original.embed;
  }
  if(!rawPlayer&&sourceModeValue==='native')rawPlayer=original.url;
  return parseWebCinemaPlayerInput(rawPlayer,{hint:sourceModeValue,appOrigin:location.origin});
 }
 function saveSourceIfBookmarked(raw,source){
  let url;try{url=classifyWebCinemaUrl(raw).url;}catch{return;}
  const row=saved.find(item=>item.url===url);
  if(!row)return;
  const parsed=normalizeSavedPlayback(source,{appOrigin:location.origin});
  row.playerMode=parsed.playerMode;row.playerUrl=parsed.playerUrl;
  write();renderSaved();
 }

 try{mode=normalizeFrameMode(localStorage.getItem(WEB_CINEMA_COMPAT_MODE_KEY));}catch{}
 $('webCinemaFrameMode').value=mode;
 function showHelp(message){
  if(!help||!helpText)return;
  helpText.textContent=message;help.hidden=false;
 }
 function clearHelp(){
  if(helpTimer!==null){clearTimeout(helpTimer);helpTimer=null;}
  if(help)help.hidden=true;
 }
 try{saved=normalizeWebCinemaLibrary(JSON.parse(localStorage.getItem(WEB_CINEMA_KEY)||'[]'));}catch{}
 const findCurrent=()=>saved.find(item=>item.id===currentSavedId)||null;
 const say=(message,bad=false)=>{status.textContent=message;status.dataset.error=bad?'true':'false';};
 function write(){
  try{localStorage.setItem(WEB_CINEMA_KEY,JSON.stringify(saved));return true;}
  catch{say('Saved links are available this session, but browser storage is full/unavailable. Export a link backup.',true);return false;}
 }
 function capturePosition(){
  if(active?.kind!=='direct'||directTrial||!currentSavedId)return;
  const item=findCurrent();
  if(!item||!Number.isFinite(video.currentTime))return;
  item.position=Math.max(0,Math.min(432000,video.currentTime));
  write();
 }
 function stopMedia(){
  clearHelp();
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
  $('webCinemaTryVideo').disabled=!active||active.kind!=='website';
 }
 function activeTitle(){
  return findCurrent()?.title||title.value.trim()||active?.label||'Video or website';
 }
 function navigate(raw,{addHistory=true,forceVideo=false,sourceOverride=null}={}){
  let detected,link;
  try{
   detected=classifyWebCinemaUrl(raw);
   const stored=saved.find(item=>item.url===detected.url);
   const source=forceVideo?{playerMode:'native',playerUrl:detected.url}:
    sourceOverride||stored||(draftForUrl===detected.url?draftSource:null)||{playerMode:'auto',playerUrl:''};
   activeSource=normalizeSavedPlayback(source,{appOrigin:location.origin});
   link=webCinemaPlaybackPlan(detected.url,source,location.origin);
  }catch(error){say(error.message,true);sourceMessage(error.message,true);return false;}
  stopMedia();
  directTrial=forceVideo&&detected.kind==='website';
  // Keep a single active Video Vault video audio source on iPhone and PC.
  const localPlayer=$('videoVaultPlayer');if(localPlayer&&!localPlayer.paused)localPlayer.pause();
  active=link;currentSavedId=saved.find(item=>item.url===detected.url)?.id||null;
  input.value=detected.url;
  if(currentSavedId){
   const item=findCurrent();
   if(item){title.value=item.title;collection.value=item.collection;item.lastOpen=Date.now();write();}
  }
  if(addHistory){
   history=history.slice(0,historyIndex+1);
   history.push(detected.url);if(history.length>40)history.shift();
   historyIndex=history.length-1;
  }
  if(!forceVideo){
   setSourceFields(activeSource);
   draftSource=activeSource;draftForUrl=detected.url;
  }
  tag.textContent=({
   youtube:'YOUTUBE',vimeo:'VIMEO','official-video':'VIDEO PLAYER','custom-embed':'EMBED PLAYER',
   website:'WEBSITE',direct:'VIDEO FILE',external:'EXTERNAL'
  })[link.kind]||'LINK';
  now.textContent=activeTitle();controls();renderSaved();
  if(link.kind==='external'){
   say((link.reason||'This link needs its own website.')+' Use Open externally, or add an official embeddable player URL under Player source.',true);
   return true;
  }
  blank.hidden=true;
  if(link.kind==='direct'){
   video.hidden=false;video.preload='metadata';video.setAttribute('playsinline','');
   video.setAttribute('webkit-playsinline','');video.src=link.mediaUrl||link.url;video.load();
   say(directTrial?'Testing as a direct video stream. It must serve real video data, not an ordinary web page.':
    'Native video ready. Tap Play. iPhone Safari can play compatible direct media, including HLS where supported.');
   return true;
  }
  const policy=webCinemaFramePolicy(link.kind,link.embed,{appOrigin:location.origin,mode});
  if(!policy.allowed){
   blank.hidden=false;active={...link,kind:'external'};controls();
   say(policy.reason+' Use a permitted external embed address or Open externally.',true);
   return true;
  }
  iframe.setAttribute('sandbox',policy.sandbox);
  iframe.setAttribute('allow',policy.allow);
  iframe.referrerPolicy=policy.referrerPolicy;
  iframe.loading=policy.loading;
  iframe.hidden=false;
  iframe.src=link.embed;
  say(link.kind==='website'?'Website preview requested. If the site blocks framing, try its official Embed option instead.':
   'Video player requested inside PROXIMUS. Tap the provider’s Play control; permission to embed is controlled by the provider.');
  if(browserIsMobile){
   const target=link.url;
   helpTimer=setTimeout(()=>{
    if(active?.url!==target||iframe.hidden||!root.open)return;
    showHelp('Still blank? Copy the video site’s Share → Embed code into Player source, or try a direct video address. Some sites prohibit embedded playback.');
   },8500);
  }
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
    item.collection+' · '+(item.playerMode&&item.playerMode!=='auto'?item.playerMode.toUpperCase()+' PLAYER':item.kind.toUpperCase())+
    (item.kind==='direct'&&item.position>0?' · Resume '+Math.floor(item.position)+'s':'')+
    ' · '+displayWebCinemaUrl(item.url);
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
    setSourceFields(item);draftForUrl=item.url;draftSource=item;
    navigate(item.url,{sourceOverride:item});frame.scrollIntoView({behavior:'auto',block:'nearest'});
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
   const entry=saved.find(item=>item.id===output.item.id);
   const source=(draftForUrl===output.item.url?draftSource:null)||(active?.url===output.item.url?activeSource:null);
   if(source&&entry){
    const playback=normalizeSavedPlayback(source,{appOrigin:location.origin});
    entry.playerMode=playback.playerMode;entry.playerUrl=playback.playerUrl;
   }
   if(active?.url===output.item.url)currentSavedId=output.item.id;
   if(!title.value.trim())title.value=output.item.title;
   if(!collection.value.trim())collection.value=output.item.collection;
   write();renderSaved();
   say(output.duplicate?'This link was already saved. Select Watch in your library to reopen it.':
    'Link saved privately to this browser. You can reopen it later under Saved links.');
  }catch(error){say(error.message,true);}
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();
  try{
   const source=readSourceFields(input.value);
   const url=classifyWebCinemaUrl(input.value).url;
   draftForUrl=url;draftSource=source;
   navigate(url,{sourceOverride:source});
  }catch(error){sourceMessage(error.message,true);say(error.message,true);}
 });
 $('webCinemaApplySource').addEventListener('click',()=>{
  try{
   let url=input.value.trim();
   if(!url&&sourceCode.value.trim()){
    const parsed=parseWebCinemaPlayerInput(sourceCode.value,{hint:sourceMode.value,appOrigin:location.origin});
    url=parsed.playerUrl;input.value=url;
   }
   if(!url)throw Error('Paste a video or website address first.');
   const source=readSourceFields(url);
   const canonical=classifyWebCinemaUrl(url).url;
   draftForUrl=canonical;draftSource=source;
   if(navigate(canonical,{sourceOverride:source})){
    saveSourceIfBookmarked(canonical,source);
    sourceMessage(source.playerMode==='auto'?'Automatic player detection restored.':
     'Source applied. Save for later to retain this exact player configuration.');
   }
  }catch(error){sourceMessage(error.message,true);say(error.message,true);}
 });
 $('webCinemaResetSource').addEventListener('click',()=>{
  const source={playerMode:'auto',playerUrl:''};
  sourceMode.value='auto';sourceCode.value='';
  let url;try{url=classifyWebCinemaUrl(input.value).url;}catch{sourceMessage('Player settings reset.');return;}
  draftSource=source;draftForUrl=url;saveSourceIfBookmarked(url,source);
  navigate(url,{sourceOverride:source,addHistory:false});
  sourceMessage('Player restored to automatic detection.');
 });

 $('webCinemaSave').addEventListener('click',saveLink);
 $('webCinemaBack').addEventListener('click',()=>{
  if(historyIndex>0){historyIndex--;navigate(history[historyIndex],{addHistory:false});}
 });
 $('webCinemaForward').addEventListener('click',()=>{
  if(historyIndex<history.length-1){historyIndex++;navigate(history[historyIndex],{addHistory:false});}
 });
 $('webCinemaReload').addEventListener('click',()=>{if(active)navigate(active.url,{addHistory:false,sourceOverride:activeSource});});
 $('webCinemaTryVideo').addEventListener('click',()=>{
  if(active?.kind==='website')navigate(active.url,{addHistory:false,forceVideo:true});
 });
 $('webCinemaFrameMode').addEventListener('change',event=>{
  mode=normalizeFrameMode(event.target.value);
  try{localStorage.setItem(WEB_CINEMA_COMPAT_MODE_KEY,mode);}catch{}
  if(active&&['website','youtube','vimeo','official-video','custom-embed'].includes(active.kind))navigate(active.url,{addHistory:false,sourceOverride:activeSource});
  else say('Viewing mode saved. It applies to the next embedded website or player you open.');
 });
 $('webCinemaHelpDismiss').addEventListener('click',clearHelp);
 iframe.addEventListener('error',()=>{
  if(!iframe.hidden)showHelp('This website or player could not be displayed. Try Reload or a different viewing mode. Some sites do not permit embedding.');
 });
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
  if(!video.hidden){
   say(directTrial?'This URL did not provide decodable video data. It may be a webpage rather than a direct media file. Tap Reload to return to the website preview.':
    'This source could not be played. It may be unavailable, expired, protected, or use a codec unsupported by this browser. Try Reload or Open externally.',true);
   showHelp('Native playback could not read this URL. Video pages and session-protected links are not necessarily direct video files.');
  }
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
