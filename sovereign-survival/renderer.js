/* SOVEREIGN SURVIVAL v1.7 CHARACTER ASCENSION — champion-specific weapon silhouettes and mastery VFX.
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
function drawChampionArmament(c,p,side,edge,metal,accent){
 const champion=p.champion||'warden',weapon=p.weaponSkin||'signature';
 const moon=weapon==='astral',fang=weapon==='dominion';
 const blade=moon?'#bafaff':fang?'#ff807c':edge;
 const core=moon?'#6ba4ed':fang?'#772a47':metal;
 const highlight=moon?'#f5ffff':fang?'#ffd7af':accent;
 if(champion==='sentinel'&&side<0){
  // Shield-bearing sentinel: a layered diamond buckler replaces the second sword.
  polygon(c,[[-3,-47],[-19,-29],[-15,-7],[-3,6],[11,-8],[14,-30]],
   core,blade);
  polygon(c,[[-3,-40],[-11,-25],[-9,-14],[-3,-5],[6,-15],[7,-28]],
   '#244960',highlight);
  polygon(c,[[-3,-38],[3,-21],[-3,-8],[-9,-21]],highlight);
  if(fang)polygon(c,[[-21,-32],[-31,-47],[-17,-36]],'#6c2331',blade);
 }else if(champion==='sentinel'){
  // A long crystalline glaive and narrow spearhead, held over the shoulder.
  line(c,[[4,17],[4,-64]],core,6);
  line(c,[[4,17],[4,-64]],blade,2);
  polygon(c,[[4,-85],[16,-60],[4,-41],[-8,-60]],highlight,blade);
  polygon(c,[[4,-85],[8,-59],[4,-49]],'#ffffff');
  polygon(c,[[-7,-53],[-16,-69],[-10,-44]],core,blade);
  polygon(c,[[15,-53],[23,-69],[18,-44]],core,blade);
 }else if(champion==='reaver'&&side>0){
  // A broad slashing cleaver with chipped flame teeth.
  line(c,[[4,17],[4,-49]],'#40252a',9);
  line(c,[[4,18],[4,-54]],blade,3);
  polygon(c,[[-6,-79],[20,-72],[25,-45],[11,-29],[4,-39],[-9,-53]],
   core,highlight);
  polygon(c,[[-7,-75],[4,-87],[9,-74]],highlight,blade);
  polygon(c,[[13,-69],[29,-83],[23,-55]],highlight,blade);
  line(c,[[5,-68],[16,-56],[11,-41]],blade,3);
 }else if(champion==='reaver'){
  // Offhand flame dagger deliberately differs from the main cleaver.
  line(c,[[4,15],[4,-31]],'#492322',7);
  polygon(c,[[4,-67],[15,-42],[4,-27],[-7,-42]],core,blade);
  polygon(c,[[4,-66],[8,-47],[4,-36]],highlight);
  if(fang)polygon(c,[[12,-37],[23,-52],[14,-29]],'#a02f38',blade);
 }else{
  // Void Warden: dual inward-curved crescent sickles.
  line(c,[[4,17],[4,-30]],'#21192e',8);
  line(c,[[4,17],[4,-32]],blade,3);
  polygon(c,[[4,-32],[side*11,-44],[side*23,-68],
    [side*17,-86],[side*24,-56],[side*14,-37]],core,blade);
  polygon(c,[[side*10,-40],[side*21,-64],[side*18,-78],
    [side*27,-63],[side*20,-41]],highlight,blade);
  polygon(c,[[4,-31],[side*17,-44],[side*9,-27]],'#f0defd');
 }
 // Unique inlaid arcane marks carry across all champions, all skins.
 line(c,[[-8,-18],[17,-18]],blade,4);
 circle(c,4,-18,4,highlight);
 if(fang){
  for(let i=0;i<2;i++){
   const y=-28-i*15;
   polygon(c,[[side*5,y],[side*18,y-8],[side*14,y+6]],'#8e2b40',blade);
  }
 }else if(moon){
  circle(c,4,-39,3,'#eeffff');
  line(c,[[1,-34],[7,-44]],'#f4ffff',2);
 }
}
function hero(c,p,s,quality='low',portrait=false){
 const frost=p.champion==='sentinel',ember=p.champion==='reaver';
 const crowned=p.modelStyle==='crowned',eclipse=p.modelStyle==='eclipse';
 const accent=frost?'#9ce9f5':ember?'#ffab69':'#bd92ff';
 const edge=crowned?'#fff1bd':eclipse?'#b58be9':frost?'#9defff':ember?'#ffb37e':'#c7a5fd';
 const metal=crowned?'#f2e5ce':eclipse?'#56547c':frost?'#adcbdc':ember?'#c89b86':'#aaa2c0';
 const shade=crowned?'#7b6f72':eclipse?'#171a36':frost?'#28495d':ember?'#56353e':'#37304e';
 const mantle=crowned?'#654e57':eclipse?'#17122d':frost?'#17334f':ember?'#441e2e':'#27183c';
 const eye=crowned?'#ffecc1':frost?'#ddfcff':ember?'#ffe1a5':'#d9c7ff';
 const move=clamp(p.moving||0,0,1),dash=p.dashTime>0;
 const gait=Math.sin((p.stride||0)*1.3)*move,mirror=Math.cos((p.stride||0)*1.3)*move;
 const swing=clamp(p.attackPulse||0,0,1),breath=Math.sin(s.time*2.4)*1.3;
 const flare=quality!=='low';
 c.save();c.translate(p.x,p.y);
 // Contact shadow anchors the character firmly to the arena floor.
 c.beginPath();c.ellipse(4,21,32,18,0,0,TAU);c.fillStyle='rgba(0,0,0,.53)';c.fill();
 if(dash){
  const a=p.angle+Math.PI/2;
  line(c,[[-Math.cos(a)*20,-Math.sin(a)*20],[-Math.cos(a)*83,-Math.sin(a)*83]],
    'rgba(144,225,255,.38)',20);
 }
 if(flare)glow(c,0,-7,dash?112:76,
  crowned?'rgba(255,218,145,.16)':eclipse?'rgba(145,99,244,.19)':
  frost?'rgba(94,210,255,.14)':ember?'rgba(250,94,61,.15)':'rgba(150,90,245,.15)');
 ring(c,0,0,30+Math.sin(s.time*2)*1.2,dash?'rgba(129,234,255,.75)':
  crowned?'rgba(245,215,159,.43)':'rgba(169,139,223,.33)',dash?3:1.6);
 c.rotate(p.angle+Math.PI/2);
 // Animated cloak and asymmetrical cloth at the back create a strong silhouette.
 const capeWave=Math.sin(s.time*2.5+gait)*4+(dash?9:0);
 polygon(c,[[-19,-18],[-31,4],[-36,31],[-24,40+capeWave],[-5,32],
  [5,33],[24,40-capeWave],[36,31],[31,4],[19,-18]],
  mantle,edge);
 polygon(c,[[-15,6],[-28,39+capeWave],[-13,35],[-4,13]],
  eclipse?'#46345e':crowned?'#aa7283':frost?'#225879':ember?'#8d3a48':'#5e3d86');
 polygon(c,[[15,6],[28,39-capeWave],[13,35],[4,13]],
  eclipse?'#352959':crowned?'#b68e77':frost?'#2a587b':ember?'#79313e':'#45316b');
 // Gait is visible even at phone dimensions; two independently moving greaves.
 for(const side of [-1,1]){
  const step=side*gait*5,heel=side*mirror*3;
  polygon(c,[[side*6,11],[side*19,13],[side*20+heel,32+step],
   [side*12+heel,39+step],[side*5,26]],shade,metal);
  polygon(c,[[side*10+heel,26+step],[side*21+heel,29+step],
   [side*24+heel,43+step],[side*10+heel,44+step]],metal,edge);
  line(c,[[side*12+heel,34+step],[side*21+heel,35+step]],edge,1.5);
 }
 // Outer pauldrons are heavy armor, rather than a flat triangle.
 polygon(c,[[-21,-19],[-32,-24],[-41,-7],[-34,7],[-22,12],[-15,-2]],shade,edge);
 polygon(c,[[21,-19],[32,-24],[41,-7],[34,7],[22,12],[15,-2]],shade,edge);
 polygon(c,[[-23,-17],[-33,-17],[-35,-8],[-25,3]],metal,edge);
 polygon(c,[[23,-17],[33,-17],[35,-8],[25,3]],metal,edge);
 if(frost){
  polygon(c,[[-34,-19],[-44,-40],[-29,-30],[-25,-9]],'#72b9d2','#e6ffff');
  polygon(c,[[34,-19],[44,-40],[29,-30],[25,-9]],'#72b9d2','#e6ffff');
 }else if(ember){
  polygon(c,[[-33,-20],[-47,-31],[-40,-11],[-32,-4]],'#9e3937','#ffc07a');
  polygon(c,[[33,-20],[47,-31],[40,-11],[32,-4]],'#9e3937','#ffc07a');
 }else{
  polygon(c,[[-30,-24],[-39,-32],[-27,-29]],'#503479',edge);
  polygon(c,[[30,-24],[39,-32],[27,-29]],'#503479',edge);
 }
 // Segmented cuirass, chest sigil and carved waist plates.
 polygon(c,[[-22,-20],[0,-29],[22,-20],[24,7],[14,25],[-14,25],[-24,7]],
   '#171c2f',edge);
 polygon(c,[[-19,-14],[0,-22],[19,-14],[17,5],[0,14],[-17,5]],metal,edge);
 polygon(c,[[-17,-7],[0,-14],[17,-7],[14,4],[0,12],[-14,4]],
   shade,edge);
 polygon(c,[[-19,13],[0,19],[19,13],[16,29],[0,25],[-16,29]],shade,metal);
 line(c,[[-18,11],[18,11]],edge,3);
 circle(c,0,15,5,crowned?'#ffe9a9':accent);
 polygon(c,[[0,-14],[8,-4],[0,8],[-8,-4]],accent,'#fff1d8');
 circle(c,0,-4,3,'#fff6e9');
 // A readable helmet with cheek guards, a visor and two sharp eye lenses.
 polygon(c,[[-18,-29],[-13,-43],[0,-51],[13,-43],[18,-29],
  [14,-12],[0,-9],[-14,-12]],
  shade,edge);
 polygon(c,[[-11,-39],[0,-48],[11,-39],[9,-28],[0,-33],[-9,-28]],
   metal,edge);
 polygon(c,[[-16,-25],[-7,-21],[-3,-17],[-12,-15]],shade,metal);
 polygon(c,[[16,-25],[7,-21],[3,-17],[12,-15]],shade,metal);
 polygon(c,[[-11,-31],[-3,-28],[-3,-24],[-13,-26]],eye);
 polygon(c,[[11,-31],[3,-28],[3,-24],[13,-26]],eye);
 polygon(c,[[0,-43],[5,-35],[0,-21],[-5,-35]],crowned?'#ffeb9a':accent);
 if(crowned){
  polygon(c,[[-19,-42],[-25,-62],[-9,-52],[0,-70],[9,-52],[25,-62],[19,-42]],
   '#bda26d','#fff2c1');
  for(const x of [-17,0,17])circle(c,x,x===0?-56:-49,2.6,'#fff5d0');
 }else if(eclipse){
  polygon(c,[[-18,-42],[-25,-57],[-8,-48],[0,-60],[8,-48],[25,-57],[18,-42]],
   '#3c2b5d','#cba1ff');
 }else if(frost){
  polygon(c,[[-15,-44],[-30,-60],[-15,-54]],'#78deef','#edffff');
  polygon(c,[[15,-44],[30,-60],[15,-54]],'#78deef','#edffff');
 }else if(ember){
  polygon(c,[[0,-48],[9,-65],[13,-49]],'#ff936a','#ffe1a0');
  polygon(c,[[-14,-42],[-25,-53],[-17,-36]],'#a95948','#ffbd83');
 }else{
  polygon(c,[[-17,-42],[-20,-53],[-9,-46]],'#412b66',edge);
  polygon(c,[[17,-42],[20,-53],[9,-46]],'#412b66',edge);
 }
 // The original tiny strokes become genuine articulated hands and swords.
 for(const side of [-1,1]){
  const armSwing=side*(swing*15)+(side*gait*3);
  c.save();c.translate(side*27,-3);c.rotate(side*(.13+gait*.10+swing*(side===(p.shotSide?1:-1)?0.50:0.15)));
  polygon(c,[[side*-4,-5],[side*7,-11],[side*11,7+armSwing*.08],
   [side*4,15+armSwing*.08],[side*-8,9]],shade,edge);
  polygon(c,[[side*-3,8],[side*8,6],[side*12,17],[side*1,22]],metal,edge);
  drawChampionArmament(c,p,side,edge,metal,accent);
  c.restore();
 }
 if(swing>.05){
  const opacity=Math.min(.88,swing*.82);
  c.beginPath();c.arc(0,-14,54,-Math.PI*.97,-Math.PI*.13);
  c.strokeStyle=crowned?'rgba(255,225,156,'+opacity+')':
   frost?'rgba(162,242,255,'+opacity+')':
   ember?'rgba(255,165,106,'+opacity+')':'rgba(209,157,255,'+opacity+')';
  c.lineWidth=3.5+swing*6;c.stroke();
 }
 if(p.masteryAwakened){
  const masterColor=frost?'rgba(133,235,255,.92)':ember?'rgba(255,145,86,.9)':'rgba(218,167,255,.9)';
  ring(c,0,-12,55+Math.sin(s.time*4)*3,masterColor,2.4);
  if(flare)ring(c,0,-12,61,masterColor,1);
 }
 // Visual rank crest and mantle highlights in the rarer outfits.
 if(eclipse||crowned){
  const col=crowned?'rgba(255,234,166,.9)':'rgba(200,148,255,.9)';
  ring(c,0,-2,28,col,1.5);
  for(const side of [-1,1])line(c,[[side*30,15],[side*30,26+gait*2]],col,2);
 }
 c.restore();
 if(p.barrierTime>0){
  const shimmer=.58+.18*Math.sin(s.time*6);
  ring(c,p.x,p.y,47+Math.sin(s.time*5)*2,'rgba(153,245,255,'+shimmer+')',4);
  ring(c,p.x,p.y,54,'rgba(184,246,255,.22)',2);
  if(flare)glow(c,p.x,p.y,82,'rgba(101,228,251,.12)');
 }
 if(s.evolutions?.ward&&p.aegisCooldown<=0)
  ring(c,p.x,p.y,39,'rgba(255,217,166,.5)',2);
 if(p.invulnerable>0)
  ring(c,p.x,p.y,40+Math.min(1,p.invulnerable)*10,'rgba(123,239,255,.65)',2.6);
 if(!portrait&&p.hp<p.maxHp){
  c.fillStyle='#141022';c.fillRect(p.x-27,p.y-74,54,6);
  c.fillStyle='#70f2b5';c.fillRect(p.x-27,p.y-74,54*clamp(p.hp/p.maxHp,0,1),6);
 }
}
export function drawChampionPreview(canvas,champion='warden',style='standard',weapon='signature'){
 if(!canvas)return;
 const ctx=canvas.getContext('2d');
 if(!ctx)return;
 const w=canvas.width,h=canvas.height;
 ctx.save();ctx.clearRect(0,0,w,h);
 const g=ctx.createRadialGradient(w*.5,h*.42,10,w*.5,h*.52,w*.66);
 g.addColorStop(0,style==='crowned'?'#594b40':style==='eclipse'?'#35274c':'#24314c');
 g.addColorStop(.65,'#14182a');g.addColorStop(1,'#090f19');
 ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 for(let i=0;i<12;i++){
  const a=i*TAU/12;
  line(ctx,[[w*.5+Math.cos(a)*w*.23,h*.54+Math.sin(a)*w*.23],
    [w*.5+Math.cos(a)*w*.29,h*.54+Math.sin(a)*w*.29]],
    style==='crowned'?'rgba(255,223,169,.30)':'rgba(183,158,246,.26)',2);
 }
 ring(ctx,w*.5,h*.54,w*.24,'rgba(189,173,228,.27)',2);
 ctx.translate(w*.5,h*.56);
 const k=Math.min(w/127,h/172);
 ctx.scale(k,k);
 hero(ctx,{x:0,y:0,champion,modelStyle:style,weaponSkin:weapon,angle:-Math.PI/2,
  hp:100,maxHp:100,fireCooldown:0,rate:.26,attackPulse:.05,
  moving:0,stride:1.2,invulnerable:0,dashTime:0,barrierTime:0,
  aegisCooldown:2}, {time:1.17,evolutions:{}},'high',true);
 ctx.restore();
}
function projectile(c,b,hostile,quality){
 const hex=b.kind==='hexer';
 const color=hostile?(hex?'#ff8dd6':'#ffab85'):
  b.storm?'#9af8ff':b.weapon==='astral'?'#d9fdff':
  b.weapon==='dominion'?'#ffb1a0':b.element==='sentinel'?'#a7ecff':
  b.element==='reaver'?'#ffc07d':'#dfb8ff';
 if(quality!=='low')glow(c,b.x,b.y,22,hostile?(hex?'rgba(233,82,191,.24)':'rgba(255,111,106,.24)'):'rgba(162,118,255,.21)');
 line(c,[[b.x-b.vx*.022,b.y-b.vy*.022],[b.x,b.y]],
  hostile?(hex?'rgba(245,138,237,.8)':'rgba(255,121,88,.75)'):
   b.storm?'rgba(114,240,255,.9)':b.element==='reaver'?
   'rgba(255,139,91,.85)':b.element==='sentinel'?
   'rgba(116,218,250,.82)':'rgba(183,137,255,.75)',hostile?5:4);
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
  const duration=fx.kind==='bossEntrance'?1.45:fx.kind==='evolution'||fx.kind==='masteryAwaken'?1.1:
   fx.kind==='aegis'?.85:.35;
  const progress=clamp(1-t/duration,0,1);
  const color=fx.kind==='storm'?'rgba(123,235,255,':
   fx.kind==='bossEntrance'?'rgba(255,110,151,':'rgba(255,217,151,';
  ring(c,fx.x,fx.y,24+progress*r,color+((1-progress)*.9)+')',5-progress*2);
  if((fx.kind==='evolution'||fx.kind==='bossEntrance'||fx.kind==='masteryAwaken')&&!small){
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
   'expeditionComplete','seal','bossEnrage','rareLoot','masteryAwaken'].includes(fx.kind)){
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
