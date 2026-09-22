# Retrofit Workflow — Live Flow Dashboard on an Existing Codebase

Mode B of the skill. Goal: turn an existing dashboard (any stack, ideally
Next.js/React) into the live-flow look without breaking its data logic.
Work in 5 passes, in order. Each pass ends with a verifiable state so you
can stop or commit between passes.

---

## Pass 0 — Audit (read-only)

Produce an inventory table before touching code:

| Column | What to record |
|--------|---------------|
| Page/route | Dashboard entry points |
| Data sources | REST polling? WebSocket? SSE? Server components? Refresh rate |
| Widgets | Every chart/tile/table with its library (Recharts, MUI, AG Grid...) |
| State | Where live values live (Redux, Zustand, SWR, React Query, context) |
| Theme | Current palette mechanism (CSS vars, Tailwind config, MUI theme) |

Verdict after audit: mark each widget `KEEP` (maps to a live-flow slot),
`RESTYLE` (keep logic, restyle skin), or `RETIRE` (duplicated by the shell).

## Pass 1 — Map widgets to slots

Every existing widget must land in one of these slots (from SKILL.md §2):

- **KPI header slot** (max 6): top-line metrics. Candidates: totals,
  counters, rates. Move the 6 most important here.
- **Graph node slot**: any entity that is a pipeline stage (services,
  agents, models, workers, tools, queues). Each becomes a FlowNodeCard
  with kind = decide/llm/worker/tool/io mapped from its domain role:
  - decision/routing/validation/gating logic -> `decide` (pink)
  - model or generation calls -> `llm` (blue)
  - background jobs / agents / crons -> `worker` (green)
  - executors / integrations / shell / API writes -> `tool` (gold)
  - pure inputs/outputs/state -> `io` (gray)
- **Footer panel slot** (exactly 6): event log, ranking bars, one big
  counter, status/verdict breakdown, throughput histogram, layer/section
  status. Retire or merge widgets that overflow these slots.
- **Wire edges**: define the real dependency graph between nodes
  (`parent -> child`). If the domain has no explicit pipeline, derive
  edges from request traces, queue subscriptions, or call graph — the
  wires must tell the truth about the system.

Deliverable: a written `slot-map.md` (or issue) listing node ids, kinds,
edges, and which feed each footer panel.

## Pass 2 — Token swap

1. Install tokens from SKILL.md §1.1 as CSS variables in `globals.css`
   (or map them into Tailwind theme / MUI palette — keep the mechanism
   the app already uses, only the values change).
2. Replace ALL page/panel/primary colors app-wide. Map existing semantic
   green/red/amber to `--lfd-ok/--lfd-danger/--lfd-warn`.
3. Swap fonts: mono family (JetBrains Mono via `next/font/google`), tabular
   numerals on all metric text.
4. Verify: app still functions; zero contrast regressions for text
   (`--lfd-text` on `--lfd-panel` = 9.4:1; `--lfd-muted` on panel = 4.6:1).

## Pass 3 — Re-shell

1. Restructure the dashboard page into the 3-zone shell:
   `Header / DAG viewport / Footer grid` (fixed viewport, internal scroll).
2. Render FlowNodeCards from the slot map (grid layout by tier is fine at
   first; absolute positioning for wire anchoring comes later).
3. Move the 6 chosen KPIs into the header; move mapped widgets into the
   footer panels; retire the rest (keep routes alive if linked elsewhere).
4. Delete or hide the old page chrome (sidebars that duplicate tiers,
   legacy toolbars) unless the user objects.

## Pass 4 — Live wire

1. Route data through the tick store (`references/live-data-recipes.md`
   §Store). Adapt existing sources: SWR/React Query polling -> store
   setters; existing sockets -> forward events into the store; server
   components -> hydrate initial store state.
2. If the app has no push channel, add SSE (`/api/stream`) or WebSocket
   route; see recipes §Adapter. Reconnect with exponential backoff;
   expose connection state in the UI (LIVE dot goes hollow/gray when stale).
3. Add the WireLayer canvas with edges from the slot map; spawn pulses
   from real store events only.

## Pass 5 — Motion & QA

1. Apply motion spec (SKILL.md §5) with the shared rAF clock.
2. Run the SKILL.md §6 QA checklist end-to-end.
3. Performance gate on a mid-range laptop: 60fps with 100+ pulses;
   DevTools Performance: main thread < 8ms/frame in steady state;
   no long tasks > 50ms during bursts.

---

## Rules of Engagement

- **Never fake data in retrofit mode.** Animation may only be driven by
  real store events. If a feed is missing, render the widget in a
  `stale/idle` state and note it — do not invent a ticker.
- **Preserve the data contract.** The retrofit changes presentation and
  event plumbing, not API shapes. If a backend change is unavoidable,
  stop and ask.
- **One pass per commit.** Each pass must leave the app runnable.
- **Feature-flag the old view** (`?legacy=1`) for one release cycle so
  stakeholders can compare.
- **Accessibility floor**: `prefers-reduced-motion` support is mandatory;
  every live region gets `aria-live="polite"`; the DAG has a screen-reader
  table fallback (node list + edges as text).
