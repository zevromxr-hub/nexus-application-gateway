/* NEXUS | AZEROTH v7.9.1 — Session-independent saved progress.
 * Read-only overview of local planning data; never handles or persists account tokens.
 */
(()=>{'use strict';
 const page=document.querySelector('[data-section="personal"]');
 if(!page||document.getElementById('nxAccountPersistence'))return;
 const keys=[
  ['Talent Forge drafts','nexus_azeroth_talent_forge_v1','array'],
  ['Item Atlas records','nexus_azeroth_item_atlas_v1','array'],
  ['Loot Hunter goals','nexus_azeroth_loot_hunter_v1','array'],
  ['Character targets','nexus_azeroth_character_targets_v1','targets'],
  ['Core companion data','nexus_azeroth_companion_genesis_v1','object']
 ];
 const block=document.createElement('section');block.id='nxAccountPersistence';block.className='nx-account-persistence panel';
 block.innerHTML='<div class="nx-ap-header"><div><span class="wow-kicker">NEXUS / ACCOUNT RELIABILITY</span><h3>My Progress Is Separate From Login</h3><p>Battle.net authentication verifies access to Blizzard account data. Your manually saved builds and trackers remain in this browser, independent of the verification timer.</p></div><span class="nx-ap-badge">LOCAL DATA SAFE BY DESIGN</span></div>'+
 '<div id="nxApStats" class="nx-ap-stats"></div><p id="nxApStatus" role="status" aria-live="polite">Checking this browser’s local planning records.</p>'+
 '<div class="nx-ap-actions"><button type="button" id="nxApRefresh">REFRESH SAVED-DATA CHECK</button><button type="button" id="nxApVault">OPEN DATA VAULT</button><a href="https://nexus-azeroth-api.zevromxr.workers.dev/account">OPEN SECURE ACCOUNT & UNLOCKS</a></div>'+
 '<p class="nx-ap-note">A login timeout or a disconnected account does not clear these records. Browser data deletion, private-browsing cleanup, storage eviction, or switching devices can still remove local records. Export a backup from Data & Backup before clearing website storage. The secure account portal can show supported unlock collections after its v7.9.1 Worker upgrade is deployed; it cannot scan every bag, bank slot or currency balance.</p>';
 page.append(block);
 const out=document.getElementById('nxApStats'),status=document.getElementById('nxApStatus');
 function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
 function refresh(){
  const frag=document.createDocumentFragment();let found=0,available=0;
  for(const [label,key,kind]of keys){
   const value=read(key);
   const count=kind==='array'?Array.isArray(value)?value.length:0:kind==='targets'?Array.isArray(value?.targets)?value.targets.length:0:value&&typeof value==='object'?1:0;
   const tile=document.createElement('div');tile.className='nx-ap-stat';
   const num=document.createElement('strong');num.textContent=String(count);
   const text=document.createElement('span');text.textContent=label;
   tile.append(num,text);frag.append(tile);found+=count;if(value!==null)available++;
  }
  out.replaceChildren(frag);
  status.textContent=found+' local planning records / data groups detected. This is a storage check, not a Blizzard account connection or guarantee against browser cleanup.';
 }
 document.getElementById('nxApRefresh').addEventListener('click',refresh);
 document.getElementById('nxApVault').addEventListener('click',()=>{
  document.querySelector('.nav [data-view="vault"]')?.click();
 });
 window.addEventListener('storage',event=>{if(keys.some(([,key])=>key===event.key))refresh()});
 refresh();
})();