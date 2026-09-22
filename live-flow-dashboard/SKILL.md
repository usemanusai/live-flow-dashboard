---
name: live-flow-dashboard
description: >
  Build or retrofit ANY web dashboard into a dark "mission-control live-flow"
  interface: a 9-tier pipeline DAG rendered as a 3D WebGL flow stage (three.js
  neon tubes with shader-driven energy bands, traveling orbs and route comets
  through bloom), or as a dense 2D canvas wire-orb fallback. Nodes are
  DRAGGABLE BLOCKS with a lock/unlock toggle (wires re-route live), the view
  has real controls (orbit, zoom, pause, label density, layout reset, focus
  mode), and six telemetry panels are fed by real WebSocket/SSE data.
  Animated flow on EVERY wire at EVERY moment is a non-negotiable RULE ZERO —
  static outputs fail QA; cramped, unreadable, or uncontrollable outputs fail
  QA. Written to be executed by ANY AI coding agent (Claude Code, Google
  Antigravity, ZCode, Codex, Cursor, Windsurf, ...): no hardcoded paths, no
  assumed tooling, retrofit-an-existing-project is the primary workflow.
  Use whenever the user mentions a live dashboard, real-time pipeline
  visualization, node-graph data flow, mission-control UI, HUD-style
  analytics, wants to "see the flow live", or references the
  JEV/router-and-gate/wire-orb aesthetic.
---

# Live Flow Dashboard

A complete design system + engineering workflow for building — and above all
**retrofitting into an existing project** — the **"JEV ENGINEERING // ROUTER
AND GATE"** live-flow dashboard: 3D neon tube wires connecting draggable node
blocks, six live telemetry panels, and a KPI header, on a near-black canvas.

Design tokens below are calibrated from the reference video by two
independent methods: (1) machine-vision chunk analysis (4 x 10s segments +
12-frame contact sheet), and (2) objective pixel sampling / median-cut palette
extraction on full-resolution frames. Trust these values before guessing.

---

## 0. HOW TO USE THIS SKILL — READ FIRST (applies to every AI coding agent)

This file is written to be **executed by any AI code developer**: Claude Code,
Google Antigravity, ZCode, Codex CLI, Cursor, Windsurf, Copilot Workspace, or
a human engineer. It assumes **nothing** about your tooling.

**The agent-neutrality contract:**

1. **No hardcoded paths anywhere in this skill.** Placeholders you will
   resolve yourself:
   - `<skill-folder>` — the folder containing this SKILL.md (find it with
     your own file-search tools; it travels with the prompt or repo).
   - `<project-root>` — the repository you are upgrading. Discover it by
     locating the primary manifest (`package.json`, `pyproject.toml`,
     `Cargo.toml`, `go.mod`, ...). NEVER invent an absolute path; if the
     project root or target page is ambiguous after a real search, ASK the
     user.
   - `<flow-stage-file>` — wherever the flow stage lives in the target
     codebase after Phase 6.
2. **No assumed commands.** Run the target project with ITS OWN scripts
   (`package.json` scripts, Makefile, task runner). If none exist, use the
   framework's standard dev command. Verify in a browser with WHATEVER
   tooling you have (built-in browser automation, Playwright/Puppeteer
   script, or explicitly ask the user to check) — an unverified build is a
   failed build.
3. **Framework mapping.** Examples cite Next.js + React + TypeScript +
   Tailwind because the calibrated reference build used them. Every rule
   maps 1:1 to Vue/Nuxt, SvelteKit, Angular, Solid, Remix, or plain JS:
   "component" = your framework's component; "CSS custom properties" work
   everywhere; three.js works everywhere; the 2D fallback is a single
   `<canvas>` in any framework. Keep the LAWS and the QA gates — adapt only
   the file organization to the project's existing idioms.
4. **Read order (do not skip):** this file top-to-bottom →
   `references/webgl-flow-stage.md` (3D gold standard + numeric safety +
   drag recipe) → `references/retrofit-workflow.md` (retrofit detail) →
   `references/live-data-recipes.md` (data wiring) →
   `references/visual-dna.md` (only when faithfulness is questioned).
5. **Never regress the host app.** Retrofit work must not break the
   existing pages, routes, tests, or build. Work incrementally; run the
   project's own lint/tests after each phase.

---

## 0.1 The Look in One Paragraph

Near-black charcoal canvas (`#121316`) with a faint grid. Center stage: a
9-tier pipeline DAG whose nodes are small dark blocks with color-coded
accents (pink = decide/gate, blue = LLM, green = worker, gold = tool,
gray = I/O). The blocks are connected by a dense, glowing orb of **3D neon
tubes** with energy pulses traveling along every wire — and the operator can
**drag the blocks around** (lock/unlock) while the wires re-route live. Top
bar: brand + subtitle + 6 live KPI counters + blinking red-pink LIVE dot.
Bottom: a 2x3 grid of telemetry panels (scrolling log, horizontal bar
ranking, giant number counter, verdict breakdown bars, fluctuating
histogram, layer status). Everything ticks, streams, and pulses continuously
— the page never stops moving.

---

## 0.5 RULE ZERO — THE FLOW IS THE PRODUCT (violating any line here = FAILED build)

The single most common failure mode is shipping a **static node diagram**: dark
cards connected by frozen bezier lines, plus a few occasional dots. THE USER
REJECTS THIS ON SIGHT. A build like that is a diagram, NOT a live-flow
dashboard. The reference moves EVERY MILLISECOND. An observer — from across
the room, at a glance, at thumbnail size — must instantly SEE:

