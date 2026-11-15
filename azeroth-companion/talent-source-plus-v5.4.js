/* NEXUS | AZEROTH COMPANION v5.4 — source-only talent media + comparative research.
 * Optional Blizzard spell media. No simulated DPS, invented icons or game-valid claims.
 */
(()=>{
 'use strict';
 const tree=document.getElementById('tfTree'),source=document.getElementById('tfSourceIntel'),bridge=window.NexusTalentSourceBridge;
 if(!tree||!source||!bridge||document.getElementById('tfCompareLab'))return;
 const API='https://nexus-azeroth-api.zevromxr.workers.dev';
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<=9999999999?Number(x):null;
 const lab=document.createElement('section');lab.id='tfCompareLab';lab.className='panel tf-compare-lab';
 lab.innerHTML='<div class="tf-lab-heading"><div><span class="wow-kicker">NEXUS / OFFICIAL DATA COMPARISON</span><h3>Talent & Gear Comparison Studio</h3><p>Compare Blizzard-returned rank descriptions, precise talent IDs, allocated points, and item properties. Numbers reflect source records only—not predicted combat performance.</p></div><span class="tf-lab-tag">SOURCE VERIFIED</span></div>'+
 '<div class="tf-lab-section"><h4>Talent side-by-side</h4><div class="tf-lab-controls"><label>Talent A<select id="tfLabTalentA"><option value="">Choose a talent</option></select></label><label>Rank<select id="tfLabRankA"></select></label><label>Talent B<select id="tfLabTalentB"><option value="">Choose a talent</option></select></label><label>Rank<select id="tfLabRankB"></select></label></div><div id="tfLabTalentResults" class="tf-lab-pair" role="status" aria-live="polite">Load a Blizzard tree to compare talents.</div></div>'+
 '<div class="tf-lab-section"><h4>Item properties & stat comparison</h4><form id="tfLabGearForm" class="tf-lab-controls tf-lab-gear"><label>Blizzard item ID A<input id="tfLabItemA" type="number" min="1" max="9999999999" step="1" inputmode="numeric" required placeholder="First item ID"></label><label>Blizzard item ID B<input id="tfLabItemB" type="number" min="1" max="9999999999" step="1" inputmode="numeric" required placeholder="Second item ID"></label><button type="submit">COMPARE ITEMS</button></form><div id="tfLabGearResults" class="tf-lab-results" role="status" aria-live="polite">Enter two official item IDs. Results are raw Blizzard records, not character-specific item evaluations.</div></div>'+
 '<p class="tf-lab-foot">Images are fetched only from official Blizzard spell-media records if the optional Cloudflare media route is available. Missing or incorrect media may occur in the upstream API; always check source IDs. No automatic best-in-slot ranking or talent legality is inferred.</p>';
 source.after(lab);
 const el=id=>document.getElementById(id);
 const mediaStatus=document.createElement('p');mediaStatus.className='tf-media-status';mediaStatus.id='tfMediaStatus';
 mediaStatus.textContent='Talent artwork: loads on demand from Blizzard spell media when available.';
 source.querySelector('.tf-source-head')?.append(mediaStatus);
 const iconCache=new Map();let inFlight=0,mediaRouteEnabled=true,observer=null,seenIdentity='',seenSignature='',schedule=false,requestKey=0;
 const mediaQueue=[],queued=new Set();
 function capture(){return bridge.snapshot()}
 function rankChoice(n,rank){
  const r=n?.ranks?.[Math.max(0,Math.min((n.ranks?.length||1)-1,Number(rank)-1))];
  return r?.choices?.[Math.max(0,Math.min((r?.choices?.length||1)-1,n?.choice||0))]||r?.choices?.[0]||null;
 }
 function iconKey(region,id){return region+':'+id}
 async function json(path){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),11000);
  try{
   const response=await fetch(API+path,{headers:{Accept:'application/json'},credentials:'omit',cache:'no-store',signal:controller.signal});
   const body=await response.json().catch(()=>null);
   if(!response.ok||!body||body.success===false)throw new Error('Source unavailable ('+response.status+')');
   return body.data;
  }finally{clearTimeout(timer)}
 }
 function drain(){
  while(mediaRouteEnabled&&inFlight<3&&mediaQueue.length){
   const entry=mediaQueue.shift();queued.delete(entry.key);
   if(iconCache.has(entry.key))continue;
   inFlight++;
   json('/api/spell-media/'+entry.region+'/'+entry.id).then(data=>{
    const asset=Array.isArray(data?.assets)?data.assets.find(a=>a?.key==='icon'&&typeof a.url==='string'&&/^https:\/\/[^\s"<>]+$/i.test(a.url)):null;
    iconCache.set(entry.key,asset?.url||'');
   }).catch(()=>{
    iconCache.set(entry.key,'');
    // A missing optional route should not produce dozens of repeated API requests.
    mediaRouteEnabled=false;mediaQueue.length=0;
    mediaStatus.textContent='Official spell artwork is unavailable. The talent planner and source comparisons remain fully functional; the Cloudflare spell-media route may need deployment.';
   }).finally(()=>{inFlight--;applyIcons();drain()});
  }
 }
 function queueIcon(region,id){const key=iconKey(region,id);if(!mediaRouteEnabled||iconCache.has(key)||queued.has(key))return;queued.add(key);mediaQueue.push({key,region,id});drain()}
 function applyIcons(){
  const s=capture();if(!s.ready)return;
  const byId=new Map(s.nodes.map(n=>[String(n.id),n]));
  for(const node of tree.querySelectorAll('[data-tf-node]')){
   const item=byId.get(node.dataset.tfNode);if(!item)continue;
   const spellId=rankChoice(item,Math.max(1,item.planned))?.spellId;
   const key=iconKey(s.region,spellId);
   let holder=node.querySelector('.tf-spell-art');
   if(!holder){
    holder=document.createElement('span');holder.className='tf-spell-art';holder.setAttribute('aria-hidden','true');holder.textContent='✧';
    const title=node.querySelector('strong');if(title)title.before(holder);
   }
   if(!spellId){holder.textContent='✧';continue}
   const image=iconCache.get(key);
   if(!image){if(holder.querySelector('img'))holder.replaceChildren();holder.textContent='✧';continue}
   if(holder.querySelector('img')?.src===image)continue;
   const img=document.createElement('img');img.src=image;img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
   img.addEventListener('error',()=>{iconCache.set(key,'');holder.textContent='✧';},{once:true});
   holder.replaceChildren(img);
  }
 }
 function decorate(){
  const s=capture();if(!s.ready||!s.nodes.length)return;
  if(s.identity!==seenIdentity){seenIdentity=s.identity;seenSignature='';mediaQueue.length=0;queued.clear();requestKey++; }
  applyIcons();
  if(observer)observer.disconnect();
  if(typeof IntersectionObserver==='function'&&mediaRouteEnabled){
   const byId=new Map(s.nodes.map(n=>[String(n.id),n]));
   observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
     if(!entry.isIntersecting)continue;
     const n=byId.get(entry.target.dataset.tfNode);const id=rankChoice(n,Math.max(1,n?.planned||0))?.spellId;
     if(id)queueIcon(s.region,id);
     observer?.unobserve(entry.target);
    }
   },{root:tree,rootMargin:'150px'});
   tree.querySelectorAll('[data-tf-node]').forEach(n=>observer.observe(n));
  }
  updateChoices(s);
 }
 function updateChoices(s){
  const signature=s.identity+'|'+s.active+'|'+s.nodes.map(n=>n.id).join(',');
  if(signature===seenSignature)return;
  seenSignature=signature;
  const opts='<option value="">Select talent</option>'+s.nodes.map(n=>'<option value="'+n.id+'">'+escape(n.name)+' · #'+n.id+'</option>').join('');
  for(const side of ['A','B']){
   const input=el('tfLabTalent'+side),before=input.value;input.innerHTML=opts;
   input.value=s.nodes.some(n=>String(n.id)===before)?before:'';
  }
  renderTalent();
 }
 function selected(side){const snap=capture();return snap.nodes.find(n=>String(n.id)===el('tfLabTalent'+side).value)||null}
 function renderRank(side,n){
  const select=el('tfLabRank'+side),before=select.value;
  select.innerHTML=n?.ranks?.map((r,i)=>'<option value="'+(i+1)+'">Rank '+(i+1)+'</option>').join('')||'<option value="">Unavailable</option>';
  if(n?.ranks?.some(r=>String(r.rank)===before))select.value=before;
  else if(n?.ranks?.length)select.value=String(Math.max(1,n.planned));
 }
 function talentCard(n,side){
  if(!n)return '<div class="tf-lab-card tf-lab-empty">Choose a talent to display Blizzard-returned details.</div>';
  const rank=Number(el('tfLabRank'+side).value)||1,t=rankChoice(n,rank);
  const id=t?.spellId,tid=t?.talentId;
  return '<div class="tf-lab-card"><strong>'+escape(t?.name||n.name)+'</strong><div class="tf-lab-metadata"><span>Node #'+n.id+'</span><span>Talent '+(tid?'#'+tid:'ID unavailable')+'</span><span>Spell '+(id?'#'+id:'ID unavailable')+'</span></div><div class="tf-lab-alloc">'+n.planned+' / '+n.max+' planned points · Viewing rank '+rank+'</div><p>'+escape(t?.description||'No description returned for this rank or choice.')+'</p></div>';
 }
 function renderTalent(){
  const a=selected('A'),b=selected('B');
  for(const [side,n]of [['A',a],['B',b]])renderRank(side,n);
  const area=el('tfLabTalentResults');area.innerHTML=talentCard(a,'A')+talentCard(b,'B')+
   (a&&b?'<p class="tf-lab-delta">Allocated point difference (A − B): <strong>'+ (a.planned-b.planned>0?'+':'')+(a.planned-b.planned)+'</strong>. This is a manual point-count comparison, not a gameplay performance difference.</p>':'');
 }
 for(const side of ['A','B']){
  el('tfLabTalent'+side).addEventListener('change',renderTalent);
  el('tfLabRank'+side).addEventListener('change',()=>{const n=selected(side);const a=selected('A'),b=selected('B');el('tfLabTalentResults').innerHTML=talentCard(a,'A')+talentCard(b,'B')+(a&&b?'<p class="tf-lab-delta">Allocated point difference (A − B): '+(a.planned-b.planned)+'</p>':'')});
 }
 const rows=item=>{
  const fields=[['Item level',item.level],['Required level',item.required_level],['Quality',item.quality?.name],['Item class',item.item_class?.name],['Subclass',item.item_subclass?.name],['Inventory type',item.inventory_type?.name]];
  return fields.filter(([,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>[k,String(v)]);
 };
 const stats=item=>{
  const output=new Map();
  for(const s of Array.isArray(item.preview_item?.stats)?item.preview_item.stats:[]){
   const name=s?.type?.name||s?.type?.type;
   if(typeof name==='string'&&name.trim()){
    const value=typeof s.value==='number'&&Number.isFinite(s.value)?s.value:null;
    output.set(name,{value,text:String(s.display?.display_string??value??'Not supplied')});
   }
  }
  return output;
 };
 function showGear(a,b){
  const factsA=new Map(rows(a)),factsB=new Map(rows(b)),sa=stats(a),sb=stats(b);
  const keys=[...new Set([...factsA.keys(),...factsB.keys(),...sa.keys(),...sb.keys()])];
  const fmt=(k,obj,facts,statMap)=>facts.has(k)?escape(facts.get(k)):statMap.has(k)?escape(statMap.get(k).text):'Not supplied';
  const lines=keys.map(k=>{
   const va=sa.get(k)?.value,vb=sb.get(k)?.value;
   const diff=typeof va==='number'&&typeof vb==='number'?'<small>Numeric stat A − B: '+(va-vb>0?'+':'')+(va-vb)+'</small>':'';
   return '<tr><th scope="row">'+escape(k)+'</th><td>'+fmt(k,a,factsA,sa)+'</td><td>'+fmt(k,b,factsB,sb)+diff+'</td></tr>';
  }).join('');
  el('tfLabGearResults').innerHTML='<div class="tf-lab-scroll"><table><thead><tr><th>Returned field</th><th>'+escape(a.name||'Item A')+' (#'+a.id+')</th><th>'+escape(b.name||'Item B')+' (#'+b.id+')</th></tr></thead><tbody>'+lines+'</tbody></table></div><p>Only stat values present in both responses receive a numeric difference. Item levels, bonuses, scaling, and character context can change actual results. No DPS or best-in-slot score is calculated.</p>';
 }
 el('tfLabGearForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const a=validId(el('tfLabItemA').value),b=validId(el('tfLabItemB').value),out=el('tfLabGearResults');
  if(!a||!b){out.textContent='Enter two valid positive Blizzard item IDs.';return}
  const region=capture().region||el('tfRegion')?.value||'us',token=++requestKey;
  out.textContent='Retrieving Blizzard item records for #'+a+' and #'+b+'…';
  try{
   const items=await Promise.all([a,b].map(id=>json('/api/item/'+region+'/'+id)));
   if(token!==requestKey)return;
   if(Number(items[0]?.id)!==a||Number(items[1]?.id)!==b)throw Error('Blizzard item IDs did not match the requested records');
   showGear(items[0],items[1]);
  }catch(error){if(token===requestKey)out.textContent='The comparison could not be completed: '+error.message+'. The existing gear lookup remains available above.'}
 });
 const mut=new MutationObserver(()=>{if(schedule)return;schedule=true;requestAnimationFrame(()=>{schedule=false;decorate()})});
 mut.observe(tree,{childList:true});
 document.getElementById('tfLayout')?.addEventListener('change',()=>{seenSignature='';requestAnimationFrame(decorate)});
 decorate();
})();
