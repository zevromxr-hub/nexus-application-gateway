// PROXIMUS | ASSET ALCHEMIST — QR & Digital Branding
// True QR byte-mode codewords, Reed–Solomon ECC and ISO mask/format bits.
// Supports QR versions 3-L (53 UTF-8 bytes) and 5-L (106 UTF-8 bytes).
import {$,stem,download,blobCanvas,wrap} from './core.js';
import {saveOrShare} from './portable-kit.js';
const CONFIG=[{version:3,size:29,data:55,ecc:15,max:53,alignment:22},{version:5,size:37,data:108,ecc:26,max:106,alignment:30}];
const mul=(a,b)=>{let x=0;for(let i=7;i>=0;i--){x=(x<<1)^((x&0x80)?0x11d:0);x&=255;if((b>>i)&1)x^=a;a=(a<<1)^((a&0x80)?0x11d:0);a&=255;}return x;};
// GF(256) multiplication: logarithmic-free Russian peasant arithmetic.
const gf=(a,b)=>{let v=0;while(b){if(b&1)v^=a;a=(a<<1)^((a&0x80)?0x11d:0);b>>=1;}return v&255;};
function rs(data,ecc){
 let poly=[1];
 for(let i=0,x=1;i<ecc;i++){
  const next=Array(poly.length+1).fill(0);
  for(let j=0;j<poly.length;j++){next[j]^=poly[j];next[j+1]^=gf(poly[j],x);}
  poly=next;x=gf(x,2);
 }
 const rem=Array(ecc).fill(0);
 for(const byte of data){
  const factor=byte^rem.shift();rem.push(0);
  for(let j=0;j<ecc;j++)rem[j]^=gf(poly[j+1],factor);
 }
 return rem;
}
function codewords(bytes,config){
 const bit=[];const put=(v,n)=>{for(let i=n-1;i>=0;i--)bit.push((v>>i)&1);};
 put(4,4);put(bytes.length,8);for(const byte of bytes)put(byte,8);
 put(0,Math.min(4,config.data*8-bit.length));while(bit.length%8)bit.push(0);
 const data=[];for(let i=0;i<bit.length;i+=8)data.push(bit.slice(i,i+8).reduce((n,b)=>(n<<1)|b,0));
 while(data.length<config.data)data.push(data.length%2===0?0xec:0x11);
 return [...data,...rs(data,config.ecc)];
}
export function qrMatrix(value){
 const bytes=new TextEncoder().encode(String(value||''));
 const config=CONFIG.find(x=>bytes.length<=x.max);
 if(!config||bytes.length===0)throw Error('Enter 1–106 UTF-8 bytes for a scannable QR code.');
 const N=config.size,m=Array.from({length:N},()=>Array(N).fill(false)),fn=Array.from({length:N},()=>Array(N).fill(false));
 const set=(x,y,val)=>{if(x>=0&&y>=0&&x<N&&y<N){m[y][x]=!!val;fn[y][x]=true;}};
 function finder(cx,cy){
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
   const d=Math.max(Math.abs(dx),Math.abs(dy));
   set(cx+dx,cy+dy,d!==2&&d!==4);
  }
 }
 finder(3,3);finder(N-4,3);finder(3,N-4);
 // Timing, alignment, format reservations.
 for(let i=8;i<N-8;i++){set(i,6,i%2===0);set(6,i,i%2===0);}
 const a=config.alignment;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  const d=Math.max(Math.abs(dx),Math.abs(dy));set(a+dx,a+dy,d!==1);
 }
 for(let i=0;i<=8;i++)if(i!==6){set(8,i,false);set(i,8,false);}
 for(let i=0;i<8;i++){set(N-1-i,8,false);set(8,N-1-i,false);}
 set(8,N-8,true);
 const all=codewords(bytes,config).flatMap(b=>Array.from({length:8},(_,i)=>(b>>(7-i))&1));
 let index=0;
 for(let right=N-1;right>=1;right-=2){
  if(right===6)right=5;
  for(let j=0;j<N;j++){
   const up=(((right+1)&2)===0),y=up?N-1-j:j;
   for(let dx=0;dx<2;dx++){
    const x=right-dx;
    if(fn[y][x])continue;
    m[y][x]=index<all.length?!!all[index++]:false;
   }
  }
 }
 if(index<all.length)throw Error('QR payload does not fit in the selected version.');
 const fmt=mask=>{const v=(1<<3)|mask;let data=v<<10;
  for(let i=14;i>=10;i--)if((data>>i)&1)data^=0x537<<(i-10);
  return ((v<<10)|data)^0x5412;
 };
 function applyMask(mask){
  const out=m.map(row=>row.slice());
  const predicate=(x,y)=>{
   switch(mask){case 0:return(x+y)%2===0;case 1:return y%2===0;case 2:return x%3===0;
    case 3:return(x+y)%3===0;case 4:return(Math.floor(y/2)+Math.floor(x/3))%2===0;
    case 5:return((x*y)%2+(x*y)%3)===0;case 6:return((x*y)%2+(x*y)%3)%2===0;
    default:return((x+y)%2+(x*y)%3)%2===0;}
  };
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!fn[y][x]&&predicate(x,y))out[y][x]=!out[y][x];
  const f=fmt(mask),bit=i=>!!((f>>i)&1);
  for(let i=0;i<=5;i++)out[i][8]=bit(i);
  out[7][8]=bit(6);out[8][8]=bit(7);out[8][7]=bit(8);
  for(let i=9;i<15;i++)out[8][14-i]=bit(i);
  for(let i=0;i<8;i++)out[8][N-1-i]=bit(i);
  for(let i=8;i<15;i++)out[N-15+i][8]=bit(i);
  out[N-8][8]=true;
  return out;
 }
 function penalty(out){
  let score=0;
  for(const row of out){
   let run=1;for(let i=1;i<N;i++){if(row[i]===row[i-1]){run++;if(run===5)score+=3;else if(run>5)score++;}else run=1;}
  }
  for(let x=0;x<N;x++){
   let run=1;for(let y=1;y<N;y++){if(out[y][x]===out[y-1][x]){run++;if(run===5)score+=3;else if(run>5)score++;}else run=1;}
  }
  for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++)if(out[y][x]===out[y][x+1]&&out[y][x]===out[y+1][x]&&out[y][x]===out[y+1][x+1])score+=3;
  const dark=out.reduce((s,row)=>s+row.filter(Boolean).length,0);
  score+=Math.floor(Math.abs(dark*20-N*N*10)/(N*N))*10;
  return score;
 }
 let best=null,bestScore=Infinity;
 for(let mask=0;mask<8;mask++){const candidate=applyMask(mask),score=penalty(candidate);if(score<bestScore){best=candidate;bestScore=score;}}
 return best;
}
export function qrSvg(matrix,{dark='#211233',light='#ffffff',quiet=4,scale=12}={}){
 const n=matrix.length,size=(n+quiet*2)*scale;
 const esc=s=>String(s).replace(/[^#a-zA-Z0-9]/g,'');
 let path='';
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(matrix[y][x])path+='M'+(x+quiet)+' '+(y+quiet)+'h1v1h-1z';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(n+quiet*2)+' '+(n+quiet*2)+'" width="'+size+'" height="'+size+'"><rect width="100%" height="100%" fill="'+esc(light)+'"/><path d="'+path+'" fill="'+esc(dark)+'"/></svg>';
}
export function initQRStudio(app){
 const canvas=$('qrCanvas'),ctx=canvas.getContext('2d'),status=$('qrStatus');
 let lastMatrix=null;
 function draw(){
  const value=$('qrText').value.trim();if(!value){status.textContent='Enter a URL or short message to create a QR code.';return;}
  const matrix=qrMatrix(value),n=matrix.length,quiet=4;
  const size=canvas.width,cell=size/(n+quiet*2);
  ctx.fillStyle=$('qrLight').value;ctx.fillRect(0,0,size,size);
  ctx.fillStyle=$('qrDark').value;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(matrix[y][x])ctx.fillRect(Math.floor((x+quiet)*cell),Math.floor((y+quiet)*cell),Math.ceil(cell+.2),Math.ceil(cell+.2));
  lastMatrix=matrix;status.textContent=n+'×'+n+' scannable QR · '+new TextEncoder().encode(value).length+' bytes';
 }
 $('qrGenerate').addEventListener('click',wrap(draw));
 async function exportQR(kind){
  if(!lastMatrix)draw();
  if(!lastMatrix)throw Error('Enter QR content first.');
  const blob=await blobCanvas(canvas),name=stem($('qrFileName').value||'PROXIMUS-QR')+'.png';
  if(kind==='pack')app.addAsset(name,blob,'QR Studio');
  else if(kind==='share')await saveOrShare(blob,name);else download(blob,name);
  status.textContent='QR artwork prepared · '+name;
 }
 $('qrExport').addEventListener('click',wrap(()=>exportQR('download')));
 $('qrShare').addEventListener('click',wrap(()=>exportQR('share')));
 $('qrPack').addEventListener('click',wrap(()=>exportQR('pack')));
 $('qrSVG').addEventListener('click',wrap(()=>{
  if(!lastMatrix)draw();if(!lastMatrix)throw Error('Enter a QR value first.');
  const svg=qrSvg(lastMatrix,{dark:$('qrDark').value,light:$('qrLight').value});
  download(new Blob([svg],{type:'image/svg+xml'}),stem($('qrFileName').value||'PROXIMUS-QR')+'.svg');
 }));
 for(const id of ['qrDark','qrLight'])$(id).addEventListener('change',wrap(draw));
 $('qrCard').addEventListener('click',wrap(async()=>{
  if(!lastMatrix)draw();if(!lastMatrix)throw Error('Generate the QR code first.');
  const card=document.createElement('canvas');card.width=1000;card.height=560;
  const c=card.getContext('2d'),g=c.createLinearGradient(0,0,1000,560);
  g.addColorStop(0,'#24133e');g.addColorStop(1,'#090a1c');c.fillStyle=g;c.fillRect(0,0,1000,560);
  c.strokeStyle='#a675ef';c.lineWidth=4;c.strokeRect(22,22,956,516);
  c.fillStyle='#d2acff';c.font='900 26px system-ui';c.fillText('PROXIMUS · DIGITAL CARD',64,98);
  c.fillStyle='#ffffff';c.font='bold 48px system-ui';c.fillText(($('qrCardTitle').value||'Digital Connection').slice(0,25),64,205);
  c.fillStyle='#c8b7de';c.font='26px system-ui';c.fillText(($('qrCardDetail').value||'SCAN TO CONNECT').slice(0,35),64,258);
  c.fillStyle='#fff';c.fillRect(614,79,318,318);c.drawImage(canvas,626,91,294,294);
  c.fillStyle='#b3a3ce';c.font='18px system-ui';c.fillText('POWERED BY ZEVRO | PROXIMUS',64,475);
  const blob=await blobCanvas(card);download(blob,'PROXIMUS-DIGITAL-CARD.png');
  app.addAsset('PROXIMUS-DIGITAL-CARD.png',blob,'QR Studio');
 }));
}
