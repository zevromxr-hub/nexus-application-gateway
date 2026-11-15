/* NEXUS | AZEROTH v4.2 — Player Field Lab.
 * Private, browser-local acceptance checklist and manual character readiness insights.
 * No account/character names, private Blizzard records, tokens or session proofs
 * in the exported report. Notes are opt-in and must be reviewed before sharing.
 */
(()=>{'use strict';
const nav=document.querySelector('.sidebar .nav'),main=document.querySelector('.main'),footer=main?.querySelector('.footer');if(!nav||!main||!footer)return;
const KEY='nexus_azeroth_player_fieldlab_v42',MAX_NOTE=400;
const checks=[
 ['Navigation and layout','Use the site on PC or iPhone. Open and close All Tools, visit several studios and confirm no buttons or text are cut off.','guide'],
 ['First-time guide','Open Information & Guide, complete at least two onboarding steps and use the tool links.','guide'],
 ['Battle.net sign-in','Visit My Azeroth and sign in through Blizzard. Do not enter credentials anywhere except the Blizzard-controlled login.','personal'],
 ['Verified connection','Choose Verify & Return. Confirm the green badge appears on the main site; it should eventually expire and not become permanently green.','dashboard'],
 ['Character roster','Check My Azeroth for any characters Blizzard returns. An account with no WoW data should show an understandable empty state.','personal'],
 ['Character research','Use a real character region, realm and name in the public Armory. Check that results and API errors are presented clearly.','armory'],
 ['Items and Loot Hunter','Look up a valid item in Codex or Atlas. Save a manual target and inspect the corresponding Loot Hunter tools.','atlas'],
 ['Personal planners','Add a manual character target or farming entry and confirm the Character Dashboard displays the saved information.','targets'],
 ['Talent and party tools','Load a Retail specialization in Talent Forge, explore nodes and prepare a party plan. Do not treat drafts as game-valid exports.','talents'],
 ['Backup and restore safety','Export selected modules in Sovereign Data Vault. Review a backup preview; perform a restore only if comfortable and after preserving another copy.','vault'],
 ['Release information','Open Information & Guide and compare the companion release number with Release Center. Read the game compatibility limitations.','releases'],
 ['Returning session','Refresh the site and revisit your local planner data. Verify the interface behaves correctly if the two-minute account proof has expired.','dashboard']
];
const states={untested:'Not tested',passed:'Passed',issue:'Issue found',blocked:'Blocked'};
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&#39;':'&#39;'}[c]));
let data={records:{}};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&saved.records&&typeof saved.records==='object')data.records=saved.records}catch(_){}
function write(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(_){message('Cannot save local test notes. Export your report before closing the page.')}} 
function message(t){$('pflMessage').textContent=t}
const b=document.createElement('button');b.type='button';b.dataset.view='fieldlab';b.textContent='⌁ Player Field Lab';nav.append(b);
const host=document.createElement('div');host.id='playerFieldLab';
host.innerHTML='<section class="section" data-section="fieldlab">'+
 '<div class="wow-kicker">NEXUS / PLAYER FIELD LAB · v4.2</div><h2>Player Testing & Character Insights</h2>'+
 '<p class="muted">Test Azeroth with real gameplay, record what works and report issues without sharing Blizzard credentials. Personal notes remain in this browser until you choose to export them.</p>'+
 '<div class="pfl-status"><div><strong id="pflPassed">0 / 12</strong><span>Checks passed</span></div><div><strong id="pflIssues">0</strong><span>Issues discovered</span></div><div><strong id="pflBlocked">0</strong><span>Blocked checks</span></div><div><strong id="pflCoverage">0%</strong><span>Checks attempted</span></div></div>'+
 '<div class="pfl-columns"><article class="panel"><h3>Player test checklist</h3><p class="muted">Choose Passed, Issue found or Blocked for each step. You can test freely even without a WoW character.</p><div id="pflChecklist" class="pfl-checklist"></div></article>'+
 '<article class="panel"><h3>Privacy-safe feedback export</h3><p class="muted">Create a report for the developer or a Discord support thread. Statuses are included. Personal test notes are excluded by default.</p>'+
 '<label class="pfl-checkbox"><input id="pflNotes" type="checkbox">Include my written notes (review them for personal information first)</label>'+
 '<label class="pfl-checkbox"><input id="pflEnvironment" type="checkbox" checked>Include broad browser/device category</label>'+
 '<div class="pfl-buttons"><button class="primary" type="button" id="pflCopy">COPY REPORT</button><button type="button" id="pflDownload">DOWNLOAD REPORT</button><button type="button" id="pflClear">CLEAR TEST RESULTS</button></div>'+
 '<div class="pfl-preview"><strong>Report preview</strong><textarea id="pflReportPreview" rows="12" readonly aria-label="Privacy-safe report preview"></textarea></div><p class="hint">No report is sent automatically. The report never includes OAuth tokens, session tickets, saved character names or private Blizzard account data. Avoid typing secrets into notes.</p></article></div>'+
 '<section class="pfl-insights"><div class="wow-kicker">CHARACTER INTELLIGENCE / LOCAL PLANNER</div><h3>Planning Readiness</h3><p class="muted">An at-a-glance summary of goals on this device. Figures are based on manually entered planning data and are NOT Blizzard-confirmed equipment, level, achievement, or collection ownership.</p><div class="pfl-status" id="pflPlannerStats"></div><div id="pflPlannerState" class="pfl-insight-notice" role="status"></div><div class="pfl-buttons"><button type="button" data-pfl-go="dashboard">OPEN CHARACTER DASHBOARD</button><button type="button" data-pfl-go="targets">MANAGE TARGETS</button><button type="button" data-pfl-go="loot">OPEN FARMING</button><button type="button" data-pfl-go="vault">BACK UP PLANS</button><button type="button" id="pflRefresh">REFRESH INSIGHTS</button></div></section>'+
 '<p class="hint" id="pflMessage" role="status">Test results are saved locally. No connection to Discord is required to use this lab.</p></section>';
