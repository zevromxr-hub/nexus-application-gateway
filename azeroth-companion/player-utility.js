/* NEXUS Azeroth Companion v1.2 — Party Architect & Weekly Vault.
   Offline planning only. Does not inspect combat, read WoW client state or automate gameplay. */
(()=>{'use strict';
const CLASS_SPECS={
 'Death Knight':[['Blood','Tank'],['Frost','Damage'],['Unholy','Damage']],
 'Demon Hunter':[['Vengeance','Tank'],['Havoc','Damage'],['Devourer','Damage']],
 'Druid':[['Guardian','Tank'],['Restoration','Healer'],['Balance','Damage'],['Feral','Damage']],
 'Evoker':[['Preservation','Healer'],['Devastation','Damage'],['Augmentation','Damage']],
 'Hunter':[['Beast Mastery','Damage'],['Marksmanship','Damage'],['Survival','Damage']],
 'Mage':[['Arcane','Damage'],['Fire','Damage'],['Frost','Damage']],
 'Monk':[['Brewmaster','Tank'],['Mistweaver','Healer'],['Windwalker','Damage']],
 'Paladin':[['Protection','Tank'],['Holy','Healer'],['Retribution','Damage']],
 'Priest':[['Discipline','Healer'],['Holy','Healer'],['Shadow','Damage']],
 'Rogue':[['Assassination','Damage'],['Outlaw','Damage'],['Subtlety','Damage']],
 'Shaman':[['Restoration','Healer'],['Elemental','Damage'],['Enhancement','Damage']],
 'Warlock':[['Affliction','Damage'],['Demonology','Damage'],['Destruction','Damage']],
 'Warrior':[['Protection','Tank'],['Arms','Damage'],['Fury','Damage']]
};
const BUFFS={'Druid':['Mark of the Wild'],'Mage':['Arcane Intellect'],'Priest':['Power Word: Fortitude'],'Warrior':['Battle Shout'],'Monk':['Mystic Touch'],'Demon Hunter':['Chaos Brand'],'Paladin':['Devotion Aura']};
const SECTIONS=[['party','⚔ Party Architect'],['vault','✦ Weekly Vault'],['quick','◈ Quick Reference']];
const STORAGE='nexus_azeroth_player_utility_v1',GENESIS='nexus_azeroth_companion_genesis_v1';
const defaultParty=()=>[['Paladin','Protection'],['Priest','Holy'],['Mage','Frost'],['Hunter','Beast Mastery'],['Warrior','Fury']].map(([className,spec])=>({className,spec,name:''}));
const blank=()=>({partyName:'Dungeon Team',party:defaultParty(),vaults:{},activeCharacter:'',lastUpdated:''});
let state=blank();
try{const prior=JSON.parse(localStorage.getItem(STORAGE)||'null');if(prior&&typeof prior==='object'&&Array.isArray(prior.party)&&prior.party.length===5)state={...blank(),...prior}}catch(_){}
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;':'&quot;',"'":'&#39;'}[c]));
const save=()=>{try{state.lastUpdated=new Date().toISOString();localStorage.setItem(STORAGE,JSON.stringify(state))}catch(_){alert('Storage is unavailable. Check your Safari or browser storage settings.')}};
const specs=className=>CLASS_SPECS[className]||[];
const roleOf=p=>specs(p.className).find(s=>s[0]===p.spec)?.[1]||'Damage';
const classOptions=selected=>Object.keys(CLASS_SPECS).map(c=>'<option '+(selected===c?'selected':'')+'>'+esc(c)+'</option>').join('');
const specOptions=(c,selected)=>specs(c).map(([s])=>'<option '+(s===selected?'selected':'')+'>'+esc(s)+'</option>').join('');
function addPanels(){
 const nav=document.querySelector('.nav'),main=document.querySelector('.main'),footer=main?.querySelector('.footer');if(!nav||!main||!footer)return false;
 for(const [id,label] of SECTIONS){const b=document.createElement('button');b.type='button';b.dataset.view=id;b.textContent=label;nav.appendChild(b)}
 const wrap=document.createElement('div');wrap.id='wowPlayerUtility';
 wrap.innerHTML=`
<section class="section" data-section="party">
 <div class="wow-kicker">WORLD OF WARCRAFT · GROUP PLANNING</div><h2>Party Architect</h2>
 <p class="muted">Build and save a five-player dungeon party with real class/specialization choices. Review role distribution and selected class utility before inviting teammates.</p>
 <div class="panel"><div class="field"><label for="puPartyName">Party name</label><input id="puPartyName" maxlength="80" placeholder="My key group"></div>
 <div id="puPartySlots" class="pu-slots"></div>
 <div id="puPartyFeedback" class="pu-feedback" role="status"></div>
 <div class="actions"><button class="primary" id="puSaveParty" type="button">SAVE PARTY</button><button id="puCopyParty" type="button">COPY TEAM SUMMARY</button><button id="puExportParty" type="button">DOWNLOAD PARTY JSON</button><label class="wow-file">IMPORT TEAM JSON<input id="puImportParty" type="file" accept=".json,application/json"></label></div>
 <p class="hint">Class utility is a planning reminder, not a guarantee of every talent, ability, buff, encounter need, or patch-specific tuning. This does not evaluate DPS rankings or read live game state.</p></div>
</section>
<section class="section" data-section="vault">
 <div class="wow-kicker">CHARACTER PROGRESSION · REPEATABLE TRACKING</div><h2>Weekly Vault & Activity Tracker</h2>
 <p class="muted">Use this player-controlled weekly tracker for dungeon, raid, and world activity counts. Goal thresholds are fully editable and are not presented as official reward unlock requirements.</p>
 <div class="panel"><div class="field"><label for="puCharacter">Character profile</label><select id="puCharacter"></select></div><div id="puVaultCards" class="pu-vault-grid"></div><div class="actions"><button type="button" class="primary" id="puSaveVault">SAVE PROGRESS</button><button type="button" id="puResetVault" class="danger">START NEW WEEK FOR THIS CHARACTER</button><button type="button" id="puExportVault">EXPORT ALL WEEKLY RECORDS</button></div>
 <p class="hint">Your counts are updated manually. No Blizzard login, character scraping, automatic weekly reset, or live Great Vault rewards are claimed.</p></div>
</section>
<section class="section" data-section="quick">
 <div class="wow-kicker">PLAYER RESOURCES · VERIFIED LINKS</div><h2>Quick Reference</h2><p class="muted">Access trusted World of Warcraft resources without copying outdated patch recommendations into the companion.</p>
 <div class="pu-reference">
  <a href="https://worldofwarcraft.blizzard.com/" target="_blank" rel="noopener noreferrer"><strong>Official World of Warcraft</strong><small>Game news, announcements and profiles</small></a>
  <a href="https://www.wowhead.com/" target="_blank" rel="noopener noreferrer"><strong>Wowhead</strong><small>Item, encounter and quest guides (third-party)</small></a>
  <a href="https://www.raidbots.com/" target="_blank" rel="noopener noreferrer"><strong>Raidbots</strong><small>Simulation tools for supported Retail builds (third-party)</small></a>
  <a href="https://www.warcraftlogs.com/" target="_blank" rel="noopener noreferrer"><strong>Warcraft Logs</strong><small>Performance and encounter reports (third-party)</small></a>
  <a href="https://raider.io/" target="_blank" rel="noopener noreferrer"><strong>Raider.IO</strong><small>Dungeon and character progression resources (third-party)</small></a>
 </div><div class="notice">External links open their respective websites. NEXUS is an independent fan-made companion and is not affiliated with Blizzard or these services.</div>
</section>`;
 main.insertBefore(wrap,footer);return true
}
if(!addPanels())return;
const slots=$('puPartySlots');
function renderSlots(){slots.innerHTML=state.party.map((p,i)=>`<div class="pu-slot"><span class="pu-slotnum">${i+1}</span><div class="field"><label for="puClass${i}">Class</label><select data-class="${i}" id="puClass${i}">${classOptions(p.className)}</select></div><div class="field"><label for="puSpec${i}">Specialization</label><select data-spec="${i}" id="puSpec${i}">${specOptions(p.className,p.spec)}</select></div><div class="field"><label for="puName${i}">Player (optional)</label><input id="puName${i}" data-name="${i}" maxlength="45" value="${esc(p.name)}" placeholder="Player name"></div><span class="pu-role pu-${roleOf(p).toLowerCase()}">${roleOf(p)}</span></div>`).join('');renderFeedback()}
function renderFeedback(){const roles=state.party.map(roleOf),tanks=roles.filter(r=>r==='Tank').length,healers=roles.filter(r=>r==='Healer').length,dps=roles.filter(r=>r==='Damage').length,covered=[...new Set(state.party.flatMap(p=>BUFFS[p.className]||[]))];const balanced=tanks===1&&healers===1&&dps===3;
 $('puPartyFeedback').innerHTML='<strong>'+(balanced?'✓ Standard 1 / 1 / 3 role distribution':'⚠ Check your role distribution')+'</strong><p>Tank: '+tanks+' · Healer: '+healers+' · Damage: '+dps+'</p><p><b>Selected class utility:</b> '+(covered.map(esc).join(' · ')||'No tracked examples')+'</p>'}
slots.addEventListener('change',e=>{const c=e.target.dataset.class,s=e.target.dataset.spec;if(c!==undefined){const i=+c;state.party[i].className=e.target.value;state.party[i].spec=specs(e.target.value)[0][0];renderSlots()}else if(s!==undefined){state.party[+s].spec=e.target.value;renderSlots()}});
slots.addEventListener('input',e=>{if(e.target.dataset.name!==undefined)state.party[+e.target.dataset.name].name=e.target.value});
$('puPartyName').value=state.partyName;
$('puSaveParty').addEventListener('click',()=>{state.partyName=$('puPartyName').value.trim()||'Dungeon Team';save();notice('Party saved locally')});
function summary(){const name=$('puPartyName').value.trim()||'Dungeon Team';return name+'\n'+state.party.map((p,i)=>(i+1)+'. '+(p.name||'Open slot')+' — '+p.spec+' '+p.className+' ('+roleOf(p)+')').join('\n')+'\nPlanned with NEXUS | Azeroth Companion'}
$('puCopyParty').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summary());notice('Party summary copied')}catch(_){window.prompt('Copy your party summary:',summary())}});
function download(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
$('puExportParty').addEventListener('click',()=>download('nexus-warcraft-party.json',{format:'nexus-wow-party-v1',name:$('puPartyName').value.trim(),party:state.party}));
$('puImportParty').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>50000)throw Error('Team file too large');const x=JSON.parse(await f.text());if(x.format!=='nexus-wow-party-v1'||!Array.isArray(x.party)||x.party.length!==5)throw Error('Not a compatible party');for(const p of x.party){if(!CLASS_SPECS[p.className]||!specs(p.className).some(s=>s[0]===p.spec)||typeof p.name!=='string'||p.name.length>45)throw Error('Invalid team member')}if(!confirm('Replace your current five-player party?'))return;state.party=x.party.map(p=>({className:p.className,spec:p.spec,name:p.name}));state.partyName=String(x.name||'Dungeon Team').slice(0,80);$('puPartyName').value=state.partyName;renderSlots();save();notice('Party imported')}catch(err){notice('Import failed: '+err.message)}finally{e.target.value=''}});
const CATEGORIES=[['dungeons','Dungeon activities'],['raids','Raid encounters'],['world','World activities']];
function profiles(){try{const x=JSON.parse(localStorage.getItem(GENESIS)||'null');return Array.isArray(x?.characters)?x.characters.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string').slice(0,200):[]}catch(_){return []}}
function vaultDefault(){return{week:'',dungeons:{count:0,goal:4},raids:{count:0,goal:6},world:{count:0,goal:3}}}
let currentKey='account';
function vaultKey(){return $('puCharacter').value||'account'}
function vault(){return state.vaults[currentKey]||vaultDefault()}
function renderProfiles(){const profilesNow=profiles(),desired=state.activeCharacter;const list=['<option value="account">Account-wide (manual)</option>',...profilesNow.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' · '+esc(p.className||'Hero')+'</option>')];$('puCharacter').innerHTML=list.join('');$('puCharacter').value=profilesNow.some(p=>p.id===desired)?desired:'account';currentKey=vaultKey();renderVault()}
function renderVault(){const v=vault();$('puVaultCards').innerHTML=CATEGORIES.map(([key,label])=>{const x=v[key]||{count:0,goal:1};const count=Number(x.count)||0,goal=Math.max(1,Number(x.goal)||1);const percent=Math.min(100,Math.round(count/goal*100));return `<div class="pu-vault-card"><div class="pu-vault-label">${label}</div><div class="pu-progress"><span style="width:${percent}%"></span></div><div class="pu-vault-count">${count} / ${goal} <small>self-set target</small></div><div class="pu-vault-controls"><label>Completed <input type="number" id="puCount-${key}" min="0" max="9999" step="1" value="${count}"></label><label>Target <input type="number" id="puGoal-${key}" min="1" max="9999" step="1" value="${goal}"></label></div></div>`}).join('')}
$('puCharacter').addEventListener('change',()=>{currentKey=vaultKey();state.activeCharacter=currentKey;save();renderVault()});
function getVaultInputs(){const record={week:new Date().toISOString().slice(0,10)};for(const [key] of CATEGORIES){const count=Number($('puCount-'+key).value),goal=Number($('puGoal-'+key).value);if(!Number.isSafeInteger(count)||!Number.isSafeInteger(goal)||count<0||count>9999||goal<1||goal>9999)return null;record[key]={count,goal}}return record}
$('puVaultCards').addEventListener('change',()=>{const v=getVaultInputs();if(v){state.vaults[currentKey]=v;save();renderVault()}else notice('Enter valid nonnegative counts and targets of at least 1')});
$('puSaveVault').addEventListener('click',()=>{const v=getVaultInputs();if(!v)return notice('Check your activity counts and targets');state.vaults[currentKey]=v;save();renderVault();notice('Weekly progress saved')});
$('puResetVault').addEventListener('click',()=>{if(!confirm('Start a fresh week for this character? Current manual counts will be reset to zero.'))return;const prev=vault();state.vaults[currentKey]={week:new Date().toISOString().slice(0,10),...Object.fromEntries(CATEGORIES.map(([k])=>[k,{count:0,goal:prev[k]?.goal||1}]))};save();renderVault();notice('Weekly counts reset')});
$('puExportVault').addEventListener('click',()=>download('nexus-weekly-vault.json',{format:'nexus-wow-vault-v1',vaults:state.vaults,exportedAt:new Date().toISOString()}));
function notice(t){const n=$('puNotice');if(n){n.textContent=t;n.hidden=false;clearTimeout(notice.t);notice.t=setTimeout(()=>n.hidden=true,3200)}}
const note=document.createElement('div');note.id='puNotice';note.className='pu-notice';note.hidden=true;document.body.appendChild(note);
renderSlots();renderProfiles();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderProfiles()});
window.addEventListener('storage',e=>{if(e.key===GENESIS)renderProfiles()});
})();
