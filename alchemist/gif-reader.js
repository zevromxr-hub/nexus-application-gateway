// PROXIMUS | ASSET ALCHEMIST v2.3 — pure JS fallback GIF frame reader.
// Supports GIF87a/GIF89a, local palettes, LZW, interlace, transparency and disposal.
// Used when the browser has no ImageDecoder (notably some iOS Safari releases).
const u16=(b,o)=>b[o]|(b[o+1]<<8);
function parseSubblocks(b,start){
 const chunks=[];let len=0,off=start;
 while(true){
  if(off>=b.length)throw Error('Truncated GIF sub-blocks');
  const n=b[off++];if(!n)break;
  if(off+n>b.length)throw Error('Truncated GIF image data');
  chunks.push(b.subarray(off,off+n));off+=n;len+=n;
 }
 const joined=new Uint8Array(len);let i=0;
 for(const ch of chunks){joined.set(ch,i);i+=ch.length;}
 return {data:joined,offset:off};
}
export function decodeLzw(data,minCode,count){
 if(minCode<2||minCode>8)throw Error('Unsupported GIF LZW code size');
 const clear=1<<minCode,end=clear+1,table=[];
 let bits=minCode+1,next=clear+2,pos=0,prev=null;
 const output=new Uint8Array(count);let out=0;
 function reset(){table.length=0;for(let i=0;i<clear;i++)table[i]=Uint8Array.of(i);bits=minCode+1;next=clear+2;prev=null;}
 function read(){
  if(pos+bits>data.length*8)return null;
  let v=0;for(let i=0;i<bits;i++)v|=((data[pos>>3]>>(pos&7))&1)<<i,pos++;
  return v;
 }
 reset();
 while(out<count){
  const code=read();if(code===null)break;
  if(code===clear){reset();continue;}if(code===end)break;
  let item=table[code];
  if(!item&&code===next&&prev){item=new Uint8Array(prev.length+1);item.set(prev);item[prev.length]=prev[0];}
  if(!item)throw Error('Corrupt GIF image LZW sequence');
  output.set(item.subarray(0,count-out),out);out+=item.length;
  if(prev&&next<4096){
   const pair=new Uint8Array(prev.length+1);pair.set(prev);pair[prev.length]=item[0];table[next++]=pair;
   // GIF decoder observes dictionary growth one code after the encoder.
   // Standard GIF LZW code-size transition. The encoder advances one
   // phrase later; the decoder increases width when its next free
   // dictionary code reaches the current bit capacity.
   if(next===(1<<bits)&&bits<12)bits++;
  }
  prev=item;
 }
 if(out<count)throw Error('GIF image data ended unexpectedly');
 return output;
}
function pixelsOrder(indexes,w,h,interlace){
 if(!interlace)return indexes;
 const result=new Uint8Array(indexes.length);
 let src=0;
 for(const [start,step] of [[0,8],[4,8],[2,4],[1,2]])
  for(let row=start;row<h;row+=step){result.set(indexes.subarray(src,src+w),row*w);src+=w;}
 return result;
}
function colorTable(b,at,size){
 const sizeBytes=size*3;if(at+sizeBytes>b.length)throw Error('Truncated GIF palette');
 return {colors:b.subarray(at,at+sizeBytes),next:at+sizeBytes};
}
export function parseGifFrames(buffer){
 const b=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
 if(b.length<14)throw Error('Not a GIF file');
 const header=String.fromCharCode(...b.subarray(0,6));
 if(!['GIF87a','GIF89a'].includes(header))throw Error('Not a GIF87a/GIF89a file');
 const width=u16(b,6),height=u16(b,8);
 if(width<1||height<1||width>4096||height>4096||width*height>3000000)throw Error('Animated GIF dimensions exceed the safe browser limit');
 let off=13,globalPalette=null;
 if(b[10]&0x80){const table=colorTable(b,off,1<<((b[10]&7)+1));globalPalette=table.colors;off=table.next;}
 const frames=[];let gce={delayMs:100,disposal:0,transparent:-1};
 while(off<b.length){
  const token=b[off++];
  if(token===0x3b)break;
  if(token===0x21){
   if(off>=b.length)throw Error('Truncated GIF extension');
   const kind=b[off++];
   if(kind===0xf9){
    if(b[off++]!==4)throw Error('Invalid GIF graphics control');
    const packed=b[off++],delay=u16(b,off);off+=2;
    const index=b[off++];off++;
    gce={delayMs:Math.max(20,(delay||10)*10),disposal:(packed>>2)&7,transparent:(packed&1)?index:-1};
   }else{const tail=parseSubblocks(b,off);off=tail.offset;}
   continue;
  }
  if(token!==0x2c)throw Error('Unsupported GIF block');
  if(off+9>b.length)throw Error('Truncated GIF image descriptor');
  const x=u16(b,off),y=u16(b,off+2),w=u16(b,off+4),h=u16(b,off+6),flags=b[off+8];off+=9;
  if(w<1||h<1||x+w>width||y+h>height)throw Error('Invalid GIF frame rectangle');
  let palette=globalPalette;
  if(flags&0x80){const table=colorTable(b,off,1<<((flags&7)+1));palette=table.colors;off=table.next;}
  if(!palette)throw Error('GIF palette is missing');
  const minCode=b[off++],block=parseSubblocks(b,off);off=block.offset;
  frames.push({x,y,w,h,palette,minCode,data:block.data,interlace:!!(flags&0x40),...gce});
  gce={delayMs:100,disposal:0,transparent:-1};
  if(frames.length>400)throw Error('GIF has over 400 frames. Please trim the source before importing.');
 }
 if(!frames.length)throw Error('No image frames found in the GIF');
 return {width,height,frames};
}
export function createGifFrameRenderer(parsed){
 const {width,height,frames}=parsed;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true}),patch=document.createElement('canvas');
 const patchCtx=patch.getContext('2d',{willReadFrequently:true});
 let current=-1,previous=null,restore=null;
 function next(){
  if(current>=0){
   if(previous.disposal===2)ctx.clearRect(previous.x,previous.y,previous.w,previous.h);
   else if(previous.disposal===3&&restore)ctx.putImageData(restore,0,0);
  }
  const fr=frames[++current];
  restore=fr.disposal===3?ctx.getImageData(0,0,width,height):null;
  patch.width=fr.w;patch.height=fr.h;
  const pixels=pixelsOrder(decodeLzw(fr.data,fr.minCode,fr.w*fr.h),fr.w,fr.h,fr.interlace);
  const img=patchCtx.createImageData(fr.w,fr.h);
  for(let j=0;j<pixels.length;j++){
   const idx=pixels[j],k=j*4,q=idx*3;
   if(idx===fr.transparent)continue;
   img.data[k]=fr.palette[q]||0;img.data[k+1]=fr.palette[q+1]||0;img.data[k+2]=fr.palette[q+2]||0;img.data[k+3]=255;
  }
  patchCtx.putImageData(img,0,0);
  ctx.drawImage(patch,fr.x,fr.y);
  previous=fr;
  return {canvas,duration:fr.delayMs*1000,width,height};
 }
 function frame(index){
  if(index<0||index>=frames.length)throw Error('GIF frame index out of range');
  if(index<current){current=-1;previous=null;restore=null;ctx.clearRect(0,0,width,height);}
  while(current<index)next();
  return {canvas,duration:frames[index].delayMs*1000,width,height};
 }
 return {frame};
}
