# Local planning briefs and notifications

The planning brief is an optional way to prepare settings for one illustrative Shanghai–Rotterdam shipment. Core planning remains available without the model.

## What happens after Interpret

1. `parseBrief` reads explicitly labelled EUR budgets, named or ISO dates and t CO2e limits. Missing fields retain their current values. Invalid dates, conflicting amounts, unsupported currencies, relative dates, route exclusions and unparsed numbers block the preview.
2. A module worker loads the quantised `Xenova/all-MiniLM-L6-v2` model. Mean-pooled, normalised embeddings compare the preference wording with two descriptions for each of four priorities. There is no text generation.
3. The highest mean cosine similarity suggests a priority only if its score is at least 0.23 and its margin over the second is at least 0.025. These are conservative interface heuristics, not calibrated confidence or a measured accuracy claim. Ambiguity requires a manual choice.
4. The existing `rankRoutes` model calculates eligibility, cost, arrival and emissions. It proposes the first eligible route under the reviewed priority. With no eligible option, the preview says so and retains the current selection.
5. Apply changes workspace settings only. It never books freight, saves a scenario, writes a rationale or alters an existing snapshot.

The parser intentionally supports a small set of explicit formats rather than claiming to understand arbitrary logistics instructions. The brief is in English; shipment dates use the prototype’s fixed November–December 2026 window. Fuel and delay assumptions remain unchanged. It cannot authorise a corridor or interpret geopolitical restrictions.

## Downloads and device use

- Model: [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2), pinned revision `751bff37182d3f1213fa05d7196b954e230abad9`, q8 weights, Apache 2.0.
- Runtime: [Transformers.js 3.8.1](https://www.npmjs.com/package/@huggingface/transformers/v/3.8.1), from jsDelivr, Apache 2.0.
- WASM inference runs in a dedicated worker with one thread. It does not require WebGPU, cross-origin isolation, an account or an API key.
- First use transfers roughly 50 MB including runtime and the approximately 23 MB model. Actual transfer varies with browser caching. Cache eviction can require a download again; offline availability is not guaranteed.
- Download hosts receive the usual file requests. The brief is not sent to an inference endpoint. Notification records and saved plans stay in the browser’s origin storage unless the person exports a backup; notifications are not included in that backup.
- Stop, close and timeout terminate the worker; obsolete responses cannot supply an applicable preview. Unload releases the worker. Remove model files clears matching model URLs from this origin’s Cache Storage; shared runtime assets may remain. Browser site-data controls can clear retained files.
- Failure leaves a labelled rules-only preview available. It requires a manually selected priority and never claims that AI ran.

## Notifications

The initial warning comes from the actual baseline eligibility check. Further events come from a selected route crossing a limit, a change in the leading eligible option, saving a scenario, importing a collection or applying a brief. Merely selecting a route or reading an event does not create a planning change.

The latest 50 records retain their event-time detail and independent read state. All/Unread filters and Mark all read affect the inbox only. Route actions inspect the route under current settings; saved-scenario actions inspect its immutable assumptions. A deleted saved scenario is shown as unavailable. There are no carrier feeds, OS notification permissions, background push services or live-rate alerts.

Automated checks cover parser boundaries, source-derived calculations, stale results, cancellation, model errors, timeout, read state, retention and missing saved records. Browser review covers real model runs, explicit application, keyboard access and narrow layouts. No logistics-user research or model accuracy benchmark is claimed.
