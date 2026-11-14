// PROXIMUS v3.6.1 | Web Cinema Gateway: URL security, supported embeds, offline saved links.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
 WEB_CINEMA_KEY,WEB_CINEMA_SCHEMA,WEB_CINEMA_LIMIT,WEB_CINEMA_MAX_IMPORT,
 parseWebCinemaUrl,classifyWebCinemaUrl,isWebCinemaVideo,normalizeWebCinemaLibrary,
 addWebCinemaLink,filterWebCinemaLibrary,webCinemaBackup,readWebCinemaBackup
} from '../web-cinema-core.js';
const ROOT=path.resolve(import.meta.dirname,'..'),read=x=>fs.readFileSync(path.join(ROOT,x),'utf8');
const html=read('index.html'),app=read('app.js'),style=read('web-cinema.css'),
 module=read('web-cinema.js'),sw=read('sw.js'),sync=read('workspace-sync.js'),recovery=read('recovery-center.js');
assert.equal(WEB_CINEMA_KEY,'proximus-web-cinema-links-v1');
assert.equal(WEB_CINEMA_SCHEMA,'proximus.web-cinema.links/1');
assert.equal(WEB_CINEMA_LIMIT,180);
assert.equal(WEB_CINEMA_MAX_IMPORT,750000);
assert.equal(parseWebCinemaUrl('videos.example.org/movie.mp4').href,'https://videos.example.org/movie.mp4');
assert.equal(classifyWebCinemaUrl('https://cdn.example.org/clip.mp4?token=abc').kind,'direct');
assert.equal(classifyWebCinemaUrl('https://cdn.example.org/stream.m3u8').kind,'direct');
assert.equal(classifyWebCinemaUrl('https://cdn.example.org/clip.webm?quality=1080').kind,'direct');
assert.equal(classifyWebCinemaUrl('https://www.example.org/page?id=1').kind,'website');
assert.equal(classifyWebCinemaUrl('https://youtu.be/dQw4w9WgXcQ?t=35').embed,'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0&start=35');
assert.equal(classifyWebCinemaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ').kind,'youtube');
assert.equal(classifyWebCinemaUrl('https://music.youtube.com/watch?v=dQw4w9WgXcQ').kind,'youtube');
assert.equal(classifyWebCinemaUrl('https://youtube.com/shorts/dQw4w9WgXcQ').kind,'youtube');
assert.equal(classifyWebCinemaUrl('https://www.youtube.com/playlist?list=abc').kind,'external');
assert.equal(classifyWebCinemaUrl('https://www.youtube.com.evil.org/watch?v=dQw4w9WgXcQ').kind,'website','Do not trust lookalike hostnames');
assert.equal(classifyWebCinemaUrl('https://vimeo.com/123456789?h=a1b2c3d4').embed,'https://player.vimeo.com/video/123456789?h=a1b2c3d4');
assert.equal(classifyWebCinemaUrl('https://vimeo.com/123456789').kind,'vimeo');
assert.equal(classifyWebCinemaUrl('https://vimeo.com/123456789/a1b2c3d4').embed,'https://player.vimeo.com/video/123456789?h=a1b2c3d4');
assert.equal(classifyWebCinemaUrl('https://www.dailymotion.com/video/x8abcde').kind,'external','Modern Dailymotion embeds require a player ID');
assert.equal(classifyWebCinemaUrl('http://example.org/video.mp4').kind,'external','Unencrypted embeds cannot bypass mixed-content safeguards');
assert.equal(classifyWebCinemaUrl('https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/').kind,'external');
for(const input of [
 'javascript:alert(1)','data:text/html,hi','file:///etc/passwd','blob:https://example.org/1',
 'ftp://example.org/file','https://localhost:5000','https://127.0.0.1/','https://192.168.1.1',
 'https://10.1.2.3','http://172.20.0.1','http://169.254.3.1','https://site.local',
 'https://user:pass@example.org','https://example.org:8081','not a link with spaces'
])assert.throws(()=>classifyWebCinemaUrl(input),undefined,'Unsafe or malformed input must be rejected: '+input);
assert.equal(isWebCinemaVideo('direct'),true);
assert.equal(isWebCinemaVideo('youtube'),true);
assert.equal(isWebCinemaVideo('website'),false);
const old=addWebCinemaLink([],'https://cdn.example.org/movie.mp4?key=1','My film','Cinema',10000,'aaaaaaaa');
assert.equal(old.items.length,1);
assert.equal(old.item.title,'My film');
assert.equal(old.item.collection,'Cinema');
const again=addWebCinemaLink(old.items,'https://cdn.example.org/movie.mp4?key=1');
assert.equal(again.duplicate,true);
assert.equal(again.items.length,1);
const more=addWebCinemaLink(old.items,'https://vimeo.com/123456789','Video','Films',20000,'bbbbbbbb');
assert.equal(more.items.length,2);
assert.deepEqual(filterWebCinemaLibrary(more.items,{filter:'videos'}).map(x=>x.title),['Video','My film']);
assert.deepEqual(filterWebCinemaLibrary(more.items,{search:'cinema'}).map(x=>x.title),['My film']);
const records=more.items.map(x=>({...x,favorite:true,position:x.kind==='direct'?44.5:0}));
const sanitized=normalizeWebCinemaLibrary(records);
assert.equal(sanitized.find(x=>x.kind==='direct').position,44.5);
assert.equal(sanitized.find(x=>x.kind==='vimeo').position,0);
assert.equal(sanitized[0].favorite,true);
assert.equal(normalizeWebCinemaLibrary([{url:'javascript:alert(1)'},...records]).length,2);
const backup=webCinemaBackup(records);
assert.equal(backup.schema,WEB_CINEMA_SCHEMA);
assert.deepEqual(readWebCinemaBackup(JSON.parse(JSON.stringify(backup))),sanitized);
assert.throws(()=>readWebCinemaBackup({schema:'bad',links:[]}),/valid/);
assert.throws(()=>readWebCinemaBackup({schema:WEB_CINEMA_SCHEMA,links:new Array(181).fill({})}),/valid/);
for(const id of ['webCinemaGateway','webCinemaForm','webCinemaUrl','webCinemaTitle','webCinemaCollection',
 'webCinemaLoad','webCinemaSave','webCinemaNow','webCinemaType','webCinemaFrame','webCinemaEmpty',
 'webCinemaIframe','webCinemaVideo','webCinemaBack','webCinemaForward','webCinemaReload','webCinemaFullscreen',
 'webCinemaExternal','webCinemaStop','webCinemaStatus','webCinemaCount','webCinemaSearch','webCinemaFilter',
 'webCinemaSavedList','webCinemaExport','webCinemaImport']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Missing/duplicated Gateway control '+id);
}
assert.ok(html.includes('<details id="webCinemaGateway"'),'Avoid a new cluttered studio; collapsed by default');
assert.equal([...html.matchAll(/<section class="studio" data-panel="([^"]+)"/g)].length,20,'Keep all existing studio routes');
assert.equal([...html.matchAll(/class="nav[^"]*" data-view="([^"]+)"/g)].length,20,'No new sidebar item');
assert.ok(app.includes("initVideoVault(app);initWebCinemaGateway();"),'Keep original Video Vault and initialize Gateway separately');
assert.ok(module.includes('webCinemaFramePolicy(link.kind,link.embed'),'All iframe permissions are selected by a verified origin-aware policy');
assert.ok(module.includes("iframe.setAttribute('sandbox',policy.sandbox)"),'Restricted and compatible website modes must remain sandboxed');
assert.ok(module.includes("iframe.referrerPolicy=policy.referrerPolicy"),'Referrer is chosen from compatibility/privacy profile');
assert.ok(!module.includes("iframe.removeAttribute('sandbox')"),'Never remove sandbox restrictions to force playback');
assert.ok(module.includes('video.addEventListener(')&&module.includes('loadedmetadata'),'Direct video should support resume');
assert.ok(module.includes('normalizeWebCinemaLibrary([...saved,...imported])'),'Link backup should merge safely without duplicates');
assert.ok(module.includes("if(event.detail?.studio!=='videos'&&active){stopMedia();}"),'Do not leave hidden external websites playing');
assert.ok(module.includes('if(!root.open&&active){stopMedia();'),'Collapse should stop third-party embeds');
assert.ok(module.includes("window.open(active.url,'_blank','noopener,noreferrer')"),'External fallback must block tab-opener access');
assert.ok(style.includes('.web-cinema-frame iframe')&&style.includes('background:#000'),'Video playback must have opaque background');
assert.ok(style.includes('@media(max-width:620px)'),'Mobile controls must fit iPhone');
assert.ok(sw.includes("'./web-cinema-core.js'")&&sw.includes("'./web-cinema.js'")&&sw.includes("'./web-cinema.css'"),'All Gateway code cached offline for future visits');
assert.ok(sync.includes(WEB_CINEMA_KEY)&&recovery.includes(WEB_CINEMA_KEY),'Backups must include opted-in link metadata');
console.log('PASS v3.6.1: URL validation, official embeds, direct video, private saved links, resume, responsive controls, isolated browser and preserved original media.');
