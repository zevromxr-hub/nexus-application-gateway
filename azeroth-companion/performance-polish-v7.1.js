/* NEXUS | AZEROTH v7.1.2 — Safe image pipeline polish.
 * Does NOT touch media URLs, <video>, <audio>, IndexedDB, existing storage,
 * API calls, Talent Forge data, or player controls.
 * Uses native browser lazy loading / async decoding for noncritical images.
 */
(()=>{'use strict';
const root=document.querySelector('main.main');
if(!root)return;
let adjusted=0,observer=null;
const optimized=new WeakSet();
const critical=img=>{
 // Keep header images, active first-viewport media and user-selected backgrounds immediate.
 if(img.closest('.top,.hero,#nxMusicDock,.sidebar'))return true;
 const section=img.closest('[data-section]');
 if(section&&!section.classList.contains('active'))return false;
 const rect=img.getBoundingClientRect();
 return rect.top<innerHeight+180&&rect.bottom>=-100;
};
function optimize(img){
 if(!(img instanceof HTMLImageElement)||optimized.has(img))return;
 optimized.add(img);
 // Never override intentional eager/lazy hints from an existing studio.
 if(!img.hasAttribute('decoding'))img.decoding='async';
 if(!critical(img)){
  if(!img.hasAttribute('loading'))img.loading='lazy';
  if(!img.hasAttribute('fetchpriority'))img.setAttribute('fetchpriority','low');
  adjusted++;
 }
}
function optimizeSubtree(node){
 if(node.nodeType!==1)return;
 if(node.matches?.('img'))optimize(node);
 for(const img of node.querySelectorAll?.('img')||[])optimize(img);
}
optimizeSubtree(root);
if('MutationObserver'in window){
 observer=new MutationObserver(records=>{
  // Only inspect added DOM, never rescan all talent nodes after each mutation.
  for(const record of records)for(const node of record.addedNodes)optimizeSubtree(node);
 });
 observer.observe(root,{childList:true,subtree:true});
}
window.NexusImagePipeline=Object.freeze({
 version:'7.1.2',
 // A small non-sensitive diagnostic useful when checking mobile performance.
 get lazyImagesPrepared(){return adjusted}
});
})();
