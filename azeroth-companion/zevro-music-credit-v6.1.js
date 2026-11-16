/* NEXUS | AZEROTH v6.1 — branded player credit, no storage changes. */
(()=>{'use strict';
 const dock=document.getElementById('nxMusicDock');
 if(!dock||document.getElementById('nxZevRoCredit'))return;
 const credit=document.createElement('div');credit.id='nxZevRoCredit';credit.className='nx-zevro-credit';
 const art=document.createElement('img');
 art.src='./assets/zevro-music-crest.webp';
 art.alt='ZevRo custom music insignia';
 art.loading='lazy';art.decoding='async';
 const fallback=document.createElement('span');fallback.className='nx-zevro-fallback';fallback.textContent='ZevRo';fallback.hidden=true;
 const note=document.createElement('small');note.textContent='Powered by ZevRo Development';
 art.addEventListener('error',()=>{art.hidden=true;fallback.hidden=false});
 credit.append(art,fallback,note);
 const now=dock.querySelector('#nxMusicNow');if(now)now.before(credit);else dock.prepend(credit);
})();