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