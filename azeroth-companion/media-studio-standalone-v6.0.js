/* NEXUS | AZEROTH v6.0 — isolated Media Studio navigation.
   Rehomes the existing v5.9 player/background controls without changing storage. */
(()=>{'use strict';
 const nav=document.querySelector('.sidebar .nav'),main=document.querySelector('.main'),panel=document.getElementById('nxMediaStudio');
 if(!nav||!main||!panel||document.getElementById('nxStandaloneMediaStudio'))return;
 const mediaNav=document.createElement('button');
 mediaNav.type='button';mediaNav.dataset.view='media';mediaNav.textContent='♫ Media Studio';
 const talentNav=nav.querySelector('[data-view="talents"]');
 if(talentNav)talentNav.after(mediaNav);else nav.append(mediaNav);
 const mount=document.createElement('div');mount.id='nxStandaloneMediaStudio';
 const section=document.createElement('section');section.className='section nx-standalone-section';section.dataset.section='media';
 section.innerHTML='<div class="nx-standalone-hero"><span class="wow-kicker">NEXUS / PERSONALIZATION DIVISION</span><h2>MEDIA <em>STUDIO</em></h2><p>Personalize your Azeroth workspace with a locally stored animated background and your own private music library. No account connection or upload to a server is needed.</p><div class="nx-studio-feature-tags"><span>✦ GIF &amp; VIDEO BACKGROUNDS</span><span>♫ LOCAL MUSIC PLAYER</span><span>◇ DEVICE-PRIVATE STORAGE</span></div></div><div class="nx-studio-intro"><div><strong>Backdrop Architect</strong><p>Add an ambient GIF or muted looping video, then fine-tune visibility, contrast and fit.</p></div><div><strong>Personal Soundtrack</strong><p>Keep your local tracks organized and open the floating audio player from anywhere.</p></div></div>';
 section.append(panel);
 mount.append(section);
 const footer=main.querySelector('.footer');
 if(footer)main.insertBefore(mount,footer);else main.append(mount);
 panel.open=true;
 const summary=panel.querySelector('summary');
 if(summary){summary.textContent='BACKGROUND & MUSIC CONTROLS';summary.setAttribute('aria-label','Collapse or expand media studio controls')}
 const heading=panel.querySelector('.nx-media-head .wow-kicker');if(heading)heading.textContent='NEXUS / PRIVATE MEDIA STUDIO';
 const player=panel.querySelector('#nxMusicOpen');
 const quick=document.createElement('div');quick.className='nx-studio-quick';
 quick.innerHTML='<div><strong>Studio controls are ready</strong><p>Choose a background or add music below. Your previously saved local media stays in the same browser storage.</p></div><button type="button" id="nxStudioLaunchPlayer">♫ OPEN PLAYER</button>';
 panel.before(quick);
 quick.querySelector('button').addEventListener('click',()=>player?.click());
 // The core companion handles [data-view] buttons and [data-section] visibility.
 // Only the panel node is moved; media IDs, listeners, IndexedDB and audio remain untouched.
 document.dispatchEvent(new CustomEvent('nexus:studio-ready',{detail:{view:'media'}}));
})();
/* v6.0.1 iPhone playback recovery: user-gesture video start + readable status.
   This add-on deliberately keeps the v5.9 IndexedDB record and player intact. */
(()=>{'use strict';
 const host=document.getElementById('nxStandaloneMediaStudio');
 const controls=document.querySelector('#nxMediaStudio .nx-media-buttons');
 const status=document.getElementById('nxBackgroundStatus');
 const canvas=document.querySelector('#nxMediaBackdrop .nx-media-canvas');
 if(!host||!controls||!status||!canvas||document.getElementById('nxMediaRetry'))return;
 const retry=document.createElement('button');retry.type='button';retry.id='nxMediaRetry';retry.className='nx-media-retry';retry.textContent='▶ PLAY BACKGROUND VIDEO';
 retry.setAttribute('aria-label','Start or retry local background video playback');
 const info=document.createElement('p');info.id='nxMediaPlaybackHint';info.className='nx-media-playback-hint';info.textContent='On iPhone, press PLAY BACKGROUND VIDEO once if Safari prevents automatic playback.';
 controls.prepend(retry);controls.after(info);
 let playbackInProgress=false;
 function video(){return canvas.querySelector('video')}
 function sync(){
   const v=video(),visible=!!v;
   retry.hidden=!visible;info.hidden=!visible;
   if(!visible)return;
   retry.textContent=!v.paused&&!v.ended?'✓ VIDEO PLAYING':'▶ PLAY BACKGROUND VIDEO';
   if(!v.paused&&!v.ended)status.textContent='Background video playing · muted and looping on this device.';
 }
 function errorMessage(v,err){
   if(v.error?.code===4||v.error?.code===3){
     return 'This video cannot be decoded on this device. Try an MP4 encoded with H.264 video and AAC audio (or a GIF). The file is still saved locally.';
   }
   if(err?.name==='NotSupportedError')return 'Unsupported video format or codec on this browser. Try H.264 MP4 or GIF.';
   if(err?.name==='NotAllowedError')return 'iPhone blocked automatic playback. Tap PLAY BACKGROUND VIDEO to start it manually.';
   return 'Video did not start. Tap PLAY BACKGROUND VIDEO to retry; if it still fails, try a compatible H.264 MP4 or GIF.';
 }
 function attempt(userInitiated=false){
   const v=video();if(!v||playbackInProgress)return;
   const stage=document.getElementById('nxMediaBackdrop');
   const toggle=document.getElementById('nxMediaToggle');
   if(!stage||!toggle)return;
   if(toggle.textContent.trim()==='SHOW BACKGROUND'){
     // Do not click asynchronously: keep video.play() inside this gesture.
     toggle.click();
   }
   stage.hidden=false;v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');
   v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');
   v.loop=true;v.autoplay=true;
   playbackInProgress=true;
   let result;
   try{result=v.play()}catch(e){playbackInProgress=false;status.textContent=errorMessage(v,e);sync();return}
   if(result&&typeof result.then==='function'){
     result.then(()=>{playbackInProgress=false;sync()},e=>{playbackInProgress=false;status.textContent=errorMessage(v,e);retry.textContent='▶ RETRY VIDEO PLAYBACK'});
   }else{playbackInProgress=false;sync()}
 }
 retry.addEventListener('click',()=>attempt(true));
 canvas.addEventListener('playing',sync,true);
 canvas.addEventListener('pause',sync,true);
 canvas.addEventListener('error',e=>{if(e.target?.tagName==='VIDEO'){status.textContent=errorMessage(e.target);sync()}},true);
 const observer=new MutationObserver(()=>{sync();const v=video();if(v&&!v.dataset.nxPlaybackHooked){v.dataset.nxPlaybackHooked='1';v.addEventListener('loadedmetadata',sync);v.addEventListener('ended',sync)}});
 observer.observe(canvas,{childList:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
 sync();
})();
