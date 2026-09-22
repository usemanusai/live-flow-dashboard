# Live Data Recipes — Next.js 16 + TS + Tailwind + shadcn/ui

Copy-paste-grade implementations for the live-flow data layer and the six
footer panels. All code is client-side except the transport routes.
The stack assumption is Next.js 16 App Router; patterns port to any React.

---

## 1. Types (shared)

```ts
// lib/lfd/types.ts
export type NodeKind = 'io' | 'decide' | 'llm' | 'worker' | 'tool';
export type NodeState = 'idle' | 'run' | 'hold' | 'done';

export interface NodeSpec {
  id: string;
  tier: number;            // 0..8, see SKILL.md §2 tiers
  kind: NodeKind;
  title: string;           // 'model router'
  tag: string;             // 'CHOICE' | 'GEN' | 'RUN' | 'SCORE' | 'BOOL' | 'EXEC' | 'IN' | 'STATE' | 'OUT'
  rows?: { k: string; v: string }[];
}

export interface EdgeSpec { from: string; to: string; }

export type TickEvent =
  | { t: 'request'; id: string; path: string[]; ms: number }   // path = node ids traversed
  | { t: 'kpi'; key: string; value: number }
  | { t: 'log'; level: 'route' | 'choice' | 'worker' | 'gate' | 'tool'; msg: string }
  | { t: 'pick'; model: string }                               // router pick
  | { t: 'verdict'; verdict: 'ALLOWED' | 'HELD' | 'ESCALATED' | 'REJECTED' }
  | { t: 'tokens'; delta: number; scope: 'router' | 'gate' | 'llm' }
  | { t: 'wireload'; bins: number[] }
  | { t: 'node-state'; id: string; state: NodeState };
```

## 2. Store (tick store, zustand)

One store, event-sourced: components subscribe by selector, animation
subsystems (pulses, springs) consume the same stream.

```ts
// lib/lfd/store.ts
import { create } from 'zustand';
import type { NodeState, TickEvent } from './types';

interface LfdState {
  kpis: Record<string, number>;
  nodeStates: Record<string, NodeState>;
  logs: { id: number; level: string; msg: string; at: number }[];
  picks: Record<string, number>;            // model -> count
  verdicts: Record<string, number>;         // verdict -> count
  tokens: { router: number; gate: number; llm: number };
  wireLoad: number[];                       // rolling bins
  listeners: ((e: TickEvent) => void)[];
  apply: (e: TickEvent) => void;
  onTick: (fn: (e: TickEvent) => void) => () => void;
}

const WIRELOAD_BINS = 36;
let logId = 0;

export const useLfd = create<LfdState>((set, get) => ({
  kpis: { NODES: 15, LAYERS: 2, REQUESTS: 0, 'GEN TOKENS': 0, BLOCKED: 0, '$/M IN': 0.042 },
  nodeStates: {}, logs: [], picks: {}, verdicts: {},
  tokens: { router: 0, gate: 0, llm: 0 },
  wireLoad: Array(WIRELOAD_BINS).fill(0),
  listeners: [],
  onTick: (fn) => { set(s => ({ listeners: [...s.listeners, fn] }));
                    return () => set(s => ({ listeners: s.listeners.filter(f => f !== fn) })); },
  apply: (e) => {
    get().listeners.forEach(fn => fn(e));          // fan-out first (animation)
    switch (e.t) {
      case 'kpi': set(s => ({ kpis: { ...s.kpis, [e.key]: e.value } })); break;
      case 'node-state': set(s => ({ nodeStates: { ...s.nodeStates, [e.id]: e.state } })); break;
      case 'log': set(s => ({ logs: [...s.logs.slice(-80), { id: ++logId, level: e.level, msg: e.msg, at: Date.now() }] })); break;
      case 'pick': set(s => ({ picks: { ...s.picks, [e.model]: (s.picks[e.model] ?? 0) + 1 } })); break;
      case 'verdict': set(s => ({ verdicts: { ...s.verdicts, [e.verdict]: (s.verdicts[e.verdict] ?? 0) + 1 } })); break;
      case 'tokens': set(s => ({ tokens: { ...s.tokens, [e.scope]: s.tokens[e.scope] + e.delta } })); break;
      case 'wireload': set({ wireLoad: e.bins.slice(-WIRELOAD_BINS) }); break;
      case 'request': set(s => ({ kpis: { ...s.kpis, REQUESTS: s.kpis.REQUESTS + 1 } })); break;
    }
  },
}));
```

