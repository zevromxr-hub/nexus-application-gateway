/* NEXUS | AZEROTH v4.7 — compiled core script. DO NOT EDIT: generated from original studio scripts in order. */

;/* BUNDLE SOURCE: warcraft-overdrive.js */
/* NEXUS | Azeroth Companion — Warcraft Overdrive v1.1.0
   Static/offline-first planning utilities. No protected combat reads, client hooks or automation. */
(()=>{'use strict';
const KEY='nexus_azeroth_overdrive_v1';
const fresh=()=>({routes:[],encounters:[],recipes:[],gear:[],weeklies:[]});
let db=fresh();try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object'&&Object.keys(db).every(k=>Array.isArray(v[k])))db=v;}catch(_){}
const $=id=>document.getElementById(id),h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),id=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db));render()}catch(e){alert('Storage could not be saved. Export a backup from Data & Backup.')}};
const block=(title,content)=>'<div class="wow-entry"><div class="wow-entry-head">'+title+'</div>'+content+'</div>';
const empty='<p class="muted">No entries saved yet.</p>';
function insert(){const nav=document.querySelector('.nav'),main=document.querySelector('.main');if(!nav||!main)return;
const links=[['warcraft','⚜ War Room'],['dungeons','🗺 Dungeon Routes'],['professions','⚒ Crafting Lab'],['equipment','🛡 Gear Analyzer'],['releases','✦ Release Center']];
links.forEach(([key,label])=>{const b=document.createElement('button');b.textContent=label;b.dataset.view=key;nav.appendChild(b)});
const wrap=document.createElement('div');wrap.id='wowOverdrive';
wrap.innerHTML=`
<section class="section wow-section" data-section="warcraft">
  <div class="wow-kicker">WORLD OF WARCRAFT · COMMAND DIVISION</div><h2>War Room</h2><p class="muted">Coordinate weekly objectives, raid preparation and meaningful character progression from one place.</p>
  <div class="wow-metrics"><div><strong id="wowRoutes">0</strong><span>Dungeon Routes</span></div><div><strong id="wowEncounters">0</strong><span>Encounter Notes</span></div><div><strong id="wowWeeklies">0</strong><span>Open Weekly Goals</span></div></div>
  <div class="grid">
   <form class="panel" id="wowWeeklyForm"><h3>Weekly Warboard</h3><div class="field"><label for="wowWeekly">Weekly objective</label><input id="wowWeekly" required maxlength="140" placeholder="Complete 4 dungeon runs"></div><div class="field"><label for="wowWeeklyGroup">Category</label><select id="wowWeeklyGroup"><option>Dungeons</option><option>Raiding</option><option>Delves</option><option>World Content</option><option>Professions</option><option>PvP</option><option>Collections</option></select></div><button class="primary">ADD WEEKLY GOAL</button><p class="hint">Use Reset Week when your region's actual weekly reset occurs. No automatic reset or game progress is implied.</p></form>
   <div class="panel"><div class="top"><h3>Weekly checklist</h3><button type="button" id="wowWeekReset">RESET WEEK</button></div><div id="wowWeeklyList" class="wow-list"></div></div>
  </div>
  <div class="grid wow-gap">
   <form class="panel" id="wowEncounterForm"><h3>Raid Encounter Architect</h3><div class="field"><label for="wowBoss">Encounter / boss</label><input id="wowBoss" required maxlength="90" placeholder="Boss or encounter name"></div><div class="field"><label for="wowDifficulty">Difficulty</label><select id="wowDifficulty"><option>Normal</option><option>Heroic</option><option>Mythic</option><option>Raid Finder</option><option>Other</option></select></div><div class="field"><label for="wowMechanics">Mechanics and preparation notes</label><textarea id="wowMechanics" maxlength="3000" placeholder="Movement, positioning, interrupts, assigned roles..."></textarea></div><button class="primary">SAVE ENCOUNTER PLAN</button></form>
   <div class="panel"><h3>Encounter Library</h3><div id="wowEncounterList" class="wow-list"></div></div>
  </div>
</section>
<section class="section wow-section" data-section="dungeons"><div class="wow-kicker">MYTHIC+ · RAID · TRAVEL PREPARATION</div><h2>Dungeon Route Architect</h2><p class="muted">Make ordered route notes for any dungeon. Plan pull sequences and mechanics before entering; no live enemy-force calculations or automated pathing.</p>
<div class="grid"><form class="panel" id="wowRouteForm"><div class="field"><label for="wowDungeon">Dungeon name</label><input id="wowDungeon" required maxlength="90" placeholder="Enter dungeon"></div><div class="field"><label for="wowRouteName">Route title</label><input id="wowRouteName" required maxlength="90" placeholder="Safe route / fast route"></div><div class="field"><label for="wowStops">Ordered stops — one per line</label><textarea id="wowStops" required maxlength="3500" rows="7" placeholder="Entrance & first pull&#10;Boss 1 preparation&#10;Shortcut and patrol notes&#10;Final encounter"></textarea></div><button class="primary">SAVE ROUTE</button></form><div class="panel"><h3>Saved Routes</h3><div id="wowRouteList" class="wow-list"></div></div></div></section>
<section class="section wow-section" data-section="professions"><div class="wow-kicker">CRAFTING · AUCTION PREPARATION</div><h2>Profession Profit Lab</h2><p class="muted">Manually model a recipe and potential profit using your own realm prices. This is an estimate, not a live auction-house quote.</p><div class="grid"><form class="panel" id="wowCraftForm">
<div class="field"><label for="wowRecipe">Recipe name</label><input id="wowRecipe" maxlength="90" required placeholder="Crafted item"></div>
<div class="field"><label for="wowMaterials">Materials (name, quantity, unit price in gold) — one per line</label><textarea id="wowMaterials" required rows="6" maxlength="4000" placeholder="Ore, 8, 20&#10;Essence, 2, 75"></textarea></div>
<div class="field"><label for="wowSalePrice">Estimated sale price (gold)</label><input id="wowSalePrice" type="number" min="0" step=".01" max="1000000000" value="500"></div>
<div class="field"><label for="wowFee">Selling fee % (editable)</label><input id="wowFee" type="number" min="0" max="100" step=".1" value="5"></div>
<div class="wow-result" id="wowCraftPreview">Enter materials to calculate the estimate.</div><button class="primary">SAVE RECIPE ESTIMATE</button></form><div class="panel"><h3>Crafting Estimates</h3><div id="wowRecipeList" class="wow-list"></div></div></div></section>
<section class="section wow-section" data-section="equipment"><div class="wow-kicker">GEAR PLANNING · CUSTOM WEIGHTS</div><h2>Gear Comparison Laboratory</h2><p class="muted">Compare two items using weights you define. These are player estimates, not accurate DPS simulations or current best-in-slot rankings.</p><div class="panel"><div class="wow-gear-head"><div></div><b>Current item</b><b>Candidate item</b><b>Weight</b></div><div id="wowGearFields"></div><div class="field"><label for="wowGearLabel">Comparison label</label><input id="wowGearLabel" maxlength="90" placeholder="My ring replacement"></div><div class="wow-result" id="wowGearResult">Enter stats and weights to compare.</div><div class="actions"><button id="wowGearSave" class="primary" type="button">SAVE COMPARISON</button><button id="wowGearReset" type="button">RESET VALUES</button></div></div><div class="panel wow-gap"><h3>Saved Comparisons</h3><div id="wowGearList" class="wow-list"></div></div></section>
<section class="section wow-section" data-section="releases"><div class="wow-kicker">AZEROTH COMPANION · VERSION CONTROL</div><h2>Release Center</h2><div class="grid"><div class="panel"><span class="chip">STABLE CHANNEL</span><h3 id="wowVersion">v1.1.0</h3><p id="wowReleaseSubtitle" class="muted">Warcraft Overdrive</p><div id="wowReleaseFeatures"></div><div class="actions"><button id="wowCheckUpdates" type="button" class="primary">CHECK FOR UPDATES</button><a href="./CHANGELOG.md" target="_blank" rel="noopener" class="wow-link">FULL CHANGELOG ↗</a></div><p id="wowUpdateStatus" class="hint" role="status">Release information loaded from this website.</p></div><div class="panel"><h3>Release History</h3><div id="wowReleaseHistory" class="wow-list"></div><div class="notice">Versioned Azeroth releases are independent from PROXIMUS Asset Alchemist. Discord announcements require a correctly configured GitHub Actions webhook secret.</div></div></div></section>`;
main.insertBefore(wrap,main.querySelector('.footer'));
const dataTab=document.querySelector('[data-section="data"]');if(dataTab){const panel=document.createElement('div');panel.className='panel wow-gap';panel.innerHTML='<h3>Warcraft Overdrive Data</h3><p class="muted">Export or import advanced dungeon, raid, crafting, gear and weekly notes independently. The existing Genesis backup still covers characters, builds, basic progression and collections.</p><div class="actions"><button id="wowExport" type="button">EXPORT ADVANCED BACKUP</button><label class="wow-file">IMPORT ADVANCED BACKUP <input type="file" id="wowImport" accept=".json,application/json"></label></div>';dataTab.appendChild(panel)}
}
function listItem(label,detail,group,item,more=''){return '<div class="wow-item"><div><strong>'+h(label)+'</strong><small>'+h(detail)+'</small>'+more+'</div><button type="button" class="wow-remove" data-group="'+group+'" data-id="'+h(item.id)+'" aria-label="Delete '+h(label)+'">×</button></div>'}
function render(){
 $('wowRoutes').textContent=db.routes.length;$('wowEncounters').textContent=db.encounters.length;$('wowWeeklies').textContent=db.weeklies.filter(x=>!x.done).length;
 $('wowWeeklyList').innerHTML=db.weeklies.map(x=>'<div class="wow-item"><label class="check '+(x.done?'done':'')+'"><input type="checkbox" data-week="'+h(x.id)+'" '+(x.done?'checked':'')+'><span class="tasktext"><strong>'+h(x.title)+'</strong><small>'+h(x.group)+'</small></span></label><button type="button" class="wow-remove" data-group="weeklies" data-id="'+h(x.id)+'">×</button></div>').join('')||empty;
 $('wowEncounterList').innerHTML=db.encounters.map(x=>listItem(x.name,x.difficulty,'encounters',x,'<p class="hint wow-lines">'+h(x.notes)+'</p>')).join('')||empty;
 $('wowRouteList').innerHTML=db.routes.map(x=>listItem(x.name,x.dungeon+' · '+x.stops.length+' stops','routes',x,'<ol class="wow-stops">'+x.stops.map(s=>'<li>'+h(s)+'</li>').join('')+'</ol><button type="button" class="wow-copy" data-copy-route="'+h(x.id)+'">COPY ROUTE</button>')).join('')||empty;
 $('wowRecipeList').innerHTML=db.recipes.map(x=>listItem(x.name,'Cost: '+gold(x.cost)+'g · Net: '+gold(x.net)+'g','recipes',x)).join('')||empty;
 $('wowGearList').innerHTML=db.gear.map(x=>listItem(x.name,'Current '+x.old.toFixed(1)+' · Candidate '+x.next.toFixed(1)+' · Delta '+(x.next-x.old).toFixed(1),'gear',x)).join('')||empty;
}
insert();
function bindForm(id,fn){$(id).addEventListener('submit',e=>{e.preventDefault();fn();save();e.target.reset()})}
bindForm('wowWeeklyForm',()=>db.weeklies.unshift({id:id(),title:$('wowWeekly').value.trim(),group:$('wowWeeklyGroup').value,done:false}));
bindForm('wowEncounterForm',()=>db.encounters.unshift({id:id(),name:$('wowBoss').value.trim(),difficulty:$('wowDifficulty').value,notes:$('wowMechanics').value.trim()}));
bindForm('wowRouteForm',()=>{const stops=$('wowStops').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(!stops.length)return;db.routes.unshift({id:id(),dungeon:$('wowDungeon').value.trim(),name:$('wowRouteName').value.trim(),stops})});
const gold=n=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2,minimumFractionDigits:2});
function calcCraft(){const parts=$('wowMaterials').value.split(/\r?\n/).filter(s=>s.trim()),rows=[];let cost=0;for(const line of parts){const v=line.split(',');if(v.length!==3||!v[0].trim()||!Number.isFinite(+v[1])||!Number.isFinite(+v[2])||+v[1]<0||+v[2]<0){$('wowCraftPreview').textContent='Use: material name, quantity, unit gold price (one per line).';return null}const quantity=+v[1],price=+v[2];cost+=quantity*price;rows.push({name:v[0].trim(),quantity,price})}if(!rows.length){$('wowCraftPreview').textContent='Enter your materials to see an estimate.';return null}const sale=+$('wowSalePrice').value,fee=+$('wowFee').value;if(!Number.isFinite(sale)||!Number.isFinite(fee)||sale<0||fee<0||fee>100||!Number.isFinite(cost))return null;const net=sale*(1-fee/100)-cost;$('wowCraftPreview').textContent='Material cost: '+gold(cost)+'g · Estimated net: '+gold(net)+'g ('+(net>=0?'profit':'loss')+')';return{cost,net,rows,sale,fee}}
['wowMaterials','wowSalePrice','wowFee'].forEach(x=>$(x).addEventListener('input',calcCraft));
$('wowCraftForm').addEventListener('submit',e=>{e.preventDefault();const z=calcCraft();if(!z)return;db.recipes.unshift({id:id(),name:$('wowRecipe').value.trim(),...z});save();e.target.reset();calcCraft()});
const gearStats=['Item level','Strength / Agility / Intellect','Stamina','Critical Strike','Haste','Mastery','Versatility'];
$('wowGearFields').innerHTML=gearStats.map((stat,i)=>'<div class="wow-gear-row"><label for="wowGOld'+i+'">'+h(stat)+'</label><input aria-label="Current '+h(stat)+'" id="wowGOld'+i+'" type="number" step="any" min="0" value="0"><input aria-label="Candidate '+h(stat)+'" id="wowGNew'+i+'" type="number" step="any" min="0" value="0"><input aria-label="Weight '+h(stat)+'" id="wowGWeight'+i+'" type="number" step="any" min="0" value="'+(i===0?'0':i===1?'1':i===2?'.1':'.5')+'"></div>').join('');
function calcGear(){let old=0,next=0;for(let i=0;i<gearStats.length;i++){const a=+$('wowGOld'+i).value,b=+$('wowGNew'+i).value,w=+$('wowGWeight'+i).value;if(![a,b,w].every(Number.isFinite)||a<0||b<0||w<0)return null;old+=a*w;next+=b*w}return{old,next}}
$('wowGearFields').addEventListener('input',()=>{const z=calcGear();$('wowGearResult').textContent=z?'Current: '+z.old.toFixed(1)+' · Candidate: '+z.next.toFixed(1)+' · Delta: '+(z.next-z.old).toFixed(1)+' (manual weighted estimate)':'Enter valid nonnegative values.'});
$('wowGearSave').addEventListener('click',()=>{const z=calcGear();if(!z)return;db.gear.unshift({id:id(),name:$('wowGearLabel').value.trim()||'Unnamed comparison',...z});save()});
$('wowGearReset').addEventListener('click',()=>{$('wowGearLabel').value='';$('wowGearFields').querySelectorAll('input').forEach((e,i)=>{if(i%3!==2)e.value='0'});$('wowGearResult').textContent='Values reset.'});
$('wowWeekReset').addEventListener('click',()=>{if(confirm('Mark all weekly objectives as open for a new week?')){db.weeklies.forEach(x=>x.done=false);save()}});
document.addEventListener('change',e=>{const key=e.target.dataset.week;if(key){const x=db.weeklies.find(x=>x.id===key);if(x){x.done=e.target.checked;save()}}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-group],[data-copy-route]');if(!b)return;
if(b.dataset.group){const group=b.dataset.group;if(!Object.hasOwn(db,group))return;if(!confirm('Delete this saved entry?'))return;db[group]=db[group].filter(x=>x.id!==b.dataset.id);save()}
if(b.dataset.copyRoute){const r=db.routes.find(x=>x.id===b.dataset.copyRoute);if(!r)return;const str=r.dungeon+' — '+r.name+'\n'+r.stops.map((s,i)=>(i+1)+'. '+s).join('\n');try{await navigator.clipboard.writeText(str);alert('Route copied')}catch(_){prompt('Copy this route:',str)}}
});
$('wowExport')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify({format:'nexus-azeroth-overdrive-v1',...db},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='azeroth-overdrive-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)});
$('wowImport')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>4000000)throw Error('Backup too large');const v=JSON.parse(await file.text());if(v.format!=='nexus-azeroth-overdrive-v1'||!Object.keys(fresh()).every(k=>Array.isArray(v[k])&&v[k].length<5000))throw Error('Invalid companion backup');if(confirm('Replace advanced Warcraft data from this backup?')){db=Object.fromEntries(Object.keys(fresh()).map(k=>[k,v[k]]));save()}}catch(err){alert('Cannot import: '+err.message)}e.target.value=''});
const RELEASE_BASE=new URL('./',location.href);
async function releaseInfo(manual=false){const status=$('wowUpdateStatus');status.textContent='Checking release records…';try{
 const q=manual?'?check='+Date.now():'';
 const [version,index]=await Promise.all([fetch(new URL('version.json'+q,RELEASE_BASE),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Version request failed');return r.json()}),fetch(new URL('releases/index.json'+q,RELEASE_BASE),{cache:'no-store'}).then(r=>r.json())]);
 if(!/^\d+\.\d+\.\d+$/.test(version.version)||!Array.isArray(index.releases))throw Error('Bad version metadata');
 $('wowVersion').textContent='v'+version.version;$('wowReleaseSubtitle').textContent=version.subtitle;
 $('wowReleaseFeatures').innerHTML=(version.changes||[]).slice(0,7).map(s=>'<p class="wow-feature">✓ '+h(s)+'</p>').join('');
 $('wowReleaseHistory').innerHTML=index.releases.slice(0,12).map(r=>'<div class="wow-item"><div><strong>v'+h(r.version)+' · '+h(r.title)+'</strong><small>'+h(r.date)+'</small></div></div>').join('');
 status.textContent='Latest published manifest: v'+version.version+' · '+(manual?'Checked just now':'Release data loaded')+'.';
}catch(err){status.textContent='Cannot check the live release manifest right now. Local tools remain available.'}}
$('wowCheckUpdates').addEventListener('click',()=>releaseInfo(true));
render();releaseInfo();
})();


;/* BUNDLE SOURCE: player-utility.js */
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
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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


;/* BUNDLE SOURCE: connected-armory.js */
/* NEXUS | Azeroth Companion v2.0 — read-only connected Blizzard data */
(()=>{'use strict';
const API='https://nexus-azeroth-api.zevromxr.workers.dev';
const STORAGE='nexus_azeroth_connected_v2';
const $=id=>document.getElementById(id);
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regions=['us','eu','kr','tw'];
const state={wishlist:[],recent:[]};
try{const x=JSON.parse(localStorage.getItem(STORAGE)||'null');if(x&&typeof x==='object'){if(Array.isArray(x.wishlist))state.wishlist=x.wishlist.slice(0,100).filter(v=>Number.isSafeInteger(v.id)&&regions.includes(v.region));if(Array.isArray(x.recent))state.recent=x.recent.slice(0,15).filter(v=>Number.isSafeInteger(v.id)&&regions.includes(v.region))}}catch(_){}
const main=document.querySelector('.main'),nav=document.querySelector('.nav'),foot=main?.querySelector('.footer');
if(!main||!nav||!foot)return;
const mount=document.createElement('div');mount.id='connectedBlizzard';
mount.innerHTML="\n<section class=\"section\" data-section=\"armory\"><div class=\"wow-kicker\">CONNECTED RETAIL CHARACTER DATA</div><h2>Live Character Armory</h2><p class=\"muted\">Retrieve character profiles and equipped gear from Blizzard. Enter a realm slug (for example, area-52). Public profile data can lag behind in-game changes.</p>\n<div class=\"grid\"><form class=\"panel\" id=\"cxCharacterForm\"><h3>Find a character</h3><div class=\"field\"><label for=\"cxCharacterRegion\">Region</label><select id=\"cxCharacterRegion\"><option value=\"us\">Americas</option><option value=\"eu\">Europe</option><option value=\"kr\">Korea</option><option value=\"tw\">Taiwan</option></select></div><div class=\"field\"><label for=\"cxRealm\">Realm slug</label><input id=\"cxRealm\" required maxlength=\"80\" placeholder=\"area-52\"></div><div class=\"field\"><label for=\"cxName\">Character</label><input id=\"cxName\" required maxlength=\"50\" placeholder=\"Character name\"></div><button type=\"submit\" class=\"primary\" id=\"cxCharacterButton\">LOAD REAL PROFILE</button><p class=\"hint\">The initial Worker supports ASCII names and realm slugs. Other character names need a Worker update.</p></form>\n<div class=\"panel\"><h3>Official character profile</h3><div id=\"cxCharacterResult\" aria-live=\"polite\" class=\"cx-placeholder\">Enter your character to look up Blizzard data.</div></div></div><div class=\"panel cx-spaced\"><h3>Equipped Items</h3><div id=\"cxEquipment\" class=\"cx-list\"><div class=\"empty\">Gear appears after a successful lookup.</div></div></div></section>\n<section class=\"section\" data-section=\"codex\"><div class=\"wow-kicker\">OFFICIAL WORLD OF WARCRAFT ITEMS</div><h2>Item Codex</h2><p class=\"muted\">Inspect actual item names, quality, levels, stats and effects by Blizzard item ID. Acquisition locations and search by item name require a separate catalog.</p><div class=\"grid\"><form class=\"panel\" id=\"cxItemForm\"><h3>Inspect an item</h3><div class=\"field\"><label for=\"cxItemRegion\">Region</label><select id=\"cxItemRegion\"><option value=\"us\">Americas</option><option value=\"eu\">Europe</option><option value=\"kr\">Korea</option><option value=\"tw\">Taiwan</option></select></div><div class=\"field\"><label for=\"cxItemId\">Item ID</label><input id=\"cxItemId\" required inputmode=\"numeric\" maxlength=\"10\" placeholder=\"19019\"></div><button id=\"cxItemButton\" type=\"submit\" class=\"primary\">FETCH BLIZZARD ITEM</button><div class=\"actions\"><button type=\"button\" id=\"cxExample\">TRY THUNDERFURY</button></div></form><div class=\"panel\"><h3>Item Details</h3><div id=\"cxItemResult\" aria-live=\"polite\" class=\"cx-placeholder\">Item data appears here.</div></div></div><div class=\"grid cx-spaced\"><div class=\"panel\"><h3>Saved Item Wishlist</h3><div id=\"cxWishlist\" class=\"cx-list\"></div></div><div class=\"panel\"><h3>Recently Inspected</h3><div id=\"cxRecent\" class=\"cx-list\"></div></div></div></section><div id=\"cxStatus\" role=\"status\" aria-live=\"polite\" class=\"cx-status\">Live Blizzard lookup is available. No login credentials are stored on this website.</div>";
main.insertBefore(mount,foot);
for(const [view,name] of [['armory','◈ Live Armory'],['codex','✦ Item Codex']]){const b=document.createElement('button');b.type='button';b.dataset.view=view;b.textContent=name;nav.prepend(b)}
function view(key){document.querySelectorAll('[data-section]').forEach(x=>x.classList.toggle('active',x.dataset.section===key));document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===key));scrollTo({top:0,behavior:'instant'})}
function status(message,kind='info'){$('cxStatus').textContent=message;$('cxStatus').dataset.kind=kind}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch(_){status('Local storage unavailable. Saved items might not persist.','warn')}}
function details(title,value){return '<div class="cx-detail"><span>'+h(title)+'</span><strong>'+h(value??'Not available')+'</strong></div>'}
function itemCard(item,region,date){const p=item.preview_item||item,stats=Array.isArray(p.stats)?p.stats:[],spells=Array.isArray(p.spells)?p.spells:[],name=p.name||item.name||'Unknown item';const fields=[details('Item ID',item.id),details('Quality',p.quality?.name||item.quality?.name),details('Item level',p.level?.value??item.level),details('Category',p.item_class?.name||item.item_class?.name),details('Subtype',p.item_subclass?.name||item.item_subclass?.name),details('Slot',p.inventory_type?.name||item.inventory_type?.name),details('Requirement',p.requirements?.level?.display_string||('Level '+(item.required_level??'?')))].join('');return '<div class="cx-item"><h3>'+h(name)+'</h3><small>Blizzard item #'+h(item.id)+' · Fetched '+h(new Date(date).toLocaleString())+'</small><div class="cx-details">'+fields+'</div><h4>Preview variant stats</h4>'+(stats.length?stats.map(s=>'<p>'+h(s.display?.display_string||s.type?.name||'Stat')+'</p>').join(''):'<p>No preview stats supplied.</p>')+(spells.length?'<h4>Effects</h4>'+spells.map(s=>'<p><strong>'+h(s.spell?.name||'Effect')+':</strong> '+h(s.description||'')+'</p>').join(''):'')+'<div class="actions"><button type="button" data-cxsave="'+item.id+'" data-cxname="'+h(name)+'" data-cxregion="'+h(region)+'">SAVE ITEM</button></div></div>'}
function savedCard(x){return '<div class="cx-saved"><div><strong>'+h(x.name)+'</strong><small>#'+h(x.id)+' · '+h(x.region.toUpperCase())+'</small></div><div class="actions"><button type="button" data-cxopen="'+x.id+'" data-cxregion="'+h(x.region)+'">OPEN</button>'+(state.wishlist.some(y=>y.id===x.id&&y.region===x.region)?'<button data-cxremove="'+x.id+'" data-cxregion="'+h(x.region)+'" type="button">REMOVE</button>':'')+'</div></div>'}
function renderLists(){$('cxWishlist').innerHTML=state.wishlist.length?state.wishlist.map(savedCard).join(''):'<div class="empty">No saved items yet.</div>';$('cxRecent').innerHTML=state.recent.length?state.recent.map(savedCard).join(''):'<div class="empty">No recent lookups.</div>'}
async function request(path){const c=new AbortController(),timer=setTimeout(()=>c.abort(),16000);try{const r=await fetch(API+path,{method:'GET',credentials:'omit',cache:'no-store',headers:{Accept:'application/json'},signal:c.signal});const v=await r.json().catch(()=>null);if(!r.ok||!v||v.success===false)throw Error(String(v?.message||v?.error||('Blizzard API HTTP '+r.status)).slice(0,180));return v}catch(e){if(e.name==='AbortError')throw Error('API timed out');if(e instanceof TypeError)throw Error('Unable to reach the API gateway');throw e}finally{clearTimeout(timer)}}
async function inspect(id,region){if(!regions.includes(region))region='us';if(!/^[1-9][0-9]{0,9}$/.test(String(id))){status('Please enter a valid numeric item ID.','warn');return}view('codex');$('cxItemId').value=id;$('cxItemRegion').value=region;const button=$('cxItemButton');button.disabled=true;$('cxItemResult').textContent='Loading item from Blizzard…';try{const r=await request('/api/item/'+region+'/'+id),item=r.data;if(!item||!item.id)throw Error('Blizzard returned incomplete item data');$('cxItemResult').innerHTML=itemCard(item,region,r.fetchedAt);state.recent=[{id:item.id,region,name:String(item.name||'Item #'+id).slice(0,150)},...state.recent.filter(x=>x.id!==item.id||x.region!==region)].slice(0,15);save();renderLists();status('Official Blizzard item data loaded.','ok')}catch(e){$('cxItemResult').textContent=e.message;status('Item lookup failed: '+e.message,'warn')}finally{button.disabled=false}}
$('cxItemForm').addEventListener('submit',e=>{e.preventDefault();inspect($('cxItemId').value,$('cxItemRegion').value)});
$('cxExample').addEventListener('click',()=>inspect(19019,'us'));
document.addEventListener('click',e=>{const b=e.target.closest('[data-cxopen],[data-cxsave],[data-cxremove]');if(!b)return;const region=regions.includes(b.dataset.cxregion)?b.dataset.cxregion:'us';if(b.dataset.cxopen){inspect(b.dataset.cxopen,region);return}if(b.dataset.cxsave){const id=+b.dataset.cxsave,name=String(b.dataset.cxname||'Item').slice(0,150);if(!state.wishlist.some(x=>x.id===id&&x.region===region))state.wishlist.unshift({id,region,name});state.wishlist=state.wishlist.slice(0,100);save();renderLists();status('Item saved to wishlist.','ok')}else if(b.dataset.cxremove){state.wishlist=state.wishlist.filter(x=>x.id!==+b.dataset.cxremove||x.region!==region);save();renderLists();status('Item removed.','ok')}});
$('cxCharacterForm').addEventListener('submit',async e=>{e.preventDefault();const region=$('cxCharacterRegion').value,realm=$('cxRealm').value.trim().toLowerCase(),name=$('cxName').value.trim().toLowerCase();if(!regions.includes(region)||!/^[a-z0-9-]{2,80}$/.test(realm)||!/^[a-z0-9-]{2,50}$/.test(name)){status('The current gateway requires an ASCII character name and a realm slug.','warn');return}const button=$('cxCharacterButton');button.disabled=true;$('cxCharacterResult').textContent='Loading public Blizzard profile…';$('cxEquipment').textContent='Loading equipped items…';try{const base='/api/character/'+region+'/'+realm+'/'+name;const [profile,equipment]=await Promise.allSettled([request(base),request(base.replace('/character/','/equipment/'))]);if(profile.status!=='fulfilled')throw profile.reason;const p=profile.value.data;if(!p?.name)throw Error('Character profile incomplete');document.dispatchEvent(new CustomEvent('nexus:public-profile-loaded',{detail:{region,realm,name,level:Number.isFinite(Number(p.level))?Number(p.level):null,className:String(p.character_class?.name||'').slice(0,80),spec:String(p.active_spec?.name||'').slice(0,80),itemLevel:Number.isFinite(Number(p.average_item_level))?Number(p.average_item_level):null}}));$('cxCharacterResult').innerHTML='<h3>'+h(p.name)+'</h3><div class="cx-details">'+[details('Realm',p.realm?.name||realm),details('Level',p.level),details('Class',p.character_class?.name),details('Specialization',p.active_spec?.name),details('Faction',p.faction?.name),details('Average item level',p.average_item_level)].join('')+'</div><p class="hint">Source: Blizzard Profile API · '+h(new Date(profile.value.fetchedAt).toLocaleString())+'</p>';if(equipment.status==='fulfilled'){const list=equipment.value.data?.equipped_items;$('cxEquipment').innerHTML=Array.isArray(list)&&list.length?list.map(x=>'<div class="cx-saved"><div><span class="cx-slot">'+h(x.slot?.name||'Equipment')+'</span><strong>'+h(x.name||x.item?.name||'Item')+'</strong><small>Item #'+h(x.item?.id)+' · Level '+h(x.level?.value??x.level??'?')+'</small></div>'+(Number.isInteger(x.item?.id)?'<button type="button" data-cxopen="'+x.item.id+'" data-cxregion="'+region+'">INSPECT</button>':'')+'</div>').join(''):'<div class="empty">No equipped items returned.</div>';status('Character and equipment loaded from Blizzard.','ok')}else{$('cxEquipment').textContent='Profile loaded but equipped items could not be retrieved.';status('Character loaded; equipment unavailable.','warn')}}catch(e){$('cxCharacterResult').textContent=e.message;$('cxEquipment').textContent='No equipment loaded.';status('Character lookup failed: '+e.message,'warn')}finally{button.disabled=false}});
renderLists();
})();

