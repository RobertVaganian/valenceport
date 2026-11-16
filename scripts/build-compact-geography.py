"""Build a compact display layer from the existing Natural Earth SVG.

Keeps route/network geometry untouched. Maximum line simplification error is
0.2 viewBox units (under one CSS pixel at 700 px width and the maximum 6x zoom).
Uses only Python's standard library; no source download is required.
"""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
TOLERANCE = .2


def simplify(points):
    if len(points) < 3:
        return points
    keep = {0, len(points) - 1}
    pending = [(0, len(points) - 1)]
    while pending:
        first, last = pending.pop()
        ax, ay = points[first]
        bx, by = points[last]
        dx, dy = bx - ax, by - ay
        squared = dx * dx + dy * dy
        farthest, error = first, TOLERANCE * TOLERANCE
        for i in range(first + 1, last):
            x, y = points[i]
            t = max(0, min(1, ((x - ax) * dx + (y - ay) * dy) / squared)) if squared else 0
            distance = (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2
            if distance > error:
                farthest, error = i, distance
        if farthest != first:
            keep.add(farthest)
            pending.extend([(first, farthest), (farthest, last)])
    result = [points[i] for i in sorted(keep)]
    # Do not collapse small closed island/lake rings into a degenerate path.
    return points if points[0] == points[-1] and len(result) < 4 else result


def build():
    source = ROOT / 'dist/assets/geography.svg'
    output = ROOT / 'dist/assets/geography-compact.svg'
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    tree = ET.parse(source)
    before = after = 0
    for path in tree.getroot().iter('{http://www.w3.org/2000/svg}path'):
        chunks = []
        for subpath in re.findall(r'M[^M]+', path.attrib['d']):
            assert re.fullmatch(r'[MLZ0-9.,\-]+', subpath), 'Unexpected SVG command'
            closed = subpath.endswith('Z')
            points = [tuple(map(float, pair.split(','))) for pair in re.findall(r'-?[\d.]+,-?[\d.]+', subpath)]
            before += len(points)
            reduced = simplify(points)
            after += len(reduced)
            number = lambda value: f'{value:.2f}'.rstrip('0').rstrip('.')
            chunks.append('M' + 'L'.join(f'{number(x)},{number(y)}' for x, y in reduced) + ('Z' if closed else ''))
        path.set('d', ''.join(chunks))
    tree.write(output, encoding='utf-8', xml_declaration=False)
    print(f'Geography: {source.stat().st_size:,} → {output.stat().st_size:,} bytes; {before:,} → {after:,} vertices. Routes unchanged.')


if __name__ == '__main__':
    build()
