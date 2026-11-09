import { appUrl, appPath } from './paths.mjs';
import {advisoryDialog} from './corridor-advisory.mjs';
import {planningLimitsForm,createPlanningControls} from './planning-controls.mjs';
import {createTourPlayback} from './tour-playback.mjs';
import {createPresetMenu} from './preset-menu.mjs';
import {createProfileMenu} from './profile-menu.mjs';
import {caseStudyView} from './case-editorial.mjs';
import {guideView,guideFrame,guideSteps as tourSteps} from './guide.mjs';
import {loadGeography} from './geography-base.mjs';
import {
  ROUTES,
  DEFAULTS,
  DEPARTURE,
  evaluate,
  rankRoutes,
  visibleRoutes,
  dateLabel,
  money,
  validateSettings,
  snapshotDecision,
  applyStressPreset,
  referenceRoute,
} from "./model.mjs";

import {scenarioImpact} from "./scenario-impact.mjs";
import {plannerView} from "./planner-view.mjs";
import {mapReference,nextTableSort} from "./planner-model.mjs";
import {createJourneyPreview,journeyPlayer} from "./journey-preview.mjs";
import { captureMotion, playMotion } from "./motion.mjs";
import { syncWorkspaceLayout } from "./workspace-layout.mjs";
import { createMapNavigation } from "./map-navigation.mjs";
import { routeMap } from "./route-map.mjs";
import { routeLocations } from "./map-layout.mjs";
import { geometryId } from "./route-geometry.mjs";
import { routeComparisonCsv, timelineFor } from "./planning.mjs";
import {
  comparisonWorkbench,
  chartTooltip,
  statusPill,
} from "./planning-views.mjs";

import {tradeoffView, journeyView} from "./analysis-views.mjs";
import {MAX_SCENARIOS,MAX_BACKUP_BYTES,normaliseScenarios,scenarioTitle,validTitle,updateScenario,createBackup,readBackup,planImport} from "./workspace-model.mjs";
import {collectionView,assumptionsView,recommendationView} from "./workspace-views.mjs";

await loadGeography();

const $ = (s, root = document) => root.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const shapes = {
  play: "m8 4 13 8-13 8Z",
  sort: "m8 8 4-4 4 4m-8 8 4 4 4-4",
  "sort-up": "M12 20V4m-5 5 5-5 5 5",
  "sort-down": "M12 4v16m-5-5 5 5 5-5",
  pause: "M8 4v16M16 4v16",
  panel: "M3 4h18v16H3ZM9 4v16",
  layers: "m12 3 10 6-10 6L2 9ZM2 15l10 6 10-6",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z",
  edit: "m15 4 5 5M4 16 16 4a2 2 0 0 1 4 4L8 20H4Z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  upload: "M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  route:
    "M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 15V8a3 3 0 0 1 3-3h4M19 9v7a3 3 0 0 1-3 3h-4",
  folder: "M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3Z",
  history: "M3 10a9 9 0 1 1 1 7M3 4v6h6M12 7v5l3 2",
  arrow: "M4 12h15M14 7l5 5-5 5",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  up: "m6 15 6-6 6 6",
  ship: "M4 10h16l1 7-9 4-9-4ZM7 10V5h10v5M10 5V2h4v3M12 11v9",
  train:
    "M6 17h12V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2ZM6 10h12M9 14h.01M15 14h.01M8 17l-2 4M16 17l2 4",
  plane: "m21 3-6 18-4-8-8-4ZM11 13 21 3",
  mixed: "M3 8h12l3 4v6H3ZM15 8V4H7v4M7 18v2M15 18v2M18 12h3v6h-3",
  leaf: "M20 3c1 9-2 16-9 16a7 7 0 0 1-6-10c3-5 9-2 15-6ZM4 21 15 10",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2",
  euro: "M19 5.5a7.5 7.5 0 1 0 0 13M4 10h11M4 14h9",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M18 6 6 18",
  sliders: "M3 6h8M15 6h6M3 18h3M10 18h11M11 3v6M6 15v6M3 12h13M20 12h1M16 9v6",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM16 16l5 5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  compare: "M8 3v18M16 3v18M3 8l5-5 5 5M11 16l5 5 5-5",
  pin: "m9 3 6 0-1 5 4 4v2H6v-2l4-4ZM12 14v7",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 11v6M12 7h.01",
  keyboard: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM7 9h.01M12 9h.01M17 9h.01M7 12h.01M12 12h.01M17 12h.01M8 15h8",
  help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1-1.5 2M12 17h.01",
  external: "M14 3h7v7M21 3 10 14M10 3H3v18h18v-7",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  reset: "M3 5v6h6M3 11a9 9 0 1 1 2 7",
  bookmark: "M6 3h12v18l-6-4-6 4Z",
  alert: "M12 3 2 21h20ZM12 9v5M12 18h.01",
  calendar: "M4 5h16v16H4ZM8 2v6M16 2v6M4 10h16",
  lock: "M6 10h12v11H6ZM8 10V6a4 4 0 0 1 8 0v4",
  expand: "M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1",
  moon: "M20 14A8.5 8.5 0 0 1 10 4a9 9 0 1 0 10 10Z",
  mail: "M3 5h18v14H3ZM3 5l9 8 9-8",
  document: "M6 3h8l4 4v14H6ZM14 3v5h4M9 12h6M9 16h6",
};
function icon(name, size = 18) {
  if(name==='euro')return `<span class="currency-icon" style="--icon-size:${size}px" aria-hidden="true">€</span>`;
  return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${shapes[name] || shapes.route}"/></svg>`;
}
const profileMenu=createProfileMenu(icon);
const planningControls=createPlanningControls(icon);
const presetMenu=createPresetMenu(icon);
const tourPlayback=createTourPlayback(updateTourFrame,{reduced:()=>matchMedia('(prefers-reduced-motion: reduce)').matches});
let mapWide = false, activeMapLocation = null, showRecorded = false;
let caseState={route:'suez',scene:'compare',delay:0};
let storageAvailable = true;
let activeLeg = 0;
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    storageAvailable = false;
    return fallback;
  }
}
document.body.dataset.density="comfortable";
let navigationHidden=read("vp-navigation-hidden",false),mapDetails=true;
let settings = validateSettings(read("vp-settings", DEFAULTS));
let saved = normaliseScenarios(read("vp-decisions", []));
let collectionQuery = "", starredOnly = false, recentlyDeleted = null, pendingImport = null, chartRange = "focus";
let view = appPath(location.pathname) === "/case-study" ? "case" : location.hash==="#saved"?"saved":location.hash==="#history"?"history":"planner";
settings.mode="all";settings.query="";
let compare = new Set();
let renderedContext = null, preserveScenarioInputs = false, scenarioRenderTimer = null, costDetailsOpen = false, comparisonIds = [];
let modal = null,
  lastFocus = null,
  tourIndex = 0,
  showAllRoutes = false,
  chartMode = "map";
