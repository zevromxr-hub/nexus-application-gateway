/* NEXUS | AZEROTH v7.1 — Hyper Access & Reversible Studio Retirement
 * Never deletes saved records, browser databases, media, old modules, or listener handlers.
 * Retired sections remain available through the archived-tools panel in Data & Backup.
 */
(()=>{'use strict';
if(document.getElementById('nxHyperMusic'))return;
const nav=document.querySelector('.sidebar .nav'),main=document.querySelector('.main'),data=document.querySelector('[data-section="data"]');
if(!nav||!main||!data)return;
const retired=[
 {view:'warcraft',name:'War Room',why:'Manual weekly preparation and encounter notes overlap with newer progression tools.'},
 {view:'dungeons',name:'Dungeon Route Architect',why:'Manual ordered route notes; no live pathing or enemy-force calculations.'},
 {view:'professions',name:'Profession Profit Lab',why:'User-entered price estimates, not verified auction or market quotes.'},
 {view:'equipment',name:'Gear Comparison Laboratory',why:'Custom weighted estimates, not Blizzard-verified upgrades or combat simulation.'},
 {view:'fieldlab',name:'Player Field Lab',why:'Developer-oriented manual test checklist, no live player-data intelligence.'},
 {view:'weekly-vault',name:'Weekly Vault Tracker',why:'Self-reported activity targets, not verified Great Vault reward eligibility.'}
];
for(const item of retired){
 const b=nav.querySelector('button[data-view="'+item.view+'"]');
 if(!b)continue;
 b.dataset.nxRetired='true';
 b.hidden=true;b.setAttribute('aria-hidden','true');b.setAttribute('tabindex','-1');
 b.title='Retired from primary navigation. Recover access from Data & Backup.';
}
const music=document.createElement('button');
music.type='button';music.id='nxHyperMusic';music.className='nx-hyper-music';
music.innerHTML='<span class="nx-hyper-note" aria-hidden="true">♫</span><span class="nx-hyper-text">HYPER MUSIC<small id="nxHyperMusicState">OPEN PLAYER</small></span>';
music.setAttribute('aria-label','Open NEXUS music player from any studio');
music.title='Open the existing locally stored music library without leaving this page';
document.body.append(music);
// On phones the launcher belongs to the sticky navigation's normal document flow.
// Desktop keeps the original fixed bottom-left launcher unchanged.
const mobileMusicSlot=document.createElement('div');
mobileMusicSlot.id='nxMobileMusicSlot';
mobileMusicSlot.className='nx-mobile-music-slot';
mobileMusicSlot.setAttribute('aria-label','Quick access to music');
nav.before(mobileMusicSlot);
const mobileMusicQuery=window.matchMedia('(max-width: 800px)');
function placeMusic(){
 if(mobileMusicQuery.matches){
  if(music.parentElement!==mobileMusicSlot)mobileMusicSlot.append(music);
 }else if(music.parentElement!==document.body){
  document.body.append(music);
 }
}
mobileMusicQuery.addEventListener?.('change',placeMusic);
placeMusic();
function player(){return document.getElementById('nxMusicDock')}
function syncMusic(){
 const dock=player(),audio=document.getElementById('nxMusicAudio');
 music.classList.toggle('nx-hyper-playing',!!audio&&!audio.paused&&!audio.ended);
 const open=!!dock&&!dock.hidden;
 music.setAttribute('aria-expanded',String(open));
 music.querySelector('#nxHyperMusicState').textContent=!dock?'MEDIA UNAVAILABLE':open?'PLAYER OPEN':audio&&!audio.paused?'NOW PLAYING':'OPEN PLAYER';
}
music.addEventListener('click',()=>{
 const dock=player(),opener=document.getElementById('nxMusicOpen');
 if(!dock||!opener){music.querySelector('#nxHyperMusicState').textContent='PLAYER NOT READY';return}
 if(dock.hidden)opener.click();
 else{dock.hidden=false}
 syncMusic();
 dock.querySelector('#nxMusicClose')?.focus({preventScroll:true});
});
document.addEventListener('click',e=>{
 if(e.target.closest('#nxMusicClose,#nxMusicOpen,#nxStudioLaunchPlayer,#nxMusicPlay,#nxMusicNext,#nxMusicPrev'))queueMicrotask(syncMusic)
});
const audio=document.getElementById('nxMusicAudio');
if(audio){for(const type of ['play','pause','ended','loadedmetadata'])audio.addEventListener(type,syncMusic)}
syncMusic();
const archive=document.createElement('section');archive.id='nxRetiredArchive';archive.className='nx-retired-archive';
archive.innerHTML='<details><summary>ARCHIVED TOOLS <small>6 retired navigation entries · data preserved</small></summary>'+
'<p>These older manual tools are no longer featured in the main navigation. All underlying code, saved records and existing export controls remain available during this reversible transition. Opening one here does not restore it to primary navigation.</p>'+
'<div id="nxArchiveItems" class="nx-archive-items"></div>'+
'<p class="nx-archive-caution">Existing data is not deleted by retirement. Export relevant backups before clearing browser data or deleting the website.</p></details>';
data.append(archive);
const list=archive.querySelector('#nxArchiveItems');
for(const item of retired){
 const card=document.createElement('div');card.className='nx-archive-item';
 const info=document.createElement('div');const heading=document.createElement('strong');heading.textContent=item.name;
 const explanation=document.createElement('small');explanation.textContent=item.why;info.append(heading,explanation);card.append(info);
 const action=document.createElement('button');action.type='button';action.textContent='OPEN ARCHIVED TOOL';
 action.addEventListener('click',()=>{
  const original=nav.querySelector('button[data-view="'+item.view+'"]');
  if(!original){action.textContent='NOT AVAILABLE';return}
  original.click();
  requestAnimationFrame(()=>{
   const visible=document.querySelector('[data-section="'+item.view+'"].active');
   if(!visible){action.textContent='VIEW UNAVAILABLE';return}
   let back=visible.querySelector('.nx-archive-return');
   if(!back){back=document.createElement('button');back.type='button';back.className='nx-archive-return';back.textContent='← BACK TO DATA & BACKUP';
    back.addEventListener('click',()=>nav.querySelector('button[data-view="data"]')?.click());
    visible.prepend(back)
   }
   window.scrollTo({top:0,behavior:'instant'});
  });
 });
 card.append(action);list.append(card);
}
// Surface retirement state to other additive UI. Do not mutate third-party adapters.
window.NexusArchivedStudios=Object.freeze({ids:Object.freeze(retired.map(x=>x.view)),version:'7.1.0'});
})();
