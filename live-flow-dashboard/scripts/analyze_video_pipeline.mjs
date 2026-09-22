#!/usr/bin/env node
/**
 * analyze_video_pipeline.mjs
 * Chunked, rate-limit-aware visual analysis of a (dashboard) reference video.
 *
 * Pipeline: resolve source -> ffprobe -> ffmpeg chunk -> per-chunk z-ai vision
 *           -> contact-sheet global pass -> PIL palette extraction -> merge
 *
 * Usage:
 *   node analyze_video_pipeline.mjs --source <file|url> --out <dir>
 *        [--chunk-sec 10] [--delay-ms 4000] [--scale 1080] [--max-retries 3]
 *        [--thinking] [--resume]
 *
 * Designed to be bundled as the engine of the live-flow-dashboard skill.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const pexec = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- CLI args ----------
function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
}
const SOURCE = arg("source");
const OUT = arg("out", "./video-analysis");
const CHUNK_SEC = parseInt(arg("chunk-sec", "10"), 10);
const DELAY_MS = parseInt(arg("delay-ms", "4000"), 10);
const SCALE = parseInt(arg("scale", "1080"), 10);
const MAX_RETRIES = parseInt(arg("max-retries", "3"), 10);
const THINKING = !!arg("thinking", false);
const RESUME = !!arg("resume", false);

if (!SOURCE) {
  console.error("Usage: node analyze_video_pipeline.mjs --source <file|url> --out <dir>");
  process.exit(1);
}

const DIRS = {
  root: OUT,
  source: path.join(OUT, "source"),
  chunks: path.join(OUT, "chunks"),
  frames: path.join(OUT, "frames"),
  results: path.join(OUT, "results"),
};
for (const d of Object.values(DIRS)) fs.mkdirSync(d, { recursive: true });

const log = (...a) => console.log(`[${new Date().toISOString()}]`, ...a);

// ---------- Google Drive URL resolution ----------
function resolveDirectUrl(url) {
  const gd = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gd) {
    return `https://drive.google.com/uc?export=download&confirm=t&id=${gd[1]}`;
  }
  return url;
}

function fileHash(p) {
  const h = crypto.createHash("sha1");
  h.update(fs.readFileSync(p));
  return h.digest("hex").slice(0, 10);
}

// ---------- Step 1: source ----------
async function ensureLocalSource() {
  if (fs.existsSync(SOURCE) && fs.statSync(SOURCE).isFile()) {
    return path.resolve(SOURCE);
  }
  if (/^https?:\/\//.test(SOURCE)) {
    const url = resolveDirectUrl(SOURCE);
    const dest = path.join(DIRS.source, "video.mp4");
    log("Downloading", url, "->", dest);
    await pexec(`curl`, ["-sL", "--max-time", "300", url, "-o", dest], { maxBuffer: 1 << 26 });
    const head = fs.readFileSync(dest).subarray(0, 12).toString("latin1");
    if (head.includes("<html") || head.includes("<!DOCTYPE")) {
      throw new Error("Got HTML instead of video (auth/confirm wall). Make the link publicly downloadable.");
    }
    return dest;
  }
  throw new Error(`Source not found: ${SOURCE}`);
}

// ---------- Step 2: probe ----------
async function probe(file) {
  const { stdout } = await pexec("ffprobe", [
    "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", file,
  ]);
  const meta = JSON.parse(stdout);
  const v = meta.streams.find((s) => s.codec_type === "video");
  const a = meta.streams.find((s) => s.codec_type === "audio");
  return {
    duration: parseFloat(meta.format.duration),
    sizeMB: +(meta.format.size / 1e6).toFixed(2),
    width: v.width, height: v.height, fps: v.r_frame_rate,
    videoCodec: v.codec_name, hasAudio: !!a,
    audioCodec: a ? a.codec_name : null,
  };
}

// ---------- Step 3: chunking ----------
async function chunkVideo(file, meta) {
  const prefix = path.join(DIRS.chunks, "chunk_%03d.mp4");
  if (!RESUME) for (const f of fs.readdirSync(DIRS.chunks)) fs.unlinkSync(path.join(DIRS.chunks, f));
  const vf = `scale='min(${SCALE},iw)':-2,fps=24`;
  await pexec("ffmpeg", [
    "-y", "-i", file, "-an", "-c:v", "libx264", "-preset", "veryfast",
    "-crf", "25", "-pix_fmt", "yuv420p", "-vf", vf,
    "-f", "segment", "-segment_time", String(CHUNK_SEC), "-reset_timestamps", "1",
    "-segment_format_options", "movflags=+faststart", prefix,
  ], { maxBuffer: 1 << 26 });
  const chunks = fs.readdirSync(DIRS.chunks).filter(f => f.endsWith(".mp4")).sort();
  return chunks.map((f, i) => {
    const start = +(i * CHUNK_SEC).toFixed(2);
    const end = +Math.min((i + 1) * CHUNK_SEC, meta.duration).toFixed(2);
    return { file: path.join(DIRS.chunks, f), index: i, start, end };
  });
}

// ---------- Prompts ----------
const CHUNK_PROMPT = (i, n, start, end) => `You are analyzing segment ${i + 1} of ${n} (timestamps ${start}s-${end}s within the full video) of a recording of a data dashboard / data-visualization interface. A design-engineering team must rebuild this EXACT look in a web dashboard. Describe this segment visually in maximum detail:

1. LAYOUT & STRUCTURE: every panel/card/column visible, its position on screen (top-left, center, etc.), relative size, spacing, borders, rounding. Note any layout changes during this segment.
2. COLORS: background, panel/card surfaces, borders, accent colors, text colors. Give best-estimate HEX codes for each.
3. TYPOGRAPHY: font style (sans/mono/serif), weights, uppercase or not, size hierarchy, how numbers are formatted (decimals, %, $, separators).
4. VISUALIZATIONS: every chart/widget type (line, area, bar, gauge, radar, heatmap, ticker, table, candlestick, progress, map...), with styling details: gradient fills, glow/bloom, stroke width, dotted/solid grid lines, axes, legends, tooltips.
5. MOTION & ANIMATION: everything that MOVES in this segment: direction, speed (slow/medium/fast), what triggers it, easing feel (spring bounce, smooth decelerate, linear), looping/pulsing elements, particles, scanning/sweeping lines, draw-on effects, transitions.
6. DATA FLOW: which numbers/tickers update, values rising or falling, charts streaming left/right, approximate update cadence (per second, continuous...).
7. TEXT CONTENT: transcribe ALL visible labels, titles, values EXACTLY as written.
8. STATE CHANGES: elements appearing/disappearing, selection/highlight changes, color state shifts.

Be exhaustive and concrete - this text is the sole spec for recreation. Plain structured text, use the numbered headings.`;

const GLOBAL_PROMPT = `This is a contact sheet of 12 keyframes spanning an entire dashboard/data-viz video. Summarize the OVERALL design system: 1) global layout archetypes and screen flow (how the view changes over time), 2) the unified color palette with best-estimate hex codes, 3) typography system, 4) recurring widget types and their consistent styling, 5) the overall mood/aesthetic in 3 adjectives (e.g. 'dark futuristic mission-control'), 6) any branding/text visible. Plain structured text.`;

// ---------- z-ai vision with retry (SDK-based: CLI mislabels local videos as images) ----------
let _zai = null;
async function getZai() {
  if (!_zai) {
    const { createRequire } = await import("node:module");
    // resolve z-ai-web-dev-sdk portably: local project -> well-known global
    // roots (npm/bun/pnpm/yarn) -> bare import (bundlers / NODE_PATH)
    const roots = [
      path.join(process.cwd(), "node_modules/"),
      path.join(process.env.HOME ?? "", ".bun/install/global/node_modules/"),
      path.join(process.env.HOME ?? "", ".npm-global/lib/node_modules/"),
      path.join(process.env.HOME ?? "", ".yarn/global/node_modules/"),
    ];
    let mod = null;
    for (const r of roots) {
      try { mod = createRequire(r)("z-ai-web-dev-sdk"); break; } catch {}
    }
    if (!mod) mod = await import("z-ai-web-dev-sdk");
    const ZAI = mod.default ?? mod;
    _zai = await ZAI.create();
  }
  return _zai;
}

async function visionCall(prompt, mediaPath, outJson, label) {
  if (RESUME && fs.existsSync(outJson)) {
    log(`  [skip] ${label} already has result`);
    return JSON.parse(fs.readFileSync(outJson, "utf8"));
  }
  const zai = await getZai();
  const ext = path.extname(mediaPath).toLowerCase();
  const isVideo = [".mp4", ".mov", ".webm", ".avi", ".mkv"].includes(ext);
  const mime = isVideo ? "video/mp4"
    : [".png"].includes(ext) ? "image/png" : "image/jpeg";
  const b64 = fs.readFileSync(mediaPath).toString("base64");
  const mediaContent = isVideo
    ? { type: "video_url", video_url: { url: `data:${mime};base64,${b64}` } }
    : { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log(`  [vision] ${label} attempt ${attempt}/${MAX_RETRIES}...`);
      const res = await zai.chat.completions.createVision({
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, mediaContent] }],
        thinking: { type: THINKING ? "enabled" : "disabled" },
      });
      const content = res?.choices?.[0]?.message?.content ?? null;
      if (!content) throw new Error("empty content");
      fs.writeFileSync(outJson, JSON.stringify(res, null, 2));
      await sleep(DELAY_MS); // respect API limits between successful calls
      return res;
    } catch (e) {
      const msg = String(e?.message || e).slice(0, 200);
      log(`  [warn] ${label} attempt ${attempt} failed: ${msg}`);
      if (attempt < MAX_RETRIES) await sleep(5000 * Math.pow(4, attempt - 1)); // 5s, 20s, 80s backoff
    }
  }
  log(`  [error] ${label} FAILED after ${MAX_RETRIES} attempts`);
  return null;
}

// ---------- Step 4: per-chunk analysis ----------
async function analyzeChunks(chunks) {
  const results = [];
  for (const c of chunks) {
    const outJson = path.join(DIRS.results, `chunk_${String(c.index).padStart(3, "0")}.json`);
    log(`Chunk ${c.index} [${c.start}s-${c.end}s] ${path.basename(c.file)} (${(fs.statSync(c.file).size / 1e6).toFixed(1)}MB)`);
    const res = await visionCall(CHUNK_PROMPT(c.index, chunks.length, c.start, c.end), c.file, outJson, `chunk_${c.index}`);
    results.push({
      chunk: c.index, start: c.start, end: c.end,
      status: res ? "ok" : "failed",
      description: res?.choices?.[0]?.message?.content ?? null,
    });
  }
  return results;
}

// ---------- Step 5: contact sheet global pass ----------
async function globalPass(meta) {
  const n = 12;
  const tile = path.join(DIRS.frames, "contact_sheet.jpg");
  if (!fs.existsSync(tile)) {
    await pexec("ffmpeg", ["-y", "-i", path.join(DIRS.source, "video.mp4"),
      "-vf", `fps=${(n / meta.duration).toFixed(4)},scale=360:-2,tile=3x4`, "-frames:v", "1", tile],
      { maxBuffer: 1 << 26 });
  }
  const outJson = path.join(DIRS.results, "global_pass.json");
  log("Global pass on contact sheet...");
  const res = await visionCall(GLOBAL_PROMPT, tile, outJson, "global");
  return { status: res ? "ok" : "failed", description: res?.choices?.[0]?.message?.content ?? null };
}

// ---------- Step 6: objective palette extraction (Pillow) ----------
async function extractPalette() {
  const script = path.join(DIRS.frames, "palette.py");
  fs.writeFileSync(script, `
from PIL import Image
import json, glob, os
out = []
frames = sorted(glob.glob("${DIRS.frames}/pf_*.png"))
for f in frames:
    im = Image.open(f).convert("RGB")
    q = im.quantize(colors=6, method=Image.MEDIANCUT)
    pal = q.getpalette()[:18]
    counts = sorted(q.getcolors(), reverse=True)
    total = sum(c for c, _ in counts)
    doms = []
    for ci in range(min(6, len(counts))):
        idx = counts[ci][1]
        r, g, b = pal[idx*3:idx*3+3]
        doms.append({"hex": f"#{r:02x}{g:02x}{b:02x}", "share": round(counts[ci][0]/total, 3)})
    out.append({"frame": os.path.basename(f), "dominant": doms})
print(json.dumps(out, indent=2))
`);
  const { stdout: durOut } = await pexec("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", path.join(DIRS.source, "video.mp4")]);
  const dur = JSON.parse(durOut).format.duration;
  for (let i = 0; i < 8; i++) {
    const t = ((i + 0.5) / 8) * parseFloat(dur);
    try {
      await pexec("ffmpeg", ["-y", "-ss", String(t), "-i", path.join(DIRS.source, "video.mp4"),
        "-frames:v", "1", path.join(DIRS.frames, `pf_${i}.png`)], { maxBuffer: 1 << 26 });
    } catch { /* skip frame */ }
  }
  const { stdout } = await pexec("python3", [script]);
  return JSON.parse(stdout);
}

