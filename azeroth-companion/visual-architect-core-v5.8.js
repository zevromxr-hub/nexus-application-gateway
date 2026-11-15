/* NEXUS | AZEROTH v5.8 — pure scenario comparison. No writes or gameplay claims. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.NexusVisualArchitectCore=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const positive=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<=9999999999;
const safeRank=(map,id)=>{const x=map?.[String(id)];return Number.isSafeInteger(x)&&x>0?x:0};
function copySnapshot(raw,identity){
 if(!raw||raw.identity!==identity)return null;
 const ranks={},choices={};
 for(const [k,v]of Object.entries(raw.rankByNode||raw.allocations||{}).slice(0,1200)){
  if(positive(k)&&Number.isSafeInteger(v)&&v>=0&&v<=250)ranks[String(k)]=v;
 }
 for(const [k,v]of Object.entries(raw.choiceByNode||{}).slice(0,1200)){
  if(positive(k)&&Number.isSafeInteger(v)&&v>=0&&v<=16)choices[String(k)]=v;
 }
 return {identity,name:String(raw.name||'Working draft').slice(0,75),rankByNode:ranks,choiceByNode:choices};
}
function adjust(scenario,catalog,id,delta){
 const node=catalog.find(x=>Number(x.id)===Number(id)),step=Number(delta);
 if(!scenario||!node||![1,-1].includes(step))return null;
 const now=safeRank(scenario.rankByNode,node.id),max=Number(node.max);
 if(!Number.isSafeInteger(max)||max<1||max>250||now+step<0||now+step>max)return null;
 const result=copySnapshot(scenario,scenario.identity);
 result.rankByNode[String(node.id)]=now+step;
 return result;
}
function summary(s,catalog,edges){
 const byId=new Map(catalog.map(n=>[String(n.id),n]));
 const categories={class:0,spec:0,hero:0};const issues=[],advisories=[];
 let count=0;
 for(const [id,r]of Object.entries(s?.rankByNode||{})){
  if(!r)continue;
  const node=byId.get(id);
  if(!node){issues.push('Unknown node #'+id);continue}
  if(r>node.max)issues.push('Over maximum rank at #'+id);
  count++;if(Object.hasOwn(categories,node.category))categories[node.category]+=r;
 }
 for(const edge of edges||[]){
  if(safeRank(s?.rankByNode,edge.to)<=0)continue;
  if(!edge.resolved)advisories.push('Unresolved upstream node #'+edge.from+' for #'+edge.to);
  else if(safeRank(s.rankByNode,edge.from)===0)advisories.push('Zero planned points at source-linked node #'+edge.from+' for #'+edge.to);
 }
 return{categories,count,total:Object.values(categories).reduce((a,b)=>a+b,0),issues:issues.slice(0,25),advisories:advisories.slice(0,80),gameValidated:false};
}
function difference(a,b,catalog){
 const ids=[...new Set([...Object.keys(a?.rankByNode||{}),...Object.keys(b?.rankByNode||{}),...Object.keys(a?.choiceByNode||{}),...Object.keys(b?.choiceByNode||{})])];
 const catalogMap=new Map(catalog.map(n=>[String(n.id),n]));
 return ids.filter(positive).map(id=>{
 const n=catalogMap.get(id),from=safeRank(a?.rankByNode,id),to=safeRank(b?.rankByNode,id);
 const choiceA=Number(a?.choiceByNode?.[id]||0),choiceB=Number(b?.choiceByNode?.[id]||0);
 return{id:Number(id),name:n?.name||'Unknown returned node',category:n?.category||'unknown',from,to,delta:to-from,choiceA,choiceB};
 }).filter(x=>x.delta!==0||x.choiceA!==x.choiceB).sort((x,y)=>x.category.localeCompare(y.category)||x.name.localeCompare(y.name));
}
return{copySnapshot,adjust,summary,difference};
});