;/* BUNDLE SOURCE: item-discovery.js */
/* Azeroth Companion v2.1 - item discovery extensions.
 * Requires Cloudflare worker.js v2.1 for name search and media.
 * Existing v2.0 item ID and Armory requests remain independently functional.
 */
(()=>{'use strict';
const API='https://nexus-azeroth-api.zevromxr.workers.dev';
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const codex=document.querySelector('[data-section="codex"]'),form=$('cxItemForm');
if(!codex||!form)return;
const el=document.createElement('div');el.className='panel id-search-panel';el.innerHTML='<h3>Find Items by Name <span class="chip">NEW</span></h3><p class="muted">Search Blizzard’s official Retail item index using a name or keyword. Choose an item to inspect its details. Requires the v2.1 Cloudflare gateway update.</p><form id="discoverForm"><div class="grid"><div class="field"><label for="discoverName">Item name</label><input id="discoverName" minlength="2" maxlength="70" required placeholder="Thunderfury"></div><div class="field"><label for="discoverRegion">Region</label><select id="discoverRegion"><option value="us">Americas</option><option value="eu">Europe</option><option value="kr">Korea</option><option value="tw">Taiwan</option></select></div></div><button type="submit" class="primary" id="discoverSearch">SEARCH OFFICIAL ITEMS</button></form><div class="discover-status" id="discoverStatus" role="status" aria-live="polite">Ready to search.</div><div class="discover-results" id="discoverResults"></div>';codex.insertBefore(el,codex.querySelector('.grid'));
async function get(url,timeout=13000){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
 try{const res=await fetch(url,{cache:'no-store',signal:c.signal,headers:{Accept:'application/json'}}),data=await res.json().catch(()=>null);
 if(!res.ok||!data||data.success===false)throw Error(String(data?.message||'Endpoint unavailable').slice(0,150));
 return data.data
 }catch(e){if(e.name==='AbortError')throw Error('Request timed out');throw e}finally{clearTimeout(t)}
}
let running=0;
$('discoverForm').addEventListener('submit',async e=>{
 e.preventDefault();const query=$('discoverName').value.trim(),region=$('discoverRegion').value;
 if(query.length<2||query.length>70)return;
 const current=++running,btn=$('discoverSearch');btn.disabled=true;$('discoverResults').replaceChildren();$('discoverStatus').textContent='Searching Blizzard for “'+query+'”…';
 try{
 const result=await get(API+'/api/search/'+encodeURIComponent(region)+'?q='+encodeURIComponent(query));
 if(current!==running)return;
 const list=Array.isArray(result.items)?result.items.slice(0,20):[];
 $('discoverStatus').textContent=list.length?'Found '+list.length+' item matches. Results are from Blizzard.':'No matching items on this page. Try another keyword or region.';
 $('discoverResults').innerHTML=list.map(item=>{
 const id=Number(item.id);if(!Number.isSafeInteger(id)||id<=0)return'';
 return '<div class="discover-card"><div><strong>'+h(item.name||'Item #'+id)+'</strong><small>#'+id+(item.quality?' · '+h(item.quality):'')+(item.level?' · Level '+h(item.level):'')+'</small></div><button type="button" data-cxopen="'+id+'" data-cxregion="'+h(region)+'">INSPECT</button></div>'
 }).join('');
 }catch(err){if(current!==running)return;$('discoverStatus').textContent='Name search unavailable: '+err.message+'. Item-ID lookup still works below.'}
 finally{if(current===running)btn.disabled=false}
});
const result=$('cxItemResult');let observedId='',serial=0;
const mediaHolder=document.createElement('div');mediaHolder.id='discoverItemMedia';result.parentNode.insertBefore(mediaHolder,result);
function iconFrom(d){const arr=Array.isArray(d?.assets)?d.assets:[];return arr.find(v=>v.key==='icon'&&typeof v.url==='string'&&/^https:\/\//.test(v.url))?.url||''}
async function mediaFor(id,region){
 const thisId=++serial;mediaHolder.textContent='';
 try{
 const data=await get(API+'/api/media/'+region+'/'+id,9000);
 if(thisId!==serial)return;const url=iconFrom(data);if(!url)return;
 const img=document.createElement('img');img.src=url;img.alt='Official Blizzard item icon';img.loading='lazy';img.referrerPolicy='no-referrer';img.className='discover-icon';mediaHolder.appendChild(img);
 }catch(_){/* Backwards compatible: media is optional until backend is updated. */}
}
const observer=new MutationObserver(()=>{
 const item=result.querySelector('[data-cxsave]');if(!item)return;
 const id=item.dataset.cxsave,region=item.dataset.cxregion||'us',key=region+':'+id;
 if(key!==observedId){observedId=key;mediaFor(id,region)}
});
observer.observe(result,{childList:true,subtree:true});
})();

;/* BUNDLE SOURCE: item-atlas.js */
/* NEXUS | AZEROTH COMPANION v3.2 — Universal Item Atlas
 * Any valid official item ID may be tracked, regardless of catalog membership.
 * Item discovery is paginated and bounded by Blizzard's search behavior.
 * All ownership/status changes are USER REPORTED, never Blizzard-verified.
 */
(()=>{'use strict';
const KEY='nexus_azeroth_item_atlas_v1',API='https://nexus-azeroth-api.zevromxr.workers.dev';
const MAX=5000,REGIONS=['us','eu','kr','tw'],STATUS=['wishlist','farming','owned','archived'];
const $=id=>document.getElementById(id),h=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const validId=id=>Number.isSafeInteger(Number(id))&&Number(id)>0&&Number(id)<=9999999999&&/^[1-9]\d{0,9}$/.test(String(id));
function normalized(x){
 if(!x||!validId(x.id)||!REGIONS.includes(x.region)||!STATUS.includes(x.status))return null;
 return{id:Number(x.id),region:x.region,name:String(x.name||'Item #'+x.id).slice(0,140),status:x.status,notes:String(x.notes||'').slice(0,400),updated:String(x.updated||'').slice(0,32)};
}
let records=[];try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(data)){const seen=new Set();records=data.map(normalized).filter(x=>{if(!x)return false;const k=x.region+':'+x.id;if(seen.has(k))return false;seen.add(k);return true}).slice(0,MAX)}}catch(_){}
const root=document.querySelector('.main'),footer=root?.querySelector('.footer'),nav=document.querySelector('.nav');if(!root||!footer||!nav)return;
const tab=document.createElement('button');tab.type='button';tab.dataset.view='atlas';tab.textContent='▤ Item Atlas';nav.prepend(tab);
const host=document.createElement('div');host.id='itemAtlas';host.innerHTML='<section class="section" data-section="atlas"><div class="wow-kicker">OFFICIAL BLIZZARD SEARCH · PERSONAL ITEM TRACKING</div><h2>Universal Item Atlas</h2><p class="muted">Look up any available Retail Blizzard item by ID or search by name across paginated results. Keep your own persistent item lists. No preloaded catalog can promise every item or every expansion; Blizzard search may cap results and omit some entries.</p>'+
'<div class="atlas-stats" id="atlasStats" aria-live="polite"></div><div class="atlas-grid"><form class="panel" id="atlasSearchForm"><h3>Discover Blizzard Items</h3><div class="atlas-controls"><label>Region <select id="atlasRegion"><option value="us">Americas</option><option value="eu">Europe</option><option value="kr">Korea</option><option value="tw">Taiwan</option></select></label><label>Item name <input id="atlasQuery" maxlength="70" minlength="2" placeholder="Sword, Invincible, potion…" required></label><button class="primary" type="submit">SEARCH ITEMS</button></div><div class="atlas-controls"><button id="atlasPrev" type="button">PREVIOUS PAGE</button><span id="atlasPage">Page 1</span><button id="atlasNext" type="button">NEXT PAGE</button></div><div id="atlasSearchStatus" class="hint" role="status" aria-live="polite">Search by name, or use an official item ID.</div><div id="atlasSearchResults" class="atlas-list"></div></form>'+
'<form class="panel" id="atlasIdForm"><h3>Track Any Item ID</h3><p class="muted">Use an official Blizzard item ID even when it is absent from a name search. Verification will try the existing Blizzard Item API.</p><div class="atlas-controls"><label>Official item ID <input id="atlasId" inputmode="numeric" maxlength="10" pattern="[1-9][0-9]*" placeholder="19019" required></label><button type="submit">LOOK UP ITEM</button></div><div id="atlasIdStatus" class="hint" role="status" aria-live="polite">No item selected.</div><div id="atlasIdResult" class="atlas-list"></div><p class="hint">A missing API record is not treated as a valid item. To track an unavailable record, verify its ID from another official source first.</p></form></div>'+
'<div class="panel atlas-board"><div class="top"><h3>My Personal Item Tracker</h3><div class="atlas-controls"><button id="atlasExport" type="button">EXPORT ITEMS</button><label class="wow-file">IMPORT ITEMS<input id="atlasImport" type="file" accept=".json,application/json"></label></div></div><p class="muted">Statuses are manually selected by the player. “I own this” is not a Blizzard account ownership check. Records are stored in this browser; use backups to move between devices.</p><div class="atlas-controls"><label>Status <select id="atlasFilter"><option value="all">All</option><option value="wishlist">Wishlist</option><option value="farming">Farming</option><option value="owned">I own this (manual)</option><option value="archived">Archived</option></select></label><label>Filter saved items <input id="atlasSavedQuery" maxlength="100" placeholder="Name or item ID"></label></div><div id="atlasBoard" class="atlas-list"></div><div class="atlas-controls"><button id="atlasMore" type="button">SHOW MORE SAVED ITEMS</button></div><p id="atlasStatus" role="status" aria-live="polite" class="hint"></p></div>'+
'<div class="notice">This atlas does not prove that an item is obtainable in the current expansion, in a given region, or held by a specific character. Blizzard collection verification in My Azeroth remains a separate, limited read-only feature.</div></section>';root.insertBefore(host,footer);
let page=1,lastQuery='',lastRegion='us',pageCount=1,lookupRecord=null,shown=80,searchRun=0,idRun=0;
const key=x=>x.region+':'+x.id;
function notice(s){$('atlasStatus').textContent=s}
function save(){try{localStorage.setItem(KEY,JSON.stringify(records));window.dispatchEvent(new Event('nexus:item-atlas-changed'));notice('Saved locally on this device. Export a backup to keep a transferable copy.')}catch(_){notice('Storage is full or blocked. Export a backup; recent changes might not persist.')}} 
function stats(){const buckets={wishlist:0,farming:0,owned:0,archived:0};records.forEach(x=>buckets[x.status]++);$('atlasStats').innerHTML=[['Saved items',records.length],['Wishlist',buckets.wishlist],['Farming',buckets.farming],['Manually owned',buckets.owned],['Archived',buckets.archived]].map(([n,v])=>'<div><strong>'+v+'</strong><span>'+n+'</span></div>').join('')}
function listing(r,region){
 return r.map(x=>{const id=Number(x.id);if(!validId(id))return '';const name=h(x.name||'Item #'+id),already=records.some(v=>v.id===id&&v.region===region);return '<div class="atlas-entry"><div><strong>'+name+'</strong><small>Item #'+id+(x.quality?' · '+h(x.quality):'')+(x.level?' · Level '+h(x.level):'')+'</small></div><div class="atlas-actions"><button type="button" data-atlas-add="'+id+'" data-atlas-name="'+name+'" data-atlas-region="'+region+'">'+(already?'SAVED · UPDATE':'TRACK ITEM')+'</button><button type="button" data-atlas-inspect="'+id+'" data-atlas-region="'+region+'">INSPECT</button></div></div>'}).join('')||'<div class="empty">No items found in this result page.</div>';
}
function render(){stats();const term=$('atlasSavedQuery').value.trim().toLowerCase(),filter=$('atlasFilter').value;const selected=records.filter(x=>(filter==='all'||x.status===filter)&&(!term||x.name.toLowerCase().includes(term)||String(x.id).includes(term)));$('atlasBoard').innerHTML=selected.slice(0,shown).map(x=>'<div class="atlas-entry"><div><strong>'+h(x.name)+'</strong><small>#'+x.id+' · '+x.region.toUpperCase()+' · '+({wishlist:'Wishlist',farming:'Farming',owned:'Manually owned',archived:'Archived'}[x.status])+'</small><label class="atlas-note-label">Notes <input maxlength="400" data-atlas-notes="'+x.id+'" data-atlas-region="'+x.region+'" value="'+h(x.notes)+'" placeholder="Character, source, patch, route…"></label></div><div class="atlas-actions"><select aria-label="Personal status for '+h(x.name)+'" data-atlas-status="'+x.id+'" data-atlas-region="'+x.region+'">'+STATUS.map(t=>'<option value="'+t+'" '+(t===x.status?'selected':'')+'>'+({wishlist:'Wishlist',farming:'Farming',owned:'I own this (manual)',archived:'Archived'}[t])+'</option>').join('')+'</select><button type="button" data-atlas-inspect="'+x.id+'" data-atlas-region="'+x.region+'">INSPECT</button><button type="button" data-atlas-delete="'+x.id+'" data-atlas-region="'+x.region+'">REMOVE</button></div></div>').join('')||'<div class="empty">No saved items in this view.</div>';$('atlasMore').hidden=selected.length<=shown;notice(selected.length+' saved item(s) matching the current filter.')}
function add(raw,region='us'){const id=Number(raw.id),name=String(raw.name||'Item #'+id).slice(0,140);if(!validId(id)||!REGIONS.includes(region))return notice('Invalid item or region');const old=records.find(x=>x.id===id&&x.region===region);if(old){old.name=name;old.updated=new Date().toISOString();save();render();return}if(records.length>=MAX)return notice('Local tracker limit reached ('+MAX+'). Export and archive records before adding more.');records.unshift({id,region,name,status:'wishlist',notes:'',updated:new Date().toISOString()});save();render()}
const api=async path=>{const ctl=new AbortController(),time=setTimeout(()=>ctl.abort(),14000);try{const res=await fetch(API+path,{method:'GET',credentials:'omit',cache:'no-store',signal:ctl.signal});const data=await res.json();if(!res.ok||data.success===false)throw Error(data.message||'Blizzard API not available');return data.data}finally{clearTimeout(time)}};
async function search(p){const q=$('atlasQuery').value.trim(),region=$('atlasRegion').value;if(q.length<2||q.length>70||!REGIONS.includes(region))return;const run=++searchRun;lastQuery=q;lastRegion=region;page=p;$('atlasSearchStatus').textContent='Searching Blizzard…';$('atlasSearchResults').textContent='';try{const data=await api('/api/search/'+region+'?q='+encodeURIComponent(q)+'&page='+page);if(run!==searchRun)return;page=Number(data.page)||p;pageCount=Math.min(50,Math.max(1,Number(data.pageCount)||1));$('atlasSearchResults').innerHTML=listing(Array.isArray(data.items)?data.items:[],region);$('atlasSearchStatus').textContent='Blizzard results · page '+page+' of up to '+pageCount+(data.resultCountCapped?' · results capped by Blizzard':'')+'. Not a complete enumeration of every game item.'}catch(e){if(run===searchRun)$('atlasSearchStatus').textContent='Search unavailable: '+e.message+'. Item ID lookup and saved items remain usable.'}finally{if(run===searchRun){$('atlasPage').textContent='Page '+page;$('atlasPrev').disabled=page<=1;$('atlasNext').disabled=page>=pageCount}}}
$('atlasSearchForm').addEventListener('submit',e=>{e.preventDefault();search(1)});
$('atlasPrev').addEventListener('click',()=>{if(page>1)search(page-1)});
$('atlasNext').addEventListener('click',()=>{if(page<pageCount)search(page+1)});
$('atlasIdForm').addEventListener('submit',async e=>{e.preventDefault();const id=$('atlasId').value,region=$('atlasRegion').value;if(!validId(id))return $('atlasIdStatus').textContent='Enter a valid numeric ID.';const run=++idRun;$('atlasIdResult').textContent='';$('atlasIdStatus').textContent='Loading official item #'+id+'…';try{const d=await api('/api/item/'+region+'/'+id);if(run!==idRun)return;if(!validId(d.id))throw Error('Blizzard did not return a valid item record');lookupRecord={id:Number(d.id),name:String(d.name||'Item #'+id).slice(0,140)};$('atlasIdResult').innerHTML=listing([lookupRecord],region);$('atlasIdStatus').textContent='Official Blizzard item record found.'}catch(err){if(run===idRun)$('atlasIdStatus').textContent='Could not verify item: '+err.message+'. No item was added.'}});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-atlas-add],[data-atlas-inspect],[data-atlas-delete]');if(!b)return;
 const id=b.dataset.atlasAdd||b.dataset.atlasInspect||b.dataset.atlasDelete,region=b.dataset.atlasRegion;if(!validId(id)||!REGIONS.includes(region))return;
 if(b.dataset.atlasAdd){add({id,name:b.dataset.atlasName},region);return}
 if(b.dataset.atlasInspect){const tab=document.querySelector('[data-view="codex"]'),f=$('cxItemForm');if(tab&&f){tab.click();$('cxItemId').value=id;$('cxItemRegion').value=region;f.requestSubmit()}return}
 if(b.dataset.atlasDelete&&confirm('Remove this item from your personal atlas?')){records=records.filter(x=>!(x.id===Number(id)&&x.region===region));save();render()}
});
host.addEventListener('change',e=>{const b=e.target;const id=b.dataset.atlasStatus||b.dataset.atlasNotes;if(!id)return;const x=records.find(v=>v.id===Number(id)&&v.region===b.dataset.atlasRegion);if(!x)return;if(b.dataset.atlasStatus&&STATUS.includes(b.value))x.status=b.value;if(b.dataset.atlasNotes)x.notes=b.value.slice(0,400);x.updated=new Date().toISOString();save();render()});
$('atlasFilter').addEventListener('change',()=>{shown=80;render()});$('atlasSavedQuery').addEventListener('input',()=>{shown=80;render()});$('atlasMore').addEventListener('click',()=>{shown=Math.min(MAX,shown+80);render()});
$('atlasExport').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({format:'nexus-azeroth-item-atlas-v1',exportedAt:new Date().toISOString(),items:records},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nexus-azeroth-item-atlas.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)});
$('atlasImport').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>1600000)throw Error('File exceeds 1.6 MB');const data=JSON.parse(await file.text());if(data.format!=='nexus-azeroth-item-atlas-v1'||!Array.isArray(data.items)||data.items.length>MAX)throw Error('Incompatible atlas backup');const clean=[],seen=new Set();for(const raw of data.items){const x=normalized(raw);if(!x)throw Error('Invalid item in backup');if(!seen.has(key(x))){clean.push(x);seen.add(key(x))}}if(confirm('Replace your existing personal Item Atlas records? This does NOT alter the Item Codex wishlist, Loot Hunter, or Battle.net collections.')){records=clean;save();render()}}catch(err){notice('Import failed: '+err.message)}e.target.value=''});
$('atlasPrev').disabled=true;$('atlasNext').disabled=true;render();
})();

