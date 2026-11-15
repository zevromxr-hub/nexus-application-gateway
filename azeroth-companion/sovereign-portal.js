/* NEXUS | AZEROTH v4.5 — SOVEREIGN PORTAL
 * Additional website-shell experience only. No studio data, OAuth or Worker access.
 * Preferences use a separate allowlisted local record; nothing is uploaded.
 */
(()=>{'use strict';
const main=document.querySelector('.main'),nav=document.querySelector('.sidebar .nav'),top=main?.querySelector(':scope > .top');
const home=document.getElementById('sxExperience'),toolbar=top?.querySelector('.sx-toolbar');
if(!main||!nav||!top||!home||!toolbar||document.getElementById('spQuickDeck'))return;
const KEY='nexus_azeroth_portal_v45',MAX=6,DEFAULT=['dominion','atlas','warcraft','guide'];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validId=x=>typeof x==='string'&&/^[a-z0-9-]{2,32}$/.test(x);
let state={favorites:[...DEFAULT],tourSeen:false},opener=null,step=0;
function read(){
 try{
  const x=JSON.parse(localStorage.getItem(KEY)||'null');if(!x||typeof x!=='object'||Array.isArray(x))return;
  if(Array.isArray(x.favorites))state.favorites=[...new Set(x.favorites.filter(validId))].slice(0,MAX);
  if(typeof x.tourSeen==='boolean')state.tourSeen=x.tourSeen;
 }catch(_){}
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){/* optional local preferences */}}
read();
const navButtons=()=>[...nav.querySelectorAll('button[data-view]')];
const names=()=>new Map(navButtons().map(b=>[b.dataset.view,b.textContent.replace(/^[^a-zA-Z0-9]+/,'').trim()||b.dataset.view]));
function jump(view){
 if(!validId(view))return;
 const button=navButtons().find(x=>x.dataset.view===view);if(!button)return;
 button.click();window.scrollTo({top:0,behavior:'instant'});
}
function currentView(){return nav.querySelector('button[data-view].active')?.dataset.view||'overview'}
const deck=document.createElement('section');deck.className='sp-deck';deck.id='spQuickDeck';
deck.setAttribute('aria-label','Custom quick access shortcuts');
deck.innerHTML='<div class="sp-deck-top"><div><span class="sx-eyebrow">YOUR COMMAND SHORTCUTS</span><h3>My Quick Deck</h3><p>Keep up to six favorite destinations one tap away. These shortcuts are personal to this browser.</p></div><button type="button" id="spCustomize" aria-expanded="false" aria-controls="spDeckEditor">CUSTOMIZE SHORTCUTS</button></div>'+
 '<div class="sp-deck-buttons" id="spFavorites"></div>'+
 '<div class="sp-deck-editor" id="spDeckEditor" hidden><div class="sp-deck-editor-head"><strong>Choose your quick access tools</strong><span id="spDeckCount" role="status"></span></div><div class="sp-deck-checks" id="spDeckChoices"></div><p class="sp-muted" id="spDeckMessage" role="status">Select up to six destinations. Your existing studios are not modified.</p><div class="sp-deck-footer"><button type="button" id="spResetShortcuts">RESET SHORTCUTS</button><button type="button" id="spDoneShortcuts">DONE</button></div></div>'+
 '<div class="sp-tour-prompt" id="spTourPrompt" hidden><span>New here? Take a short tour of the website, navigation and account safety.</span><div><button type="button" data-sp-tour>START WEBSITE TOUR</button><button type="button" id="spDismissTour">NOT NOW</button></div></div>';
const split=home.querySelector('.sx-home-split');if(split)split.after(deck);else home.append(deck);
function renderDeck(focusId=null){
 const known=names();const choices=[...new Set(state.favorites)].filter(id=>known.has(id));
 // Ignore shortcuts for removed tools and prevent invisible choices consuming a slot.
 if(choices.length!==state.favorites.length){state.favorites=choices;persist()}
 const zone=document.getElementById('spFavorites');zone.replaceChildren();
 if(!choices.length){
  const p=document.createElement('p');p.className='sp-muted';p.textContent='No shortcuts chosen. Select Customize Shortcuts to add your favorite destinations.';zone.append(p);
 }
 for(const id of choices){
  const btn=document.createElement('button');btn.type='button';btn.dataset.spGo=id;
  const symbol=document.createElement('span');symbol.setAttribute('aria-hidden','true');symbol.className='sp-deck-icon';symbol.textContent='✦';
  const label=document.createElement('span');label.className='sp-deck-label';label.textContent=known.get(id);
  const arrow=document.createElement('span');arrow.className='sp-deck-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';
  btn.append(symbol,label,arrow);zone.append(btn);
 }
 const choicesWrap=document.getElementById('spDeckChoices');choicesWrap.replaceChildren();
 for(const [id,name]of known){
  const label=document.createElement('label');label.className='sp-deck-choice';
  const check=document.createElement('input');check.type='checkbox';check.dataset.spFavorite=id;check.checked=choices.includes(id);
  check.disabled=!check.checked&&choices.length>=MAX;
  const title=document.createElement('span');title.textContent=name;
  label.append(check,title);choicesWrap.append(label);
 }
 document.getElementById('spDeckCount').textContent=choices.length+' / '+MAX+' selected';
 // Rebuilding checkbox nodes should not discard keyboard focus after each change.
 if(focusId&&document.getElementById('spDeckEditor')?.hidden===false){
  [...choicesWrap.querySelectorAll('input[data-sp-favorite]')].find(x=>x.dataset.spFavorite===focusId)?.focus({preventScroll:true});
 }
}
function editing(open){
 const editor=document.getElementById('spDeckEditor');editor.hidden=!open;
 const trigger=document.getElementById('spCustomize');trigger.setAttribute('aria-expanded',String(open));
 if(open){renderDeck();editor.querySelector('input:not([disabled])')?.focus({preventScroll:true})}
 else trigger.focus({preventScroll:true});
}
document.getElementById('spCustomize').addEventListener('click',()=>{
 const editor=document.getElementById('spDeckEditor');editing(editor.hidden);
});
document.getElementById('spDoneShortcuts').addEventListener('click',()=>editing(false));
document.getElementById('spResetShortcuts').addEventListener('click',()=>{
 state.favorites=[...DEFAULT].filter(x=>names().has(x));persist();renderDeck();
 document.getElementById('spDeckMessage').textContent='Your default shortcuts were restored. All tools remain available in navigation.';
});
document.getElementById('spDeckChoices').addEventListener('change',e=>{
 const input=e.target.closest('input[data-sp-favorite]');if(!input)return;
 const id=input.dataset.spFavorite;if(!validId(id)||!names().has(id))return;
 if(input.checked&&!state.favorites.includes(id)){
  if(state.favorites.length>=MAX){input.checked=false;document.getElementById('spDeckMessage').textContent='Maximum six shortcuts. Uncheck an existing item first.';return}
  state.favorites.push(id);
 }else if(!input.checked)state.favorites=state.favorites.filter(x=>x!==id);
 persist();renderDeck(id);
 document.getElementById('spDeckMessage').textContent='Shortcuts updated on this device.';
});
deck.addEventListener('click',e=>{const b=e.target.closest('[data-sp-go]');if(b)jump(b.dataset.spGo)});
renderDeck();
const context=document.createElement('nav');context.className='sp-contextbar';context.id='spContext';context.setAttribute('aria-label','Current page and return home');
context.innerHTML='<div class="sp-context-location"><span aria-hidden="true">⌂</span><span>NEXUS / AZEROTH</span><span aria-hidden="true">/</span><strong id="spCurrentView">Home</strong></div><div class="sp-context-actions"><button type="button" id="spContextHome">RETURN HOME</button></div>';
top.after(context);
document.getElementById('spContextHome').addEventListener('click',()=>jump('overview'));
function refreshContext(){
 const view=currentView(),label=names().get(view)||'Companion tool';
 const p=document.getElementById('spCurrentView');
 if(p.textContent!==label)p.textContent=label;
 context.hidden=view==='overview';
}
// The core router emits one event after it has updated active studio classes.
// Avoid observing each class mutation when dozens of navigation buttons change.
document.addEventListener('nexus:view-activated',refreshContext);
refreshContext();
const online=document.createElement('div');online.className='sp-offline';online.id='spOffline';online.setAttribute('role','status');online.textContent='Your device appears offline. Saved planning tools may still be available, but Blizzard lookups and release checks require a connection.';
top.after(online);
function connection(){online.hidden=navigator.onLine!==false}
window.addEventListener('online',connection);window.addEventListener('offline',connection);connection();
const tour=[
 {title:'Welcome to the Sovereign Portal',body:'The new Home keeps your most useful destinations together. You can explore without signing in; planning records stay in your browser.',target:'overview',action:'OPEN HOME'},
 {title:'Discover everything without clutter',body:'On desktop, expand the navigation groups in the sidebar. On iPhone, use All Tools. You can always search studios in the Command Launcher.',target:'guide',action:'OPEN PLAYER GUIDE'},
 {title:'Make the homepage yours',body:'Use My Quick Deck to keep up to six destinations ready for your next visit. These preferences do not affect saved character or item records.',target:null,action:null},
 {title:'Keep account data separate',body:'My Azeroth opens the secure Battle.net portal. Only Blizzard can authenticate a player. Manual planning records are never presented as verified inventory.',target:'personal',action:'OPEN MY AZEROTH'},
 {title:'Back up before moving devices',body:'Sovereign Data Vault can export selected local planner records into a JSON file. Use it before switching browsers or clearing device storage.',target:'vault',action:'OPEN DATA VAULT'}
];
const overlay=document.createElement('div');overlay.className='sp-tour-overlay';overlay.hidden=true;overlay.id='spTour';
overlay.innerHTML='<div class="sp-tour-shade" data-sp-close></div><section class="sp-tour-dialog" role="dialog" aria-modal="true" aria-labelledby="spTourTitle" tabindex="-1"><div class="sp-tour-head"><span class="sx-eyebrow">NEXUS / WEBSITE TOUR</span><button type="button" class="sp-tour-close" data-sp-close aria-label="Close website tour">×</button></div><div class="sp-tour-progress" id="spTourProgress"></div><h2 id="spTourTitle">Welcome</h2><p id="spTourBody"></p><div class="sp-tour-actions"><button type="button" id="spTourBack">BACK</button><button type="button" id="spTourGo" hidden>OPEN FEATURE</button><button type="button" class="sp-tour-next" id="spTourNext">NEXT</button></div><p class="sp-tour-hint">Optional orientation · no permissions or account changes</p></section>';
document.body.append(overlay);
function renderTour(){
 const item=tour[step],progress=document.getElementById('spTourProgress');
 progress.replaceChildren();
 for(let n=0;n<tour.length;n++){const bar=document.createElement('span');if(n<=step)bar.className='active';progress.append(bar)}
 document.getElementById('spTourTitle').textContent=item.title;
 document.getElementById('spTourBody').textContent=item.body;
 document.getElementById('spTourBack').disabled=step===0;
 document.getElementById('spTourNext').textContent=step===tour.length-1?'FINISH TOUR':'NEXT';
 const action=document.getElementById('spTourGo');action.hidden=!item.target;
 if(item.target)action.textContent=item.action;
}
function dismiss(){
 if(overlay.hidden)return;
 overlay.hidden=true;document.body.classList.remove('sp-tour-open');
 state.tourSeen=true;persist();updatePrompt();
 if(opener&&opener.isConnected)opener.focus({preventScroll:true});
}
function startTour(){
 opener=document.activeElement;step=0;renderTour();
 overlay.hidden=false;document.body.classList.add('sp-tour-open');
 overlay.querySelector('.sp-tour-close')?.focus({preventScroll:true});
}
function updatePrompt(){document.getElementById('spTourPrompt').hidden=state.tourSeen}
const help=document.createElement('button');help.type='button';help.id='spTourButton';help.className='sx-tool-button';help.setAttribute('aria-label','Start guided website tour');help.title='Website tour';help.textContent='?';toolbar.append(help);
help.addEventListener('click',startTour);
deck.addEventListener('click',e=>{if(e.target.closest('[data-sp-tour]'))startTour()});
document.getElementById('spDismissTour').addEventListener('click',()=>{
 state.tourSeen=true;persist();updatePrompt();
});
overlay.addEventListener('click',e=>{if(e.target.closest('[data-sp-close]'))dismiss()});
document.getElementById('spTourBack').addEventListener('click',()=>{step=Math.max(0,step-1);renderTour()});
document.getElementById('spTourNext').addEventListener('click',()=>{
 if(step===tour.length-1){dismiss();return}
 step++;renderTour();
});
document.getElementById('spTourGo').addEventListener('click',()=>{
 const target=tour[step].target;dismiss();if(target)jump(target);
});
document.addEventListener('keydown',e=>{
 if(overlay.hidden)return;
 if(e.key==='Escape'){e.preventDefault();dismiss();return}
 if(e.key!=='Tab')return;
 const focusables=[...overlay.querySelectorAll('button:not([disabled]):not([hidden])')].filter(el=>el.getClientRects().length);
 if(!focusables.length)return;
 const first=focusables[0],last=focusables[focusables.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
updatePrompt();
window.addEventListener('pageshow',()=>{refreshContext();connection();renderDeck()});
document.body.classList.add('sp-portal-ready');
})();