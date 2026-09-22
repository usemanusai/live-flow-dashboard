# WebGL 3D Flow Stage — GOLD STANDARD recipe

> RULE ZERO requires visible FLOW / ENERGY / ROUTE / DIRECTION / PATH on every
> wire at every moment. This file is the calibrated three.js implementation
> that satisfies it. Extracted from the shipped reference build
> (`src/lib/lfd/scene3d.ts`), measured and browser-verified.
>
> Why gold standard: the reference video shows **3D animated lines connecting
> boxes, moving every millisecond** — the same class of effect as classic
> "neon tubes" WebGL backgrounds (e.g. threejs-components tubes cursor). The
> difference: here the tubes ARE the pipeline edges and the traveling energy
> IS the live data, so flow, energy, route and direction carry meaning.

## 0. Dependencies

```bash
bun add three          # >= 0.160 (uses three/addons exports map)
bun add -d @types/three
```

Imports used:

```ts
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
```

All three.js code lives in a plain-TS factory (`createFlowStage(container)`)
called from a `'use client'` React wrapper inside `useEffect` — never at
module top level (SSR safety). The React wrapper subscribes to the tick store
via `onTick` (zero re-renders for per-frame work) and forwards:

- `request` event with `path: string[]` -> `stage.traceRoute(path)`
- `node-state` hold -> `stage.setHold(id, bool)`
- `node-stat` -> `stage.setNodeMeta(id, text)` (live label meta line)

## 1. Scene setup (measured values)

| Setting | Value |
|---|---|
| Background / fog | `0x101216`, `FogExp2(0x101216, 0.016)` |
| Camera | PerspectiveCamera fov 40; base `(0, 9.0, 26)` scaled by `pull = max(1, 1.5/aspect)` on narrow screens; `lookAt(0, 0.55, 0)` |
| Cursor parallax | camera target `x += nx*2.6`, `y -= ny*1.5`, lerp `min(1, dt*3)` |
| Lights | Hemisphere `(0xbfd4ff, 0x0a0c12, 1.0)` + Directional `(0xffffff, 1.4)` at `(6,14,9)` |
| Grid | `GridHelper(84, 46, 0x2c3040, 0x191c26)` at `y=-2.15`, opacity 0.5 |
| Bloom | `UnrealBloomPass(res/2, 0.85, 0.5, 0.16)` — half-res buffer |
| Tone mapping | `ACESFilmicToneMapping`, exposure 1.08 |
| DPR cap | `min(devicePixelRatio, 1.5)`; adaptive degrade to 0.8 when fps < 30 for 2s |
| Dust | 240 additive points, drift up 0.16 u/s, wrap |
| Reduced motion | multiply all speeds by 0.45; disable parallax/dust drift — never freeze |

## 2. Layout: 9 tiers in 3D

Tiers run along X; multi-node tiers stack VERTICALLY (column fans, like the
reference video) with a z-offset for parallax. **These constants are
calibrated for ZERO label-chip collisions (SKILL.md §0.7) — do not shrink
them back:**

```
TIER_GAP  = 5.9          // horizontal tier spacing (4.7 was too tight)
STACK_GAP = 2.75         // vertical stack (2.15 made chips overlap boxes)
STACK_Z   = 1.35         // z parallax between stacked boxes

x(tier) = (tier - 4) * TIER_GAP
zArc    = -|tier - 4| * 0.6                 // ends pushed back
y(i)    = (i - (n-1)/2) * STACK_GAP
z(i)    = zArc + (i - (n-1)/2) * STACK_Z
```

Node box: `BoxGeometry(1.75, 1.05, 1.15)`, `MeshStandardMaterial` color
`0x0e1118`, metalness 0.4, roughness 0.4, emissive = kindColor x 0.22.
Plus `EdgesGeometry` rim lines (kind color, opacity 0.75-1.0) and an additive
glow sprite behind (opacity 0.28; io nodes 0.15 + smaller scale — io gray
blows out white under bloom otherwise).