> **FLOW · ENERGY · ROUTE · DIRECTION · PATH**

on every wire, at every moment. Hard law, in order of precedence:

1. **EVERY WIRE MOVES EVERY FRAME (mandatory)** — at 60fps, every single edge
   shows motion simultaneously: energy traveling source->target along the
   path AND motion on the wire body itself. An edge that is still for even
   ONE second while its tier reports traffic = FAIL.
2. **MOTION MAY NOT DEPEND ON EVENTS (mandatory)** — pulses that only fire
   when a request arrives leave the canvas visually DEAD between events.
   Every edge carries a baseline ambient flow ("heat" floor) that never
   stops, and real events ride ON TOP of it as brighter, faster comets.
3. **DIRECTION IS VISIBLE (mandatory)** — from a 200ms glance it must be
   obvious which way energy moves (source -> target). No symmetric shimmer,
   no opacity-only loops: motion must TRAVEL.
4. **DATA-DRIVEN MOTION (mandatory)** — a per-edge EMA of live traffic drives
   pulse speed, pulse count, band speed and brightness. Hot paths visibly
   swarm and glow; cold paths dim but NEVER freeze. Traffic shapes the
   picture.
5. **3D WEBGL STAGE = GOLD STANDARD (mandatory unless the target genuinely
   cannot run WebGL)** — the look is **3D animated neon tubes connecting 3D
   node blocks, glowing through bloom**. Build it with three.js:
   `TubeGeometry` wires driven by an energy-band shader, ambient orbs riding
   the curves, white-hot route comets, `UnrealBloomPass` glow, cursor
   parallax, click-to-recolor. This is the same class of effect as the
   classic "neon tubes" WebGL backgrounds — but the tubes ARE the pipeline
   edges and the pulses ARE the live data. Full calibrated recipe with code:
   **`<skill-folder>/references/webgl-flow-stage.md`** (includes the
   numeric-safety iron rules and the draggable-blocks recipe). A flat 2D
   diagram with a CSS glow is NOT this.
6. **2D CANVAS = FALLBACK MINIMUM BAR** — only when WebGL is unavailable.
   It must still implement ALL 10 systems listed below. A dashed SVG with a
   CSS shimmer is NOT a flow engine.
7. **REAL ROUTES ARE TRACED (mandatory)** — when a data event carries a
   multi-hop path, spawn a white-hot comet that travels the exact route
   hop-by-hop, flashing every node it passes (and a red burst when a gate
   rejects). The observer must literally watch WHERE a request goes.
8. **NODES ARE ALIVE (mandatory)** — blocks bob subtly, flash white on
   packet arrival, glow while running, dim on hold. Kind-tinted mono labels
   flash with their node.

**Iron tests (run ALL of them BEFORE calling it done):**
- **3-second still test**: any edge motionless for > 1s of wall time = FAIL.
- **Screenshot diff proof**: two screenshots ~1.3s apart; pixels with
  channel-delta > 70 inside the wired corridor must be substantial AND
  motion must appear in EVERY tier column (vertical bands across the tier
  span — a horizontal 9-tier flow must be alive end-to-end; reference 3D
  build measured 5.3% strong pixels, 10/10 columns). Near-zero delta or
  dead columns = FAIL — that is a static dashboard wearing a dark theme.
- **Event-starvation test**: stop the event stream for 5s — ambient flow
  must KEEP MOVING (baseline heat). A frozen graph = FAIL.
- **Glance test**: zoom to 30% — flow direction still readable = PASS.
- **Frame-rate sanity**: measured reference builds: 2D canvas 57-59fps,
  3D WebGL 60fps on real GPUs (headless software renderers are slower; ship
  an adaptive degrade path, never remove motion).

### 2D fallback minimum systems (WebGL unavailable only — ALL 10 mandatory)

1. **AMBIENT PARTICLE STREAMS (mandatory)** — every edge always carries a
   stream of flowing particles (source->target), tinted by the source node's
   kind color. Never zero. Population: 5-7 per cold edge, 6-8 on hub edges;
   +7 per unit of live load. Cap the field at ~900. Speed 70-120 px/s,
   scaled up with load.
2. **COMET TRAILS (mandatory)** — particles drawn as tapered streaks along
   the bezier tangent (head + tail sampled at `t` and `t - trail/len`),
   plus a wide low-alpha glow underlay. Direction readable from a 200ms
   glance.
3. **DASH CRAWL (mandatory)** — wire cores are dashed and `lineDashOffset`
   advances every frame. TWO parallax layers: fine dots `[2,6]` at ~34 px/s
   (alpha 0.52) + sparse beads `[3,16]` at ~14 px/s (alpha 0.2, 1.8px).
4. **DIRECTION CHEVRONS (mandatory)** — arrowheads every ~110px pointing
   downstream, with a traveling luminance wave
   (`sin(time*1.6 - t*5.2 + edge*1.3)`).
5. **ENERGY SWEEPS (mandatory)** — a bright white segment (9% of path
   length, alpha ~0.34) scans each edge continuously, phase-staggered per
   edge (`(time*0.14ms + i*0.618) % 1.7`).
6. **BURST PACKETS = VISIBLE ROUTE (mandatory)** — every real data event
   spawns a white-hot packet (r 2.4-2.6, glow, 30px trail, ~185 px/s) that
   travels hop-by-hop down the event's actual path; the edge under a packet
   brightens so the observer watches WHERE the request goes.