;/* BUNDLE SOURCE: character-targets.js */
/* NEXUS | Azeroth Companion v3.3 — character-specific Atlas priority planner.
 * References existing Item Atlas records and Farming Operations profiles without mutating either store.
 * Every status/assignment is personal browser-local planning, not Battle.net verified.
 */
(()=>{'use strict';
const KEY='nexus_azeroth_character_targets_v1',ATLAS='nexus_azeroth_item_atlas_v1',FARM='nexus_azeroth_farm_operations_v1';
const $=id=>document.getElementById(id),h=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const REGIONS=['us','eu','kr','tw'],PRIORITIES=['high','normal','later'],MAX=1500;
const validProfile=p=>p&&REGIONS.includes(p.region)&&/^[a-z0-9-]{2,80}$/.test(String(p.realm||''))&&/^[a-z0-9-]{2,50}$/.test(String(p.name||''))?{region:p.region,realm:p.realm,name:p.name}:null;
const identity=p=>p.region+'/'+p.realm+'/'+p.name;
function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function profiles(){const farm=readJson(FARM);const sourced=Array.isArray(farm?.characters)?farm.characters:[];const all=[...state.characters,...sourced];return [...new Map(all.map(validProfile).filter(Boolean).map(p=>[identity(p),p])).values()].slice(0,80)}
function atlas(){const arr=readJson(ATLAS);return(Array.isArray(arr)?arr:[]).filter(x=>x&&Number.isSafeInteger(Number(x.id))&&Number(x.id)>0&&REGIONS.includes(x.region)&&typeof x.name==='string').slice(0,5000)}
function clean(x){let characters=Array.isArray(x?.characters)?x.characters.map(validProfile).filter(Boolean).slice(0,80):[];const allowed=new Set(characters.map(identity));let targets=Array.isArray(x?.targets)?x.targets.filter(v=>v&&typeof v.character==='string'&&/^(us|eu|kr|tw)\/[a-z0-9-]{2,80}\/[a-z0-9-]{2,50}$/.test(v.character)&&Number.isSafeInteger(Number(v.itemId))&&Number(v.itemId)>0&&PRIORITIES.includes(v.priority)).slice(0,MAX).map(v=>({character:v.character,itemId:Number(v.itemId),region:REGIONS.includes(v.region)?v.region:'us',priority:v.priority,done:Boolean(v.done),note:String(v.note||'').slice(0,180)})):[];return{characters,targets}}
let state=clean(readJson(KEY)),current='all',filter='all';
const root=document.querySelector('.main'),footer=root?.querySelector('.footer'),nav=document.querySelector('.nav');if(!root||!footer||!nav)return;
const tab=document.createElement('button');tab.type='button';tab.dataset.view='targets';tab.textContent='⚑ Character Targets';nav.prepend(tab);
const host=document.createElement('div');host.id='characterTargets';
host.innerHTML='<section class="section" data-section="targets"><div class="wow-kicker">CHARACTER PLANNING · SAVED ITEM ATLAS</div><h2>Character Targets</h2><p class="muted">Give specific characters their own item objectives, set priorities, and mark goals complete manually. Reads the existing Item Atlas and Farming Operations character shortcuts but does not change either. Nothing here is a live inventory or automated ownership confirmation.</p><div class="panel"><h3>Choose character</h3><div class="ct-controls"><label>Character <select id="ctCharacter"><option value="all">All characters</option></select></label><label>Status <select id="ctFilter"><option value="all">All</option><option value="open">Still working</option><option value="done">Completed manually</option></select></label><button id="ctRefresh" type="button">REFRESH SAVED ITEMS</button></div><div class="ct-controls"><label>Region <select id="ctRegion"><option value="us">Americas</option><option value="eu">Europe</option><option value="kr">Korea</option><option value="tw">Taiwan</option></select></label><label>Realm slug <input id="ctRealm" maxlength="80" placeholder="area-52"></label><label>Character name <input id="ctName" maxlength="50" placeholder="hero"></label><button id="ctAddProfile" type="button">ADD MANUAL CHARACTER</button></div><p class="hint">Saved Armory/Farming Operations profiles appear automatically. A manual character shortcut is local only.</p></div><div class="panel"><h3>Assign an Item Atlas goal</h3><div class="ct-controls"><label>Target character <select id="ctAssignCharacter"></select></label><label>Tracked item <select id="ctAssignItem"></select></label><label>Priority <select id="ctPriority"><option value="high">High</option><option value="normal" selected>Normal</option><option value="later">Later</option></select></label><button id="ctAssign" class="primary" type="button">ASSIGN ITEM</button></div><p class="hint">Only items already saved to your Item Atlas appear. Use Item Atlas first to look up and track an item. You can assign the same item to multiple characters.</p></div><div id="ctStats" class="ct-stats" aria-live="polite"></div><div class="panel"><div class="ct-controls"><h3>Character progression board</h3><button id="ctExport" type="button">EXPORT TARGETS</button><label class="wow-file">IMPORT TARGETS<input type="file" id="ctImport" accept=".json,application/json"></label></div><div id="ctBoard" class="ct-board"></div><p id="ctStatus" class="hint" role="status" aria-live="polite"></p></div><div class="notice">The secure My Azeroth equipment viewer is separate from these manual objectives. Players can compare their Blizzard-reported equipped gear with these goals; the website does not copy or claim verified private inventory.</div></section>';
root.insertBefore(host,footer);
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new Event('nexus:character-targets-changed'));return true}catch(_){message('Local storage blocked or full. Please export a backup.');return false}}
function message(t){$('ctStatus').textContent=t}
const validId=id=>Number.isSafeInteger(Number(id))&&Number(id)>0&&Number(id)<=9999999999;
function render(){
 const chars=profiles(),items=atlas(),charsMap=new Map(chars.map(p=>[identity(p),p]));
 if(current!=='all'&&!charsMap.has(current))current='all';
 const oldAssign=$('ctAssignCharacter').value;
 $('ctCharacter').innerHTML='<option value="all">All characters</option>'+chars.map(p=>'<option value="'+h(identity(p))+'" '+(current===identity(p)?'selected':'')+'>'+h(p.name+' · '+p.realm+' ('+p.region.toUpperCase()+')')+'</option>').join('');
 $('ctAssignCharacter').innerHTML=chars.map(p=>'<option value="'+h(identity(p))+'" '+((oldAssign===identity(p)||!oldAssign&&current===identity(p))?'selected':'')+'>'+h(p.name+' · '+p.realm)+'</option>').join('');
 const oldItem=$('ctAssignItem').value;
 $('ctAssignItem').innerHTML=items.map(item=>'<option value="'+h(item.region+':'+item.id)+'" '+(oldItem===item.region+':'+item.id?'selected':'')+'>'+h(item.name)+' · #'+item.id+' ('+item.region.toUpperCase()+')</option>').join('');
 $('ctAssign').disabled=!chars.length||!items.length;
 const filtered=state.targets.filter(x=>(current==='all'||x.character===current)&&(filter==='all'||(filter==='done'?x.done:!x.done)));
 const completed=filtered.filter(x=>x.done).length;
 $('ctStats').innerHTML=[['Visible assignments',filtered.length],['Manually complete',completed],['Still working',filtered.length-completed],['Characters',chars.length]].map(([n,v])=>'<div><strong>'+v+'</strong><span>'+n+'</span></div>').join('');
 $('ctBoard').innerHTML=filtered.length?filtered.map((t,i)=>{
 const p=charsMap.get(t.character),a=items.find(x=>x.id===t.itemId&&x.region===t.region);
 return '<div class="ct-target"><div><strong>'+h(a?.name||'Item #'+t.itemId)+'</strong><small>'+h(p?p.name+' · '+p.realm+' ('+p.region.toUpperCase()+')':t.character)+' · Item #'+t.itemId+' · '+t.region.toUpperCase()+'</small><label class="ct-note-label">Notes <input data-ct-note="'+h(t.character)+'|'+t.region+':'+t.itemId+'" value="'+h(t.note)+'" maxlength="180" placeholder="Route, weekly plan, gear upgrade…"></label></div><div class="ct-actions"><select aria-label="Priority" data-ct-priority="'+h(t.character)+'|'+t.region+':'+t.itemId+'">'+PRIORITIES.map(p=>'<option value="'+p+'" '+(p===t.priority?'selected':'')+'>'+p+'</option>').join('')+'</select><button type="button" data-ct-done="'+h(t.character)+'|'+t.region+':'+t.itemId+'">'+(t.done?'REOPEN':'MARK COMPLETE')+'</button><button type="button" data-ct-remove="'+h(t.character)+'|'+t.region+':'+t.itemId+'">REMOVE</button></div></div>'
 }).join(''):'<div class="empty">No character assignments yet. Save items in Item Atlas, then assign them above.</div>';
 message(filtered.length+' assignment(s) shown. Manual status only; no account sync.');
}
function ref(value){const i=value.lastIndexOf('|'),char=value.slice(0,i),target=value.slice(i+1);const j=target.lastIndexOf(':'),region=target.slice(0,j),id=Number(target.slice(j+1));return state.targets.find(x=>x.character===char&&x.region===region&&x.itemId===id)}
$('ctCharacter').addEventListener('change',e=>{current=e.target.value;render()});$('ctFilter').addEventListener('change',e=>{filter=e.target.value;render()});$('ctRefresh').addEventListener('click',render);
$('ctAddProfile').addEventListener('click',()=>{const p=validProfile({region:$('ctRegion').value,realm:$('ctRealm').value.trim().toLowerCase(),name:$('ctName').value.trim().toLowerCase()});if(!p)return message('Use a valid region, ASCII realm slug, and character name.');if(!state.characters.some(x=>identity(x)===identity(p)))state.characters.push(p);if(state.characters.length>80)state.characters=state.characters.slice(-80);current=identity(p);persist();render()});
$('ctAssign').addEventListener('click',()=>{const char=$('ctAssignCharacter').value,raw=$('ctAssignItem').value,split=raw.lastIndexOf(':'),region=raw.slice(0,split),id=Number(raw.slice(split+1));if(!profiles().some(x=>identity(x)===char)||!atlas().some(x=>x.region===region&&x.id===id)||!PRIORITIES.includes($('ctPriority').value))return message('Choose a saved item and a valid character.');const old=state.targets.find(x=>x.character===char&&x.region===region&&x.itemId===id);if(old){old.priority=$('ctPriority').value;old.done=false}else{if(state.targets.length>=MAX)return message('Target limit reached ('+MAX+'). Export/clean old targets.');state.targets.push({character:char,itemId:id,region,priority:$('ctPriority').value,done:false,note:''})}current=char;persist();render()});
host.addEventListener('click',e=>{const b=e.target.closest('[data-ct-done],[data-ct-remove]');if(!b)return;const value=b.dataset.ctDone||b.dataset.ctRemove,t=ref(value);if(!t)return;if(b.dataset.ctRemove){if(!confirm('Remove this character-specific target?'))return;state.targets=state.targets.filter(x=>x!==t)}else t.done=!t.done;persist();render()});
host.addEventListener('change',e=>{const v=e.target,t=v.dataset.ctPriority?ref(v.dataset.ctPriority):v.dataset.ctNote?ref(v.dataset.ctNote):null;if(!t)return;if(v.dataset.ctPriority&&PRIORITIES.includes(v.value))t.priority=v.value;if(v.dataset.ctNote)t.note=v.value.slice(0,180);persist();render()});
$('ctExport').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({format:'nexus-azeroth-character-targets-v1',savedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nexus-azeroth-character-targets.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)});
$('ctImport').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>1000000)throw Error('File too large (1 MB limit)');const data=JSON.parse(await file.text());if(data.format!=='nexus-azeroth-character-targets-v1'||!Array.isArray(data.targets)||data.targets.length>MAX)throw Error('Not a compatible Character Targets backup');const cleanData=clean(data);if(confirm('Replace Character Targets only? Item Atlas, Loot Hunter, Farming Operations and Battle.net sessions will not change.')){state=cleanData;current='all';persist();render()}}catch(err){message('Import failed: '+err.message)}e.target.value=''});
window.addEventListener('nexus:character-targets-updated',()=>{state=clean(readJson(KEY));render()});
render();
})();

