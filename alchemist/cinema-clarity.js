// PROXIMUS v3.5.2 — video clarity and non-destructive companion studio controls.
export const CINEMA_VIEWS_KEY='proximus-cinema-views-v1';
export function normalizeCinemaViews(raw={}){
 const v=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 return {vaultFit:v.vaultFit==='cover'?'cover':'contain',vaultFocus:v.vaultFocus===true,
  theaterFit:v.theaterFit==='cover'?'cover':'contain',theaterWide:v.theaterWide===true};
}
export function quickClipWindow({playhead=0,duration=0,seconds=3}={}){
 const d=Number(duration),s=Number(seconds),p=Number(playhead);
 if(!Number.isFinite(d)||d<=0||!Number.isFinite(s)||s<=0||!Number.isFinite(p))return null;
 const end=Math.max(.1,Math.min(d,Math.max(0,p)+s));
 const start=Math.max(0,end-Math.min(d,s));
 if(end-start<.1)return null;
 return {start:Math.round(start*100)/100,end:Math.round(end*100)/100};
}
export function initCinemaStudioImprovements(){
 const vault=document.getElementById('videoVaultStudio'),
  stage=vault?.querySelector('.video-vault-stage'),
  vaultVideo=document.getElementById('videoVaultPlayer'),
  theater=document.querySelector('[data-panel="theater"]'),
  theaterVideo=document.getElementById('theaterVideo');
 if(!vault||!stage||!vaultVideo||!theater||!theaterVideo)return;
 let settings=normalizeCinemaViews();
 try{settings=normalizeCinemaViews(JSON.parse(localStorage.getItem(CINEMA_VIEWS_KEY)||'{}'));}catch{}
 const get=id=>document.getElementById(id);
 const status=(id,message)=>{const node=get(id);if(node)node.textContent=message;};
 function apply(){
  // The Video Vault always has an opaque black matte, independent of the global site media publisher.
  vault.style.setProperty('--vault-video-fit',settings.vaultFit);
  vault.classList.toggle('vault-focus-mode',settings.vaultFocus);
  theater.classList.toggle('theater-wide-mode',settings.theaterWide);
  theater.style.setProperty('--theater-video-fit',settings.theaterFit);
  get('videoVaultPictureFit').value=settings.vaultFit;
  get('theaterVideoFit').value=settings.theaterFit;
  const focus=get('videoVaultFocus');
  focus.textContent=settings.vaultFocus?'↙ Return to library':'⛶ Focus on player';
  focus.setAttribute('aria-pressed',String(settings.vaultFocus));
  const wide=get('theaterWide');
  wide.textContent=settings.theaterWide?'↙ Show playlist layout':'▣ Wide theater stage';
  wide.setAttribute('aria-pressed',String(settings.theaterWide));
  status('videoVaultClarityStatus','Picture is rendered over a solid black background · '+(settings.vaultFit==='contain'?'Fit complete frame':'Fill / crop edges')+' · '+(settings.vaultFocus?'Cinema Focus':'Library layout'));
 }
 function save(){
  try{localStorage.setItem(CINEMA_VIEWS_KEY,JSON.stringify(settings));}
  catch{status('videoVaultClarityStatus','Picture settings applied for this session. Browser storage is unavailable; export a settings backup if needed.');}
 }
 get('videoVaultPictureFit').addEventListener('change',e=>{
  settings.vaultFit=e.currentTarget.value==='cover'?'cover':'contain';apply();save();
 });
 get('videoVaultFocus').addEventListener('click',()=>{
  settings.vaultFocus=!settings.vaultFocus;apply();save();
  if(settings.vaultFocus)stage.scrollIntoView({block:'start',behavior:'auto'});
 });
 get('videoVaultClarityReset').addEventListener('click',()=>{
  settings.vaultFit='contain';settings.vaultFocus=false;apply();save();
 });
 get('theaterVideoFit').addEventListener('change',e=>{
  settings.theaterFit=e.currentTarget.value==='cover'?'cover':'contain';apply();save();
  status('theaterViewStatus',settings.theaterFit==='cover'?'Video fills the player, cropping edges.':'Original video frame fully visible.');
 });
 get('theaterWide').addEventListener('click',()=>{
  settings.theaterWide=!settings.theaterWide;apply();save();
  status('theaterViewStatus',settings.theaterWide?'Wide Theater mode enabled. Your existing queue remains available below.':'Two-panel Media Theater layout restored.');
 });
 // Animation Forge: one-click clip windows use the real loaded video duration.
 document.querySelectorAll('[data-animation-clip]').forEach(button=>{
  button.addEventListener('click',()=>{
   const video=get('animVideo'),seconds=Number(button.dataset.animationClip);
   if(!video||video.hidden){
    status('animStatus','Quick clip requires a loaded video. Select a video from Files or Video Vault first.');return;
   }
   const range=quickClipWindow({playhead:video.currentTime,duration:video.duration,seconds});
   if(!range){status('animStatus','Wait for the video metadata to load, then use Quick Clip again.');return;}
   get('animStart').value=String(range.start);
   get('animEnd').value=String(range.end);
   get('animStart').dispatchEvent(new Event('input',{bubbles:true}));
   get('animEnd').dispatchEvent(new Event('input',{bubbles:true}));
   status('animStatus','Selected '+seconds+'s Quick Clip from '+range.start.toFixed(2)+'s to '+range.end.toFixed(2)+'s. Review the frame budget before exporting.');
  });
 });
 document.addEventListener('proximus-view-changed',event=>{
  if(event.detail?.studio==='videos')apply();
 });
 apply();
 status('theaterViewStatus','Choose between original framing and fill/crop for local video playback.');
}
