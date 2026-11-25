/* PROXIMUS v3.9.0 — THE LIVING CINEMA
 * An additive visual discovery, playback and poster-editing layer. Original video
 * files remain exclusively in the existing OPFS / IndexedDB Video Vault.
 * The only movie field this editor writes is "poster" (JPEG Blob).
 */
import {listStoredVideos,updateStoredVideo} from './video-vault.js';
import {getVaultCoverPoster} from './video-vault-visual-v3.7.js';
import {saveOrShare} from './portable-kit.js';

const $=id=>document.getElementById(id);
const MAX_ART=20*1024*1024,MAX_SHELVES=9,PER_SHELF=9;
const clean=x=>String(x??'').replace(/[\u0000-\u001f]/g,' ').trim();
const nameOf=x=>clean(x?.displayTitle||x?.name||'Untitled video').slice(0,130);
const sizeOf=n=>!Number.isFinite(Number(n))?'Local video':Number(n)>=1024**3?(Number(n)/1024**3).toFixed(1)+' GB':(Number(n)/1024**2).toFixed(0)+' MB';
const timeOf=s=>{const n=Math.max(0,Math.floor(Number(s)||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
const inProgress=x=>Number(x.position)>2&&(!Number(x.duration)||Number(x.position)<Number(x.duration)-6);
const safeId=x=>typeof x?.id==='string'&&x.id.length>0&&Number(x.bytes)>0;
export function buildLivingShelves(entries,query='',options={}){
 const items=(Array.isArray(entries)?entries:[]).filter(safeId);
 const watchlist=items.filter(x=>x.watchLater===true).sort((a,b)=>Number(b.updated||b.added||0)-Number(a.updated||a.added||0));
 if(options.watchlistOnly)return watchlist.length?[{id:'watchlist',label:'YOUR WATCHLIST',detail:'Saved for a future movie night',items:watchlist.slice(0,36)}]:[];
 const watched=items.filter(inProgress).sort((a,b)=>Number(b.watched||0)-Number(a.watched||0));
 const favorites=items.filter(x=>x.favorite).sort((a,b)=>Number(b.watched||b.updated||b.added||0)-Number(a.watched||a.updated||a.added||0));
 const newest=[...items].sort((a,b)=>Number(b.added||0)-Number(a.added||0));
 const term=clean(query).toLowerCase();
 if(term){
  const matching=items.filter(x=>(nameOf(x)+' '+clean(x.collection)).toLowerCase().includes(term));
  return matching.length?[{id:'matches',label:'SEARCH RESULTS',detail:matching.length+' matching local title'+(matching.length===1?'':'s'),items:matching.slice(0,36)}]:[];
 }
 const shelves=[];
 if(watchlist.length)shelves.push({id:'watchlist',label:'MY WATCHLIST',detail:'Saved for later · pick up any time',items:watchlist.slice(0,PER_SHELF)});
 if(watched.length)shelves.push({id:'continue',label:'CONTINUE WATCHING',detail:'Pick up exactly where you left off',items:watched.slice(0,PER_SHELF)});
 if(favorites.length)shelves.push({id:'favorites',label:'YOUR FAVORITES',detail:'The titles worth keeping close',items:favorites.slice(0,PER_SHELF)});
 shelves.push({id:'recent',label:'RECENTLY ADDED',detail:'Freshly added to your private collection',items:newest.slice(0,PER_SHELF)});
 const groups=new Map();
 for(const item of newest){
  const key=clean(item.collection||'Unsorted').slice(0,45)||'Unsorted';
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(item);
 }
 for(const [label,group] of groups){
  if(shelves.length>=MAX_SHELVES)break;
  shelves.push({id:'collection-'+shelves.length,label:label.toUpperCase(),detail:'PERSONAL COLLECTION · '+group.length+' TITLES',items:group.slice(0,PER_SHELF)});
 }
 return shelves;
}
export function chooseCinemaPick(entries,seed=0){
 const movies=(Array.isArray(entries)?entries:[]).filter(safeId);
 const unwatched=movies.filter(x=>!Number(x.watched||0)&&!inProgress(x));
 const pool=unwatched.length?unwatched:movies;
 return pool.length?pool[Math.abs(Math.trunc(Number(seed)||0))%pool.length]:null;
}
export function normalizePosterCrop(raw={}){
 const bounded=(x,a,b,d)=>Number.isFinite(Number(x))?Math.max(a,Math.min(b,Number(x))):d;
 return {zoom:bounded(raw.zoom,100,260,100),x:bounded(raw.x,0,100,50),
  y:bounded(raw.y,0,100,50),caption:Boolean(raw.caption),
  color:/^#[a-f0-9]{6}$/i.test(raw.color||'')?raw.color:'#ffffff'};
}
export function posterSourceRect(width,height,raw={}){
 const w=Number(width),h=Number(height);
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)throw Error('No image is loaded for this poster.');
 const p=normalizePosterCrop(raw),ratio=16/9;
 const bw=w/h>ratio?h*ratio:w,bh=w/h>ratio?h:w/ratio;
 const sw=bw/(p.zoom/100),sh=bh/(p.zoom/100);
 return {sx:(w-sw)*p.x/100,sy:(h-sh)*p.y/100,sw,sh};
}
export function initLivingCinema(app){
 const root=$('px39Discovery'),shelves=$('px39Shelves'),query=$('px39Search');
 const details=$('px39DetailsDialog'),forge=$('px39PosterDialog');
 const player=$('videoVaultPlayer'),bar=$('px39PlayerToolbar');
 if(!root||!shelves||!details||!forge||!player||!bar)return;
 let library=[],selectedId=null,playingId=null,preview=null,previewUrl=null,watchlistOnly=false;
 let artURLs=new Map(),renderToken=0,refreshQueued=false;
 let crop=normalizePosterCrop(),frameBlob=null,sourceName='';
 const notice=(id,value)=>{const el=$(id);if(el)el.textContent=value};
 const getItem=id=>library.find(x=>x.id===id);
 const activeItem=()=>getItem(selectedId);
 const status=msg=>notice('px39DiscoveryStatus',msg);
 const recycleArt=()=>{for(const url of artURLs.values())URL.revokeObjectURL(url);artURLs.clear()};
 function artURL(item){
  if(!(item?.poster instanceof Blob)||!item.poster.size)return '';
  if(!artURLs.has(item.id))artURLs.set(item.id,URL.createObjectURL(item.poster));
  return artURLs.get(item.id);
 }
 function coverFor(item,klass){
  const cover=document.createElement('span');cover.className=klass;
  const src=artURL(item);
  if(src){
   const img=document.createElement('img');img.src=src;img.alt='';img.loading='lazy';img.decoding='async';cover.append(img);
  }else{
   const glyph=document.createElement('span');glyph.className='px39-cover-placeholder';
   glyph.textContent='▶';cover.append(glyph);
  }
  return cover;
 }
 function openPlayer(id){
  if(!getItem(id))return;
  details.open&&details.close();forge.open&&forge.close();
  app.changeView('videos');
  document.dispatchEvent(new CustomEvent('proximus-video-vault-watch',{detail:{id}}));
  player.scrollIntoView({block:'center',behavior:'smooth'});
 }
 async function latestItem(id){
  const all=await listStoredVideos();
  return all.find(x=>x.id===id)||null;
 }
 function presentDetails(item){
  selectedId=item.id;
  $('px39DetailsTitle').textContent=nameOf(item);
  $('px39DetailsKicker').textContent=inProgress(item)?'CONTINUE YOUR STORY':item.favorite?'★ FROM YOUR FAVORITES':'YOUR PRIVATE COLLECTION';
  const collection=clean(item.collection||'Unsorted');
  $('px39DetailsMeta').textContent=[
   collection,Number(item.duration)>0?Math.round(item.duration/60)+' min':'LOCAL VIDEO',
   sizeOf(item.bytes),item.position?'Resume at '+timeOf(item.position):'Ready to watch'
  ].join('  ·  ');
  const poster=$('px39DetailsArtwork');poster.replaceChildren();
  const src=artURL(item);if(src){const image=document.createElement('img');image.src=src;image.alt='';poster.append(image)}
  else{const glyph=document.createElement('span');glyph.textContent='✧';poster.append(glyph)}
  $('px39DetailsPlay').textContent=inProgress(item)?'▶ Resume Movie':'▶ Play Movie';
  $('px39DetailsFavorite').textContent=item.favorite?'★ Remove favorite':'☆ Add favorite';
  $('px40WatchLater').textContent=item.watchLater?'✓ Saved to watchlist':'＋ Save for later';
  $('px39DetailsCollection').value=collection;
  notice('px39DetailsStatus','Original movie and all playback data remain on this device.');
  if(!details.open)details.showModal();
 }
 function movieCard(item){
  const button=document.createElement('button');button.type='button';button.className='px39-movie-card';
  button.title='Details: '+nameOf(item);
  const art=coverFor(item,'px39-card-art');
  const flag=document.createElement('span');flag.className='px39-card-flag';
  flag.textContent=inProgress(item)?'CONTINUE':item.favorite?'★ FAVORITE':item.watchLater?'⌑ WATCHLIST':'LOCAL';
  art.append(flag);
  if(inProgress(item)&&Number(item.duration)>0){
   const track=document.createElement('span');track.className='px39-card-progress';
   const progress=document.createElement('span');progress.style.width=Math.max(2,Math.min(100,100*item.position/item.duration))+'%';
   track.append(progress);art.append(track);
  }
  const data=document.createElement('span');data.className='px39-card-data';
  const title=document.createElement('strong');title.textContent=nameOf(item);
  const sub=document.createElement('small');sub.textContent=clean(item.collection||'Unsorted')+' · '+(item.duration?Math.round(item.duration/60)+' min':'Video');
  data.append(title,sub);button.append(art,data);
  button.addEventListener('click',()=>presentDetails(item));
  return button;
 }
 function render(){
  const token=++renderToken;
  recycleArt();shelves.replaceChildren();
  const lists=buildLivingShelves(library,query.value,{watchlistOnly});
  root.dataset.empty=String(!library.length);
  if(!library.length){
   const empty=document.createElement('div');empty.className='px39-discovery-empty';
   empty.innerHTML='<strong>Your next favorite starts here.</strong><span>Import your own videos to unlock personal cinematic shelves, poster art, collections and instant playback.</span>';
   shelves.append(empty);
   status('No local videos yet. Your existing Video Vault importer is ready below.');
   return;
  }
  if(!lists.length){
   const empty=document.createElement('p');empty.className='px39-discovery-empty';
   empty.textContent=watchlistOnly?'Your watchlist is empty. Open a movie cover and choose Save for later.':'No titles match this search. Try a different name or collection.';
   shelves.append(empty);status(library.length+' titles stored privately · no matches');return;
  }
  for(const shelf of lists){
   if(token!==renderToken)return;
   const section=document.createElement('section');section.className='px39-shelf';section.setAttribute('aria-label',shelf.label);
   const header=document.createElement('div');header.className='px39-shelf-head';
   const label=document.createElement('div');const kicker=document.createElement('small');kicker.textContent=shelf.detail;
   const heading=document.createElement('h4');heading.textContent=shelf.label;
   label.append(heading,kicker);
   const count=document.createElement('span');count.className='px39-shelf-count';count.textContent=shelf.items.length+' TITLES';
   header.append(label,count);
   const track=document.createElement('div');track.className='px39-shelf-track';
   for(const item of shelf.items)track.append(movieCard(item));
   section.append(header,track);shelves.append(section);
  }
  status(library.length+' personal title'+(library.length===1?'':'s')+' · local poster art · tap any cover for details.');
 }
 async function refresh(){
  try{
   library=(await listStoredVideos()).filter(safeId);
   render();
   if(details.open&&selectedId){
    const item=getItem(selectedId);if(item)presentDetails(item);else details.close();
   }
   refreshPosterOptions();
  }catch(err){status('Cannot load local library: '+err.message)}
 }
 function queueRefresh(){
  if(refreshQueued)return;
  refreshQueued=true;
  queueMicrotask(()=>{refreshQueued=false;if(!document.hidden)void refresh()});
 }
 $('px40WatchlistFilter').addEventListener('click',()=>{
  watchlistOnly=!watchlistOnly;
  $('px40WatchlistFilter').setAttribute('aria-pressed',String(watchlistOnly));
  $('px40WatchlistFilter').textContent=watchlistOnly?'✓ Watchlist only':'⌑ My Watchlist';render();
 });
 $('px40Surprise').addEventListener('click',()=>{
  const pick=chooseCinemaPick(library,Math.floor(Math.random()*1000000));
  if(pick)presentDetails(pick);else status('Add a movie to get a personal cinema pick.');
 });
 $('px39BrowseAll').addEventListener('click',()=>$('videoVaultGrid')?.scrollIntoView({behavior:'smooth',block:'start'}));
 $('px39AddMovie').addEventListener('click',()=>$('videoVaultImportNow')?.click());
 $('px39OpenPoster').addEventListener('click',()=>openForge(selectedId||library[0]?.id));
 query.addEventListener('input',render);
 $('px39DetailsClose').addEventListener('click',()=>details.close());
 $('px39DetailsPlay').addEventListener('click',()=>openPlayer(selectedId));
 $('px39DetailsFavorite').addEventListener('click',async()=>{
  const item=await latestItem(selectedId);if(!item)return;
  item.favorite=!item.favorite;item.updated=Date.now();
  try{await updateStoredVideo(item);notice('px39DetailsStatus','Favorites updated on this device.');queueRefresh();$('videoVaultRefresh')?.click();}
  catch(err){notice('px39DetailsStatus','Could not update favorite: '+err.message)}
 });
 $('px40WatchLater').addEventListener('click',async()=>{
  const item=await latestItem(selectedId);if(!item)return;
  item.watchLater=!item.watchLater;item.updated=Date.now();
  try{await updateStoredVideo(item);$('px39DetailsStatus').textContent=item.watchLater?'Added to your personal watchlist.':'Removed from watchlist.';queueRefresh();$('videoVaultRefresh')?.click()}
  catch(e){$('px39DetailsStatus').textContent='Watchlist could not be updated: '+e.message}
 });
 $('px39DetailsSaveCollection').addEventListener('click',async()=>{
  const item=await latestItem(selectedId);if(!item)return;
  item.collection=clean($('px39DetailsCollection').value).slice(0,42)||'Unsorted';
  item.updated=Date.now();
  try{await updateStoredVideo(item);notice('px39DetailsStatus','Collection saved to the original Vault record.');queueRefresh();$('videoVaultRefresh')?.click();}
  catch(err){notice('px39DetailsStatus','Could not save collection: '+err.message)}
 });
 $('px39DetailsPoster').addEventListener('click',()=>{const id=selectedId;details.close();openForge(id)});
 $('px39OpenDiscovery')?.addEventListener('click',()=>{
  app.changeView('videos');
  root.scrollIntoView({behavior:'smooth',block:'start'});
 });
 // The upgraded theater bar operates the original video element. It never
 // introduces a second media decoder, second player or persistent media copy.
 const playButton=$('px39Play'),seek=$('px39Seek'),clock=$('px39Clock');
 const seekBy=delta=>{if(Number.isFinite(player.duration))player.currentTime=Math.max(0,Math.min(player.duration,player.currentTime+delta))};
 function syncPlayback(){
  playButton.textContent=player.paused?'▶ Play':'❚❚ Pause';
  const duration=Number.isFinite(player.duration)&&player.duration>0?player.duration:0;
  seek.disabled=!duration;seek.value=duration?String(Math.round(player.currentTime/duration*1000)):'0';
  clock.textContent=timeOf(player.currentTime)+' / '+(duration?timeOf(duration):'0:00');
  bar.dataset.playing=String(!player.paused);
 }
 playButton.addEventListener('click',()=>{if(!player.currentSrc){status('Choose a movie from a shelf or your Video Vault first.');return}if(player.paused)void player.play().catch(()=>{status('Tap the native video Play control if iPhone blocks playback.')});else player.pause()});
 $('px39Back').addEventListener('click',()=>seekBy(-10));
 $('px39Forward').addEventListener('click',()=>seekBy(10));
 $('px39Focus').addEventListener('click',()=>$('videoVaultFocus')?.click());
 $('px39Fullscreen').addEventListener('click',()=>$('videoVaultCinema')?.click());
 $('px39Picture').addEventListener('click',()=>$('videoVaultPiP')?.click());
 seek.addEventListener('input',()=>{const d=player.duration;if(Number.isFinite(d)&&d>0)player.currentTime=Number(seek.value)*d/1000});
 for(const e of ['timeupdate','loadedmetadata','durationchange','play','pause','ended','emptied','ratechange'])player.addEventListener(e,syncPlayback);
 bar.addEventListener('keydown',event=>{
  if(event.target?.tagName==='INPUT'||event.target?.tagName==='SELECT')return;
  if(event.key==='ArrowLeft'){event.preventDefault();seekBy(-10)}
  if(event.key==='ArrowRight'){event.preventDefault();seekBy(10)}
  if(event.key===' '){event.preventDefault();playButton.click()}
 });
 syncPlayback();

 const canvas=$('px39PosterCanvas'),ctx=canvas.getContext('2d',{alpha:false});
 const picker=$('px39PosterFile'),choice=$('px39PosterChoice');
 function refreshPosterOptions(){
  const value=choice.value;
  choice.replaceChildren();
  for(const movie of library){
   const option=document.createElement('option');option.value=movie.id;option.textContent=nameOf(movie);choice.append(option);
  }
  if(library.some(x=>x.id===value))choice.value=value;
  else if(library.some(x=>x.id===selectedId))choice.value=selectedId;
  $('px39PosterSave').disabled=!library.length;
 }
 function releaseSource(){
  if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}
  preview=null;frameBlob=null;sourceName='';
 }
 async function loadBlob(blob,label){
  if(!(blob instanceof Blob)||!blob.size)throw Error('Choose a supported image with actual content.');
  const url=URL.createObjectURL(blob),image=new Image();
  try{
   await new Promise((resolve,reject)=>{
    image.onload=resolve;image.onerror=()=>reject(Error('Cannot decode this image on this device.'));
    image.src=url;
   });
   if(!image.naturalWidth||!image.naturalHeight)throw Error('Image dimensions are invalid.');
   if(image.naturalWidth*image.naturalHeight>95_000_000)throw Error('This image is too large to decode safely on mobile. Choose a smaller image.');
   releaseSource();preview=image;previewUrl=url;sourceName=label;
   drawPoster();notice('px39PosterStatus','Preview loaded: '+label+'. The original file stays unchanged.');
  }catch(error){URL.revokeObjectURL(url);throw error}
 }
 function drawPoster(){
  if(!ctx)return;
  ctx.fillStyle='#0d0a20';ctx.fillRect(0,0,960,540);
  if(preview){
   try{const rect=posterSourceRect(preview.naturalWidth,preview.naturalHeight,crop);
    ctx.drawImage(preview,rect.sx,rect.sy,rect.sw,rect.sh,0,0,960,540);
   }catch(err){notice('px39PosterStatus',err.message)}
  }else{
   ctx.fillStyle='#cab4ee';ctx.textAlign='center';ctx.font='700 30px system-ui';ctx.fillText('PROXIMUS  /  POSTER FORGE',480,275);
  }
  if(crop.caption){
   const grad=ctx.createLinearGradient(0,300,0,540);grad.addColorStop(0,'transparent');grad.addColorStop(1,'rgba(3,4,15,.84)');
   ctx.fillStyle=grad;ctx.fillRect(0,300,960,240);
   ctx.textAlign='left';ctx.fillStyle=crop.color;ctx.font='800 49px system-ui';
   const text=clean($('px39PosterCaption').value)||nameOf(getItem(choice.value));
   const words=text.slice(0,62).split(/\s+/),lines=[];let line='';
   for(const word of words){if(ctx.measureText((line+' '+word).trim()).width>850&&line){lines.push(line);line=word}else line=(line+' '+word).trim()}
   if(line)lines.push(line);
   for(const [i,l] of lines.slice(0,2).entries())ctx.fillText(l,50,472+i*50,850);
  }
 }
 function updateCrop(){
  crop=normalizePosterCrop({zoom:$('px39PosterZoom').value,x:$('px39PosterX').value,y:$('px39PosterY').value,
   caption:$('px39PosterCaptionEnabled').checked,color:$('px39PosterColor').value});
  drawPoster();
 }
 for(const id of ['px39PosterZoom','px39PosterX','px39PosterY','px39PosterCaption','px39PosterCaptionEnabled','px39PosterColor'])
  $(id).addEventListener('input',updateCrop);
 function openForge(id){
  const item=getItem(id)||library[0];
  if(!item){status('Import a saved video before opening Poster Forge.');$('videoVaultImportNow')?.click();return}
  selectedId=item.id;
  choice.value=item.id;picker.value='';
  releaseSource();crop=normalizePosterCrop();
  $('px39PosterZoom').value='100';$('px39PosterX').value='50';$('px39PosterY').value='50';
  $('px39PosterCaptionEnabled').checked=false;$('px39PosterCaption').value='';$('px39PosterColor').value='#ffffff';
  drawPoster();
  notice('px39PosterStatus','Select an image, use your existing poster or capture the loaded video frame.');
  if(!forge.open)forge.showModal();
  const poster=item.poster;
  if(poster instanceof Blob&&poster.size)void loadBlob(poster,'Saved poster').catch(err=>notice('px39PosterStatus',err.message));
  else void getVaultCoverPoster(item.id).then(blob=>{if(blob&&forge.open&&choice.value===item.id)return loadBlob(blob,'Personal cover still')}).catch(()=>{});
 }
 $('px39PosterClose').addEventListener('click',()=>{forge.close();releaseSource()});
 choice.addEventListener('change',()=>openForge(choice.value));
 picker.addEventListener('change',async()=>{
  const file=picker.files?.[0];if(!file)return;
  const supported=/^(image\/(png|jpeg|webp|gif))$/i.test(file.type);
  if(!supported||file.size>MAX_ART){notice('px39PosterStatus','Choose a PNG, JPG, GIF or WebP under 20 MB.');return}
  try{await loadBlob(file,file.name)}catch(err){notice('px39PosterStatus',err.message)}
 });
 $('px39PosterFrame').addEventListener('click',async()=>{
  if(choice.value!==playingId||player.readyState<2||!player.videoWidth){
   notice('px39PosterStatus','Play this exact saved video first, then choose Capture current frame. Session-only previews cannot overwrite a saved poster.');
   return;
  }
  try{
   const frame=document.createElement('canvas');frame.width=960;frame.height=540;
   const g=frame.getContext('2d');if(!g)throw Error('Canvas is unavailable');
   const rect=posterSourceRect(player.videoWidth,player.videoHeight);
   g.drawImage(player,rect.sx,rect.sy,rect.sw,rect.sh,0,0,960,540);
   const blob=await new Promise(resolve=>frame.toBlob(resolve,'image/jpeg',.90));
   if(!blob)throw Error('Frame could not be captured');
   await loadBlob(blob,'Frame at '+timeOf(player.currentTime));
  }catch(err){notice('px39PosterStatus','Frame capture failed: '+err.message)}
 });
 async function posterBlob(){
  if(!preview)throw Error('Choose an image, load the existing poster, or capture a frame.');
  drawPoster();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.90));
  if(!blob||blob.size<500)throw Error('Poster encoding failed.');
  if(blob.size>2*1024*1024)throw Error('Rendered poster is too large. Try another image.');
  // WebKit can expose a canvas-backed Blob whose internal lazy representation
  // cannot be persisted in IndexedDB. Repack actual JPEG bytes into a fresh
  // memory-backed Blob before assigning it to existing movie metadata.
  const data=await blob.arrayBuffer();
  if(data.byteLength<500)throw Error('Poster file could not be read.');
  return new Blob([data],{type:'image/jpeg'});
 }
 $('px39PosterSave').addEventListener('click',async()=>{
  const id=choice.value;
  try{
   const blob=await posterBlob();
   const item=await latestItem(id);
   if(!item)throw Error('This video was removed; no poster changes were saved.');
   // Replacing an older WebKit byte-backed cover must invalidate its old
   // snapshot before the new art takes the normal Blob/fallback save path.
   delete item.posterData;item.poster=blob;
   await updateStoredVideo(item);
   notice('px39PosterStatus','Poster saved to this local movie. Original video bytes are untouched.');
   $('videoVaultRefresh')?.click();queueRefresh();
  }catch(err){notice('px39PosterStatus','Unable to save poster: '+err.message)}
 });
 $('px39PosterExport').addEventListener('click',async()=>{
  try{
   const blob=await posterBlob();
   await saveOrShare(blob,'PROXIMUS-POSTER-'+clean(nameOf(getItem(choice.value))).replace(/[^a-z0-9-]/gi,'-').slice(0,44)+'.jpg');
   notice('px39PosterStatus','Your poster was shared or downloaded. Your local video is unchanged.');
  }catch(err){notice('px39PosterStatus','Unable to export: '+err.message)}
 });
 document.addEventListener('proximus-video-vault-selected',event=>{playingId=typeof event.detail?.id==='string'?event.detail.id:null});
 // Playback resume metadata is saved frequently. Do not repeatedly decode and
 // replace dozens of poster URLs while the viewer is watching off-screen.
 let shelfDirty=false;
 const onScreen=()=>{
  if(root.closest('[hidden]'))return false;
  const box=root.getBoundingClientRect();
  return box.bottom>0&&box.top<window.innerHeight;
 };
 document.addEventListener('proximus-video-vault-changed',()=>{
  shelfDirty=true;
  if(!document.hidden&&(onScreen()||details.open||forge.open)){
   shelfDirty=false;queueRefresh();
  }
 });
 window.addEventListener('scroll',()=>{
  if(shelfDirty&&!document.hidden&&onScreen()){
   shelfDirty=false;queueRefresh();
  }
 },{passive:true});
 document.addEventListener('proximus-view-changed',event=>{
  if(event.detail?.studio==='videos'){shelfDirty=false;queueRefresh()}
 });
 document.addEventListener('proximus-workspace-restored',()=>{shelfDirty=false;queueRefresh()});
 window.addEventListener('pagehide',()=>{recycleArt();releaseSource()});
 void refresh();
}
