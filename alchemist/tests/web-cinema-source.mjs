// PROXIMUS 3.6.3 — provider-independent Embed First and native direct playback.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {parseWebCinemaPlayerInput,normalizeSavedPlayback,normalizeWebCinemaSourceMode,
 webCinemaPlaybackPlan,displayWebCinemaUrl,WEB_CINEMA_SOURCE_MODES} from '../web-cinema-source.js';
import {classifyWebCinemaUrl,normalizeWebCinemaLibrary,addWebCinemaLink,
 filterWebCinemaLibrary,webCinemaBackup,readWebCinemaBackup} from '../web-cinema-core.js';
import {webCinemaFramePolicy} from '../web-cinema-compat.js';
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),app=read('app.js'),client=read('web-cinema.js'),
 sw=read('sw.js'),style=read('web-cinema.css');
assert.deepEqual(WEB_CINEMA_SOURCE_MODES,['auto','embed','native','website']);
assert.equal(normalizeWebCinemaSourceMode('broken'),'auto');
const site='https://video.example.org/watch?id=42&viewkey=test123';
const embed='https://player.example.org/embed/42?viewkey=test123&token=abc';
const code='<iframe width="640" height="360" src="https://player.example.org/embed/42?viewkey=test123&amp;token=abc" allowfullscreen></iframe>';
assert.deepEqual(parseWebCinemaPlayerInput(code),{playerMode:'embed',playerUrl:embed});
assert.deepEqual(parseWebCinemaPlayerInput(embed),{playerMode:'embed',playerUrl:embed});
assert.deepEqual(parseWebCinemaPlayerInput('<video src="https://media.example.org/stream.m3u8?sig=x"></video>'),
 {playerMode:'native',playerUrl:'https://media.example.org/stream.m3u8?sig=x'});
assert.deepEqual(parseWebCinemaPlayerInput('<source type="video/mp4" src="https://media.example.org/a.mp4?key=abc">'),
 {playerMode:'native',playerUrl:'https://media.example.org/a.mp4?key=abc'});
assert.deepEqual(parseWebCinemaPlayerInput('https://media.example.org/file?viewkey=x',{hint:'native'}),
 {playerMode:'native',playerUrl:'https://media.example.org/file?viewkey=x'});
for(const s of ['<script>alert(1)</script>','<div onclick="alert(1)">hello</div>',
 '<iframe src="javascript:alert(1)"></iframe>','<iframe src="https://player.example.org"></iframe><iframe src="https://other.example.org"></iframe>',
 '<iframe src="http://example.org/embed"></iframe>','<iframe src="https://localhost/private"></iframe>',
 '<iframe src="https://zevromxr-hub.github.io/bad"></iframe>']){
 assert.throws(()=>parseWebCinemaPlayerInput(s,{appOrigin:'https://zevromxr-hub.github.io'}),undefined,'Reject executable/untrusted markup '+s);
}
const record={url:site,playerMode:'embed',playerUrl:embed,title:'My film',favorite:true,collection:'Weekend',added:100};
const items=normalizeWebCinemaLibrary([record]);
assert.equal(items.length,1);
assert.equal(items[0].url,site);
assert.equal(items[0].playerUrl,embed);
assert.equal(items[0].playerMode,'embed');
const backed=readWebCinemaBackup(JSON.parse(JSON.stringify(webCinemaBackup(items))));
assert.equal(backed[0].playerUrl,embed,'A saved custom official embed must survive manual backups');
assert.equal(backed[0].url,site,'The original watch link and its view key must survive');
assert.equal(normalizeWebCinemaLibrary([{...record,playerUrl:'javascript:evil()'}])[0].playerMode,'auto');
assert.equal(normalizeWebCinemaLibrary([{url:site,title:'Legacy original'}])[0].playerMode,'auto');
const res=webCinemaPlaybackPlan(site,backed[0],'https://zevromxr-hub.github.io');
assert.equal(res.kind,'custom-embed');
assert.equal(res.embed,embed);
assert.equal(res.url,site);
assert.equal(webCinemaPlaybackPlan(site,{playerMode:'native',playerUrl:'https://media.example.org/watch?key=abc'}).kind,'direct');
assert.equal(webCinemaPlaybackPlan(site,{playerMode:'native',playerUrl:'https://media.example.org/watch?key=abc'}).mediaUrl,
 'https://media.example.org/watch?key=abc','Direct URL does not require .mp4 extension');
