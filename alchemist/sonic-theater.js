// PROXIMUS v3.5.3 | Unified Sonic Theater.
// An additive DOM composition: all legacy element IDs, audio library bytes, Reactor
// effects, presets and settings are preserved. The old "theater" route is an alias.
export const SONIC_THEATER_ROUTE='reactor';
export const SONIC_THEATER_LEGACY='theater';
export const SUPPORTED_MUSIC_EXTENSIONS='.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.aiff,.aif,.mp4,.webm';
export function sonicMediaKind(file){
 const name=String(file?.name||'').toLowerCase();
 const type=String(file?.type||'').toLowerCase();
 if(type.startsWith('audio/')||/\.(mp3|wav|m4a|aac|ogg|flac|opus|aiff|aif)$/i.test(name))return 'audio';
 if(type.startsWith('video/')||/\.(mp4|webm|m4v|mov|ogv)$/i.test(name))return 'video';
 if(type.startsWith('image/')||/\.(gif|png|jpe?g|webp)$/i.test(name))return 'image';
 return null;
}
export function isAudioPlaybackSupported(file,mediaElement){
 if(sonicMediaKind(file)!=='audio')return false;
 // Empty MIME types are common in iOS Files. Browser decoder validation happens
 // at playback, not at selection; unknown MIME must not reject a valid MP3.
 if(!mediaElement?.canPlayType)return true;
 const type=String(file?.type||'').toLowerCase();
 if(!type)return true;
 if(type==='application/octet-stream')return true;
 return true;
}
export function mountUnifiedSonicTheater(){
 const theater=document.querySelector('.studio[data-panel="theater"]');
 const reactor=document.querySelector('.studio[data-panel="reactor"]');
 if(!theater||!reactor||reactor.querySelector('#sonicUnifiedWorkspace'))return false;
 const workspace=theater.querySelector('.workspace.image-grid');
 const stage=reactor.querySelector('#reactorStage');
 if(!workspace||!stage)return false;
 const panels=Array.from(workspace.children).filter(x=>x.classList.contains('panel'));
 if(panels.length<2)return false;
 const holder=document.createElement('section');holder.id='sonicUnifiedWorkspace';
 holder.className='sonic-unified-workspace';holder.setAttribute('aria-label','Saved music, playlists and live Reactor visualizer');
 const grid=document.createElement('div');grid.className='sonic-unified-top';
 const visual=document.createElement('div');visual.className='sonic-unified-visual';
 const library=document.createElement('div');library.className='sonic-unified-library';
 const heading=document.createElement('div');heading.className='sonic-unified-intro';
 heading.innerHTML='<strong>SONIC THEATER · ALL-IN-ONE ENTERTAINMENT</strong><p>Import MP3s, save your playlist, play music and watch your custom Reactor simultaneously. Play on Start stays beside the saved music library.</p>';
 visual.append(stage);library.append(panels[0]);grid.append(visual,library);
 const advanced=document.createElement('details');advanced.className='sonic-unified-advanced';
 advanced.id='sonicTheaterAdvanced';const summary=document.createElement('summary');
 summary.textContent='▣ Advanced Theater playback · video / GIF, visualizer and media exports';
 advanced.append(summary,panels[1]);
 holder.append(heading,grid,advanced);
 const monitor=reactor.querySelector('.reactor-monitor');
 reactor.insertBefore(holder,monitor||reactor.firstElementChild);
 const headingText=reactor.querySelector('.section-heading h2');
 if(headingText)headingText.innerHTML='SONIC THEATER <span class="subtitle">Saved Music Library · Sovereign Reactor · Sonic Dimension · PC + iPhone</span>';
 // Old route remains in the DOM for release checks, bookmarks and legacy imports.
 theater.classList.add('sonic-theater-retained-route');
 const entry=theater.querySelector('.section-heading h2');
 if(entry)entry.textContent='Sonic Theater has moved to the unified Reactor workspace.';
 const input=document.getElementById('theaterFiles');
 if(input)input.setAttribute('accept','audio/*,video/*,image/gif,image/png,image/jpeg,image/webp,'+SUPPORTED_MUSIC_EXTENSIONS+', .mov,.m4v');
 const title=reactor.querySelector('.reactor-heading strong');
 if(title)title.textContent='SONIC THEATER / SOVEREIGN REACTOR IV';
 document.querySelectorAll('.nav[data-view="theater"]').forEach(node=>{node.hidden=true;node.setAttribute('aria-hidden','true');});
 // Non-destructive: saves, local media, personal themes, and old event IDs untouched.
 document.documentElement.classList.add('sonic-theater-integrated');
 return true;
}