**Labels: ONE-LINE backed chips (CSS2DObject)** — `[TAG] title` in a single
row on a dark chip (`rgba(10,12,18,0.8)` bg, 1px kind-tinted border, radius
4px; tag 9.5px bold, title 10.5px, padding 2x7px). NEVER 3-line floating
text — it collides with stacked boxes above. Chip position: `y + 0.95` in
world space; a few wide chips sit one lane higher so horizontal neighbors
never share a line:

```ts
// per-node world-space dy overrides (chip lanes)
const CHIP_DY: Record<string, number> = { state: 1.9, mid: 1.8, 't-browser': 1.8 };
label.position.set(pos.x, pos.y + (CHIP_DY[spec.id] ?? 0.95), pos.z);
```

Label density modes on the CSS2D root element (`setLabels` API): `all` =
chips as above, `min` = tag-only chips (title hidden), `off` = labels +
tier banners hidden. The live `meta` line shows ONLY while the chip is
hovered (`.hot`), acting as an inline micro-readout. Tier banners
(`T0 · INPUT` …) live at `y=4.75`, above the tallest stack + its chip.
`pointer-events: none` on the whole label layer.

**Camera framing must fit the LABEL span, not just the boxes** — at zoom
100% every chip is inside the frame (nothing cropped, nothing overlapped
by the viewport edge):

```ts
const halfW = 4 * TIER_GAP + 3.4;                     // outer tier + chip margin
const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
baseZ = Math.min(64, Math.max(24, halfW / (t * aspect)));  // clamp for extreme aspect
baseY = baseZ * 0.3 + 1.2;
```

## 3. Wires: swaying neon tubes + energy-band shader

Each edge = `CatmullRomCurve3([a, c1, mid, c2, b])` anchored at box faces
(`a = src.pos + dir*0.95`, `b = tgt.pos - dir*0.95`), lifted by
`0.55 + min(2, len*0.1) + hash*0.7`, mid z-jitter `(hash-0.5)*1.6` so parallel
fan edges never overlap. Tube: `TubeGeometry(curve, 64, 0.052, 5)` (64x5 is plenty under bloom and
measurably cheaper than 84x6).

**The tube sways** (vertex shader) with ends anchored:

```glsl
// vertex
uniform float uTime; uniform float uSway; uniform float uPhase;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  float env = sin(uv.x * 3.14159265);            // zero at both ends
  p.y += sin(uv.x * 6.0 + uTime * 1.4 + uPhase) * uSway * env;
  p.z += cos(uv.x * 5.0 - uTime * 1.1 + uPhase) * uSway * 0.7 * env;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
```

**Energy bands march source->target** (fragment shader). `TubeGeometry` uv.x
is arc-length param, so the SAME `t` drives orbs on the CPU (§4) — they ride
the swaying tube exactly:

```glsl
// fragment
uniform float uTime, uSpeed, uDensity, uLoad, uHover;
uniform vec3 uColor, uHot;
varying vec2 vUv;
void main() {
  float band  = fract(vUv.x * uDensity - uTime * uSpeed);   // marching
  float pulse = pow(smoothstep(0.0,0.5,band) * smoothstep(1.0,0.5,band), 2.0);
  float base  = 0.16 + uLoad * 0.30 + uHover * 0.25;
  vec3 col = uColor * (base + pulse * (0.55 + uLoad * 1.1));
  col += uHot * pow(pulse, 3.0) * (0.30 + uLoad * 0.7 + uHover * 0.4);
  gl_FragColor = vec4(col, 0.36 + pulse * 0.50 + uLoad * 0.16);
}
```

Material: `transparent: true, blending: AdditiveBlending, depthWrite: false`.
Per-edge uniforms: `uDensity = max(4, round(len*1.15))`,
`uSpeed = 0.55 + heat*2.6` (heat = EMA of live traffic, §5),
`uSway = 0.10..0.18`, `uPhase = hash*2π`, `uColor` = source kind color lerp
white 0.3, `uHot` = white.

Sway replication on CPU (orbs/comets must match the shader bit-for-bit):

```ts
function swayOffset(t, time, sway, phase, out) {
  const env = Math.sin(t * Math.PI);
  out.set(0,
    Math.sin(t * 6.0 + time * 1.4 + phase) * sway * env,
    Math.cos(t * 5.0 - time * 1.1 + phase) * sway * 0.7 * env);
}
// position = curve.getPointAt(t) + swayOffset(t)
```

