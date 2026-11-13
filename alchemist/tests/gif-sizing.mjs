// Verify automatic GIF sizing does not force icon dimensions, and custom outputs are optional.
import assert from 'node:assert/strict';
import {dimensionsForGif} from '../animation-tools.js';
assert.deepEqual(dimensionsForGif(1920,1080),{width:480,height:270});
assert.deepEqual(dimensionsForGif(1080,1920),{width:270,height:480});
assert.deepEqual(dimensionsForGif(300,200),{width:300,height:200});
assert.deepEqual(dimensionsForGif(1920,1080,{preset:'small'}),{width:240,height:135});
assert.deepEqual(dimensionsForGif(1920,1080,{preset:'custom',customWidth:640,keepRatio:true}),{width:640,height:360});
assert.deepEqual(dimensionsForGif(1920,1080,{preset:'custom',customWidth:600,customHeight:600,keepRatio:false}),{width:600,height:600});
assert.throws(()=>dimensionsForGif(1920,1080,{preset:'custom'}),/Enter a custom/);
assert.throws(()=>dimensionsForGif(1920,1080,{preset:'custom',customWidth:720,customHeight:720,keepRatio:false}),/memory limits/);
console.log('PASS GIF sizing — auto source ratio, portrait, exact custom sizes, safety checks, no icon requirement');