;/* BUNDLE SOURCE: progress-command.js */
/* NEXUS | AZEROTH COMPANION v3.4 — Cross-studio Progress Command.
 * Read-only rollup of independently saved, browser-local planning data.
 * No inferred Blizzard ownership, no implicit synchronization or status writes.
 */
(()=>{'use strict';
const IDS={atlas:'nexus_azeroth_item_atlas_v1',targets:'nexus_azeroth_character_targets_v1',loot:'nexus_azeroth_loot_hunter_v1',farming:'nexus_azeroth_farm_operations_v1'};
const $=id=>document.getElementById(id);
const h=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function usableId(x){return Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<1e10}
function rowKey(region,id){return String(region)+':'+String(id)}
function snapshot(){
 const a=read(IDS.atlas),l=read(IDS.loot),t=read(IDS.targets),f=read(IDS.farming);
 const atlas=(Array.isArray(a)?a:[]).filter(x=>x&&usableId(x.id)&&typeof x.name==='string'&&['us','eu','kr','tw'].includes(x.region)).slice(0,5000);
 const loot=(Array.isArray(l)?l:[]).filter(x=>x&&usableId(x.id)&&typeof x.name==='string').slice(0,200);
 const targets=(Array.isArray(t?.targets)?t.targets:[]).filter(x=>x&&usableId(x.itemId)&&typeof x.character==='string').slice(0,1500);
 const farm=(Array.isArray(f?.sessions)?f.sessions:[]).filter(x=>x&&usableId(x.itemId)&&Number.isSafeInteger(x.attempts)&&x.attempts>0).slice(-500);
 const farmProfiles=Array.isArray(f?.characters)?f.characters:[],manualProfiles=Array.isArray(t?.characters)?t.characters:[];
 const profiles=[...new Map([...farmProfiles,...manualProfiles].filter(x=>x&&typeof x.region==='string'&&typeof x.realm==='string'&&typeof x.name==='string').map(x=>[x.region+'/'+x.realm+'/'+x.name,x])).values()].slice(0,80);
 const itemMap=new Map(atlas.map(x=>[rowKey(x.region,x.id),x])),lootMap=new Map(loot.map(x=>[Number(x.id),x]));
 const targetsWithDetails=targets.map(x=>({...x,source:itemMap.get(rowKey(x.region,x.itemId))||null,loot:lootMap.get(Number(x.itemId))||null})); 
 const atlasLootLinks=atlas.filter(x=>lootMap.has(Number(x.id)));
 const targetOrphans=targetsWithDetails.filter(x=>!x.source);
 const perCharacter=profiles.map(p=>{const id=p.region+'/'+p.realm+'/'+p.name,ownTargets=targetsWithDetails.filter(x=>x.character===id),sessions=farm.filter(x=>x.character===id);return{id,region:p.region,name:p.name,realm:p.realm,total:ownTargets.length,open:ownTargets.filter(x=>!x.done).length,done:ownTargets.filter(x=>x.done).length,attempts:sessions.reduce((n,x)=>n+x.attempts,0),sessions:sessions.length}});
 const pending=targetsWithDetails.filter(x=>!x.done).sort((a,b)=>({high:0,normal:1,later:2}[a.priority]??1)-({high:0,normal:1,later:2}[b.priority]??1));
 const contradictions=targetsWithDetails.filter(x=>!x.done&&x.source?.status==='owned');
 return {atlas,loot,targets:targetsWithDetails,farm,profiles,perCharacter,pending,atlasLootLinks,targetOrphans,contradictions,
  summary:{atlasTracked:atlas.length,atlasManualOwned:atlas.filter(x=>x.status==='owned').length,lootTracked:loot.length,lootManualDone:loot.filter(x=>Boolean(x.done)).length,targetsOpen:pending.length,targetsDone:targetsWithDetails.filter(x=>x.done).length,attempts:farm.reduce((n,x)=>n+x.attempts,0),sharedAtlasLoot:atlasLootLinks.length}};
}
const main=document.querySelector('.main'),nav=document.querySelector('.nav'),footer=main?.querySelector('.footer');if(!main||!nav||!footer)return;
const tab=document.createElement('button');tab.type='button';tab.dataset.view='command';tab.textContent='◈ Progress Command';nav.prepend(tab);
const host=document.createElement('div');host.id='progressCommand';
host.innerHTML='<section class="section" data-section="command"><div class="wow-kicker">NEXUS · CROSS-STUDIO PROGRESSION OPERATIONS</div><h2>Progress Command</h2><p class="muted">One overview of Item Atlas, Character Targets, Loot Hunter and Farming Operations. Everything shown here is browser-local and manually recorded. Open My Azeroth separately for signed-in Blizzard data; this page never reads private account tokens.</p><div class="pc-controls"><button id="pcRefresh" class="primary" type="button">REFRESH PROGRESS</button><button id="pcSnapshot" type="button">EXPORT READ-ONLY SUMMARY</button><button type="button" data-pc-jump="atlas">OPEN ITEM ATLAS</button><button type="button" data-pc-jump="targets">CHARACTER TARGETS</button></div><div id="pcMetrics" class="pc-metrics" aria-live="polite"></div><div class="pc-layout"><div class="panel"><h3>Character overview</h3><p class="hint">Character and assignment counts are manual; farming session totals are independent of Loot Hunter attempts.</p><div id="pcCharacters" class="pc-list"></div></div><div class="panel"><h3>Next objectives</h3><div class="pc-controls"><label>Character <select id="pcFilter"><option value="all">All characters</option></select></label><label>Priority <select id="pcPriority"><option value="all">All</option><option value="high">High</option><option value="normal">Normal</option><option value="later">Later</option></select></label></div><div id="pcObjectives" class="pc-list"></div><button type="button" id="pcMore">SHOW MORE OBJECTIVES</button></div></div><div class="panel"><h3>Planning discrepancies</h3><p class="hint">These are suggestions to review, never automatic corrections or proof of item ownership.</p><div id="pcInsights" class="pc-list"></div></div><p id="pcStatus" class="hint" role="status" aria-live="polite">Read-only view. Other studios are never modified by refreshing or exporting this summary.</p><div class="notice">These records are not live Blizzard data. Owned and complete statuses are manual; an item may be shared between different characters, and a gear check does not prove account-wide item ownership.</div></section>';
main.insertBefore(host,footer);
let data=snapshot(),shown=25,filter='all',priority='all';
const small=x=>Math.max(0,Number(x)||0);
function metric(label,n){return '<div><strong>'+small(n)+'</strong><span>'+h(label)+'</span></div>'}
function render(){
 data=snapshot();
 const s=data.summary;
 $('pcMetrics').innerHTML=[metric('Saved items',s.atlasTracked),metric('Manual owned',s.atlasManualOwned),metric('Loot goals',s.lootTracked),metric('Open targets',s.targetsOpen),metric('Finished targets',s.targetsDone),metric('Session attempts',s.attempts)].join('');
 const old=$('pcFilter').value||filter;
 const keys=new Set(data.perCharacter.map(x=>x.id));
 filter=keys.has(old)?old:'all';
 $('pcFilter').innerHTML='<option value="all">All characters</option>'+data.perCharacter.map(x=>'<option value="'+h(x.id)+'" '+(filter===x.id?'selected':'')+'>'+h(x.name+' · '+x.realm)+'</option>').join('');
 $('pcCharacters').innerHTML=data.perCharacter.length?data.perCharacter.map(x=>'<div class="pc-record"><div><strong>'+h(x.name)+'</strong><small>'+h(x.realm)+' · '+h(x.region.toUpperCase())+'</small></div><div class="pc-numbers">'+x.open+' open · '+x.done+' complete · '+x.attempts+' session attempts</div></div>').join(''):'<div class="empty">No saved characters. Add a character in Farming Operations or Character Targets.</div>';
 const matching=data.pending.filter(x=>(filter==='all'||x.character===filter)&&(priority==='all'||x.priority===priority));
 const byKey=new Map(data.perCharacter.map(x=>[x.id,x]));
 $('pcObjectives').innerHTML=matching.length?matching.slice(0,shown).map(x=>'<div class="pc-record"><div><strong>'+h(x.source?.name||'Item #'+x.itemId)+'</strong><small>'+h(byKey.get(x.character)?.name||x.character)+' · #'+x.itemId+' · '+h(x.priority||'normal')+' priority</small></div><button type="button" data-pc-jump="targets">OPEN TARGET</button></div>').join(''):'<div class="empty">No matching open targets. Use Character Targets to assign items and set priorities.</div>';
 $('pcMore').hidden=matching.length<=shown;
 const insights=[];
 if(data.targetOrphans.length)insights.push(data.targetOrphans.length+' character assignment(s) reference an item that is no longer saved in Item Atlas; manually review before changing anything.');
 if(data.contradictions.length)insights.push(data.contradictions.length+' open assignment(s) reference an item marked manually owned in Item Atlas. Character-specific needs can differ; review the intended goal.');
 if(data.atlasLootLinks.length)insights.push(data.atlasLootLinks.length+' Item Atlas item(s) also appear in Loot Hunter. Their progress remains independent.');
 if(!data.profiles.length)insights.push('Start by saving a character in Farming Operations or Character Targets.');
 if(!insights.length)insights.push('No obvious cross-studio conflicts detected in the locally saved records.');
 $('pcInsights').innerHTML=insights.map(x=>'<div class="pc-record">'+h(x)+'</div>').join('');
 $('pcStatus').textContent='Summary refreshed from this browser · '+new Date().toLocaleTimeString()+'. No private account data accessed.';
}
$('pcRefresh').addEventListener('click',render);
$('pcMore').addEventListener('click',()=>{shown=Math.min(1500,shown+25);render()});
$('pcFilter').addEventListener('change',e=>{filter=e.target.value;shown=25;render()});
$('pcPriority').addEventListener('change',e=>{priority=e.target.value;shown=25;render()});
host.addEventListener('click',e=>{const target=e.target.closest('[data-pc-jump]');if(!target)return;document.querySelector('[data-view="'+target.dataset.pcJump+'"]')?.click()});
$('pcSnapshot').addEventListener('click',()=>{
 const d=snapshot(),payload={format:'nexus-azeroth-progress-summary-v1',generatedAt:new Date().toISOString(),readOnly:true,source:'Browser-local manual planning records; NOT Blizzard verified',summary:d.summary,characters:d.perCharacter,review:{assignmentsMissingFromAtlas:d.targetOrphans.length,atlasOwnedWithOpenTargets:d.contradictions.length,sharedAtlasAndLoot:d.atlasLootLinks.length}};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='nexus-azeroth-progress-summary.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
});
window.addEventListener('storage',e=>{if(Object.values(IDS).includes(e.key))render()});
window.addEventListener('nexus:loot-updated',()=>render());
render();
})();

