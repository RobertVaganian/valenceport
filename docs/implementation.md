# Implementation and data notes

A freight scenario planning prototype by Robert Vaganian. Compare one fictional Shanghai–Rotterdam shipment across logistics cost, delivery time and transport emissions, test assumptions, and preserve the rationale behind a plan.

## Run

The application is dependency-free HTML, CSS and JavaScript modules. Run with Node.js 22 or newer:

```sh
npm run dev
```

Or serve `dist/` with Python:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. The standalone case study is at `/case-study/`.

## Verify

With Node.js 22 or newer:

```sh
npm run check
```

Checks cover calculations, ranking, saved snapshots, import validation, geometry continuity, road simplification tolerance, partial flight observations, complete route-reveal masks, case-study stress examples and text/status contrast in both themes. Browser review also exercises comparison, saving, export, the five tour chapters, view transitions and responsive layouts.

## The workflow

- Set the shipment's budget, delivery deadline and emissions limit.
- Inspect six ocean, rail, sea–air and air alternatives. Eligibility is separate from selection and comparison.
- Rank routes within each eligibility group by cost, speed, emissions or a balanced score.
- Pin a baseline, compare up to three routes, or inspect the journey stages.
- Stress-test fuel and port delay. Impact compares the same route before and after the assumption change.
- Save an eligible scenario with a name and reason. Reopen its assumptions, rename or star it, or export a backup.

The five-step Quick tour uses animated vector examples with pause, replay and direct chapter selection. It never changes workspace assumptions. The case study has its own isolated corridor selector and calculated comparison, delay and rationale examples.

## Calculation boundaries

Total logistics cost is freight, fuel adjustment, origin handling, destination handling, cargo insurance and contingency. Fuel adjustment applies to freight only. Port delay adds calendar days to ocean, rail and sea–air options; it does not alter direct air. Departure is fixed at 9 November 2026.

Routes must meet all three limits before saving. Explicit priorities sort by the named metric within each eligibility group. Balanced uses cost/time/emissions weights of 55/30/15, normalized within the eligible set. No recommendation is given when no route is eligible. Pinning a baseline changes deltas, not eligibility or ranking.

Prices, durations, capacity and emissions are illustrative. Estimate ranges are not statistical confidence intervals. The prototype does not book freight, retrieve live rates, certify emissions or calculate duties, VAT or CBAM.

## Map geometry

- Sea legs follow the SeaRoute network and SMDG terminal coordinates. Narrow passages and coastal vertices are protected from smoothing.
- Railway candidates follow cached OpenRailRouting / OpenStreetMap geometry. Two continuous rail components are connected by a separately dashed, indicative Kuryk–Alat ferry link. Freight permissions and gauge transfers are not certified.
- Jebel Ali–DWC and AMS–Rotterdam road transfers follow cached OSRM driving routes. Dotted terminal-access connectors distinguish road snaps; this is not HGV clearance routing.
- Dashed air arcs connect airports and do not claim a filed flight path. An optional KL896 example (4 November 2026) shows eight observed ADS-B segments without joining coverage gaps. PVG departure is absent; the largest gap is 6 h 31 min. This passenger-flight example does not describe the planned cargo service. No verified recorded DWC–AMS track is available.

See [provenance](corridor-provenance.md) and [acquisition notes](../dist/assets/tracks/README.md). Original network geometry and the flight observation fixture are included under `dist/assets/tracks/`.

Natural Earth 1:10m vectors are self-hosted. Persistent SVG definitions survive workspace/case-study transitions. Camera movement preserves the geographic projection; port labels retain a readable screen size. Route reveals use normalized masks rather than screen-dependent dash lengths, so selection completes at any zoom. Wheel zoom is continuously damped. Motion respects the system's reduced-motion preference.

## Visual system

IBM Plex Sans is the interface face; variable Archivo provides compact display headings. Both fonts are self-hosted with their OFL licenses. A neutral warm stone palette uses petroleum for actions, muted sage for valid states, and berry for constraint violations. Icons and labels supplement color. Secondary text and status pairs meet 4.5:1 contrast in both themes.

The case study uses live vector product views and interactive examples rather than scaled screenshots. It describes design decisions and scope without claiming user research or measured business outcomes.

## Local storage and export

Settings and saved scenarios live in browser local storage. There is no backend or carrier connection. A snapshot is a planning record, not a booking or approval. CSV comparisons, text briefs and versioned JSON collection backups retain data outside the browser. Backup import validates calculations, skips duplicate identifiers and does not overwrite existing snapshots. Collection size is limited to 50 records. Delete supports session undo; the Decision log is a collection timeline, not a tamper-proof audit trail.

## Structure

| File | Responsibility |
| --- | --- |
| `dist/model.mjs` | Shipment, route data, calculations and ranking |
| `dist/planner-view.mjs`, `dist/scenario-lab.mjs` | Planner and inspector |
| `dist/planning*.mjs`, `dist/analysis-*.mjs` | Comparison and journey views |
| `dist/route-map.mjs`, `dist/route-geometry.mjs` | Map rendering, line styles and reveal geometry |
| `dist/map-navigation.mjs`, `dist/map-annotations.mjs` | Camera motion and stable labels |
| `dist/geography-base.mjs`, `dist/network-tracks.mjs` | Cached vector base and route infrastructure |
| `dist/guide.mjs`, `dist/guide.css` | Animated onboarding examples |
| `dist/case-editorial.mjs`, `dist/case-editorial.css` | Independent interactive case study |
| `dist/workspace-model.mjs`, `dist/workspace-views.mjs` | Saved collection and backup validation |
| `dist/identity.css` | Fonts, semantic palette and shared hierarchy |
| `dist/app.js` | View state, dialogs and browser persistence |
| `tests/` | Domain, geometry and presentation regression checks |

## Attribution

Natural Earth geography is public domain. SeaRoute's Apache 2.0 license is included. OSM-derived network data and ADSB.lol observations use ODbL 1.0; credits and sources are accessible through Profile → About this workspace → Map sources & credits. Font licenses are in `dist/assets/fonts/`. The ValencePort mark and interface SVG paths are included in the source.

Interface behavior: Column sorting exposes neutral/ascending/descending states and preserves its state during stress tests. A first click reverses an already ascending eligible group, so it has a visible effect. The profile opens an accessible menu; the duplicate question-mark tour launcher was removed. The Quick tour is a finite before/action/result sequence with manual frames and a held result. Button icons keep a fixed optical centre on hover.

Scenario presets use a keyboard-accessible popover with before/after assumptions. Map sources and credits are available through Profile → About this workspace.

## Corridor notice

A manually reviewed Hormuz notice records sources dated 6 November 2026, reviewed 7 November. It identifies the Dubai sea–air corridor and links to Maersk and IMO. It is a dated reference, not a live availability feed, and does not assign a modelled delay or surcharge. See [source notes](hormuz-advisory.md).
