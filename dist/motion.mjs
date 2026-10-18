const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const easing = "cubic-bezier(.2,.75,.25,1)";
let cleanups = [];

// Capture the visible values before replacing a view. No animation owns product state.
export function captureMotion(root, context) {
  cleanups.forEach((stop) => stop());
  cleanups = [];
  if (!root || reduced()) return { context };
  return {
    context,
    panel: root.querySelector('.map-panel')?.getBoundingClientRect().toJSON(),
    controls: new Map([...root.querySelectorAll('[aria-pressed],[aria-expanded]')].map(el=>[(el.dataset.action||'')+'|'+(el.dataset.value||''),el.getAttribute('aria-pressed')||el.getAttribute('aria-expanded')])),
    rows: new Map(
      [...root.querySelectorAll("tr[data-route]")].map((el) => [
        el.dataset.route,
        {
          y: el.getBoundingClientRect().top,
          color: getComputedStyle(el).backgroundColor,
        },
      ]),
    ),
    metrics: new Map(
      [...root.querySelectorAll("[data-metric]")].map((el) => [
        el.dataset.metric,
        Number(el.dataset.display ?? el.dataset.value),
      ]),
    ),
    points: new Map(
      [...root.querySelectorAll(".chart-point")].map((el) => {
        const circle = el.querySelector("circle");
        return [
          el.dataset.value,
          {
            x: Number(circle.getAttribute("cx")),
            y: Number(circle.getAttribute("cy")),
          },
        ];
      }),
    ),
    graphic: root
      .querySelector(".map-stage > svg,.map-stage > .analysis-view")
      ?.cloneNode(true),
  };
}

export function playMotion(root, before, context) {
  if (!root || reduced()) return;
  const previous = before?.context;
  const animate = (el, frames, duration = 240) => {
    if (!el) return;
    const animation = el.animate(frames, { duration, easing });
    cleanups.push(() => animation.cancel());
    return animation;
  };
  if (!previous || previous.view !== context.view) {
    animate(
      root,
      [
        { opacity: 0.25, transform: "translateY(7px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      220,
    );
    return;
  }
  if(previous.mapWide!==context.mapWide && before.panel){
    const panel=root.querySelector('.map-panel'),next=panel?.getBoundingClientRect();
    if(next)animate(panel,[{transformOrigin:'top left',transform:`translate(${before.panel.x-next.x}px,${before.panel.y-next.y}px) scale(${before.panel.width/next.width},${before.panel.height/next.height})`},{transformOrigin:'top left',transform:'none'}],300);
  }
  for(const el of root.querySelectorAll('[aria-pressed],[aria-expanded]')){
    const key=(el.dataset.action||'')+'|'+(el.dataset.value||''),old=before.controls?.get(key),next=el.getAttribute('aria-pressed')||el.getAttribute('aria-expanded');
    if(old!==undefined&&old!==next)animate(el,[{opacity:.55},{opacity:1}],220);
  }
  for (const el of root.querySelectorAll("tr[data-route]")) {
    const old = before.rows?.get(el.dataset.route);
    if (!old) continue;
    const distance = old.y - el.getBoundingClientRect().top;
    if (Math.abs(distance) > 1)
      animate(el,[{opacity:0.65},{opacity:1}],160);
    const color = getComputedStyle(el).backgroundColor;
    if (old.color !== color)
      animate(
        el,
        [{ backgroundColor: old.color }, { backgroundColor: color }],
        260,
      );
  }
  for (const el of root.querySelectorAll(".chart-point")) {
    const old = before.points?.get(el.dataset.value),
      circle = el.querySelector("circle");
    if (!old || !circle) continue;
    const dx = old.x - Number(circle.getAttribute("cx")),
      dy = old.y - Number(circle.getAttribute("cy"));
    if (Math.abs(dx) + Math.abs(dy) > 1)
      animate(
        el,
        [
          { transform: `translate(${dx}px,${dy}px)` },
          { transform: "translate(0,0)" },
        ],
        280,
      );
  }
  const switched = previous.chart !== context.chart || previous.plotRange !== context.plotRange;
  const routeChanged = previous.selected !== context.selected;
  const geographyChanged = previous.geometry !== context.geometry;
  const referenceChanged = previous.baseline !== context.baseline;
  const stage = root.querySelector(".map-stage");
  if (
    stage &&
    before.graphic &&
    (switched || (routeChanged && geographyChanged) || referenceChanged)
  ) {
    const old = before.graphic;
    old.removeAttribute("role");
    old.setAttribute("aria-hidden", "true");
    old.setAttribute("inert", "");
    old.classList.add("motion-ghost");
    old
      .querySelectorAll("[tabindex],button,a,input,select,textarea")
      .forEach((el) => el.setAttribute("tabindex", "-1"));
    stage.append(old);
    const fade = animate(old, [{ opacity: 1 }, { opacity: 0 }], 240);
    fade.onfinish = () => old.remove();
    cleanups.push(() => old.remove());
    const next = stage.querySelector(
      ":scope > svg:not(.motion-ghost), :scope > .analysis-view:not(.motion-ghost)",
    );
    animate(
      next,
      [
        { opacity: 0, transform: switched ? "translateY(5px)" : "none" },
        { opacity: 1, transform: "none" },
      ],
      280,
    );
  }
  if (routeChanged && geographyChanged && context.chart === "map") {
    const path = root.querySelector(".route-reveal-mask");
    if (path) {
      animate(
        path,
        [
          { strokeDashoffset: "1" },
          { strokeDashoffset: "0" },
        ],
        1000,
      );
      for (const direction of root.querySelectorAll(".map-direction")) {
        animate(
          direction,
          [
            { opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.55 },
            { opacity: 1, offset: 1 },
          ],
          1000,
        );
      }
    }
    animate(
      root.querySelector(".route-detail"),
      [
        { opacity: 0.4, transform: "translateX(4px)" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      240,
    );
  }
  for (const el of root.querySelectorAll("[data-metric]")) {
    const start = before.metrics?.get(el.dataset.metric),
      end = Number(el.dataset.value);
    if (!Number.isFinite(start) || start === end) continue;
    let frame, origin;
    const format = (value) =>
      el.dataset.metric === "cost"
        ? new Intl.NumberFormat("en-IE", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          }).format(value)
        : el.dataset.metric === "co2"
          ? value.toFixed(1)
          : Math.round(value).toString();
    const tick = (time) => {
      origin ??= time;
      const progress = Math.min(1, (time - origin) / 280);
      const value = start + (end - start) * (1 - Math.pow(1 - progress, 3));
      el.textContent = format(value);
      el.dataset.display = String(value);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else delete el.dataset.display;
    };
    frame = requestAnimationFrame(tick);
    cleanups.push(() => {
      cancelAnimationFrame(frame);
      el.textContent = format(end);
      delete el.dataset.display;
    });
  }
}
