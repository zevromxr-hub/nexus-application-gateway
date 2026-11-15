/* NEXUS Talent Canvas v5.3: display-only controls; allocation data is untouched. */
(() => {
 'use strict';
 const host = document.getElementById('tfTree');
 if (!host || document.getElementById('tfCanvasTools')) return;
 const bar = document.createElement('div');
 bar.id = 'tfCanvasTools';
 bar.className = 'tf-canvas-tools';
 bar.innerHTML = '<div class="tf-canvas-title"><span class="tf-canvas-emblem" aria-hidden="true">✦</span><div><strong>Talent Atlas</strong><small>Drag to explore · Tap a talent to edit</small></div></div><div class="tf-canvas-actions"><button type="button" data-canvas="out" aria-label="Zoom out">−</button><span id="tfCanvasZoom" aria-live="polite">100%</span><button type="button" data-canvas="in" aria-label="Zoom in">+</button><button type="button" data-canvas="fit">FIT</button><button type="button" data-canvas="reset">RESET</button></div><div class="tf-minimap-wrap"><canvas id="tfCanvasMap" width="170" height="98" aria-label="Tree overview; tap or click to navigate"></canvas><small>Tap map to jump</small></div>';
 host.before(bar);
 const map = bar.querySelector('canvas');
 const zoomLabel = document.getElementById('tfCanvasZoom');
 const positions = new Map();
 let scale = 1, stage = null, grid = null, dragging = null, pinch = null;
 let painting = false, paintToken = 0;
 let blockClick = false;
 const limit = (v, a, b) => Math.max(a, Math.min(b, v));
 const category = () => document.querySelector('[data-tf-tab].active')?.dataset.tfTab || 'class';
 const layout = () => document.getElementById('tfLayout')?.value || 'grid';
 const key = () => category() + ':' + (document.getElementById('tfHeroTree')?.value || 'all');
 const active = () => !!grid && grid.isConnected && !!stage && stage.isConnected;
 function geometry() {
  if (!active()) return {w:1,h:1};
  return {w:Math.max(grid.scrollWidth, grid.offsetWidth, 1), h:Math.max(grid.scrollHeight, grid.offsetHeight, 1)};
 }
 function applyScale(value, center) {
  if (!active()) return;
  const prev = scale;
  const oldX = (host.scrollLeft + (center?.x ?? host.clientWidth / 2)) / prev;
  const oldY = (host.scrollTop + (center?.y ?? host.clientHeight / 2)) / prev;
  scale = limit(Math.round(value * 100)/100, .25, 1.4);
  const {w,h} = geometry();
  grid.style.transform = 'scale(' + scale + ')';
  stage.style.width = (w * scale) + 'px';
  stage.style.height = (h * scale) + 'px';
  zoomLabel.textContent = Math.round(scale * 100) + '%';
  host.scrollLeft = oldX * scale - (center?.x ?? host.clientWidth / 2);
  host.scrollTop = oldY * scale - (center?.y ?? host.clientHeight / 2);
  drawMap();
 }
 function fit() {
  if (!active()) return;
  const {w,h} = geometry();
  applyScale(limit(Math.min((host.clientWidth - 16)/w, (host.clientHeight - 12)/h), .25, 1.4), {x:0,y:0});
  host.scrollTo({left:0,top:0,behavior:'instant'});
  drawMap();
 }
 function reset() { if (active()) {applyScale(1,{x:0,y:0});host.scrollTo({left:0,top:0,behavior:'instant'});drawMap();} }
 function savePosition() { if (active()) positions.set(key(),{x:host.scrollLeft,y:host.scrollTop,scale}); }
 function install() {
  const next = host.querySelector('.tf-positioned');
  bar.hidden = !next;
  host.classList.toggle('tf-canvas-active', !!next);
  if (!next) {grid=null;stage=null;dragging=null;return;}
  if (grid === next && active()) return;
  grid = next;
  stage = document.createElement('div');
  stage.className = 'tf-canvas-stage';
  grid.parentNode.insertBefore(stage,grid);
  stage.appendChild(grid);
  const prior = positions.get(key());
  scale = prior?.scale ?? (matchMedia('(max-width:760px)').matches ? .72 : .88);
  grid.style.transformOrigin = '0 0';
  grid.style.transform = 'scale(' + scale + ')';
  requestAnimationFrame(() => {
   if (!active()) return;
   const {w,h} = geometry();
   stage.style.width = (w * scale) + 'px';
   stage.style.height = (h * scale) + 'px';
   zoomLabel.textContent = Math.round(scale*100)+'%';
   if (prior) host.scrollTo({left:prior.x,top:prior.y,behavior:'instant'});
   drawMap();
  });
 }
 function drawMap() {
  if (painting) return;
  painting = true;
  cancelAnimationFrame(paintToken);
  paintToken = requestAnimationFrame(() => {
   painting = false;
   const ctx = map.getContext('2d'); if (!ctx) return;
   const W=map.width,H=map.height;
   ctx.clearRect(0,0,W,H);
   ctx.fillStyle='#0b1525';ctx.fillRect(0,0,W,H);
   if (!active()) return;
   const {w,h}=geometry(), k=Math.min((W-12)/w,(H-12)/h),ox=(W-w*k)/2,oy=(H-h*k)/2;
   map._atlas={w,h,k,ox,oy};
   const nodes=grid.querySelectorAll('[data-tf-node]');
   for (const n of nodes) {
    const x=ox+n.offsetLeft*k,y=oy+n.offsetTop*k;
    ctx.fillStyle=n.classList.contains('tf-selected')?'#f5c77f':'#5d8397';
    ctx.fillRect(x,y,Math.max(2,n.offsetWidth*k),Math.max(2,n.offsetHeight*k));
   }
   const vx=ox+host.scrollLeft/scale*k,vy=oy+host.scrollTop/scale*k;
   ctx.strokeStyle='#f3d59a';ctx.lineWidth=1.5;
   ctx.strokeRect(vx,vy,Math.min(w,host.clientWidth/scale)*k,Math.min(h,host.clientHeight/scale)*k);
  });
 }
 function onMap(event) {
  if (!active() || !map._atlas) return;
  const r=map.getBoundingClientRect(),p=map._atlas;
  const x=(event.clientX-r.left)*map.width/r.width,y=(event.clientY-r.top)*map.height/r.height;
  host.scrollLeft=limit(((x-p.ox)/p.k)*scale-host.clientWidth/2,0,host.scrollWidth-host.clientWidth);
  host.scrollTop=limit(((y-p.oy)/p.k)*scale-host.clientHeight/2,0,host.scrollHeight-host.clientHeight);
  savePosition();drawMap();
 }
 map.addEventListener('click',onMap);
 map.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();const rect=map.getBoundingClientRect();onMap({clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2})}});
 map.tabIndex=0;map.setAttribute('role','button');
 bar.addEventListener('click',e=>{
  const button=e.target.closest('button[data-canvas]');if(!button)return;
  const action=button.dataset.canvas;
  if(action==='in')applyScale(scale+.15);
  if(action==='out')applyScale(scale-.15);
  if(action==='fit')fit();
  if(action==='reset')reset();
  savePosition();
 });
 const interactive = target => !!target.closest('button,select,input,textarea,a,label,[contenteditable],.tf-node-controls,.tf-source-actions,.tf-choice');
 host.addEventListener('pointerdown',e=>{
  if (!active() || (e.pointerType==='mouse'&&e.button!==0) || interactive(e.target)) return;
  if (dragging) return;
  dragging={id:e.pointerId,x:e.clientX,y:e.clientY,left:host.scrollLeft,top:host.scrollTop,moved:false};
  host.setPointerCapture(e.pointerId);
  host.classList.add('tf-is-dragging');
 },{passive:true});
 host.addEventListener('pointermove',e=>{
  if(!dragging||dragging.id!==e.pointerId)return;
  const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;
  if(Math.abs(dx)+Math.abs(dy)>6)dragging.moved=true;
  if(!dragging.moved)return;
  host.scrollLeft=dragging.left-dx;host.scrollTop=dragging.top-dy;
  drawMap();
 },{passive:true});
 function finish(e) {
  if (!dragging || dragging.id!==e.pointerId)return;
  if (dragging.moved) {blockClick=true;savePosition();setTimeout(()=>{blockClick=false},0);}
  dragging=null;host.classList.remove('tf-is-dragging');
 }
 host.addEventListener('pointerup',finish);
 host.addEventListener('pointercancel',finish);
 host.addEventListener('lostpointercapture',()=>{dragging=null;host.classList.remove('tf-is-dragging')});
 host.addEventListener('click',e=>{if(blockClick){e.preventDefault();e.stopImmediatePropagation();blockClick=false;}},true);
 host.addEventListener('scroll',()=>{drawMap();if(!dragging)savePosition();},{passive:true});
 host.addEventListener('wheel',e=>{
  if(!active() || !(e.ctrlKey||e.metaKey))return;
  e.preventDefault();
  const box=host.getBoundingClientRect();
  applyScale(scale+(e.deltaY<0?.08:-.08),{x:e.clientX-box.left,y:e.clientY-box.top});
  savePosition();
 },{passive:false});
 const observer = new MutationObserver(()=>{
  const next=host.querySelector('.tf-positioned');
  if (next && next===grid && stage?.contains(next))return;
  if(active())savePosition();
  requestAnimationFrame(install);
 });
 observer.observe(host,{childList:true});
 document.querySelectorAll('[data-tf-tab]').forEach(b=>b.addEventListener('click',savePosition,true));
 document.getElementById('tfHeroTree')?.addEventListener('change',savePosition,true);
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(()=>{if(active()){const {w,h}=geometry();stage.style.width=w*scale+'px';stage.style.height=h*scale+'px';drawMap();}}):null;
 if(resize)resize.observe(host);
 install();
})();