/* NEXUS Azeroth Companion — collision-safe tree layout.
 * Preserve Blizzard's valid coordinates when possible.
 * Reposition colliding nodes and append missing-coordinate nodes.
 * Layout is visual only and never implies talent eligibility.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.NexusTalentLayout=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function arrange(nodes,columns=14){
  const source=Array.isArray(nodes)?nodes:[];
  const count=Math.max(1,Math.min(24,Math.floor(columns)||14));
  const locations={},occupied=new Set();
  const placed=new Set();
  const valid=n=>Number.isInteger(n?.display_row)&&Number.isInteger(n?.display_col)&&n.display_row>=0&&n.display_col>=0&&n.display_col<count&&n.display_row<=69;
  const positioned=source.filter(valid).sort((a,b)=>a.display_row-b.display_row||a.display_col-b.display_col||Number(a.id)-Number(b.id));
  let maxOriginal=-1,adjusted=0;
  for(const node of positioned)maxOriginal=Math.max(maxOriginal,node.display_row);
  function store(n,row,col,reason){
   const id=Number(n.id);if(!Number.isSafeInteger(id)||id<=0||placed.has(id))return;
   const key=row+':'+col;
   occupied.add(key);placed.add(id);
   locations[id]={row:row+1,col:col+1,adjusted:Boolean(reason),reason:reason||''};
   if(reason)adjusted++;
  }
  // Place each unique valid original coordinate first, so collisions do not
  // dislodge another node with an authoritative distinct coordinate.
  for(const node of positioned){
   const key=node.display_row+':'+node.display_col;
   if(!occupied.has(key))store(node,node.display_row,node.display_col,'');
  }
  for(const node of positioned){
   const id=Number(node.id);if(placed.has(id))continue;
   const preferred=node.display_col;
   let row=node.display_row,col=preferred;
   let found=false;
   for(let offset=0;offset<Math.max(1,source.length+count);offset++){
    const r=row+Math.floor(offset/count);
    for(let d=0;d<count;d++){
     const c=(preferred+d)%count;
     if(!occupied.has(r+':'+c)){row=r;col=c;found=true;break}
    }
    if(found)break;
   }
   if(found)store(node,row,col,'Blizzard position overlaps another node');
  }
  let fallbackRow=Math.max(0,maxOriginal+1);
  for(const node of source){
   const id=Number(node?.id);if(!Number.isSafeInteger(id)||id<=0||placed.has(id))continue;
   let row=fallbackRow,col=0;
   while(occupied.has(row+':'+col)){col++;if(col>=count){col=0;row++}}
   store(node,row,col,'Blizzard position missing or outside supported grid');
   fallbackRow=row;
  }
  return{locations,adjusted,total:placed.size,columns:count};
 }
 return{arrange};
});
