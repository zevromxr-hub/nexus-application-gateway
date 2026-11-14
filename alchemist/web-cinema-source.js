// PROXIMUS v3.6.3 — Embed First media source bridge.
// The original source URL is preserved. Embedded markup is NEVER executed, injected or stored.
import {classifyWebCinemaUrl,parseWebCinemaUrl} from './web-cinema-core.js';
export const WEB_CINEMA_SOURCE_MODES=Object.freeze(['auto','embed','native','website']);
export function normalizeWebCinemaSourceMode(mode){
 return WEB_CINEMA_SOURCE_MODES.includes(mode)?mode:'auto';
}
function decodeEntities(value){
 return String(value).replace(/&(?:amp|quot|apos|#39|#34|#38|lt|gt);/gi,m=>({
  '&amp;':'&','&quot;':'"','&apos;':"'",'&#39;':"'",'&#34;':'"','&#38;':'&','&lt;':'<','&gt;':'>'
 })[m.toLowerCase()]||m);
}
function candidateSrc(markup){
 const text=String(markup||'').trim();
 if(!text||text.length>12000)throw Error('Provide a player URL or a short official embed snippet (maximum 12,000 characters).');
 if(text.startsWith('<')){
  const iframe=[...text.matchAll(/<iframe\b([^>]*)>/gi)];
  if(iframe.length>1)throw Error('Use one official embedded player at a time.');
  const video=[...text.matchAll(/<(?:video|source)\b([^>]*)>/gi)];
  const tag=iframe[0]||video[0];
  if(!tag)throw Error('Only official iframe, video, or source tags are supported. Scripts and arbitrary HTML are never executed.');
  const match=/(?:^|\s)src\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(tag[1]);
  if(!match)throw Error('The embed code has no playable src address.');
  return {url:decodeEntities(match[1]||match[2]||match[3]||''),mode:iframe.length?'embed':'native'};
 }
 return {url:decodeEntities(text),mode:'embed'};
}
export function parseWebCinemaPlayerInput(raw,{hint='embed',appOrigin=''}={}){
 const extracted=candidateSrc(raw);
 const u=parseWebCinemaUrl(extracted.url);
 if(u.protocol!=='https:')throw Error('Player sources must use HTTPS.');
 if(appOrigin&&u.origin===appOrigin)throw Error('PROXIMUS itself cannot be used as an external player.');
 const mode=extracted.mode==='native'?'native':normalizeWebCinemaSourceMode(hint)==='native'?'native':'embed';
 return {playerUrl:u.href,playerMode:mode};
}
export function normalizeSavedPlayback(row,{appOrigin=''}={}){
 const mode=normalizeWebCinemaSourceMode(row?.playerMode);
 if(mode!=='embed'&&mode!=='native'&&mode!=='website')return {playerMode:'auto',playerUrl:''};
 if(mode==='website')return {playerMode:'website',playerUrl:''};
 if(!row?.playerUrl)return {playerMode:'auto',playerUrl:''};
 try{
  const u=parseWebCinemaUrl(row.playerUrl);
  if(u.protocol!=='https:'||(appOrigin&&u.origin===appOrigin))return {playerMode:'auto',playerUrl:''};
  return {playerMode:mode,playerUrl:u.href};
 }catch{return {playerMode:'auto',playerUrl:''};}
}
export function webCinemaPlaybackPlan(raw,source={},appOrigin=''){
 const original=classifyWebCinemaUrl(raw),normalized=normalizeSavedPlayback(source,{appOrigin});
 if(original.kind==='external'&&(normalized.playerMode==='auto'||!original.secure||original.host==='zevromxr-hub.github.io'))
  return {...original,mode:'external',displayUrl:original.url};
 if(normalized.playerMode==='embed'){
  return {...original,kind:'custom-embed',embed:normalized.playerUrl,mode:'embed',
   label:'Official embedded player',displayUrl:original.url};
 }
 if(normalized.playerMode==='native'){
  return {...original,kind:'direct',embed:null,mode:'native',mediaUrl:normalized.playerUrl,
   label:'Native video source',displayUrl:original.url};
 }
 if(normalized.playerMode==='website'){
  return {...original,kind:'website',embed:original.url,mode:'website',label:'Website preview',displayUrl:original.url};
 }
 return {...original,mode:'auto',mediaUrl:original.kind==='direct'?original.url:undefined,
  displayUrl:original.url};
}
export function displayWebCinemaUrl(input){
 try{
  const u=new URL(input);
  for(const key of [...u.searchParams.keys()]){
   if(/^(?:token|access[_-]?key|auth|authorization|secret|signature|sig|jwt|session|expires?|policy)$/i.test(key))
    u.searchParams.set(key,'•••');
  }
  return u.href;
 }catch{return 'Saved web address';}
}