7. **ARRIVAL RIPPLES + NODE FLASH (mandatory)** — expanding ring at the
   target anchor (r 2->16, 460ms fade) AND the node flashes (CSS class,
   420ms white border/glow spike via a framework event, e.g.
   `window.dispatchEvent(new CustomEvent('lfd-arrive', {detail:{id}}))`).
8. **LOAD COUPLING (mandatory)** — per-edge EMA of live traffic (decay
   ~2.2s) drives core alpha (0.30 -> 0.64), dash speed, particle count and
   speed.
9. **PORT DOTS + CENTER VIGNETTE** — pulsing dots at every anchor + a soft
   radial center glow behind the orb.
10. **NO DEAD STRAIGHT LINES** — spine edges get an S-curve wiggle: offset
    control points horizontally (±16-26px by edge parity).

Iron tests: the RULE ZERO iron tests above apply to the 2D fallback too —
all of them, no exceptions.

2D performance (measured, 57-59fps @1440x900): ONE canvas + ONE rAF; cap
ambient particles (~900) and bursts (~90); **never use `shadowBlur` in the
hot loop** — pre-render a 32px radial glow sprite once and `drawImage` it
per packet head (~50x cheaper); **batch ambient streaks** into one path per
(kind color x size bucket) and stroke twice; cap DPR at 1.5. No per-edge DOM.

---

## 0.7 READABILITY & USER CONTROL (violating any line here = FAILED build)

The second most common failure mode (after static wires) is shipping a
**cramped, unreadable wall of tiny overlapping text with zero affordances**.
The user rejects this on sight: "how am I supposed to read this when it is
all put so tight together with 0 control?" Hard law:

1. **ZERO OVERLAPPING LABELS (mandatory)** — every node label fully legible
   in the default view. In 3D stages use ONE-LINE backed chips (tag + title
   in a single row on a dark chip with a kind-colored border); never 3-line
   floating text. Calibrate world spacing so chips can never collide:
   horizontal tier gap >= ~1.3x the widest chip; vertically stacked nodes
   >= ~2.5 box-heights apart; horizontally adjacent chips that would share
   a line get a second LANE (per-node world-space dy offset). Reference
   constants (units = box widths): TIER_GAP 5.9, STACK_GAP 2.75, STACK_Z
   1.35, chip lanes +1.8/+1.9.
2. **FIT THE LABELS, NOT JUST THE BOXES (mandatory)** — the default camera
   frames the FULL label span (outermost tier + chip margin), so nothing is
   cropped at zoom 100%: `z = halfW / (tan(fov/2) * aspect)`.
3. **TYPE MINIMUMS (mandatory @1x)** — node chips: tag 9.5px, title 10.5px;
   KPI labels 10px / KPI values >= 17px; panel body text >= 10px; captions
   >= 9px. No 8px body text anywhere. Values are tabular-nums; every text
   sits on a surface with enough contrast over the glow (chip bg
   `rgba(10,12,18,0.8)` + 1px kind-colored border).
4. **BREATHING ROOM (mandatory)** — panel padding >= 14px, grid gap >= 12px,
   header/footer paddings >= 12px; rows never clipped.
5. **VISIBLE CONTROL BAR (mandatory)** — ALWAYS VISIBLE icon buttons,
   top-right of the stage, not hidden keyboard lore: PAUSE/RESUME,
   **LOCK/UNLOCK blocks (see §0.8)**, label density cycle
   (ALL -> MIN -> OFF), zoom -, live zoom %, zoom +, RESET camera,
   **LAYOUT reset (see §0.8)**, FOCUS mode. Plus FPS + palette chips and a
   one-line hints strip (bottom-left) for the gestures.
6. **VIEW CONTROL GESTURES (mandatory on 3D stages)** — drag = orbit when
   locked or on empty space (click-vs-drag disambiguated by a >5px move
   threshold), wheel = zoom (clamped ~0.45x-2.1x), pause FREEZES THE FLOW
   but NEVER the camera. A tooltip closes and hover state clears when the
   pointer LEAVES the canvas (`pointerleave`) — a stuck tooltip = FAIL.
7. **FOCUS MODE (mandatory)** — one key/button hides ALL chrome (header +
   telemetry) so the flow stage fills the screen; Esc or the same button
   restores. The telemetry footer is a collapsible drawer.
8. **KEYBOARD SHORTCUTS (mandatory)** — documented in the hints strip:
   Space = pause/resume, L = labels, **U = lock/unlock blocks**, R = reset
   view, +/- = zoom, F = focus, Esc = exit focus. Ignore keystrokes while
   typing in inputs.

**Iron tests (run ALL before calling it done):**
- **Overlap scan**: at the default 1440x900 view, screenshot and verify no
  two label chips intersect and no chip is cropped by the viewport edge.
- **Control sweep**: click EVERY control once and verify a visible state
  change (pause chip appears, lock toggles, zoom % updates, labels cycle,
  camera resets, layout restores, chrome hides/restores).
- **Type check**: no body text below 10px; KPI values >= 17px.
- **Clip check**: all six telemetry panels show their full content at
  1440x900 with the footer expanded.

---

## 0.8 INTERACTIVE LAYOUT — DRAGGABLE BLOCKS + LOCK/UNLOCK (violating any line = FAILED build)

A flow graph the operator cannot ARRANGE is a picture, not a tool. The node
blocks are physical objects the user can pick up and move, with a lock so
the arrangement cannot drift by accident. Hard law:

