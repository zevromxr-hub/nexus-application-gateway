/* NEXUS | AZEROTH v7.7.1 — Founder identity shortcut
 * Navigation-only UI. Reuses the existing verified crest and developer page;
 * no account permissions, data mutation, extra requests or audio changes.
 */
(()=>{'use strict';
if(document.getElementById('nxFounderBubble'))return;
const top=document.querySelector('main.main > .top')||document.querySelector('main.main .top');
if(!top)return;
const avatar=document.createElement('a');avatar.id='nxFounderBubble';avatar.className='nx-founder-bubble';
avatar.href='./developer.html';avatar.setAttribute('aria-label','Developer Identity — Founder');
avatar.title='Meet the founder behind NEXUS';
const art=document.createElement('span');art.className='nx-founder-art';
const img=document.createElement('img');img.src='./assets/zevro-music-crest.webp';img.alt='';img.width=64;img.height=64;img.decoding='async';
art.append(img);
const copy=document.createElement('span');copy.className='nx-founder-copy';
const title=document.createElement('strong');title.textContent='DEVELOPER';
const role=document.createElement('small');role.textContent='FOUNDER';
copy.append(title,role);avatar.append(art,copy);
document.body.append(avatar);
const mobile=matchMedia('(max-width: 800px)');
const slot=document.createElement('div');slot.id='nxFounderMobileSlot';slot.className='nx-founder-mobile-slot';
top.append(slot);
function position(){
 if(mobile.matches){if(avatar.parentElement!==slot)slot.append(avatar)}
 else if(avatar.parentElement!==document.body)document.body.append(avatar);
}
mobile.addEventListener?.('change',position);
position();
})();