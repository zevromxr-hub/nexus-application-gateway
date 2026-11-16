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