// ---------- Merge ----------
function merge(meta, chunks, globalRes, palette) {
  const master = {
    generatedAt: new Date().toISOString(),
    source: SOURCE,
    hash: fileHash(path.join(DIRS.source, "video.mp4")),
    metadata: meta,
    globalSummary: globalRes,
    objectivePalette: palette,
    chunks,
  };
  fs.writeFileSync(path.join(DIRS.results, "master.json"), JSON.stringify(master, null, 2));

  const md = [`# Video Visual Analysis — Timeline`, ``,
    `- Source: \`${SOURCE}\``,
    `- Duration: ${meta.duration}s | ${meta.width}x${meta.height} @ ${meta.fps}fps | ${meta.sizeMB}MB`,
    `- Analyzed: ${master.generatedAt} | ${chunks.filter(c => c.status === "ok").length}/${chunks.length} chunks OK`,
    ``, `## Global Design Summary`, ``,
    globalRes.description ?? "_global pass failed_", ``,
    `## Objective Palette (Pillow median-cut over sampled frames)`, ``,
    ...palette.map(p => `- **${p.frame}**: ${p.dominant.map(d => `\`${d.hex}\` (${Math.round(d.share * 100)}%)`).join(", ")}`),
    ``, `## Chunk-by-Chunk Timeline`, ``];
  for (const c of chunks) {
    md.push(`---`, ``, `### Chunk ${c.chunk} — ${c.start}s → ${c.end}s ${c.status === "ok" ? "" : "(FAILED)"}`, ``,
      c.description ?? "_no result_", ``);
  }
  fs.writeFileSync(path.join(DIRS.results, "timeline.md"), md.join("\n"));
  return master;
}

// ---------- Main ----------
async function main() {
  const t0 = Date.now();
  const file = await ensureLocalSource();
  if (!fs.existsSync(path.join(DIRS.source, "video.mp4"))) {
    fs.copyFileSync(file, path.join(DIRS.source, "video.mp4"));
  }
  const meta = await probe(path.join(DIRS.source, "video.mp4"));
  log("Metadata:", JSON.stringify(meta));

  const chunks = await chunkVideo(path.join(DIRS.source, "video.mp4"), meta);
  log(`Split into ${chunks.length} chunks of ~${CHUNK_SEC}s`);

  const chunkResults = await analyzeChunks(chunks);
  const globalRes = await globalPass(meta);
  let palette = [];
  try { palette = await extractPalette(); } catch (e) { log("palette extraction failed:", String(e).slice(0, 120)); }

  merge(meta, chunkResults, globalRes, palette);
  log(`Done in ${((Date.now() - t0) / 1000).toFixed(0)}s. Results: ${path.join(DIRS.results, "master.json")} + timeline.md`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
