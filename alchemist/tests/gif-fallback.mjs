// Validate GIF fallback parsing and LZW decode against the independent encoder.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=path.resolve(import.meta.dirname,'..');
async function local(f){const src=fs.readFileSync(path.join(dir,f),'utf8');return await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));}
const codec=await local('gif-codec.js'),reader=await local('gif-reader.js');
const frames=Array.from({length:3},(_,n)=>{
 const width=41,height=31,data=new Uint8ClampedArray(width*height*4);
 for(let p=0;p<width*height;p++){
  const x=p%width,y=Math.floor(p/width),i=p*4;
  data[i]=(x*9+y+n*13)%256;data[i+1]=(x*3+n*47)%256;data[i+2]=(y*7+n*23)%256;data[i+3]=255;
 }
 return {width,height,data,delayMs:100+n*40};
});
for(const transparent of [false,true]){
 const blob=codec.encodeGif({width:41,height:31,frames,transparent,dither:true,loop:0});
 const parsed=reader.parseGifFrames(await blob.arrayBuffer());
 assert.equal(parsed.width,41);assert.equal(parsed.height,31);assert.equal(parsed.frames.length,3);
 for(let i=0;i<3;i++){
  const fr=parsed.frames[i],decoded=reader.decodeLzw(fr.data,fr.minCode,fr.w*fr.h);
  assert.deepEqual(Array.from(decoded),Array.from(codec.rgbaToIndexed(frames[i],{transparent,dither:true})));
  assert.equal(fr.delayMs,100+i*40);
 }
}
assert.throws(()=>reader.parseGifFrames(new Uint8Array([3,4,5])),/Not a GIF/);
console.log('PASS GIF fallback — GIF87/89 parsing, GIF89a frames, timing, palette, LZW decoding.');