;/* BUNDLE SOURCE: loot-hunter.js */
/* Azeroth Companion v2.2 Loot Hunter — manual player progress, sourced acquisition guides */
(()=>{'use strict';
const KEY='nexus_azeroth_loot_hunter_v1',WISH='nexus_azeroth_connected_v2';
const $=id=>document.getElementById(id),h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid=id=>/^[1-9][0-9]{0,9}$/.test(String(id));
let catalog=[],goals=[];
try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(x))goals=x.filter(g=>g&&valid(g.id)&&typeof g.name==='string').slice(0,200)}catch(_){}
const main=document.querySelector('.main'),foot=main?.querySelector('.footer'),nav=document.querySelector('.nav');if(!main||!foot||!nav)return;
const b=document.createElement('button');b.dataset.view='loot';b.type='button';b.textContent='⚔ Loot Hunter';nav.appendChild(b);
const host=document.createElement('div');host.id='lootHunter';host.innerHTML="<section class=\"section\" data-section=\"loot\"><div class=\"wow-kicker\">CURATED ACQUISITION GUIDES · RETAIL COLLECTIBLES</div><h2>Loot Hunter</h2><p class=\"muted\">Research documented sources and track farming goals. This is an independent reference catalog, not drop-location data supplied by Blizzard. Progress and attempts are manual.</p><div class=\"loot-metrics\"><div><strong id=\"lootTotal\">0</strong><span>Tracked goals</span></div><div><strong id=\"lootOpen\">0</strong><span>Still farming</span></div><div><strong id=\"lootAttempts\">0</strong><span>Attempts logged</span></div></div><div class=\"grid\"><div class=\"panel\"><h3>Verified reference library</h3><div class=\"field\"><label for=\"lootSearch\">Item name or ID</label><input id=\"lootSearch\" maxlength=\"100\" placeholder=\"Thunderfury, Invincible...\"></div><div id=\"lootCatalog\" class=\"loot-list\"></div></div><form class=\"panel\" id=\"lootAddForm\"><h3>Add a farming goal</h3><div class=\"field\"><label for=\"lootId\">Blizzard item ID</label><input id=\"lootId\" inputmode=\"numeric\" required maxlength=\"10\" placeholder=\"19019\"></div><div class=\"field\"><label for=\"lootName\">Item name</label><input id=\"lootName\" maxlength=\"140\" required placeholder=\"Enter a name\"></div><div class=\"field\"><label for=\"lootNotes\">Personal notes</label><textarea id=\"lootNotes\" maxlength=\"1200\" placeholder=\"Boss, route, character, difficulty...\"></textarea></div><button class=\"primary\" type=\"submit\">ADD TO FARM BOARD</button><div class=\"actions\"><button type=\"button\" id=\"lootWish\">IMPORT MY ITEM WISHLIST</button></div><p class=\"hint\">Uncatalogued items remain marked unverified, even when imported from the Blizzard Item Codex.</p></form></div><div class=\"panel loot-panel\"><div class=\"top\"><h3>My Farm Board</h3><div class=\"actions\"><button id=\"lootExport\" type=\"button\">EXPORT PLAN</button><label class=\"wow-file\">IMPORT PLAN<input id=\"lootImport\" type=\"file\" accept=\".json,application/json\"></label></div></div><div class=\"loot-toolbar\"><label for=\"lootFilter\">Filter</label><select id=\"lootFilter\"><option value=\"all\">All</option><option value=\"open\">Still farming</option><option value=\"done\">Obtained</option></select></div><div id=\"lootBoard\" class=\"loot-list\"></div></div><div id=\"lootFeedback\" class=\"loot-feedback\" role=\"status\" aria-live=\"polite\"></div><div class=\"notice loot-panel\">Acquisition guides are third-party references and may change by patch. Confirm availability, difficulty and lockouts in-game. Loot attempts and completion are never automatically read from your account.</div></section>";main.insertBefore(host,foot);
const guide=id=>catalog.find(x=>x.id===Number(id));
function report(s){$('lootFeedback').textContent=s}
function store(){try{localStorage.setItem(KEY,JSON.stringify(goals))}catch(_){report('Browser storage full. Export a backup.')}render();window.dispatchEvent(new CustomEvent('nexus:loot-updated',{detail:{count:goals.length}}))}
function add(id,name,notes){if(!valid(id))return report('Invalid item ID.');id=Number(id);if(goals.some(g=>Number(g.id)===id))return report('Already tracking this item.');if(goals.length>=200)return report('Maximum 200 goals reached.');goals.unshift({id,name:String(name||'Item #'+id).slice(0,140),notes:String(notes||'').slice(0,1200),attempts:0,done:false,steps:[]});store();report('Farming goal added.')}
function renderCatalog(){const q=$('lootSearch').value.trim().toLowerCase();$('lootCatalog').innerHTML=catalog.filter(x=>!q||x.name.toLowerCase().includes(q)||String(x.id).includes(q)||x.area.toLowerCase().includes(q)).map(x=>'<div class="loot-entry"><div><strong>'+h(x.name)+'</strong><small>#'+x.id+' · '+h(x.kind)+'</small><p>'+h(x.source)+'</p><a href="'+h(x.guide)+'" rel="noopener noreferrer" target="_blank">Verified reference ↗</a></div><button type="button" data-loot-add="'+x.id+'">TRACK</button></div>').join('')||'<div class="empty">No matching curated source; you can still add a manual goal.</div>'}
function render(){
 $('lootTotal').textContent=goals.length;$('lootOpen').textContent=goals.filter(g=>!g.done).length;$('lootAttempts').textContent=goals.reduce((sum,g)=>sum+Math.max(0,Number(g.attempts)||0),0);
 const filter=$('lootFilter').value;
 $('lootBoard').innerHTML=goals.filter(g=>filter==='all'||(filter==='done'?g.done:!g.done)).map(g=>{
 const s=guide(g.id),id=Number(g.id),n=Math.max(0,Number(g.attempts)||0),source=s?'<span class="loot-known">Documented source</span> '+h(s.source)+' · <a href="'+h(s.guide)+'" rel="noopener noreferrer" target="_blank">Source guide ↗</a>':'<span class="loot-unknown">Source not verified</span> Consult a current guide and add your notes.';
 const checklist=s?'<details><summary>Acquisition steps</summary><ol>'+s.steps.map((step,i)=>'<li><label><input type="checkbox" data-loot-step="'+id+'" data-loot-step-index="'+i+'" '+(Array.isArray(g.steps)&&g.steps.includes(i)?'checked':'')+'> '+h(step)+'</label></li>').join('')+'</ol></details>':'';
 return '<div class="loot-goal"><div class="loot-head"><div><strong>'+h(g.name)+'</strong><small>Item #'+id+' · '+(g.done?'Obtained':'Still farming')+'</small></div><button type="button" data-loot-remove="'+id+'">REMOVE</button></div><p class="loot-source">'+source+'</p>'+checklist+'<div class="loot-actions"><button type="button" data-loot-attempt="'+id+'">+ LOG ATTEMPT</button><span>'+n+' attempts</span><button type="button" data-loot-done="'+id+'">'+(g.done?'MARK FARMING':'MARK OBTAINED')+'</button><button type="button" data-loot-inspect="'+id+'">INSPECT ITEM</button></div><label class="loot-notes">Personal notes<textarea maxlength="1200" data-loot-note="'+id+'">'+h(g.notes||'')+'</textarea></label></div>';
 }).join('')||'<div class="empty">No goals matching this filter.</div>';
}
window.addEventListener('nexus:loot-track',e=>{
 const raw=e.detail||{},id=raw.id;
 if(!valid(id)||Number(id)>9999999999)return;
 const name=String(raw.name||'Item #'+id).trim().slice(0,140);
 const note=String(raw.note||'Tracked from Armory / Item Codex').slice(0,1200);
 if(goals.some(g=>Number(g.id)===Number(id))){report('Already on your farm board: '+name);return}
 add(id,name,note);
});
$('lootSearch').addEventListener('input',renderCatalog);$('lootFilter').addEventListener('change',render);
$('lootAddForm').addEventListener('submit',e=>{e.preventDefault();add($('lootId').value,$('lootName').value.trim(),$('lootNotes').value.trim());e.target.reset()});
$('lootWish').addEventListener('click',()=>{try{const data=JSON.parse(localStorage.getItem(WISH)||'null');const wishlist=Array.isArray(data?.wishlist)?data.wishlist:[];let n=0;for(const x of wishlist){if(valid(x.id)&&goals.length<200&&!goals.some(g=>Number(g.id)===Number(x.id))){goals.push({id:Number(x.id),name:String(x.name||'Item #'+x.id).slice(0,140),notes:'Imported from Item Codex wishlist',attempts:0,done:false,steps:[]});n++}}store();report(n+' item goals imported.')}catch(_){report('Could not import wishlist.')}});
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-loot-add],[data-loot-remove],[data-loot-attempt],[data-loot-done],[data-loot-inspect]');if(!el)return;
 const id=el.dataset.lootAdd||el.dataset.lootRemove||el.dataset.lootAttempt||el.dataset.lootDone||el.dataset.lootInspect;if(!valid(id))return;
 if(el.dataset.lootAdd){const s=guide(id);if(s)add(s.id,s.name,'');return}
 if(el.dataset.lootInspect){const tab=document.querySelector('[data-view="codex"]');if(tab&&$('cxItemId')&&$('cxItemForm')){tab.click();$('cxItemId').value=id;$('cxItemForm').requestSubmit()}return}
 const g=goals.find(x=>Number(x.id)===Number(id));if(!g)return;
 if(el.dataset.lootRemove){if(confirm('Remove this farming goal?')){goals=goals.filter(x=>Number(x.id)!==Number(id));store()}return}
 if(el.dataset.lootAttempt)g.attempts=Math.min(999999,Math.max(0,Number(g.attempts)||0)+1);
 if(el.dataset.lootDone)g.done=!g.done;
 store();
});
document.addEventListener('change',e=>{
 if(e.target.dataset.lootStep){const id=e.target.dataset.lootStep,i=Number(e.target.dataset.lootStepIndex),g=goals.find(x=>Number(x.id)===Number(id)),s=guide(id);if(g&&s&&Number.isSafeInteger(i)&&i>=0&&i<s.steps.length){g.steps=Array.isArray(g.steps)?g.steps:[];g.steps=e.target.checked?[...new Set([...g.steps,i])]:g.steps.filter(x=>x!==i);store()}}
 if(e.target.dataset.lootNote){const g=goals.find(x=>Number(x.id)===Number(e.target.dataset.lootNote));if(g){g.notes=e.target.value.slice(0,1200);store()}}
});
function download(){const url=URL.createObjectURL(new Blob([JSON.stringify({format:'nexus-azeroth-loot-v1',exportedAt:new Date().toISOString(),goals},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='nexus-azeroth-loot-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
$('lootExport').addEventListener('click',download);
$('lootImport').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>1000000)throw Error('File exceeds limit');const x=JSON.parse(await file.text());if(x.format!=='nexus-azeroth-loot-v1'||!Array.isArray(x.goals)||x.goals.length>200)throw Error('Incompatible backup');const clean=[];for(const g of x.goals){if(!valid(g.id)||typeof g.name!=='string'||g.name.length>140||typeof g.notes!=='string'||g.notes.length>1200||!Number.isSafeInteger(g.attempts)||g.attempts<0||g.attempts>999999||!Array.isArray(g.steps)||g.steps.length>50)throw Error('Invalid goal record');if(!clean.some(v=>v.id===Number(g.id)))clean.push({id:Number(g.id),name:g.name,notes:g.notes,attempts:g.attempts,done:g.done===true,steps:g.steps.filter(Number.isSafeInteger)})}if(confirm('Replace your current loot plan?')){goals=clean;store();report('Loot plan imported.')}}catch(err){report('Import failed: '+err.message)}e.target.value=''});
fetch('./loot-sources.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('source unavailable');return r.json()}).then(data=>{catalog=Array.isArray(data.items)?data.items.filter(x=>Number.isSafeInteger(x.id)&&typeof x.name==='string'&&Array.isArray(x.steps)&&/^https:\/\/(www\.)?(wowhead\.com|warcraft\.wiki\.gg)\//.test(x.guide)):[];renderCatalog()}).catch(()=>{catalog=[];renderCatalog();report('Reference library is unavailable; manual goal tracking still works.')});
render();
})();

