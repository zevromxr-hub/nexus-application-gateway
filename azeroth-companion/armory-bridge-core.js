/* Azeroth Companion v2.8 - shared, pure item/character normalization. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.NexusArmoryBridgeCore=api;})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const regions=['us','eu','kr','tw'];
 function item(raw){const id=Number(raw?.id);if(!Number.isSafeInteger(id)||id<=0||id>9999999999)return null;const name=String(raw?.name||('Item #'+id)).trim().slice(0,140);const region=regions.includes(raw?.region)?raw.region:'us';return{id,name:name||'Item #'+id,region}}
 function profile(raw){const region=regions.includes(raw?.region)?raw.region:'us',realm=String(raw?.realm||'').toLowerCase().trim(),name=String(raw?.name||'').toLowerCase().trim();if(!/^[a-z0-9-]{2,80}$/.test(realm)||!/^[a-z0-9-]{2,50}$/.test(name))return null;return{region,realm,name}}
 function addProfile(list,entry){const p=profile(entry);if(!p)return Array.isArray(list)?list.slice(0,20):[];return[p,...(Array.isArray(list)?list:[]).map(profile).filter(x=>x&&!(x.region===p.region&&x.realm===p.realm&&x.name===p.name))].slice(0,20)}
 function collectGoals(raw){if(!Array.isArray(raw))return[];return raw.filter(g=>g&&Number.isSafeInteger(Number(g.id))&&Number(g.id)>0).map(g=>({id:Number(g.id),done:g.done===true,attempts:Number.isSafeInteger(g.attempts)?Math.max(0,g.attempts):0})).slice(0,200)}
 function summary(wishlist,goals){const items=Array.isArray(wishlist)?wishlist:[],tracked=collectGoals(goals),trackedIds=new Set(tracked.map(g=>g.id));return{wishlisted:items.length,tracked:tracked.length,farming:tracked.filter(g=>!g.done).length,obtained:tracked.filter(g=>g.done).length,untrackedWishlist:items.filter(x=>item(x)&&!trackedIds.has(Number(x.id))).length}}
 return{item,profile,addProfile,summary};
});