const mapNavigation = createMapNavigation(() =>
  !modal && view === "planner" && chartMode === "map"
    ? document.querySelector(".map-stage > .route-map")
    : null,
  () => activeMapLocation,
  () => {if(activeMapLocation){activeMapLocation=null;render();}},
);
const journeyPreview=createJourneyPreview(()=>settings,icon);
journeyPreview.init();
function syncScenarioInputs() {
  for(const key of ['fuel','delay']) {
    const group=document.querySelector(`[data-control="${key}"]`);if(!group)continue;
    const range=group.querySelector('[data-assumption]'),number=group.querySelector('[data-assumption-number]');
    range.value=settings[key];
    if(document.activeElement!==number)number.value=settings[key];
    range.setAttribute('aria-valuetext',`${settings[key]} ${key==='fuel'?'percent fuel adjustment':'days additional port delay'}`);
    range.style.setProperty('--progress',`${(settings[key]-Number(range.min))/(Number(range.max)-Number(range.min))*100}%`);
    
    
  }
}
function queueScenarioUpdate(key,value) {
  settings=validateSettings({...settings,[key]:value});
  journeyPreview.pause();syncScenarioInputs();
  if(!scenarioRenderTimer)scenarioRenderTimer=setTimeout(()=>{scenarioRenderTimer=null;preserveScenarioInputs=true;store();render();},75);
}
function flushScenarioUpdates() {
  if(scenarioRenderTimer){clearTimeout(scenarioRenderTimer);scenarioRenderTimer=null;preserveScenarioInputs=true;store();render();}
}
let theme = read("vp-theme", "light");
document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
function store() {
  settings.mode="all";settings.query="";
  try {
    localStorage.setItem("vp-settings", JSON.stringify(settings));
    localStorage.setItem("vp-decisions", JSON.stringify(saved));
    storageAvailable = true;
    return true;
  } catch {
    storageAvailable = false;
    const status = $(".saved-local");
    if (status) status.textContent = "Session only";
    toast("Storage is unavailable. Your work is kept for this session.");
    return false;
  }
}
let toastTimer;
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 4200);
}
function selected() {
  return rankRoutes(settings).find((r) => r.id === settings.selected);
}
function baseline() {
  return referenceRoute(settings);
}
function feasiblePill(r) {
  return statusPill(r, icon);
}
function modeIcon(mode) {
  return { ocean: "ship", rail: "train", air: "plane", multimodal: "mixed" }[
    mode
  ];
}
function delta(value, unit = "") {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("en-GB", { maximumFractionDigits: 1 })}${unit}`;
}
function currencyDelta(value) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${money(Math.abs(value))}`;
}
function formatTime(s) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(s));
}
const mark = `<img src="${appUrl('assets/mark.svg')}" alt="" width="32" height="32">`;
function shell() {
  $("#app").innerHTML =
    `<aside class="sidebar" id="workspace-navigation"><a href="${appUrl()}" class="brand" aria-label="ValencePort home">${mark}<span>Valence<span class="brand-port">Port</span></span></a><div class="workspace-label">NORTHSTAR INDUSTRIAL ${icon("down", 12)}</div><div class="workspace-identity"><span class="workspace-avatar">N</span><span>Planning workspace<small>Europe operations</small></span></div><div class="nav-label">WORKSPACE</div><nav aria-label="Workspace"><button data-action="nav" data-view="planner" title="Route planner">${icon("route")}<span>Route planner</span></button><button data-action="nav" data-view="saved" title="Saved scenarios">${icon("folder")}<span>Saved scenarios</span><b id="saved-count">${saved.length}</b></button><button data-action="nav" data-view="history" title="Decision log">${icon("history")}<span>Decision log</span></button></nav><div class="sidebar-note"><span class="live-dot"></span> Demo workspace<small>Make a plan. Explore the trade-offs.</small></div><div class="sidebar-bottom"><a href="${appUrl('case-study/')}" data-action="nav" data-view="case" title="Inside the design">${icon("document")}<span>Inside the design</span>${icon("external", 13)}</a><button class="guide-launch" data-action="guide" title="Animated walkthrough"><span class="guide-play">${icon("play",13)}</span><span>Quick tour</span><small>5 steps</small></button></div></aside><div class="app-body"><header class="topbar"><div class="topbar-start"><button class="icon-button navigation-toggle" data-action="toggle-navigation" aria-controls="workspace-navigation" aria-expanded="${!navigationHidden}" aria-label="${navigationHidden?'Show navigation':'Hide navigation'}" title="${navigationHidden?'Show navigation':'Hide navigation'}">${icon("panel",18)}</button><div class="breadcrumb"><span>Workspace</span><span class="breadcrumb-divider">/</span><strong id="breadcrumb-current">Route planner</strong></div></div><div class="topbar-right"><span class="saved-local">${icon("check", 12)} ${storageAvailable ? "Saved locally" : "Session only"}</span><button class="icon-button" data-action="theme" aria-label="Switch colour theme">${icon(theme === "dark" ? "sun" : "moon", 17)}</button><button class="avatar small profile-trigger" data-action="profile" aria-label="Open profile" aria-expanded="false" aria-controls="profile-menu" aria-haspopup="menu" title="Profile & workspace">RV</button></div></header><main id="main" tabindex="-1"></main></div>`;
  syncNavigation();
  render();
}
function syncNavigation(){document.body.classList.toggle("navigation-hidden",navigationHidden);const nav=$(".sidebar");if(nav){nav.inert=navigationHidden;nav.setAttribute("aria-hidden",String(navigationHidden));}const toggle=$(".navigation-toggle");if(toggle){toggle.setAttribute("aria-expanded",String(!navigationHidden));toggle.setAttribute("aria-label",navigationHidden?"Show navigation":"Hide navigation");toggle.title=navigationHidden?"Show navigation":"Hide navigation";}}
// Keep the live controls connected while ranges are being dragged or numbers typed.
function updateScenarioRegions(html,keepMap) {
  const next=document.createElement('template');next.innerHTML=html;
  const selectors=['.shipment-workspace','.planning-selection','.decision-summary','.scenario-lab-heading','.scenario-preset-label','.scenario-impact','.planning-secondary','.scenario-section','.journey-player','.map-location-outside','.mobile-lab-jump'];
  for(const selector of selectors){const old=$(selector),fresh=$(selector,next.content);if(old&&fresh)old.replaceWith(fresh);}
  const oldStep=$('.scenario-next-step'),freshStep=$('.scenario-next-step',next.content);
  if(oldStep){if(freshStep)oldStep.replaceWith(freshStep);else oldStep.remove();}
  else if(freshStep)$('.scenario-workbench').append(freshStep);
  if(chartMode!=='map'||!keepMap)$('.map-stage')?.replaceWith($('.map-stage',next.content));
  else {const oldCard=$('.map-stage > .map-location-card'),newCard=$('.map-stage > .map-location-card',next.content);if(oldCard&&newCard)oldCard.replaceWith(newCard);}
}
function render() {
  const before = captureMotion($("#main"), renderedContext);
  const oldMap=$('.map-stage > .route-map');
  const oldInputs=preserveScenarioInputs&&view==='planner'?$('.scenario-inputs'):null;
  preserveScenarioInputs=false;
  const mapSignature=`${settings.selected}|${mapReference(settings).id}|${showAllRoutes}|${showRecorded}`;
  const keepMap=oldMap&&view==='planner'&&chartMode==='map'&&renderedContext?.mapSignature===mapSignature;
  if(renderedContext?.geometry!==geometryId(ROUTES.find(route=>route.id===settings.selected)))activeMapLocation=null;
  const active = document.activeElement,
    focusKey = active?.dataset?.focus,
    actionKey = active?.dataset?.action,
    valueKey = active?.dataset?.value,
    labelKey = active?.getAttribute("aria-label"),
    selection = active?.selectionStart;
  document.body.classList.toggle("case-view", view === "case");
  document.body.classList.toggle(
    "has-comparison",
    view === "planner" && compare.size >= 1,
  );
  const names = {
    planner: "Route planner",
    saved: "Saved scenarios",
    history: "Decision log",
    case: "Case study",
  };
  $("#breadcrumb-current").textContent = names[view];
  document.title = `ValencePort — ${names[view]}`;
  document.querySelectorAll('[data-action="nav"]').forEach((el) => {
    el.classList.toggle("active", el.dataset.view === view);
    if (el.dataset.view === view) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  $("#saved-count").textContent = saved.length;
  const html =
    view === "planner"
      ? planner()
      : view === "case"
        ? caseStudy()
        : savedPage(view === "history");
  if(oldInputs)updateScenarioRegions(html,keepMap);else $("#main").innerHTML=html;
  if(keepMap&&!oldMap.isConnected)$('.map-stage > .route-map')?.replaceWith(oldMap);
  if(oldInputs&&!oldInputs.isConnected)$('.scenario-inputs')?.replaceWith(oldInputs);
  syncScenarioInputs();
  if (focusKey || (actionKey && !active.isConnected)) {
    const el = focusKey
      ? document.querySelector(`[data-focus="${focusKey}"]`)
      : [...$("#main").querySelectorAll("[data-action]")].find(
          (node) =>
            node.dataset.action === actionKey &&
            node.dataset.value === valueKey &&
            (!labelKey || node.getAttribute("aria-label") === labelKey),
        );
    if (el) {
      el.focus({ preventScroll: true });
      if (selection != null && el.setSelectionRange && el.type === "search")
        el.setSelectionRange(selection, selection);
    }
  }
  const context = {
    view,
    selected: settings.selected,
    baseline: settings.baseline,
    chart: chartMode,
    plotRange: chartRange,
    mapSignature,
    geometry:geometryId(ROUTES.find(route=>route.id===settings.selected)),
    mapWide,
  };
  playMotion($("#main"), before, context);
  renderedContext = context;
  document.querySelectorAll(".map-stage > .route-map").forEach(map=>map.dataset.details=String(mapDetails));
  syncWorkspaceLayout();
  mapNavigation.sync();
  journeyPreview.sync();
  if(view==='planner'&&chartMode==='map'&&before?.context?.selected&&before.context.geometry!==context.geometry)mapNavigation.fit();
  const routePicker = $(".map-route-picker");
  const activeRouteChoice = routePicker?.querySelector('[aria-pressed="true"]');
  if (activeRouteChoice && routePicker.scrollWidth > routePicker.clientWidth) {
    const buttonBounds = activeRouteChoice.getBoundingClientRect();
    const pickerBounds = routePicker.getBoundingClientRect();
    routePicker.scrollLeft +=
      buttonBounds.left -
      pickerBounds.left -
      (routePicker.clientWidth - buttonBounds.width) / 2;
  }
}
function planner(){return plannerView({settings,compare,chartMode,mapWide,showAllRoutes,activeMapLocation,activeLeg,costDetailsOpen,mapDetails,showRecorded},{icon,map,mapLocationCard,tradeoffChart});}
function map(r, referenceId = settings.baseline, interactive = true) {
  return routeMap(r, referenceId, {
    interactive,
    showRecorded: interactive && showRecorded,
    referenceLabel:interactive?mapReference(settings).label:"Baseline",
    showAll: showAllRoutes,
    activeLocation: interactive ? activeMapLocation : null,
    transform: interactive ? mapNavigation.transform() : undefined,
  });
}

function mapLocationCard(route) {
  if(!activeMapLocation)return '';
  const segment=timelineFor(route.id,settings).segments.find(segment=>segment.place===activeMapLocation);
  if(!segment)return '';
  return `<section class="map-location-card" aria-label="${esc(segment.place)} planning details"><div><span>${segment.id===0?'ORIGIN':segment.id===timelineFor(route.id,settings).segments.length-1?'DESTINATION':['Suez Canal','Cape of Good Hope'].includes(segment.place)?'PLANNED PASSAGE':'PLANNED HANDOVER'}</span><button class="icon-button" data-action="close-map-location" aria-label="Close location details">${icon('close',15)}</button></div><h3>${esc(segment.place)}</h3><p>${esc(segment.task)}${segment.place==='Shanghai'?route.mode==='air'?' · Pudong Airport (PVG)':route.mode==='rail'?' · Shanghai rail connection':' · Yangshan / SGICT':segment.place==='Rotterdam'?route.mode==='ocean'?' · Maasvlakte / RWG':' · Railport / RSC':segment.place==='Dubai'?' · Jebel Ali → DWC':segment.place==='Amsterdam'?' · Schiphol Airport (AMS)':''}</p><footer>${dateLabel(segment.startDate)} → ${dateLabel(segment.endDate)}<strong>${segment.days}d</strong></footer></section>`;
}
function tradeoffChart() { return tradeoffView(settings,chartRange,icon); }
function savedPage(history) { return collectionView({records:saved,history,query:collectionQuery,starredOnly,canUndo:!!recentlyDeleted},icon); }
function caseStudy(){return caseStudyView(caseState,icon,mark);}
function showDialog(title, content, options = {}) {
  planningControls.close();
  journeyPreview.pause();
  if (!modal) lastFocus = document.activeElement;
  modal = options.type || "generic";
  $("#overlay-root").innerHTML =
    `<div class="overlay"><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" class="dialog ${options.wide ? "dialog-wide" : ""}"><header class="dialog-header"><div><span class="overline">${options.overline || "VALENCEPORT / PLANNING WORKSPACE"}</span><h2 id="dialog-title">${title}</h2></div><button class="icon-button" data-action="close" aria-label="Close dialog">${icon("close", 20)}</button></header>${content}</section></div>`;
  document.body.classList.add("modal-open");
  $("#app").inert = true;
  requestAnimationFrame(() => {
    const target =
      $("[autofocus]", $("#overlay-root")) ||
      $("button,input,select,textarea", $("#overlay-root"));
    target?.focus({ preventScroll: true });
  });
}
function closeDialog() {
  planningControls.close();
  tourPlayback.stop();
  modal = null;
  const closing=$('.overlay', $('#overlay-root'));
  if(closing&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    closing.classList.add('is-closing');
    const finish=event=>{if(event.target===closing){closing.removeEventListener('animationend',finish);closing.remove();}};
    closing.addEventListener('animationend',finish);
    setTimeout(()=>closing.remove(),220);
  }else $('#overlay-root').replaceChildren();
  document.body.classList.remove("modal-open");
  $("#app").inert = false;
  lastFocus?.isConnected && lastFocus.focus({ preventScroll: true });
}
function corridorDetails(){
 const r=selected();
 const descriptions={suez:'Yangshan → Singapore → Malacca → Bab-el-Mandeb → Suez → Gibraltar → Rotterdam',cape:'Yangshan → Singapore → Malacca → Cape of Good Hope → Rotterdam',eco:'Yangshan → Singapore → Suez → Rotterdam',rail:'Shanghai → Xi’an → Lanzhou → Urumqi → Khorgos → Kazakhstan → Kuryk → Alat → Tbilisi → Kars → Istanbul → Europe → Rotterdam',seaair:'Yangshan → Singapore → Jebel Ali → road to Dubai World Central (DWC) → Amsterdam → road to Rotterdam',air:'Shanghai Pudong (PVG) → Amsterdam Schiphol (AMS) → road to Rotterdam'};
 const rail=r.mode==='rail',air=r.mode==='air',mixed=r.mode==='multimodal';
 showDialog('Map sources & credits',`<div class="dialog-content methodology"><span class="overline">${esc(r.name)}</span><h3>Move around</h3><p>Scroll over the map to zoom around your pointer. Drag the enlarged map to move. Use + / − or Fit at the lower right; Expand opens a wider view. Keyboard: focus the map, then + / − to zoom, arrows to move, and 0 to fit.</p><h3>Read the route</h3><p>${descriptions[r.id]}</p><p>Solid: selected network route. Dashed: comparison route, air connection or ferry link. A dashed air arc shows connected airports; it does not claim a flown track.</p><h3>How precise is the line?</h3><p>${rail?'The two rail sections follow OpenStreetMap railway geometry via OpenRailRouting, acquired 6 November 2026. Kuryk–Alat is a separate indicative Caspian ferry link. Tracks are geographically routed candidates; freight permissions, gauge transfers and operating availability require operator confirmation.':air?'The PVG–AMS arc is a great-circle connection. The road delivery follows the OSRM road network.':mixed?'Sea legs follow the SeaRoute network. Jebel Ali–DWC and Amsterdam–Rotterdam follow the OSRM road network. The DWC–AMS arc is a great-circle connection; no verified flight trace is available.':'Sea legs follow the SeaRoute maritime network and SMDG terminal coordinates; Cape routing excludes Suez.'}</p>${air||mixed?'<p>Road geometry uses the driving profile, not certified truck clearance. Short dotted access connectors cover terminal snaps of up to 504 m; private terminal access is unverified.</p>':''}${air?`<h3>A recorded example, with gaps</h3><p>KL896 · PH-BKG · 4 Nov 2026. ADSB.lol provides 2,901 observations in eight separate segments. Shanghai departure is missing and the largest gap is 6 h 31 min. Only observed segments are drawn, without joining gaps. This historical passenger flight illustrates coverage; it is not the planned cargo service.</p><button class="button outline" data-action="recorded-flight">${icon('plane',16)} ${showRecorded?'Hide':'Show'} recorded segments</button>`:''}<h3>Sources & credits</h3><p>Base geography: Natural Earth 1:10m, public domain. Network data © OpenStreetMap contributors, ODbL 1.0. Observations © ADSB.lol contributors, ODbL 1.0. The map does not confirm a booking, navigational clearance, price or transit time.</p><div class="map-source-links"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap attribution ${icon('external',12)}</a><a href="https://routing.openrailrouting.org/" target="_blank" rel="noopener">OpenRailRouting ${icon('external',12)}</a><a href="https://project-osrm.org/" target="_blank" rel="noopener">OSRM road routing ${icon('external',12)}</a><a href="https://www.adsb.lol/docs/open-data/historical" target="_blank" rel="noopener">ADSB.lol historical data ${icon('external',12)}</a><a href="https://github.com/genthalili/searoute-py" target="_blank" rel="noopener">SeaRoute ${icon('external',12)}</a><a href="https://github.com/smdg-org/Terminal-Code-List" target="_blank" rel="noopener">SMDG terminals ${icon('external',12)}</a><a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth ${icon('external',12)}</a><a href="${appUrl('assets/tracks/README.md')}" target="_blank" rel="noopener">Acquisition notes & limitations ${icon('external',12)}</a></div></div><footer class="dialog-footer"><button class="button primary" data-action="close">Back to map ${icon('arrow',15)}</button></footer>`);
}
function constraints() {
  showDialog('Set your planning limits',planningLimitsForm(settings,icon),{type:'constraints'});
}
function saveDialog() {
  if(saved.length>=MAX_SCENARIOS){toast("Your collection has 50 scenarios. Export a backup and remove a scenario first.");return;}
  const r = selected();
  showDialog(
    "Keep the decision with the plan",
    `<form id="save-form"><div class="dialog-content"><div class="save-context"><span class="mode-tile">${icon(modeIcon(r.mode), 23)}</span><div><h3>${esc(r.name)}</h3><p>SHP-2026-0842 <span>·</span> Shanghai → Rotterdam</p></div>${feasiblePill(r)}</div><div class="save-totals"><div><span>Logistics cost</span><strong>${money(r.cost)}</strong></div><div><span>Estimated arrival</span><strong>${dateLabel(r.arrival)}</strong></div><div><span>CO₂e</span><strong>${r.co2.toFixed(1)} t</strong></div></div>${!r.feasible ? `<div class="validation-note">${icon("alert", 17)} This route does not meet your limits: ${r.failures.join(", ").toLowerCase()}. Choose a different route or adjust your limits first.</div>` : ""}<label class="field scenario-name-field">Scenario name<input name="title" maxlength="80" value="${esc(r.short)}" required autofocus></label><label class="field" for="reason">Why this route?<span class="required">Required</span></label><div class="reason-chips">${["Meets the deadline within budget.", "Lower emissions with acceptable cost."].map((text) => `<button type="button" data-action="reason" data-value="${text}">${text}</button>`).join("")}</div><textarea id="reason" name="reason" minlength="12" maxlength="500" placeholder="Describe the trade-off behind your choice…" rows="4" required></textarea><div class="field-help"><span>12–500 characters. Saved with this scenario.</span><span id="reason-count">0/500</span></div><div class="constraint-summary">${icon("lock", 16)} This saves a planning record. It does not book or approve a shipment.</div></div><footer class="dialog-footer"><button type="button" class="button quiet" data-action="close">Cancel</button><button class="button primary" id="save-submit" type="submit" disabled data-feasible="${r.feasible}">Save for review ${icon("arrow", 15)}</button></footer></form>`,
    { type: "save" },
  );
}
function itinerary() {
  const r = selected();
  showDialog(
    "A closer look at the route",
    `<div class="dialog-content"><div class="itinerary-heading"><span class="mode-tile">${icon(modeIcon(r.mode), 23)}</span><div><h3>${esc(r.name)}</h3><p>${r.days} days <span>·</span> Arrival ${dateLabel(r.arrival, true)}</p></div>${feasiblePill(r)}</div><ol class="itinerary">${timelineFor(
      r.id,
      settings,
    )
      .segments.map(
        (segment, i) =>
          `<li><span class="itinerary-dot ${segment.kind === "delay" ? "delay-dot" : ""}">${segment.kind === "delay" ? icon("clock", 13) : i + 1}</span><div><h4>${esc(segment.place)}</h4><p>${esc(segment.task)} · ${dateLabel(segment.startDate)}–${dateLabel(segment.endDate)}</p></div><span>${segment.days} days</span></li>`,
      )
      .join(
        "",
      )}</ol><div class="route-note">${icon("info", 16)}<p>${esc(r.note)}</p></div><div class="emissions-note"><div><strong>Transport emissions</strong><span>${r.co2.toFixed(1)} t CO₂e <em>±${r.uncertainty}%</em></span></div><p>${r.quality} transport-chain estimate. The uncertainty range is illustrative and is not a statistical confidence interval.</p></div></div><footer class="dialog-footer"><button class="button quiet" data-action="close">Back to planner</button><button class="button primary" data-action="save">Save scenario ${icon("arrow", 15)}</button></footer>`,
    { type: "itinerary" },
  );
}
function compareDialog(ids = [...compare]) {
  comparisonIds=ids;
  if (ids.length < 2) {
    toast("Select at least two routes to compare.");
    return;
  }
  showDialog(
    "Compare the whole journey",
    comparisonWorkbench(ids, settings, settings.selected, icon),
    { type: "compare", wide: true, overline: "SHP-2026-0842 / ROUTE COMPARISON" },
  );
  $(".dialog").classList.add("comparison-workbench");
  $(".overlay").classList.add("comparison-overlay");
}
function methodology() {
  showDialog(
    "Understand the numbers",
    `<div class="dialog-content methodology"><p class="dialog-intro">ValencePort is a portfolio prototype. The shipment, rates and estimates are illustrative, with consistent calculations across the workspace.</p><h3>Total logistics cost</h3><p>Freight + fuel adjustment + origin handling + destination handling + cargo insurance + contingency allowance. The fuel stress test applies only to freight. Goods value, duties, VAT and regulatory carbon obligations are outside this model.</p><h3>Arrival & delays</h3><p>Departure is fixed at 9 November 2026. Arrival equals departure plus the scenario’s calendar-day transit time. Scenario lab presets use the same calculations as the sliders. A pinned baseline changes comparisons, not the ranking rules. Port delay adds days to ocean, rail and sea–air scenarios. It does not affect the direct-air scenario.</p><h3>Transport emissions</h3><p>Each route has a fixed, illustrative transport-chain emissions estimate and uncertainty range. These are not carrier measurements, verified emissions or a certified GLEC calculation. Changing fuel cost does not change the estimated physical emissions.</p><h3>How “Best fit” works</h3><p>Routes must first pass the budget, deadline and emissions limits. The remaining routes are ranked using normalized cost, transit and emissions. Balanced weights are 55 / 30 / 15. Lowest cost, Fastest and Lower emissions sort eligible routes directly by their chosen metric; weighted score breaks ties. A recommendation is a planning aid, not a verified carrier offer.</p><h3>Reference material</h3><p><a href="https://smartfreightcentre.org/page/glec" target="_blank" rel="noopener">Smart Freight Centre — GLEC Framework ${icon("external", 12)}</a><br><a href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en" target="_blank" rel="noopener">European Commission — CBAM scope ${icon("external", 12)}</a><br><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener">Natural Earth — public-domain map data ${icon("external", 12)}</a></p><p class="methodology-footnote">The prototype models transport trade-offs. It does not calculate CBAM charges from freight emissions.</p></div><footer class="dialog-footer"><button class="button primary" data-action="close">Got it ${icon("check", 15)}</button></footer>`,
    { type: "methodology" },
  );
}
function updateTourFrame({phase,playing}){
 if(modal!=='guide')return;
 const preview=$('.tour-preview');if(!preview)return;
 preview.dataset.phase=String(phase);preview.dataset.paused=String(!playing);
 preview.innerHTML=guideFrame(tourIndex,phase,icon);
 $('.tour-cue').textContent=tourSteps[tourIndex].cues[phase];
 document.querySelectorAll('[data-action="guide-phase"]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.value)===phase)));
 const play=$('[data-action="guide-pause"]');play.innerHTML=icon(playing?'pause':'play',16);play.setAttribute('aria-label',`${playing?'Pause':'Play'} illustration`);
 mapNavigation.sync();
}
function guide(){
 tourPlayback.start();const state=tourPlayback.state();
 showDialog('Get to know ValencePort',guideView(tourIndex,icon,!state.playing,state.phase),{type:'guide',overline:'QUICK TOUR / BEFORE → ACTION → RESULT'});
 mapNavigation.sync();
 requestAnimationFrame(()=>$('.tour-description h3')?.focus({preventScroll:true}));
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&modal==='guide')tourPlayback.seek(tourPlayback.state().phase);});
function shortcuts(){
 showDialog('Keyboard shortcuts',`<div class="dialog-content shortcuts-content"><dl><div><dt>Open the Quick tour</dt><dd><kbd>?</kbd></dd></div><div><dt>Zoom a focused map</dt><dd><kbd>+</kbd><kbd>−</kbd></dd></div><div><dt>Move around a zoomed map</dt><dd><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd></dd></div><div><dt>Fit the whole corridor</dt><dd><kbd>0</kbd></dd></div><div><dt>Close a dialog or expanded view</dt><dd><kbd>Esc</kbd></dd></div></dl><p>Use Tab to move between controls and Enter or Space to activate them.</p></div><footer class="dialog-footer"><button class="button primary" data-action="close">Back to workspace</button></footer>`);
}
function about() {
  showDialog(
    "A workspace for better trade-offs",
    `<div class="dialog-content about-content"><div class="about-brand">${mark}<h3>ValencePort</h3></div><p>Designed and built as a self-initiated product design concept by Robert Vaganian.</p><p>Explore a complete freight planning scenario: set limits, compare routes, test assumptions and save a decision. All operational data is fictional. Nothing is booked or sent to a carrier.</p><p>Version 1.9 · Saved scenarios stay in this browser. Export a backup to keep the whole collection, or a brief for one decision.</p><button class="button outline" data-action="corridor-details">${icon("layers",18)} Map sources & credits</button><button class="button outline danger" data-action="clear-data">${icon("reset", 15)} Reset demo workspace</button></div><footer class="dialog-footer"><button class="button quiet" data-action="nav" data-view="case">Read the case study ${icon("external", 14)}</button><button class="button primary" data-action="close">Back to workspace</button></footer>`,
    { type: "about" },
  );
}
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportRoutes(ids = ROUTES.map((r) => r.id)) {
  download(
    "ValencePort_SHP-2026-0842_route_comparison.csv",
    routeComparisonCsv(ids, settings),
    "text/csv;charset=utf-8",
  );
  toast("Route comparison exported with its planning assumptions.");
}
function exportDecision(d) {
  download(
    "ValencePort_SHP-2026-0842_decision.txt",
    `VALENCEPORT — SCENARIO BRIEF\n\nShipment: SHP-2026-0842 / Industrial components\nShanghai, CN → Rotterdam, NL\n4 × 40′ HC / 72 tonnes\nDeparture: ${DEPARTURE}\n\nScenario: ${scenarioTitle(d)}\nRoute: ${d.routeName}\nTotal logistics cost: ${money(d.cost)}\nTransit: ${d.days} calendar days\nArrival: ${d.arrival}\nEstimated transport emissions: ${d.co2} t CO2e\n\nPLANNING ASSUMPTIONS\nBudget: ${money(d.settings.budget)}\nDeadline: ${d.settings.deadline}\nEmissions limit: ${d.settings.emissions} t CO2e\nFuel adjustment: ${d.settings.fuel}%\nPort delay: ${d.settings.delay} days\nPriority: ${d.settings.priority}\nComparison baseline: ${ROUTES.find((r) => r.id === (d.settings.baseline || "cape"))?.name || "Ocean · Cape of Good Hope"}\n\nRATIONALE\n${d.reason}\n\nSaved: ${d.createdAt}\nStatus: Saved for review\n\nIllustrative portfolio prototype. Not a booking, approval, live quote, certified emissions record or customs calculation.\n`,
    "text/plain;charset=utf-8",
  );
  toast("Scenario brief exported.");
}
function renameScenario(record){
 showDialog("Rename scenario",`<form id="rename-form"><div class="dialog-content"><input type="hidden" name="scenarioId" value="${esc(record.id)}"><label class="field">Scenario name<input name="title" maxlength="80" value="${esc(scenarioTitle(record))}" required autofocus></label><p class="dialog-intro">Only the name changes. Saved calculations and assumptions stay fixed.</p></div><footer class="dialog-footer"><button type="button" class="button quiet" data-action="close">Cancel</button><button class="button primary" type="submit">Save name</button></footer></form>`);
}
async function importBackup(file){
 try{
  if(file.size>MAX_BACKUP_BYTES)throw new Error("Choose a JSON backup smaller than 1 MB.");
  pendingImport=planImport(saved,readBackup(await file.text()));
  showDialog("Review scenario import",`<div class="dialog-content import-review"><span class="mode-tile">${icon('folder',24)}</span><h3>${pendingImport.additions.length} new scenario${pendingImport.additions.length===1?'':'s'}</h3><p>${pendingImport.duplicates?`${pendingImport.duplicates} already saved and will be skipped. `:''}Existing snapshots stay as they are. Your collection will contain ${pendingImport.total} scenarios.</p></div><footer class="dialog-footer"><button class="button quiet" data-action="close">Cancel</button><button class="button primary" data-action="confirm-import" ${pendingImport.additions.length?'':'disabled'}>Import scenarios ${icon('arrow',15)}</button></footer>`);
 }catch(error){pendingImport=null;showDialog("Could not import this file",`<div class="dialog-content"><p>${esc(error.message)}</p></div><footer class="dialog-footer"><button class="button quiet" data-action="close">Close</button><button class="button primary" data-action="import-backup">Choose another file</button></footer>`);}
}
document.addEventListener("toggle",event=>{if(event.target.matches?.('[data-cost-details]'))costDetailsOpen=event.target.open;},true);
document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action,
    value = el.dataset.value;
  const record = saved.find(record=>record.id===el.dataset.id);
  flushScenarioUpdates();
  if(action==='profile'){presetMenu.close();profileMenu.toggle(el);return;}
  if(action==='preset-menu'){profileMenu.close();presetMenu.toggle(el);return;}
  presetMenu.close(true);
  profileMenu.close(true);
  if(action==='shortcuts'){shortcuts();return;}
  if(action==='corridor-advisory'){showDialog('Strait of Hormuz',advisoryDialog(icon),{type:'advisory',overline:'CORRIDOR NOTICE / DATED REFERENCE'});return;}
  if(action==='inspect-advisory-route'){closeDialog();settings.selected='seaair';chartMode='map';activeLeg=0;store();render();return;}
  if(action==='toggle-navigation'){navigationHidden=!navigationHidden;try{localStorage.setItem('vp-navigation-hidden',JSON.stringify(navigationHidden));}catch{}syncNavigation();return;}
  if(action==='case-route'){if(['suez','cape','rail'].includes(value)){caseState.route=value;render();}return;}
  if(action==='case-scene'){if(['compare','stress','record'].includes(value)){caseState.scene=value;render();}return;}
  if(action==='case-delay'){caseState.delay=value==='7'?7:0;render();return;}
  if(action==='guide-step'){tourIndex=Math.max(0,Math.min(tourSteps.length-1,Number(value)||0));guide();return;}
  if(action==='guide-pause'){tourPlayback.toggle();return;}
  if(action==='guide-replay'){tourPlayback.replay();return;}
  if(action==='guide-phase'){tourPlayback.seek(value);return;}
  if(action==='map-details'){mapDetails=!mapDetails;render();return;}
  if(action==='focus-eligible'){$('#group-eligible')?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#group-eligible')?.focus({preventScroll:true});return;}
  if(action==='corridor-details'){corridorDetails();return;}
  if(action==='recorded-flight'){showRecorded=!showRecorded;closeDialog();render();return;}

  if(action==='assumption-step'){const key=value;queueScenarioUpdate(key,settings[key]+Number(el.dataset.direction)*(key==='fuel'?5:1));return;}
  if(action==='focus-scenario-lab'){$('#scenario-lab').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#scenario-fuel').focus({preventScroll:true});return;}
  if(action==='compare-baseline'){compareDialog([mapReference(settings).id,settings.selected]);return;}
  if(action==='try-delay-scenario'){settings=applyStressPreset({...DEFAULTS},'delay');view='planner';chartMode='map';mapWide=false;activeMapLocation=null;history.pushState({}, "", appUrl());store();render();$('.planner-grid').scrollIntoView({block:'start',behavior:'instant'});return;}
  if(action==='preview-toggle'){journeyPreview.toggle();return;}
  if(action==='preview-restart'){journeyPreview.restart();return;}

  if(action==='map-wide'){mapWide=!mapWide;render();$('.map-panel').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
  if(action==='map-location'){
    const place=routeLocations(selected()).find(place=>place.name===value);
    if(place){activeMapLocation=value;render();mapNavigation.focusAt(place.point);}return;
  }
  if(action==='close-map-location'){activeMapLocation=null;render();return;}
  if(action==='chart-range'){chartRange=value==='all'?'all':'focus';render();return;}
  if(action==='explain-ranking'){showDialog('Why this route?',recommendationView(settings,icon));return;}
  if(action==='choose-explained'){settings.selected=value;activeLeg=0;closeDialog();store();render();return;}
  if(action==='starred-filter'){starredOnly=!starredOnly;render();return;}
  if(action==='clear-collection-filters'){collectionQuery='';starredOnly=false;render();return;}
  if(action==='star-scenario'&&record){saved=updateScenario(saved,record.id,{starred:!record.starred});store();render();return;}
  if(action==='rename-scenario'&&record){renameScenario(record);return;}
  if(action==='scenario-assumptions'&&record){showDialog('Saved assumptions',assumptionsView(record,settings,icon));return;}
  if(action==='delete-scenario'&&record){showDialog('Delete this scenario?',`<div class="dialog-content"><p><strong>${esc(scenarioTitle(record))}</strong> will be removed from Saved scenarios and the Decision log. You can undo this while the workspace stays open.</p></div><footer class="dialog-footer"><button class="button quiet" data-action="close">Keep scenario</button><button class="button primary danger" data-action="confirm-delete" data-id="${esc(record.id)}">Delete scenario</button></footer>`);return;}
  if(action==='confirm-delete'&&record){recentlyDeleted={record,index:saved.indexOf(record)};saved=saved.filter(r=>r.id!==record.id);store();closeDialog();render();toast('Scenario deleted. Undo is available above the collection.');return;}
  if(action==='undo-delete'&&recentlyDeleted){if(saved.some(record=>record.id===recentlyDeleted.record.id)){recentlyDeleted=null;render();toast('That scenario is already in your collection.');return;}if(saved.length>=MAX_SCENARIOS){toast('Remove a scenario to make room before undoing.');return;}saved.splice(recentlyDeleted.index,0,recentlyDeleted.record);recentlyDeleted=null;store();render();return;}
  if(action==='export-backup'){try{download('ValencePort_scenarios.json',createBackup(saved),'application/json');toast('Scenario backup exported.');}catch(error){toast(error.message);}return;}
  if(action==='import-backup'){if(modal)closeDialog();$('#scenario-backup').click();return;}
  if(action==='confirm-import'&&pendingImport){saved.push(...pendingImport.additions);pendingImport=null;recentlyDeleted=null;collectionQuery='';starredOnly=false;store();closeDialog();view='saved';history.pushState({}, "", appUrl("#saved"));render();toast('Scenario collection imported.');return;}
  if (action === "nav") {
    event.preventDefault();
    if (modal) closeDialog();
    view = el.dataset.view;
    history.pushState(
      { view },
      "",
      view === "case" ? appUrl("case-study/") : view === "planner" ? appUrl() : appUrl(`#${view}`),
    );
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  if (action === "new-scenario") {
    settings = { ...DEFAULTS };
    compare = new Set();
    view = "planner";
    store();
    history.pushState({}, "", appUrl());
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  if (action === "pin-baseline") {
    settings.baseline = value;
    store();
    render();
    toast(`${baseline().short} is now the comparison baseline.`);
    return;
  }
  if (action === "reset-baseline") {
    settings.baseline = "cape";
    store();
    render();
    return;
  }
  if (action === "stress-preset") {
    settings = applyStressPreset(settings, value);
    store();
    render();
    return;
  }
  if (action === "journey-leg") {
    activeLeg = Number(value);
    render();
    const timeline=timelineFor(settings.selected,settings);journeyPreview.seek((timeline.segments[activeLeg].startDay+.001)/timeline.totalDays);
    return;
  }
  if (action === "compare-pin") {
    settings.baseline = value;
    store();
    render();
    compareDialog(comparisonIds);
    return;
  }
  if (action === "export-selected") {
    exportRoutes(comparisonIds);
    return;
  }
  if (action === "select") {
    if(el.closest(".map-route-picker"))showAllRoutes=false;
    activeLeg = 0;
    settings.selected = value;
    if (view === "case") {
      view = "planner";
      history.pushState({}, "", appUrl());
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    store();
    render();
    return;
  }
  if (action === "priority") {
    settings.priority = value;settings.sort="score";settings.order="asc";
    store();
    render();
    return;
  }
  if (action === "filter") {
    settings.mode = value;
    render();
    return;
  }
  if (action === "sort") {
    settings=nextTableSort(settings,value);
    store();
    render();
    return;
  }
  if (action === "clear-filters") {
    settings.mode = "all";
    settings.query = "";
    render();
    return;
  }
  if (action === "constraints") constraints();
  else if (action === "save") saveDialog();
  else if (action === "itinerary") itinerary();
  else if (action === "compare") compareDialog();
  else if (action === "close") closeDialog();
  else if (action === "methodology") methodology();
  else if (action === "about") about();
  else if (action === "guide") {
    tourIndex = 0;
    guide();
  } else if (action === "guide-next") {
    if (tourIndex === tourSteps.length - 1) {
      closeDialog();
      if (view !== "planner") {
        view = "planner";
        history.pushState({}, "", appUrl());
        render();
      }
    } else {
      tourIndex++;
      guide();
    }
  } else if (action === "guide-back") {
    tourIndex--;
    guide();
  } else if (action === "reason") {
    const field = $("#reason");
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.focus();
  } else if (action === "choose-compared") {
    activeLeg = 0;
    settings.selected = value;
    store();
    closeDialog();
    render();
  } else if (action === "clear-compare") {
    compare.clear();
    render();
  } else if (action === "chart-mode") {
    chartMode = value;
    render();
  } else if (action === "layers") {
    showAllRoutes = !showAllRoutes;
    render();
  } else if (action.startsWith("zoom-")) {
    if (action === "zoom-fit") {activeMapLocation=null;render();mapNavigation.fit();}
    else mapNavigation.zoomBy(action === "zoom-in" ? 1.2 : 1 / 1.2);
  } else if (action === "reset-settings") {
    settings = { ...DEFAULTS };
    store();
    render();
    toast("Starting assumptions restored.");
  } else if (action === "theme") {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("vp-theme", JSON.stringify(theme));
    } catch {}
    el.innerHTML = icon(theme === "dark" ? "sun" : "moon", 17);
  } else if (action === "export") exportRoutes();
  else if (action === "export-decision") {
    const d = saved.find((d) => d.id === el.dataset.id);
    if (d) exportDecision(d);
  } else if (action === "load") {
    const d = saved.find((d) => d.id === el.dataset.id);
    if (d) {
      if(modal)closeDialog();
      settings = validateSettings({ ...d.settings, selected: d.routeId });
      store();
      view = "planner";
      history.pushState({}, "", appUrl());
      render();
      window.scrollTo({ top: 0, behavior: "instant" });
      toast("Saved assumptions loaded. The original record is preserved.");
    }
  } else if (action === "clear-data") {
    showDialog(
      "Reset this demo workspace?",
      `<div class="dialog-content"><p>This removes ${saved.length} saved scenario${saved.length === 1 ? "" : "s"} from this browser and restores the starting assumptions. Export a scenario backup to keep your collection first.</p></div><footer class="dialog-footer"><button class="button quiet" data-action="close">Keep my work</button><button class="button primary" data-action="confirm-reset">Reset workspace</button></footer>`,
      { type: "reset" },
    );
  } else if (action === "confirm-reset") {
    saved = [];
    recentlyDeleted=null;collectionQuery="";starredOnly=false;
    settings = { ...DEFAULTS };
    store();
    closeDialog();
    render();
    toast("Demo workspace reset.");
  }
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if(el.matches('[data-focus="collection-search"]')){collectionQuery=el.value;render();}
  if (el.matches('[data-focus="search"]')) {
    settings.query = el.value;
    render();
  }
  if(el.matches('[data-preview-progress]'))journeyPreview.seek(Number(el.value)/1000);
  if(el.matches('[data-assumption]'))queueScenarioUpdate(el.dataset.assumption,Number(el.value));
  if(el.matches('[data-assumption-number]')&&el.value!==''&&el.validity.valid)queueScenarioUpdate(el.dataset.assumptionNumber,Number(el.value));
  if (el.id === "reason") {
    const count = el.value.trim().length;
    $("#reason-count").textContent = `${el.value.length}/500`;
    $("#save-submit").disabled =
      count < 12 || $("#save-submit").dataset.feasible !== "true";
  }
});
document.addEventListener("change", (event) => {
  const el = event.target;
  if(el.id==="scenario-backup"&&el.files?.[0]){importBackup(el.files[0]);el.value="";}
  if (el.matches("[data-journey-stage]")) {
    activeLeg = Number(el.value);
    render();
  }
  if(el.dataset.assumptionNumber){queueScenarioUpdate(el.dataset.assumptionNumber,el.value===''?0:Number(el.value));el.value=settings[el.dataset.assumptionNumber];}
  if(el.dataset.assumption)queueScenarioUpdate(el.dataset.assumption,Number(el.value));
  if (el.dataset.compare) {
    if (el.checked) {
      if (compare.size >= 3) {
        el.checked = false;
        toast("Compare up to three routes at a time.");
        return;
      }
      compare.add(el.dataset.compare);
    } else compare.delete(el.dataset.compare);
    render();
  }
});
document.addEventListener("submit", (event) => {
  if(event.target.id==='rename-form'){event.preventDefault();try{const form=new FormData(event.target);saved=updateScenario(saved,form.get('scenarioId'),{title:form.get('title')});store();closeDialog();render();toast('Scenario renamed.');}catch(error){toast(error.message);}}

  if (event.target.id === "constraints-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    settings = validateSettings({
      ...settings,
      budget: +form.get("budget"),
      deadline: form.get("deadline"),
      emissions: +form.get("emissions"),
    });
    store();
    closeDialog();
    render();
    toast("Planning limits updated across all routes.");
  }
  if (event.target.id === "save-form") {
    event.preventDefault();
    try {
      if(saved.length>=MAX_SCENARIOS)throw new Error("Your collection is full. Remove a scenario before saving.");
      const form=new FormData(event.target);
      const title=validTitle(form.get("title"));
      const d = snapshotDecision(
        settings.selected,
        settings,
        form.get("reason"),
      );
      saved.push({...d,title,starred:false});
      const persisted = store();
      closeDialog();
      render();
      toast(
        persisted
          ? "Scenario saved. Find it in Saved scenarios."
          : "Scenario saved for this session. Export a brief to keep it.",
      );
    } catch (error) {
      toast(error.message);
    }
  }
});
document.addEventListener("keydown", (event) => {
  if(event.key==='Escape'&&!modal&&(mapWide||activeMapLocation)){
    event.preventDefault();activeMapLocation=null;mapWide=false;render();$('.map-expand')?.focus({preventScroll:true});mapNavigation.fit();return;
  }
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target.matches(".map-route,.map-location,.chart-point,.journey-leg")
  ) {
    event.preventDefault();
    event.target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return;
  }
  if (event.key === "Escape" && modal) {
    event.preventDefault();
    closeDialog();
    return;
  }
  if (event.key === "Tab" && modal) {
    const focusables = [
      ...$(".dialog").querySelectorAll(
        "a[href],button:not([disabled]),input,select,textarea",
      ),
    ].filter((el) => el.getClientRects().length);
    if (!focusables.length) return;
    const first = focusables[0],
      last = focusables.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  if (event.target.matches("input,textarea,select")) return;
  if (event.key === "?" && !modal) {
    event.preventDefault();
    tourIndex = 0;
    guide();
  }
});
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("overlay")) closeDialog();
});
window.addEventListener("popstate", () => {
  if (modal) closeDialog();
  view = appPath(location.pathname) === "/case-study"
    ? "case"
    : ["saved", "history"].includes(location.hash.slice(1))
      ? location.hash.slice(1)
      : "planner";
  render();
});
if (["#saved", "#history"].includes(location.hash))
  view = location.hash.slice(1);
