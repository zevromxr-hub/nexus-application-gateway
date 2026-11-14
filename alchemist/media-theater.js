// PROXIMUS Asset Alchemist v2.4 — Media Theater
// Local playlist, cinematic playback, real Web Audio visualizer and poster captures.
// Queue items are session-local unless the user chooses to save their own music in browser IndexedDB.
import {$,bytes,safe,stem,notice,blobCanvas,download,textFile,wrap} from './core.js';
import {initLocalMusicLibrary} from './music-library.js';
import {audioTrackId,isLocalAudio} from './music-library-core.js';

const MAX_QUEUE=80,MAX_FILE=400000000;
const THEMES={
 violet:['#b692ff','#6d55ea','#edb8ff'],
 cyan:['#7fefff','#2fbdff','#b8fff9'],
 gold:['#ffdc9d','#db9a3d','#fff0bf'],
 ember:['#ffa09c','#eb496c','#ffd5a8'],
 emerald:['#80f8bc','#25be9a','#e2fff5']
};
const audioExt=/\.(?:mp3|wav|ogg|m4a|aac|flac|opus)$/i;
const videoExt=/\.(?:mp4|m4v|mov|webm|ogv|ogg)$/i;
const imageExt=/\.(?:gif|png|jpe?g|webp)$/i;
export function mediaKind(file){
 const type=String(file?.type||''),name=String(file?.name||'');
 if(type.startsWith('audio/')||audioExt.test(name))return 'audio';
 if(type.startsWith('video/')||videoExt.test(name))return 'video';
 if(type.startsWith('image/')||imageExt.test(name))return 'image';
 return null;
}
export function formatTime(seconds){
 if(!Number.isFinite(seconds)||seconds<0)return '0:00';
 const s=Math.floor(seconds);
 return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
}
export function playlistManifest(items){
 return {generator:'PROXIMUS | ASSET ALCHEMIST',type:'local-session-playlist',
  exported_at:new Date().toISOString(),
  items:items.map((i,index)=>({index:index+1,name:safe(i.file.name),type:i.kind,bytes:i.file.size}))};
}
export function initMediaTheater(app){
 const input=$('theaterFiles'),video=$('theaterVideo'),audio=$('theaterAudio'),image=$('theaterImage');
 const canvas=$('theaterCanvas'),ctx=canvas.getContext('2d'),list=$('theaterPlaylist');
 const label=$('theaterNow'),info=$('theaterInfo'),play=$('theaterPlay'),capture=$('theaterCapture');
 const level=$('theaterLevels'),status=$('theaterStatus');
 const playlist=[];let current=-1,mode='off',shuffle=false,visualMode='bars',color='violet',currentURL=null;
 let audioContext=null,analyser=null,frequency=null,timeDomain=null,nodes=new Map(),visualized=false;
 let playing=false,raf=0,tick=0,pausedByVisibility=false,loopA=null,loopB=null;
 let themeImage=null;
 const FAVORITES='proximus-theater-favorites-v2';
 let favorites=[];try{favorites=JSON.parse(localStorage.getItem(FAVORITES)||'[]');if(!Array.isArray(favorites))favorites=[];}catch(e){}
 function keepFavorites(){try{localStorage.setItem(FAVORITES,JSON.stringify(favorites.slice(0,250)));}catch(e){}}
 const mini=document.createElement('div');mini.className='theater-mini';mini.hidden=true;
 const miniTitle=document.createElement('b'),miniPlay=document.createElement('button'),miniNext=document.createElement('button'),miniOpen=document.createElement('button');
 miniPlay.textContent='▶';miniNext.textContent='⏭';miniOpen.textContent='Theater';
 miniPlay.addEventListener('click',()=>void togglePlay());miniNext.addEventListener('click',()=>void next(1));
 miniOpen.addEventListener('click',()=>app.changeView('theater'));
 mini.append(miniTitle,miniPlay,miniNext,miniOpen);document.body.append(mini);
 function updateMini(){
  const item=currentItem();
  mini.hidden=!item||!playing||active();
  miniTitle.textContent=item?.file.name||'Media Theater';
  miniPlay.textContent=playing?'❚❚':'▶';
  $('theaterFavorite').textContent=item&&favorites.includes(item.file.name)?'★ Favorited':'☆ Favorite track';
 }
 const active=()=>document.querySelector('.studio:not([hidden])')?.dataset.panel==='theater';
 const currentItem=()=>playlist[current]||null;
 const player=()=>currentItem()?.kind==='video'?video:audio;
 const showStatus=(s)=>{status.textContent=s;};
 const showInfo=()=>{
  const item=currentItem();
  label.textContent=item?safe(item.file.name):'Choose a track or video';
  info.textContent=item?item.kind.toUpperCase()+' · '+bytes(item.file.size)+' · '+(item.kind==='image'?'Animated/still image':formatTime(Number.isFinite(player().duration)?player().duration:0)):'Your local playlist appears here';
  $('theaterCurrent').textContent=item?(current+1)+' / '+playlist.length:'0 / '+playlist.length;
  play.textContent=playing?'❚❚ Pause':'▶ Play';
  updateMini();
 };
 function revoke(){if(currentURL)URL.revokeObjectURL(currentURL);currentURL=null;}
 function stopMedia(){video.pause();audio.pause();playing=false;}
 function updateAB(){
  $('theaterABStatus').textContent=loopA===null?'Choose the beginning (A), then the end (B).':
   loopB===null?'A: '+formatTime(loopA)+' · choose B to finish segment.':
   'Repeating '+formatTime(loopA)+' → '+formatTime(loopB)+' within this track.';
 }
 function clearAB(){loopA=null;loopB=null;updateAB();}
 function currentPlayable(){
  const item=currentItem();
  if(!item||item.kind==='image')return null;
  return player();
 }
 function drawList(){
  list.replaceChildren();for(let i=0;i<playlist.length;i++){
   const item=playlist[i];
   const row=document.createElement('div');row.className='theater-track'+(i===current?' selected':'');
   const choose=document.createElement('button');choose.type='button';choose.className='theater-track-title';
   const icon=document.createElement('span');icon.textContent=item.kind==='video'?'▣':item.kind==='audio'?'♫':'◈';
   const text=document.createElement('span');text.textContent=safe(item.file.name);
   choose.append(icon,text);choose.title='Play '+safe(item.file.name);
   choose.addEventListener('click',()=>{void select(i,true);});
   const length=document.createElement('small');length.textContent=bytes(item.file.size);
   const remove=document.createElement('button');remove.type='button';remove.className='small-btn';remove.textContent='×';remove.title='Remove track';
   remove.addEventListener('click',()=>{
    const had=i===current;const next=i<current?current-1:current;
    playlist.splice(i,1);
    if(had){stopMedia();revoke();current=-1;video.hidden=true;audio.hidden=true;image.hidden=true;
     if(playlist.length)void select(Math.min(i,playlist.length-1),false);
    }else current=Math.max(-1,next);
    drawList();showInfo();
   });
   row.append(choose,length,remove);list.append(row);
  }
  if(!playlist.length){const empty=document.createElement('div');empty.className='hint';empty.textContent='Add local songs, videos or GIFs to create a playlist.';list.append(empty);}
  showInfo();
 }
 async function select(index,autoplay=false){
  if(index<0||index>=playlist.length)return;
  stopMedia();revoke();current=index;clearAB();
  const item=playlist[index],kind=item.kind;
  currentURL=URL.createObjectURL(item.file);
  video.hidden=kind!=='video';audio.hidden=kind!=='audio';image.hidden=kind!=='image';
  if(kind==='video'||kind==='audio'){
   const media=player();
   media.src=currentURL;media.load();media.playbackRate=Number($('theaterSpeed').value)||1;
   media.loop=mode==='one';
   if(autoplay)try{await media.play();playing=true;await resumeContext();}catch(e){showStatus('Tap Play to start playback');}
  }else{image.src=currentURL;playing=false;}
  showInfo();drawList();
 }
 async function resumeContext(){
  if(audioContext&&audioContext.state==='suspended')try{await audioContext.resume();}catch(e){}
 }
 async function next(direction=1,fromEnded=false){
  if(!playlist.length)return;
  if(fromEnded&&mode==='one'){await select(current,true);return;}
  if(fromEnded&&mode==='off'&&!shuffle&&current===playlist.length-1){stopMedia();showInfo();return;}
  let index=shuffle&&playlist.length>1?Math.floor(Math.random()*playlist.length):Math.max(0,current);
  if(shuffle&&playlist.length>1){if(index===current)index=(index+1)%playlist.length;}
  else index=(index+direction+playlist.length)%playlist.length;
  await select(index,true);
 }
 async function togglePlay(){
  if(!playlist.length)throw Error('Add a song, video or GIF first.');
  if(current<0)await select(0,false);
  if(currentItem()?.kind==='image'){showStatus('GIF and image items play in the preview');return;}
  const media=player();
  if(media.paused){
   try{await media.play();playing=true;await resumeContext();showStatus('Playing · '+safe(currentItem().file.name))}
   catch(e){showStatus('Tap the native player button to play this file.');}
  }else{media.pause();playing=false;}
  showInfo();
 }
 function clearQueue(){
  stopMedia();revoke();playlist.length=0;current=-1;clearAB();
  video.removeAttribute('src');audio.removeAttribute('src');video.load();audio.load();image.removeAttribute('src');
  video.hidden=true;audio.hidden=true;image.hidden=true;drawList();
  showStatus('Queue cleared');
 }
 input.addEventListener('change',wrap(async e=>{
  const files=Array.from(e.target.files||[]);
  let added=0,skipped=0;
  for(const file of files){
   if(playlist.length>=MAX_QUEUE)break;
   const kind=mediaKind(file);
   if(!kind||file.size>MAX_FILE||!file.size){skipped++;continue;}
   playlist.push({file,kind});added++;
  }
  input.value='';drawList();
  if(current===-1&&playlist.length)await select(0,false);
  showStatus(added+' added · '+playlist.length+' in queue'+(skipped?' · '+skipped+' skipped':''));
 }));
 $('theaterSaveVault').addEventListener('click',()=>{
  const files=playlist.filter(item=>item.kind==='video').map(item=>item.file);
  if(!files.length){showStatus('Add a video to the Media Theater queue first.');return;}
  document.dispatchEvent(new CustomEvent('proximus-video-vault-import',{detail:{files}}));
  showStatus('Saving '+files.length+' queue video'+(files.length===1?'':'s')+' to the device-local Video Vault.');
  app.changeView('videos');
 });
 $('theaterOpenVault').addEventListener('click',()=>app.changeView('videos'));
 document.addEventListener('proximus-video-vault-send-theater',e=>{
  const {blob,name}=e.detail||{};
  if(!(blob instanceof Blob)||!blob.size){showStatus('Selected Video Vault file is unavailable.');return;}
  if(playlist.length>=MAX_QUEUE){showStatus('Media Theater queue is full.');return;}
  // Preserve the original browser Blob rather than copying hundreds of MB.
  if(!blob.name)try{Object.defineProperty(blob,'name',{value:String(name||'Saved video.mp4'),configurable:true});}
  catch(err){showStatus('Cannot label this stored video for Theater playback.');return;}
  playlist.push({file:blob,kind:'video'});
  void select(playlist.length-1,true);
  showStatus('Video Vault file added to the current session queue without duplicating its stored data.');
 });
 document.addEventListener('proximus-companion-playing',e=>{
  if(e.detail?.origin==='videos'&&playing){
   stopMedia();showInfo();updateMini();
  }
 });
 $('theaterPlay').addEventListener('click',wrap(togglePlay));
 $('theaterNext').addEventListener('click',wrap(()=>next(1)));
 $('theaterPrev').addEventListener('click',wrap(()=>next(-1)));
 function theaterSkip(seconds){
  const media=currentPlayable();
  if(!media||!Number.isFinite(media.duration))return showStatus('Choose audio or video to seek.');
  media.currentTime=Math.max(0,Math.min(media.duration-.05,media.currentTime+seconds));
 }
 $('theaterSkipBack').addEventListener('click',()=>theaterSkip(-10));
 $('theaterSkipForward').addEventListener('click',()=>theaterSkip(30));
 $('theaterMarkA').addEventListener('click',()=>{
  const media=currentPlayable();
  if(!media||!Number.isFinite(media.currentTime))return showStatus('Play audio or video before setting loop points.');
  loopA=media.currentTime;loopB=null;updateAB();
 });
 $('theaterMarkB').addEventListener('click',()=>{
  const media=currentPlayable();
  if(!media||loopA===null||!Number.isFinite(media.currentTime)||media.currentTime<=loopA+.3)
   return showStatus('Choose an end point at least 0.3 seconds after point A.');
  loopB=media.currentTime;updateAB();
 });
 $('theaterResetAB').addEventListener('click',clearAB);
 $('theaterClear').addEventListener('click',()=>{if(playlist.length&&confirm('Clear the local theater playlist?'))clearQueue();});
 $('theaterLoop').addEventListener('change',e=>{mode=e.target.value;video.loop=mode==='one';audio.loop=mode==='one';});
 $('theaterShuffle').addEventListener('change',e=>{shuffle=e.target.checked;});
 $('theaterSpeed').addEventListener('change',e=>{video.playbackRate=Number(e.target.value);audio.playbackRate=Number(e.target.value);});
 for(const el of [audio,video]){
  el.addEventListener('ended',()=>{playing=false;void next(1,true);});
  el.addEventListener('play',()=>{
   playing=true;showInfo();
   document.dispatchEvent(new CustomEvent('proximus-companion-playing',{detail:{origin:'theater'}}));
  });
  el.addEventListener('pause',()=>{if(el===player()){playing=false;showInfo();}});
  el.addEventListener('loadedmetadata',showInfo);
  el.addEventListener('timeupdate',()=>{
   if(el===player()&&loopA!==null&&loopB!==null&&el.currentTime>=loopB){
    el.currentTime=loopA;
   }
  });
  el.addEventListener('error',()=>{showStatus('Could not decode '+(currentItem()?.file.name||'file')+' in this browser');playing=false;showInfo();});
 }
 $('theaterFullscreen').addEventListener('click',wrap(async()=>{
  const el=currentItem()?.kind==='video'?video:$('theaterStage');
  if(!currentItem())throw Error('Choose a media file before opening cinema mode.');
  if(el.requestFullscreen)await el.requestFullscreen();
  else if(el.webkitEnterFullscreen&&el===video)el.webkitEnterFullscreen();
  else showStatus('Cinema preview is available in the player above.');
 }));
 function drawVisualization(time){
  const w=canvas.width,h=canvas.height;
  const [primary,secondary,glow]=THEMES[color],t=time/1000;
  ctx.fillStyle='#090a1c';ctx.fillRect(0,0,w,h);
  const gradient=ctx.createRadialGradient(w*.5,h*.52,0,w*.5,h*.5,w*.73);
  gradient.addColorStop(0,secondary+'32');gradient.addColorStop(1,'#060916');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  ctx.lineWidth=1;ctx.strokeStyle=primary+'13';
  for(let y=22;y<h;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  let energy=0;
  if(analyser&&visualized){
   analyser.getByteFrequencyData(frequency);analyser.getByteTimeDomainData(timeDomain);
   for(let i=0;i<Math.min(50,frequency.length);i++)energy+=frequency[i];
   energy/=Math.min(50,frequency.length)*255;
  }
  level.textContent=visualized?'LIVE AUDIO · '+Math.round(energy*100)+'%':'VISUAL PREVIEW · '+color.toUpperCase();
  if(visualMode==='bars'){
   const count=56,gap=5,bw=(w-72)/count-gap;
   for(let i=0;i<count;i++){
    const v=visualized?frequency[Math.floor(i*frequency.length/count)]/255:(.15+.13*Math.sin(t*1.8+i*.32));
    const bh=Math.max(8,v*(h*.68)),x=36+i*(bw+gap);
    const g=ctx.createLinearGradient(0,h-bh,0,h);g.addColorStop(0,glow);g.addColorStop(1,secondary);
    ctx.fillStyle=g;ctx.shadowColor=primary;ctx.shadowBlur=8+v*22;
    ctx.fillRect(x,h-20-bh,bw,bh);
   }
   ctx.shadowBlur=0;
  }else if(visualMode==='wave'){
   ctx.lineWidth=3;ctx.strokeStyle=primary;ctx.shadowColor=glow;ctx.shadowBlur=18;ctx.beginPath();
   for(let x=0;x<w;x+=2){
    const v=visualized?(timeDomain[Math.floor(x/w*timeDomain.length)]-128)/128:Math.sin(x*.025+t*2)*(.2+.08*Math.sin(t));
    const y=h/2+v*h*.34+(visualized?0:Math.sin(x*.008-t)*h*.06);
    if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }
   ctx.stroke();ctx.shadowBlur=0;
  }else if(visualMode==='stars'){
   for(let i=0;i<110;i++){
    const phase=(i*17.37)%1,angle=i*2.399963+Math.sin(t*.23)*.25;
    const movement=((phase+t*(.04+energy*.16))%1),rad=movement*Math.max(w,h)*.73;
    const x=w/2+Math.cos(angle)*rad,y=h/2+Math.sin(angle)*rad*.5;
    ctx.fillStyle=i%3?primary:glow;ctx.globalAlpha=Math.max(.17,movement);
    ctx.beginPath();ctx.arc(x,y,1+movement*3+energy*2,0,Math.PI*2);ctx.fill();
   }
   ctx.globalAlpha=1;
  }else if(visualMode==='tunnel'){
   for(let ring=0;ring<18;ring++){
    const amount=(ring/18+t*(.12+energy*.06))%1,rad=12+amount*Math.max(w,h)*.54;
    ctx.strokeStyle=ring%2?primary:secondary;ctx.globalAlpha=1-amount*.78;
    ctx.lineWidth=2+energy*5;ctx.strokeRect(w/2-rad,h/2-rad*.43,rad*2,rad*.86);
   }
   ctx.globalAlpha=1;
  }else{
   const radius=72+energy*95;
   for(let ring=0;ring<3;ring++){
    ctx.beginPath();ctx.arc(w/2,h/2,radius+ring*25+8*Math.sin(t+ring),0,Math.PI*2);
    ctx.lineWidth=2+energy*5;ctx.strokeStyle=ring===0?primary:ring===1?secondary:glow;ctx.shadowColor=primary;ctx.shadowBlur=16;ctx.stroke();
   }
   for(let i=0;i<72;i++){
    const angle=i*Math.PI*2/72+t*.3;
    const v=visualized?frequency[Math.floor(i*frequency.length/72)]/255:(.15+.1*Math.sin(t+i*.23));
    const a=radius+45,b=a+v*90;
    ctx.beginPath();ctx.moveTo(w/2+Math.cos(angle)*a,h/2+Math.sin(angle)*a);
    ctx.lineTo(w/2+Math.cos(angle)*b,h/2+Math.sin(angle)*b);
    ctx.strokeStyle=glow;ctx.lineWidth=2+v*3;ctx.stroke();
   }
   ctx.shadowBlur=0;
  }
  const name=currentItem()?.file.name||'PROXIMUS | MEDIA THEATER';
  ctx.font='700 15px system-ui,sans-serif';ctx.textAlign='center';ctx.fillStyle='#f2eaffaa';
  ctx.fillText(safe(name).slice(0,65),w/2,h-8);
 }
 function animate(t){
  raf=requestAnimationFrame(animate);
  updateMini();if(document.hidden||!active())return;
  if(t-tick<32)return;tick=t;
  drawVisualization(t);
 }
 $('theaterTheme').addEventListener('change',e=>{color=e.target.value;drawVisualization(performance.now());});
 $('theaterVisualizerMode').addEventListener('change',e=>{visualMode=e.target.value;drawVisualization(performance.now());});
 $('theaterEnableAudio').addEventListener('click',wrap(async()=>{
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)throw Error('Web Audio is unavailable in this browser.');
  if(!audioContext)audioContext=new AudioCtx();
  if(!analyser){analyser=audioContext.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.76;frequency=new Uint8Array(analyser.frequencyBinCount);timeDomain=new Uint8Array(analyser.fftSize);}
  for(const el of [audio,video]){
   if(nodes.has(el))continue;
   const source=audioContext.createMediaElementSource(el);
   source.connect(analyser);nodes.set(el,source);
  }
  if(!analyser.__wired){analyser.connect(audioContext.destination);analyser.__wired=true;}
  await resumeContext();visualized=true;
  $('theaterEnableAudio').textContent='✓ Visualizer active';showStatus('Visualizer connected to local media playback');
 }));
 async function poster(add){
  const item=currentItem();if(!item)throw Error('Choose a video or GIF to capture a poster.');
  let src;if(item.kind==='video'){if(video.readyState<2)throw Error('Play or seek the video to load a frame first.');src=video;}
  else if(item.kind==='image'){if(!image.complete||!image.naturalWidth)throw Error('Image is still loading.');src=image;}
  else throw Error('Poster capture uses a video or an image; use Visualizer Capture for audio.');
  const iw=src.videoWidth||src.naturalWidth,ih=src.videoHeight||src.naturalHeight;
  if(!iw||!ih)throw Error('No decoded frame is available yet.');
  const scale=Math.min(1,1920/iw,1080/ih);
  const out=document.createElement('canvas');out.width=Math.max(1,Math.round(iw*scale));out.height=Math.max(1,Math.round(ih*scale));
  out.getContext('2d').drawImage(src,0,0,out.width,out.height);
  const blob=await blobCanvas(out),name=stem(item.file.name)+'-poster.png';
  if(add)app.addAsset(name,blob,'Media Theater');else download(blob,name);
 }
 capture.addEventListener('click',wrap(()=>poster(false)));
 $('theaterPosterPack').addEventListener('click',wrap(()=>poster(true)));
 $('theaterVizPng').addEventListener('click',wrap(async()=>{drawVisualization(performance.now());download(await blobCanvas(canvas),'PROXIMUS-VISUALIZER.png');}));
 $('theaterVizPack').addEventListener('click',wrap(async()=>{drawVisualization(performance.now());app.addAsset('PROXIMUS-VISUALIZER.png',await blobCanvas(canvas),'Media Theater');}));
 $('theaterSetMaster').addEventListener('click',wrap(()=>{
  const item=currentItem();
  if(!item||item.kind==='audio')throw Error('Choose a video or GIF for all website thumbnails.');
  document.dispatchEvent(new CustomEvent('proximus-media-export',{detail:{blob:item.file,name:item.file.name,target:'master'}}));
  showStatus('Applied '+safe(item.file.name)+' to the Master Thumbnail Publisher on this device.');
 }));
 $('theaterMakeBg').addEventListener('click',wrap(()=>{
  const item=currentItem();if(!item)throw Error('Choose an image or video first');
  if(item.kind==='audio')throw Error('Choose a video or GIF for backgrounds.');
  document.dispatchEvent(new CustomEvent('proximus-media-export',{detail:{blob:item.file,name:item.file.name,target:'background'}}));
  showStatus('Applied media as your personalized background');
 }));
 $('theaterMakeThumb').addEventListener('click',wrap(()=>{
  const item=currentItem();if(!item||item.kind==='audio')throw Error('Choose an image or video for thumbnails.');
  document.dispatchEvent(new CustomEvent('proximus-media-export',{detail:{blob:item.file,name:item.file.name,target:'hero'}}));
  showStatus('Applied media as your hero thumbnail');
 }));
 $('theaterFavorite').addEventListener('click',()=>{
  const item=currentItem();if(!item){showStatus('Choose a track before favoriting.');return;}
  favorites=favorites.includes(item.file.name)?favorites.filter(x=>x!==item.file.name):[...favorites,item.file.name];
  keepFavorites();showInfo();showStatus(favorites.includes(item.file.name)?'Track added to favorites':'Track removed from favorites');
 });
 $('theaterExportFavorites').addEventListener('click',()=>{
  download(textFile({generator:'PROXIMUS | MEDIA THEATER',exported:new Date().toISOString(),favorites}), 'PROXIMUS-THEATER-FAVORITES.json');
 });
 $('theaterToReactor').addEventListener('click',wrap(()=>{
  const item=currentItem();
  if(!item||!['audio','video'].includes(item.kind))throw Error('Select a local music or video track to play in Sovereign Reactor.');
  document.dispatchEvent(new CustomEvent('proximus-reactor-import',{detail:{file:item.file}}));
  showStatus('Sent '+safe(item.file.name)+' to Sovereign Reactor. Tap Play local audio there.');
 }));
 $('theaterReactorBg').addEventListener('click',wrap(()=>{
  const item=currentItem();
  if(!item||item.kind==='audio')throw Error('Choose a GIF, photo or video as the Reactor background.');
  document.dispatchEvent(new CustomEvent('proximus-reactor-background',{detail:{blob:item.file,name:item.file.name}}));
  showStatus('Opened selected backdrop in Sovereign Reactor.');
 }));
 $('theaterManifest').addEventListener('click',wrap(()=>{
  if(!playlist.length)throw Error('Add local media first.');
  download(textFile(playlistManifest(playlist)),'PROXIMUS-MEDIA-PLAYLIST.json');
 }));
 // Device-local music can survive page reloads; current session stays user-controlled.
 initLocalMusicLibrary({
  getCurrent:currentItem,
  getQueued:()=>playlist,
  // Only a user-selected saved audio track is allowed to auto-start.
  // Playback can be refused by the browser and must always remain controllable.
  prepareStartup:async(id)=>{
   const index=playlist.findIndex(item=>item.kind==='audio'&&item.libraryId===id);
   if(index<0)throw Error('Selected startup song is no longer in the queue.');
   if(index!==current)await select(index,false);
   else if(!audio.src)await select(index,false);
  },
  attemptStartup:async()=>{
   if(currentItem()?.kind!=='audio')return {played:false,blocked:false,reason:'Choose a saved audio track first.'};
   try{
    await audio.play();
    playing=true;await resumeContext();showInfo();
    return {played:true,blocked:false};
   }catch(error){
    playing=false;showInfo();
    return {played:false,blocked:error?.name==='NotAllowedError',
     reason:error?.name==='NotAllowedError'?'Your browser requires a tap before playing audio.':
      'Audio playback failed. Confirm this file is supported by your browser.'};
   }
  },
  addToQueue:async(file,id)=>{
   if(playlist.length>=MAX_QUEUE)throw Error('Media Theater queue is full (80 items). Remove a queue item before adding another.');
   if(!isLocalAudio(file))throw Error('The stored audio file is invalid.');
   if(playlist.some(item=>item.kind==='audio'&&
      (item.libraryId===id||(()=>{try{return audioTrackId(item.file)===id;}catch{return false;}})())))return false;
   playlist.push({file,kind:'audio',libraryId:id});
   drawList();
   if(current===-1)await select(0,false);
   return true;
  }
 });
 $('theaterStage').addEventListener('dblclick',()=>{$('theaterFullscreen').click();});
 drawList();drawVisualization(0);raf=requestAnimationFrame(animate);
 window.addEventListener('pagehide',()=>{
  cancelAnimationFrame(raf);stopMedia();revoke();mini.remove();
  audioContext?.close().catch(()=>{});
 },{once:true});
}