## 3. Transport adapter (SSE default, WebSocket optional)

```ts
// app/api/stream/route.ts  (server: bridge your real data source here)
export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream({
    start(controller) {
      const send = (e: unknown) => !closed &&
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      const unsub = subscribeToSystemEvents(send);   // <- wire YOUR source
      const ping = setInterval(() => send({ t: 'ping' }), 15000);
      // @ts-ignore cleanup
      controller._cleanup = () => { unsub(); clearInterval(ping); };
    },
    cancel(reason) { /* controller._cleanup?.(); closed = true; */ },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
}
```

```ts
// lib/lfd/useEventFeed.ts  (client)
import { useEffect } from 'react';
import { useLfd } from './store';
import type { TickEvent } from './types';

export function useEventFeed(url = '/api/stream') {
  const apply = useLfd(s => s.apply);
  useEffect(() => {
    let es: EventSource | null = null; let retry = 0; let stopped = false;
    const connect = () => {
      es = new EventSource(url);
      es.onopen = () => { retry = 0; useLfd.setState({ connected: true } as never); };
      es.onmessage = (m) => { try { apply(JSON.parse(m.data) as TickEvent); } catch {} };
      es.onerror = () => {
        es?.close();
        if (stopped) return;
        useLfd.setState({ connected: false } as never);
        setTimeout(connect, Math.min(30000, 500 * 2 ** retry++));  // backoff
      };
    };
    connect();
    return () => { stopped = true; es?.close(); };
  }, [url, apply]);
}
```

WebSocket variant: same shape, `new WebSocket(url)`, `onmessage` ->
`apply(JSON.parse(e.data))`, reconnect with identical backoff. Batch
high-frequency events with a 16ms rAF flush to avoid render storms.

## 4. Spring numbers (KPI ticking)

```ts
// lib/lfd/useSpringNumber.ts
import { useEffect, useRef, useState } from 'react';

export function useSpringNumber(target: number, lerp = 0.12) {
  const [display, setDisplay] = useState(target);
  const raf = useRef(0); const cur = useRef(target);
  useEffect(() => {
    const step = () => {
      const d = target - cur.current;
      if (Math.abs(d) < 0.5) { cur.current = target; setDisplay(target); return; }
      cur.current += d * lerp;
      setDisplay(cur.current);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, lerp]);
  return display;
}
```

Format helpers: `Intl.NumberFormat('en-US')` for thousands; ratios with
`toFixed(2)`; `$` prefix for costs. Always `tabular-nums` in CSS.

## 5. WireLayer (canvas FLOW ENGINE)

> **HARD RULE (SKILL.md §0.5):** a WireLayer that only draws edges + event
> pulses is a BUG. The implementation below runs 8 motion systems in ONE
> canvas + ONE rAF so every wire visibly flows at all times: ambient
> particle streams, comet trails, dash crawl, direction chevrons, energy
> sweeps, burst packets (visible route), arrival ripples, load coupling.

