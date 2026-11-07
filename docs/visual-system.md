# Visual system — release 1.6

Typography: self-hosted IBM Plex Sans for UI and Archivo variable headings. Instrument Sans was tested alongside Plex on identical shipment, currency, status and table specimens; Plex was retained. Font metadata, sources and OFL licenses are under `dist/assets/fonts/`.

Semantic colors are shared by planner, comparison, saved records, tour and case study. Warm ivory and stone surfaces support a petroleum action color. Within-limits states use muted sage; violations use berry. All status labels retain text and icons. Text/status contrast checks cover both light and dark themes.

Route selection reveals the complete selected layer through a normalized SVG mask (`pathLength=1`). The mask stroke width is adjusted to camera scale, so it covers the fixed-width rendered route. This replaces the old screen-dependent stroke-dash animation, which could appear incomplete when zoom changed. Air/ferry dash styles survive the reveal; observed flight components remain separate.

Quick tour: five manually selectable chapters with code-native vector examples, pause/replay, descriptive text and practical tips. The examples are isolated from workspace settings. CSS motion and camera transitions respect reduced motion.

Case study: editorial hierarchy, full-width atlas with independent corridor selection, three interactive design-decision examples and clearly separated scope/research boundaries. Comparisons and stress-test results derive from the same model as the application. No user-study or business-impact claims are invented.

The redundant application footer was removed. Data and methodology remain accessible from About this map, cost details, the workspace About dialog and the case study. Important secondary labels were enlarged across planner, comparison, Journey and saved records.

Release 1.6: Column sorting exposes neutral/ascending/descending states and preserves its state during stress tests. A first click reverses an already ascending eligible group, so it has a visible effect. The profile opens an accessible menu; the duplicate question-mark tour launcher was removed. The Quick tour is a finite before/action/result sequence with manual frames and a held result. Button icons keep a fixed optical centre on hover.

Menus use inset rounded rows, muted selection fills and a visible sage keyboard-focus border. Scenario presets share these states and expose their assumptions before selection. UI symbols are inline SVG with a consistent 2-unit stroke; menu icons render at 20 px.

Planning limits share inset focus states and paired number controls. The date picker follows the app theme, supports Monday-first keyboard navigation, and respects the shipment planning horizon. Profile access appears only in the top bar.
