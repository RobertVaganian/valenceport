"""Build the share card from the shipped font outlines and actual route geometry.
Development-only dependencies: fontTools, brotli, cairosvg.
"""
from pathlib import Path
import json, subprocess, xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import cairosvg
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'dist/assets'
def face(name,weight,width):
    f=TTFont(ASSETS/'fonts'/f'{name}.woff2')
    axes={a.axisTag for a in f['fvar'].axes};return instantiateVariableFont(f,{k:v for k,v in {'wght':weight,'wdth':width}.items() if k in axes},inplace=False)
ui=face('ibmplexsans',400,100); display=face('archivo',550,80); brand=face('archivo',600,100)
def text(value,x,y,size,font,color):
    glyphs=font.getGlyphSet(); cmap=font.getBestCmap(); scale=size/font['head'].unitsPerEm; pen=SVGPathPen(glyphs); cursor=0
    for c in value:
        name=cmap.get(ord(c),'space'); g=glyphs[name]
        g.draw(TransformPen(pen,(scale,0,0,-scale,x+cursor*scale,y)))
        cursor+=g.width
    return f'<path d="{pen.getCommands()}" fill="{color}"/>'
paths=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {ROUTES} from './dist/model.mjs'; import {roundedRoutePath} from './dist/route-geometry.mjs'; process.stdout.write(JSON.stringify(Object.fromEntries(['suez','cape'].map(id=>[id,roundedRoutePath(ROUTES.find(r=>r.id===id))]))));"],cwd=ROOT))
root=ET.parse(ASSETS/'geography.svg').getroot(); land=next(e for e in root if e.attrib.get('id')=='land'); land_xml=ET.tostring(land,encoding='unicode')
mark=(ASSETS/'mark.svg').read_text();mark=mark[mark.index('>')+1:mark.rfind('</svg>')]
s=['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f5f1e9"/>',f'<g transform="translate(52 40)">{mark}</g>',text('ValencePort',104,69,28,brand,'#2c3832'),text('PRODUCT DESIGN CONCEPT',885,65,12,ui,'#676b60'),text('FREIGHT SCENARIO PLANNING',52,159,13,ui,'#676b60'),text('A clearer route',52,256,77,display,'#2c3832'),text('through the',52,334,77,display,'#2c3832'),text('trade-offs.',52,412,77,display,'#435f56'),text('Compare routes. Test assumptions.',54,465,21,ui,'#676b60'),text('Keep the reason behind the plan.',54,496,21,ui,'#676b60')]
s+=['<defs><clipPath id="atlas"><rect x="602" y="156" width="546" height="333" rx="9"/></clipPath></defs><g clip-path="url(#atlas)"><rect x="602" y="156" width="546" height="333" fill="#edf1ed"/><g transform="translate(602 156) scale(.546)" fill="#dddccc" stroke="#a8b29c" stroke-width=".55">',land_xml,f'<path d="{paths["cape"]}" fill="none" stroke="#957b7e" stroke-width="3" stroke-dasharray="10 9"/><path d="{paths["suez"]}" fill="none" stroke="#edf1ed" stroke-width="10"/><path d="{paths["suez"]}" fill="none" stroke="#3c665c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>','</g></g><rect x="602" y="156" width="546" height="333" rx="9" fill="none" stroke="#bec7b8"/>',text('SHANGHAI',1044,283,12,ui,'#2c3832'),text('ROTTERDAM',626,205,12,ui,'#2c3832'),text('Six corridors. Three constraints. One decision.',605,524,17,ui,'#676b60'),'<path d="M52 556H1148" stroke="#dfdfd2"/>',text('ROBERT VAGANIAN',52,594,12,ui,'#676b60'),text('Interactive prototype + case study',874,594,14,ui,'#2c3832'),'</svg>']
svg=''.join(s);(ASSETS/'social.svg').write_text(svg)
cairosvg.svg2png(bytestring=svg.encode(),write_to=str(ASSETS/'social.png'))
print('Built social.svg and social.png from current typography and routes.')
