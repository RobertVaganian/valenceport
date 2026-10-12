import {ROUTES,dateLabel} from './model.mjs';
import {routeLocations} from './map-layout.mjs';
import {previewFrame,nextPreviewStage} from './journey-preview-model.mjs';

export function journeyPlayer(icon) {
  return `<section class="journey-player" aria-label="Journey preview"><div class="journey-player-top"><button class="preview-play" data-action="preview-toggle" aria-label="Play journey preview">${icon('play',16)}<span>Preview journey</span></button><button class="icon-button preview-restart" data-action="preview-restart" aria-label="Restart journey preview" title="Restart preview">${icon('reset',16)}</button><span class="preview-disclaimer">Illustrative preview</span></div><div class="preview-position"><strong data-preview-place>Shanghai</strong><span data-preview-date></span></div><input class="preview-progress" data-preview-progress type="range" min="0" max="1000" value="0" step="1" aria-label="Journey preview position"><div class="preview-stage-caption"><span data-preview-task>Origin handling</span><span data-preview-stage>Stage 1</span></div></section>`;
}

// The player follows the planning stages. It never represents a live position.
export function createJourneyPreview(getSettings,icon) {
  let progress=0,playing=false,raf=0,previousTime=0,signature='',svg=null,path=null,checkpoints=new Map();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const duration=12000;
  function pause() { playing=false;cancelAnimationFrame(raf);previousTime=0;paint(); }
  function bindMap(next) {
    if(next===svg)return;
    svg=next;path=svg?.querySelector('.selected-path');checkpoints=new Map();
    if(!path)return;
    const length=path.getTotalLength();
    let start=0;
    for(const location of routeLocations(ROUTES.find(route=>route.id===getSettings().selected))) {
      let best=start,distance=Infinity;
      for(let sample=start;sample<=length;sample+=Math.max(.1,length/600)) {
        const point=path.getPointAtLength(sample),d=(point.x-location.point[0])**2+(point.y-location.point[1])**2;
        if(d<distance){distance=d;best=sample;}
      }
      let low=Math.max(start,best-length/600),high=Math.min(length,best+length/600);
      for(let i=0;i<18;i++) {
        const a=low+(high-low)/3,b=high-(high-low)/3,pa=path.getPointAtLength(a),pb=path.getPointAtLength(b);
        const da=(pa.x-location.point[0])**2+(pa.y-location.point[1])**2,db=(pb.x-location.point[0])**2+(pb.y-location.point[1])**2;
        if(da<db)high=b;else low=a;
      }
      best=location.endpoint?(location.index===0?0:length):(low+high)/2;
      checkpoints.set(location.name,best);start=best;
    }
  }
  function paint() {
    const root=document.querySelector('.journey-player');if(!root)return;
    const settings=getSettings(),frame=previewFrame(settings.selected,settings,progress);
    const button=root.querySelector('.preview-play');
    button.innerHTML=`${icon(reduced.matches?'chevron':playing?'pause':frame.finished?'reset':'play',16)}<span>${reduced.matches?(frame.finished?'Replay stages':'Next stage'):playing?'Pause preview':frame.finished?'Replay journey':progress>0?'Resume preview':'Preview journey'}</span>`;
    button.setAttribute('aria-label',reduced.matches?'Advance journey preview stage':playing?'Pause journey preview':frame.finished?'Replay journey preview':'Play journey preview');
    button.setAttribute('aria-pressed',String(playing));
    const range=root.querySelector('[data-preview-progress]');
    range.value=Math.round(progress*1000);range.style.setProperty('--progress',`${progress*100}%`);
    range.setAttribute('aria-valuetext',`${dateLabel(frame.date)} · ${frame.segment.place} · ${frame.segment.task}`);
    root.querySelector('[data-preview-place]').textContent=frame.finished?frame.to:frame.from!==frame.to?`To ${frame.to}`:frame.segment.kind==='delay'?`Port delay · ${frame.to}`:frame.to;
    root.querySelector('[data-preview-date]').textContent=dateLabel(frame.date);
    root.querySelector('[data-preview-task]').textContent=frame.finished?'Planned arrival':frame.segment.task;
    root.querySelector('[data-preview-stage]').textContent=`Stage ${frame.index+1} / ${frame.count}`;
    document.querySelectorAll('.journey-experience .journey-stage-card').forEach((card,index)=>{card.classList.toggle('is-active',index===frame.index);card.setAttribute('aria-pressed',String(index===frame.index));});
    const marker=svg?.querySelector('.journey-marker');
    if(marker&&path) {
      const from=checkpoints.get(frame.from)??0,to=checkpoints.get(frame.to)??from;
      const point=path.getPointAtLength(from+(to-from)*frame.legProgress);
      marker.setAttribute('transform',`translate(${point.x},${point.y})`);marker.toggleAttribute('hidden',progress===0&&!playing);
    }
    document.querySelectorAll('.map-stops [data-action="map-location"]').forEach(stop=>stop.classList.toggle('preview-stop',progress>0&&stop.dataset.value===frame.to));
  }
  function tick(now) {
    if(!playing)return;
    if(previousTime)progress=Math.min(1,progress+(now-previousTime)/duration);
    previousTime=now;paint();
    if(progress===1){pause();return;}raf=requestAnimationFrame(tick);
  }
  return {
    sync() {
      const settings=getSettings(),nextSignature=`${settings.selected}|${settings.fuel}|${settings.delay}`;
      const next=document.querySelector('.map-stage > .route-map');
      if(nextSignature!==signature){pause();progress=0;signature=nextSignature;}
      if(!document.querySelector('.journey-player')||document.querySelector('.overlay'))pause();
      bindMap(next);paint();
    },
    toggle() {
      if(reduced.matches){progress=progress===1?0:nextPreviewStage(getSettings().selected,getSettings(),progress);paint();return;}
      if(playing){pause();return;}
      if(progress===1)progress=0;
      playing=true;previousTime=0;paint();raf=requestAnimationFrame(tick);
    },
    restart(){pause();progress=0;paint();},
    seek(value){pause();progress=Math.max(0,Math.min(1,value));paint();},
    pause,
    isPlaying:()=>playing,
    getProgress:()=>progress,
    init(){document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});reduced.addEventListener('change',pause);},
  };
}
