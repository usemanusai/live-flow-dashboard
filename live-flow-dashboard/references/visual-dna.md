# Visual DNA — JEV Engineering // Router and Gate

Full extraction record from the reference video. Source: 39.68s screen
recording, 1080x1322 (portrait), 30fps, h264 + AAC. Analysis: 4 x 10s
machine-vision chunks (thinking-enabled) + 12-frame contact-sheet global
pass + objective pixel sampling (peak-chroma) + Pillow median-cut palette.

Use this file as the source of truth when SKILL.md and observation disagree.

---

## 1. Objective Color Measurements

### 1.1 Median-cut dominant colors (8 evenly-sampled frames)

| Frame | Dominant colors (share) |
|-------|------------------------|
| pf_0 | `#121316` 52% · `#171519` 31% · `#3d3b3e` 12% |
| pf_1 | `#121316` 76% · `#2e2d30` 13% · `#1c0f18` 5% · `#28131e` 3% |
| pf_2 | `#121316` 52% · `#151518` 32% · `#3a3b3d` 10% |
| pf_3 | `#121316` 79% · `#2d2d31` 12% · `#1e0f19` 3% · `#29131f` 2% |

Reading: canvas is overwhelmingly `#121316`; pink-lit regions (`#1c0f18`,
`#28131e`) appear when router/gate activity peaks — the magenta glow tints
the canvas around active nodes.

### 1.2 Peak-chroma samples (full-res frame, per UI region)

| Region | Hex | Role |
|--------|-----|------|
| model router header | `#a6084c` | DECIDE kind fill (deep pink) |
| relevance filter / auto mode gate | `#9d0547` / `#a60b4e` | same kind confirmation |
| router picks / wire load bars | `#c41e60` / `#c31d61` | bright JEV pink for bars |
| brand `// ROUTER AND GATE`, LIVE | `#84002f`-`#982851` (antialiased) | pink text accents |
| frontier/mid llm headers | `#274874` / `#2a4b77` | LLM steel blue |
| worker research/code headers | `#35662f` / `#3c6a2f` | worker green |
| gate verdict ALLOWED bar | `#5f9153` | bright semantic green |
| tool bash header | `#714f12` | tool gold (deep) |
| structured state header | `#3e3f42` (neutral, no chroma) | I/O gray |
| node body | `#1a1b20` | panel surface |
| footer panel bg | `#1a191d` | panel surface |
| wire bundle (dense center) | off-white mix, ~`#e8ecea` peaks | white wires |

Machine-vision estimates (bloom-inflated, for reference): `#ff0055`,
`#e91e63`, `#00a8ff`, `#00e676`, `#ff9800`. Prefer the sampled values;
use the brighter variants only for glow/bloom effects.

---

## 2. Layout Specification (verified against full-res frame)

### 2.1 Header bar (~56px)

- Left: `JEV ENGINEERING` (white, 700, tracked) + `// ROUTER AND GATE`
  (same size, pink).
- Second line: `TWO JEV LAYERS, ZERO GENERATION TOKENS · ROUTER AT THE
  TOP, GATE AT THE BOTTOM` (muted, ~9px, tracked).
- Right: 6 KPIs — `NODES 15`, `JEV LAYERS 2`, `REQUESTS 1,000`,
  `GEN TOKENS 0`, `BLOCKED 63`, `$/M IN 0.042` — label above value,
  then `● LIVE` (pink dot + text).
- Far-right lower row: `PHASE 4/6 · OUT` (pink), `DELIVERABLE: ZERO
  APPROVALS` (muted).

### 2.2 Left rail

- `NODE KINDS` legend (top-left, below header): 4 rows with colored
  squares — pink `JEV · decides`, blue `llm · generates`, green `worker`,
  gold `tool`.
- Tier labels, vertically distributed down the left margin at each tier's
  vertical center: `INPUT`, `DECIDE · CHOICE`, `GENERATE`, `WORK`,
  `DECIDE · SCORE / BOOL`, `GATE · BOOL`, `EXECUTE`, `OUT`.

### 2.3 The 15-node graph (9 tiers, top -> bottom)

| Tier | Node | Kind | Header tag | Body rows (observed) |
|------|------|------|-----------|----------------------|
| INPUT | user request | io | IN | payload 1.2 MB · time 0.0417 |
| STATE | structured state | io | STATE | goal set 22 · resources 12 · missing 2 |
| DECIDE·CHOICE | model router | decide | CHOICE | options 7 · picked haiku · conf 0.92 |
| GENERATE | frontier llm | llm | GEN | $/M 10.00 · calls 0 |
| GENERATE | mid llm | llm | GEN | $/M 2.00 · calls 0 |
| GENERATE | cheap llm | llm | GEN | $/M 0.26 · calls 0 |
| WORK | worker · research | worker | RUN | context 1,204 · state ok |
| WORK | worker · code | worker | RUN | snippets 58 · state ok |
| WORK | worker · browse | worker | RUN | pages 92 · state ok |
| DECIDE·SCORE | relevance filter | decide | SCORE | kept 0.81 · dropped 214 |
| DECIDE·BOOL | approval check | decide | BOOL | (filter) 0.12 · escalate no |
| GATE·BOOL | auto mode gate | decide | BOOL | p(fail) 0.03 · blocks 1 |
| EXECUTE | tool · bash | tool | EXEC | status hold |
| EXECUTE | tool · browser | tool | EXEC | status run |
| EXECUTE | tool · write | tool | EXEC | status run |
| OUT | deliverable | io | OUT | artifact 1 · approvals 0 |

