/* NEXUS | AZEROTH v7.7.2 — optional first-party welcome soundtrack.
 * Uses the existing #nxMusicAudio element; no second player, no repository
 * tokens or uploads, no changes to private IndexedDB playlists.
 * Browsers decide whether autoplay is permitted.
 */
(()=>{'use strict';
const audio=document.getElementById('nxMusicAudio');
const dock=document.getElementById('nxMusicDock');
const playerOpen=document.getElementById('nxMusicOpen');
const music=document.getElementById('nxHyperMusic');
if(!audio||!dock||!playerOpen||!music||document.getElementById('nxWelcomeTrack'))return;
const mobile=matchMedia('(max-width:800px)');
const status=document.createElement('button');
status.id='nxWelcomeTrack';status.className='nx-welcome-track';
status.type='button';status.hidden=true;
status.setAttribute('aria-label','Play NEXUS welcome soundtrack');
status.textContent='♫ PLAY WELCOME THEME';
document.body.append(status);
const top=document.querySelector('main.main > .top');
const mobileSlot=document.createElement('div');
mobileSlot.className='nx-welcome-mobile-slot';
mobileSlot.id='nxWelcomeMobileSlot';
if(top)top.append(mobileSlot);
let config=null,playingSource='',pending=false,trackAvailable=false;
function isWelcome(){return !!playingSource&&audio.currentSrc===playingSource||!!playingSource&&audio.src===playingSource}
function placement(){
 if(mobile.matches&&top){if(status.parentElement!==mobileSlot)mobileSlot.append(status)}
 else if(status.parentElement!==document.body)document.body.append(status);
 update();
}
function update(){
 status.hidden=!trackAvailable;
 if(!trackAvailable)return;
 if(isWelcome()){
  status.textContent=audio.paused?'♫ PLAY WELCOME THEME':'♫ PAUSE WELCOME THEME';
  status.setAttribute('aria-label',audio.paused?'Play NEXUS welcome soundtrack':'Pause NEXUS welcome soundtrack');
 }else status.textContent=mobile.matches?'♫ TAP TO PLAY WELCOME THEME':'♫ PLAY WELCOME THEME';
}
function start(byUser){
 if(!config||!trackAvailable)return;
 if(!byUser&&!audio.paused)return; // Never displace music already playing.
 if(!isWelcome()){
  if(!byUser&&audio.src)return; // No automatic override of an existing local track.
  audio.pause();
  audio.src=config.url;
  audio.volume=config.volume;
  const now=document.getElementById('nxMusicNow');
  if(now)now.textContent=config.title+' · Site welcome soundtrack';
 }
 // Do not await network work before play(): preserve mobile click activation.
 const promise=audio.play();
 if(promise&&typeof promise.then==='function'){
  promise.then(()=>{
   pending=false;update();
  }).catch(()=>{
   pending=false;
   // Rejected autoplay is normal on desktop; user can start with one tap.
   update();
  });
 }
}
status.addEventListener('click',()=>{
 if(isWelcome()&&!audio.paused){audio.pause();update();return}
 start(true);
 dock.hidden=false;
 music.setAttribute('aria-expanded','true');
 update();
});
// Intercept only the hosted introduction's natural ending before the private
// player's local playlist auto-next listener runs. Local songs stay unchanged.
audio.addEventListener('ended',event=>{
 if(!isWelcome())return;
 event.stopImmediatePropagation();
 update();
},true);
for(const name of ['play','pause','emptied','loadedmetadata']){
 audio.addEventListener(name,update);
}
mobile.addEventListener?.('change',placement);
placement();
async function setup(){
 let settings;
 try{
  const r=await fetch('./site-soundtrack.json',{cache:'no-store',credentials:'same-origin'});
  if(!r.ok)return;
  settings=await r.json();
 }catch(_){return}
 if(settings?.enabled!==true||typeof settings.file!=='string')return;
 const path=settings.file;
 // Restrict the configured media file to the site's own assets folder.
 if(!/^\.\/assets\/[a-zA-Z0-9_-]+\.(mp3|m4a|ogg)$/i.test(path))return;
 const url=new URL(path,document.baseURI);
 if(url.origin!==location.origin)return;
 try{
  const response=await fetch(url.href,{method:'HEAD',credentials:'same-origin',cache:'no-store'});
  if(!response.ok)return; // No asset uploaded yet: don't show a broken player.
 }catch(_){return}
 config={
  url:url.href,
  title:String(settings.title||'NEXUS Welcome Theme').slice(0,80),
  volume:Number.isFinite(Number(settings.volume))?Math.max(0,Math.min(1,Number(settings.volume))):0.55,
  autoplayDesktop:settings.autoplayDesktop!==false
 };
 playingSource=config.url;
 trackAvailable=true;
 update();
 // Browsers commonly reject unmuted autoplay; show a one-tap fallback.
 if(!mobile.matches&&config.autoplayDesktop)start(false);
}
setup();
})();
