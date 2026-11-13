// PROXIMUS v3.1 Video Vault + mobile navigation regressions.
import assert from 'node:assert/strict';
import {
 VIDEO_VAULT_DB,VIDEO_VAULT_MAX_ITEMS,VIDEO_VAULT_MAX_BYTES,VIDEO_VAULT_IPHONE_MAX_BYTES,
 videoFileType,validateVideoFile,videoFingerprint,createVideoMetadata,
 normalizeVideoCollection,videoTime,sortVideoLibrary,vaultStorageWarning
} from '../video-vault-core.js';
import {mobileNavigationList,historyMove} from '../mobile-navigation.js';
import {gifDelayMs,dimensionsForGif} from '../animation-tools.js';
import {encodeGif} from '../gif-codec.js';
import {parseGifFrames,decodeLzw} from '../gif-reader.js';

assert.equal(VIDEO_VAULT_DB,'proximus-video-vault-v1');
assert.ok(VIDEO_VAULT_MAX_ITEMS>=100);
assert.ok(VIDEO_VAULT_MAX_BYTES>VIDEO_VAULT_IPHONE_MAX_BYTES);
const f={name:'Vacation 2026.MOV',size:900000, lastModified:100,type:'video/quicktime'};
assert.equal(videoFileType(f),'video/quicktime');
assert.equal(validateVideoFile(f,{mobile:true}),'video/quicktime');
assert.equal(videoFileType({name:'clip.mp4',type:''}),'video/mp4');
assert.equal(videoFileType({name:'movie.webm',type:'video/webm'}),'video/webm');
assert.equal(videoFileType({name:'account-password.txt',type:'text/plain'}),'');
assert.throws(()=>validateVideoFile({name:'bad.mp4',size:0}),/empty/);
assert.throws(()=>validateVideoFile({name:'large.mov',size:VIDEO_VAULT_IPHONE_MAX_BYTES+1,type:'video/quicktime'},{mobile:true}),/450 MB/);
assert.ok(videoFingerprint(f).includes('vacation 2026.mov'));
const item=createVideoMetadata(f,'12345678-aaaa-bbbb',100000,{mobile:true});
assert.equal(item.favorite,false);
assert.equal(item.position,0);
assert.equal(item.collection,'Unsorted');
assert.equal(item.mime,'video/quicktime');
assert.equal(normalizeVideoCollection('<my>\\clips'),'myclips');
assert.equal(videoTime(3662),'1:01:02');
const another=createVideoMetadata({name:'Trailers.mp4',size:800000,type:'video/mp4',lastModified:20},'abcdefgh-1111',200000);
another.favorite=true;another.position=80;another.watched=240000;another.collection='Shows';
assert.equal(sortVideoLibrary([item,another],{filter:'favorites'}).length,1);
assert.equal(sortVideoLibrary([item,another],{filter:'in-progress'})[0].id,another.id);
assert.equal(sortVideoLibrary([item,another],{filter:'unwatched'})[0].id,item.id);
assert.equal(sortVideoLibrary([item,another],{query:'Shows'})[0].id,another.id);
assert.equal(sortVideoLibrary([another,item],{sort:'name'})[0].id,another.id);
assert.match(vaultStorageWarning(false),/cleared by iOS/);
const studios=[
 {id:'command',title:'Command Center',detail:'Main dashboard'},
 {id:'videos',title:'Video Vault',detail:'Saved personal movies'},
 {id:'theater',title:'Media Theater',detail:'Live playback'}
];
assert.deepEqual(mobileNavigationList(studios,{term:'video'}).map(v=>v.id),['videos']);
assert.deepEqual(mobileNavigationList(studios,{mode:'favorites',favorites:['theater']}).map(v=>v.id),['theater']);
assert.deepEqual(mobileNavigationList(studios,{mode:'recent',recent:['videos','theater']}).map(v=>v.id),['videos','theater']);
assert.deepEqual(historyMove(['command','videos','theater'],2,-1),{index:1,id:'videos'});
assert.deepEqual(historyMove(['command','videos','theater'],1,1),{index:2,id:'theater'});
assert.deepEqual(historyMove(['command','videos','theater'],0,-1),{index:0,id:'command'});
assert.deepEqual(historyMove([],0,-1),{index:-1,id:null});
for(const fps of [6,8,12,15,20,24]){
 const frames=fps*4,delays=Array.from({length:frames},(_,i)=>gifDelayMs(fps,i));
 const total=delays.reduce((a,b)=>a+b,0);
 assert.ok(Math.abs(total-4000)<=10,'GIF playback duration must match 4 seconds at '+fps+' FPS, got '+total);
 assert.ok(delays.every(ms=>ms>=20&&ms%10===0));
}
assert.deepEqual(dimensionsForGif(1920,1080,{preset:'auto'}),{width:480,height:270});
const w=48,h=27,data=new Uint8ClampedArray(w*h*4);
for(let p=0;p<w*h;p++){data[p*4]=(p*19)&255;data[p*4+1]=(p*7)&255;data[p*4+2]=100;data[p*4+3]=255;}
const frames=Array.from({length:30},(_,i)=>({width:w,height:h,data,delayMs:gifDelayMs(15,i)}));
const result=encodeGif({width:w,height:h,frames});
const parsed=parseGifFrames(await result.arrayBuffer());
assert.equal(parsed.frames.length,30);
assert.equal(parsed.frames.reduce((sum,f)=>sum+f.delayMs,0),2000);
assert.ok(decodeLzw(parsed.frames[0].data,8,w*h).some(x=>x!==0));
console.log('PASS v3.1: Video Vault file validation, device-local metadata, favorites/search/resume, iPhone navigation/history, 15/20/24 FPS timing and real GIF89a animation.');
