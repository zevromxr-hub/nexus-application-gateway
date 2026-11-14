// PROXIMUS v3.6.2 — compatible iframe rendering for Safari/iPhone and supported player share URLs.
// Embedded services keep their own access controls, region rules, authentication, and framing policies.
// This module never proxies pages or reads third-party sessions/cookies.
export const WEB_CINEMA_COMPAT_MODE_KEY='proximus-web-cinema-frame-mode-v1';
export const WEB_CINEMA_MODES=Object.freeze(['compatible','restricted']);
const officialViewHosts=new Set(['pornhub.com','www.pornhub.com','m.pornhub.com']);
const viewerKey=/^[a-z0-9]{6,55}$/i;

export function officialShareEmbed(input){
 let u;try{u=input instanceof URL?input:new URL(String(input));}catch{return null;}
 const host=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||!officialViewHosts.has(host))return null;
 if(u.pathname==='/view_video.php'){
  const key=u.searchParams.get('viewkey');
  if(!key||!viewerKey.test(key))return null;
  return {kind:'official-video',label:'Official video player',embed:'https://www.pornhub.com/embed/'+encodeURIComponent(key)};
 }
 if(u.pathname.startsWith('/embed/')){
  const key=u.pathname.slice('/embed/'.length).replace(/\/$/,'');
  if(!viewerKey.test(key))return null;
  return {kind:'official-video',label:'Official video player',embed:'https://www.pornhub.com/embed/'+encodeURIComponent(key)};
 }
 return null;
}

export function normalizeFrameMode(value){return WEB_CINEMA_MODES.includes(value)?value:'compatible';}

export function webCinemaFramePolicy(kind,src,{appOrigin='',mode='compatible'}={}){
 let target;try{target=new URL(String(src));}catch{return {allowed:false,reason:'Invalid embed URL'};}
 if(target.protocol!=='https:'||!['website','youtube','vimeo','official-video','custom-embed'].includes(kind))
  return {allowed:false,reason:'This address cannot be embedded as a website.'};
 // Scripts + same-origin must never be granted to a page sharing the application's origin.
 // Cross-origin providers stay isolated from PROXIMUS via the browser's same-origin policy.
 if(appOrigin&&target.origin===appOrigin)return {allowed:false,reason:'App-origin content is not allowed in this external viewer.'};
 const compatible=kind!=='website'||normalizeFrameMode(mode)==='compatible';
 const sandbox=compatible
  ?'allow-scripts allow-forms allow-same-origin allow-storage-access-by-user-activation allow-presentation'
  :'allow-scripts allow-forms allow-presentation';
 return {
  allowed:true,
  sandbox,
  referrerPolicy:compatible?'strict-origin-when-cross-origin':'no-referrer',
  allow:'fullscreen; picture-in-picture; encrypted-media; autoplay',
  loading:'eager',
  // Even compatible frames cannot open popups, download files or navigate the PROXIMUS top window.
  mode:compatible?'compatible':'restricted'
 };
}