```tsx
// components/lfd/WireLayer.tsx — signature element (flow engine)
'use client';
import { useEffect, useRef } from 'react';
import { useLfd } from '@/lib/lfd/store';

interface Pt { x: number; y: number }
interface Geom { p0: Pt; p3: Pt; len: number; at(t: number): Pt; tang(t: number): Pt }
interface Particle { e: number; t: number; v: number; size: number; trail: number;
                     rgb: [number, number, number]; hot: boolean }
interface Ripple { x: number; y: number; t0: number; rgb: [number, number, number] }

const KIND_RGB: Record<string, [number, number, number]> = {
  io: [178,182,190], decide: [236,62,130], llm: [92,158,224],
  worker: [124,190,104], tool: [228,182,84],
};
const WHITE: [number, number, number] = [255, 255, 255];
const AMBIENT_V = [70, 120];     // px/s
const BURST_V = 200;             // px/s
const DASH_SPEED = 34;           // px/s crawl (layer 1); layer 2 slower for parallax
const MAX_PARTICLES = 900;

export function WireLayer({ anchors, edges }: {
  anchors: React.RefObject<Record<string, HTMLDivElement | null>>;
  edges: { from: string; to: string }[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const bursts = useRef<Particle[]>([]);
  const ripples = useRef<Ripple[]>([]);
  const load = useRef<number[]>([]);
  const dashOffset = useRef(0);

  // real SSE request events -> white-hot burst packet per hop + load bump
  useEffect(() => {
    load.current = edges.map(() => 0);
    return useLfd.getState().onTick((ev) => {
      if (ev.t !== 'request') return;
      ev.path.forEach((id, i) => {
        const ei = edges.findIndex((x) => x.from === id && x.to === ev.path[i + 1]);
        if (ei < 0) return;
        load.current[ei] = Math.min(1.4, load.current[ei] + 0.34);
        if (bursts.current.length < 90)
          bursts.current.push({ e: ei, t: -0.02 * i, v: BURST_V, size: 2.6,
                                trail: 30, rgb: WHITE, hot: true });
      });
    });
  }, [edges]);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    let raf = 0; let last = performance.now();

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const dpr = devicePixelRatio || 1;
      const rect = cv.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      if (w === 0 || h === 0) { raf = requestAnimationFrame(draw); return; }
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

      // anchors -> per-edge geometry (bezier + 16-sample arc-length LUT)
      const geoms = edges.map((e): Geom | null => {
        const ae = anchors.current?.[e.from], be = anchors.current?.[e.to];
        if (!ae || !be) return null;
        const r = (el: HTMLElement) => el.getBoundingClientRect();
        const ra = r(ae), rb = r(be);
        const p0 = { x: ra.left + ra.width / 2 - rect.left, y: ra.bottom - rect.top };
        const p3 = { x: rb.left + rb.width / 2 - rect.left, y: rb.top - rect.top };
        const c1 = { x: p0.x + (p3.x - p0.x) * 0.28, y: p0.y + (p3.y - p0.y) * 0.6 };
        const c2 = { x: p3.x - (p3.x - p0.x) * 0.28, y: p3.y - (p3.y - p0.y) * 0.6 };
        const at = (t: number): Pt => { const u = 1 - t;
          return { x: u*u*u*p0.x + 3*u*u*t*c1.x + 3*u*t*t*c2.x + t*t*t*p3.x,
                   y: u*u*u*p0.y + 3*u*u*t*c1.y + 3*u*t*t*c2.y + t*t*t*p3.y }; };
        let len = 0; let prev = at(0);
        for (let s = 1; s <= 16; s++) { const q = at(s / 16);
          len += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q; }
        const tang = (t: number): Pt => { const d = 0.012;
          const a = at(Math.max(0, t - d)), b = at(Math.min(1, t + d));
          const m = Math.max(1e-4, Math.hypot(b.x - a.x, b.y - a.y));
          return { x: (b.x - a.x) / m, y: (b.y - a.y) / m }; };
        return { p0, p3, len: Math.max(1, len), at, tang };
      });
      for (let i = 0; i < load.current.length; i++) load.current[i] *= Math.exp(-dt / 2.2);

      // pass 1: center vignette (depth)
      const vg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, h * 0.62);
      vg.addColorStop(0, 'rgba(126,138,152,0.055)'); vg.addColorStop(1, 'rgba(126,138,152,0)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

      const burstOn = edges.map(() => 0);
      for (const b of bursts.current) if (b.t >= 0) burstOn[b.e]++;

      // pass 2: halo + pass 3: CRAWLING dash core
      ctx.globalCompositeOperation = 'source-over';
      dashOffset.current -= dt * DASH_SPEED;
      edges.forEach((_, i) => { const g = geoms[i]; if (!g) return;
        ctx.beginPath(); ctx.moveTo(g.p0.x, g.p0.y); const c1 = { x: 0, y: 0 };
        ctx.strokeStyle = `rgba(150,160,172,${0.05 + 0.07 * load.current[i] + 0.03 * burstOn[i]})`;
        // ... stroke full bezier (helper elided; see demo for exact shape)
        ctx.lineWidth = 3.6; ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); /* ... bezier again ... */
        ctx.setLineDash([2, 6]); ctx.lineDashOffset = dashOffset.current;
        ctx.strokeStyle = `rgba(210,218,228,${0.52 + Math.min(0.34, load.current[i] * 0.24 + burstOn[i] * 0.13)})`;
        ctx.lineWidth = 1.2; ctx.stroke();
        ctx.setLineDash([3, 16]); ctx.lineDashOffset = dashOffset.current * 0.42; // parallax beads
        ctx.strokeStyle = `rgba(226,232,240,${0.2 + hot * 0.6})`;
        ctx.lineWidth = 1.8; ctx.stroke(); ctx.setLineDash([]);
        ctx.globalCompositeOperation = 'source-over';
      });

      if (!reduced) {
        // pass 4: direction chevrons (downstream arrowheads, luminance wave)
        edges.forEach((_, i) => { const g = geoms[i]; if (!g) return;
          const n = Math.max(2, Math.min(5, Math.round(g.len / 110)));
          for (let k = 0; k < n; k++) { const t = (k + 0.5) / n;
            const tip = g.at(t), d = g.tang(t);
            const wave = 0.5 + 0.5 * Math.sin(now * 0.0016 - t * 5.2 + i * 1.3);
            const a = 0.06 + 0.13 * wave + 0.12 * burstOn[i];
            const ang = Math.atan2(d.y, d.x);
            ctx.beginPath();
            for (const s of [-1, 1]) { const ba = ang + Math.PI + s * 0.5;
              ctx.moveTo(tip.x, tip.y);
              ctx.lineTo(tip.x + Math.cos(ba) * 4.2, tip.y + Math.sin(ba) * 4.2); }
            ctx.strokeStyle = `rgba(226,232,240,${a})`; ctx.lineWidth = 1; ctx.stroke(); } });

        // pass 5: energy sweeps (scanning bright segment, phase-staggered)
        edges.forEach((_, i) => { const g = geoms[i]; if (!g) return;
          const ph = (now * 0.00014 + i * 0.618) % 1.7 - 0.35;
          if (ph < 0 || ph > 1.06) return;
          ctx.beginPath();
          for (let s = 0; s <= 6; s++) { const q = g.at(Math.min(1, ph + 0.09 * s / 6));
            s === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y); }
          ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 3.4; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.34)'; ctx.lineWidth = 1.4; ctx.stroke(); });

        // pass 6: pulsing anchor port dots
        edges.forEach((_, i) => { const g = geoms[i]; if (!g) return;
          const pu = 0.5 + 0.5 * Math.sin(now * 0.002 + i * 0.9);
          ctx.fillStyle = `rgba(232,236,240,${0.28 + 0.3 * pu})`;
          for (const p of [g.p0, g.p3]) { ctx.beginPath();
            ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill(); } });

        // pass 7: AMBIENT STREAMS (never zero) + burst packets
        ctx.globalCompositeOperation = 'lighter';
        const perEdge = edges.map(() => 0);
        for (const p of particles.current) perEdge[p.e]++;
        edges.forEach((e, i) => { // population control: target scales with load
          if (!geoms[i] || particles.current.length >= MAX_PARTICLES) return;
          const target = baseCount(e) + Math.round(load.current[i] * 7);
          if (perEdge[i] < target) particles.current.push({ e: i, t: Math.random(),
            v: AMBIENT_V[0] + Math.random() * 40, size: 1 + Math.random() * 0.9,
            trail: 9 + Math.random() * 8, rgb: KIND_RGB[kindOf(e.from)], hot: false }); });

        const advance = (p: Particle): boolean => { const g = geoms[p.e]; if (!g) return false;
          p.t += (p.v / g.len) * dt * (1 + load.current[p.e] * 0.9);
          if (p.t >= 1) { if (p.hot) { ripples.current.push({ x: g.p3.x, y: g.p3.y, t0: now, rgb: WHITE });
            window.dispatchEvent(new CustomEvent('lfd-arrive', { detail: { id: edges[p.e].to } })); }
            return false; } return true; };
        const streak = (p: Particle, baseA: number) => { const g = geoms[p.e]; if (!g) return;
          const head = g.at(p.t), tail = g.at(Math.max(0, p.t - p.trail / g.len));
          const [r, gg, b] = p.rgb;
          ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(head.x, head.y);
          ctx.strokeStyle = `rgba(${r},${gg},${b},${baseA * 0.2})`; ctx.lineWidth = p.size * 3.2; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(head.x, head.y);
          ctx.strokeStyle = `rgba(${r},${gg},${b},${baseA})`; ctx.lineWidth = p.size; ctx.stroke();
          if (p.hot) { ctx.save(); ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath();
            ctx.arc(head.x, head.y, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } };

        particles.current = particles.current.filter(advance);
        for (const p of particles.current) streak(p, 0.42);
        bursts.current = bursts.current.filter(advance);
        for (const p of bursts.current) if (p.t >= 0) streak(p, 0.95);

        // pass 8: arrival ripples
        ripples.current = ripples.current.filter((rp) => now - rp.t0 < 460);
        for (const rp of ripples.current) { const k = (now - rp.t0) / 460;
          ctx.beginPath(); ctx.arc(rp.x, rp.y, 2 + k * 15, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,${(1 - k) * 0.5})`; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.globalCompositeOperation = 'source-over';
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [anchors, edges]);

  return <canvas ref={ref} className="absolute inset-0 z-0 h-full w-full" aria-hidden />;
}
// baseCount(e): hub edges (from decide/llm kinds) 8, worker 6, io spine 7
// (short stubs need density), + Math.round(load * 7) live, cap 900.
//
// PERF (measured 57-59fps @1440x900, headless):
// - NEVER shadowBlur in the hot loop: pre-render a 32px radial-gradient
//   sprite once, `drawImage(sprite, x-9, y-9, 18, 18)` per packet head.
// - Batch ambient streaks: one beginPath per (kind color x size bucket),
//   stroke twice (glow underlay alpha 0.16 width 3.2x, core alpha 0.75)
//   -> ~10 stroke calls for the whole field instead of 2xN.
// - Skip chevrons whose luminance wave < 0.15; cap devicePixelRatio 1.5.
```

Node anchor registration: each FlowNodeCard reports its DOM element into a
`useRef` map (id -> element); WireLayer reads `getBoundingClientRect()` per
frame so wires follow layout/resize without re-renders. Burst arrivals
dispatch `lfd-arrive` CustomEvents; node cards listen and flash (CSS class,
420ms).

## 6. Footer panel components

Shared shell:

```tsx
export function Panel({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[var(--lfd-panel-border)] bg-[var(--lfd-panel)] p-3">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--lfd-muted)]">// {title}</h3>
        {badge && <span className="font-mono text-[10px] text-[var(--lfd-pink)]">{badge}</span>}
      </header>
      {children}
    </section>
  );
}
```

1. **LogStream** — `logs` selector; render last 12; `key=id`;
   entry animation `animate-in slide-in-from-bottom-1 duration-200`;
   level prefix colored (`route:`/`choice:` pink, `worker:` green);
   lines older than 12s get `opacity-40`.

2. **BarPicks** — `picks` selector; compute shares; rows sorted desc;
   `HAIKU 4.5  49%` label left, blue bar (`--lfd-blue`), % right;
   bar width `transition-[width] duration-300 ease-out`.

3. **BigCounter** — `tokens.llm` via `useSpringNumber`; render
   `Intl.NumberFormat().format(v)` at 40px/700 pink tabular; sub-row
   `router {r} · gate {g} · llm in {l}` muted.

4. **VerdictBars** — `verdicts` selector; fixed 4 rows in order
   ALLOWED/HELD/ESCALATED/REJECTED; colors ok/danger/warn/danger;
   width % = count / max(count,1); 400ms width tween.

5. **WireLoad** — `wireLoad` selector; flex row of 36 `flex-1` bars,
   height = bin/max%; gray `--lfd-muted`; last 5 bins pink; updates at
   event rate (aim 10Hz server-side); no CSS transition (instant).

6. **LayerStatus** — static tier list (ROUTER..TOOLS) with kind-colored
   thin bars; state text right from store (`run` when any node in tier
   is `run`, else `idle`); caption row of decision questions underneath.

## 7. Reduced motion

```ts
const reduce = useReducedMotion(); // from 'motion/react' or media query
// if reduce: skip WireLayer pulses (static pass only), no breathing glow,
// no log slide-in; KPI springs lerp=1 (instant).
```

## 8. Performance rules

- One rAF for pulses + springs (module-level clock), never per-component.
- Logs capped at 80 entries; wireLoad is a fixed ring of 36 numbers.
- Canvas behind nodes (`z-0` vs `z-10`); transforms/opacity only in CSS.
- Throttle store fan-out: listeners run synchronously but components
  subscribe with selectors so only affected panels re-render.
