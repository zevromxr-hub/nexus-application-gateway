/* NEXUS | Azeroth Companion v3.4.1 Adaptive Navigation — presentation-only */
(()=>{'use strict';
const sidebar=document.querySelector('.sidebar'),nav=sidebar?.querySelector('.nav'),main=document.querySelector('.main');
if(!sidebar||!nav||!main||document.querySelector('.ac-mobile-bar'))return;
const mobile=window.matchMedia('(max-width: 800px)');
const backdrop=document.createElement('div');backdrop.className='ac-menu-backdrop';backdrop.setAttribute('aria-hidden','true');document.body.append(backdrop);
const header=document.createElement('div');header.className='ac-mobile-menu-head';
const brand=sidebar.querySelector('.brand');if(brand)header.append(brand);
const close=document.createElement('button');close.type='button';close.className='ac-mobile-close';close.textContent='×';close.setAttribute('aria-label','Close navigation');header.append(close);sidebar.prepend(header);
const searchWrap=document.createElement('div');searchWrap.className='ac-search-wrap';const search=document.createElement('input');search.type='search';search.placeholder='Find a companion tool…';search.setAttribute('aria-label','Find companion tool');search.autocomplete='off';const count=document.createElement('span');count.className='ac-search-count';searchWrap.append(search,count);nav.before(searchWrap);
sidebar.id=sidebar.id||'ac-navigation';sidebar.setAttribute('aria-label','All companion tools');
const bar=document.createElement('nav');bar.className='ac-mobile-bar';bar.setAttribute('aria-label','Quick navigation');
const quick=[['overview','⌂','Home'],['armory','♟','Armory'],['progress','◈','Goals']];
for(const [target,icon,label] of quick){const b=document.createElement('button');b.type='button';b.dataset.acTarget=target;b.innerHTML='<span class="ac-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span>';bar.append(b)}
const more=document.createElement('button');more.type='button';more.dataset.acMore='true';more.setAttribute('aria-controls',sidebar.id);more.setAttribute('aria-expanded','false');more.innerHTML='<span class="ac-icon" aria-hidden="true">☰</span><span>All tools</span>';bar.append(more);document.body.append(bar);
const skip=document.createElement('a');skip.href='#ac-content';skip.className='ac-skip';skip.textContent='Skip to companion content';document.body.prepend(skip);main.id=main.id||'ac-content';main.setAttribute('tabindex','-1');
let opener=null,activeView='overview';
function navButtons(){return [...nav.querySelectorAll('button[data-view]')]}
function refreshSearch(){const q=search.value.trim().toLocaleLowerCase();let visible=0;for(const b of navButtons()){const ok=!q||b.textContent.toLocaleLowerCase().includes(q);b.hidden=!ok;if(ok)visible++}count.textContent=visible+' tool'+(visible===1?'':'s')+' available';}
function isOpen(){return document.body.classList.contains('ac-menu-open')}
function openMenu(){if(!mobile.matches)return;opener=document.activeElement;search.value='';refreshSearch();document.body.classList.add('ac-menu-open');more.setAttribute('aria-expanded','true');sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('role','dialog');search.focus({preventScroll:true})}
function closeMenu(restore=false){if(!isOpen())return;document.body.classList.remove('ac-menu-open');more.setAttribute('aria-expanded','false');sidebar.removeAttribute('aria-modal');sidebar.removeAttribute('role');if(restore)(opener&&opener.isConnected?opener:more).focus({preventScroll:true})}
function updateActive(){const selected=nav.querySelector('button[data-view].active');if(selected)activeView=selected.dataset.view;for(const b of bar.querySelectorAll('[data-ac-target]')){const on=b.dataset.acTarget===activeView;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')}more.classList.toggle('active',!quick.some(x=>x[0]===activeView))}
function go(target){const button=navButtons().find(b=>b.dataset.view===target);if(!button){openMenu();return}button.click();closeMenu();updateActive();window.scrollTo({top:0,behavior:'instant'})}
bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.acMore)openMenu();else if(b.dataset.acTarget)go(b.dataset.acTarget)});
close.addEventListener('click',()=>closeMenu(true));backdrop.addEventListener('click',()=>closeMenu(true));
search.addEventListener('input',refreshSearch);
nav.addEventListener('click',e=>{if(!e.target.closest('[data-view]'))return;closeMenu();requestAnimationFrame(updateActive)});
document.addEventListener('click',e=>{if(e.target.closest('[data-jump]'))requestAnimationFrame(updateActive)});
document.addEventListener('keydown',e=>{if(!isOpen())return;if(e.key==='Escape'){e.preventDefault();closeMenu(true)}else if(e.key==='Tab'){const focusables=[...sidebar.querySelectorAll('button:not([hidden]),input:not([hidden]),a[href]')].filter(n=>n.getClientRects().length);if(!focusables.length)return;const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
const mediaChanged=()=>{if(!mobile.matches)closeMenu();refreshSearch()};mobile.addEventListener?.('change',mediaChanged);
const observer=new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))refreshSearch();updateActive()});observer.observe(nav,{childList:true,subtree:false,attributes:true,attributeFilter:['class']});
refreshSearch();updateActive();
})();
