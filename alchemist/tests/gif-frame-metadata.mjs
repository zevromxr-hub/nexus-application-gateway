// Regression: ImageData geometry and RGBA storage live on prototype accessors
// in browsers. Object spread can silently discard all of them.
import assert from 'node:assert/strict';
import {frameForGif,dimensionsForGif} from '../animation-tools.js';
import {encodeGif} from '../gif-codec.js';
import {parseGifFrames} from '../gif-reader.js';

function browserLikeImageData(width,height,seed=0){
 const pixels=new Uint8ClampedArray(width*height*4);
 for(let i=0;i<width*height;i++){
  const off=i*4;
  pixels[off]=(i*7+seed*11)%256;
  pixels[off+1]=(i*3+seed*17)%256;
  pixels[off+2]=(i*13+seed*23)%256;
  pixels[off+3]=255;
 }
 const properties={width,height,data:pixels};
 const proto={};
 for(const [name,value] of Object.entries(properties)){
  Object.defineProperty(proto,name,{get(){return value;},enumerable:true});
 }
 return Object.create(proto);
}
for(const [width,height] of [[73,41],[63,92],[64,64]]){
 const image=browserLikeImageData(width,height,1);
 assert.equal(Object.keys(image).length,0,'Simulated browser ImageData has no own enumerable fields');
 assert.equal({...image}.width,undefined,'Old object-spread path loses the dimensions');
 const frame=frameForGif(image,125);
 assert.equal(frame.width,width);
 assert.equal(frame.height,height);
 assert.equal(frame.data.length,width*height*4);
 assert.equal(frame.delayMs,125);
 const blob=encodeGif({width,height,frames:[
  frame,frameForGif(browserLikeImageData(width,height,2),90)
 ],loop:0,dither:false});
 assert.equal(blob.type,'image/gif');
 const parsed=parseGifFrames(await blob.arrayBuffer());
 assert.equal(parsed.width,width,'Video-to-GIF must retain output width');
 assert.equal(parsed.height,height,'Video-to-GIF must retain output height');
 assert.equal(parsed.frames.length,2,'Both sampled frames must remain valid');
}
assert.deepEqual(dimensionsForGif(1920,1080,{preset:'auto',keepRatio:false}),{width:480,height:270},
 'Ordinary auto GIF sizing must not require input dimensions to match a preset');
assert.deepEqual(dimensionsForGif(1920,1080,{preset:'custom',customWidth:600,customHeight:300,keepRatio:false}),
 {width:600,height:300},'Optional custom output may stretch video without requiring matching source ratio');
assert.throws(()=>frameForGif({width:10,height:10,data:new Uint8ClampedArray(8)}),/decoded frame is invalid/);
assert.throws(()=>frameForGif({width:0,height:10,data:new Uint8ClampedArray(0)}),/decoded frame is invalid/);
assert.throws(()=>frameForGif({width:10,height:10,data:null}),/decoded frame is invalid/);
console.log('PASS Animation Forge v3.0.1: video→GIF and icon/resize encoder keeps browser ImageData RGBA and dimensions in auto/custom output.');
