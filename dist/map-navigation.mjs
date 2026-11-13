import { updateMapAnnotations } from "./map-annotations.mjs?v=mobile-1";
import {
  FIT_CAMERA,
  constrainCamera,
  zoomAt,
  wheelScale,
  cameraTransform,
  pinchAt,
} from "./map-camera.mjs?v=mobile-1";

export function createMapNavigation(getMap, getActiveLocation = () => null, onFit = () => {}) {
  let current = { ...FIT_CAMERA },
    target = { ...FIT_CAMERA },
    frame = 0,
    drag = null,
    suppressClickUntil = 0,
    observedMap,
    wheelFrame = 0, wheelTime = 0, wheelMap = null;
  const touches = new Map();
  let pinch = null;
  const reduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const staticMaps = new Set();
  const resizeObserver = new ResizeObserver(() => sync());

  function sync() {
    for(const map of staticMaps)if(!map.isConnected){resizeObserver.unobserve(map);staticMaps.delete(map);}
    for(const map of document.querySelectorAll('.case-map > .route-map')){
      if(!staticMaps.has(map)){staticMaps.add(map);resizeObserver.observe(map);}
      updateMapAnnotations(map,FIT_CAMERA);
    }
    const map = getMap();
    if (observedMap !== map) {
      touches.clear(); pinch = null; drag = null;
      if (observedMap) resizeObserver.unobserve(observedMap);
      observedMap = map;
      if (map) resizeObserver.observe(map);
    }
    if (!map) return;
    updateMapAnnotations(map,current,getActiveLocation());
    map.querySelector(".map-zoom").setAttribute("transform",`translate(${current.x} ${current.y}) scale(${current.scale})`);
    map.dataset.zoomed = String(current.scale > 1.01);
    map.dataset.zoom = current.scale.toFixed(3);
    const stage = map.closest(".map-stage"),
      output = stage.querySelector("[data-map-scale]");
    if (output) output.textContent = `${Math.round(current.scale * 100)}%`;
    const out = stage.querySelector('[data-action="zoom-out"]'),
      into = stage.querySelector('[data-action="zoom-in"]');
    if (out) out.disabled = target.scale <= 1.001;
    if (into) into.disabled = target.scale >= 5.999;
  }

  function move(next, animated = true, duration = 260) {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(wheelFrame);wheelFrame=0;wheelMap?.classList.remove("is-navigating");
    target = constrainCamera(next);
    if (!animated || reduced()) {
      current = { ...target };
      sync();
      return;
    }
    const start = { ...current },
      destination = { ...target },
      began = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - began) / duration),
        eased = 1 - (1 - progress) ** 3;
      current = Object.fromEntries(
        ["scale", "x", "y"].map((key) => [
          key,
          start[key] + (destination[key] - start[key]) * eased,
        ]),
      );
      sync();
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    sync();
  }

  function wheelTick(now){
    const dt=Math.min(48,Math.max(1,now-wheelTime));wheelTime=now;
    const amount=1-Math.exp(-dt/72);
    for(const key of ['scale','x','y'])current[key]+=(target[key]-current[key])*amount;
    const remaining=Math.abs(current.x-target.x)+Math.abs(current.y-target.y)+Math.abs(current.scale-target.scale)*100;
    if(remaining<.035){current={...target};wheelFrame=0;wheelMap?.classList.remove('is-navigating');sync();return;}
    sync();wheelFrame=requestAnimationFrame(wheelTick);
  }
  function pointInMap(map, clientX, clientY) {
    const matrix = map.getScreenCTM();
    return matrix
      ? new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
      : { x: 500, y: 305 };
  }
  function zoomBy(factor, point) {
    move(zoomAt(target, target.scale * factor, point));
  }
  function fit() {
    onFit();
    move(FIT_CAMERA,true,420);
  }

  function focusAt(point) {
    const scale=Math.max(2.1,target.scale);
    move({scale,x:500-point[0]*scale,y:305-point[1]*scale},true,440);
  }
  document.addEventListener('dblclick',event=>{
    const map=getMap();
    if(!map||!map.contains(event.target)||event.target.closest('[data-action]')||event.ctrlKey||event.metaKey)return;
    event.preventDefault();zoomBy(event.shiftKey?1/1.5:1.5,pointInMap(map,event.clientX,event.clientY));
  });
  document.addEventListener(
    "wheel",
    (event) => {
      const map = getMap();
      if (
        !map ||
        !map.contains(event.target) ||
        event.ctrlKey ||
        event.metaKey ||
        !event.deltaY
      )
        return;
      const scale = wheelScale(target.scale, event.deltaY, event.deltaMode);
      if (Math.abs(scale - target.scale) < 0.0001) return;
      event.preventDefault();
      target=zoomAt(target, scale, pointInMap(map,event.clientX,event.clientY));
      cancelAnimationFrame(frame);
      if(reduced()){current={...target};sync();return;}
      map.classList.add('is-navigating');wheelMap=map;
      if(!wheelFrame){wheelTime=performance.now();wheelFrame=requestAnimationFrame(wheelTick);}
    },
    { passive: false },
  );

  document.addEventListener("pointerdown", (event) => {
    const map = getMap();
    if (event.pointerType === 'touch' && map?.contains(event.target)) {
      // The embedded map leaves a one-finger swipe to the page.
      if (!map.closest('.planner-grid.map-wide')) return;
      if (touches.size >= 2) return;
      touches.set(event.pointerId, {x:event.clientX, y:event.clientY});
      if (touches.size === 2) {
        cancelAnimationFrame(frame); cancelAnimationFrame(wheelFrame); wheelFrame = 0;
        const [a,b] = [...touches.values()];
        pinch = {map, camera:{...current}, distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)), midpoint:pointInMap(map,(a.x+b.x)/2,(a.y+b.y)/2)};
        drag = null;
        for (const pointer of touches.keys()) map.setPointerCapture(pointer);
        map.classList.add('is-dragging');
        event.preventDefault();
        return;
      }
    }
    if (
      !map ||
      !map.contains(event.target) ||
      event.button !== 0 ||
      current.scale <= 1.01
    )
      return;
    cancelAnimationFrame(frame);cancelAnimationFrame(wheelFrame);wheelFrame=0;map.classList.remove("is-navigating");
    target = { ...current };
    drag = {
      map,
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: { ...current },
      moved: false,
    };
  });
  document.addEventListener("pointermove", (event) => {
    if (touches.has(event.pointerId)) touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if (pinch?.map.isConnected && touches.size >= 2) {
      const [a,b] = [...touches.values()];
      const midpoint = pointInMap(pinch.map,(a.x+b.x)/2,(a.y+b.y)/2);
      move(pinchAt(pinch.camera,pinch.camera.scale*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance,pinch.midpoint,midpoint),false);
      event.preventDefault();
      return;
    }
    if (!drag || event.pointerId !== drag.pointer || !drag.map.isConnected)
      return;
    if (
      !drag.moved &&
      Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4
    )
      return;
    drag.moved = true;
    drag.map.setPointerCapture(event.pointerId);
    drag.map.classList.add("is-dragging");
    const origin = pointInMap(drag.map, drag.x, drag.y),
      point = pointInMap(drag.map, event.clientX, event.clientY);
    move(
      {
        ...drag.start,
        x: drag.start.x + point.x - origin.x,
        y: drag.start.y + point.y - origin.y,
      },
      false,
    );
    event.preventDefault();
  });
  function endDrag(event) {
    if (pinch && !touches.has(event.pointerId)) return;
    const touchMap = pinch?.map || drag?.map;
    touches.delete(event.pointerId);
    if (pinch) {
      suppressClickUntil = performance.now() + 200;
      pinch = null;
      if (touchMap?.hasPointerCapture(event.pointerId)) touchMap.releasePointerCapture(event.pointerId);
      const remaining = [...touches.entries()][0];
      drag = remaining ? {map:touchMap,pointer:remaining[0],x:remaining[1].x,y:remaining[1].y,start:{...current},moved:false} : null;
      if (!drag) touchMap?.classList.remove('is-dragging');
      return;
    }
    if (!drag || event.pointerId !== drag.pointer) return;
    if (drag.moved) suppressClickUntil = performance.now() + 150;
    if (drag.map.hasPointerCapture(event.pointerId))
      drag.map.releasePointerCapture(event.pointerId);
    drag.map.classList.remove("is-dragging");
    drag = null;
  }
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);
  window.addEventListener("blur", () => {
    for (const pointer of touches.keys()) if (observedMap?.hasPointerCapture(pointer)) observedMap.releasePointerCapture(pointer);
    observedMap?.classList.remove('is-dragging');
    touches.clear(); pinch = null;
    if (drag) endDrag({ pointerId: drag.pointer });
  });
  document.addEventListener(
    "click",
    (event) => {
      if (
        performance.now() < suppressClickUntil &&
        getMap()?.contains(event.target)
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    const map = getMap();
    if (
      !map ||
      !map.contains(event.target) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    if(["+","=","-","0","Home"].includes(event.key))map.focus({preventScroll:true});
    if (event.key === "+" || event.key === "=") zoomBy(1.2);
    else if (event.key === "-") zoomBy(1 / 1.2);
    else if (event.key === "0" || event.key === "Home") fit();
    else if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) &&
      target.scale > 1
    ) {
      map.focus({preventScroll:true});
      const offsets = {
        ArrowLeft: [70, 0],
        ArrowRight: [-70, 0],
        ArrowUp: [0, 70],
        ArrowDown: [0, -70],
      };
      const [x, y] = offsets[event.key];
      move({ ...target, x: target.x + x, y: target.y + y });
    } else return;
    event.preventDefault();
  });
  return { sync, zoomBy, fit, focusAt, transform: () => cameraTransform(current) };
}
