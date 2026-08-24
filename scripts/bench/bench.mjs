#!/usr/bin/env node
// Bardo OS interaction benchmark — a development instrument, not part of
// the app, not part of CI, and not deployed. It needs Playwright, which
// is installed in a scratch directory outside this repository (the repo
// itself stays dependency-free — docs/architecture.md §2).
//
//   npm install playwright            # in a scratch dir
//   node scripts/bench/bench.mjs --root . --runs 15
//
// What it measures, and why each one:
//
//   handlerMs  the click handler's own synchronous cost, forced layouts
//              included. This is the number a reader feels as "the
//              button is stuck".
//   settleMs   t0 → the frame that actually paints the change.
//   driftPx    THE metric, and worth being careful about. Not scrollY:
//              scrollY holding still while the text reflows under it is
//              exactly how a reader loses their place. Nor an element's
//              top edge, which was tried first and is also wrong — one
//              address block runs eight hundred pixels, so its top can
//              hold perfectly still while every line inside it slides.
//              What is tracked is a *line of text*: a fraction of the
//              way through a named run of Tibetan or English in a named
//              block. That identity survives a re-render, so a version
//              that rebuilds the DOM is measured exactly like one that
//              does not — the run is re-found by block id, never held
//              as a node reference.
//   sameNode   whether the block element is the identical DOM node
//              afterwards. Proves a control did not re-render.
//
// Every run gets a fresh page (fresh localStorage, fresh caches, fresh
// font state) and the CPU is throttled, because the reader this app is
// for is on an old phone.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

const ROOT = resolve(arg('root', '.'));
const RUNS = Number(arg('runs', 15));
const PORT = Number(arg('port', 8321));
const THROTTLE = Number(arg('throttle', 6));
const LABEL = arg('label', ROOT);
const TEXT = arg('text', 'bardo-thodrol.becoming-intro');
const CHROME = arg('chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');

// The viewport is a phone on purpose: a narrow measure means more line
// boxes per block, which is where reflow actually costs something.
const VIEWPORT = { width: 412, height: 915 };
const READER_LINE = 200; // the viewport y we call "where the reader is"

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const p = (xs, q) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

// ── The page-side probe ─────────────────────────────────────────────
// Runs in one task with the click so t0 and the handler are not split
// by the driver's own round-trip.
const PROBE = `async (sel) => {
  const LINE = ${READER_LINE};
  const kindOf = (el) => el.classList.contains('bo') ? 'bo'
    : el.classList.contains('phon') ? 'phon' : 'en';

  // The line of text at a given height on the screen, named in a way
  // that survives the DOM being rebuilt under it.
  const lineAt = (y) => {
    const reader = document.getElementById('reader');
    const rr = reader.getBoundingClientRect();
    const x = Math.round(rr.left + rr.width / 2);
    for (const node of document.elementsFromPoint(x, y)) {
      const field = node.closest
        ? node.closest('#reader .bo, #reader .phon, #reader .en') : null;
      if (!field) continue;
      const block = field.closest('[data-block-id]');
      if (!block) continue;
      const r = field.getBoundingClientRect();
      if (!(r.height > 0)) continue;
      return { node: field, id: block.dataset.blockId, kind: kindOf(field),
               frac: Math.min(1, Math.max(0, (y - r.top) / r.height)), y };
    }
    return null;
  };
  const nowAt = (m) => {
    const block = document.querySelector(
      '#reader [data-block-id="' + CSS.escape(m.id) + '"]');
    const field = block && block.querySelector('.' + m.kind);
    if (!field) return null;
    const r = field.getBoundingClientRect();
    return r.height > 0 ? r.top + m.frac * r.height : null;
  };
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  await frame();
  const before = lineAt(LINE);
  if (!before) return null;

  const btn = document.querySelector(sel);
  if (!btn) return null;

  const t0 = performance.now();
  btn.click();
  const handlerMs = performance.now() - t0;
  void document.body.offsetHeight;          // flush: attribute the layout here
  const layoutMs = performance.now() - t0;
  await frame();
  const settleMs = performance.now() - t0;

  const early = nowAt(before);
  const driftFrame = early === null ? null : Math.abs(early - before.y);

  await new Promise((r) => setTimeout(r, 600)); // let any convergence finish
  const late = nowAt(before);
  const driftSettled = late === null ? null : Math.abs(late - before.y);

  const block = document.querySelector(
    '#reader [data-block-id="' + CSS.escape(before.id) + '"]');
  return {
    handlerMs, layoutMs, settleMs, driftFrame, driftSettled,
    // Node identity: is the reader's own run of text the identical DOM
    // node it was, or did a control rebuild the page under them?
    sameNode: Boolean(block) && block.querySelector('.' + before.kind) === before.node,
    stillThere: Boolean(block),
  };
}`;