## 4. Ambient orbs (the "never dead" guarantee)

Per edge a pool of 6 orb pairs (small sphere r=0.055 + additive glow sprite).
`active = 2 + round(heat * 3.9)`; inactive are hidden. Advance:
`t += dt * (1.6 + heat*4.4 + jit*0.3) / curveLen`, wrap at 1 — always forward
(source->target = direction). Color = source kind color lerp white 0.45.
Baseline heat floor per edge (0.22-0.55 by graph position) means a cold graph
STILL flows — the event-starvation test passes by construction.

## 4.5 Numeric safety (rAF-loop survival — iron rules)

A live-flow loop runs `getPointAt` thousands of times per second; ONE bad
parameter kills the whole dashboard with
`TypeError: can't access property "x", p1 is undefined`
(three.js `CatmullRomCurve3.getPoint` does `points[intPoint % l]` — a negative
or NaN `t` makes that index undefined, while `p0` stays safe because it is
extrapolated, so `p1` is always the first crash). Three failure paths, all
real: (1) the first rAF timestamp can be slightly EARLIER than a
`performance.now()` captured at construction (vsync race) -> negative dt;
(2) JS `% 1` keeps the sign, so a negative increment wraps `t` to a NEGATIVE
value instead of [0,1); (3) NaN poisons `t` permanently because `NaN % 1` is
NaN. Mandatory guards, all cheap:

```ts
// 1. dt: clamp AND NaN-reseed every frame
const raw = (now - last) / 1000;
const dt = Number.isFinite(raw) ? clamp(raw, 0, 0.05) : 0.016;

// 2. advance t with floor-wrap (always lands in [0,1), sign-safe) + reseed
const nt = o.t + dt * spd * (0.85 + jit * 0.3);
o.t = Number.isFinite(nt) ? nt - Math.floor(nt) : (k + 0.5) / poolSize;

// 3. never call curve.getPointAt raw — clamp u, verify output, fallback lerp
function edgePoint(e, t, out) {
  const u = Number.isFinite(t) ? clamp(t, 0, 1) : 0;
  e.curve.getPointAt(u, out);
  if (!Number.isFinite(out.x + out.y + out.z)) out.copy(e.from.pos).lerp(e.to.pos, u);
  return out;
}

// 4. build-time validation: skip edges with non-finite control points,
//    non-finite or tiny length; sanitize any accumulated scalar once/frame
//    (e.g. `if (!Number.isFinite(heat)) heat = base;`)
```

QA: after ANY fix, hard-restart the browser (cached chunks lie), fresh-load
x2, exercise pause/resume + route clicks, then require ZERO page-error
events — an errors log from before a reload shows stale stacks.

## 5. Route comets (visible ROUTE on real events)

On every `request` event: white comet (sphere r=0.085 + glow sprite 0.95 +
6 fading ghost sprites sampled from a 12-position trail ring) that walks the
event's `path` array hop-by-hop: per edge `t += dt*speed/len`
(speed 6.5-9 u/s), on hop arrival `flash(target, 1)` + edge heat +0.3.
A `gate-blocked` hop truncates the route at the gate and fires a 9-sprite red
burst (`spawnBurst(pos, danger)`). Cap 14 comets (recycle oldest).
`flash` drives: emissive intensity 1+6f, scale 1+0.06f, rim opacity,
label `.run` class — the node visibly "blinks" as traffic lands.

## 6. Interaction (threejs-components integration)

- **Hover**: raycast node boxes; tooltip div (projected position) shows spec
  rows + live hit count; connected edges get `uHover` boost; label brightens.
- **Click node**: re-pulse a synthetic route through it (instant feedback).
- **Click empty space**: cycle curated palettes (JEV/NEON/ION/EMBER) —
  updates tube uniforms, orb colors, node rims/emissives, label `--k` vars
  AND the page CSS custom properties (`--lfd-pink/blue/green/gold`), so the
  entire dashboard (header accents, footer bars) re-themes with one click.