assert.equal(normalizeWebCinemaLibrary([{url:site,playerMode:'native',playerUrl:'https://media.example.org/watch?key=abc',position:76.5}])[0].position,76.5,'Native source without a file extension retains direct video resume progress');
assert.equal(webCinemaPlaybackPlan(site,{playerMode:'website'}).kind,'website');
assert.equal(webCinemaPlaybackPlan(site,{}).kind,'website');
assert.equal(webCinemaPlaybackPlan('https://www.dailymotion.com/video/x8abcde',{playerMode:'embed',playerUrl:embed}).kind,'custom-embed');
assert.equal(webCinemaPlaybackPlan('http://example.org/watch',{playerMode:'embed',playerUrl:embed}).kind,'external','No insecure watch page embedding');
const policy=webCinemaFramePolicy('custom-embed',embed,{appOrigin:'https://zevromxr-hub.github.io'});
assert.equal(policy.allowed,true);
assert.ok(!policy.sandbox.includes('allow-top-navigation'));
assert.ok(!policy.sandbox.includes('allow-popups'));
assert.equal(webCinemaFramePolicy('custom-embed','https://zevromxr-hub.github.io/anything',{appOrigin:'https://zevromxr-hub.github.io'}).allowed,false);
assert.equal(displayWebCinemaUrl('https://media.example.org/clip.mp4?token=private&viewkey=abc').includes('token=private'),false);
const saved=addWebCinemaLink(items,'https://cdn.example.org/sample.mp4','New','General',12345,'abcdabcd');
assert.equal(saved.items[0].playerMode,'auto');
assert.equal(filterWebCinemaLibrary(items,{filter:'videos'}).length,1,'A watch URL with saved official embed should be recognized in video filters');
for(const id of ['webCinemaSourceOptions','webCinemaPlaybackMode','webCinemaEmbedCode','webCinemaApplySource','webCinemaResetSource','webCinemaSourceStatus']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'One source control, no new studio: '+id);
}
assert.ok(html.includes('id="webCinemaVideo" playsinline webkit-playsinline'),'Native HTML5 video should work inline on Safari');
assert.ok(client.includes('webCinemaPlaybackPlan(detected.url,source,location.origin)'),'Route source override through validated play plan');
assert.ok(client.includes('video.src=link.mediaUrl||link.url'),'Actual signed media URL drives native video');
assert.ok(client.includes("if(active?.url===output.item.url)currentSavedId=output.item.id"),'Preserve original bookmark progress safety');
assert.ok(client.includes('saveSourceIfBookmarked(canonical,source)'),'Source choice should persist on saved entries');
assert.ok(client.includes('draftForUrl===output.item.url'),'Unsaved source choice can be saved later');
assert.ok(client.includes('parseWebCinemaPlayerInput('),'Never execute pasted markup; extract only validated URLs');
assert.ok(client.includes("window.open(active.url,'_blank','noopener,noreferrer')"),'External fallback retains opener isolation');
assert.ok(!client.includes('iframe.srcdoc='),'Never execute third-party HTML inside PROXIMUS');
assert.ok(style.includes('.web-cinema-player-options textarea'),'Embed-first options available on mobile');
assert.ok(sw.includes("'./web-cinema-source.js'"),'New module must be in offline app shell');
assert.equal([...html.matchAll(/<section class="studio" data-panel="([^"]+)"/g)].length,20);
assert.equal([...html.matchAll(/class="nav[^"]*" data-view="([^"]+)"/g)].length,20);
console.log('PASS v3.6.3: old Embed First behavior recovered with validated iframe/video URLs; signed links, saved source selection and browser compatibility preserved.');
