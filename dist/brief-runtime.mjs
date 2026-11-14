import {BRIEF_MODEL,PRIORITIES,suggestPriority} from './brief-model.mjs';
export function createBriefRuntime(onChange,{workerFactory=()=>new Worker(new URL('./brief-worker.mjs',import.meta.url),{type:'module'}),deadline=120000}={}){
 let worker=null,timer=null,epoch=0;const value={phase:'idle',loaded:false,result:null,progress:null,message:''};const emit=()=>onChange({...value});
 function stop(message='Model unloaded. Downloaded files may remain in the browser cache.') {++epoch;clearTimeout(timer);worker?.terminate();worker=null;Object.assign(value,{phase:'idle',loaded:false,result:null,progress:null,message});emit();}
 function fail(message){stop(message);value.phase='error';emit();}
 function interpret(parsed){
  if(!parsed.valid||['loading','interpreting','removing'].includes(value.phase))return false;
  const requestId=++epoch;Object.assign(value,{phase:value.loaded?'interpreting':'loading',result:null,progress:null,message:'Preparing the local interpretation…'});emit();
  try{worker ||= workerFactory();const active=worker;
   worker.onmessage=({data})=>{if(epoch!==requestId||worker!==active||data.requestId!==requestId)return;
    if(data.type==='ready'){value.loaded=true;return;}
    if(data.type==='status'){Object.assign(value,{phase:data.phase,progress:data.progress??null,message:data.message});emit();}
    if(data.type==='complete'){clearTimeout(timer);if(data.fingerprint!==parsed.fingerprint||!PRIORITIES.every(p=>Number.isFinite(data.scores?.find(s=>s.id===p.id)?.score))){fail('The model returned an incomplete interpretation. Try again.');return;}Object.assign(value,{phase:'complete',progress:null,message:'Interpreted on this device.',result:{fingerprint:parsed.fingerprint,priority:suggestPriority(data.scores),parsed}});emit();}
    if(data.type==='error')fail('Local AI could not run here. Check your connection or preview the parsed limits without AI.');
   };
   worker.onerror=()=>{if(epoch===requestId)fail('This browser could not run the model. The rules-only preview remains available.');};
   timer=setTimeout(()=>{if(epoch===requestId)fail('The local run took too long and was stopped. You can retry.');},deadline);
   worker.postMessage({type:'interpret',requestId,fingerprint:parsed.fingerprint,intent:parsed.intent});return true;
  }catch{fail('This browser could not start a local worker. Use the rules-only preview.');return false;}
 }
 async function removeModel(){stop('Removing downloaded model files…');value.phase='removing';emit();try{if(!globalThis.caches)throw Error();for(const name of await caches.keys()){const cache=await caches.open(name);for(const request of await cache.keys())if(decodeURIComponent(request.url).includes(`${BRIEF_MODEL.id}/resolve/`))await cache.delete(request);}value.message='Model files removed from this site’s cache. Shared runtime files may remain.';}catch{value.message='Model unloaded. Clear the browser’s site data to remove retained files.';}value.phase='idle';emit();}
 return {value,interpret,stop,removeModel};
}
