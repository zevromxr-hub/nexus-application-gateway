// PROXIMUS v3.4 — adaptive display classification. No device fingerprints are stored.
export const LAYOUT_KEY='proximus-adaptive-layout-v1';
export const LAYOUT_MODES=['auto','desktop','mobile'];
export function safeLayoutChoice(value){return LAYOUT_MODES.includes(value)?value:'auto';}
export function detectInterfaceMode({width=1024,coarse=false,hover=true,ua='',override='auto'}={}){
 override=safeLayoutChoice(override);
 const w=Number.isFinite(Number(width))?Math.max(0,Number(width)):1024;
 const phone=/iPhone|iPod|Android.*Mobile|Windows Phone/i.test(String(ua));
 const tablet=/iPad|Android(?!.*Mobile)/i.test(String(ua));
 const mode=override!=='auto'?override:phone&&w<1080?'mobile':coarse&&!hover&&w<=900?'mobile':'desktop';
 const compact=w<=860;
 const kind=phone?'phone':tablet?'tablet':coarse&&!hover?'touch device':'desktop/browser';
 return {mode,compact,kind,source:override==='auto'?'auto':'manual',width:w};
}
