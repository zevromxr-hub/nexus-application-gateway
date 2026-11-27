/* SOVEREIGN SURVIVAL v1.5 REALM EXPEDITIONS — combat objects, portals, shrines and bosses.
 * A single canvas and zero texture downloads keep iPhone CPU/memory bounded.
 */
import {WORLD,ENEMY_TYPES,arenaForWave,isBoss} from './core.js';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const fract=n=>n-Math.floor(n);
const hash=n=>fract(Math.sin(n*12.9898+78.233)*43758.5453);
function rgba(hex,alpha){
 const v=parseInt(hex.substring(1),16);
 return 'rgba('+((v>>16)&255)+','+((v>>8)&255)+','+(v&255)+','+alpha+')';
}
function circle(c,x,y,r,fill){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=fill;c.fill()}
function ring(c,x,y,r,color,width=1){c.beginPath();c.arc(x,y,r,0,TAU);c.lineWidth=width;c.strokeStyle=color;c.stroke()}
function line(c,pts,stroke,width=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineWidth=width;c.strokeStyle=stroke;c.stroke()}
function polygon(c,pts,fill,stroke){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
function glow(c,x,y,r,color){
 const g=c.createRadialGradient(x,y,1,x,y,r);
 g.addColorStop(0,color);g.addColorStop(1,'transparent');circle(c,x,y,r,g);
}
function floor(c,s,view,quality){
 const {x,y,w,h}=view,arena=arenaForWave(s.wave);
 c.fillStyle=arena.floor;c.fillRect(x,y,w,h);
 const gr=c.createRadialGradient(WORLD.width/2,WORLD.height/2,40,WORLD.width/2,WORLD.height/2,1250);
 gr.addColorStop(0,rgba(arena.glow,.24));gr.addColorStop(.5,rgba(arena.mist,.14));gr.addColorStop(1,rgba(arena.glow,.02));
 c.fillStyle=gr;c.fillRect(x,y,w,h);
 const size=96,l=Math.floor(x/size)*size,r=Math.ceil((x+w)/size)*size,
  top=Math.floor(y/size)*size,bottom=Math.ceil((y+h)/size)*size;
 c.beginPath();for(let i=l;i<=r;i+=size){c.moveTo(i,top);c.lineTo(i,bottom)}
 for(let j=top;j<=bottom;j+=size){c.moveTo(l,j);c.lineTo(r,j)}
 c.strokeStyle=rgba(arena.sigil,.082);c.lineWidth=1;c.stroke();
 for(let j=Math.floor(y/192);j<=Math.ceil((y+h)/192);j++)
 for(let i=Math.floor(x/192);i<=Math.ceil((x+w)/192);i++){
  const v=hash(i*941+j*319);
  if(v<.38)continue;
  const xx=i*192+v*60,yy=j*192+hash(j*43+i*78)*70;
  line(c,[[xx-16,yy-5],[xx,yy+12],[xx+26,yy-2],[xx+36,yy+11]],
    rgba(arena.sigil,v>.8?.2:.12),v>.8?1.5:1);
  if(quality!=='low'&&v>.88)glow(c,xx,yy,39,rgba(arena.glow,.065));
 }
 // Arcane citadel sigils at the center; no textures needed.
 const cx=WORLD.width/2,cy=WORLD.height/2;
 ring(c,cx,cy,415,rgba(arena.sigil,.14),2);
 ring(c,cx,cy,425,rgba(arena.sigil,.1),1);
 ring(c,cx,cy,270,rgba(arena.glow,.14),2);
 for(let i=0;i<16;i++){
  const a=i*TAU/16;
  line(c,[[cx+Math.cos(a)*406,cy+Math.sin(a)*406],
   [cx+Math.cos(a)*441,cy+Math.sin(a)*441]],rgba(arena.sigil,.2),2);
 }
 // Clearly visible walls at arena boundaries.
 c.strokeStyle=rgba(arena.sigil,.56);c.lineWidth=14;c.strokeRect(8,8,WORLD.width-16,WORLD.height-16);
 c.strokeStyle=rgba(arena.glow,.2);c.lineWidth=3;c.strokeRect(22,22,WORLD.width-44,WORLD.height-44);
 // Distinct runic landmarks mark each realm even when the character is moving.
 for(let i=0;i<12;i++){
  const px=160+hash(i*311+5)*2480,py=160+hash(i*571+3)*1570;
  if(px<x-120||px>x+w+120||py<y-120||py>y+h+120)continue;
  const radius=20+(i%3)*12;
  ring(c,px,py,radius,rgba(arena.sigil,.09),2);
  line(c,[[px-radius*.6,py],[px,py-radius*.9],[px+radius*.6,py],[px,py+radius*.9],[px-radius*.6,py]],
   rgba(arena.glow,.11),2);
  if(quality!=='low')glow(c,px,py,radius*1.8,rgba(arena.glow,.038));
 }
 if(quality!=='low'){
  for(let i=0;i<22;i++){
   const px=85+hash(i*113)*2630,py=80+hash(i*739)*1740;
   const pulse=.42+.4*Math.sin(s.time*.75+i*4);
   circle(c,px,py,1.5,rgba(arena.sigil,pulse.toFixed(3)));
  }
 }
}
function enemy(c,e,s,quality){
 const model=ENEMY_TYPES[e.kind],r=e.rad,health=e.hp/e.maxHp;
 c.save();c.translate(e.x,e.y);
 circle(c,3,r*.85,r*.88,'rgba(0,0,0,.33)');
 if(quality!=='low')glow(c,0,-5,r*2.6,e.kind==='monarch'?'rgba(255,79,103,.13)':e.kind==='stalker'?'rgba(55,232,237,.11)':'rgba(168,99,254,.10)');
 c.rotate(Math.sin(s.time*3+e.wobble)*.085);
 if(e.kind==='tyrant'){
  ring(c,0,0,68,'rgba(162,128,255,.40)',3);
  for(let k=0;k<10;k++){
   const a=k*TAU/10-s.time*(e.bossPhase===2?.34:.14);
   line(c,[[Math.cos(a)*53,Math.sin(a)*53],[Math.cos(a)*69,Math.sin(a)*69]],
    e.bossPhase===2?'#ffb4ff':'#a78eff',2.7);
  }
  polygon(c,[[0,-62],[29,-42],[47,-6],[35,31],[0,48],[-35,31],[-47,-6],[-29,-42]],
   e.bossPhase===2?'#512452':'#241c52','#bba4ff');
  polygon(c,[[-46,-34],[-55,-63],[-19,-48],[0,-76],[19,-48],[55,-63],[46,-34]],
   '#6c4eaa','#e1c3ff');
  polygon(c,[[-25,-15],[0,-36],[25,-15],[21,23],[0,35],[-21,23]],'#271a43','#cbb7ff');
  circle(c,-9,-7,4,'#f6e8ff');circle(c,9,-7,4,'#f6e8ff');
  ring(c,0,12,12,e.bossPhase===2?'#ff9fae':'#bda0ff',3);
 }else if(e.kind==='monarch'){
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
 }else if(e.kind==='hexer'){
  polygon(c,[[-r*1.2,r*.9],[-r*.9,-r*.85],[0,-r*1.5],[r*.95,-r*.85],[r*1.2,r*.9],[0,r*1.15]],'#3d153b','#d889c6');
  polygon(c,[[-11,-8],[0,-21],[11,-8],[9,10],[0,17],[-9,10]],'#19162c','#f6b6e3');
  ring(c,0,0,10,'#ffb9e8',2);
  circle(c,0,0,4,'#ffe2f1');
  line(c,[[r*.7,-r],[r*1.35,-r*1.55],[r*1.58,-r*1.96]],'#ffacd3',3);
  circle(c,r*1.58,-r*1.96,4,'#ffe4f1');
 }else if(e.kind==='ravager'){
  polygon(c,[[0,-r*1.47],[r*.94,-r*.9],[r*1.2,r*.4],[r*.65,r*1.08],[0,r*.78],[-r*.65,r*1.08],[-r*1.2,r*.4],[-r*.94,-r*.9]],'#67301f','#ffb46b');
  polygon(c,[[-r*.94,-r*.8],[-r*1.27,-r*1.6],[-r*.2,-r*.9]],'#d87d48','#ffe1ad');
  polygon(c,[[r*.94,-r*.8],[r*1.27,-r*1.6],[r*.2,-r*.9]],'#d87d48','#ffe1ad');
  polygon(c,[[-7,-8],[0,-17],[7,-8],[10,10],[0,18],[-10,10]],'#391625','#ffd1a7');
  circle(c,-7,-3,3,'#ffe9ae');circle(c,7,-3,3,'#ffe9ae');
 }else{
  polygon(c,[[0,-r*1.24],[r*.8,-r*.5],[r,8],[0,r*1.15],[-r,8],[-r*.8,-r*.5]],'#35214f','#b98af4');
  line(c,[[-r*.48,-2],[-3,1],[0,5],[3,1],[r*.48,-2]],'#dcbeff',2);
 }
 if(health<.99||isBoss(e)||e.elite){
  const w=r*2.2;c.fillStyle='#080816';c.fillRect(-w/2,-r-19,w,5);
  c.fillStyle=e.kind==='tyrant'?'#bd9bff':e.kind==='monarch'?'#ff9a85':e.elite?'#f8d68c':'#75e3f5';
  c.fillRect(-w/2,-r-19,w*clamp(health,0,1),5);
 }
 if(e.elite){
  ring(c,0,0,r+9,'rgba(250,199,97,.68)',2.5);
  polygon(c,[[-12,-r-12],[-9,-r-20],[0,-r-15],[9,-r-20],[12,-r-12]],
    '#d4a857','#ffe4ad');
 }
 if(e.flash>0){
  ring(c,0,0,r+5,'rgba(255,246,226,'+clamp(e.flash*5,0,.95)+')',3);
 }
 if(e.frozenFor>0){
  ring(c,0,0,r+8,'rgba(155,243,255,.83)',3);
  for(let i=0;i<4;i++){
   const a=i*TAU/4+s.time*.35;
   line(c,[[Math.cos(a)*(r-3),Math.sin(a)*(r-3)],
     [Math.cos(a)*(r+12),Math.sin(a)*(r+12)]],'rgba(210,252,255,.9)',2);
  }
 }
 if(e.burnTime>0){
  ring(c,0,0,r+7,'rgba(255,143,76,'+clamp(.3+e.burnTime*.18,.3,.85)+')',2.3);
  if(quality!=='low'){
   for(let i=0;i<3;i++){
    const a=i*TAU/3+s.time*2.4;
    circle(c,Math.cos(a)*(r+7),Math.sin(a)*(r+7)-4,2.8,'rgba(255,192,88,.85)');
   }
  }
 }
 c.restore();
}
function hero(c,p,s,quality){
 const t=s.time,r=16;
 const frost=p.champion==='sentinel',ember=p.champion==='reaver';
 const aura=frost?'rgba(109,222,255,.21)':ember?'rgba(250,126,75,.22)':'rgba(166,97,245,.12)';
 const edge=frost?'#88e8fa':ember?'#fcb574':'#9b69df';
 const metal=frost?'#c8f2ff':ember?'#f9c1a0':'#c3a4ef';
 const mantle=frost?'#16364a':ember?'#482333':'#23143c';
 c.save();c.translate(p.x,p.y);
 if(p.dashTime>0){
  // Short, inexpensive spectral afterimage for a responsive dash feel.
  const a=p.angle+Math.PI/2;
  line(c,[[-Math.cos(a)*14,-Math.sin(a)*14],
   [-Math.cos(a)*76,-Math.sin(a)*76]],'rgba(118,232,255,.38)',16);
 }
 if(quality!=='low')glow(c,0,0,p.dashTime>0?115:80,p.dashTime>0?'rgba(113,226,255,.22)':aura);
 circle(c,3,16,18,'rgba(0,0,0,.35)');
 const pulse=Math.sin(t*2.6)*2;
 ring(c,0,0,27+pulse,p.dashTime>0?'rgba(132,240,255,.8)':aura,p.dashTime>0?4:2);
 c.rotate(p.angle+Math.PI/2);
 polygon(c,[[-17,5],[-26,22],[0,17],[26,22],[17,5],[0,-14]],mantle,edge);
 polygon(c,[[-15,10],[0,29],[15,10],[0,1]],frost?'#276578':ember?'#8b3939':'#5a326e');
 polygon(c,[[-11,-9],[0,-21],[11,-9],[13,10],[0,13],[-13,10]],metal,'#ffe2a0');
 polygon(c,[[-9,-17],[0,-24],[9,-17],[7,-7],[-7,-7]],'#222136',frost?'#b4f4ff':ember?'#ffb580':'#84e7ef');
 circle(c,-4,-12,2,frost?'#d6ffff':ember?'#ffbd79':'#b8efff');
 circle(c,4,-12,2,frost?'#d6ffff':ember?'#ffbd79':'#b8efff');
 if(frost){
  // Frost Sentinel's ice spires read clearly from a small mobile camera.
  polygon(c,[[-20,-8],[-31,-22],[-16,-16]],'#70d8e6','#d7fbff');
  polygon(c,[[20,-8],[31,-22],[16,-16]],'#70d8e6','#d7fbff');
 }else if(ember){
  polygon(c,[[-14,13],[-17,24],[-4,14]],'#b65b42','#ffbe78');
  polygon(c,[[14,13],[17,24],[4,14]],'#b65b42','#ffbe78');
 }
 // Twin blades mounted on the gauntlets; a brief attack arc tracks fire cadence.
 line(c,[[-12,0],[-25,-24],[-23,-39]],frost?'#bdf8ff':ember?'#ffb16c':'#b2e8fb',3.6);
 line(c,[[12,0],[25,-24],[23,-39]],frost?'#d0f8ff':ember?'#ffd19d':'#d8affc',3.6);
 const slash=clamp(1-p.fireCooldown/p.rate,0,1);
 if(slash<.42){
  c.beginPath();c.arc(0,-16,46,-Math.PI*.87,-Math.PI*.23);
  c.strokeStyle='rgba(185,226,255,'+((.42-slash)*1.7)+')';
  c.lineWidth=3;c.stroke();
 }
 c.restore();
 if(p.barrierTime>0){
  const shimmer=.58+.18*Math.sin(s.time*6);
  ring(c,p.x,p.y,41+Math.sin(s.time*5)*2,'rgba(153,245,255,'+shimmer+')',4);
  ring(c,p.x,p.y,49,'rgba(184,246,255,.22)',2);
  if(quality!=='low')glow(c,p.x,p.y,70,'rgba(101,228,251,.12)');
 }
 if(s.evolutions?.ward&&p.aegisCooldown<=0){
  ring(c,p.x,p.y,30,'rgba(255,217,166,.5)',2);
 }
 if(p.invulnerable>0)ring(c,p.x,p.y,22+Math.min(1,p.invulnerable)*12,'rgba(123,239,255,.7)',3);
 if(p.hp<p.maxHp){
  c.fillStyle='#141022';c.fillRect(p.x-25,p.y-36,50,5);
  c.fillStyle='#70f2b5';c.fillRect(p.x-25,p.y-36,50*clamp(p.hp/p.maxHp,0,1),5);
 }
}
function projectile(c,b,hostile,quality){
 const hex=b.kind==='hexer',color=hostile?(hex?'#ff8dd6':'#ffab85'):b.storm?'#9af8ff':'#f0ceff';
 if(quality!=='low')glow(c,b.x,b.y,22,hostile?(hex?'rgba(233,82,191,.24)':'rgba(255,111,106,.24)'):'rgba(162,118,255,.21)');
 line(c,[[b.x-b.vx*.022,b.y-b.vy*.022],[b.x,b.y]],
  hostile?(hex?'rgba(245,138,237,.8)':'rgba(255,121,88,.75)'):
   b.storm?'rgba(114,240,255,.9)':'rgba(125,208,253,.65)',hostile?5:4);
 circle(c,b.x,b.y,b.r,color);
}
function drawAwakeningEffect(c,fx,quality){
 const t=fx.t,small=quality==='low',r=fx.size||85;
 if(fx.kind==='nova'){
  const progress=1-clamp(t/.65,0,1),radius=25+progress*r;
  ring(c,fx.x,fx.y,radius,'rgba(202,146,255,'+(1-progress)*.87+')',9-progress*5);
  if(!small)glow(c,fx.x,fx.y,radius*.85,'rgba(138,84,240,'+(1-progress)*.15+')');
  for(let i=0;i<(small?4:9);i++){
   const a=i*TAU/(small?4:9)+progress*.4;
   line(c,[[fx.x+Math.cos(a)*radius*.72,fx.y+Math.sin(a)*radius*.72],
    [fx.x+Math.cos(a)*radius*1.18,fx.y+Math.sin(a)*radius*1.18]],
    'rgba(219,188,255,'+(1-progress)*.72+')',3);
  }
 }else if(fx.kind==='freeze'){
  const progress=1-clamp(t/.75,0,1),radius=30+progress*r;
  ring(c,fx.x,fx.y,radius,'rgba(151,240,255,'+(1-progress)*.85+')',6);
  for(let i=0;i<(small?6:12);i++){
   const a=i*TAU/(small?6:12);
   line(c,[[fx.x+Math.cos(a)*radius*.48,fx.y+Math.sin(a)*radius*.48],
    [fx.x+Math.cos(a)*radius,fx.y+Math.sin(a)*radius]],
    'rgba(214,251,255,'+(1-progress)*.69+')',3);
  }
 }else if(fx.kind==='cleave'||fx.kind==='sovereignSlash'){
  const isFire=fx.kind==='cleave',duration=isFire?.42:.3;
  const progress=clamp(1-t/duration,0,1),a=fx.angle||0;
  c.save();c.translate(fx.x,fx.y);
  c.beginPath();c.arc(0,0,r*(.65+progress*.4),a-1.08,a+1.08);
  c.strokeStyle=isFire?'rgba(255,158,81,'+(1-progress)*.95+')':
   'rgba(191,234,255,'+(1-progress)*.93+')';
  c.lineWidth=isFire?19-progress*10:10-progress*6;c.stroke();
  if(!small){
   c.beginPath();c.arc(0,0,r*(.4+progress*.35),a-.98,a+.98);
   c.strokeStyle=isFire?'rgba(255,233,158,'+(1-progress)*.61+')':
    'rgba(218,209,255,'+(1-progress)*.60+')';
   c.lineWidth=4;c.stroke();
  }
  c.restore();
 }else{
  const duration=fx.kind==='bossEntrance'?1.45:fx.kind==='evolution'?1.1:
   fx.kind==='aegis'?.85:.35;
  const progress=clamp(1-t/duration,0,1);
  const color=fx.kind==='storm'?'rgba(123,235,255,':
   fx.kind==='bossEntrance'?'rgba(255,110,151,':'rgba(255,217,151,';
  ring(c,fx.x,fx.y,24+progress*r,color+((1-progress)*.9)+')',5-progress*2);
  if((fx.kind==='evolution'||fx.kind==='bossEntrance')&&!small){
   ring(c,fx.x,fx.y,38+progress*r*.6,color+((1-progress)*.58)+')',2.5);
  }
 }
}
function warnAttack(c,e,quality){
 if(isBoss(e)||e.kind==='hexer'){
  const window=isBoss(e)?.78:.58;
  if(!(e.aimLocked&&e.shoot>0&&e.shoot<window))return;
  const fraction=1-e.shoot/window;
  c.save();c.translate(e.x,e.y);c.rotate(e.aimAngle);
  const spread=e.kind==='tyrant'?
   (e.bossPhase===2?[-.6,-.3,0,.3,.6]:[-.32,0,.32]):
   e.kind==='monarch'?(e.bossPhase===2?[-.45,-.22,0,.22,.45]:[-.22,0,.22]):[0],
   max=isBoss(e)?570:400;
  for(const a of spread){
   const w=9+fraction*12,alpha=.15+fraction*.55;
   const y=Math.tan(a)*max;
   polygon(c,[[e.rad,0],[max,y-w],[max,y+w]],e.kind==='hexer'?
     'rgba(236,116,217,'+alpha*.12+')':'rgba(255,116,120,'+alpha*.13+')');
   line(c,[[e.rad,0],[max,y]],e.kind==='hexer'?'rgba(255,133,223,'+alpha+')':
    e.kind==='tyrant'?'rgba(193,143,255,'+alpha+')':'rgba(255,116,131,'+alpha+')',1.5+fraction*2);
  }
  if(quality!=='low')glow(c,0,0,e.rad*2,e.kind==='hexer'?'rgba(235,84,192,.12)':e.kind==='tyrant'?'rgba(155,98,245,.16)':'rgba(235,84,105,.12)');
  ring(c,0,0,e.rad+8+fraction*20,e.kind==='hexer'? 'rgba(253,127,212,.7)':e.kind==='tyrant'?
   'rgba(205,167,255,.8)':'rgba(252,107,124,.7)',2.5);
  c.restore();
 }
 if(e.kind==='ravager'&&e.chargeWindup>0){
  const fraction=1-e.chargeWindup/.68;
  c.save();c.translate(e.x,e.y);c.rotate(e.chargeAngle);
  const end=250,alpha=.19+fraction*.56;
  polygon(c,[[e.rad,0],[end,-20],[end,20]],
   'rgba(255,173,82,'+(alpha*.24)+')');
  line(c,[[e.rad,0],[end,0]],'rgba(255,195,97,'+alpha+')',3+fraction*2);
  c.restore();
 }
}
function drawHazards(c,s,view,quality){
 for(const h of s.hazards){
  if(h.x+h.radius<view.x||h.x-h.radius>view.x+view.w||
     h.y+h.radius<view.y||h.y-h.radius>view.y+view.h)continue;
  const phase=h.timer%h.period,active=phase>=h.telegraph&&phase<h.telegraph+h.active;
  const warning=phase<h.telegraph,progress=warning?phase/h.telegraph:
    active?(phase-h.telegraph)/h.active:0;
  const color=active?'#ff9c83':'#dca0ff';
  const a=active?.48:warning?.16+progress*.25:.075;
  circle(c,h.x,h.y,h.radius,rgba(color,a));
  ring(c,h.x,h.y,h.radius,rgba(color,active?.92:warning?.45+progress*.42:.2),
   active?5:2+progress*2);
  if(warning){
   c.beginPath();c.arc(h.x,h.y,h.radius-7,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);
   c.strokeStyle='#fff0c4';c.lineWidth=4;c.stroke();
  }
  if(active&&quality!=='low')glow(c,h.x,h.y,h.radius*1.3,'rgba(255,90,92,.15)');
  for(let i=0;i<6;i++){
   const angle=i*Math.PI/3+s.time*(active?.35:.08);
   const ax=h.x+Math.cos(angle)*h.radius*.57,ay=h.y+Math.sin(angle)*h.radius*.57;
   ring(c,ax,ay,6,rgba(color,a+.2),1.5);
  }
  line(c,[[h.x-13,h.y-13],[h.x+13,h.y+13]],rgba(color,a+.25),3);
  line(c,[[h.x+13,h.y-13],[h.x-13,h.y+13]],rgba(color,a+.25),3);
 }
}
function objectiveObject(c,x,y,r,glowColor,quality){
 if(quality!=='low')glow(c,x,y,r*2.0,glowColor);
 circle(c,x+3,y+8,r*.95,'rgba(0,0,0,.4)');
 ring(c,x,y,r,glowColor,2.4);
 for(let i=0;i<8;i++){
  const a=i*TAU/8;
  line(c,[[x+Math.cos(a)*r*.79,y+Math.sin(a)*r*.79],
   [x+Math.cos(a)*r*.99,y+Math.sin(a)*r*.99]],glowColor,2);
 }
}
function drawExpedition(c,s,view,quality){
 const obj=s.expedition;if(!obj)return;
 const p=s.player;
 if(obj.type==='wardstone'){
  const stone=obj.target,x=stone.x,y=stone.y;
  if(x<view.x-100||x>view.x+view.w+100||y<view.y-100||y>view.y+view.h+100)return;
  const glowColor=obj.status==='failed'?'rgba(255,101,129,.65)':'rgba(138,242,210,.66)';
  objectiveObject(c,x,y,49,glowColor,quality);
  polygon(c,[[x-28,y+21],[x-24,y-21],[x,y-56],[x+24,y-21],[x+28,y+21],[x,y+40]],
   obj.status==='failed'?'#542434':'#214f56','#c4fff1');
  polygon(c,[[x-10,y],[x,y-31],[x+10,y],[x,y+19]],'#b4faff','#f4f5ff');
  c.fillStyle='#070f19';c.fillRect(x-41,y-76,82,7);
  c.fillStyle='#90f2cc';c.fillRect(x-41,y-76,82*clamp(stone.hp/stone.maxHp,0,1),7);
 }else if(obj.type==='portals'){
  for(const portal of obj.items){
   if(!portal.active)continue;
   const x=portal.x,y=portal.y;
   if(x<view.x-90||x>view.x+view.w+90||y<view.y-90||y>view.y+view.h+90)continue;
   const pulse=Math.sin(s.time*2+portal.x)*3;
   objectiveObject(c,x,y,44+pulse,'rgba(245,110,166,.58)',quality);
   c.save();c.translate(x,y);
   c.beginPath();c.ellipse(0,0,25,40,.16,0,TAU);
   c.fillStyle='#50192e';c.fill();c.strokeStyle='#ff9cb8';c.lineWidth=4;c.stroke();
   ring(c,0,0,13+pulse*.5,'rgba(255,165,109,.75)',2);
   c.restore();
   c.fillStyle='#0b1021';c.fillRect(x-37,y-58,74,6);
   c.fillStyle='#ff9fba';c.fillRect(x-37,y-58,74*clamp(portal.hp/portal.maxHp,0,1),6);
  }
 }else if(obj.type==='shrine'){
  const x=obj.target.x,y=obj.target.y,r=obj.target.r,charged=obj.status==='complete';
  if(x<view.x-r||x>view.x+view.w+r||y<view.y-r||y>view.y+view.h+r)return;
  circle(c,x,y,r,'rgba(95,202,244,.075)');
  ring(c,x,y,r,'rgba(153,235,255,.55)',3);
  c.beginPath();c.arc(x,y,r-8,-Math.PI/2,-Math.PI/2+TAU*clamp(obj.progress/obj.total,0,1));
  c.lineWidth=7;c.strokeStyle='#bffcff';c.stroke();
  objectiveObject(c,x,y,29,'rgba(137,228,255,.66)',quality);
  polygon(c,[[x-18,y+18],[x-12,y-10],[x,y-26],[x+12,y-10],[x+18,y+18],[x,y+10]],
   charged?'#539b9c':'#234977','#d1fbff');
  circle(c,x,y-4,7,'#d5fcff');
 }else if(obj.type==='seals'){
  for(const seal of obj.items){
   const x=seal.x,y=seal.y,r=seal.r;
   if(x<view.x-r||x>view.x+view.w+r||y<view.y-r||y>view.y+view.h+r)continue;
   circle(c,x,y,r,'rgba(129,100,237,.055)');
   ring(c,x,y,r,seal.done?'rgba(131,252,210,.75)':'rgba(188,141,255,.57)',3);
   c.beginPath();c.arc(x,y,r-7,-Math.PI/2,-Math.PI/2+TAU*clamp(seal.charge/2.2,0,1));
   c.lineWidth=6;c.strokeStyle=seal.done?'#97ffdc':'#dfbbff';c.stroke();
   objectiveObject(c,x,y,24,seal.done?'rgba(110,242,184,.74)':'rgba(185,128,255,.76)',quality);
   polygon(c,[[x,y-28],[x+19,y],[x,y+28],[x-19,y]],
    seal.done?'#307a65':'#49316b',seal.done?'#b0ffeb':'#ead5ff');
  }
  // The pulsing throne is unsafe outside its inner dais. Ring colors
  // change along with the real harmful window in updateExpedition().
  if(obj.status==='active'){
   const surge=obj.surge,phase=surge.timer%surge.period;
   const danger=phase>=surge.telegraph&&phase<surge.telegraph+surge.active;
   const preparing=phase<surge.telegraph;
   const cx=WORLD.width/2,cy=WORLD.height/2;
   if(cx+surge.radius>view.x&&cx-surge.radius<view.x+view.w&&
    cy+surge.radius>view.y&&cy-surge.radius<view.y+view.h){
    ring(c,cx,cy,surge.radius,danger?'rgba(255,117,159,.96)':
     preparing?'rgba(247,182,255,.78)':'rgba(188,163,245,.23)',danger?7:3);
    if(preparing){
     c.beginPath();c.arc(cx,cy,surge.radius-8,-Math.PI/2,
      -Math.PI/2+TAU*clamp(phase/surge.telegraph,0,1));
     c.strokeStyle='#f8ddff';c.lineWidth=5;c.stroke();
    }
   }
  }
 }
}
function drawObjectiveCompass(c,s,view){
 const obj=s.expedition;
 if(!obj||obj.status!=='active')return;
 const items=obj.type==='portals'?obj.items.filter(q=>q.active):
  obj.type==='seals'?obj.items.filter(q=>!q.done):
  obj.target?[obj.target]:[];
 c.save();
 for(const q of items){
  const px=q.x-view.x,py=q.y-view.y;
  if(px>38&&px<view.w-38&&py>104&&py<view.h-45)continue;
  const dx=px-view.w/2,dy=py-view.h/2;
  const limitX=view.w/2-31,limitTop=Math.max(112,view.h*.13),limitBottom=view.h-43;
  const factor=Math.min(limitX/Math.max(1,Math.abs(dx)),
   (dy<0?(view.h/2-limitTop):(limitBottom-view.h/2))/Math.max(1,Math.abs(dy)));
  const x=clamp(view.w/2+dx*factor,24,view.w-24);
  const y=clamp(view.h/2+dy*factor,limitTop,limitBottom);
  const a=Math.atan2(dy,dx);
  c.translate(x,y);c.rotate(a);
  polygon(c,[[12,0],[-6,-8],[-3,0],[-6,8]],'#f6d4a4','#49314d');
  c.rotate(-a);c.translate(-x,-y);
 }
 c.restore();
}
export function drawArena(ctx,s,view,quality='auto'){
 const {w,h,x,y}=view;if(!w||!h)return;
 ctx.save();
 ctx.fillStyle='#050710';ctx.fillRect(0,0,w,h);
 ctx.translate(-x,-y);
 floor(ctx,s,view,quality);
 drawExpedition(ctx,s,view,quality);
 drawHazards(ctx,s,view,quality);
 for(const orb of s.orbs){
  if(orb.x<x-20||orb.x>x+w+20||orb.y<y-20||orb.y>y+h+20)continue;
  if(quality!=='low')glow(ctx,orb.x,orb.y,22,'rgba(108,247,214,.2)');
  circle(ctx,orb.x,orb.y,orb.r,'#80f9cd');ring(ctx,orb.x,orb.y,orb.r+4,'rgba(99,229,218,.4)');
 }
 for(const e of s.enemies)if(e.x>x-90&&e.x<x+w+90&&e.y>y-90&&e.y<y+h+90)enemy(ctx,e,s,quality);
 // Warnings are tied to locked combat aim angles, not visual guesses:
 // dodging the indicated path now dodges the actual projectile trajectory.
 for(const e of s.enemies){
  if(e.x>x-620&&e.x<x+w+620&&e.y>y-620&&e.y<y+h+620)
   warnAttack(ctx,e,quality);
 }
 for(const b of s.shots)if(b.x>x-50&&b.x<x+w+50&&b.y>y-50&&b.y<y+h+50)projectile(ctx,b,false,quality);
 for(const b of s.hostile)if(b.x>x-50&&b.x<x+w+50&&b.y>y-50&&b.y<y+h+50)projectile(ctx,b,true,quality);
 for(const fx of s.effects){
  if(fx.x<x-70||fx.x>x+w+70||fx.y<y-90||fx.y>y+h+70)continue;
  const alpha=clamp(fx.t*1.6,0,.8);
  if(['nova','freeze','cleave','sovereignSlash','aegis','storm','evolution','bossEntrance','wardHit','portalHit','portalDestroyed',
   'expeditionComplete','seal','bossEnrage'].includes(fx.kind)){
   drawAwakeningEffect(ctx,fx,quality);continue;
  }
  if(fx.kind==='number'){
   ctx.save();ctx.font='bold 14px ui-sans-serif,system-ui,sans-serif';
   ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(8,8,23,.9)';
   const yy=fx.y-(.55-fx.t)*33;
   ctx.strokeText(String(fx.value),fx.x,yy);
   ctx.fillStyle='rgba(245,215,255,'+clamp(fx.t*1.5,0,1)+')';
   ctx.fillText(String(fx.value),fx.x,yy);ctx.restore();
   continue;
  }
  const r=fx.size*(1+(0.6-fx.t)*1.8);
  const color=fx.kind==='hurt'?'rgba(255,103,115,'+alpha+')':
    fx.kind==='death'?'rgba(159,235,222,'+alpha+')':'rgba(209,157,255,'+alpha+')';
  ring(ctx,fx.x,fx.y,r,color,2.5);
  if(fx.kind==='death'&&quality!=='low'){
   const sparks=5;
   for(let i=0;i<sparks;i++){
    const angle=i*TAU/sparks+fx.x*.02,dist=r*.75;
    circle(ctx,fx.x+Math.cos(angle)*dist,fx.y+Math.sin(angle)*dist,2.3,color);
   }
  }
 }
 hero(ctx,s.player,s,quality);
 ctx.restore();
 drawObjectiveCompass(ctx,s,view);
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
   isBoss(e)?'#ff9498':'rgba(199,172,255,.84)');
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
