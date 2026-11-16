/* NEXUS | AZEROTH v5.9 — Final Talent Tree Visual Pass.
 * Source-backed talent images, accessible tree focus and better search previews.
 * Media requests are GET-only, bounded, lazy and never infer missing spell IDs.
 */
(()=>{
'use strict';
const cmd=document.getElementById('tfCommand'),tree=document.getElementById('tfTree'),bridge=window.NexusTalentSourceBridge;
if(!cmd||!tree||!bridge||document.getElementById('nxTreeFinalControls'))return;
const API='https://nexus-azeroth-api.zevromxr.workers.dev',cache=new Map(),waiting=[],pending=new Map();let inFlight=0,scheduled=false,thumbObserver=null;
const el=id=>document.getElementById(id),validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<=9999999999;
function safeURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname==='worldofwarcraft.com'||u.hostname.endsWith('.worldofwarcraft.com'))?u.href:''}catch(_){return ''}}
function getMedia(region,id,done){
 if(!validId(id)||!['us','eu','kr','tw'].includes(region))return done('');
 const key=region+':'+id;
 if(cache.has(key))return done(cache.get(key));
 if(pending.has(key)){pending.get(key).push(done);return}
 pending.set(key,[done]);waiting.push({key,region,id});drain();
}
function drain(){
 while(inFlight<3&&waiting.length){
  const job=waiting.shift();inFlight++;
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),9000);
  fetch(API+'/api/spell-media/'+job.region+'/'+job.id,{headers:{Accept:'application/json'},credentials:'omit',cache:'no-store',signal:ctrl.signal})
  .then(r=>r.ok?r.json():null).then(body=>safeURL(body?.data?.assets?.find(a=>a?.key==='icon')?.url))
  .catch(()=> '').then(url=>{
   cache.set(job.key,url||'');if(cache.size>300)cache.delete(cache.keys().next().value);
   const callbacks=pending.get(job.key)||[];pending.delete(job.key);callbacks.forEach(fn=>fn(url||''));
  }).finally(()=>{clearTimeout(timeout);inFlight--;drain()});
 }
}
function mediaImage(host,id,region,slotClass){
 if(!host||!validId(id)||host.querySelector('.'+slotClass))return;
 const slot=document.createElement('span');slot.className=slotClass;slot.textContent='✧';slot.setAttribute('aria-hidden','true');
 host.prepend(slot);
 const load=()=>getMedia(region,id,url=>{
  if(!slot.isConnected||!url)return;
  const img=document.createElement('img');img.src=url;img.alt='';img.decoding='async';img.loading='lazy';img.referrerPolicy='no-referrer';
  img.onerror=()=>{if(slot.isConnected)slot.textContent='✧'};
  slot.replaceChildren(img);
 });
 if(slotClass==='nx-skill-thumb'&&typeof IntersectionObserver==='function'){
  if(!thumbObserver)thumbObserver=new IntersectionObserver(entries=>{
   for(const e of entries)if(e.isIntersecting){thumbObserver.unobserve(e.target);e.target._nxLoad?.();delete e.target._nxLoad}
  },{root:el('tfCmdList'),rootMargin:'120px'});
  slot._nxLoad=load;thumbObserver.observe(slot);
 }else load();
}
function refresh(){
 const s=bridge.snapshot();if(!s.ready)return;
 const byId=new Map(s.catalog.map(x=>[String(x.id),x]));
 let limit=0;
 for(const button of document.querySelectorAll('#tfCmdList [data-tf-cmd-node]')){
  if(++limit>90)break;
  const node=byId.get(button.dataset.tfCmdNode);if(node?.spellId)mediaImage(button,node.spellId,s.region,'nx-skill-thumb');
 }
 for(const side of ['A','B']){
  const scenarioNode=byId.get(el('tfVaNode'+side)?.value);
  const detail=el('tfVaDetail'+side);
  if(detail&&scenarioNode?.spellId)mediaImage(detail,scenarioNode.spellId,s.region,'nx-skill-hero');
  const researchId=el('tfLabTalent'+side)?.value;
  const result=document.querySelectorAll('#tfLabTalentResults .tf-lab-card')[side==='A'?0:1];
  const lab=s.nodes.find(n=>String(n.id)===researchId);
  const rank=Number(el('tfLabRank'+side)?.value)||1;
  const spell=lab?.ranks?.[rank-1]?.choices?.[lab.choice||0]?.spellId||byId.get(researchId)?.spellId;
  if(result&&spell)mediaImage(result,spell,s.region,'nx-skill-hero');
 }
 for(const card of tree.querySelectorAll('[data-tf-node]')){
  const n=byId.get(card.dataset.tfNode);if(!n)continue;
  const label='Official source node #'+n.id+' · '+n.max+' returned rank(s)'+(n.summary?' · '+n.summary.replace(/<[^>]*>/g,'').slice(0,160):'');
  if(card.getAttribute('aria-label')!==label)card.setAttribute('aria-label',label);
 }
}
const tools=document.createElement('div');tools.id='nxTreeFinalControls';tools.className='nx-finale-controls';
tools.innerHTML='<div><span class="wow-kicker">NEXUS / FINAL TREE WORKSPACE</span><strong>Tree Focus & Skill Previews</strong><p>Browse source-backed skill art in search results, inspect official rank information and give the tree more room when planning. Nothing here changes your saved builds.</p></div><div class="nx-finale-actions"><button id="nxTreeFocus" type="button" aria-pressed="false">FOCUS TREE</button><button id="nxTreeJump" type="button">GO TO TALENT TREE</button><button id="nxTreeFull" type="button">ALL RESEARCH PANELS</button></div>';
cmd.querySelector('.tf-cmd-head')?.after(tools);
let focused=false;
function focus(on){
 focused=Boolean(on);
 const section=document.querySelector('#talentForge [data-section="talents"]');
 section?.classList.toggle('nx-tree-focused',focused);
 el('nxTreeFocus').textContent=focused?'EXIT FOCUS':'FOCUS TREE';
 el('nxTreeFocus').setAttribute('aria-pressed',String(focused));
 if(focused)tree.scrollIntoView({behavior:'smooth',block:'center'});
}
el('nxTreeFocus').addEventListener('click',()=>focus(!focused));
el('nxTreeFull').addEventListener('click',()=>focus(false));
el('nxTreeJump').addEventListener('click',()=>tree.scrollIntoView({behavior:'smooth',block:'center'}));
const containers=['tfCmdList','tfTree','tfLabTalentResults','tfVaDetailA','tfVaDetailB'];
const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.target?.id==='tfCmdList'))thumbObserver?.disconnect();if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh()})});
for(const id of containers){const host=el(id);if(host)observer.observe(host,{childList:true})}
for(const id of ['tfVaNodeA','tfVaNodeB','tfLabTalentA','tfLabTalentB','tfLabRankA','tfLabRankB'])el(id)?.addEventListener('change',()=>requestAnimationFrame(refresh));
refresh();
})();
