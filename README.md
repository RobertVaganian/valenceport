<div align="center">

<img src="docs/brand/valenceport-animated.gif?v=2" alt="ValencePort animated mark" width="80" height="80">

# ValencePort

**A clearer route forward.**

Product design & working prototype by **Robert Vaganian**

[![Checks](https://img.shields.io/github/actions/workflow/status/RobertVaganian/valenceport/checks.yml?branch=main&label=checks&style=flat&labelColor=29332e&color=60786b)](https://github.com/RobertVaganian/valenceport/actions/workflows/checks.yml)
[![Deployment](https://img.shields.io/github/actions/workflow/status/RobertVaganian/valenceport/deploy.yml?branch=main&label=deploy&style=flat&labelColor=29332e&color=60786b)](https://github.com/RobertVaganian/valenceport/actions/workflows/deploy.yml)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES_modules-60786b?style=flat&labelColor=29332e)](package.json)
[![On-device AI](https://img.shields.io/badge/AI-on_device-60786b?style=flat&labelColor=29332e)](#on-device-ai-start-with-a-brief)

<p>
<a href="https://robertvaganian.github.io/valenceport/"><strong>Live prototype</strong></a>
&nbsp; · &nbsp;
<a href="https://robertvaganian.github.io/valenceport/case-study/"><strong>Case study</strong></a>
&nbsp; · &nbsp;
<a href="https://robertvaganian.github.io/valenceport/?brief=1"><strong>Try local AI</strong></a>
</p>

</div>

---

ValencePort helps a freight planner compare six ways to move the same Shanghai–Rotterdam shipment. Cost, arrival and emissions stay beside the route, so a lower quote does not hide a missed deadline.

**The decision:** Cape costs **€16,880** but arrives five days late. Suez costs **€1,540 more** and arrives nine days earlier, within all three limits.

[![ValencePort workspace: the selected corridor, pinned baseline and planning limits](docs/readme/overview.jpg?v=4)](docs/screenshots/01-planner-dark.jpg?v=4)

## Inside the workspace

Four details from the working prototype. Select an image to inspect the complete screen.

<table>
<tr>
<td width="50%" valign="top"><strong>01 · Follow the route</strong><br><br><a href="docs/screenshots/01-planner-dark.jpg?v=4"><img src="docs/readme/map.jpg?v=4" width="440" alt="Selected Suez corridor and the pinned Cape baseline on the route map"></a><br><sub>Keep the selected corridor and baseline in view.</sub></td>
<td width="50%" valign="top"><strong>02 · Read the trade-off</strong><br><br><a href="docs/screenshots/02-tradeoffs-light.jpg?v=4"><img src="docs/readme/tradeoffs.jpg?v=4" width="440" alt="Cost and transit time plotted against the shipment budget and deadline"></a><br><sub>Compare the options against the same limits.</sub></td>
</tr>
<tr>
<td width="50%" valign="top"><strong>03 · Inspect the journey</strong><br><br><a href="docs/screenshots/03-journey-dark.jpg?v=4"><img src="docs/readme/journey.jpg?v=4" width="440" alt="Planned journey stages and the arrival estimate for Suez"></a><br><sub>See the stages behind an arrival estimate.</sub></td>
<td width="50%" valign="top"><strong>04 · Compare alternatives</strong><br><br><a href="docs/screenshots/04-comparison-light.jpg?v=4"><img src="docs/readme/comparison.jpg?v=4" width="440" alt="Suez, Cape and Middle Corridor compared on cost, transit, arrival and emissions"></a><br><sub>Read the complete compromise side by side.</sub></td>
</tr>
</table>

## On-device AI: start with a brief

**“Stay under EUR 22,000. Arrive by 14 December. Getting there sooner matters most.”**

The **AI · Planning brief** button prepares a plan you can inspect: source-linked limits, a suggested priority and a calculated route. Review the interpretation, change the priority if needed, then apply it explicitly.

[![A local planning brief with its source quotes, reviewed priority and calculated route](docs/readme/planning-brief.jpg?v=4)](docs/screenshots/07-planning-brief-light.jpg?v=4)

The model interprets the preference in your wording. Explicit parsing handles the limits; the route model supplies prices, arrival and emissions. Saving a scenario still needs your own reason.

**No API key or paid inference.** First use downloads about 50 MB; inference runs on the device. Unclear preferences require a manual choice. A labelled rules-only preview is available without loading the model.

[Try the planning brief →](https://robertvaganian.github.io/valenceport/?brief=1) · [How it works](docs/local-intelligence.md)

## Test a change. Keep the reason.

Add **seven days of port delay**: Suez moves from 10 to 17 December and misses the deadline. The Middle Corridor remains eligible. The inspector shows the impact, and the bell records what changed.

Notifications include an unread count, All/Unread filters and links to the relevant route or saved assumptions. They track planning activity in this browser. Opening an earlier event never restores old limits.

Save an eligible scenario with its explanation, constraints and baseline. Its assumptions remain readable after the workspace changes. Export a comparison or JSON backup when needed.

## Why I designed it this way

**Eligibility before preference.** A cheap route is not useful if it breaks the plan. Check the limits first, then rank the eligible options by the planner’s priority.

**Put AI beside the decision.** A brief helps set up the comparison. Source quotes and a calculated preview make its interpretation inspectable before anything is applied.

**Preserve the context.** A saved number needs the assumptions and reasoning that produced it. Stress-test impact stays separate from comparison against a baseline.

IBM Plex Sans supports the dense interface; Archivo gives the headings their compact character. Warm stone surfaces, light and dark themes, and a responsive card layout keep the same hierarchy across screen sizes.

## On a phone

Pinch to zoom, then drag the map with one finger. Fit returns to the complete corridor; Expand keeps the same camera in a larger view. Scroll outside the map to move through the planner. Compact screens load a smaller display layer; route positions and planning calculations stay the same.

## Run locally

Requires **Node.js 22+**. No dependency installation is needed.

```sh
git clone https://github.com/RobertVaganian/valenceport.git
cd valenceport
npm run dev
```

Open **http://127.0.0.1:8080**. Run `npm run check` for syntax checks and the 128 behavior tests.

<details>
<summary><strong>Implementation, data and scope</strong></summary>

The editable application lives in `dist/`: HTML, CSS and JavaScript modules, with no build step. Core planning runs without third-party runtime downloads. Optional local AI loads a pinned MiniLM model and Transformers.js in a worker.

| Area | Source |
| --- | --- |
| Calculations and ranking | [model.mjs](dist/model.mjs) |
| Map and camera | [route-map.mjs](dist/route-map.mjs), [map-camera.mjs](dist/map-camera.mjs) |
| Saved records and backups | [workspace-model.mjs](dist/workspace-model.mjs) |
| Local AI and notifications | [Local intelligence notes](docs/local-intelligence.md) |
| Interactive case study | [case-editorial.mjs](dist/case-editorial.mjs) |

A self-initiated concept using illustrative shipment records, rates, durations and emissions. No live quotes, booking or operational clearance. Saved data stays in the browser unless exported. No participant research or measured business impact is claimed.

Natural Earth supplies the base geography. SeaRoute and OpenStreetMap-derived networks supply documented route geometry; air links are indicative. See [route provenance](docs/corridor-provenance.md), [track credits](dist/assets/tracks/README.md), [font licenses](dist/assets/fonts/README.md) and [LICENSE](LICENSE).

</details>
