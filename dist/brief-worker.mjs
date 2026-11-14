import {BRIEF_MODEL,PRIORITIES} from './brief-model.mjs';
let extractor;
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
self.onmessage=async({data})=>{
 if(data.type!=='interpret')return;const {requestId,fingerprint,intent}=data;const send=value=>self.postMessage({...value,requestId});
 try{
  if(!extractor){const {pipeline,env}=await import(BRIEF_MODEL.runtime);env.allowLocalModels=false;env.useBrowserCache=true;env.backends.onnx.wasm.numThreads=1;let last=0;
   extractor=await pipeline('feature-extraction',BRIEF_MODEL.id,{revision:BRIEF_MODEL.revision,device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress'&&performance.now()-last>180){last=performance.now();send({type:'status',phase:'loading',message:p.file?.endsWith('.onnx')?'Loading model weights…':'Loading model files…',progress:Math.min(100,Math.max(0,Math.round(p.progress||0)))});}}});send({type:'ready'});
  }
  send({type:'status',phase:'interpreting',message:'Comparing the brief with the planning priorities…'});
  const vectors=(await extractor([intent,...PRIORITIES.flatMap(p=>p.texts)],{pooling:'mean',normalize:true})).tolist();let i=1;
  const scores=PRIORITIES.map(p=>({id:p.id,score:p.texts.reduce(sum=>sum+dot(vectors[0],vectors[i++]),0)/p.texts.length}));
  send({type:'complete',fingerprint,scores});
 }catch{send({type:'error'});}
};
