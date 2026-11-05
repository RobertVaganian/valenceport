# Map geometry — acquired 6 November 2026

Rail: OpenRailRouting / OpenStreetMap (ODbL 1.0), network import 5 November 2026. Source https://routing.openrailrouting.org/route . Railway class RAIL only, known speeds >=250 and <999 excluded; unknown speeds retained. Beyneu–Kuryk goes directly to the ferry terminal. Two continuous rail components; Kuryk–Alat is a separate indicative ferry link. Not a carrier-certified freight itinerary; gauges, operating restrictions and availability need operator confirmation. See rail-acquisition.md for reproducible request and constraints. rail.geojson preserves the full returned vertices.

Road: OpenStreetMap via OSRM driving profile, https://router.project-osrm.org/route/v1/driving/ . ams_rsc.json and jebel_dwc.json preserve responses. 69.019 km and 28.398 km respectively. Access snaps differ from nominated terminal points by up to 504 m at DWC. Private terminal access is not verified. Car profile, not HGV clearance routing. Derived road data ODbL 1.0.

Air: KL896 / PH-BKG / 485e2d, 4 November 2026. Source https://globe.adsb.lol/globe_history/2026/11/04/traces/2d/trace_full_485e2d.json ; ODbL 1.0, https://www.adsb.lol/docs/open-data/historical . 2,901 observations, gaps over 60 s split into eight separate components. PVG departure missing; largest gap 6 h 31 min. No interpolation across missing observations. Historical passenger-flight example, not the planned cargo service or its emission model. DWC–AMS has no verified recorded trace. Dashed air links are great-circle connections only.

Display geometry uses Douglas–Peucker simplification <=0.00025 degree (road <=0.00003), without Bezier smoothing of rail/road observations. Original source geometry remains downloadable above. Airline/airport snaps are separate indicative connectors. No runtime routing API dependency.

Attribution: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright . Database license: https://opendatacommons.org/licenses/odbl/1-0/ . ADSB.lol observations © ADSB.lol contributors, same database license. Natural Earth base geography is public domain. No source confirms a booking or navigational clearance.