shell();

function showChartTooltip(point) {
  const tip = $("#route-tooltip"),
    stage = $(".map-stage");
  if (!tip || !stage) return;
  const route = rankRoutes(settings).find((r) => r.id === point.dataset.value);
  if (!route) return;
  tip.innerHTML = chartTooltip(route, icon);
  tip.hidden = false;
  const bounds = stage.getBoundingClientRect(),
    circle = point.querySelector("circle").getBoundingClientRect();
  const x = circle.left + circle.width / 2 - bounds.left,
    y = circle.top + circle.height / 2 - bounds.top;
  tip.style.left =
    Math.max(10, Math.min(bounds.width - tip.offsetWidth - 10, x + 14)) + "px";
  tip.style.top =
    Math.max(
      10,
      Math.min(
        bounds.height - tip.offsetHeight - 10,
        y - tip.offsetHeight - 14,
      ),
    ) + "px";
}
function hideChartTooltip() {
  const tip = $("#route-tooltip");
  if (tip) tip.hidden = true;
}
document.addEventListener("pointerover", (event) => {
  const point = event.target.closest?.(".chart-point");
  if (point) showChartTooltip(point);
});
document.addEventListener("pointerout", (event) => {
  const point = event.target.closest?.(".chart-point");
  if (
    point &&
    !point.contains(event.relatedTarget) &&
    !point.contains(document.activeElement)
  )
    hideChartTooltip();
});
document.addEventListener("focusin", (event) => {
  const point = event.target.closest?.(".chart-point");
  if (point) showChartTooltip(point);
});
document.addEventListener("focusout", (event) => {
  if (event.target.closest?.(".chart-point")) hideChartTooltip();
});

