/* NEXUS | AZEROTH v4.0 — Sovereign Data Vault
 * User-controlled local data backup only. No Blizzard tokens or HttpOnly cookies.
 * Archive is a JSON file; verify content and show a non-destructive preview before restore.
 */
(()=>{'use strict';
const STORE=[
 ['nexus_azeroth_companion_genesis_v1','Core characters, builds and collections','object'],
 ['nexus_azeroth_overdrive_v1','War Room, routes and weekly planning','object'],
 ['nexus_azeroth_player_utility_v1','Party Architect and Vault plans','object'],
 ['nexus_azeroth_connected_v2','Armory bookmarks and saved items','object'],
 ['nexus_azeroth_armory_bookmarks_v1','Armory character bookmarks','array'],
 ['nexus_azeroth_loot_hunter_v1','Loot Hunter goals','array'],
 ['nexus_azeroth_farm_operations_v1','Character farming operations','object'],
 ['nexus_azeroth_item_atlas_v1','Item Atlas','array'],
 ['nexus_azeroth_character_targets_v1','Character Targets','object'],
 ['nexus_azeroth_talent_forge_v1','Talent Forge drafts','array'],
 ['nexus_azeroth_quick_launch_v36','Launcher favorites and recents','object']
];
const FORMAT='nexus.azeroth.sovereign-vault/1',MAX_FILE=12*1024*1024;
const main=document.querySelector('.main'),foot=main?.querySelector('.footer'),nav=document.querySelector('.sidebar .nav');
if(!main||!nav||!foot)return;
const navItem=document.createElement('button');navItem.type='button';navItem.dataset.view='vault';navItem.textContent='◇ Sovereign Data Vault';nav.append(navItem);
const host=document.createElement('div');host.id='sovereignDataVault';
host.innerHTML='<section class="section" data-section="vault"><div class="wow-kicker">NEXUS / SOVEREIGN CORE · v4.0</div><h2>Sovereign Data Vault</h2><p class="muted">Back up every supported planning module at once. All files are generated and read on your device; no Blizzard cookies, access tokens, or private portal data are included.</p><div class="sv-grid"><div class="panel"><h3>Complete backup</h3><p class="muted">Includes only checked sections. Empty modules are shown, but not included unless they contain saved data.</p><div class="sv-list" id="svSections"></div><div class="sv-actions"><button type="button" class="primary" id="svExport">EXPORT SELECTED DATA</button><button type="button" id="svSelectAll">SELECT ALL</button></div><p class="hint" id="svSummary"></p></div><div class="panel"><h3>Restore on this device</h3><p class="muted">Choose a Sovereign Vault backup to preview its sections. No data changes until you approve restoration.</p><label class="field" for="svFile">Choose JSON backup <input id="svFile" type="file" accept=".json,application/json"></label><div id="svPreview" class="sv-preview" role="status">No backup selected.</div><div class="sv-actions"><button type="button" id="svRestore" class="primary" disabled>RESTORE REVIEWED SECTIONS</button><button type="button" id="svCancel" disabled>CANCEL PREVIEW</button></div><p class="hint">Restore replaces only the selected sections. Other modules are preserved. The page reloads after successful restoration.</p></div></div><p class="notice">This is an offline file backup, not automatic multi-device sync. To move plans from PC to iPhone, export the file on PC, transfer it yourself, then import it on iPhone. Never import a backup you do not trust.</p></section>';
main.insertBefore(host,foot);
const $=id=>document.getElementById(id),section=$('svSections'),preview=$('svPreview'),status=$('svSummary');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let candidate=null;
function read(key){try{return localStorage.getItem(key)}catch(_){return null}}
function shape(v,type){return type==='array'?Array.isArray(v):v!==null&&typeof v==='object'&&!Array.isArray(v)}
function schema(key,x){
 if(key==='nexus_azeroth_companion_genesis_v1')return ['characters','builds','tasks','collections'].every(k=>Array.isArray(x[k]));
 if(key==='nexus_azeroth_overdrive_v1')return ['routes','encounters','recipes','gear','weeklies'].every(k=>Array.isArray(x[k]));
 if(key==='nexus_azeroth_player_utility_v1')return Array.isArray(x.party)&&x.party.length===5;
 if(key==='nexus_azeroth_connected_v2')return Array.isArray(x.wishlist)&&Array.isArray(x.recent);
 if(key==='nexus_azeroth_armory_bookmarks_v1')return x.length<=300&&x.every(p=>p&&typeof p==='object');
 if(key==='nexus_azeroth_loot_hunter_v1')return x.length<=200&&x.every(p=>p&&Number.isSafeInteger(Number(p.id))&&Number(p.id)>0&&typeof p.name==='string');
 if(key==='nexus_azeroth_farm_operations_v1')return Array.isArray(x.characters)&&Array.isArray(x.sessions)&&x.assignments&&typeof x.assignments==='object';
 if(key==='nexus_azeroth_item_atlas_v1')return x.length<=5000&&x.every(p=>p&&Number.isSafeInteger(Number(p.id))&&Number(p.id)>0&&['us','eu','kr','tw'].includes(p.region));
 if(key==='nexus_azeroth_character_targets_v1')return Array.isArray(x.characters)&&Array.isArray(x.targets);
 if(key==='nexus_azeroth_talent_forge_v1')return x.length<=40&&x.every(p=>p&&typeof p.name==='string'&&typeof p.identity==='string'&&p.rankByNode&&typeof p.rankByNode==='object');
 if(key==='nexus_azeroth_quick_launch_v36')return Array.isArray(x.pinned)&&Array.isArray(x.recent);
 return false;
}
function valid(value,type,key){if(typeof value!=='string'||value.length>4*1024*1024)return false;try{const data=JSON.parse(value);return shape(data,type)&&schema(key,data)}catch(_){return false}}
function getSelected(){return [...section.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.dataset.key)}
function render(){
 const count=STORE.filter(([key])=>read(key)!==null).length;
 section.innerHTML=STORE.map(([key,label,type])=>{
  const raw=read(key),exists=raw!==null;
  const stored=exists&&valid(raw,type,key);
  return '<label class="sv-record"><input type="checkbox" data-key="'+esc(key)+'" '+(stored?'checked':'disabled')+'><span><strong>'+esc(label)+'</strong><small>'+(stored?'Saved locally · '+new Blob([raw]).size.toLocaleString()+' bytes':exists?'Unreadable local record (excluded)':'No local record yet')+'</small></span></label>';
 }).join('');
 status.textContent=count+' / '+STORE.length+' supported modules contain records on this device. Missing or unreadable modules are never added to exports.';
}
function download(data){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 if(blob.size>MAX_FILE){status.textContent='Backup exceeds the 12 MB safety limit. Export fewer sections.';return}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NEXUS-AZEROTH-SOVEREIGN-BACKUP-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
 status.textContent='Backup created. Keep this file somewhere safe before clearing browser data.';
}
$('svExport').addEventListener('click',()=>{
 const chosen=getSelected(),items={};
 for(const key of chosen){const type=STORE.find(x=>x[0]===key)?.[2],raw=read(key);if(raw!==null&&valid(raw,type,key))items[key]=JSON.parse(raw)}
 if(!Object.keys(items).length){status.textContent='Select at least one saved module to export.';return}
 download({format:FORMAT,app:'NEXUS | AZEROTH',version:'4.0.0',exportedAt:new Date().toISOString(),items});
});
$('svSelectAll').addEventListener('click',()=>{section.querySelectorAll('input:not(:disabled)').forEach(x=>x.checked=true)});
function clearPreview(){candidate=null;$('svFile').value='';preview.textContent='No backup selected.';$('svRestore').disabled=true;$('svCancel').disabled=true}
$('svCancel').addEventListener('click',clearPreview);
$('svFile').addEventListener('change',async e=>{
 clearCandidate();const file=e.target.files?.[0];if(!file)return;
 if(file.size>MAX_FILE){preview.textContent='File exceeds the 12 MB limit.';return}
 try{
  const data=JSON.parse(await file.text());
  if(!data||data.format!==FORMAT||!data.items||typeof data.items!=='object'||Array.isArray(data.items))throw Error('Not a supported Sovereign Vault backup');
  const keys=Object.keys(data.items);
  if(keys.length<1||keys.length>STORE.length||keys.some(k=>!STORE.some(x=>x[0]===k)))throw Error('Unknown or missing data sections');
  const records=keys.map(key=>{const type=STORE.find(x=>x[0]===key)[2];const value=JSON.stringify(data.items[key]);if(!valid(value,type,key))throw Error('Invalid '+key+' data');return{key,value}});
  candidate=records;
  preview.innerHTML='<strong>Preview — '+records.length+' section(s)</strong><p class="muted">Imported '+esc(data.exportedAt||'unknown date')+'. Existing local data in these sections will be replaced:</p>'+records.map(r=>'<label class="sv-record"><input type="checkbox" data-restore="'+esc(r.key)+'" checked><span>'+esc(STORE.find(x=>x[0]===r.key)[1])+'</span></label>').join('');
  $('svRestore').disabled=false;$('svCancel').disabled=false;
 }catch(err){preview.textContent='Backup rejected: '+err.message}
});
function clearCandidate(){candidate=null;$('svRestore').disabled=true;$('svCancel').disabled=true;preview.textContent='Validating backup…'}
$('svRestore').addEventListener('click',()=>{
 if(!candidate)return;
 const selection=new Set([...preview.querySelectorAll('[data-restore]:checked')].map(x=>x.dataset.restore));
 const changed=candidate.filter(x=>selection.has(x.key));if(!changed.length){preview.textContent='Choose at least one section to restore.';return}
 if(!confirm('Replace '+changed.length+' selected planning section(s) on this device? This cannot be undone without an earlier backup.'))return;
 const before=changed.map(({key})=>({key,value:read(key)}));let done=0;
 try{
  for(const {key,value} of changed){localStorage.setItem(key,value);done++}
  preview.textContent='Restore completed. Reloading the companion…';
  location.reload();
 }catch(err){
  let rollbackFailed=false;
  for(let i=done-1;i>=0;i--){try{const p=before[i];if(p.value===null)localStorage.removeItem(p.key);else localStorage.setItem(p.key,p.value)}catch(_){rollbackFailed=true}}
  preview.textContent=rollbackFailed?'Restore interrupted and rollback could not complete. Do not clear browser data; inspect saved records.':'Storage failed; earlier data has been restored. No completed import was retained.';
 }
});
window.addEventListener('pageshow',render);render();
})();
