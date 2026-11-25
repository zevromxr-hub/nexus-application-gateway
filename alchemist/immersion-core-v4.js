/* PROXIMUS v4.0.0 / IMMERSIVE DOMINION — settings and palette.
 * Appearance is device-local. No personal video, cover or audio data is rewritten.
 */
export const IMMERSION_KEY='proximus-immersion-v400';
export const IMMERSION_SCENES=Object.freeze({
 sovereign:{name:'Sovereign Violet',main:'#c5a0ff',alt:'#80e8f5',glow:'#a15cff',dark:'#0e0926'},
 frost:{name:'Frozen Dominion',main:'#91d8ff',alt:'#d6f7ff',glow:'#5ea7ff',dark:'#071b32'},
 obsidian:{name:'Obsidian Gold',main:'#f7d39d',alt:'#e9a86b',glow:'#d49b51',dark:'#19130e'},
 ember:{name:'Ember Throne',main:'#ffb4a1',alt:'#ffd18a',glow:'#ef7050',dark:'#281014'},
 eclipse:{name:'Midnight Eclipse',main:'#c1b6f8',alt:'#94acd7',glow:'#6f71c8',dark:'#090c1c'}
});
export function normalizeImmersion(input={}){
 const o=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const limit=(v,a,b,d)=>v===null||v===''||!Number.isFinite(Number(v))?d:Math.min(b,Math.max(a,Math.round(Number(v))));
 return {scene:Object.hasOwn(IMMERSION_SCENES,o.scene)?o.scene:'sovereign',
  intensity:limit(o.intensity,25,100,78),glass:limit(o.glass,55,98,83),
  motion:['auto','on','off'].includes(o.motion)?o.motion:'auto',
  clarity:o.clarity==='bright'?'bright':'balanced'};
}
export function formatStorageBytes(value){
 const n=Number(value);
 if(!Number.isFinite(n)||n<0)return 'Unavailable';
 if(n<1024)return n+' B';
 if(n<1024**2)return (n/1024).toFixed(1)+' KB';
 if(n<1024**3)return (n/1024**2).toFixed(1)+' MB';
 return (n/1024**3).toFixed(2)+' GB';
}
export function storageRisk(usage,quota){
 if(!Number.isFinite(usage)||!Number.isFinite(quota)||quota<=0)return {label:'Unknown',state:'unknown',percent:null};
 const ratio=Math.max(0,usage/quota);
 return {label:ratio>=.9?'Almost full':ratio>=.75?'Getting full':'Available',state:ratio>=.9?'high':ratio>=.75?'moderate':'good',percent:Math.round(ratio*100)};
}