main.insertBefore(host,footer);
function record(i){const s=data.records[String(i)]||{};return{state:Object.hasOwn(states,s.state)?s.state:'untested',note:typeof s.note==='string'?s.note.slice(0,MAX_NOTE):''}}
function updateCounts(){
 const rows=checks.map((_,i)=>record(i)),count=s=>rows.filter(x=>x.state===s).length;
 $('pflPassed').textContent=count('passed')+' / '+checks.length;
 $('pflIssues').textContent=String(count('issue'));
 $('pflBlocked').textContent=String(count('blocked'));
 $('pflCoverage').textContent=Math.round(100*(checks.length-count('untested'))/checks.length)+'%';
}
function render(){
 $('pflChecklist').innerHTML=checks.map(([name,desc,view],i)=>{const r=record(i);
  return '<div class="pfl-check" data-pfl-check="'+i+'"><div class="pfl-check-head"><div><strong>'+String(i+1).padStart(2,'0')+' · '+esc(name)+'</strong><p>'+esc(desc)+'</p></div><button type="button" data-pfl-go="'+esc(view)+'">OPEN</button></div><label>Result<select data-pfl-state="'+i+'">'+Object.entries(states).map(([value,label])=>'<option value="'+value+'" '+(r.state===value?'selected':'')+'>'+esc(label)+'</option>').join('')+'</select></label><label class="pfl-note-label">Test notes (optional)<textarea data-pfl-note="'+i+'" maxlength="'+MAX_NOTE+'" rows="2" placeholder="What happened? Include steps to reproduce; never paste credentials.">'+esc(r.note)+'</textarea></label></div>';
 }).join('');
 updateCounts();refreshReport();
}
function category(){const ua=navigator.userAgent||'';const mobile=/iPhone|iPad|Android/i.test(ua);return mobile?'Mobile browser':'Desktop browser'}
function report(){
 const withNotes=$('pflNotes').checked,withEnv=$('pflEnvironment').checked;
 const lines=['NEXUS | AZEROTH — PLAYER TEST REPORT','Companion UI version: '+(document.querySelector('.main .top .chip')?.textContent?.match(/v\d+\.\d+(?:\.\d+)?/)?.[0]||'unavailable')+' (see Release Center for verified release metadata)','Created: '+new Date().toISOString().slice(0,10),'Report source: voluntary browser-local checklist'];
 if(withEnv)lines.push('Environment: '+category());
 lines.push('','Test results:');
 checks.forEach(([name],i)=>{const r=record(i);lines.push((i+1)+'. '+name+' — '+states[r.state]);if(withNotes&&r.note.trim())lines.push('   Note: '+r.note.trim().replace(/[\r\n]+/g,' ').slice(0,MAX_NOTE))});
 const total=checks.map((_,i)=>record(i).state),attempted=total.filter(x=>x!=='untested').length;
 lines.push('','Summary: '+total.filter(x=>x==='passed').length+'/'+checks.length+' passed; '+total.filter(x=>x==='issue').length+' issues; '+total.filter(x=>x==='blocked').length+' blocked; '+attempted+'/'+checks.length+' attempted.');
 lines.push('No Blizzard tokens, account IDs or private collection data are intentionally included. Review all optional notes before sharing.');
 return lines.join('\n');
}
function refreshReport(){$('pflReportPreview').value=report()}
host.addEventListener('change',e=>{
 const choice=e.target.closest('[data-pfl-state]');if(choice){const i=Number(choice.dataset.pflState);if(!Number.isInteger(i)||i<0||i>=checks.length)return;data.records[i]={...record(i),state:choice.value};write();updateCounts();refreshReport();return}
 if(e.target.closest('#pflNotes,#pflEnvironment'))refreshReport();
});
host.addEventListener('input',e=>{
 const note=e.target.closest('[data-pfl-note]');if(!note)return;
 const i=Number(note.dataset.pflNote);if(!Number.isInteger(i)||i<0||i>=checks.length)return;
 data.records[i]={...record(i),note:note.value.slice(0,MAX_NOTE)};write();if($('pflNotes').checked)refreshReport();
});
function jump(view){const btn=[...nav.querySelectorAll('button[data-view]')].find(x=>x.dataset.view===view);if(btn){btn.click();window.scrollTo({top:0,behavior:'instant'})}else message('This tool is not available on the current page.')}
host.addEventListener('click',e=>{const link=e.target.closest('[data-pfl-go]');if(link)jump(link.dataset.pflGo)});
$('pflCopy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(report());message('Report copied. Review it before sharing with anyone.')}
 catch(_){$('pflReportPreview').focus();$('pflReportPreview').select();message('Clipboard permission unavailable. Select and copy the preview manually.')}
});
$('pflDownload').addEventListener('click',()=>{
 const blob=new Blob([report()],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NEXUS-AZEROTH-PLAYER-TEST-'+new Date().toISOString().slice(0,10)+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 message('Text report downloaded locally. No report was sent to Discord or a remote server.');
});
$('pflClear').addEventListener('click',()=>{if(!confirm('Clear all local player-test statuses and notes? Your WoW planners and Battle.net connection will remain unchanged.'))return;data={records:{}};write();render();message('Player test results cleared. Other saved data was preserved.')});
function local(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function readiness(){
 const farm=local('nexus_azeroth_farm_operations_v1'),targets=local('nexus_azeroth_character_targets_v1'),atlas=local('nexus_azeroth_item_atlas_v1'),loot=local('nexus_azeroth_loot_hunter_v1');
 const profiles=[...(Array.isArray(farm?.characters)?farm.characters:[]),...(Array.isArray(targets?.characters)?targets.characters:[])];
 const ids=new Set(profiles.filter(x=>x&&['us','eu','kr','tw'].includes(x.region)&&typeof x.realm==='string'&&typeof x.name==='string').map(x=>x.region+'/'+x.realm+'/'+x.name));
 const goals=Array.isArray(targets?.targets)?targets.targets:[],sessions=Array.isArray(farm?.sessions)?farm.sessions:[];
 const total=goals.filter(x=>x&&Number.isSafeInteger(Number(x.itemId))&&Number(x.itemId)>0),open=total.filter(x=>!x.done);
 const own=Array.isArray(atlas)?atlas.filter(x=>x&&x.status==='owned').length:0;
 const lootGoals=Array.isArray(loot)?loot.filter(x=>x&&!x.done).length:0;
 const metrics=[['Saved characters',ids.size],['Open item targets',open.length],['Logged farm sessions',sessions.length],['Manual Atlas owned',own],['Open loot goals',lootGoals]];
 $('pflPlannerStats').innerHTML=metrics.map(([label,value])=>'<div><strong>'+value+'</strong><span>'+label+'</span></div>').join('');
 $('pflPlannerState').textContent=ids.size?'Planning data found for '+ids.size+' character profile(s). Your next action: review open targets or start a new farming session.':'No local character planning profiles found. Add a character in Character Targets or manually via Farming Operations. Battle.net sign-in is optional.';
}
$('pflRefresh').addEventListener('click',readiness);
window.addEventListener('pageshow',()=>{readiness();refreshReport()});
window.addEventListener('storage',e=>{if(['nexus_azeroth_farm_operations_v1','nexus_azeroth_character_targets_v1','nexus_azeroth_item_atlas_v1','nexus_azeroth_loot_hunter_v1'].includes(e.key))readiness()});
window.addEventListener('nexus:character-profile-updated',readiness);
const guide=document.querySelector('#pg-friends');if(guide){
 const shortcut=document.createElement('div');shortcut.className='pg-note';
 shortcut.textContent='Testing with friends? Record their results without sharing Battle.net secrets.';
 const open=document.createElement('button');open.type='button';open.dataset.pgNav='fieldlab';open.textContent='OPEN PLAYER FIELD LAB';
 shortcut.append(document.createTextNode(' '),open);guide.append(shortcut);
}
render();readiness();
})();