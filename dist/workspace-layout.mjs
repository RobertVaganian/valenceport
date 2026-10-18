// Match the inspector to the map without distorting the geographic projection.
let observed, frame=0;
const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(syncWorkspaceLayout);});
export function syncWorkspaceLayout(){
 const panel=document.querySelector('.planner-grid:not(.map-wide) > .map-panel');
 const inspector=panel?.parentElement.querySelector('.planning-panel');
 if(observed!==panel){observer.disconnect();observed=panel;if(panel)observer.observe(panel);}
 const height=panel&&panel.querySelector('.map-mode-map')&&innerWidth>1150?Math.round(panel.offsetHeight):0;
 if(inspector){inspector.style.maxHeight=height?height+'px':'';inspector.classList.toggle('balanced-inspector',height>0);}
}
window.addEventListener('resize',syncWorkspaceLayout);