async function serve(root, port) {
  const proc = spawn('python3', ['-m', 'http.server', String(port), '-d', root], {
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/index.html`);
      if (r.ok) return proc;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error(`server never came up on ${port}`);
}

async function openReader(context, url) {
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#intro', { state: 'detached', timeout: 15000 })
    .catch(() => {});
  return { page, cdp };
}

// Land on the long text, scrolled to a real reading position.
async function intoText(page) {
  await page.waitForSelector('.nav-cat', { state: 'attached', timeout: 15000 });
  await page.evaluate((id) => {
    const btn = [...document.querySelectorAll('.nav .nav-text')]
      .find((b) => b.dataset.textId === id);
    if (!btn) throw new Error('text not in nav: ' + id);
    btn.click();
  }, TEXT);
  await page.waitForSelector('#reader [data-block-id]', { state: 'attached', timeout: 15000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 250)));
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));
}

// ── First render: navigation into the long text ─────────────────────
async function measureFirstRender(context, url) {
  const { page } = await openReader(context, url);
  await page.waitForSelector('.nav-cat', { state: 'attached', timeout: 15000 });
  const ms = await page.evaluate(async (id) => {
    const btn = [...document.querySelectorAll('.nav .nav-text')]
      .find((b) => b.dataset.textId === id);
    const t0 = performance.now();
    btn.click();
    // openText is async (fetch); wait for blocks, then for the paint.
    await new Promise((resolve) => {
      const tick = () => {
        if (document.querySelector('#reader [data-block-id]')) resolve();
        else requestAnimationFrame(tick);
      };
      tick();
    });
    void document.body.offsetHeight;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return performance.now() - t0;
  }, TEXT);
  await page.close();
  return ms;
}

async function measureControl(context, url, selector) {
  const { page } = await openReader(context, url);
  await intoText(page);
  const out = await page.evaluate(new Function('return ' + PROBE)(), selector);
  await page.close();
  return out;
}

const CONTROLS = [
  ['zoom in   (#btnLarger)', '#btnLarger'],
  ['zoom out  (#btnSmaller)', '#btnSmaller'],
  ['lang TIB  (#btnBo)', '#btnBo'],
  ['lang ENG  (#btnEn)', '#btnEn'],
  ['voice     (#btnVoice)', '#btnVoice'],
  ['help      (#btnHelp)', '#btnHelp'],
];

// The auto-scroll engine's own cost per frame. This is the one number
// that is paid continuously rather than on a tap: it runs for as long as
// someone is reading aloud.
const SCROLL_PROBE = `async () => {
  const frames = [];
  document.getElementById('btnPlay').click();
  await new Promise((resolve) => {
    let last = performance.now();
    let n = 0;
    const tick = (ts) => {
      frames.push(ts - last);
      last = ts;
      if (++n >= 90) resolve(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  document.getElementById('btnPlay').click();
  const kept = frames.slice(5).sort((a, b) => a - b);
  return {
    frameMs: kept[kept.length >> 1],
    worstMs: kept[kept.length - 1],
    over32: kept.filter((f) => f > 32).length,
  };
}`;

async function main() {
  const { chromium } = require('playwright');
  const server = await serve(ROOT, PORT);
  const url = `http://127.0.0.1:${PORT}/index.html`;
  const browser = await chromium.launch({ executablePath: CHROME });

  const results = {};
  try {
    for (const [name, sel] of CONTROLS) {
      const rows = [];
      for (let i = 0; i < RUNS; i++) {
        // Fresh context per run: fresh localStorage, fresh SW, fresh cache.
        const context = await browser.newContext({
          viewport: VIEWPORT,
          reducedMotion: 'reduce',
          deviceScaleFactor: 2,
        });
        const r = await measureControl(context, url, sel);
        await context.close();
        if (r) rows.push(r);
      }
      results[name] = rows;
      process.stderr.write(`  ${name}: ${rows.length}/${RUNS}\n`);
    }

    {
      const rows = [];
      for (let i = 0; i < RUNS; i++) {
        const context = await browser.newContext({
          viewport: VIEWPORT, reducedMotion: 'reduce', deviceScaleFactor: 2,
        });
        const { page } = await openReader(context, url);
        await intoText(page);
        rows.push(await page.evaluate(new Function('return ' + SCROLL_PROBE)()));
        await page.close();
        await context.close();
      }
      results['auto-scroll frame'] = rows;
      process.stderr.write(`  auto-scroll frame: ${rows.length}/${RUNS}\n`);
    }

    const firsts = [];
    for (let i = 0; i < RUNS; i++) {
      const context = await browser.newContext({
        viewport: VIEWPORT, reducedMotion: 'reduce', deviceScaleFactor: 2,
      });
      firsts.push(await measureFirstRender(context, url));
      await context.close();
    }
    results['first render (open text)'] = firsts.map((ms) => ({ settleMs: ms }));
    process.stderr.write(`  first render: ${firsts.length}/${RUNS}\n`);
  } finally {
    await browser.close();
    server.kill();
  }

  const report = { label: LABEL, runs: RUNS, throttle: THROTTLE, viewport: VIEWPORT, rows: {} };
  for (const [name, rows] of Object.entries(results)) {
    const num = (k) => rows.map((r) => r[k]).filter((v) => typeof v === 'number');
    const entry = { n: rows.length };
    for (const k of ['handlerMs', 'layoutMs', 'settleMs', 'driftFrame',
      'driftSettled', 'frameMs', 'worstMs', 'over32']) {
      const xs = num(k);
      if (xs.length) entry[k] = { median: +median(xs).toFixed(2), p90: +p(xs, 0.9).toFixed(2) };
    }
    if (rows.some((r) => 'sameNode' in r)) {
      entry.sameNode = `${rows.filter((r) => r.sameNode).length}/${rows.length}`;
      entry.stillThere = `${rows.filter((r) => r.stillThere).length}/${rows.length}`;
    }
    report.rows[name] = entry;
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