- **Drag = orbit** (mandatory, §0.7): pointerdown starts a drag; `yaw -=
  dx*0.0042`, `pitch` clamped to [-0.06, 0.5]; a move >5px sets a
  `suppressClick` flag so an orbit never triggers the click action. Cursor
  is `grab`/`grabbing`.
- **Wheel = zoom** (mandatory): `zoom = clamp(zoom * exp(deltaY*0.0011),
  0.45, 2.1)`; camera radius = `baseZ * zoom`; listener registered with
  `{ passive: false }` and `preventDefault()`.
- **Pause = freeze FLOW, not the camera** (mandatory): a `paused` flag zeroes
  the motion `dt` (tubes/orbs/comets/bob/dust) while the render loop, camera
  easing and the control bar stay live — the operator can orbit/zoom a held
  graph and data panels keep updating.
- **`pointerleave` clears hover** (mandatory): leaving the canvas removes
  the `.hot` class, zeroes `uHover` on touching edges and hides the tooltip —
  a tooltip stuck open after the pointer leaves is a QA FAIL.
- **Control bar (React overlay, always visible)** — PAUSE/RESUME, LOCK/UNLOCK
  blocks (§6.5), TAGS cycle (ALL/MIN/OFF), zoom − / live % / +, RESET (camera),
  LAYOUT (blocks), FOCUS, plus FPS + palette chips; hints strip bottom-left
  (`DRAG ORBIT · WHEEL ZOOM · CLICK NODE TRACE ROUTE · SPACE PAUSE · F FOCUS`,
  swaps to `DRAG BLOCK MOVE · DRAG SPACE ORBIT` while unlocked). Keyboard:
  Space/U/L/R/+/−/F/Esc (ignore keystrokes from inputs/textareas).
- **Stage API** (called from React; zero per-frame re-renders):
  `traceRoute`, `setHold`, `setNodeMeta`, `cyclePalette`, `zoomIn`,
  `zoomOut`, `getZoomPct`, `resetView`, `setPaused`, `setDragMode`,
  `getDragMode`, `resetLayout`, `setLabels`, `getLabelMode`,
  `getPaletteName`, `dispose`.

## 6.5 Draggable node blocks + lock/unlock (mandatory — SKILL.md §0.8)

**State:** `dragEnabled` (LOCKED default), `dragNode`, a `THREE.Plane`, a
grab-offset vector, and per-node `home` position stored at build time.

**pointerdown (unlocked):** raycast the boxes FIRST — a hit beats orbit:

```ts
if (dragEnabled) {
  const n = pick(ev.clientX, ev.clientY);
  if (n) {
    dragNode = n;
    camera.getWorldDirection(camDir);
    // drag plane = camera-facing plane through the block -> mouse moves
    // the block 1:1 on screen; keep the grab offset so it never snaps
    dragPlane.setFromNormalAndCoplanarPoint(camDir, n.pos);
    ray.setFromCamera(ndcFrom(ev), camera);
    if (ray.ray.intersectPlane(dragPlane, hit)) dragOff.copy(hit).sub(n.pos);
  }
}
// always: setPointerCapture(ev.pointerId) so drags survive leaving the canvas
```

**pointermove (dragging a block):** intersect the ray with the plane,
apply the offset, clamp to bounds, move the node, mark its edges dirty:

```ts
if (ray.ray.intersectPlane(dragPlane, hit)) {
  hit.sub(dragOff);
  hit.x = clamp(hit.x, -4 * TIER_GAP - 4, 4 * TIER_GAP + 4); // bounds:
  hit.y = clamp(hit.y, -7.5, 7.5);                           // a block can
  hit.z = clamp(hit.z, -9, 9);                               // never fly off
  if (Number.isFinite(hit.x + hit.y + hit.z)) {
    dragNode.pos.copy(hit);
    for (const e of edges)
      if (e.from === dragNode || e.to === dragNode) dirtyEdges.add(e);
  }
}
return; // NO orbit while a block moves
```

**tick — dirty-set rebuild (once per frame max, runs even when paused —
dragging is a USER action, not flow time):**

