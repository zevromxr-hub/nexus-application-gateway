/* NEXUS | AZEROTH v7.9.5 — read-only character handoff.
 * This bridge does not modify Battle.net auth, profile data, or local saves.
 * Inputs are prefilled from explicit same-site links; never auto-fetch.
 */
(()=>{'use strict';
const ROOT='./';
const allowedRegions=new Set(['us','eu','kr','tw']);
const check=(s,max)=>typeof s==='string'&&s.length>=2&&s.length<=max&&/^[a-z0-9-]+$/i.test(s);
const params=new URLSearchParams(location.search);
const isProgression=/\/progression-intelligence\.html$/.test(location.pathname);
const isComparison=/\/character-intelligence\.html$/.test(location.pathname);
if(!isProgression&&!isComparison)return;
const form=document.getElementById('form');if(!form)return;
const field=name=>form.elements.namedItem(name);
const get=name=>String(field(name)?.value||'').trim().toLowerCase();
function values(){const suffix=isComparison?'A':'';return {region:get('region'+suffix),realm:get('realm'+suffix),character:get(isComparison?'nameA':'character')}}
function valid(x){return allowedRegions.has(x.region)&&check(x.realm,80)&&check(x.character,50)}
function urlFor(file,x,category){const u=new URL(ROOT+file,location.href);u.searchParams.set('region',x.region);u.searchParams.set('realm',x.realm);u.searchParams.set('character',x.character);if(file==='progression-intelligence.html'&&['mythic','raids','reputations'].includes(category))u.searchParams.set('tab',category);return u.href}
const container=document.createElement('div');
container.id='nxCharacterBridge';
container.setAttribute('aria-label','Character research navigation');
container.style.cssText='border:1px solid #89ddd04d;border-radius:13px;padding:15px;background:#193447bb;margin:14px 0;display:grid;gap:10px';
const headline=document.createElement('strong');headline.textContent='CHARACTER RESEARCH SHORTCUTS';headline.style.cssText='color:#e9c68f;letter-spacing:.06em;font-size:13px';
const desc=document.createElement('p');desc.textContent='Reuse the character selected above across research studios. These shortcuts never sign you in, send saved plans, or load a profile automatically.';desc.style.cssText='font-size:12px;color:#bed1dc;margin:0';
const actions=document.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
const note=document.createElement('p');note.id='nxCharacterBridgeStatus';note.style.cssText='font-size:12px;color:#c1dae3;margin:0';note.setAttribute('role','status');
function button(label,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='padding:10px 12px;border:1px solid #b3caa777;border-radius:9px;background:#213b51;color:#f0efdd;cursor:pointer';b.addEventListener('click',action);actions.append(b);return b}
function openTarget(file,tab){const x=values();if(!valid(x)){note.textContent='Enter a valid region, realm slug, and character name above before switching studios.';return}location.assign(urlFor(file,x,tab))}
if(isComparison){button('OPEN MYTHIC+',()=>openTarget('progression-intelligence.html','mythic'));button('OPEN RAIDS',()=>openTarget('progression-intelligence.html','raids'));button('OPEN REPUTATIONS',()=>openTarget('progression-intelligence.html','reputations'))}
if(isProgression)button('COMPARE THIS CHARACTER',()=>openTarget('character-intelligence.html'));
button('COPY RESEARCH LINK',async()=>{const x=values();if(!valid(x)){note.textContent='Enter valid character details first.';return}
const link=urlFor(isComparison?'character-intelligence.html':'progression-intelligence.html',x,isProgression?document.querySelector('[data-tab][aria-selected="true"]')?.dataset.tab:'');
try{await navigator.clipboard.writeText(link);note.textContent='Research link copied. It includes public character names only; never account tokens.'}
catch(_){note.textContent='Clipboard unavailable. Copy this URL from the address bar after opening the matching studio.'}});
container.append(headline,desc,actions,note);
const anchor=form.closest('section.panel')||form;
anchor.insertAdjacentElement('afterend',container);
function fillFromLink(){const region=params.get('region'),realm=params.get('realm'),character=params.get('character');if(!region&&!realm&&!character)return;
const x={region:String(region||'').toLowerCase(),realm:String(realm||'').toLowerCase(),character:String(character||'').toLowerCase()};
if(!valid(x)){note.textContent='Link contains incomplete or invalid public character details; please enter them manually.';return}
const suffix=isComparison?'A':'';const a=field('region'+suffix),b=field('realm'+suffix),c=field(isComparison?'nameA':'character');if(a&&b&&c){a.value=x.region;b.value=x.realm;c.value=x.character;note.textContent='Public character details copied from the link. Select Load to request Blizzard data.'}
if(isProgression){const tab=params.get('tab');if(['mythic','raids','reputations'].includes(tab)){const b=document.querySelector('[data-tab="'+tab+'"]');b?.click()}}}
fillFromLink();
})();