;/* BUNDLE SOURCE: armory-bridge-core.js */
/* Azeroth Companion v2.8 - shared, pure item/character normalization. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.NexusArmoryBridgeCore=api;})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const regions=['us','eu','kr','tw'];
 function item(raw){const id=Number(raw?.id);if(!Number.isSafeInteger(id)||id<=0||id>9999999999)return null;const name=String(raw?.name||('Item #'+id)).trim().slice(0,140);const region=regions.includes(raw?.region)?raw.region:'us';return{id,name:name||'Item #'+id,region}}
 function profile(raw){const region=regions.includes(raw?.region)?raw.region:'us',realm=String(raw?.realm||'').toLowerCase().trim(),name=String(raw?.name||'').toLowerCase().trim();if(!/^[a-z0-9-]{2,80}$/.test(realm)||!/^[a-z0-9-]{2,50}$/.test(name))return null;return{region,realm,name}}
 function addProfile(list,entry){const p=profile(entry);if(!p)return Array.isArray(list)?list.slice(0,20):[];return[p,...(Array.isArray(list)?list:[]).map(profile).filter(x=>x&&!(x.region===p.region&&x.realm===p.realm&&x.name===p.name))].slice(0,20)}
 function collectGoals(raw){if(!Array.isArray(raw))return[];return raw.filter(g=>g&&Number.isSafeInteger(Number(g.id))&&Number(g.id)>0).map(g=>({id:Number(g.id),done:g.done===true,attempts:Number.isSafeInteger(g.attempts)?Math.max(0,g.attempts):0})).slice(0,200)}
 function summary(wishlist,goals){const items=Array.isArray(wishlist)?wishlist:[],tracked=collectGoals(goals),trackedIds=new Set(tracked.map(g=>g.id));return{wishlisted:items.length,tracked:tracked.length,farming:tracked.filter(g=>!g.done).length,obtained:tracked.filter(g=>g.done).length,untrackedWishlist:items.filter(x=>item(x)&&!trackedIds.has(Number(x.id))).length}}
 return{item,profile,addProfile,summary};
});


;/* BUNDLE SOURCE: armory-loot-bridge.js */
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