function previewMapRoute(id){
 document.querySelectorAll('.routes-table tbody tr[data-route]').forEach(row=>row.classList.toggle('is-map-preview',row.dataset.route===id));
 const map=$('.map-stage > .route-map');if(!map)return;
 map.classList.toggle('has-route-preview',!!id&&id!==settings.selected);
 const caption=$('[data-map-preview-caption]'),route=rankRoutes(settings).find(route=>route.id===id);
 if(caption){caption.hidden=!route||id===settings.selected;caption.textContent=route?`${route.short} · ${money(route.cost)} · ${route.days} days`:'';}
 map.querySelectorAll('[data-map-route]').forEach(path=>path.classList.toggle('is-preview',path.dataset.mapRoute===id));
}
function routePreviewTarget(target){return target?.closest?.('[data-preview-route],[data-map-route]');}
document.addEventListener('pointerover',event=>{const target=routePreviewTarget(event.target);if(target)previewMapRoute(target.dataset.previewRoute||target.dataset.mapRoute);});
document.addEventListener('pointerout',event=>{if(routePreviewTarget(event.target)){const next=routePreviewTarget(event.relatedTarget);previewMapRoute(next?.dataset.previewRoute||next?.dataset.mapRoute);}});
document.addEventListener('focusin',event=>{const target=routePreviewTarget(event.target);if(target)previewMapRoute(target.dataset.previewRoute||target.dataset.mapRoute);});
document.addEventListener('focusout',event=>{if(routePreviewTarget(event.target)){const next=routePreviewTarget(event.relatedTarget);previewMapRoute(next?.dataset.previewRoute||next?.dataset.mapRoute);}});
