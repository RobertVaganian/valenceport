# Workspace captures

The images show the running ValencePort prototype with illustrative shipment data. Base captures use Suez selected, Cape pinned, EUR 22,000 budget, 14 December deadline and a 40 t CO2e limit. The planning brief images show a completed real local model run, before applying settings. Notifications show the actual effects of adding seven days of port delay.

Run `npm run dev` and open `/__capture/?scene=planner&theme=dark`. The development-only wrapper renders the app in a two-times-scale iframe. Its surrounding margin contains a Park control outside the exported frame; keep the pointer there, outside the app, before capturing. The wrapper is not deployed. Scene parameters isolate the capture from stored user settings and never write fixtures to local storage.

Supported scenes are `planner`, `tradeoffs`, `journey`, `comparison`, `rationale`, `brief` and `inbox`. `view=case` opens the case study. `w` and `h` set the logical viewport; `theme` chooses light or dark. A brief scene only opens the dialog: use its real Interpret action and wait for the model, then inspect the result. A rationale scene requires text entered through the form.

Wait for fonts, map reveals, metric transitions and result animation to finish. Keep the complete relevant panel and footer in frame. Capture actual pixels, crop only the wrapper margin or surrounding page, and inspect the final images for clipping, cursors, carets and stale values. No interface content is redrawn or composited.

The case study renders its map and interactive decision examples as HTML and SVG. Its AI and notification sections embed captures from the same working prototype.