Caption under OUT node: `zero approvals asked` (small gray chip).
Annotation near bash: `bash held p(unsafe) 0.05`.

### 2.4 Wire orb

- Every logical edge drawn as a cubic bezier; fan-out edges from
  `model router` to all three LLMs, from workers to both DECIDE nodes,
  from DECIDE nodes to `auto mode gate`, from gate to all three tools,
  from tools to `deliverable`, plus state edges (INPUT -> STATE -> router).
- Control points swing wide horizontally -> elliptical "orbit" sweeps,
  densest between GENERATE and DECIDE tiers, forming the hourglass/orb.
- Stroke: white, base opacity ~0.25-0.4; multiple overlapping edges stack
  to near-white in the bundle core. Subtle outer glow.

### 2.5 Footer telemetry (2 rows x 3 cols)

| Panel | Title | Contents (observed) |
|-------|-------|--------------------|
| 1 | `// NODE TRAFFIC` | scrolling log; event lines colored by source: `route:` pink, `choice:` pink, `worker:` green; entries like `route: bounce spaq A01Z kept 0.81 106w` |
| 2 | `// ROUTER PICKS` | horizontal bars + right-aligned % — HAIKU 4.5 49%, SONNET 9 22%, GPT 4O 16%, OPUS 3 9%, MISTRAL 3% (blue bars) |
| 3 | `// GENERATION TOKENS` | giant pink `0` (40-48px); `TOKENS GENERATED TO DECIDE`; sub-row `router 0 · gate 0 · llm in 182,000`; caption `two 160+ layers, zero generation tokens` |
| 4 | `// GATE VERDICTS` | ALLOWED 882 (green bar), HELD 63, ESCALATED 33, REJECTED 14 (pink/red bars) |
| 5 | `// WIRE LOAD` | 30-40 bin histogram, gray bars, trailing segment hot pink; badge `620/s`; caption `router top · gate bottom · both on decision pricing · neither gen` |
| 6 | `// LAYER STATUS` | rows: ROUTER (pink), GENERATE (blue), WORKERS (green), DECIDE (pink), GATE (pink), TOOLS (gold) — each a thin full-width bar + right state `run`; bottom caption `is request simple? · decision · is this bash command safe? · decision` |

---

## 3. Motion Inventory (observed cadences)

| # | Motion | Detail |
|---|--------|--------|
| 1 | Wire pulses | bright packets travel along beziers, top -> bottom, medium-fast (500-800ms/hop), continuous |
| 2 | Node breathing glow | router/gate pink borders pulse, ~2.4s ease-in-out loop |
| 3 | State flash | node brightens 400ms on state change (e.g. browser run) |
| 4 | LIVE blink | pink dot, ~1s cycle |
| 5 | KPI ticking | REQUESTS 289->350->436->538->658->954->1,000 over video; BLOCKED jumps 0->10->63; GEN TOKENS 0->12->42->84->196; $/M IN static 0.042 |
| 6 | Log stream | 2-4 new lines/s, old lines scroll up + fade |
| 7 | Histogram | WIRE LOAD bars shift ~10-15Hz, trailing pink window |
| 8 | Bar tweens | ROUTER PICKS + GATE VERDICTS widths re-tween ~300-400ms on change |
| 9 | Phase cycling | sub-header phase text swaps (`PHASE 1/6 - ROUTE` -> `2/6 CHOOSE` -> `4/6 GATE` -> `5/6 OUT`), red/pink, ~150ms crossfade |
| 10 | Verdict growth | ALLOWED bar grows from 0 to ~20 units at video end as gate fires |

## 4. Transcribed Text (verbatim strings for exact recreation)

Header: `JEV ENGINEERING // ROUTER AND GATE` · `TWO JEV LAYERS, ZERO
GENERATION TOKENS · ROUTER AT THE TOP, GATE AT THE BOTTOM` ·
`A FRONTIER MODEL NEVER GETS ASKED "IS THIS SIMPLE?"` · KPI labels above ·
`PHASE 4/6 · OUT` · `DELIVERABLE: ZERO APPROVALS`.

Node labels, tags and values: see table §2.3. Footer panel titles and
contents: see table §2.5. Quote ticker under header cycles aphorisms, e.g.
`A FRONTIER MODEL NEVER GETS ASKED "IS THIS SIMPLE?"`,
`AUTO-PROMPT BLOOMS BEFORE EXEC`.

## 5. Mood

Cybernetic · Immersive · Analytical. "Engineering HUD / cyberpunk terminal":
high-density, undecorated, everything aligned to grid, zero rounded-corner
excess, no illustrations, no stock imagery — the data IS the decoration.

## 6. Calibration Log

| Date | Change |
|------|--------|
| 2026-09-21 | Initial extraction from JEV reference (39.68s, 4 chunks + global + pixel sampling). Tokens v1 locked in SKILL.md. |
