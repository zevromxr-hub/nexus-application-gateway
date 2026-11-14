// PROXIMUS v3.5.1 | Sonic Dimension — isolated settings and deterministic real-audio visual world engine.
// Never synthesizes music, records microphone audio or overrides old Reactor IV preferences.
export const SONIC_KEY='proximus-sonic-dimension-v1';
export const SONIC_SCHEMA='proximus.sonic-dimension/1';
export const SONIC_WORLDS=Object.freeze([
 {id:'nebula',name:'Nebula Collapse',color:'#a17aff',description:'An orbiting singularity, gravity rings and drifting starlight'},
 {id:'cyber',name:'Cyber Tunnel',color:'#46cfff',description:'Kinetic hyperspace corridors and bass-accelerated perspective'},
 {id:'celestial',name:'Celestial Gate',color:'#ffd18a',description:'Radiant celestial wings and a reactive light gateway'},
 {id:'ember',name:'Ember Storm',color:'#ff727e',description:'Energy eruptions, sparks and molten storms'},
 {id:'aurora',name:'Frozen Aurora',color:'#74f4e8',description:'Shifting light curtains, frost crystals and luminous snow'}
]);
const ids=new Set(SONIC_WORLDS.map(w=>w.id));
const clamp=(v,lo=0,hi=1,fallback=lo)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):fallback;
const clamp01=(v)=>clamp(v);
const hex=/^#[a-fA-F0-9]{6}$/;
export const isSonicWorld=id=>ids.has(id);
export function normalizeSonic(raw={}){
 const s=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 return {enabled:s.enabled===true,world:ids.has(s.world)?s.world:'nebula',
  intensity:Math.round(clamp(s.intensity,30,160,100)),
  autoCycle:s.autoCycle===true,linkedScene:s.linkedScene===true,
  beatColors:s.beatColors!==false};
}
export function sonicWorld(id){return SONIC_WORLDS.find(x=>x.id===id)||SONIC_WORLDS[0];}
export function nextSonicWorld(id){return SONIC_WORLDS[(Math.max(0,SONIC_WORLDS.findIndex(x=>x.id===id))+1)%SONIC_WORLDS.length].id;}
export function sonicBackup(settings){return {schema:SONIC_SCHEMA,app:'PROXIMUS | SONIC DIMENSION',version:'3.5.1',date:new Date().toISOString(),settings:normalizeSonic(settings)};}
export function readSonicBackup(data){
 if(!data||data.schema!==SONIC_SCHEMA||typeof data.settings!=='object'||Array.isArray(data.settings)||!data.settings)throw Error('Choose a valid Sonic Dimension settings JSON backup.');
 return normalizeSonic(data.settings);
}
export function sonicPerformance(quality='balanced',reducedMotion=false){
 if(reducedMotion)return {stars:18,particles:12,ribbons:3,spokes:9,animated:false};
 if(quality==='eco')return {stars:35,particles:26,ribbons:4,spokes:12,animated:true};
 if(quality==='cinema')return {stars:125,particles:95,ribbons:8,spokes:28,animated:true};
 return {stars:72,particles:55,ribbons:6,spokes:20,animated:true};
}
export function sonicLevels(bands={},now=0,lastKick=-10000,intensity=100,active=false){
 // No actual input means ALL measured frequency responses and beat flashes remain zero.
 const scalar=clamp(intensity,30,160,100)/100;
 const b=active?clamp01(bands.bass)*scalar:0,
  sub=active?clamp01(bands.sub)*scalar:0,
  mid=active?clamp01(bands.mid)*scalar:0,
  treble=active?clamp01(bands.treble)*scalar:0;
 const kick=active&&lastKick>=0&&now>=lastKick?Math.exp(-(now-lastKick)/310):0;
 return {bass:clamp(b),sub:clamp(sub),mid:clamp(mid),treble:clamp(treble),
  energy:clamp(sub*.2+b*.48+mid*.23+treble*.09),kick:clamp01(kick)};
}
export function shouldCycleSonic({autoCycle=false,active=false,beats=0,previousBeats=0,now=0,lastChangeAt=0}={}){
 return autoCycle&&active&&beats-previousBeats>=8&&now-lastChangeAt>=12000;
}
export function safeSonicColor(value,fallback='#a17aff'){return typeof value==='string'&&hex.test(value)?value.toLowerCase():fallback;}
const rgb=h=>{const s=safeSonicColor(h).slice(1);return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16));};
const rgba=(v,a)=>'rgba('+v.map(x=>Math.round(x)).join(',')+','+clamp(a)+')';
const mix=(a,b,ratio)=>a.map((n,i)=>n*(1-ratio)+b[i]*ratio);
const frac=n=>n-Math.floor(n);
export function drawSonicDimension(ctx,{world='nebula',now=0,width=960,height=540,bands={},lastKick=-10000,intensity=100,quality='balanced',active=false,reducedMotion=false,colorOverride=null,beatShift=0,customBackdrop=false,beatColors=true}={}){
 if(!ctx||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
 const selected=sonicWorld(world),perf=sonicPerformance(quality,reducedMotion),levels=sonicLevels(bands,now,lastKick,intensity,active);
 const base=rgb(safeSonicColor(colorOverride,selected.color)),high=mix(base,[255,255,255],.54),low=mix(base,[6,10,36],.7);
 const tones=beatColors&&active?[base,mix(base,[255,187,124],.43),mix(base,[87,252,237],.48)]:[base,base,base];
 const primary=tones[(Math.max(0,Number(beatShift)||0))%3],p=mix(primary,high,.2);
 const w=width,h=height,x=w/2,y=h/2,s=w/960,t=perf.animated?now/1000:0,k=levels.kick,e=levels.energy;
 ctx.save();
 try{
  // Existing custom backdrops and overlays remain visible below the dimension world.
  ctx.fillStyle='rgba(3,5,18,'+(customBackdrop?'.78':'.97')+')';ctx.fillRect(0,0,w,h);
  const grad=ctx.createRadialGradient(x,y,8*s,x,y,w*.71);
  grad.addColorStop(0,rgba(p,.26+e*.33+k*.22));
  grad.addColorStop(.42,rgba(low,.27+levels.mid*.25));
  grad.addColorStop(1,'rgba(2,5,18,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  // Deterministic starfield: no allocation or random jitter per animation frame.
  for(let i=0;i<perf.stars;i++){
   const seed=frac(i*.61803399),phase=i*2.39996;
   const radius=Math.sqrt(seed)*Math.min(w,h)*.74;
   const dx=Math.cos(phase+t*.017*(1+i%3))*radius*1.63,dy=Math.sin(phase+t*.013)*radius;
   const brightness=.14+frac(i*.431)*.36+levels.treble*.27;
   ctx.fillStyle=rgba(i%7===0?high:p,brightness);
   ctx.fillRect(x+dx,y+dy,Math.max(.75,s*(.7+i%3*.36)),Math.max(.75,s*(.7+i%3*.36)));
  }
  const ring=(rx,ry,alpha=1,widthLine=2)=>{
   ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);
   ctx.strokeStyle=rgba(p,alpha);ctx.lineWidth=Math.max(.7,widthLine*s);ctx.stroke();
  };
  if(selected.id==='nebula'){
   const spin=t*.10;
   ctx.save();ctx.translate(x,y);ctx.rotate(spin);ctx.translate(-x,-y);
   for(let i=0;i<11;i++){
    const r=(56+i*22)*(1+levels.sub*.16+k*.085)*s;
    ctx.beginPath();ctx.ellipse(x,y,r,r*(.53+i*.022),i*.20,0,Math.PI*2);
    ctx.strokeStyle=rgba(i%3===0?high:p,.09+i*.017+levels.bass*.19);ctx.lineWidth=(1.4+(i%4)*.3)*s;ctx.stroke();
   }
   ctx.restore();
   const center=ctx.createRadialGradient(x,y,4,x,y,(103+k*35)*s);
   center.addColorStop(0,'#050510');center.addColorStop(.32,'#04030e');
   center.addColorStop(.56,rgba(high,.62+e*.3));
   center.addColorStop(.65,rgba(p,.26+levels.bass*.28));
   center.addColorStop(1,'rgba(5,5,20,0)');
   ctx.fillStyle=center;ctx.beginPath();ctx.arc(x,y,(102+k*35)*s,0,Math.PI*2);ctx.fill();
   ring((126+k*72)*s,(87+k*54)*s,.28+k*.56,4+levels.bass*4);
  }else if(selected.id==='cyber'){
   const v=perf.animated?(t*(.48+levels.bass*1.2))%1:0;
   for(let i=13;i>=1;i--){
    const z=frac(i/13+v),depth=(.06+z*z*.95),hw=w*.62*depth,hh=h*.56*depth;
    ctx.beginPath();ctx.moveTo(x-hw,y-hh);ctx.lineTo(x+hw,y-hh);ctx.lineTo(x+hw,y+hh);ctx.lineTo(x-hw,y+hh);ctx.closePath();
    ctx.strokeStyle=rgba(i%3===0?high:p,.13+(1-depth)*.45+k*.22);ctx.lineWidth=(1+depth*3+e*3)*s;ctx.stroke();
   }
   for(let j=0;j<perf.spokes;j++){
    const a=j*Math.PI*2/perf.spokes;
    ctx.beginPath();ctx.moveTo(x+Math.cos(a)*20*s,y+Math.sin(a)*15*s);
    ctx.lineTo(x+Math.cos(a)*w*.8,y+Math.sin(a)*h*.8);
    ctx.strokeStyle=rgba(low,.22+levels.treble*.3);ctx.lineWidth=s*1.3;ctx.stroke();
   }
   ring((30+k*40)*s,(30+k*40)*s,.28+k*.6,3+e*6);
  }else if(selected.id==='celestial'){
   const gate=(110+levels.sub*27+k*30)*s;
   for(const wing of [-1,1]){
    ctx.save();ctx.translate(x,y);
    for(let i=0;i<10;i++){
     const reach=(.11+i*.029)*w,raise=(.13+i*.015)*h;
     ctx.beginPath();ctx.moveTo(0,35*s);
     ctx.bezierCurveTo(wing*reach*.58,-raise*1.75,wing*reach*1.26,-raise*.80,wing*reach,-raise*.30+levels.mid*20*s);
     ctx.strokeStyle=rgba(i%3===0?high:p,.15+i*.035+levels.mid*.25);
     ctx.lineWidth=(2.5+e*4)*s;ctx.stroke();
    }
    ctx.restore();
   }
   for(let i=0;i<6;i++)ring(gate*(1+i*.16),gate*(.75+i*.1),.12+i*.048+k*.16,1.3+i*.28);
   const beam=ctx.createLinearGradient(x-45*s,0,x+45*s,0);
   beam.addColorStop(0,'rgba(0,0,0,0)');
   beam.addColorStop(.5,rgba(high,.23+levels.mid*.35+k*.2));
   beam.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=beam;ctx.fillRect(x-50*s,y-h*.42,100*s,h*.84);
  }else if(selected.id==='ember'){
   for(let j=0;j<9;j++){
    ctx.beginPath();
    const startX=w*(.12+j*.095),offset=Math.sin(t*.75+j)*w*.045;
    ctx.moveTo(startX,h*.92);
    ctx.bezierCurveTo(startX+offset,h*.70,startX-offset,h*.22,startX+Math.sin(t+j)*w*.07,h*.18);
    ctx.lineWidth=(3+(j%3)+levels.bass*10)*s;
    ctx.strokeStyle=rgba(j%2?high:p,.11+levels.bass*.42+k*.22);ctx.stroke();
   }
   for(let i=0;i<perf.particles;i++){
    const seed=frac(i*.754877666),cycle=frac(seed+t*(.029+(i%5)*.006)*(1+levels.bass));
    const px=w*(frac(i*.6180339)),py=h*(1-cycle);
    const drift=Math.sin(t*.62+i)*25*s;
    ctx.fillStyle=rgba(i%4===0?high:p,.18+levels.treble*.38+k*.18);
    ctx.beginPath();ctx.arc(px+drift,py,(1+(i%3)+e*2.8)*s,0,Math.PI*2);ctx.fill();
   }
   ring((112+k*65)*s,(60+k*45)*s,.16+k*.65,3+levels.bass*6);
  }else if(selected.id==='aurora'){
   for(let layer=0;layer<perf.ribbons;layer++){
    const start=h*(.10+layer*.11),amp=h*(.055+levels.mid*.13);
    ctx.beginPath();
    for(let xx=0;xx<=w+12*s;xx+=Math.max(6,12*s)){
     const yy=start+Math.sin(xx/w*8+t*.62+layer*.7)*amp+Math.cos(xx/w*3-t*.35+layer)*amp*.6;
     if(xx===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
    }
    ctx.strokeStyle=rgba(layer%2?high:p,.18+levels.mid*.37+k*.12);
    ctx.lineWidth=(2.5+layer*.9+levels.bass*3)*s;ctx.stroke();
   }
   ctx.save();ctx.translate(x,y);ctx.rotate(t*.045);
   for(let i=0;i<6;i++){
    const ang=i*Math.PI/3,r=(90+levels.sub*60+k*45)*s;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(ang)*r,Math.sin(ang)*r);
    ctx.strokeStyle=rgba(high,.18+levels.treble*.48);ctx.lineWidth=(1.8+e*2)*s;ctx.stroke();
   }
   ctx.restore();
   ring((85+k*42)*s,(85+k*42)*s,.26+k*.42,2.2);
  }
  // Real measured kicks add a transient impact ring. Idle renders only ambience.
  if(k>.02){
   const r=(104+(1-k)*185)*s;
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.lineWidth=(1+k*10)*s;
   ctx.strokeStyle=rgba(high,.48*k);ctx.stroke();
   ctx.fillStyle=rgba(high,.085*k);ctx.fillRect(0,0,w,h);
  }
 }finally{ctx.restore();}
 return levels;
}