1. **LOCK/UNLOCK TOGGLE, ALWAYS VISIBLE (mandatory)** — a state-labeled
   button in the control bar (`LOCKED` with a closed-lock icon / `UNLOCKED`
   with an open-lock icon, highlighted while unlocked). Default state:
   **LOCKED**, so the established drag gesture stays "orbit".
2. **UNLOCKED: BLOCKS ARE DRAGGABLE (mandatory)** — pointer-down on a block
   starts a **camera-plane drag** (drag plane perpendicular to the camera
   view direction through the grabbed block, grab-offset preserved so the
   block never jumps to the cursor). The block follows the mouse 1:1 on
   screen. Dragging empty space STILL orbits — the view gesture survives.
3. **WIRES FOLLOW LIVE (mandatory)** — every frame a block moves, ALL edges
   touching it are rebuilt (curve re-derived from the two endpoint
   positions, tube geometry swapped + old geometry disposed). Rebuild at
   most once per frame via a dirty-set, never per pointermove event. A
   dragged block must NEVER leave its wires behind. Energy bands, orbs and
   comets keep riding the rebuilt curves during the drag.
4. **DRAG IS A USER ACTION, NOT FLOW TIME (mandatory)** — block dragging
   works while flow is paused (pause freezes flow, not the operator).
5. **BOUNDS CLAMP (mandatory)** — clamp dragged positions (reference:
   |x| <= 4.5 tier gaps, |y| <= 7.5, |z| <= 9) and reject non-finite
   values, so a block can never be thrown to infinity or poison the curve
   math (see numeric-safety rules in `references/webgl-flow-stage.md` §4.5).
6. **PRECISION MODE (mandatory)** — while UNLOCKED, cursor-parallax camera
   drift is DISABLED: a drifting camera makes the target glide away from a
   stationary cursor and precise grabbing impossible. Parallax returns when
   locked.
