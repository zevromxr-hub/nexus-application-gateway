/* PROXIMUS v3.8.0 — CINEMATIC PREMIERE
 * Uses existing Video Vault metadata and personal still artwork only.
 * No media uploads, new storage databases, network calls, or auto-playing videos. */
import {listStoredVideos} from './video-vault.js';
import {getVaultCoverPoster} from './video-vault-visual-v3.7.js';

const EXPERIENCE_KEY='proximus-cinematic-premiere-v380';
export function premiereOrder(items){
 return (Array.isArray(items)?items:[]).filter(x=>x&&typeof x.id==='string')
  .slice().sort((a,b)=>{
   const inProgress=x=>Number(Number(x.position)>0&&(!Number(x.duration)||Number(x.position)<Number(x.duration)*.98));
   return inProgress(b)-inProgress(a)||
    Number(Boolean(b.favorite))-Number(Boolean(a.favorite))||
    (Number(b.updated||b.added)||0)-(Number(a.updated||a.added)||0);
  });
}
export function premiereLabel(item){
 if(!item)return 'YOUR PRIVATE ENTERTAINMENT';
 if(Number(item.position)>0&&(!Number(item.duration)||Number(item.position)<Number(item.duration)*.98))return 'CONTINUE YOUR STORY';
 return item.favorite?'FROM YOUR FAVORITES':'FROM YOUR COLLECTION';
}
export function initCinematicPremiere(app){
 const $=id=>document.getElementById(id);
 const root=$('proximusPremiere'),filmstrip=$('px38Filmstrip');
 if(!root||!filmstrip)return;
 const title=$('px38PremiereTitle'),description=$('px38PremiereDescription');
 const count=$('px38PremiereCount'),eyebrow=$('px38PremiereEyebrow');
 const art=$('px38PremiereArt'),poster=$('px38PremierePoster');
 const watch=$('px38PremiereWatch'),shuffle=$('px38PremiereShuffle');
 const mode=$('px38PremiereMode'),status=$('px38PremiereStatus');
 const html=document.documentElement;
 let current=null,items=[],cursor=0,generation=0,disposedUrls=[];
 let calm=false,scheduled=false;
 try{calm=localStorage.getItem(EXPERIENCE_KEY)==='calm';}catch{}
 function setCalm(next){
  calm=Boolean(next);
  html.dataset.px38Experience=calm?'calm':'cinema';
  mode.setAttribute('aria-pressed',String(calm));
  mode.textContent=calm?'✧ Cinematic atmosphere: off':'✧ Cinematic atmosphere: on';
  mode.title=calm?'Turn on subtle cinematic glow':'Reduce visual movement and glow';
  try{localStorage.setItem(EXPERIENCE_KEY,calm?'calm':'cinema')}catch{}
 }
 setCalm(calm);
 const revoke=()=>{
  for(const url of disposedUrls)URL.revokeObjectURL(url);
  disposedUrls=[];
 };
 function objectUrl(blob){
  if(!(blob instanceof Blob)||!blob.size)return null;
  const url=URL.createObjectURL(blob);
  disposedUrls.push(url);
  return url;
 }
 function createPoster(blob,cssClass){
  const url=objectUrl(blob);
  if(!url)return null;
  const img=document.createElement('img');
  img.className=cssClass;img.src=url;img.alt='';
  img.loading='lazy';img.decoding='async';
  return img;
 }
 function openVault(){
  app.changeView('videos');
 }
 function openVideo(item){
  if(!item?.id){openVault();return}
  app.changeView('videos');
  document.dispatchEvent(new CustomEvent('proximus-video-vault-watch',{detail:{id:item.id}}));
 }
 function setEmpty(){
  current=null;root.dataset.hasMedia='false';
  title.textContent='Your collection deserves a premiere.';
  description.textContent='Add your favorite local films, clips or shows. PROXIMUS will turn them into a personal cinema with instant resume and beautiful cover artwork.';
  count.textContent='YOUR LIBRARY STARTS HERE';
  eyebrow.textContent='WELCOME TO YOUR CINEMA';
  watch.textContent='▶ Open My Video Vault';
  shuffle.hidden=true;art.replaceChildren();poster.replaceChildren();
  filmstrip.replaceChildren();
  const examples=[
   {icon:'▣',name:'PERSONAL FILMS',note:'Import local videos',go:()=>openVault()},
   {icon:'✧',name:'CINEMATIC ART',note:'Customize your backgrounds',go:()=>$('mediaOpen')?.click()},
   {icon:'♫',name:'SONIC WORLDS',note:'Immersive music experiences',go:()=>app.changeView('reactor')}
  ];
  for(const e of examples){
   const button=document.createElement('button');button.type='button';button.className='px38-film-card px38-empty-card';
   const glyph=document.createElement('span');glyph.className='px38-film-glyph';glyph.textContent=e.icon;
   const name=document.createElement('strong');name.textContent=e.name;
   const note=document.createElement('small');note.textContent=e.note;
   button.append(glyph,name,note);button.addEventListener('click',e.go);filmstrip.append(button);
  }
  status.textContent='Your saved videos remain on this device. No files are uploaded.';
 }
 async function redraw(){
  const turn=++generation;
  let library;
  try{library=await listStoredVideos()}
  catch(error){
   if(turn!==generation)return;
   revoke();setEmpty();
   status.textContent='Your local library could not be read: '+(error?.message||'storage unavailable');
   return;
  }
  if(turn!==generation)return;
  items=premiereOrder(library);
  if(cursor>=items.length)cursor=0;
  revoke();
  if(!items.length){setEmpty();return}
  const selected=items[cursor];
  let personal=null;
  try{personal=await getVaultCoverPoster(selected.id)}catch{}
  if(turn!==generation)return;
  revoke();
  current=selected;
  const name=String(selected.displayTitle||selected.name||'Untitled video').slice(0,160);
  root.dataset.hasMedia='true';
  title.textContent=name;
  count.textContent=items.length+' SAVED '+(items.length===1?'TITLE':'TITLES');
  eyebrow.textContent=premiereLabel(selected);
  const hasResume=Number(selected.position)>0&&(!Number(selected.duration)||Number(selected.position)<Number(selected.duration)*.98);
  const collection=String(selected.collection||'My collection').slice(0,45);
  const duration=Number(selected.duration)>0?Math.max(1,Math.round(selected.duration/60))+' min':'PERSONAL MEDIA';
  description.textContent=(hasResume?'Pick up where you left off. ':'Your next viewing experience starts here. ')+
   collection+' · '+duration+' · private to this browser.';
  watch.textContent=hasResume?'▶ Resume Feature':'▶ Play Feature';
  shuffle.hidden=items.length<2;
  art.replaceChildren();poster.replaceChildren();
  const featureArt=personal||selected.poster;
  if(featureArt instanceof Blob){
   const hero=createPoster(featureArt,'px38-hero-image');
   if(hero){art.append(hero);poster.append(hero.cloneNode(true));}
  }
  filmstrip.replaceChildren();
  const related=items.filter(x=>x.id!==selected.id).slice(0,4);
  if(!related.length){
   const n=document.createElement('p');n.className='px38-film-note';
   n.textContent='Your first premiere is ready. Add more local videos to fill this poster gallery.';
   filmstrip.append(n);
  }
  for(const item of related){
   const button=document.createElement('button');button.type='button';button.className='px38-film-card';
   button.setAttribute('aria-label','Play '+String(item.displayTitle||item.name));
   const thumb=document.createElement('span');thumb.className='px38-film-thumb';
   const image=createPoster(item.poster,'px38-film-image');
   if(image)thumb.append(image);
   else{const glyph=document.createElement('span');glyph.className='px38-film-glyph';glyph.textContent='▶';thumb.append(glyph);}
   const label=document.createElement('span');label.className='px38-film-details';
   const name=document.createElement('strong');name.textContent=String(item.displayTitle||item.name||'Saved video').slice(0,85);
   const tag=document.createElement('small');tag.textContent=Number(item.position)>0?'CONTINUE WATCHING':item.favorite?'★ FAVORITE':'IN YOUR VAULT';
   label.append(name,tag);button.append(thumb,label);
   button.addEventListener('click',()=>openVideo(item));filmstrip.append(button);
  }
  status.textContent='Featured from your own Video Vault. Artwork and video remain local.';
 }
 function queueRefresh(){
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;if(!document.hidden)void redraw()});
 }
 watch.addEventListener('click',()=>openVideo(current));
 shuffle.addEventListener('click',()=>{if(items.length<2)return;cursor=(cursor+1)%items.length;void redraw()});
 mode.addEventListener('click',()=>setCalm(!calm));
 $('px38PremiereMedia')?.addEventListener('click',()=>$('mediaOpen')?.click());
 document.addEventListener('proximus-view-changed',event=>{
  html.dataset.px38View=String(event.detail?.studio||'command');
  if(event.detail?.studio==='command')queueRefresh();
 });
 document.addEventListener('proximus-video-vault-changed',()=>{
  if(html.dataset.px38View==='command')queueRefresh();
 });
 document.addEventListener('proximus-vault-visual-refresh',()=>{
  if(html.dataset.px38View==='command')queueRefresh();
 });
 document.addEventListener('proximus-workspace-restored',queueRefresh);
 document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&html.dataset.px38View==='command')queueRefresh();
 });
 window.addEventListener('pagehide',revoke);
 void redraw();
}
