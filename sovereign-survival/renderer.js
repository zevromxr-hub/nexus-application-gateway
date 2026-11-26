/* SOVEREIGN SURVIVAL v1.1 WARBOUND — original Canvas2D fantasy arena renderer.
 * A single canvas and zero texture downloads keep iPhone CPU/memory bounded.
 */
import {WORLD,ENEMY_TYPES} from './core.js';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const fract=n=>n-Math.floor(n);
const hash=n=>fract(Math.sin(n*12.9898+78.233)*43758.5453);
function circle(c,x,y,r,fill){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=fill;c.fill()}
function ring(c,x,y,r,color,width=1){c.beginPath();c.arc(x,y,r,0,TAU);c.lineWidth=width;c.strokeStyle=color;c.stroke()}
function line(c,pts,stroke,width=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineWidth=width;c.strokeStyle=stroke;c.stroke()}
function polygon(c,pts,fill,stroke){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
function glow(c,x,y,r,color){
 const g=c.createRadialGradient(x,y,1,x,y,r);
 g.addColorStop(0,color);g.addColorStop(1,'transparent');circle(c,x,y,r,g);
}
function floor(c,s,view,quality){
 const {x,y,w,h}=view;
 c.fillStyle='#070b1b';c.fillRect(x,y,w,h);
 const gr=c.createRadialGradient(WORLD.width/2,WORLD.height/2,40,WORLD.width/2,WORLD.height/2,1220);
 gr.addColorStop(0,'rgba(67,35,110,.24)');gr.addColorStop(.48,'rgba(26,34,71,.14)');gr.addColorStop(1,'rgba(1,5,12,.04)');
 c.fillStyle=gr;c.fillRect(x,y,w,h);
 const size=96,l=Math.floor(x/size)*size,r=Math.ceil((x+w)/size)*size,
  top=Math.floor(y/size)*size,bottom=Math.ceil((y+h)/size)*size;
 c.beginPath();for(let i=l;i<=r;i+=size){c.moveTo(i,top);c.lineTo(i,bottom)}
 for(let j=top;j<=bottom;j+=size){c.moveTo(l,j);c.lineTo(r,j)}
 c.strokeStyle='rgba(149,141,228,.075)';c.lineWidth=1;c.stroke();
 for(let j=Math.floor(y/192);j<=Math.ceil((y+h)/192);j++)
 for(let i=Math.floor(x/192);i<=Math.ceil((x+w)/192);i++){
  const v=hash(i*941+j*319);
  if(v<.38)continue;
  const xx=i*192+v*60,yy=j*192+hash(j*43+i*78)*70;
  line(c,[[xx-16,yy-5],[xx,yy+12],[xx+26,yy-2],[xx+36,yy+11]],
    v>.8?'rgba(152,95,208,.18)':'rgba(118,130,186,.13)',v>.8?1.5:1);
  if(quality!=='low'&&v>.88)glow(c,xx,yy,39,'rgba(126,69,228,.065)');
 }
 // Arcane citadel sigils at the center; no textures needed.
 const cx=WORLD.width/2,cy=WORLD.height/2;
 ring(c,cx,cy,415,'rgba(153,119,238,.10)',2);
 ring(c,cx,cy,425,'rgba(153,119,238,.09)',1);
 ring(c,cx,cy,270,'rgba(112,189,220,.10)',2);
 for(let i=0;i<16;i++){
  const a=i*TAU/16;
  line(c,[[cx+Math.cos(a)*406,cy+Math.sin(a)*406],
   [cx+Math.cos(a)*441,cy+Math.sin(a)*441]],'rgba(177,128,232,.15)',2);
 }
 // Clearly visible walls at arena boundaries.
 c.strokeStyle='rgba(162,123,252,.55)';c.lineWidth=14;c.strokeRect(8,8,WORLD.width-16,WORLD.height-16);
 c.strokeStyle='rgba(106,221,239,.13)';c.lineWidth=3;c.strokeRect(22,22,WORLD.width-44,WORLD.height-44);
 if(quality!=='low'){
  for(let i=0;i<22;i++){
   const px=85+hash(i*113)*2630,py=80+hash(i*739)*1740;
   const pulse=.42+.4*Math.sin(s.time*.75+i*4);
   circle(c,px,py,1.5,'rgba(162,209,248,'+pulse.toFixed(3)+')');
  }
 }
}
function enemy(c,e,s,quality){
 const model=ENEMY_TYPES[e.kind],r=e.rad,health=e.hp/e.maxHp;
 c.save();c.translate(e.x,e.y);
 circle(c,3,r*.85,r*.88,'rgba(0,0,0,.33)');
 if(quality!=='low')glow(c,0,-5,r*2.6,e.kind==='monarch'?'rgba(255,79,103,.13)':e.kind==='stalker'?'rgba(55,232,237,.11)':'rgba(168,99,254,.10)');
 c.rotate(Math.sin(s.time*3+e.wobble)*.085);
 if(e.kind==='monarch'){
  ring(c,0,0,58,'rgba(255,124,126,.32)',3);
  for(let k=0;k<8;k++){
   const a=k*TAU/8+s.time*.15;
   line(c,[[Math.cos(a)*49,Math.sin(a)*49],[Math.cos(a)*63,Math.sin(a)*63]],'rgba(255,171,106,.7)',3);
  }
  polygon(c,[[-35,18],[-40,-23],[-20,-40],[0,-52],[20,-40],[40,-23],[35,18],[0,44]],'#3b1734','#fb9975');
  polygon(c,[[-40,-22],[-33,-54],[-9,-37],[0,-65],[9,-37],[33,-54],[40,-22]],'#b24b7c','#fac9a1');
  ring(c,0,-4,18,'#f2a9ff',2);circle(c,0,-4,7,'#ffe6be');
 }else if(e.kind==='brute'){
  polygon(c,[[-r*.9,-r*.4],[-r*.64,-r*1.14],[0,-r*.8],[r*.64,-r*1.14],[r*.9,-r*.4],[r*.85,r*.6],[0,r*1.1],[-r*.85,r*.6]],'#4a2d35','#e3a56d');
  polygon(c,[[-8,-8],[0,-16],[8,-8],[9,10],[0,18],[-9,10]],'#e3a56d');
 }else if(e.kind==='stalker'){
  polygon(c,[[0,-r*1.4],[r*1.14,r*.65],[0,r*.55],[-r*1.14,r*.65]],'#174852','#72e6ee');
  polygon(c,[[-5,-3],[0,-10],[5,-3],[0,10]],'#d6faff');
 }else{
  polygon(c,[[0,-r*1.24],[r*.8,-r*.5],[r,8],[0,r*1.15],[-r,8],[-r*.8,-r*.5]],'#35214f','#b98af4');
  line(c,[[-r*.48,-2],[-3,1],[0,5],[3,1],[r*.48,-2]],'#dcbeff',2);
 }
 if(health<.99||e.kind==='monarch'){
  const w=r*2.2;c.fillStyle='#080816';c.fillRect(-w/2,-r-19,w,5);
  c.fillStyle=e.kind==='monarch'?'#ff9a85':'#75e3f5';c.fillRect(-w/2,-r-19,w*clamp(health,0,1),5);
 }
 c.restore();
}
function hero(c,p,s,quality){
 const t=s.time,r=16;c.save();c.translate(p.x,p.y);
 if(quality!=='low')glow(c,0,0,p.dashTime>0?115:80,p.dashTime>0?'rgba(113,226,255,.22)':'rgba(166,97,245,.12)');
 circle(c,3,16,18,'rgba(0,0,0,.35)');
 const pulse=Math.sin(t*2.6)*2;
 ring(c,0,0,27+pulse,p.dashTime>0?'rgba(132,240,255,.8)':'rgba(164,143,248,.36)',p.dashTime>0?4:2);
 c.rotate(p.angle+Math.PI/2);
 polygon(c,[[-17,5],[-26,22],[0,17],[26,22],[17,5],[0,-14]],'#23143c','#9b69df');
 polygon(c,[[-15,10],[0,29],[15,10],[0,1]],'#5a326e');
 polygon(c,[[-11,-9],[0,-21],[11,-9],[13,10],[0,13],[-13,10]],'#c3a4ef','#ffe2a0');
 polygon(c,[[-9,-17],[0,-24],[9,-17],[7,-7],[-7,-7]],'#222136','#84e7ef');
 circle(c,-4,-12,2,'#b8efff');circle(c,4,-12,2,'#b8efff');
 // Twin blades mounted on the gauntlets.
 line(c,[[-12,0],[-25,-24],[-23,-39]],'#b2e8fb',3.6);
 line(c,[[12,0],[25,-24],[23,-39]],'#d8affc',3.6);
 c.restore();
 if(p.invulnerable>0)ring(c,p.x,p.y,22+p.invulnerable*12,'rgba(123,239,255,.7)',3);
 if(p.hp<p.maxHp){
  c.fillStyle='#141022';c.fillRect(p.x-25,p.y-36,50,5);
  c.fillStyle='#70f2b5';c.fillRect(p.x-25,p.y-36,50*clamp(p.hp/p.maxHp,0,1),5);
 }
}
function projectile(c,b,hostile,quality){
 if(quality!=='low')glow(c,b.x,b.y,22,hostile?'rgba(255,111,106,.24)':'rgba(162,118,255,.21)');
 line(c,[[b.x-b.vx*.022,b.y-b.vy*.022],[b.x,b.y]],hostile?'rgba(255,121,88,.75)':'rgba(125,208,253,.65)',hostile?5:4);
 circle(c,b.x,b.y,b.r,hostile?'#ffab85':'#f0ceff');
}
export function drawArena(ctx,s,view,quality='auto'){
 const {w,h,x,y}=view;if(!w||!h)return;
 ctx.save();
 ctx.fillStyle='#050710';ctx.fillRect(0,0,w,h);
 ctx.translate(-x,-y);
 floor(ctx,s,view,quality);
 for(const orb of s.orbs){
  if(orb.x<x-20||orb.x>x+w+20||orb.y<y-20||orb.y>y+h+20)continue;
  if(quality!=='low')glow(ctx,orb.x,orb.y,22,'rgba(108,247,214,.2)');
  circle(ctx,orb.x,orb.y,orb.r,'#80f9cd');ring(ctx,orb.x,orb.y,orb.r+4,'rgba(99,229,218,.4)');
 }
 for(const e of s.enemies)if(e.x>x-90&&e.x<x+w+90&&e.y>y-90&&e.y<y+h+90)enemy(ctx,e,s,quality);
 // The Monarch's existing attack timer now gives a visible warning before
 // its next three-projectile volley. This is visual-only: damage and timing
 // still belong exclusively to the tested original combat engine.
 for(const e of s.enemies){
  if(e.kind!=='monarch'||!(e.shoot>0&&e.shoot<.8))continue;
  const charge=Math.max(0,1-e.shoot/.8),angle=Math.atan2(s.player.y-e.y,s.player.x-e.x);
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(angle);
  const alpha=(.17+charge*.58).toFixed(3);
  ctx.strokeStyle='rgba(255,112,136,'+alpha+')';ctx.lineWidth=2+charge*3;
  ctx.beginPath();ctx.moveTo(53,-28-charge*34);ctx.lineTo(470,-70-charge*67);
  ctx.moveTo(53,28+charge*34);ctx.lineTo(470,70+charge*67);ctx.stroke();
  ring(ctx,0,0,49+charge*24,'rgba(255,114,148,'+alpha+')',2+charge*2);
  ctx.restore();
 }
 for(const b of s.shots)if(b.x>x-50&&b.x<x+w+50&&b.y>y-50&&b.y<y+h+50)projectile(ctx,b,false,quality);
 for(const b of s.hostile)if(b.x>x-50&&b.x<x+w+50&&b.y>y-50&&b.y<y+h+50)projectile(ctx,b,true,quality);
 for(const fx of s.effects){
  const r=fx.size*(1+(0.6-fx.t)*1.8),alpha=clamp(fx.t*1.6,0,.7);
  ring(ctx,fx.x,fx.y,r,fx.kind==='hurt'?'rgba(255,103,115,'+alpha+')':
   fx.kind==='death'?'rgba(159,235,222,'+alpha+')':'rgba(209,157,255,'+alpha+')',2.5);
 }
 hero(ctx,s.player,s,quality);
 ctx.restore();
 // Off-screen enemy direction keeps combat discoverable on large arenas.
 const p=s.player,nears=s.enemies.filter(e=>e.hp>0).sort((a,b)=>
  ((a.x-p.x)**2+(a.y-p.y)**2)-((b.x-p.x)**2+(b.y-p.y)**2)).slice(0,3);
 ctx.save();
 for(const e of nears){
  const px=e.x-x,py=e.y-y;
  if(px>=24&&px<w-24&&py>=24&&py<h-24)continue;
  const cx=w/2,cy=h/2,dx=px-cx,dy=py-cy;
  const scale=Math.min((w/2-25)/Math.max(1,Math.abs(dx)),(h/2-25)/Math.max(1,Math.abs(dy)));
  const tx=cx+dx*scale,ty=cy+dy*scale,angle=Math.atan2(dy,dx);
  ctx.translate(tx,ty);ctx.rotate(angle);
  polygon(ctx,[[11,0],[-7,-6],[-5,0],[-7,6]],
   e.kind==='monarch'?'#ff9498':'rgba(199,172,255,.84)');
  ctx.rotate(-angle);ctx.translate(-tx,-ty);
 }
 ctx.restore();
 // Screen vignette and top cinematic shading.
 const vignette=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.28,w/2,h/2,Math.max(w,h)*.8);
 vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'rgba(0,0,10,.56)');
 ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
 const gradient=ctx.createLinearGradient(0,0,0,105);
 gradient.addColorStop(0,'rgba(4,5,15,.48)');gradient.addColorStop(1,'transparent');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,w,105);
}
