/* NEXUS | AZEROTH v7.9.8 — floating contextual assistant.
 * No account access or saved-data mutations. Standalone guided assistant in iframe.
 */
(()=>{'use strict';
if(document.getElementById('nxAssistantLauncher'))return;
const top=document.querySelector('main.main > .top')||document.querySelector('main.main .top');
if(!top)return;
const mobile=matchMedia('(max-width: 800px)');
const avatar=document.createElement('button');avatar.type='button';avatar.id='nxAssistantLauncher';avatar.className='nx-assistant-launcher';avatar.setAttribute('aria-controls','nxAssistantDialog');avatar.setAttribute('aria-expanded','false');avatar.setAttribute('aria-haspopup','dialog');avatar.setAttribute('aria-label','Open ZevRo Azeroth Assistant');
const art=document.createElement('span');art.className='nx-assistant-avatar';art.setAttribute('aria-hidden','true');const pic=document.createElement('img');pic.src='./assets/nexus-warrior-favicon-48.png';pic.alt='';pic.width=42;pic.height=42;pic.decoding='async';pic.onerror=()=>{pic.remove();art.textContent='✦'};art.append(pic);
const copy=document.createElement('span');copy.className='nx-assistant-label';const title=document.createElement('strong');title.textContent='AZEROTH ASSISTANT';const sub=document.createElement('small');sub.textContent='ZevRo · ASK ME';copy.append(title,sub);avatar.append(art,copy);
const slot=document.createElement('div');slot.className='nx-assistant-mobile-slot';slot.id='nxAssistantMobileSlot';top.append(slot);
document.body.append(avatar);
const overlay=document.createElement('div');overlay.id='nxAssistantOverlay';overlay.className='nx-assistant-overlay';overlay.hidden=true;
const dialog=document.createElement('section');dialog.id='nxAssistantDialog';dialog.className='nx-assistant-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','nxAssistantDialogTitle');
const bar=document.createElement('div');bar.className='nx-assistant-dialog-bar';const head=document.createElement('strong');head.id='nxAssistantDialogTitle';head.textContent='ZevRo | Azeroth Assistant';
const full=document.createElement('a');full.href='./azeroth-assistant.html';full.textContent='FULL PAGE';full.className='nx-assistant-full';full.setAttribute('aria-label','Open full Azeroth Assistant page');
const close=document.createElement('button');close.type='button';close.id='nxAssistantClose';close.textContent='×';close.setAttribute('aria-label','Close Azeroth Assistant');
bar.append(head,full,close);
const frame=document.createElement('iframe');frame.id='nxAssistantFrame';frame.title='ZevRo Azeroth Assistant questions and answers';frame.loading='lazy';frame.setAttribute('referrerpolicy','same-origin');frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms');dialog.append(bar,frame);overlay.append(dialog);document.body.append(overlay);
let previouslyFocused=null,opened=false;
function context(){const active=document.querySelector('.section.active[data-section]');const key=active?.dataset.section||'';const lookup={builds:'Talent Forge',characters:'Public Armory',collections:'My Azeroth',progress:'Progression Intelligence',data:'Data & backups',overview:'Getting started'};return lookup[key]||''}
function place(){if(mobile.matches){if(avatar.parentElement!==slot)slot.append(avatar)}else if(avatar.parentElement!==document.body)document.body.append(avatar)}
function open(){if(opened)return;opened=true;previouslyFocused=document.activeElement;const u=new URL('./azeroth-assistant.html',location.href);u.searchParams.set('mini','1');const topic=context();if(topic)u.searchParams.set('topic',topic);frame.src=u.href;overlay.hidden=false;document.body.classList.add('nx-assistant-open');avatar.setAttribute('aria-expanded','true');close.focus()}
function shut(){if(!opened)return;opened=false;overlay.hidden=true;document.body.classList.remove('nx-assistant-open');avatar.setAttribute('aria-expanded','false');frame.removeAttribute('src');if(previouslyFocused?.isConnected)previouslyFocused.focus();else avatar.focus()}
avatar.addEventListener('click',()=>opened?shut():open());close.addEventListener('click',shut);
overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)shut()});
document.addEventListener('keydown',e=>{if(!opened)return;if(e.key==='Escape'){e.preventDefault();shut();return}if(e.key==='Tab'){const links=[...dialog.querySelectorAll('a[href],button:not([disabled])')];const first=links[0],last=links[links.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
mobile.addEventListener?.('change',place);place();
})();