7. **LAYOUT RESET (mandatory)** — a `LAYOUT` button restores every block to
   its original position (store each node's home position at build time)
   and rebuilds all edges. RESET (camera) and LAYOUT (blocks) are separate
   controls.
8. **CURSOR AFFORDANCES (mandatory)** — over a draggable block: `move`;
   while dragging: `grabbing`; over empty space: `grab`; locked + over a
   block: `pointer` (click = trace route). Use pointer capture
   (`setPointerCapture`) so drags continue outside the canvas.
9. **KEYBOARD (mandatory)** — `U` toggles lock/unlock (input-safe, like all
   shortcuts).

**Iron tests (run ALL before calling it done):**
- **Drag test**: unlock, drag a block >= 2 tier-widths, screenshots before/
  after: the block AND all its wires moved together, the camera did not
  orbit, ZERO page errors. Probe verification (headless): hover the old
  spot -> no block; hover the new spot -> block present.
- **Lock test**: re-lock, drag from a block position: the CAMERA orbits,
  NO block changes position (screenshot diff).
- **Layout-reset test**: press LAYOUT -> every block returns to its home
  position, wires re-route, zero errors.
- **Click-vs-drag test**: a small click on a block still traces its route
  (moved <= 5px must not count as a drag).

Implementation recipe with exact code (camera-plane math, dirty-set
rebuild, per-frame node sync incl. labels):
**`<skill-folder>/references/webgl-flow-stage.md` §6.5.**

---

## 1. Design Tokens (calibrated)

### 1.1 Color

```css
:root {
  /* Canvas & surfaces (objective: median-cut dominant, 52-79% of frame) */
  --lfd-bg:            #121316;  /* page canvas */
  --lfd-bg-grid:       #1a1b20;  /* grid line tint, drawn at ~8% opacity */
  --lfd-panel:         #1a1b20;  /* node body / footer panel surface */
  --lfd-panel-border:  #26272e;  /* 1px card borders */

  /* Node-kind accents (objective: peak-chroma pixel sampling) */
  --lfd-pink:          #c41e60;  /* JEV pink — decide/gate/brand/alerts */
  --lfd-pink-deep:     #a6084c;  /* node header fill for DECIDE/GATE kinds */
  --lfd-blue:          #3d6ea8;  /* LLM generate nodes */
  --lfd-blue-deep:     #2a4b77;
  --lfd-green:         #5f9153;  /* worker nodes */
  --lfd-green-deep:    #35662f;
  --lfd-gold:          #b08a2e;  /* tool nodes */
  --lfd-gold-deep:     #714f12;
  --lfd-gray:          #8a8a92;  /* I/O + state node headers (neutral) */

  /* Wires (the signature element) */
  --lfd-wire:          rgba(232, 236, 240, 0.35);  /* base stroke */
  --lfd-wire-hot:      rgba(255, 255, 255, 0.95);  /* active pulse stroke */
  --lfd-wire-glow:     rgba(255, 255, 255, 0.18);  /* outer glow halo */

  /* Text */
  --lfd-text:          #e8e8ea;
  --lfd-muted:         #8a8a92;
  --lfd-faint:         #55555c;

  /* Semantic (gate verdicts) */
  --lfd-ok:            #5f9153;  /* ALLOWED */
  --lfd-danger:        #c41e60;  /* HELD / REJECTED / BLOCKED */
  --lfd-warn:          #b08a2e;  /* ESCALATED */
}
```

Rules:
- Never use pure `#000000` or pure `#FFFFFF`. Canvas is `#121316`; brightest
  wire core is `rgba(255,255,255,0.95)` over dark, reading as off-white.
- Accents appear ONLY as: node header fills, 1px node borders, small bars,
  key text highlights, and the LIVE dot. Large areas stay charcoal.
- The five node kinds are the complete accent set. Do not introduce a sixth
  hue. (The 3D stage's click-cycling palettes recolor these same five roles.)

### 1.2 Typography

| Role | Spec |
|------|------|
| Family | Geometric mono: JetBrains Mono > IBM Plex Mono > ui-monospace fallback |
| Brand / hero | 700 weight, uppercase, `letter-spacing: 0.08em`. Brand = white, `// SUFFIX` = pink |
| KPI labels | 9-10px, uppercase, `letter-spacing: 0.12em`, color muted |
| KPI values | 13-14px (hero counters larger), 700, tabular figures |
| Node title | 11px, 700, uppercase on header bar, dark text on colored fill |
| Node rows | 9-10px; keys muted left-aligned, values right-aligned |
| Tier labels | 8-9px, uppercase, `letter-spacing: 0.18em`, color faint |
| Panel titles | 10px, uppercase, muted, prefixed `// ` |
| Numbers | Thousands separators, 2 decimals for ratios, units as suffix (`$4.50`, `1,204`, `0.92`) |

### 1.3 Space & Shape

| Token | Value |
|-------|-------|
| Node radius | 6px (cards), 4px (buttons/chips) |
| Node header bar | 18-20px tall, full-bleed colored fill, dark text |
| Node body padding | 8px 10px; key-value rows 4px apart |
| Panel radius | 8px, 1px border `--lfd-panel-border` |
| Grid gap | 12px (footer panels), 16px (page zones) |
| Page padding | 16-20px |
| Background grid | 48px cells, 1px lines at 6-8% opacity |

---

## 2. Layout System

Fixed viewport app shell (no page scroll; inner panels scroll). Three zones,
ALL OPERATOR-CONTROLLED (§0.7): the telemetry footer collapses to a strip,
and FOCUS mode hides header + footer entirely so the stage fills the screen.

```
+------------------------------------------------------------------+
| HEADER  brand | subtitle            KPI x6            o LIVE     |  ~88px
| +--------------------------------------------------------------+ |
| |        3D FLOW STAGE (flex-1)   [control bar top-right]      | |  flex
| |   9 tiers along X · swaying tubes · orbs · comets · chips    | |
| |   blocks draggable when UNLOCKED (§0.8)                      | |
| |   hints strip bottom-left: DRAG ORBIT · WHEEL ZOOM · ...     | |
| +--------------------------------------------------------------+ |
| STRIP  // TELEMETRY                          [HIDE PANELS]       |  ~40px
| FOOTER  2 rows x 3 cols telemetry panels (collapsible)           |  ~300px
+------------------------------------------------------------------+
```

- **Header**: left = `BRAND // SUFFIX` (suffix pink) + subtitle line (muted,
  10px). Right = KPI row: label above value (17px bold tabular-nums), then
  `* LIVE` where `*` is a pink dot with 1s blink.
- **DAG tiers**: in the reference, 9 tiers left-to-right (INPUT -> OUT).
  In a retrofit, the tier count/names come from the HOST domain (Phase 2).
  Wide tiers hold 3 nodes; decide/gate tiers 1-2; single spine nodes
  centered. Tier banner labels ride above each tier lane in the 3D stage.
- **Wire orb (3D)**: WebGL canvas filling the stage; every logical edge is
  a swaying neon tube; dense fan-outs from routers/gates produce the
  hourglass silhouette.
- **Footer panels** (2 rows x 3 cols, each titled `// NAME`; the whole
  footer is a collapsible drawer — see §0.7):
  1. `// NODE TRAFFIC` — live event log, newest at bottom, old lines fade
  2. `// ROUTER PICKS` — horizontal bars, model names + share %
  3. `// GENERATION TOKENS` — giant 40-48px number + sub-metrics row
  4. `// GATE VERDICTS` — 4 rows with semantic-colored mini bars + counts
  5. `// WIRE LOAD` — 30-40 bin histogram, 1-2 bins per tick, trailing
     segment marks the current window
  6. `// LAYER STATUS` — one row per tier: colored bar + tier name + state
  Row budget rule: panel body height must fit ALL rows — if a caption
  pushes the last row below the clip, drop the caption, never clip a data
  row. Panel NAMES are examples — in a retrofit they rename to the host
  domain, but the six STRUCTURAL slots stay.

---

## 3. Workflows

### Mode R — RETROFIT AN EXISTING PROJECT (PRIMARY workflow — start here)

Use this when the user has an existing app/dashboard and wants the live-flow
look and behavior added to it. Execute the phases IN ORDER. Do not skip the
verification line of any phase. All paths are discovered by you (§0
contract); nothing is hardcoded.

**Phase 0 — ORIENT (agent setup, no code yet)**
1. Locate `<project-root>` via its manifest. Identify framework, language,
   styling system, package manager.
2. Read the run/build/test scripts. Start the dev server. Confirm the app
   loads in your browser tooling and note the baseline console/page errors
   (must end at ZERO new ones).
3. Screenshot the current UI. Do not change anything yet.

**Phase 1 — AUDIT (understand what exists)**
1. Inventory: pages/routes, the target dashboard page, every widget on it,
   every data source (WebSocket, SSE, polling, REST, server events), and
   the app's existing color/typography system.
2. Identify the domain entities that FLOW (requests, jobs, messages,
   packets, orders...): what enters, which stages it passes, what
   rejects/filters it, what exits.
3. Deliverable: a short map (in your working notes) of
   `entity -> stages -> edges -> verdicts`.

**Phase 2 — MAP (host domain -> the flow grammar)**
1. Tiers = the host pipeline's stages, in flow order (the reference uses 9;
   use what the host domain actually has, 6-10 tiers reads well).
2. Node kinds map to the five accent roles: pink = decisions/gates, blue =
   generation/model steps, green = workers/executors, gold = external
   tools/integrations, gray = pure I/O. Extra host roles must fold INTO
   these five (no sixth hue).
3. Edges = real hand-offs between stages (they will carry live events).
4. Existing widgets map onto slots: headline metrics -> KPI header slots;
   logs/rankings/counters/breakdowns/histograms/status-lists -> the six
   footer slots (§2). Widgets that fit no slot KEEP their logic and are
   merely restyled with §1 tokens.

**Phase 3 — TOKEN SWAP (visual foundation)**
1. Add the §1.1 CSS custom properties to the global stylesheet (prefix
   them if the host already uses clashing names).
2. Map the host's semantic colors onto `--lfd-ok/danger/warn`.
3. Apply the dark canvas + mono type ramp (§1.2/§1.3) to the target page
   ONLY until the retrofit is proven, then extend.
4. Verify: page renders dark with tokens; no layout breakage.

**Phase 4 — DATA WIRE (live truth before visuals)**
1. Find the real streams. Build a tick store (a tiny event-sourced store
   your framework can subscribe to) + an adapter per source (WS/SSE/poll)
   — recipes: `references/live-data-recipes.md`.
2. Event contract the stage needs:
   `request { path: nodeId[] }` (multi-hop route for comets),
   `node-stat { id, k, v }`, `node-state { id, state }`, plus whatever
   feeds KPIs/panels.
3. If a hop path doesn't exist in the host data, synthesize it from the
   entity's stage history (route comets are mandatory — RULE ZERO #7).
4. NO FAKE DATA in a retrofit unless the user opts in. (A dev-only
   simulator behind an explicit flag is allowed for offline work.)
5. Verify: store receives events; a debug readout ticks.

**Phase 5 — SHELL (structural rebuild of the target page)**
1. Restructure into the three zones (§2): Header / FlowStage / Footer
   strip+panels, fixed viewport, no page scroll.
2. Move the host's real metrics into the KPI header; move mapped widgets
   into the six footer slots; wire each to the tick store.
3. Verify: all content visible at 1440x900, footer collapses/expands.

**Phase 6 — FLOW STAGE (the product)**
1. Build the 3D WebGL stage per
   `references/webgl-flow-stage.md` (gold standard) — node blocks in 3D,
   neon tube edges with energy-band shader + ambient orbs + route comets,
   bloom, palettes. Follow its §4.5 numeric-safety iron rules (dt clamp,
   floor-wrap of t, safe curve sampling, build-time edge validation) —
   they prevent the classic rAF crash.
2. If the target cannot run WebGL, build the 2D canvas fallback with ALL
   10 systems (§0.5).
3. Verify: RULE ZERO iron tests pass (screenshot diff, event starvation).

**Phase 7 — READABILITY & CONTROLS (§0.7)**
1. One-line label chips with kind-colored borders + collision lanes;
   camera fits the full label span; type minimums.
2. Visible control bar + hints strip + keyboard shortcuts + focus mode +
   collapsible telemetry.
3. Verify: overlap scan, control sweep, type check, clip check all pass.

**Phase 8 — INTERACTIVE LAYOUT (§0.8 — draggable blocks + lock)**
1. Implement the drag engine per
   `references/webgl-flow-stage.md` §6.5: camera-plane drag with grab
   offset, dirty-set edge rebuild (curve + tube geometry swap, once per
   frame), per-frame node sync (body/rim/glow/label follow the dragged
   position), bounds clamp, home positions + LAYOUT reset.
2. Add the LOCKED/UNLOCKED toggle to the control bar (default LOCKED,
   highlighted when unlocked, `U` shortcut) and disable cursor-parallax
   while unlocked (precision mode).
3. Verify: drag test, lock test, layout-reset test, click-vs-drag test —
   all with ZERO page errors.

**Phase 9 — FULL QA (§6)**
1. Run every gate in §6, including the blocking FLOW / NO-EVENT-ONLY-PULSES
   / READABILITY / USER CONTROL / DRAGGABLE BLOCKS items.
2. RESTART the browser (or hard-reload) before the final error check —
   cached chunks hide fresh code; stale error logs show old stacks.
3. Final state: zero page errors, motion proof numbers recorded, all
   controls exercised.

### Mode A — New project (when there is no host app)

1. Scaffold with any stack you like (the reference build: Next.js 16 + TS +
   Tailwind). Register §1 tokens in the global stylesheet.
2. Build the static shell first (Header, tier labels, Footer grid) with
   seed data; match §2 before any animation.
3. Add node blocks and lay out the graph.
4. Add the flow stage (Phase 6 above) and interactive layout (Phase 8).
5. Wire live data (Phase 4) — in greenfield builds a simulator behind an
   explicit flag is acceptable until real sources exist.
6. Phases 7 + 9 as in Mode R.

### Mode C — Recalibrate from a new reference video

1. Sample frames from the reference (ffmpeg or your framework's video
   tooling) and extract the Visual DNA with whatever multimodal analysis
   your agent provides. A bundled reference pipeline exists at
   `<skill-folder>/scripts/analyze_video_pipeline.mjs` (Node 18+, ffmpeg,
   chunked vision calls with rate-limit backoff) — use it, adapt it, or
   replace it; it is a tool, not a requirement.
2. Compare the extracted objective palette against §1.1; update tokens.
3. Record deltas under a new "Calibration" heading in
   `references/visual-dna.md`, and update layout/motion sections if the
   reference differs.

---

## 4. Component Recipes

### 4.1 Flow node block

```tsx
// kind: 'io' | 'decide' | 'llm' | 'worker' | 'tool'
const KIND = {
  io:     { fill: 'var(--lfd-gray)',       border: '#3e3f42' },
  decide: { fill: 'var(--lfd-pink-deep)',  border: 'var(--lfd-pink)' },
  llm:    { fill: 'var(--lfd-blue-deep)',  border: 'var(--lfd-blue)' },
  worker: { fill: 'var(--lfd-green-deep)', border: 'var(--lfd-green)' },
  tool:   { fill: 'var(--lfd-gold-deep)',  border: 'var(--lfd-gold)' },
} as const;

// Structure: colored header bar (title left, TAG chip right, dark text),
// body = 2-3 key/value rows. States:
//   'run'  -> border glow: 0 0 12px kindColor@40%
//   'hold' -> desaturate 60% + reduce opacity
//   flash  -> 420ms white border/glow spike on packet arrival
// Width ~150-170px; router/gate blocks get a breathing border glow
// (CSS keyframes 2.4s, opacity 0.5 <-> 1).
// 3D stage: the block is a box mesh; this recipe is its CSS2D chip.
```

### 4.2 The Flow Stage — WebGL gold standard + canvas fallback

**Gold standard: 3D WebGL flow stage (three.js).** Node blocks become 3D
meshes (draggable — §0.8); edges become swaying neon `TubeGeometry` wires
with an energy-band shader; ambient orbs ride every curve; real routes
arrive as white-hot comets hop-by-hop; `UnrealBloomPass` gives the neon
glow; CSS2D labels keep crisp mono text; click cycles palettes, hover
inspects nodes, cursor parallaxes the camera (locked mode only). Full
recipe (shaders, layout math, numeric safety §4.5, drag engine §6.5, perf):
**`references/webgl-flow-stage.md`** — read it before building.

**Fallback: 2D canvas WireLayer** — one `<canvas>`, one rAF, ALL edges, 8
passes per frame: vignette / wire halo / dashed crawling core (additive) /
direction chevrons with luminance wave / energy sweeps / anchor port dots /
particle streaks + burst packets / arrival ripples. Edge path: cubic bezier
parent.bottom -> child.top with ±28% dx control offsets. Per-edge
arc-length LUT (16 samples) so particle speed is px/s. Keep a per-edge EMA
(2.2s) coupling alpha/dash speed/particle count. Full implementation:
`references/live-data-recipes.md` §5.

### 4.3 KPI Header Item

Label (muted, 9px, tracked) over value (700, tabular-nums). Value changes
animate via spring-lerp (~12%/frame, snap when |delta| < 0.5). REQUESTS
ticks multiple times per second; money metrics drift slowly at 2 decimals.

### 4.4 Footer panels

Full implementations in `references/live-data-recipes.md` (LogStream,
BarPicks, BigCounter, VerdictBars, WireLoad, LayerStatus). Shared rules:
1px border, `--lfd-panel` bg, `// TITLE` header row with a right-aligned
live badge (e.g. `620/s`), content padded 10-12px, row-budget rule (§2).

---

## 5. Motion Spec (the "alive" layer)

| Element | Trigger | Cadence / Duration | Easing feel |
|---------|---------|--------------------|-------------|
| **3D: tube energy bands (shader)** | ALWAYS (every edge) | marching `fract(uv.x * density - t * speed)`, speed 0.55 + heat x 2.6 | linear in path space |
| **3D: ambient orbs** | ALWAYS (every edge, 2-6 active) | continuous, 1.6 + heat x 4.4 units/s, source->target | linear in path space |
| **3D: tube sway (vertex shader)** | ALWAYS | sin/cos fields, amp 0.10-0.18 units, ends anchored | sine fields |
| **3D: route comets** | real request event | hop chain ~6.5-9 units/s + 6-ghost trail | linear in path space |
| **3D: node bob + flash** | ALWAYS / packet arrival | bob 0.07 units sine; flash decay ~2.6/s | exponential settle |
| **3D: block drag** | user, UNLOCKED | camera-plane 1:1; touching edges rebuilt once per frame (dirty set) | direct (no lag) |
| **3D: lock/unlock** | user (button / U) | default LOCKED; unlocked = precision mode (parallax off) | instant |
| **3D: layout reset** | user (LAYOUT) | all blocks return home; edges rebuilt | instant |
| **3D: camera parallax** | cursor move, LOCKED only | lerp ~3/s toward cursor offset | smooth damp |
| **3D: drag orbit + wheel zoom** | user input (locked / empty space) | yaw -= dx*0.0042, pitch clamp, zoom x exp(dy*0.0011) | smooth damp ~3.2/s |
| **3D: pause** | user (Space / button) | freezes flow time; camera + block dragging stay live | — |
| **3D: dust field** | ALWAYS | 240 points drifting up, wrap at y=9 | linear |
| Ambient particle streams (2D) | ALWAYS (every edge) | continuous, 50-95 px/s + load | linear in path space |
| Dash crawl on wire cores (2D) | ALWAYS | 26 px/s downstream | linear |
| Direction chevrons (2D) | ALWAYS | luminance wave ~1.6 rad/s | sine wave |
| Energy sweeps (2D) | ALWAYS, phase-staggered | ~2.4s per traverse | linear scan |
| Burst packets (2D) | data event | hop chain, ~185 px/s | linear in path space |
| Arrival ripples + node flash | packet lands | 460ms ring + 420ms flash | ease-out |
| Edge load (EMA 2.2s) | per traversal | continuous decay | exponential |
| Node glow (active) | state = run | 2.4s loop + 1.7s scan shimmer | ease-in-out |
| LIVE dot | mount | 1s loop | step blink |
| KPI tick | store update | per event | lerp 12%/frame |
| Log stream | event | 2-4 new lines/s | slide-up 200ms |
| Wire-load histogram | 100ms window | 10-15Hz bar shift | none |
| Router-picks bars | pick event | 300ms width tween | ease-out |
| Verdict bars | verdict event | 400ms width tween | ease-out |
| Phase indicator | pipeline phase | swap text 150ms crossfade | linear |

Iron rules:
- ONE shared rAF clock drives the stage + all spring numbers. Never
  setInterval for per-frame animation.
- Ambient motion runs EVEN WHEN the store is idle. Only comets/ripples are
  data-driven. (Pause the whole rAF only when `document.hidden`.)
- USER PAUSE freezes the flow clock only — rendering, camera, block
  dragging and data panels stay live (§0.7, §0.8).
- Adaptive quality under load: degrade RESOLUTION before touching motion.
- Numeric safety is part of the motion spec: clamp dt to [0, ~0.05] with
  NaN reseed, wrap path parameters with `t - Math.floor(t)` (never `% 1`),
  sample curves through a clamp+validate wrapper with a lerp fallback,
  validate edge geometry at build time — see
  `references/webgl-flow-stage.md` §4.5.
- Respect `prefers-reduced-motion`: slow the flow and disable
  parallax/dust; never reduce the dashboard to a still image.

---

## 6. QA Checklist (verify before delivery — run with YOUR browser tooling)

- [ ] Canvas `#121316`, faint 48px grid visible, no pure black/white fields
- [ ] Exactly 5 node-kind hues; accents only on headers/borders/bars/text
- [ ] All text mono; uppercase labels tracked; values tabular-nums
- [ ] Tiers present with labels matching the mapped domain order
- [ ] Wire orb: dense overlapping curved edges, hourglass silhouette
- [ ] **FLOW (blocking): RULE ZERO fully satisfied — swaying neon tubes,
      shader energy bands AND ambient orbs on EVERY edge in EVERY 1s
      window; direction readable at a glance; route comets trace real
      paths hop-by-hop; arrivals flash nodes; rejected gates burst;
      screenshot diff proof (two shots ~1.3s apart, corridor delta >70,
      every tier column alive); event-starvation test passes; >= 55fps on
      GPU with adaptive degrade**
- [ ] **NO EVENT-ONLY PULSES (blocking): stopping the data stream must NOT
      stop the flow — baseline ambient motion persists on every edge**
- [ ] **READABILITY (blocking): ZERO overlapping or cropped label chips at
      the default view; type minimums met; camera fits the FULL label
      span; all telemetry rows fully visible at 1440x900**
- [ ] **USER CONTROL (blocking): visible control bar (pause / LOCK-UNLOCK /
      label density / zoom - % / + / RESET / LAYOUT / focus) with every
      button verified; drag-orbit + wheel-zoom live; pause freezes flow
      but NOT the camera; focus mode + telemetry drawer work; keyboard
      shortcuts (Space, L, U, R, +/-, F, Esc) work; no stuck tooltip**
- [ ] **DRAGGABLE BLOCKS (blocking): unlock -> drag a block >= 2 tier
      widths -> block AND all its wires move together, camera stays put,
      zero page errors; lock -> drag = orbit, blocks stay; LAYOUT restores
      home positions; click-vs-drag (<= 5px) still traces a route**
- [ ] Header KPIs live-update; LIVE dot blinks at 1s
- [ ] Footer: all 6 structural panels present with `// ` titles
- [ ] Log streams 2-4 events/s; histogram shifts >= 10Hz
- [ ] Single rAF clock; no layout thrash
- [ ] Socket reconnects with backoff; UI shows stale state, never crashes
- [ ] `prefers-reduced-motion` honored
- [ ] No forced page scroll on 1440x900; panels scroll internally
- [ ] FINAL: full browser restart -> fresh load -> ZERO page-error events
      (cached chunks and stale error logs lie — restart before counting)

---

## 7. File Map (relative to `<skill-folder>`)

```
live-flow-dashboard/
  SKILL.md                          <- this file: agent contract, laws,
                                       tokens, workflows (Mode R primary),
                                       recipes, motion spec, QA
  scripts/
    analyze_video_pipeline.mjs      <- Mode C reference engine (optional):
                                       chunked video -> Visual DNA
  references/
    visual-dna.md                   <- extracted spec: per-chunk timeline,
                                       labels, objective palette, motion
                                       inventory
    retrofit-workflow.md            <- Mode R detail: audit/map/token-swap/
                                       re-shell/live-wire checklists
    live-data-recipes.md            <- tick store, WS/SSE adapter, spring
                                       numbers, six footer panels, 2D
                                       WireLayer implementation
    webgl-flow-stage.md             <- GOLD STANDARD: 3D flow stage — tube
                                       shader, orb pools, route comets,
                                       bloom, palettes, numeric safety
                                       (§4.5), draggable blocks + lock
                                       recipe (§6.5), control API
```

Read `references/webgl-flow-stage.md` before building any 3D stage; read
`references/retrofit-workflow.md` before touching an existing codebase.
