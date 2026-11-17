/* NEXUS | AZEROTH v15 — SAFE CHARACTER → TALENT FORGE HANDOFF
 * Only recent, explicitly initiated same-origin session context.
 * Exact unique official specialization match only. No automatic tree load, ranks,
 * saved draft import or Blizzard account/ownership claims.
 */
(()=>{'use strict';
const root=document.getElementById('nx13Forge'),region=document.getElementById('tfRegion'),
 spec=document.getElementById('tfSpec');
if(!root||!region||!spec||document.getElementById('nx15ForgeContext'))return;
let raw=null;try{raw=sessionStorage.getItem('nexus_character_nexus_forge_launch_v15')}catch(_){}
if(!raw)return;
let ctx;try{ctx=JSON.parse(raw)}catch(_){return}
const valid=x=>x&&typeof x==='object'&&typeof x.charId==='string'&&x.charId.length<=145&&
 typeof x.name==='string'&&x.name.length<=70&&
 typeof x.issuedAt==='number'&&Date.now()-x.issuedAt>=0&&Date.now()-x.issuedAt<10*60*1000;
if(!valid(ctx))return;
try{sessionStorage.removeItem('nexus_character_nexus_forge_launch_v15')}catch(_){}
const card=document.createElement('div');card.id='nx15ForgeContext';card.className='nx15-forge-handoff';
card.innerHTML='<div><span>CHARACTER NEXUS / CONTEXT RECEIVED · v15</span><strong id="nx15ForgeCharacter"></strong><p id="nx15ForgeContextStatus"></p></div><a href="./player-experience.html">RETURN TO MY CHARACTER ↗</a>';
const hero=root.querySelector('.nx13-hero');
if(hero)hero.after(card);else root.prepend(card);
document.getElementById('nx15ForgeCharacter').textContent=ctx.name||'Local character';
const status=document.getElementById('nx15ForgeContextStatus');
const clean=x=>typeof x==='string'?x.trim().toLowerCase().replace(/\s+/g,' '):'';
let awaiting=false,observer=null,completed=false;
function exactMatch(){
 if(completed)return;
 const target=clean(ctx.spec);if(!target){
  status.textContent='Local character context loaded. No manual specialization was supplied; choose a Blizzard specialization before loading.';
  completed=true;observer?.disconnect();return;
 }
 const options=[...spec.options].filter(o=>o.value!==''&&o.textContent.trim()).map(o=>({
  item:o,name:clean(o.textContent.replace(/\s*\(ID \d+\)\s*$/i,''))
 }));
 const matches=options.filter(x=>x.name===target);
 if(!options.length)return;
 if(matches.length===1){
  spec.value=matches[0].item.value;spec.dispatchEvent(new Event('change',{bubbles:true}));
  status.textContent='Manual specialization "'+ctx.spec+'" matched one Blizzard index entry and was selected. Press LOAD OFFICIAL TREE to continue; nothing was auto-allocated.';
 }else if(matches.length>1){
  status.textContent='This specialization name matches multiple official entries. Select the correct class/specialization manually, then load the tree.';
 }else status.textContent='No exact specialization match in the official index. Select the appropriate entry manually.';
 completed=true;observer?.disconnect();
}
const regionSet=['us','eu','kr','tw'].includes(ctx.region);
if(regionSet&&region.value!==ctx.region){region.value=ctx.region;region.dispatchEvent(new Event('change',{bubbles:true}))}
status.textContent='Character '+ctx.name+' · '+(ctx.className||'manual class unspecified')+' · '+
 (ctx.spec||'specialization not selected')+' · '+(regionSet?ctx.region.toUpperCase():'choose a region')+
 '. Waiting for official specialization index. No live account ownership is asserted.';
observer=new MutationObserver(exactMatch);observer.observe(spec,{childList:true});
exactMatch();
setTimeout(()=>{if(!completed){observer?.disconnect();status.textContent+=' Index not ready. Choose your specialization manually after it loads.'}},12000);
})();