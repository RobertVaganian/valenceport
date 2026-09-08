"""Build self-hosted vector geography and sea-network corridors (development only).
Requires shapely and searoute. Inputs: Natural Earth 1:10m GeoJSON files.
"""
import argparse,json,pathlib,importlib.metadata
from shapely.geometry import shape,box,Point
from shapely.ops import unary_union
import searoute as sr
parser=argparse.ArgumentParser();parser.add_argument('data',type=pathlib.Path);args=parser.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];region=box(-25,-45,145,70)
def features(name):return json.loads((args.data/(name+'.geojson')).read_text())['features']
def project(p):return ((p[0]+25)/170*1000,(70-p[1])/115*610)
def line(coords,close=False):return 'M'+'L'.join(f'{x:.3f},{y:.3f}' for x,y in map(project,coords))+('Z' if close else '')
def path(g):
 if g.is_empty:return ''
 if g.geom_type=='Polygon':return line(g.exterior.coords,True)+''.join(line(r.coords,True) for r in g.interiors)
 if g.geom_type=='LineString':return line(g.coords)
 if hasattr(g,'geoms'):return ''.join(path(x) for x in g.geoms)
 return ''
parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 610"><title>Natural Earth 1:10m geography, public domain</title>']
for name,key,tolerance in [('ne_10m_land','land',.008),('ne_10m_lakes','lakes',.01),('ne_10m_admin_0_boundary_lines_land','borders',.01),('ne_10m_rivers_lake_centerlines','rivers',.015)]:
 lines=[]
 for f in features(name):
  g=shape(f['geometry'])
  if not g.intersects(region):continue
  if key=='rivers' and f['properties'].get('scalerank',10)>6:continue
  g=g.intersection(region).simplify(tolerance,preserve_topology=True)
  if key=='lakes' and g.area<.03:continue
  lines.append(path(g))
 markup=f'<g id="{key}"><path d="'+''.join(lines)+'" vector-effect="non-scaling-stroke" fill-rule="evenodd"/></g>'
 parts.append(markup)
 if key=='land':(root/'dist/assets/land.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 610">'+markup+'</svg>')
parts.append('</svg>');(root/'dist/assets/geography.svg').write_text(''.join(parts))
labels={};cities=[]
for f in features('ne_10m_admin_0_label_points'):
 p=f['properties'];name=p.get('sr_subunit');rank=p.get('scalerank',6)
 if name and region.contains(shape(f['geometry'])) and (name not in labels or rank<labels[name]['rank']):labels[name]={'name':name,'point':[round(x,3) for x in project(f['geometry']['coordinates'])],'rank':rank}
for f in features('ne_10m_populated_places_simple'):
 p=f['properties'];rank=p.get('scalerank',10)
 if rank<=4 and region.contains(shape(f['geometry'])):cities.append({'name':p['name'],'point':[round(x,3) for x in project(f['geometry']['coordinates'])],'rank':rank})
(root/'dist/geographic-labels.mjs').write_text('// Natural Earth 1:10m labels. Public domain.\nexport const COUNTRIES='+json.dumps(list(labels.values()),separators=(',',':'))+';\nexport const CITIES='+json.dumps(cities,separators=(',',':'))+';\n')
land=unary_union([shape(f['geometry']) for f in features('ne_10m_land')]);paths={};provenance={}
origin=[122.075,30.613333];singapore=[103.776667,1.283333];rotterdam=[3.991111,51.953333];jebel=[55.066111,24.992222]
def sea(a,b,restrictions):
 r=sr.searoute(a,b,append_orig_dest=True,restrictions=restrictions,return_passages=True);coords=[]
 for p in r['geometry']['coordinates']:
  p=[round(x,6) for x in p]
  if not coords or p!=coords[-1]:coords.append(p)
 return coords,r['properties']
first,firstProps=sea(origin,singapore,['northwest','sunda'])
for key,end,rest in [('suez',rotterdam,['northwest','panama','sunda']),('cape',rotterdam,['northwest','panama','suez','sunda']),('seaair',jebel,['northwest','panama','suez','sunda'])]:
 second,props=sea(singapore,end,rest);coords=first+second[1:];protected=[i for i,p in enumerate(coords) if land.distance(Point(p))<.35]
 paths[key]={'points':coords,'protected':protected};provenance[key]={'generator':'searoute '+importlib.metadata.version('searoute'),'restrictions':rest,'passages':props.get('traversed_passages',[]),'seaKm':round(firstProps['length']+props['length']),'points':len(coords)}
(root/'dist/maritime-data.mjs').write_text('// SeaRoute maritime-network geometry. See docs/corridor-provenance.md.\nexport const MARITIME_DATA='+json.dumps(paths,separators=(',',':'))+';\n')
(root/'docs/maritime-generation.json').write_text(json.dumps(provenance,indent=2)+'\n')
print('Built vector geography and network-routed sea corridors',flush=True)
