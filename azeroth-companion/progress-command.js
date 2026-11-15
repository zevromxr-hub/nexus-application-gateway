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
const refreshVisible=()=>{if(document.querySelector('[data-section="command"].active'))render()};
window.addEventListener('storage',e=>{if(Object.values(IDS).includes(e.key))refreshVisible()});
window.addEventListener('nexus:loot-updated',refreshVisible);
if(window.NexusStartup?.whenView)window.NexusStartup.whenView('command',render,{once:false});else render();
})();