/* NEXUS | AZEROTH COMPANION v2.9 - Character Farming Operations.
 * Local-only assignments and session history; no changes to Loot Hunter's legacy format.
 */
(()=>{'use strict';
const CORE=window.NexusArmoryBridgeCore;if(!CORE)return;
const KEY='nexus_azeroth_farm_operations_v1',GOALS='nexus_azeroth_loot_hunter_v1',PROFILES='nexus_azeroth_armory_bookmarks_v1';
const $=id=>document.getElementById(id);
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const idOf=x=>{const v=Number(x);return Number.isSafeInteger(v)&&v>0&&v<=9999999999?v:null};
const slug=p=>p.region+'/'+p.realm+'/'+p.name;
const safeText=(v,max=100)=>String(v??'').slice(0,max);
let state={characters:[],assignments:{},sessions:[]},currentKey='all',filters='all';
function validProfile(p){return CORE.profile(p)}
function clean(value){
 const next={characters:[],assignments:{},sessions:[]};
 if(!value||typeof value!=='object')return next;
 if(Array.isArray(value.characters))next.characters=value.characters.map(validProfile).filter(Boolean).filter((p,i,a)=>a.findIndex(x=>slug(x)===slug(p))===i).slice(0,30);
 const keys=new Set(next.characters.map(slug));
 if(value.assignments&&typeof value.assignments==='object'&&!Array.isArray(value.assignments)){
  for(const [item,who] of Object.entries(value.assignments)){
   if(idOf(item)&&Array.isArray(who))next.assignments[String(idOf(item))]=[...new Set(who.filter(x=>typeof x==='string'&&keys.has(x)))].slice(0,30);
  }
 }
 if(Array.isArray(value.sessions))next.sessions=value.sessions.filter(x=>x&&idOf(x.itemId)&&keys.has(x.character)&&Number.isSafeInteger(x.attempts)&&x.attempts>=1&&x.attempts<=100&&typeof x.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)).slice(-500).map(x=>({itemId:idOf(x.itemId),character:x.character,attempts:x.attempts,date:x.date,note:safeText(x.note,180)}));
 return next;
}
try{state=clean(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(_){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new Event('nexus:farm-operations-changed'));message('Farming operations saved on this device.');return true}catch(_){message('Storage unavailable. Export a backup before leaving.');return false}}
function readGoals(){try{const x=JSON.parse(localStorage.getItem(GOALS)||'null');return Array.isArray(x)?x.filter(g=>g&&idOf(g.id)&&typeof g.name==='string').slice(0,200):[]}catch(_){return []}}
function syncedProfiles(){try{const x=JSON.parse(localStorage.getItem(PROFILES)||'null');return Array.isArray(x)?x.map(validProfile).filter(Boolean):[]}catch(_){return []}}
function message(t){$('foStatus').textContent=t}
const root=document.querySelector('[data-section="loot"]');if(!root)return;
const panel=document.createElement('div');panel.id='farmOperations';panel.className='panel fo-panel';
panel.innerHTML='<div class="fo-title"><div><div class="wow-kicker">CHARACTER-SPECIFIC PROGRESSION · LOCAL PLANNING</div><h3>Farming Operations</h3><p class="muted">Assign existing Loot Hunter goals to your characters and record manual farm sessions. The original loot board and its attempts stay untouched.</p></div><span class="fo-version">v2.9</span></div>'+
'<div class="fo-controls"><button id="foImportProfiles" type="button">IMPORT ARMORY SHORTCUTS</button><label for="foRegion">Region</label><select id="foRegion"><option value="us">Americas</option><option value="eu">Europe</option><option value="kr">Korea</option><option value="tw">Taiwan</option></select><input id="foRealm" placeholder="Realm slug" maxlength="80" aria-label="Realm slug"><input id="foName" placeholder="Character name" maxlength="50" aria-label="Character name"><button id="foAdd" type="button">ADD CHARACTER</button></div>'+
'<div class="fo-controls"><label for="foCharacter">View character</label><select id="foCharacter"><option value="all">All characters</option></select><label for="foFilter">Goals</label><select id="foFilter"><option value="all">All goals</option><option value="open">Still farming</option><option value="done">Obtained</option></select><button id="foExport" type="button">EXPORT OPERATIONS</button><label class="wow-file">IMPORT OPERATIONS<input id="foImport" type="file" accept=".json,application/json"></label></div>'+
'<div class="fo-stats" id="foStats" aria-live="polite"></div><div class="fo-columns"><div><h4>Character Farm Assignments</h4><div id="foAssignments"></div></div><div><h4>Manual Session Log</h4><div class="fo-controls"><label for="foSessionItem">Goal</label><select id="foSessionItem"></select><label for="foSessionCharacter">Character</label><select id="foSessionCharacter"></select><label for="foSessionDate">Date</label><input type="date" id="foSessionDate"><label for="foAttempts">Attempts</label><input type="number" id="foAttempts" min="1" max="100" value="1"><input type="text" id="foSessionNote" maxlength="180" placeholder="Optional session note" aria-label="Session note"><button type="button" id="foLog">LOG SESSION</button></div><div id="foSessions"></div></div></div>'+
'<p id="foStatus" class="fo-status" role="status" aria-live="polite">No automatic World of Warcraft progress is claimed. Operations are browser-local and separate from Loot Hunter attempts.</p>';
const board=root.querySelector('.loot-panel');if(board)board.before(panel);else root.append(panel);
$('foSessionDate').value=new Date().toLocaleDateString('en-CA');
const selectOptions=(items,selected)=>items.map(([val,text])=>'<option value="'+h(val)+'" '+(val===selected?'selected':'')+'>'+h(text)+'</option>').join('');
function render(){
 const goals=readGoals(),profiles=state.characters,keys=new Set(profiles.map(slug));
 if(currentKey!=='all'&&!keys.has(currentKey))currentKey='all';
 $('foCharacter').innerHTML=selectOptions([['all','All characters'],...profiles.map(p=>[slug(p),p.name+' · '+p.realm+' ('+p.region.toUpperCase()+')'])],currentKey);
 $('foSessionCharacter').innerHTML=selectOptions(profiles.map(p=>[slug(p),p.name+' · '+p.realm]),currentKey==='all'?'':currentKey);
 $('foSessionItem').innerHTML=selectOptions(goals.map(g=>[String(g.id),g.name+' (#'+g.id+')']),String($('foSessionItem').value||''));
 $('foSessionCharacter').disabled=!profiles.length;$('foLog').disabled=!profiles.length||!goals.length;
 const shown=goals.filter(g=>(filters==='all'||(filters==='done'?g.done:!g.done))&&(currentKey==='all'||(state.assignments[g.id]||[]).includes(currentKey)));
 const history=state.sessions.filter(x=>currentKey==='all'||x.character===currentKey);
 const assigned=shown.filter(g=>Array.isArray(state.assignments[g.id])&&state.assignments[g.id].length).length;
 const attempts=history.reduce((sum,x)=>sum+x.attempts,0);
 const stats=[['Visible goals',shown.length],['Assigned goals',assigned],['Logged sessions',history.length],['Session attempts',attempts]];
 $('foStats').innerHTML=stats.map(([t,v])=>'<div><strong>'+v+'</strong><span>'+h(t)+'</span></div>').join('');
 $('foAssignments').innerHTML=goals.length?shown.map(g=>{
  const assignedSet=new Set(state.assignments[g.id]||[]);
  const label=profiles.map(p=>'<label><input data-fo-assign="'+g.id+'" data-fo-person="'+h(slug(p))+'" type="checkbox" '+(assignedSet.has(slug(p))?'checked':'')+'> '+h(p.name)+' · '+h(p.realm)+'</label>').join('');
  return '<div class="fo-goal"><div><strong>'+h(g.name)+'</strong><small>#'+g.id+' · '+(g.done?'Obtained':'Still farming')+' · '+Math.max(0,Number(g.attempts)||0)+' Loot Hunter attempts</small></div><div class="fo-picks">'+(label||'<span>Add a character above to assign this goal.</span>')+'</div></div>';
 }).join('')||'<div class="empty">No goals match the current character or filter.</div>':'<div class="empty">Add goals in Loot Hunter first; existing goals will appear here automatically.</div>';
 $('foSessions').innerHTML=history.length?history.slice(-35).reverse().map(x=>{
  const p=profiles.find(p=>slug(p)===x.character),g=goals.find(g=>Number(g.id)===x.itemId);
  const i=state.sessions.indexOf(x);
  return '<div class="fo-session"><div><strong>'+h(g?.name||'Item #'+x.itemId)+'</strong><small>'+h(p?.name||x.character)+' · '+h(x.date)+' · '+x.attempts+' attempt(s)</small>'+(x.note?'<p>'+h(x.note)+'</p>':'')+'</div><button data-fo-del="'+i+'" type="button">REMOVE</button></div>';
 }).join(''):'<div class="empty">No sessions recorded for this view.</div>';
}
function add(p){const person=validProfile(p);if(!person)return message('Use a valid ASCII character name and realm slug.');if(state.characters.some(x=>slug(x)===slug(person)))return message('This character is already in Farming Operations.');if(state.characters.length>=30)return message('The 30-character limit has been reached.');state.characters.push(person);persist();render()}
$('foAdd').addEventListener('click',()=>add({region:$('foRegion').value,realm:$('foRealm').value,name:$('foName').value}));
$('foImportProfiles').addEventListener('click',()=>{let n=0;for(const p of syncedProfiles()){if(state.characters.length>=30)break;if(!state.characters.some(x=>slug(x)===slug(p))){state.characters.push(p);n++}}persist();render();message(n+' saved Armory character shortcut(s) imported.')});
$('foCharacter').addEventListener('change',e=>{currentKey=e.target.value;render()});
$('foFilter').addEventListener('change',e=>{filters=e.target.value;render()});
panel.addEventListener('change',e=>{const el=e.target;if(!el.dataset.foAssign)return;const id=idOf(el.dataset.foAssign),person=el.dataset.foPerson;if(!id||!state.characters.some(p=>slug(p)===person))return;const members=new Set(state.assignments[id]||[]);if(el.checked)members.add(person);else members.delete(person);state.assignments[id]=[...members];persist();render()});
$('foLog').addEventListener('click',()=>{
 const itemId=idOf($('foSessionItem').value),character=$('foSessionCharacter').value,date=$('foSessionDate').value,attempts=Number($('foAttempts').value);
 if(!itemId||!readGoals().some(g=>Number(g.id)===itemId))return message('Select an existing Loot Hunter goal.');
 if(!state.characters.some(p=>slug(p)===character))return message('Select a character.');
 if(!Number.isInteger(attempts)||attempts<1||attempts>100)return message('Enter between 1 and 100 attempts.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(new Date(date+'T12:00:00').getTime()))return message('Choose a valid session date.');
 state.sessions.push({itemId,character,date,attempts,note:$('foSessionNote').value.slice(0,180)});
 state.sessions=state.sessions.slice(-500);
 persist();render();message('Session recorded. Loot Hunter global attempt counts were not modified.');
});
panel.addEventListener('click',e=>{const el=e.target.closest('[data-fo-del]');if(!el)return;const i=Number(el.dataset.foDel);if(!Number.isInteger(i)||i<0||i>=state.sessions.length)return;if(confirm('Remove this session record?')){state.sessions.splice(i,1);persist();render()}});
$('foExport').addEventListener('click',()=>{const b=new Blob([JSON.stringify({format:'nexus-farming-operations-v1',exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='nexus-farming-operations.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)});
$('foImport').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>500000)throw Error('Backup exceeds 500 KB');const data=JSON.parse(await file.text());if(data.format!=='nexus-farming-operations-v1'||!data.data||!Array.isArray(data.data.characters)||data.data.characters.length>30||!Array.isArray(data.data.sessions)||data.data.sessions.length>500)throw Error('Invalid operations backup');if(confirm('Replace character assignments and session history? Existing Loot Hunter goals will not be altered.')){state=clean(data.data);persist();render();message('Farming Operations backup imported.')}}catch(err){message('Import failed: '+err.message)}e.target.value=''});
window.addEventListener('nexus:loot-updated',render);
window.addEventListener('storage',e=>{if(e.key===GOALS||e.key===PROFILES)render();if(e.key===KEY){try{state=clean(JSON.parse(e.newValue||'null'));render()}catch(_){message('Another tab supplied an unreadable update; current farming records remain intact.')}}});
window.addEventListener('nexus:farm-operations-updated',()=>{try{state=clean(JSON.parse(localStorage.getItem(KEY)||'null'));render()}catch(_){message('Could not reload the updated character profile; existing farm records are unchanged.')}});
render();
})();