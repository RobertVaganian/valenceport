import {ROUTES,dateAfter} from './model.mjs';
import {timelineFor} from './planning.mjs';
import {routeLocations} from './map-layout.mjs';
export function previewFrame(routeId,settings,progress) {
  const timeline=timelineFor(routeId,settings),route=ROUTES.find(route=>route.id===routeId),locations=routeLocations(route);
  const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0)),day=p*timeline.totalDays;
  const segment=timeline.segments.find(segment=>day<segment.endDay)||timeline.segments.at(-1);
  const index=timeline.segments.indexOf(segment);
  let previous=locations[0].name;
  for(let i=0;i<index;i++)if(locations.some(location=>location.name===timeline.segments[i].place))previous=timeline.segments[i].place;
  const destination=locations.some(location=>location.name===segment.place)?segment.place:previous;
  return {progress:p,index,count:timeline.segments.length,segment,from:previous,to:destination,
    legProgress:Math.max(0,Math.min(1,(day-segment.startDay)/segment.days)),
    date:dateAfter(Math.min(timeline.totalDays,Math.floor(day))),finished:p===1,totalDays:timeline.totalDays,
  };
}
export function nextPreviewStage(routeId,settings,progress) {
  const timeline=timelineFor(routeId,settings),day=progress*timeline.totalDays;
  const next=timeline.segments.find(segment=>segment.endDay>day+.001);
  return next?next.endDay/timeline.totalDays:1;
}
