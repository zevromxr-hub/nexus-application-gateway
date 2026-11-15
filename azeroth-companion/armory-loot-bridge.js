/* NEXUS | AZEROTH COMPANION v2.8 - Armory ↔ Loot Hunter Bridge.
 * Reads existing browser-local wishlist and farm plans; no remote accounts
 * and no changes to Blizzard's read-only API requests.
 */
(()=>{'use strict';
const c=window.NexusArmoryBridgeCore;if(!c)return;
const ARM='nexus_azeroth_connected_v2',LOOT='nexus_azeroth_loot_hunter_v1',PROFILES='nexus_azeroth_armory_bookmarks_v1';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const arm=document.querySelector('[data-section="armory"]'),loot=document.querySelector('[data-section="loot"]'),codex=document.querySelector('[data-section="codex"]');if(!arm||!loot||!codex)return;
let bookmarks=[];
try{const x=JSON.parse(localStorage.getItem(PROFILES)||'[]');if(Array.isArray(x))bookmarks=x.map(c.profile).filter(Boolean).slice(0,20)}catch(_){}
const jump=view=>{const tab=document.querySelector('[data-view="'+view+'"]');if(tab)tab.click()};
const get=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}};
const save=()=>{try{localStorage.setItem(PROFILES,JSON.stringify(bookmarks))}catch(_){feedback('Local storage unavailable — profile shortcuts may not persist.')}};
const panel=document.createElement('div');panel.id='armoryBridge';panel.className='panel ab-panel';
panel.innerHTML='<div class="ab-header"><div><h3>Armory Command Bridge</h3><p class="muted">Connect Blizzard item research to your personal Loot Hunter goals and keep shortcuts to public character profiles.</p></div><span class="ab-version">v2.8</span></div><div class="ab-metrics" id="abMetrics" aria-live="polite"></div><div class="ab-controls"><button type="button" id="abOpenLoot">OPEN LOOT HUNTER</button><button type="button" id="abOpenCodex">OPEN ITEM CODEX</button></div><div class="ab-subhead"><h4>Recent Public Characters</h4><button type="button" id="abBookmarkCurrent">SAVE CURRENT CHARACTER</button></div><div id="abBookmarks" class="ab-bookmarks"></div><p id="abFeedback" class="ab-feedback" role="status" aria-live="polite">Character shortcuts are stored only in this browser. Item progress is not automatically read from your account.</p>';
const grid=arm.querySelector('.grid');if(grid)grid.before(panel);else arm.append(panel);
const lootPanel=document.createElement('div');lootPanel.className='panel ab-panel';lootPanel.id='abLootSummary';
lootPanel.innerHTML='<div class="ab-header"><div><h3>Cross-Studio Item Tracker</h3><p class="muted">Open the Item Codex to research a piece of gear, then choose TRACK GOAL. Existing goals are never duplicated.</p></div></div><div id="abLootMetrics" class="ab-metrics"></div><div class="ab-controls"><button type="button" id="abGoArmory">OPEN ARMORY</button><button type="button" id="abGoCodex">SEARCH ITEMS</button></div>';
loot.querySelector('.loot-metrics')?.after(lootPanel);
function feedback(t){$('abFeedback').textContent=t}
function metrics(){
 const armData=get(ARM),lootData=get(LOOT),summary=c.summary(armData?.wishlist,lootData);
 const parts=[['Wishlist items',summary.wishlisted],['Farm goals',summary.tracked],['Still farming',summary.farming],['Wishlist not tracked',summary.untrackedWishlist]];
 const html=parts.map(([label,num])=>'<div><strong>'+num+'</strong><span>'+esc(label)+'</span></div>').join('');
 $('abMetrics').innerHTML=html;$('abLootMetrics').innerHTML=html;
}
function renderProfiles(){$('abBookmarks').innerHTML=bookmarks.length?bookmarks.map((p,i)=>'<div class="ab-character"><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.realm)+' · '+esc(p.region.toUpperCase())+'</small></div><div class="ab-controls"><button type="button" data-ab-load="'+i+'">LOAD</button><button type="button" data-ab-delete="'+i+'">REMOVE</button></div></div>').join(''):'<div class="empty">No saved character shortcuts. Load a public character, then choose SAVE CURRENT CHARACTER.</div>'}
let lastSuccess=null,lastAttempt=null,pending=0;
function current(){return c.profile({region:$('cxCharacterRegion')?.value,realm:$('cxRealm')?.value,name:$('cxName')?.value})}
function bookmark(p){const normalized=c.profile(p);if(!normalized)return feedback('Enter a valid character and realm first.');bookmarks=c.addProfile(bookmarks,normalized);save();renderProfiles();feedback('Saved public character shortcut: '+normalized.name+'.')}
$('abOpenLoot').addEventListener('click',()=>jump('loot'));
$('abOpenCodex').addEventListener('click',()=>jump('codex'));
$('abGoArmory').addEventListener('click',()=>jump('armory'));
$('abGoCodex').addEventListener('click',()=>jump('codex'));
$('abBookmarkCurrent').addEventListener('click',()=>{const p=current();if(!p)return feedback('Enter a valid public character name and realm.');if(!lastSuccess||JSON.stringify(lastSuccess)!==JSON.stringify(p))return feedback('Load this character successfully from Blizzard before saving a shortcut.');bookmark(p)});
$('cxCharacterForm')?.addEventListener('submit',()=>{lastAttempt=current();lastSuccess=null;pending++;},{capture:true});
const result=$('cxCharacterResult');if(result&&typeof MutationObserver!=='undefined'){const ob=new MutationObserver(()=>{const p=current();if(!p||!lastAttempt||JSON.stringify(p)!==JSON.stringify(lastAttempt))return;if(result.querySelector('h3')&&result.querySelector('.cx-details')&&!result.textContent.includes('Loading'))lastSuccess=p});ob.observe(result,{childList:true,subtree:true})}
document.addEventListener('click',e=>{
 const load=e.target.closest('[data-ab-load]'),del=e.target.closest('[data-ab-delete]');
 if(load){const p=bookmarks[Number(load.dataset.abLoad)];if(!p)return;$('cxCharacterRegion').value=p.region;$('cxRealm').value=p.realm;$('cxName').value=p.name;lastSuccess=null;jump('armory');$('cxCharacterForm').requestSubmit();return}
 if(del){const i=Number(del.dataset.abDelete);if(!Number.isSafeInteger(i)||!bookmarks[i])return;bookmarks.splice(i,1);save();renderProfiles();feedback('Character shortcut removed.');return}
 const track=e.target.closest('[data-ab-track]');if(!track)return;
 const record=c.item({id:track.dataset.abTrack,name:track.dataset.abName,region:track.dataset.abRegion});
 if(!record)return feedback('Item is missing a valid Blizzard item ID.');
 window.dispatchEvent(new CustomEvent('nexus:loot-track',{detail:{id:record.id,name:record.name,region:record.region,note:'Tracked from Blizzard item research ('+record.region.toUpperCase()+').'}}));
 metrics();const goals=get(LOOT);const exists=Array.isArray(goals)&&goals.some(g=>Number(g.id)===record.id);
 feedback(exists?'Item #'+record.id+' is on your Loot Hunter board.':'Could not confirm this goal was saved. Check Loot Hunter storage.');
});
function createTrackButton(id,name,region){
 const normalized=c.item({id,name,region});if(!normalized)return null;
 const b=document.createElement('button');b.type='button';b.className='ab-track';b.dataset.abTrack=String(normalized.id);b.dataset.abName=normalized.name;b.dataset.abRegion=normalized.region;b.textContent='TRACK GOAL';b.setAttribute('aria-label','Track '+normalized.name+' in Loot Hunter');return b;
}
function decorate(){
 // Item Codex result, including icon-enhanced results.
 const card=$('cxItemResult')?.querySelector('.cx-item');
 if(card&&!card.querySelector('[data-ab-track]')){const saveButton=card.querySelector('[data-cxsave]');if(saveButton){const b=createTrackButton(saveButton.dataset.cxsave,saveButton.dataset.cxname,saveButton.dataset.cxregion);if(b)saveButton.parentElement?.append(b)}}
 // Current equipped items — one button per returned item.
 $('cxEquipment')?.querySelectorAll('.cx-saved').forEach(row=>{
  if(row.querySelector('[data-ab-track]'))return;const source=row.querySelector('[data-cxopen]');if(!source)return;const name=row.querySelector('strong')?.textContent||('Item #'+source.dataset.cxopen);
  const b=createTrackButton(source.dataset.cxopen,name,source.dataset.cxregion);if(b)row.append(b);
 });
 // Wishlist and recent Item Codex records — enrich without modifying storage.
 for(const id of ['cxWishlist','cxRecent']){
  $(id)?.querySelectorAll('.cx-saved').forEach(row=>{if(row.querySelector('[data-ab-track]'))return;const source=row.querySelector('[data-cxopen]');if(!source)return;const name=row.querySelector('strong')?.textContent;const b=createTrackButton(source.dataset.cxopen,name,source.dataset.cxregion);if(b)row.querySelector('.actions')?.append(b)});
 }
 // Official Blizzard item name search results.
 $('discoverResults')?.querySelectorAll('.discover-card').forEach(row=>{if(row.querySelector('[data-ab-track]'))return;const source=row.querySelector('[data-cxopen]');if(!source)return;const name=row.querySelector('strong')?.textContent;const b=createTrackButton(source.dataset.cxopen,name,source.dataset.cxregion);if(b)row.append(b)});
}
const roots=['cxItemResult','cxEquipment','cxWishlist','cxRecent','discoverResults'];
if(typeof MutationObserver!=='undefined')for(const id of roots){const node=$(id);if(node){const observer=new MutationObserver(decorate);observer.observe(node,{childList:true,subtree:true})}}
window.addEventListener('nexus:loot-updated',metrics);
window.addEventListener('storage',e=>{if(e.key===ARM||e.key===LOOT)metrics();if(e.key===PROFILES){const next=get(PROFILES);if(Array.isArray(next)){bookmarks=next.map(c.profile).filter(Boolean).slice(0,20);renderProfiles()}}});
metrics();renderProfiles();decorate();
})();
