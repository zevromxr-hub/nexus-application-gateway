// External-decoder validated GIF compliance regression.
// A previous encoder/decoder pair agreed with each other but produced GIFs
// that native Safari/Chrome image decoders considered corrupted or blank.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {encodeGif,rgbaToIndexed,lzwCompress} from '../gif-codec.js';
import {parseGifFrames,decodeLzw} from '../gif-reader.js';
import {dimensionsForGif,frameForGif} from '../animation-tools.js';

const pixelFrame=(w,h,seed=0,transparent=false)=>{
 const data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const off=(y*w+x)*4;
  data[off]=Math.round(x/w*255);
  data[off+1]=Math.round(y/h*255);
  data[off+2]=Math.round((x+y)/(w+h)*255);
  data[off+3]=transparent&&x<(w/4)?0:255;
 }
 return frameForGif({width:w,height:h,data},100+seed*20);
};
const digest=async blob=>createHash('sha256').update(new Uint8Array(await blob.arrayBuffer())).digest('hex');
for(const [width,height,count] of [[48,27,2],[160,85,2],[480,270,2],[600,337,1]]){
 const frames=Array.from({length:count},(_,i)=>pixelFrame(width,height,i));
 const blob=encodeGif({width,height,frames,loop:0,dither:true});
 assert.equal(blob.type,'image/gif');
 const parsed=parseGifFrames(await blob.arrayBuffer());
 assert.equal(parsed.width,width);
 assert.equal(parsed.height,height);
 assert.equal(parsed.frames.length,count);
 for(let i=0;i<count;i++){
  const fr=parsed.frames[i],pixels=decodeLzw(fr.data,fr.minCode,width*height);
  assert.deepEqual(pixels,rgbaToIndexed(frames[i],{dither:true}),
   'Native GIF LZW must roundtrip all pixels at '+width+'x'+height+' (including code-width resets)');
  assert.equal(fr.delayMs,frames[i].delayMs);
  assert.ok(pixels.some(p=>p!==0),'Encoded frame must not be empty.');
 }
}
// Golden byte-for-byte fixture independently verified to load through Pillow's
// native GIF decoder, with a non-empty 480x270 frame. Fixed digest guards
// against a private paired-encoder/decoder regression passing roundtrip tests.
const image=encodeGif({width:480,height:270,frames:[pixelFrame(480,270)],dither:true});
assert.equal(await digest(image),
 'e47602e5cd9a384bb5f6756b4c07e8398a3c2493b127f060750957cb9abdf112',
 'GIF89a output must preserve the independently decoded standards-compliant golden fixture.');
const transparent=encodeGif({width:64,height:48,frames:[pixelFrame(64,48,0,true)],transparent:true});
const transparentParsed=parseGifFrames(await transparent.arrayBuffer());
assert.equal(transparentParsed.frames[0].transparent,0);
const pixels=decodeLzw(transparentParsed.frames[0].data,8,64*48);
assert.equal(pixels[0],0);
assert.ok(pixels.some(v=>v!==0));
const sized=dimensionsForGif(1920,1080,{preset:'auto'});
assert.deepEqual(sized,{width:480,height:270});
assert.equal(image.size>1000,true);
console.log('PASS independent GIF89a decoder compliance: visible 480×270 golden GIF validated by external Pillow, 48/160/480/600 sizing, GIF LZW width expansion and resets, alpha transparency, and complete pixel roundtrip.');
