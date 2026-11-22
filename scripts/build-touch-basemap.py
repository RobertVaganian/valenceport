"""Render the existing Natural Earth layers for fast touch-map compositing."""
from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory
from xml.etree import ElementTree as ET

from PIL import Image

ASSETS = Path(__file__).resolve().parents[1] / "dist/assets"
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)
layers = {group.get("id"): group for group in ET.parse(ASSETS / "geography-compact.svg").getroot() if group.get("id")}
palettes = {
    "light": ("#d3dfd5", "#edf3f4", "#91aa9c", "#9eafa4"),
    "dark": ("#2d483b", "#142b27", "#547263", "#537161"),
}

with TemporaryDirectory() as tmp:
    svg, png = Path(tmp) / "map.svg", Path(tmp) / "map.png"
    for theme, (land, water, coast, border) in palettes.items():
        styles = {
            "land": {"fill": land, "stroke": coast, "stroke-width": ".65"},
            "lakes": {"fill": water, "stroke": coast, "stroke-width": ".4"},
            "rivers": {"fill": "none", "stroke": water, "stroke-width": ".75", "opacity": ".8"},
            "borders": {"fill": "none", "stroke": border, "stroke-width": ".55", "opacity": ".8"},
        }
        for detail, names in (("base", ("land", "lakes")), ("detail", ("rivers", "borders"))):
            root = ET.Element(f"{{{NS}}}svg", viewBox="0 0 1000 610", width="1000", height="610")
            for name in names:
                layer = ET.SubElement(root, f"{{{NS}}}g", styles[name])
                layer.extend(layers[name])
            ET.ElementTree(root).write(svg, encoding="utf-8")
            run(["inkscape", str(svg), "--export-width=2000", f"--export-filename={png}"], check=True)
            with Image.open(png) as image:
                image.save(ASSETS / f"touch-map-{theme}-{detail}.webp", lossless=True, method=6)
