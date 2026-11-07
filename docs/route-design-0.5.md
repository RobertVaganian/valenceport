# Route map review — 0.5

The review covered selection, reference comparison, overlapping services, zoom, keyboard input and the case-study map. Existing shipment calculations and schematic coordinates were retained.

## Findings and changes

1. **Selected and reference routes:** dark land competed with the routes and the reference line was weak. The map now uses quieter land, a solid selected path and a contrasting dashed reference. A named legend makes each role explicit.
2. **Bends and direction:** abrupt polyline joints obscured the overall passage. Small local curves ease bends while endpoints and named handovers stay anchored. Two direction marks indicate origin-to-destination order without implying live tracking.
3. **Coincident services:** standard and slow-steaming Suez services share geography. Named controls keep both selectable, and a shared-path note explains why only one geographic line is drawn. A selected reference uses one combined legend.
4. **Small screens:** the route picker retains the active option in view. Intermediate place names move into a legible caption below the map, avoiding port-label collisions. Page width remains bounded at tested phone and tablet sizes.
5. **Portfolio continuity:** the case-study illustration uses the same renderer, independent of the planner camera. It exposes no route-selection actions.

## Validation

Checked in the browser in light and dark themes: route selection, baseline selection, shared paths, direct air, Middle Corridor, Fit, zoom, keyboard selection and transitions to Trade-offs and Journey. Checked phone widths of 360/390 px and tablet width of 768 px. Automated checks cover endpoint preservation, named handovers, shared geometry, direction placement and static case-study output alongside the existing calculation tests.

The geography remains schematic planning evidence, not a carrier navigation route. These checks do not constitute a full assistive-technology or WCAG audit.
