// Dependency-free GIF89a encoder round-trip test; runs during release validation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const modulePath=path.resolve(import.meta.dirname,'../gif-codec.js');
const {encodeGif,rgbaToIndexed,lzwCompress}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(modulePath,'utf8')).toString('base64'));
function frame(w,h,seed){
 const data=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<w*h;i++){
  const k=i*4,x=i%w,y=Math.floor(i/w);
  data[k]=(x*17+y*11+seed*31)&255;
  data[k+1]=(x*21+y*9+seed*13)&255;
  data[k+2]=(x*7+y*29+seed*53)&255;
  data[k+3]=255;
 }
 return {width:w,height:h,data,delayMs:120};
}
function unzipFrame(codes,minCodeSize,w,h){
 const clear=1<<minCodeSize,end=clear+1,dict=[],expected=w*h;let bits=minCodeSize+1,next=clear+2,bit=0,old=null;
 const pixels=[];
 function reset(){dict.length=0;for(let i=0;i<clear;i++)dict[i]=[i];bits=minCodeSize+1;next=clear+2;old=null;}
 function read(){
  let v=0;for(let b=0;b<bits;b++){
   const byte=codes[bit>>3];if(byte===undefined)throw Error('Truncated GIF LZW bitstream');
   v|=((byte>>(bit&7))&1)<<b;bit++;
  }return v;
 }
 reset();
 while(bit+bits<=codes.length*8){
  const code=read();
  if(code===clear){reset();continue;}
  if(code===end)break;
  let entry=dict[code];
  if(!entry&&code===next&&old)entry=[...old,old[0]];
  if(!entry)throw Error('Invalid GIF LZW code '+code+' / next '+next+' at byte '+Math.floor(bit/8));
  pixels.push(...entry);
  if(old&&next<4096){
   dict[next++]=[...old,entry[0]];
   // GIF's code-size transition on the decoder is one code later
   // than the encoder dictionary insertion.
   if(next===(1<<bits)-1&&bits<12)bits++;
  }
  old=entry;
  if(pixels.length>expected+100)throw Error('Decoded GIF contains too many pixels.');
 }
 assert.equal(pixels.length,expected,'Decoded GIF frame should have exactly width×height pixels');
 return pixels;
}
function parseGif(bytes){
 let off=0;const header=String.fromCharCode(...bytes.subarray(0,6));
 assert.equal(header,'GIF89a');
 off=6;
 function u16(){const n=bytes[off]|bytes[off+1]<<8;off+=2;return n}
 const width=u16(),height=u16(),packed=bytes[off++];off+=2;
 if(packed&0x80)off+=3*(2**((packed&7)+1));
 let frameCount=0,delays=[],pixels=[];
 while(off<bytes.length){
  const b=bytes[off++];
  if(b===0x3b)break;
  if(b===0x21){
   const ext=bytes[off++];
   if(ext===0xf9){const len=bytes[off++];assert.equal(len,4);off++;delays.push(bytes[off]|bytes[off+1]<<8);off+=3;assert.equal(bytes[off++],0);}
   else{while(true){const len=bytes[off++];if(!len)break;off+=len;}}
   continue;
  }
  assert.equal(b,0x2c,'Unexpected byte in GIF container');
  off+=8;
  const flags=bytes[off++];
  if(flags&0x80)off+=3*(2**((flags&7)+1));
  const min=bytes[off++],parts=[];
  while(true){const len=bytes[off++];if(!len)break;parts.push(...bytes.subarray(off,off+len));off+=len}
  pixels.push(unzipFrame(Uint8Array.from(parts),min,width,height));frameCount++;
 }
 return {width,height,frameCount,delays,pixels};
}
for(const [w,h,n] of [[24,24,1],[74,53,2],[160,85,2]]){
 const source=Array.from({length:n},(_,i)=>frame(w,h,i));
 const blob=encodeGif({width:w,height:h,frames:source,loop:0,dither:true});
 assert.equal(blob.type,'image/gif');
 const parsed=parseGif(new Uint8Array(await blob.arrayBuffer()));
 assert.equal(parsed.frameCount,n);
 for(let i=0;i<n;i++){
  assert.deepEqual(parsed.pixels[i],Array.from(rgbaToIndexed(source[i],{dither:true})));
  assert.equal(parsed.delays[i],12);
 }
}
const compressInput=new Uint8Array(512).map((_,i)=>i&255);
assert.ok(lzwCompress(compressInput).length>0);
console.log('PASS GIF89a — valid palette, LZW decoded pixel round-trip, loop frames, 3 sizes.');
