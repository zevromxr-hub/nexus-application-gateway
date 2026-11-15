import {handlePersonal} from './personal-portal.js';
/* NEXUS Azeroth API v3.0 — Cloudflare Workers module
 * Deploy this file through Cloudflare's Worker editor. Never insert credentials here.
 * BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET stay in encrypted Worker secrets.
 */
const ORIGIN='https://zevromxr-hub.github.io';
const LOCALE={us:'en_US',eu:'en_GB',kr:'ko_KR',tw:'zh_TW'};
let bearer='',expiry=0,pending=null;
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':ORIGIN,'access-control-allow-methods':'GET, OPTIONS','access-control-allow-headers':'Content-Type, Accept','cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(message,status=400)=>json({success:false,message},status);
async function token(env){
 if(bearer&&Date.now()<expiry)return bearer;
 if(pending)return pending;
 pending=(async()=>{
  if(!env.BLIZZARD_CLIENT_ID||!env.BLIZZARD_CLIENT_SECRET)throw Error('Credentials not configured');
  const auth=btoa(env.BLIZZARD_CLIENT_ID+':'+env.BLIZZARD_CLIENT_SECRET);
  const r=await fetch('https://oauth.battle.net/token',{method:'POST',headers:{Authorization:'Basic '+auth,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('Blizzard OAuth unavailable');
  const d=await r.json();if(!d.access_token)throw Error('Blizzard OAuth token missing');
  bearer=d.access_token;expiry=Date.now()+Math.max(60,Number(d.expires_in||3600)-120)*1000;return bearer;
 })();
 try{return await pending}finally{pending=null}
}
async function blizzard(env,region,path,kind,query={}){
 const auth=await token(env),url=new URL('https://'+region+'.api.blizzard.com'+path);
 url.searchParams.set('namespace',kind+'-'+region);
 url.searchParams.set('locale',LOCALE[region]);
 for(const [key,value] of Object.entries(query))url.searchParams.set(key,String(value));
 const r=await fetch(url,{headers:{Authorization:'Bearer '+auth},signal:AbortSignal.timeout(12000)});
 if(!r.ok)return{error:r.status};
 return{data:await r.json()};
}
function nameOf(value,region){return typeof value==='string'?value:value?.[LOCALE[region]]||value?.en_US||value?.en_GB||''}
export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(u.pathname==='/account'||u.pathname==='/account/privacy'||u.pathname==='/account/app.js'||u.pathname.startsWith('/auth/')||u.pathname.startsWith('/api/me/'))return handlePersonal(request,env,u);
  if(request.method==='OPTIONS')return json({ok:true});
  if(request.method!=='GET')return fail('Method not allowed',405);
  if(u.pathname==='/'||u.pathname==='/health')return json({application:'NEXUS | AZEROTH COMPANION',service:'Blizzard API Gateway',version:'3.0.0',status:'online',credentialsConfigured:Boolean(env.BLIZZARD_CLIENT_ID&&env.BLIZZARD_CLIENT_SECRET),personalPortalConfigured:Boolean(env.AZEROTH_SESSION_SECRET&&String(env.AZEROTH_SESSION_SECRET).length>=32)});
  const p=u.pathname.split('/').filter(Boolean);
  if(p[0]!=='api'||p.length>6)return fail('Unknown route',404);
  const type=p[1],region=p[2],arg=p[3],arg2=p[4];
  if(!Object.hasOwn(LOCALE,region))return fail('Unsupported region');
  const goodId=/^[1-9][0-9]{0,9}$/,slug=/^[a-z0-9-]{2,80}$/,name=/^[a-z0-9-]{2,50}$/;
  let path,namespace,params={};
  if((type==='item'||type==='media')&&p.length===4&&goodId.test(arg)){
   path=type==='media'?'/data/wow/media/item/'+arg:'/data/wow/item/'+arg;namespace='static';
   }else if(type==='talent-index'&&p.length===3){
   path='/data/wow/talent-tree/index';namespace='static';
  }else if(type==='talent-tree'&&p.length===5&&goodId.test(arg)&&goodId.test(arg2)){
   path='/data/wow/talent-tree/'+arg+'/playable-specialization/'+arg2;namespace='static';
  }else if(type==='search'&&p.length===3){
   const q=(u.searchParams.get('q')||'').trim();
   if(q.length<2||q.length>70||/[<>]/.test(q))return fail('Search needs 2–70 valid characters');
   path='/data/wow/search/item';namespace='static';params['name.'+LOCALE[region]]=q;params._pageSize=20;params._page=1;
  }else if((type==='character'||type==='equipment')&&p.length===5&&slug.test(arg)&&name.test(arg2)){
   path='/profile/wow/character/'+arg+'/'+arg2+(type==='equipment'?'/equipment':'');namespace='profile';
  }else return fail('Unknown or invalid API route',404);
  try{
   const r=await blizzard(env,region,path,namespace,params);
   if(r.error)return fail(r.error===404?'Blizzard record not found':r.error===429?'Blizzard rate limit reached':'Blizzard request unavailable',r.error===404?404:r.error===429?429:502);
   let data=r.data;
   if(type==='search'){
    data={query:u.searchParams.get('q'),items:(Array.isArray(data.results)?data.results:[]).map(row=>({id:Number(row?.data?.id),name:nameOf(row?.data?.name,region),quality:nameOf(row?.data?.quality?.name,region),level:row?.data?.level??null})).filter(row=>Number.isSafeInteger(row.id)&&row.id>0&&row.name).slice(0,20),page:data.page||1};
   }
   if(type==='media'){
    data={id:Number(arg),assets:(Array.isArray(data.assets)?data.assets:[]).filter(a=>a&&a.key&&typeof a.value==='string'&&/^https:\/\//.test(a.value)).slice(0,10).map(a=>({key:a.key,url:a.value}))};
   }
   return json({success:true,source:'Blizzard Battle.net API',region,fetchedAt:new Date().toISOString(),data});
  }catch(error){console.error('Blizzard upstream unavailable');return fail('Blizzard upstream temporarily unavailable',502)}
 }
};