;/* BUNDLE SOURCE: farming-operations.js */
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

;/* BUNDLE SOURCE: personal-azeroth.js */
/* NEXUS | AZEROTH COMPANION v3 — optional first-party Battle.net account portal entry.
 * Browser-local public companion data remains separate and unchanged.
 */
(()=>{'use strict';
const worker='https://nexus-azeroth-api.zevromxr.workers.dev';
const main=document.querySelector('.main'),nav=document.querySelector('.nav'),foot=main?.querySelector('.footer');if(!main||!nav||!foot)return;
const btn=document.createElement('button');btn.type='button';btn.dataset.view='personal';btn.textContent='✦ My Azeroth';nav.prepend(btn);
const host=document.createElement('div');host.id='personalAzerothLink';
host.innerHTML='<section class="section" data-section="personal"><div class="wow-kicker">YOUR WORLD OF WARCRAFT ACCOUNT · OPTIONAL</div><h2>My Azeroth</h2><p class="muted">A secure read-only Battle.net account portal for your own characters and collections. Your existing public Armory, Talent Forge and Loot Hunter remain available without connecting.</p><div class="panel"><h3>Connect securely through Blizzard</h3><p class="muted">Your sign-in opens on the companion\'s Cloudflare Worker domain, not inside this GitHub Pages website. This avoids third-party login cookies being blocked by iPhone Safari. You grant Blizzard\'s <strong>wow.profile</strong> scope and can disconnect at any time.</p><div class="actions"><a class="button primary" id="paOpen" rel="noopener noreferrer" href="'+worker+'/account">OPEN SECURE MY AZEROTH PORTAL</a><a class="button" target="_blank" rel="noopener noreferrer" href="'+worker+'/account/privacy">PRIVACY &amp; SECURITY</a></div><p id="paStatus" role="status" class="hint">The account portal requires the v3 Cloudflare Worker deployment and one additional encrypted session secret.</p></div><div class="panel"><h3>What will sync?</h3><p class="muted">The signed-in portal can show Blizzard-reported account characters and collection counts (mounts and pets). Blizzard data is periodically updated, not a live feed. Personal farming attempts, weekly Vault objectives, inventory management and talent imports are still manual, and no account data is copied into the public companion automatically.</p></div></section>';
main.insertBefore(host,foot);
const params=new URLSearchParams(location.search);
const region=params.get('armory_region'),realm=params.get('armory_realm'),name=params.get('armory_name');
if(region&&realm&&name&&['us','eu','kr','tw'].includes(region)&&/^[a-z0-9-]{2,80}$/.test(realm)&&/^[a-z0-9-]{2,50}$/.test(name)){
 const form=document.getElementById('cxCharacterForm'),tab=document.querySelector('[data-view="armory"]');
 if(form&&tab){document.getElementById('cxCharacterRegion').value=region;document.getElementById('cxRealm').value=realm;document.getElementById('cxName').value=name;tab.click();form.requestSubmit()}
}
})();

