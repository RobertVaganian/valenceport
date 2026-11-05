# Integrated routing variant

The shipped rail.geojson replaces the Aktau port spur described below with the direct Beyneu–Kuryk route. It contains 22 rail features; Kuryk–Alat remains a separate indicative ferry connection. All other acquisition parameters below are retained.

# Candidate Middle Corridor railway geometry acquired 2026-11-06

Usable output: `corridor-track-segments.geojson`, 23 separate GeoJSON LineString features, 13,365.343 km of OSM-derived rail geometry. This follows Shanghai → Xi'an → Lanzhou → Urumqi → Khorgos → Altynkol → Almaty-1 → Shymkent → Kyzylorda → Beyneu → Aktau port → Kuryk rail-ferry berth; then Alat ferry terminal → Tbilisi → Akhalkalaki international terminal → Kars → Erzurum → Sivas → Ankara → Halkali/Istanbul → Sofia → Belgrade → Budapest → Vienna → Rotterdam RSC.

**This is geographically reliable candidate track geometry, not an operator-certified freight itinerary.** No rail geometry is invented between disconnected endpoints. Every consecutive rail leg has exactly matching geometry endpoint coordinates. The only intentional gap is the Caspian crossing (Kuryk→Alat, approximately392 km geodesic): no sea line is included in the railway GeoJSON. The source map is OSM, not a railway infrastructure owner's authoritative routing registry.

`corridor-summary.json` records the actual request coordinates, snapped rail coordinates, snap distances, railway distance, straight-line distance, their ratio, vertices, source, and speed/class checks for each leg. `continuity-gaps.json` contains the endpoint continuity audit. `NAME.json` is the unchanged API response. `NAME-metadata.json` is the acquisition metadata. The old lowercase exploratory responses are not used; notably `almaty_shymkent_all.json` erroneously begins on subway tracks and must not be used.

## Primary source and reproducible request

Working source: https://routing.openrailrouting.org/route (POST JSON).
World coverage and metadata: https://routing.openrailrouting.org/info . Its 2026-11-06 response reports data_date2026-11-05T05:00:00Z and import_date2026-11-05T07:14:02Z; saved as `openrailrouting-info.json`.

Example request body:

```json
{
  "points": [[121.450,31.251],[108.952,34.286]],
  "profile": "all_tracks",
  "points_encoded": false,
  "instructions": false,
  "ch.disable": true,
  "custom_model": {
    "priority": [
      {"if":"max_speed >= 250 && max_speed < 999","multiply_by":"0"},
      {"if":"railway_class != RAIL","multiply_by":"0"}
    ]
  },
  "details": ["max_speed","railway_class","gauge"],
  "snap_preventions": []
}
```

OSM-known speeds250km/h and higher are excluded; missing speeds are retained. Critically, missing maxspeed is encoded internally as Infinity and appears as null in path details: a naive max_speed>=250 filter removes all unknown-speed tracks, breaking even Kazakhstan and eastern Turkey. The range guard avoids this trap. The engine does not expose OSM highspeed or railway:traffic_mode in its encoded values, so this cannot certify every track's freight permission. China results retain conventional mixed-traffic speeds up to206, Turkey max160, Europe max230. No returned feature has railway_class other than rail; this avoids metro/tram mistakes.

The frontend calls profile non_tgv "freight train120km/h", but its source profile only caps speed120 and does not prohibit highspeed tracks. Do not treat the name alone as evidence of freight compatibility.

Official implementation/docs:
- https://github.com/geofabrik/OpenRailRouting
- https://routing.openrailrouting.org/railway_routing/docs/
- https://www.geofabrik.de/projects/railway_routing/index.html
- https://raw.githubusercontent.com/geofabrik/OpenRailRouting/master/src/main/resources/com/graphhopper/custom_models/non_tgv.json
- https://routing.openrailrouting.org/maps/config.js (saved as `orr-public-config.js`)

## Use, caching, and attribution

The official Geofabrik release presentation explicitly identifies this as a public demo "For experimental use only, not for production": https://www.geofabrik.de/media/2024-07-19-openrailrouting_1.0.pdf (page9 / zero-index8). Use the saved geometry as reviewed static data; do not make this demo a production application's routing backend. Frontend configuration currently says terms:null; no additional output redistribution terms were found. Do not confuse this service with OpenRailwayMap's API/tile hosting, which has separate restrictions.

Engine source: Apache2.0 (saved ORR-LICENSE.txt), which does not replace the map-data license.
Underlying OSM data: ODbL1.0. Official source permits copying, adapting and redistribution with attribution and ODbL conditions: https://www.openstreetmap.org/copyright . Data-form distribution should name and link ODbL: https://opendatacommons.org/licenses/odbl/1-0/ . Present visible map credit “© OpenStreetMap contributors” linked to the copyright page, and credit OpenRailRouting for the computed geometry. This is reusable open map data, not private-only geography, but the hosted demonstration service is experimental.

## Endpoint corrections and alternatives

- Almaty uses Almaty-1/mainline junction [76.9477,43.3392], not city centre. The city-centre point nearest all_tracks snapped onto subway, caught by the rail-class audit.
- Khorgos station is [80.4543,44.15619], confirmed against primary OSM node6316474613; Altynkol is approximately[80.29525,44.16476], checked with OSM node4046956026. The Chinese/Kazakh border portion contains a gauge-transfer context; geometry continuity does not remove the operational break of gauge.
- Akhalkalaki uses the international freight transfer terminal [43.506,41.32778], not the older town station to its north.
- Aktau uses port rail station [51.22256,43.59956], about27m from snapped track.
- Kuryk uses actual mapped railway-ferry terminal node4925998066 [51.4425481,43.1625291], exactly on snapped track. Primary OSM JSON saved.
- Alat uses ferry terminal node7246450854 [49.4427897,39.9730288], approximately15m from snapped rail.
- RotterdamRSC [4.428333,51.872222] snaps1m to track.
- Via Aktau port then Kuryk creates an intentional port-spur/backtracking movement. Alternate direct Beyneu→Kuryk is480.874 km (`Beyneu_Kuryk.json`), versus420.538+97.346=517.884 km via Aktau port. Choose one operational port scenario rather than implying every container must visit both ports.
- All rail/geodesic ratios are1.07–1.68, except the deliberate Aktau-port→Kuryk movement1.88. Largest requested point-to-rail snap is893.7m at Erzurum; other notable snaps Xi'an639.5m, Kyzylorda740.2m, Halkali/Istanbul789.9m. These are explicit and do not create line connectors.

## railroute-ts update

Current source pipeline now carries highspeed metadata, unlike the previously downloaded package versions:
https://raw.githubusercontent.com/openfreightroutes/railroutes/main/network/build-network.py
It still keeps the giant component and filters region mainline ways, and no Turkey regional data package appears in the current tree. Existing China/CIS/Europe extracts therefore remain a weaker basis for this whole route than the successfully tested world OpenRailRouting API.
