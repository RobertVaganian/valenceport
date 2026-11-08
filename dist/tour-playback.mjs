// A finite three-frame example. It always stops on the result; no hidden loops.
export function createTourPlayback(onChange,{schedule=setTimeout,cancel=clearTimeout,reduced=()=>false,delay=1900}={}){
 let phase=0,playing=false,timer=null;
 const state=()=>({phase,playing});
 const clear=()=>{if(timer!==null)cancel(timer);timer=null;};
 const emit=()=>onChange(state());
 function tick(){timer=null;if(!playing)return;phase=Math.min(2,phase+1);if(phase===2)playing=false;emit();if(playing)timer=schedule(tick,delay);}
 function start(){clear();phase=0;playing=!reduced();emit();if(playing)timer=schedule(tick,delay);}
 function toggle(){clear();if(playing){playing=false;emit();return;}if(phase===2)phase=0;playing=true;emit();timer=schedule(tick,delay);}
 function seek(next){clear();playing=false;phase=Math.max(0,Math.min(2,Number(next)||0));emit();}
 function stop(){clear();playing=false;}
 return {start,replay:start,toggle,seek,stop,state};
}
