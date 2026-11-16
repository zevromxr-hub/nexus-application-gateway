/* NEXUS | AZEROTH v7.7 — Application Integrity.
 * Read-only DOM diagnostics. No network calls, no storage writes, no
 * destructive repair, no changes to user records or gameplay calculations.
 */
(()=>{'use strict';
const data=document.querySelector('[data-section="data"]'),nav=document.querySelector('.sidebar .nav');
if(!data||!nav||document.getElementById('nxIntegrityCenter'))return;
const panel=document.createElement('section');
panel.id='nxIntegrityCenter';panel.className='nx-integrity panel';
panel.innerHTML='<div class="nx-integrity-head"><div><span class="wow-kicker">NEXUS / APPLICATION INTEGRITY</span><h3>Integrity & Player Testing</h3><p>Inspect this browser\'s interface wiring without resetting data or contacting the game service. These checks cannot certify live gameplay or API functionality.</p></div><span class="nx-integrity-tag">READ-ONLY</span></div>'+
'<div class="nx-integrity-actions"><button id="nxIntegrityRun" type="button">RUN LOCAL CHECKS</button><a href="./player-test-checklist.html" target="_blank" rel="noopener">OPEN PLAYER TEST CHECKLIST</a><a href="./getting-started.html">GETTING STARTED</a></div>'+
'<div id="nxIntegritySummary" class="nx-integrity-summary" role="status" aria-live="polite">Checks have not been run. Open this panel when you want to inspect the current interface.</div>'+
'<div id="nxIntegrityResults" class="nx-integrity-results"></div><p class="nx-integrity-foot">For local records, use the original Data & Backup and Sovereign Data Vault tools. No backup files, local data, login credentials or media contents are inspected by this diagnostic.</p>';
data.append(panel);
const el=id=>document.getElementById(id);
function entry(label,pass,detail){
 const row=document.createElement('div');row.className='nx-integrity-result';
 const status=document.createElement('strong');status.textContent=(pass?'PASS':'REVIEW')+' · '+label;
 status.className=pass?'nx-integrity-pass':'nx-integrity-review';
 const explanation=document.createElement('small');explanation.textContent=detail;
 row.append(status,explanation);return row;
}
function run(){
 const checks=[],buttons=[...nav.querySelectorAll('button[data-view]')];
 const ids=new Map();
 for(const node of document.querySelectorAll('[id]')){
  const id=node.id;if(!id)continue;ids.set(id,(ids.get(id)||0)+1)
 }
 const dup=[...ids.entries()].filter(([,count])=>count>1).map(([id])=>id);
 checks.push(['Unique element IDs',dup.length===0,dup.length?'Review duplicate IDs: '+dup.slice(0,7).join(', ')+(dup.length>7?'…':''):'No duplicate element IDs found in the current page']);
 const routes=[...new Set(buttons.map(b=>b.dataset.view).filter(Boolean))];
 const missing=routes.filter(view=>!document.querySelector('[data-section="'+view+'"]'));
 checks.push(['Studio navigation targets',missing.length===0,missing.length?'Unmatched routes: '+missing.join(', '):routes.length+' sidebar routes have matching content sections']);
 const retired=buttons.filter(b=>b.dataset.nxRetired==='true');
 const visible=retired.filter(b=>!b.hidden&&!b.matches('[aria-hidden="true"]'));
 checks.push(['Retired studio visibility',visible.length===0,retired.length+' archived routes detected; '+visible.length+' unexpectedly visible']);
 const required=[['Live Armory','cxCharacterForm'],['Item Codex','cxItemForm'],['Talent Forge','talentForge'],['Equipment Intelligence','nxCharacterIntelligence'],['Data & Backup','nxIntegrityCenter']];
 for(const [label,id] of required){const found=!!el(id);checks.push([label+' interface',found,found?'Required DOM element available':'Could not find '+id+' in the current page'])}
 const music=!!el('nxMusicOpen')&&!!el('nxHyperMusic');
 checks.push(['Music launcher wiring',music,music?'Existing music opener and HYPER MUSIC button present':'One or more music controls are unavailable']);
 const ok=checks.filter(x=>x[1]).length;
 el('nxIntegritySummary').textContent=ok+' of '+checks.length+' local interface checks passed. These checks report structure only; test live Blizzard requests separately.';
 const result=el('nxIntegrityResults');result.replaceChildren();
 const fragment=document.createDocumentFragment();
 for(const c of checks)fragment.append(entry(...c));
 result.append(fragment);
}
el('nxIntegrityRun').addEventListener('click',run);
})();