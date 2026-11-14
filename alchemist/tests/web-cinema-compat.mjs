// PROXIMUS v3.6.2 Safari embedded-player compatibility and URL integrity checks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
 WEB_CINEMA_COMPAT_MODE_KEY,WEB_CINEMA_MODES,officialShareEmbed,
 normalizeFrameMode,webCinemaFramePolicy
} from '../web-cinema-compat.js';
import {classifyWebCinemaUrl,addWebCinemaLink,normalizeWebCinemaLibrary} from '../web-cinema-core.js';
const root=path.resolve(import.meta.dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const html=read('index.html'),client=read('web-cinema.js'),core=read('web-cinema-core.js'),
 css=read('web-cinema.css'),sw=read('sw.js'),sync=read('workspace-sync.js'),recover=read('recovery-center.js');
assert.equal(WEB_CINEMA_COMPAT_MODE_KEY,'proximus-web-cinema-frame-mode-v1');
assert.deepEqual(WEB_CINEMA_MODES,['compatible','restricted']);
assert.equal(normalizeFrameMode(null),'compatible');
assert.equal(normalizeFrameMode('unsupported'),'compatible');
assert.equal(normalizeFrameMode('restricted'),'restricted');
const own='https://zevromxr-hub.github.io';
const embed='https://player.example.org/embed/123?viewkey=test-123';
const auto=webCinemaFramePolicy('website',embed,{appOrigin:own});
assert.equal(auto.allowed,true);
assert.equal(auto.loading,'eager');
assert.ok(auto.sandbox.includes('allow-scripts'));
assert.ok(auto.sandbox.includes('allow-forms'));
assert.ok(auto.sandbox.includes('allow-same-origin'));
assert.ok(auto.sandbox.includes('allow-storage-access-by-user-activation'));
assert.ok(auto.sandbox.includes('allow-presentation'));
assert.equal(auto.referrerPolicy,'strict-origin-when-cross-origin');
assert.ok(!auto.sandbox.includes('allow-top-navigation'));
assert.ok(!auto.sandbox.includes('allow-downloads'));
assert.ok(!auto.sandbox.includes('allow-popups'));
const locked=webCinemaFramePolicy('website',embed,{appOrigin:own,mode:'restricted'});
assert.equal(locked.allowed,true);
assert.equal(locked.referrerPolicy,'no-referrer');
assert.ok(!locked.sandbox.includes('allow-same-origin'));
assert.ok(!locked.sandbox.includes('allow-storage-access-by-user-activation'));
assert.equal(webCinemaFramePolicy('website',own+'/nexus-application-gateway/alchemist/',{appOrigin:own}).allowed,false);
assert.equal(webCinemaFramePolicy('website','http://example.org',{appOrigin:own}).allowed,false);
assert.equal(webCinemaFramePolicy('direct','https://example.org/file.mp4',{appOrigin:own}).allowed,false);
const official=webCinemaFramePolicy('official-video','https://www.pornhub.com/embed/placeholder123',{appOrigin:own,mode:'restricted'});
assert.equal(official.allowed,true);
assert.equal(official.mode,'compatible','Official video players need their documented browser origin');
assert.equal(officialShareEmbed('https://www.pornhub.com/view_video.php?viewkey=ph123456test').embed,'https://www.pornhub.com/embed/ph123456test');
assert.equal(officialShareEmbed('https://m.pornhub.com/view_video.php?viewkey=ph123456test&utm=abc').kind,'official-video');
assert.equal(officialShareEmbed('https://www.pornhub.com/embed/ph123456test').embed,'https://www.pornhub.com/embed/ph123456test');
assert.equal(officialShareEmbed('https://www.pornhub.com/view_video.php?viewkey=abc/../'),null);
assert.equal(officialShareEmbed('https://www.pornhub.com.fake.example/view_video.php?viewkey=ph123456test'),null);
assert.equal(officialShareEmbed('http://www.pornhub.com/view_video.php?viewkey=ph123456test'),null);
const original='https://www.pornhub.com/view_video.php?viewkey=ph123456test&source=original';
const parsed=classifyWebCinemaUrl(original);
assert.equal(parsed.kind,'official-video');
assert.equal(parsed.embed,'https://www.pornhub.com/embed/ph123456test');
assert.equal(parsed.url,original,'Saved addresses must remain the users original watch URLs');
const stored=addWebCinemaLink([],original,'Personal clip','Saved',17000,'foobar123');
assert.equal(stored.item.url,original);
assert.equal(stored.item.kind,'official-video');
assert.equal(normalizeWebCinemaLibrary(stored.items)[0].url,original,'Restart/import must preserve access/query parameters');
assert.equal(classifyWebCinemaUrl('https://video.example.org/page?viewkey=abc123&token=secret').kind,'website','Unknown provider viewkeys must not be guessed or rewritten');
for(const id of ['webCinemaFrameMode','webCinemaTryVideo','webCinemaHelp','webCinemaHelpText','webCinemaHelpDismiss','webCinemaSettings']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id+' missing or duplicated');
}
assert.ok(html.includes('<option value="compatible" selected>'),'Compatibility mode should be the default');
assert.ok(html.includes('web-cinema-settings'),'Advanced options should be collapsed');
assert.ok(client.includes('webCinemaFramePolicy(link.kind,link.embed'),'Apply browser-safe real iframe policy before loading');
assert.ok(client.includes('iframe.loading=policy.loading'),'User-invoked iframe must load eagerly in Safari');
assert.ok(client.includes('iframe.referrerPolicy=policy.referrerPolicy'),'Browser referrer should suit player compatibility');
assert.ok(client.includes("if(browserIsMobile){"),'Only phone experiences get nonblocking blank screen help');
assert.ok(client.includes("forceVideo=true")||client.includes('forceVideo:true'),'User can test video-only signed URLs');
assert.ok(client.includes('showHelp(')&&client.includes('webCinemaHelpDismiss'),'Empty iframe should offer useful recovery actions');
assert.ok(client.includes('removeAttribute(\'src\')'),'Leaving player must unload the third party');
assert.ok(client.includes("if(active?.url===output.item.url)currentSavedId=output.item.id"),'Saving another URL cannot overwrite current resume state');
assert.ok(css.includes('.web-cinema-help[hidden]'),'Help overlay stays hidden until useful');
assert.ok(sw.includes("'./web-cinema-compat.js'"),'Service worker must cache new policy module');
assert.ok(sync.includes(WEB_CINEMA_COMPAT_MODE_KEY)&&recover.includes(WEB_CINEMA_COMPAT_MODE_KEY),'Viewer choice must be portable with settings backup');
assert.equal([...html.matchAll(/<section class="studio" data-panel="([^"]+)"/g)].length,20,'No added studios');
assert.equal([...html.matchAll(/class="nav[^"]*" data-view="([^"]+)"/g)].length,20,'No additional sidebar clutter');
console.log('PASS v3.6.2: iOS browser iframe compatibility, official supported view-key embeds, original URLs unchanged, browser safety, diagnostics and existing private watch-later collection.');