```ts
if (dirtyEdges.size) for (const e of [...dirtyEdges]) rebuildEdge(e);

function rebuildEdge(e) {
  dirtyEdges.delete(e);
  const curve = computeEdgeCurve(e.from, e.to, e.idx); // SAME math as build
  if (!curve) return;                                  // degenerate -> keep old
  const len = curve.getLength();
  if (!Number.isFinite(len) || len < 0.2) return;
  e.curve = curve; e.len = len;
  e.density = Math.max(4, Math.round(len * 1.15));
  e.mat.uniforms.uDensity.value = e.density;
  const old = e.tube.geometry;
  e.tube.geometry = new THREE.TubeGeometry(curve, 64, 0.052, 5);
  old.dispose();
}
```

Curve math must be SHARED between initial build and rebuilds (extract
`computeEdgeCurve(from, to, idx)`; the edge index keys the deterministic
lift/jitter so a rebuilt wire keeps its character). Orbs/comets ride the
new curve automatically because sampling goes through `e.curve`.

**Per-frame node sync (the drag only moves `n.pos`):**

```ts
n.body.position.set(n.pos.x,
  n.pos.y + Math.sin(T * 1.1 + n.pos.x * 0.7 + n.pos.y * 1.3) * 0.07, n.pos.z);
n.rim.position.copy(n.body.position);
n.glow.position.copy(n.body.position);
n.label.position.set(n.pos.x, n.pos.y + (CHIP_DY[n.id] ?? 0.95), n.pos.z);
```

**Lock/unlock + reset:** `setDragMode(on)` (lock also drops any active
drag), `resetLayout()` copies every `home` back into `pos` and marks ALL
edges dirty. React hosts a state-labeled LOCKED/UNLOCKED button (icon:
lock/unlock, highlighted unlocked) + a LAYOUT button; `U` toggles. Cursor:
`move` over blocks when unlocked, `grabbing` during drag, `pointer` over
blocks when locked, `grab` on empty space.

**PRECISION MODE (mandatory):** while `dragEnabled`, cursor-parallax is
OFF (`const parallax = hasMouse && !reduced && !dragging && !dragEnabled`).
A parallax-drifting camera makes the target glide away from a stationary
cursor and precise grabbing impossible — this was a REAL bug in the
reference build: the pick missed at pointerdown and the drag became a huge
orbit.

**QA micro-tests:** drag test (block + wires move, camera static, zero
errors), lock test (drag = orbit, blocks stay), layout-reset test,
click-vs-drag test (<= 5px click still traces a route).

## 7. Performance (measured)

- Real GPU: 60fps @1440x900 (28 tubes x 64 segments, 168 orb meshes, bloom
  at 40% resolution, DPR cap 1.25 — all trivial for hardware GL).
- Headless / software GL (SwiftShader): ~20fps -> the adaptive degrade kicks
  in after 2s: `renderer.setPixelRatio(0.8)` + `composer.setPixelRatio(0.8)`
  + bloom buffer to 30% — resolution drops, MOTION DOES NOT. (The ~20fps
  number is a sandbox artifact, NOT the build's ceiling; do not chase it by
  removing flow systems.)
- NEVER put `backdrop-filter` on CSS2D label chips — 15 blurred elements
  over a WebGL canvas measurably drain the compositor. Solid translucent
  chip backgrounds read the same.
- Dispose discipline: cancel rAF, disconnect ResizeObserver, remove listeners,
  `traverse().dispose()` geometries/materials, `renderer.dispose()`, clear
  container. React StrictMode double-mount safe (wrapper effect cleanup).
- Pause on `document.hidden`; skip work but keep the rAF alive.

## 8. QA hooks

- Screenshot diff proof: two shots 1.3s apart -> pixels with channel delta >70
  inside the wired corridor, counted per VERTICAL tier column (a horizontal
  9-tier flow must be alive end-to-end). Measured on this build: **5.3% of
  corridor pixels, 10/10 columns alive**. Near-zero or dead columns = FAIL.
- Event-starvation proof: ambient orbs + shader bands keep moving with the
  SSE stream disconnected (baseline heat floor).
- Overlap scan: default view screenshot -> no two chips intersect, none
  cropped by the viewport edge (§0.7).
- Control sweep: click every control (pause/tags/zoom/reset/focus) -> a
  visible state change each time; hover tooltip closes on pointer leave.
- FPS chip doubles as a live perf probe during QA.