;/* BUNDLE SOURCE: talent-layout.js */
/* NEXUS Azeroth Companion — collision-safe tree layout.
 * Preserve Blizzard's valid coordinates when possible.
 * Reposition colliding nodes and append missing-coordinate nodes.
 * Layout is visual only and never implies talent eligibility.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.NexusTalentLayout=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function arrange(nodes,columns=14){
  const source=Array.isArray(nodes)?nodes:[];
  const count=Math.max(1,Math.min(24,Math.floor(columns)||14));
  const locations={},occupied=new Set();
  const placed=new Set();
  const valid=n=>Number.isInteger(n?.display_row)&&Number.isInteger(n?.display_col)&&n.display_row>=0&&n.display_col>=0&&n.display_col<count&&n.display_row<=69;
  const positioned=source.filter(valid).sort((a,b)=>a.display_row-b.display_row||a.display_col-b.display_col||Number(a.id)-Number(b.id));
  let maxOriginal=-1,adjusted=0;
  for(const node of positioned)maxOriginal=Math.max(maxOriginal,node.display_row);
  function store(n,row,col,reason){
   const id=Number(n.id);if(!Number.isSafeInteger(id)||id<=0||placed.has(id))return;
   const key=row+':'+col;
   occupied.add(key);placed.add(id);
   locations[id]={row:row+1,col:col+1,adjusted:Boolean(reason),reason:reason||''};
   if(reason)adjusted++;
  }
  // Place each unique valid original coordinate first, so collisions do not
  // dislodge another node with an authoritative distinct coordinate.
  for(const node of positioned){
   const key=node.display_row+':'+node.display_col;
   if(!occupied.has(key))store(node,node.display_row,node.display_col,'');
  }
  for(const node of positioned){
   const id=Number(node.id);if(placed.has(id))continue;
   const preferred=node.display_col;
   let row=node.display_row,col=preferred;
   let found=false;
   for(let offset=0;offset<Math.max(1,source.length+count);offset++){
    const r=row+Math.floor(offset/count);
    for(let d=0;d<count;d++){
     const c=(preferred+d)%count;
     if(!occupied.has(r+':'+c)){row=r;col=c;found=true;break}
    }
    if(found)break;
   }
   if(found)store(node,row,col,'Blizzard position overlaps another node');
  }
  let fallbackRow=Math.max(0,maxOriginal+1);
  for(const node of source){
   const id=Number(node?.id);if(!Number.isSafeInteger(id)||id<=0||placed.has(id))continue;
   let row=fallbackRow,col=0;
   while(occupied.has(row+':'+col)){col++;if(col>=count){col=0;row++}}
   store(node,row,col,'Blizzard position missing or outside supported grid');
   fallbackRow=row;
  }
  return{locations,adjusted,total:placed.size,columns:count};
 }
 return{arrange};
});

