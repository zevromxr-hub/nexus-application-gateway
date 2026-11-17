/* NEXUS | AZEROTH COMPANION v13.2 — ICON ASCENSION
 * Exact Blizzard spell-media IDs from the original TalentSourceBridge only.
 * No guesses by talent name/node ID, no new storage keys or credentials.
 * All rank edits and saves remain owned by the original Forge.
 */
(()=>{'use strict';
const root=document.getElementById('nx13Forge'),tree=document.getElementById('nx13Tree');
const native=document.getElementById('tfTree'),inspector=document.getElementById('nx13Inspector');
const bridge=window.NexusTalentSourceBridge;
if(!root||!tree||!native||!inspector||!bridge||document.getElementById('nx132IconStatus'))return;
const API='https://nexus-azeroth-api.zevromxr.workers.dev';
const $=id=>document.getElementById(id);
const validId=v=>Number.isSafeInteger(Number(v))&&Number(v)>0&&Number(v)<=9999999999?Number(v):null;
const cache=new Map(),queued=new Set(),queue=[];
let loading=0,enabled=true,selectedId=null,identity='',timer=0,displayed=0,failCount=0,observer=null;
const getSnapshot=()=>{try{return bridge.snapshot()}catch(_){return null}};
const status=document.createElement('span');status.id='nx132IconStatus';status.className='nx132-icon-status';
status.textContent='BLIZZARD ICONS · Waiting for official talent data';
const head=root.querySelector('.nx13-centerhead');
if(head)head.append(status);
function acceptable(url){
 try{
  const u=new URL(url,location.href),host=u.hostname.toLowerCase();
  return u.protocol==='https:'&&(
   host==='worldofwarcraft.com'||host.endsWith('.worldofwarcraft.com')||
   host==='battle.net'||host.endsWith('.battle.net')||
   host==='blizzard.com'||host.endsWith('.blizzard.com')
  )?u.href:null;
 }catch(_){return null}
}
function sourceSpell(node,s){
 if(!node||!s)return null;
 const choices=node.ranks||[];
 const rank=Math.max(0,Math.min(choices.length-1,Number(s.allocations?.[String(node.id)]||0)-1));
 const preferred=Number(s.choiceByNode?.[String(node.id)]??node.choice??0);
 const selection=Number.isInteger(preferred)&&preferred>=0?preferred:0;
 // Prefer the currently chosen rank/choice; fall back only to the same choice in other ranks.
 const ordered=choices.length?[choices[rank],...choices.filter((_,i)=>i!==rank)]:[];
 for(const r of ordered){const list=Array.isArray(r?.choices)?r.choices:[];const entry=list[selection]||null;const spell=validId(entry?.spellId);if(spell)return spell}
 // A single-choice node can safely use its first reported source spell ID.
 if(selection===0&&choices.length===0){
  const catalog=s.catalog?.find(c=>Number(c.id)===Number(node.id));
  return validId(catalog?.spellId);
 }
 return null;
}
function descriptor(id,s){
 const node=s?.nodes?.find(n=>Number(n.id)===Number(id));
 if(!node)return null;
 const spellId=sourceSpell(node,s);
 if(!spellId||!['us','eu','kr','tw'].includes(s.region))return null;
 return {nodeId:Number(node.id),spellId,region:s.region,name:String(node.name||'Talent').slice(0,120),key:s.region+':'+spellId};
}
function nativeIcon(desc){
 const holder=native.querySelector('[data-tf-node="'+desc.nodeId+'"] .tf-spell-art img');
 return holder?acceptable(holder.getAttribute('src')||holder.src):null;
}
function imageFor(desc){
 const cached=cache.get(desc.key);
 if(cached&&typeof cached==='string')return cached;
 // The original Forge already maps spell IDs to media where it has loaded them.
 return nativeIcon(desc);
}
function fallback(slot,kind){
 if(!slot)return;
 const child=slot.querySelector('img.nx132-official-icon');
 if(child)child.remove();
 slot.classList.remove('nx132-has-icon');
 if(!slot.textContent.trim())slot.textContent=kind==='node'?'✦':'✧';
}
function setImage(slot,desc,kind){
 if(!slot)return;
 const url=imageFor(desc);
 if(!url){fallback(slot,kind);slot.dataset.nx132Key=desc.key;return}
 const existing=slot.querySelector('img.nx132-official-icon');
 if(existing?.getAttribute('src')===url){slot.dataset.nx132Key=desc.key;return}
 const img=document.createElement('img');
 img.className='nx132-official-icon';
 img.src=url;img.alt='';
 img.loading=kind==='node'?'lazy':'eager';img.decoding='async';img.referrerPolicy='no-referrer';
 img.addEventListener('error',()=>{
  if(cache.get(desc.key)===url)cache.set(desc.key,null);
  if(img.isConnected){slot.replaceChildren(document.createTextNode('✦'));slot.classList.remove('nx132-has-icon')}
  updateStatus();
 },{once:true});
 slot.replaceChildren(img);slot.classList.add('nx132-has-icon');
 slot.dataset.nx132Key=desc.key;
}
function updateStatus(){
 if(!status)return;
 const items=[...cache.values()].filter(x=>typeof x==='string'&&x).length;
 if(!enabled){status.textContent='BLIZZARD ICONS · Media endpoint unavailable; original-source artwork used where available';return}
 status.textContent='BLIZZARD ICONS · '+items+' source icon'+(items===1?'':'s')+' cached'+(loading?' · loading':'');
}
function enqueue(desc,priority=false){
 if(!desc||!enabled||cache.has(desc.key)||queued.has(desc.key))return;
 const record={region:desc.region,spellId:desc.spellId,key:desc.key};
 queued.add(desc.key);
 if(priority)queue.unshift(record);else queue.push(record);
 pump();
}
async function getOfficialIcon(record){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9500);
 try{
  const response=await fetch(API+'/api/spell-media/'+record.region+'/'+record.spellId,{
   credentials:'omit',headers:{Accept:'application/json'},cache:'force-cache',signal:controller.signal
  });
  if(!response.ok){const error=new Error('Media response '+response.status);error.status=response.status;throw error}
  const payload=await response.json(),data=payload?.data;
  if(payload?.success===false)throw Error('Media endpoint rejected request');
  const assets=Array.isArray(data?.assets)?data.assets:[];
  const hit=assets.find(a=>a?.key==='icon'&&typeof a.url==='string');
  return acceptable(hit?.url||'');
 }finally{clearTimeout(timeout)}
}
function pump(){
 while(enabled&&loading<3&&queue.length){
  const item=queue.shift();queued.delete(item.key);
  if(cache.has(item.key))continue;
  loading++;
  getOfficialIcon(item).then(url=>{
   cache.set(item.key,url||null);failCount=0;
  }).catch(error=>{
   cache.set(item.key,null);
   failCount++;
   // A missing Worker endpoint should never produce a wall of failed calls.
   if(error?.status===401||error?.status===403||error?.status===429||failCount>=7){
    enabled=false;queue.length=0;queued.clear();
   }
  }).finally(()=>{
   loading--;syncVisible();updateStatus();pump();
  });
 }
 updateStatus();
}
function ensureTrayIcon(){
 const copy=$('nx131Tray')?.querySelector('.nx131-tray-copy');
 if(!copy)return null;
 let slot=copy.querySelector('.nx132-tray-icon');
 if(slot)return slot;
 const text=document.createElement('div');text.className='nx132-tray-text';
 while(copy.firstChild)text.append(copy.firstChild);
 slot=document.createElement('span');slot.className='nx132-tray-icon';slot.setAttribute('aria-hidden','true');slot.textContent='✦';
 copy.append(slot,text);
 return slot;
}
const traySlot=ensureTrayIcon();
function paintSelection(s){
 if(!s?.ready||selectedId===null)return;
 const desc=descriptor(selectedId,s);
 if(!desc)return;
 const art=inspector.querySelector('.nx13-inspector-art');
 if(art){setImage(art,desc,'inspector');enqueue(desc,true)}
 if(traySlot){setImage(traySlot,desc,'tray');enqueue(desc,true)}
}
function markCard(card,s){
 const id=validId(card.dataset.node);
 const desc=descriptor(id,s);
 const slot=card.querySelector('.nx13-node-icon');
 if(!desc||!slot){if(slot)fallback(slot,'node');return}
 setImage(slot,desc,'node');
}
function syncVisible(){
 const s=getSnapshot();
 if(!s?.ready)return;
 const visible=tree.querySelectorAll('.nx13-node[data-node]');
 for(const card of visible)markCard(card,s);
 paintSelection(s);
}
function observeNodes(){
 if(observer){observer.disconnect();observer=null}
 const s=getSnapshot();
 if(!s?.ready)return;
 const cards=[...tree.querySelectorAll('.nx13-node[data-node]')];
 if(typeof IntersectionObserver!=='function'){
  for(const card of cards.slice(0,18)){const desc=descriptor(card.dataset.node,s);markCard(card,s);enqueue(desc)}
  return;
 }
 const scroller=root.querySelector('.nx13-scroll');
 observer=new IntersectionObserver(entries=>{
  const current=getSnapshot();
  if(!current?.ready)return;
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   const desc=descriptor(entry.target.dataset.node,current);
   markCard(entry.target,current);
   enqueue(desc);
   observer?.unobserve(entry.target);
  }
 },{root:scroller||null,rootMargin:'200px'});
 for(const card of cards)observer.observe(card);
 // Reuse media already fetched for earlier tree rerenders without waiting for viewport activation.
 syncVisible();
}
function update(){
 const s=getSnapshot();
 if(!s?.ready){status.textContent='BLIZZARD ICONS · Load an official specialization';return}
 if(s.identity!==identity){
  identity=s.identity;queue.length=0;queued.clear();selectedId=null;
 }
 observeNodes();paintSelection(s);
}
function schedule(){
 if(timer)return;
 timer=setTimeout(()=>{timer=0;update()},95);
}
tree.addEventListener('click',event=>{
 const b=event.target.closest('button[data-select],button[data-rank]');
 if(!b)return;
 const id=validId(b.dataset.select||b.dataset.id);
 if(!id)return;
 selectedId=id;
 const s=getSnapshot(),desc=descriptor(id,s);
 if(desc)enqueue(desc,true);
 setTimeout(()=>paintSelection(getSnapshot()),0);
},false);
const inspectorObs=new MutationObserver(()=>{
 if(!selectedId)return;
 const s=getSnapshot(),desc=descriptor(selectedId,s);
 if(!desc)return;
 const art=inspector.querySelector('.nx13-inspector-art');
 if(art&&art.dataset.nx132Key!==desc.key){setImage(art,desc,'inspector');enqueue(desc,true)}
});
inspectorObs.observe(inspector,{childList:true,subtree:false});
const treeObs=new MutationObserver(mutations=>{
 // The core Forge recreates node cards when allocations or active category change.
 if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&
  (n.classList?.contains('nx13-grid')||n.querySelector?.('.nx13-grid')))))schedule();
});
treeObs.observe(tree,{childList:true});
native.addEventListener('load',event=>{
 if(event.target?.matches?.('.tf-spell-art img'))schedule();
},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
document.addEventListener('nexus:view-activated',event=>{if(event.detail?.view==='talents')schedule()});
update();
})();