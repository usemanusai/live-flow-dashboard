#!/usr/bin/env python3
"""Motion proof v2: diff two dashboard screenshots taken 1.3s apart.

Smarter than v1: measures motion inside the GRAPH CORRIDOR (where the DAG
actually lives) instead of the full-width zone with dead margins, and
requires motion present in EVERY tier-gap band of the 9-tier layout."""
from PIL import Image, ImageChops
import numpy as np
import sys

A = Image.open(sys.argv[1]).convert('RGB')
B = Image.open(sys.argv[2]).convert('RGB')
W, H = A.size
# graph corridor v3 — recalibrated for the CONTROL-ERA layout (SKILL.md §0.7):
# the 3D stage now spans nearly full width (T0..T8 label chips included) and
# sits between the header (~88px) and the telemetry strip (~560px). The wired
# band with travelling orbs + comets lives in the middle of that stage.
corridor = (int(W * 0.04), 150, int(W * 0.96), 560)

da, db = A.crop(corridor), B.crop(corridor)
diff = ImageChops.difference(da, db)
gray = np.asarray(diff, dtype=np.uint8).max(axis=2)

strong = (gray > 70)
total = gray.size
pct_strong = 100 * strong.sum() / total

# per-band coverage v3: the 3D stage is a HORIZONTAL left-to-right flow
# (9 tiers along X), so the meaningful coverage test is VERTICAL columns —
# every tier column must contain live motion (marching bands / orbs / comets).
# Column span = the tier span incl. one node-box margin each side.
x0, y0, x1, y1 = corridor
tier_span = (x0 + int(W * 0.06), x1 - int(W * 0.06))
cols = 10
cw = (tier_span[1] - tier_span[0]) // cols
bands = []
for b in range(cols):
    cx0 = tier_span[0] + b * cw
    col = strong[:, max(0, cx0 - x0):max(0, cx0 - x0) + cw]
    bands.append(int(col.sum()))
bands_ok = sum(1 for c in bands if c >= 15)

print(f"corridor: {corridor}")
print(f"tier columns: {tier_span}  col width: {cw}px")
print(f"strong motion (>70): {strong.sum():,}  ({pct_strong:.3f}%)")
print(f"column motion counts:  {bands}")
print(f"columns with motion:   {bands_ok}/10")

flow_ok = pct_strong > 0.5 and bands_ok >= 9
print(f"\nVERDICT: {'PASS — FLOWING' if flow_ok else 'FAIL — STATIC'}")
