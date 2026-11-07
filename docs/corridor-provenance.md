# Corridor geometry and map provenance

## What the map represents

ValencePort is a planning prototype. A documented transport corridor, a network-routed visualization and a carrier's actual track are different things. The app exposes this distinction in **About this map**. Prices, durations, emissions and capacity are illustrative and are not inferred from live carrier data.

## Marine geometry

`maritime-data.mjs` contains SeaRoute 1.6.0 network paths, generated through Singapore Pasir Panjang. The Suez option follows the maritime graph through Malacca, Bab-el-Mandeb, Suez and Gibraltar. The Cape option explicitly excludes Suez, Panama, Northwest Passage and Sunda; its graph route passes southern Africa. The Dubai sea section follows the Hormuz passage to Jebel Ali. See `maritime-generation.json` for passage restrictions and generation output.

Corners near land are protected from smoothing. Coastline tests sample the displayed paths against the same Natural Earth land geometry, with bounded exceptions for terminal approaches and generalized canal/Gibraltar geometry. These tests check visual geographic consistency, not navigational clearance or operational safety.

Sources:

- https://github.com/genthalili/searoute-py — Apache 2.0; license included in `dist/assets/SeaRoute-LICENSE.txt`.
- https://github.com/eurostat/searoute — underlying maritime-network lineage.
- https://www.suezcanal.gov.eg/English/About/SuezCanal/Pages/AboutSuezCanal.aspx — canal geography.

## Terminals

Terminal coordinates use the SMDG Terminal Code List. The shipment city and the specific transport endpoint are intentionally separate.

| Location | Terminal | Longitude | Latitude |
| --- | --- | ---: | ---: |
| Shanghai | Yangshan / SGICT | 122.075 | 30.613333 |
| Singapore | Pasir Panjang / PSAPPT | 103.776667 | 1.283333 |
| Dubai | Jebel Ali CT1 / DPWJA | 55.066111 | 24.992222 |
| Rotterdam, sea | World Gateway / RWG | 3.991111 | 51.953333 |
| Rotterdam, inland | Rail Service Center / RSC | 4.428333 | 51.872222 |

Source: https://github.com/smdg-org/Terminal-Code-List . The named terminal does not imply a booked service or confirmed capacity.

## Rail, air and road boundaries

The rail line follows cached OpenStreetMap railway geometry from OpenRailRouting, acquired 6 November 2026. The route uses conventional railway class RAIL, excludes known speeds of 250 km/h or higher, and retains unknown-speed edges. Shanghai–Kuryk and Alat–Rotterdam are continuous rail components. Kuryk–Alat is a separate dashed, indicative ferry link. Beyneu goes directly to Kuryk rather than detouring into Aktau port. Gauge transfers, freight permissions and service availability are not certified by the routing engine.

Both road transfers use cached OSRM driving-network geometry: Jebel Ali–DWC (28.398 km) and AMS–Rotterdam RSC (69.019 km). Terminal coordinates and snapped road endpoints differ by up to 504 m at DWC. These access connectors are dotted. This is driving-profile routing, not HGV clearance or verified private terminal access.

Air links connect PVG/DWC to AMS using dashed great-circle connections. They are not filed flight tracks. About this map optionally overlays eight observed segments from KL896 / PH-BKG / 4 November 2026, via ADSB.lol. It preserves coverage gaps and the missing PVG departure; the largest gap is 6 h 31 min. The historical passenger-flight example does not describe the synthetic cargo shipment or its emissions calculation. No verified recorded DWC–AMS track is available. Air scenarios assume cargo repacked into air-compatible units.

Original network geometry, acquisition notes, licenses and the observation fixture are available in `dist/assets/tracks/`; the simplified display geometry is in `dist/network-tracks.mjs`. Rail/road paths are not Bezier-smoothed away from the underlying infrastructure. Network and observation data use ODbL 1.0 with visible credit in About this map. No runtime routing-service dependency is introduced.

- https://routing.openrailrouting.org/
- https://project-osrm.org/
- https://www.openstreetmap.org/copyright
- https://www.adsb.lol/docs/open-data/historical
- https://globe.adsb.lol/globe_history/2026/11/04/traces/2d/trace_full_485e2d.json

## Base geography

Natural Earth 1:10m land, lakes, rivers, boundaries and labels are public-domain data, self-hosted and rendered as SVG geometry. Zoom is limited to 600%, appropriate to the regional dataset; this is not a street-level tile map. Country/city labels are selected by scale and collision constraints. Administrative boundaries reflect Natural Earth's dataset and are not an application policy statement.

- https://www.naturalearthdata.com/downloads/10m-physical-vectors/
- https://www.naturalearthdata.com/downloads/10m-cultural-vectors/
- https://www.naturalearthdata.com/about/terms-of-use/

Development generator: `scripts/build-geography.py <directory-of-Natural-Earth-GeoJSON>`, requiring `shapely` and `searoute`. Source GeoJSON filenames and tolerances are specified in that script. The shipped application has no Python or routing-service runtime dependency.
