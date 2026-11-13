// PROXIMUS Asset Alchemist v2.3 — dependency-free GIF89a encoder.
// Converts true RGBA frames to palette-indexed, LZW compressed animated GIF bytes.
// No network, remote codec, GIF renaming, or external library.
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function u16(n){return[n&255,(n>>8)&255]}
function ascii(s){return Array.from(s,c=>c.charCodeAt(0))}
const PALETTE=Uint8Array.from({length:256*3},(_,p)=>{
 const i=Math.floor(p/3),chan=p%3;
 return chan===0?Math.round(((i>>5)&7)*255/7):
        chan===1?Math.round(((i>>2)&7)*255/7):
        Math.round((i&3)*255/3);
});
export function rgbaToIndexed(image,{transparent=false,dither=false}={}){
 const {data,width,height}=image;
 if(!data||data.length!==width*height*4)throw Error('Invalid RGBA frame');
 const out=new Uint8Array(width*height),BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const j=y*width+x,i=j*4;
  if(transparent&&data[i+3]<128){out[j]=0;continue;}
  const d=dither?(BAYER[(y&3)*4+(x&3)]-7.5)*2.5:0;
  const r=clamp(Math.round((data[i]+d)*7/255),0,7);
  const g=clamp(Math.round((data[i+1]+d)*7/255),0,7);
  const b=clamp(Math.round((data[i+2]+d)*3/255),0,3);
  const code=(r<<5)|(g<<2)|b;
  // Reserve 0 for transparency when requested; black remains nearly black.
  out[j]=transparent?Math.max(1,code):code;
 }
 return out;
}
export function lzwCompress(pixels){
 if(!pixels?.length)throw Error('Cannot GIF-encode an empty frame');
 const CLEAR=256,END=257,MAX=4096;
 let codes=new Map(),next=258,bits=9,word=0,used=0;
 const bytes=[];
 function emit(code){
  word|=code<<used;used+=bits;
  while(used>=8){bytes.push(word&255);word>>>=8;used-=8;}
 }
 function reset(){codes=new Map();next=258;bits=9;}
 emit(CLEAR);
 let phrase=pixels[0];
 for(let i=1;i<pixels.length;i++){
  const curr=pixels[i],key=phrase*256+curr,found=codes.get(key);
  if(found!==undefined){phrase=found;continue;}
  emit(phrase);
  if(next<MAX){
   codes.set(key,next++);
   if(next===(1<<bits)&&bits<12)bits++;
  }else{emit(CLEAR);reset();}
  phrase=curr;
 }
 emit(phrase);emit(END);if(used)bytes.push(word&255);
 return Uint8Array.from(bytes);
}
export function encodeGif({width,height,frames,loop=0,transparent=false,dither=false}){
 width=Math.round(width);height=Math.round(height);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>720||height>720||width*height>360000)throw Error('GIF dimensions must be within 720px and 360,000 pixels');
 if(!Array.isArray(frames)||frames.length<1||frames.length>120)throw Error('GIF needs 1–120 frames');
 // Hold typed chunks rather than an enormous JS number array, which is important
 // for higher-resolution exports on mobile browsers.
 const chunks=[Uint8Array.from([...ascii('GIF89a'),...u16(width),...u16(height),0xf7,0,0,...PALETTE])];
 chunks.push(Uint8Array.from([0x21,0xff,11,...ascii('NETSCAPE2.0'),3,1,...u16(clamp(Math.floor(loop),0,65535)),0]));
 for(const frame of frames){
  if(frame.width!==width||frame.height!==height)throw Error('Frame sizes do not match GIF dimensions');
  const indexed=rgbaToIndexed(frame,{transparent,dither});
  const duration=clamp(Math.round((Number(frame.delayMs)||100)/10),2,65535);
  chunks.push(Uint8Array.from([0x21,0xf9,4,transparent?0x09:0x08,...u16(duration),0,0,0x2c,0,0,0,0,...u16(width),...u16(height),0,8]));
  const bytes=lzwCompress(indexed);
  for(let start=0;start<bytes.length;start+=255){
   const part=bytes.subarray(start,start+255);
   chunks.push(Uint8Array.of(part.length),part);
  }
  chunks.push(Uint8Array.of(0));
 }
 chunks.push(Uint8Array.of(0x3b));
 return new Blob(chunks,{type:'image/gif'});
}
