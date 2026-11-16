# Mobile map navigation

The embedded map and expanded view use the same pointer controller. Pinch changes scale around the gesture midpoint; a single finger pans after zooming. Lifting one finger continues a pan from the current camera. Fit returns to the bounded 100% view. At Fit, the complete geographic area is already visible, so panning has no range until zoomed.

The SVG owns touch gestures. The surrounding planner remains available for page scrolling. Dragging does not select a route; a tap still opens a route or location. Pointer cancellation, lost capture, focus loss and view replacement release the gesture. Keyboard zoom, arrow-key panning and Fit remain available.

## Rendering changes

- Pointer events keep their latest camera and paint at most once per animation frame. Pointer release flushes the final position.
- During movement, port labels keep their current slots and follow their anchors. Collision placement and geographic text measurements run when movement ends. Country labels return after settling.
- Compact/touch screens use a derived geographic display layer: 892,540 bytes instead of 2,134,390, with 66,082 instead of 135,970 vertices. The development script uses a 0.2-viewBox-unit simplification tolerance. Shipping corridors, stops and planning data are unchanged.
- A closed journey player no longer samples SVG path geometry. Compact transitions do not clone and crossfade the atlas.

The spectral AI border uses a transform animation on an isolated layer. It does not animate layout, text or a blur filter. Reduced-motion preferences keep it static; the launcher uses a slower sweep than the open input field.

These changes reduce work and asset size; they are not a measured frame-rate guarantee for every physical device.
