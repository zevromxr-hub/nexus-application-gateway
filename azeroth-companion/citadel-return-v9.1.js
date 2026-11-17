/* NEXUS | AZEROTH v9.1 — app view resume metadata, stored only in a new key.
 * No Blizzard credentials or original user saves accessed or modified.
 */
(()=>{'use strict';
const key='nexus_citadel_recent_view_v91';
const safe=s=>typeof s==='string'&&/^[a-z0-9-]{2,30}$/.test(s);
function find(view){if(!safe(view))return null;return [...document.querySelectorAll('.sidebar [data-view]')].find(el=>el.dataset.view===view)||null}
function remember(view){const btn=find(view);if(!btn)return;const label=(btn.textContent||view).replace(/\s+/g,' ').trim().slice(0,80);try{localStorage.setItem(key,JSON.stringify({view,label}))}catch(_){}}
document.addEventListener('nexus:view-activated',event=>remember(event.detail?.view));
function restore(){const q=new URLSearchParams(location.search);const view=q.get('view');const btn=find(view);if(btn)btn.click()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restore,{once:true});else restore();
})();