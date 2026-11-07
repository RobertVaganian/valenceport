# Map craft, 1.1

The map is the principal visual surface of ValencePort. This pass prioritizes geographic clarity and interaction feedback over extra decorative layers.

## Observed issues

The original map used hand-positioned port cards and small waypoint text. Zoom resized some geographic text while fixed labels could overlap on constrained layouts. Route handovers were visible but could not be inspected directly. The overview offered limited room for studying a corridor, and a small corner radius left open-water paths visually angular.

## Resulting decisions

- Keep the forest/neutral identity; give water, land, selected lines and references distinct contrast levels in both themes.
- Preserve offshore geometry and exact narrow passages. Ease local open-water bends more generously and retain directional cues.
- Use screen-pixel annotation layout rather than manual label offsets. Prioritize endpoints, avoid competing labels and controls, and cull offscreen labels. A separate stop list remains available.
- Keep port cards and waypoint labels readable while zooming. A modest placement preference limits unnecessary changes of label side.
- Inspect a location through the same journey model used by itinerary and Journey. Put the detail card below the map on compact screens.
- Offer a wider map without creating a separate page or losing the selected route.
- Show alternative-route names during hover/focus tracing. Keep identical standard/slow Suez paths selectable by name.
- Retain the live SVG through unrelated state changes and preserve the camera when only the service changes on shared geometry.
- Use short, cancellable camera and path transitions with the system reduced-motion preference respected. Motion does not simulate live tracking.

## Checks

Automated checks cover annotation bounds, endpoint separation at 300–1073 px map widths, constant label dimensions while zooming, offscreen culling and the existing coastline/path invariants. Browser checks cover themes, the compact layout, wide/split views, location details, Fit, route switching, network controls and keyboard input. These checks are interface verification, not a full accessibility audit, domain research or navigational certification.
