<div align="center">

  <picture>
    <source media="(prefers-reduced-motion: reduce)" srcset="docs/brand/valenceport-mark.png?v=2">
    <img src="docs/brand/valenceport-animated.gif?v=2" alt="ValencePort — two paths forming a connected V" width="88" height="88">
  </picture>

  # ValencePort

  **A clearer route forward.**

  Freight scenario planning · Product design & working prototype<br>
  Designed by **Robert Vaganian**

  [![Release](https://img.shields.io/badge/version-2.0.0-435f56?style=flat)](package.json)
  [![JavaScript](https://img.shields.io/badge/JavaScript-ES_modules-435f56?style=flat)](dist/app.js)
  [![Node](https://img.shields.io/badge/Node-%E2%89%A522-435f56?style=flat)](package.json)
  [![On-device AI](https://img.shields.io/badge/AI-on_device-435f56?style=flat)](#on-device-ai-from-a-brief-to-a-plan)
  [![Tests](https://img.shields.io/badge/behavior_tests-118-435f56?style=flat)](tests/)
  [![Responsive](https://img.shields.io/badge/responsive-desktop_%C2%B7_tablet_%C2%B7_mobile-435f56?style=flat)](#desktop-to-mobile)

  [Open the prototype](https://robertvaganian.github.io/valenceport/) ·
  [Case study](https://robertvaganian.github.io/valenceport/case-study/) ·
  [Try local AI](https://robertvaganian.github.io/valenceport/?brief=1) ·
  [Run locally](#run-locally) ·
  [Why this design](#why-i-designed-it-this-way)

</div>

---

A lower quote can hide a worse plan. ValencePort compares six ways to move the same Shanghai–Rotterdam shipment across **cost, arrival and transport emissions**, then lets a planner test the assumptions and keep the reason behind a choice.

The starting plan costs **€16,880** but arrives **five days late**. The Suez alternative costs **€1,540 more**, arrives **nine days earlier** and meets all three planning limits. That is the decision the interface needs to make clear.

## The workspace

Six views from the working prototype, in light and dark themes. Select any screen to inspect it at full size.

<table>
  <tr>
    <td width="50%" valign="top">
      <strong>01 · Route planning</strong><br><br>
      <a href="docs/screenshots/01-planner-dark.jpg?v=2"><img src="docs/screenshots/01-planner-dark.jpg?v=2" alt="Map the selected corridor against its baseline." width="440"></a><br>
      <sub>Map the selected corridor against its baseline.</sub>
    </td>
    <td width="50%" valign="top">
      <strong>02 · Cost and time</strong><br><br>
      <a href="docs/screenshots/02-tradeoffs-light.jpg?v=2"><img src="docs/screenshots/02-tradeoffs-light.jpg?v=2" alt="See the deadline, budget and emissions trade-off." width="440"></a><br>
      <sub>See the deadline, budget and emissions trade-off.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>03 · Planned journey</strong><br><br>
      <a href="docs/screenshots/03-journey-dark.jpg?v=2"><img src="docs/screenshots/03-journey-dark.jpg?v=2" alt="Inspect the stages behind an arrival estimate." width="440"></a><br>
      <sub>Inspect the stages behind an arrival estimate.</sub>
    </td>
    <td width="50%" valign="top">
      <strong>04 · Compare alternatives</strong><br><br>
      <a href="docs/screenshots/04-comparison-light.jpg?v=2"><img src="docs/screenshots/04-comparison-light.jpg?v=2" alt="Read costs, arrival and emissions side by side." width="440"></a><br>
      <sub>Read costs, arrival and emissions side by side.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <strong>05 · Preserve the rationale</strong><br><br>
      <a href="docs/screenshots/05-rationale-dark.jpg?v=2"><img src="docs/screenshots/05-rationale-dark.jpg?v=2" alt="Keep the assumptions and reason with the plan." width="440"></a><br>
      <sub>Keep the assumptions and reason with the plan.</sub>
    </td>
    <td width="50%" valign="top">
      <strong>06 · Inside the design</strong><br><br>
      <a href="docs/screenshots/06-case-study-light.jpg?v=2"><img src="docs/screenshots/06-case-study-light.jpg?v=2" alt="Explore the product decisions in an interactive case study." width="440"></a><br>
      <sub>Explore the product decisions in an interactive case study.</sub>
    </td>
  </tr>
</table>

## On-device AI: from a brief to a plan

**“Stay under EUR 22,000, arrive by 14 December; getting there sooner matters most.”**

The **AI · Planning brief** button turns that request into a preview: explicit limits with their source quotes, a suggested priority and a calculated route. Change the priority or apply the preview when ready. Saving still requires your own reason for the decision.

[![Local planning brief with an arrival-first suggestion and a Middle Corridor preview](docs/screenshots/07-planning-brief-light.jpg?v=2)](docs/screenshots/07-planning-brief-light.jpg?v=2)

| Part of the request | What handles it |
| --- | --- |
| Preference expressed in words | A small MiniLM model suggests arrival, cost, emissions or balanced priority. |
| Budget, deadline and CO₂e limit | Explicit parsing, with source quotes and validation. |
| Route eligibility, prices and arrival | The same calculation model as the workspace. |
| Applying the plan | The planner, after reviewing the preview. |

No account, API key or paid inference. First use downloads about **50 MB**, including a 23 MB model, from Hugging Face and jsDelivr. Inference runs on the device; the brief is not sent to an inference endpoint. Unclear priorities require a choice. Unsupported numeric instructions are blocked. A labelled **rules-only preview** is available without loading AI.

[How the local model works →](docs/local-intelligence.md)

## Notifications with somewhere useful to go

Add **seven days of port delay** in Scenario lab. Suez misses the deadline, the leading eligible option changes, and both events appear behind the bell. The unread count, All/Unread filters and read controls help track the changes.

[![Planning notifications after a seven-day delay](docs/screenshots/08-notifications-light.jpg?v=2)](docs/screenshots/08-notifications-light.jpg?v=2)

A route event opens the current plan. A saved-scenario event opens its original assumptions. Earlier notifications never silently restore old limits. These are browser-local planning events, with the latest 50 retained; they are not carrier push alerts.

## A planning session

1. **Set the limits**, directly or through a planning brief.
2. **Compare eligible routes**, inspect their journey and pin a baseline.
3. **Test fuel and delay assumptions**; follow the changes in the inspector and notifications.
4. **Save the reason**, keeping the route, limits and assumptions together. Export a comparison or JSON backup when needed.

On phones, cards replace the wide table, comparisons stack and the map has a dedicated full-screen view. Bottom navigation keeps the workspace within reach. Light and dark themes share the same hierarchy.

## Why I designed it this way

### Eligibility comes before preference

The cheapest or fastest option may still break the plan. The table separates routes within limits from those outside them, then sorts each group by the chosen priority. Selection, comparison and the pinned baseline have distinct controls.

### The map carries the geography

A self-hosted vector base stays sharp while zooming. Sea, rail, road and air legs retain different line styles; gaps in recorded observations remain gaps. Smooth camera movement, route reveals and a full-map view help people follow a corridor without losing their place.

### A saved plan keeps its context

Saving preserves the route, constraints, assumptions, baseline and explanation together. Fuel and delay impact remain separate from baseline comparisons, so two different kinds of change are not mixed into one number.

IBM Plex Sans supports the dense interface; Archivo gives the headings their compact character. Warm stone surfaces, restrained status tones and light and dark themes share one visual system. Motion respects reduced-motion preferences.

## Run locally

Requires **Node.js 22 or newer**. No dependency installation, API key or account is needed.

```sh
npm run dev
```

Open **http://127.0.0.1:8080**. The interactive case study is at **http://127.0.0.1:8080/case-study/**.

```sh
npm run check
```

This checks JavaScript syntax and runs the 118 behavior tests. Serve the app through HTTP; opening `dist/index.html` directly does not load its modules correctly.

<details>
<summary><strong>Implementation, calculations and data sources</strong></summary>

The application uses HTML, CSS and JavaScript modules without a build step. Core planning works without third-party runtime downloads. Optional local AI loads a pinned Transformers.js runtime and model only after an explicit action. The `dist/` directory contains the editable application, not an opaque generated bundle.

| Area | Entry points |
| --- | --- |
| Shipment data, calculations and ranking | [`dist/model.mjs`](dist/model.mjs) |
| Map, geometry and camera movement | [`dist/route-map.mjs`](dist/route-map.mjs), [`dist/map-camera.mjs`](dist/map-camera.mjs) |
| Fuel and delay assumptions | [`dist/scenario-lab.mjs`](dist/scenario-lab.mjs) |
| Saved records and backup validation | [`dist/workspace-model.mjs`](dist/workspace-model.mjs) |
| Local planning brief | [`dist/brief-model.mjs`](dist/brief-model.mjs), [`dist/brief-worker.mjs`](dist/brief-worker.mjs) |
| Planning notifications | [`dist/notifications.mjs`](dist/notifications.mjs) |
| Interactive product design case study | [`dist/case-editorial.mjs`](dist/case-editorial.mjs) |

Checks cover ranking, calculations, saved snapshots, import validation, geography, route continuity, complete reveals and text/status contrast. See the [implementation notes](docs/implementation.md) for calculation rules and model boundaries.

Geography uses Natural Earth. Sea legs use SeaRoute; cached rail and road geometry comes from OpenStreetMap-based routing. Air connections are indicative; the optional historical flight example preserves observation gaps. See [route provenance](docs/corridor-provenance.md) and [track notes](dist/assets/tracks/README.md).

</details>

## Scope and credits

A self-initiated portfolio concept by **[Robert Vaganian](https://github.com/RobertVaganian)**. Shipment records, prices, durations and emissions are illustrative. The prototype does not retrieve live rates, book freight or certify an operational route. Saved scenarios stay in the current browser unless exported.

The case study explains design decisions and interface validation. No user research results or measured business impact are claimed.

MiniLM and Transformers.js use Apache 2.0; see the [local intelligence notes](docs/local-intelligence.md) for pinned sources. Natural Earth is public domain. SeaRoute uses Apache 2.0; OSM-derived network data and ADSB.lol observations use ODbL 1.0. Credits are included with the [route data](dist/assets/tracks/README.md); the self-hosted fonts include their [OFL licenses](dist/assets/fonts/README.md).
