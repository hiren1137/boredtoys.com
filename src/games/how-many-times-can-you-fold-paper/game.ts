import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { LANDMARKS, LIGHT_YEAR, type Landmark } from './landmarks';

const SLUG = 'how-many-times-can-you-fold-paper';
const START_M = 0.0001;
const RECORD = 12;
const MAX_FOLDS = 103;
const INK = '#1f1a2e';

const thick = (n: number) => START_M * 2 ** n;

function num(v: number, digits: number): string {
  return Number(v.toFixed(digits)).toLocaleString('en-US', { maximumFractionDigits: digits });
}

function bigWords(v: number): string {
  if (v >= 1e12) return `${num(v / 1e12, 1)} trillion`;
  if (v >= 1e9) return `${num(v / 1e9, 1)} billion`;
  if (v >= 1e6) return `${num(v / 1e6, 1)} million`;
  return num(v, v < 100 ? 2 : 0);
}

export function fmtLen(m: number): string {
  const ly = m / LIGHT_YEAR;
  if (ly >= 0.1) return `${bigWords(ly)} light-year${ly >= 0.995 && ly < 1.005 ? '' : 's'}`;
  if (m < 0.01) return `${num(m * 1000, m < 0.001 ? 2 : 1)} mm`;
  if (m < 1) return `${num(m * 100, 1)} cm`;
  if (m < 1000) return `${num(m, m < 10 ? 2 : 1)} m`;
  const km = m / 1000;
  if (km < 1e6) return `${num(km, km < 100 ? 2 : 0)} km`;
  return `${bigWords(km)} km`;
}

/** 0.1 mm x 2^n, written out exactly in millimeters. */
function exactMm(n: number): string {
  const s = (2n ** BigInt(n)).toString();
  const whole = s.length > 1 ? s.slice(0, -1) : '0';
  const tenth = s.slice(-1);
  return `${BigInt(whole).toLocaleString('en-US')}${tenth === '0' ? '' : `.${tenth}`}`;
}

/** Britney Gallivan's single-direction formula: L = (pi t / 6)(2^n + 4)(2^n - 1). */
const stripNeeded = (n: number) => ((Math.PI * START_M) / 6) * (2 ** n + 4) * (2 ** n - 1);

function lastPassed(n: number): Landmark | null {
  const t = thick(n);
  let best: Landmark | null = null;
  for (const l of LANDMARKS) if (l.size <= t) best = l;
  return best;
}
const nextUp = (n: number) => LANDMARKS.find((l) => l.size > thick(n)) ?? null;

function compareLine(n: number): string {
  const p = lastPassed(n);
  if (!p) return 'Thinner than a credit card. For now.';
  const i = LANDMARKS.indexOf(p);
  const verb = i < 2 ? 'Thicker than' : p.kind === 'tall' ? 'Taller than' : 'Reaches past';
  const x = thick(n) / p.size;
  const times = x < 1.05 ? '' : x < 10 ? ` (${num(x, 1)}×)` : x < 1000 ? ` (${num(x, 0)}×)` : '';
  return `${verb} ${p.name.charAt(0).toLowerCase() + p.name.slice(1)}${times}`;
}

function noteFor(n: number): string {
  if (n === 0) return 'A normal sheet of printer paper is about 0.1 mm thick. Tap Fold to fold it in half.';
  if (n < 7) return 'Every fold doubles the thickness. That is all that ever happens here.';
  if (n === 7) return 'With a normal sheet, real paper usually gets too thick and stubby to fold around here.';
  if (n < RECORD) return 'For years people said paper could not be folded in half more than 7 or 8 times.';
  if (n === RECORD) return 'Real-world record! In 2002 Britney Gallivan folded one 1.2 km strip of paper in half 12 times.';
  if (n >= MAX_FOLDS) return 'Thicker than the observable universe. There is nothing left to compare it to.';
  return `Past the real record of ${RECORD} folds. From here on it is pure math.`;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (k: number) => Math.max(0, Math.min(1, k));
const blend = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(lerp(v, b[i], k)));
const rgb = (a: number[]) => `rgb(${a.join(',')})`;

export function mount(root: HTMLElement): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let n = 0;
  let camLog = Math.log10(thick(0) * 1.8);
  let bounce = 0;
  let raf = 0;
  let last = 0;
  let w = 0;
  let h = 0;
  let open = false;

  const el = document.createElement('div');
  el.className = 'g-paper';
  el.innerHTML = `
    <div class="fp-top">
      <div class="fp-info" aria-live="polite">
        <p class="fp-folds"><span data-n>0</span> <span class="fp-unit" data-unit>folds</span></p>
        <p class="fp-thick" data-thick></p>
        <p class="fp-exact" data-exact></p>
      </div>
      <div class="fp-side">
        <p class="fp-compare" data-compare></p>
        <p class="fp-next" data-next></p>
        <p class="fp-note" data-note></p>
      </div>
    </div>
    <div class="fp-view" data-view>
      <canvas class="fp-canvas" role="img" aria-label="A stack of folded paper next to real objects for scale"></canvas>
    </div>
    <div class="fp-controls">
      <button type="button" class="btn btn--white fp-small" data-unfold aria-keyshortcuts="U">↩ Unfold</button>
      <button type="button" class="btn btn--big btn--pink fp-fold" data-fold aria-keyshortcuts="F">📄 Fold</button>
      <button type="button" class="btn btn--sky fp-small" data-done>✋ I'm done</button>
    </div>
    <div class="fp-over" data-over hidden></div>`;
  root.append(el);

  const canvas = el.querySelector('canvas')!;
  const c = canvas.getContext('2d')!;
  const $ = (s: string) => el.querySelector<HTMLElement>(s)!;
  const nEl = $('[data-n]');
  const unitEl = $('[data-unit]');
  const thickEl = $('[data-thick]');
  const exactEl = $('[data-exact]');
  const compareEl = $('[data-compare]');
  const nextEl = $('[data-next]');
  const noteEl = $('[data-note]');
  const foldBtn = $('[data-fold]') as HTMLButtonElement;
  const unfoldBtn = $('[data-unfold]') as HTMLButtonElement;
  const over = $('[data-over]');
  const view = $('[data-view]');

  function updateText(): void {
    nEl.textContent = String(n);
    unitEl.textContent = n === 1 ? 'fold' : 'folds';
    thickEl.textContent = fmtLen(thick(n));
    exactEl.innerHTML = `0.1 mm × 2<sup>${n}</sup> = ${exactMm(n)} mm`;
    compareEl.textContent = compareLine(n);
    const nx = nextUp(n);
    if (nx) {
      const more = Math.ceil(Math.log2(nx.size / thick(n)) - 1e-9);
      nextEl.textContent = `Next: ${nx.name} (${nx.sizeLabel}), ${more} more fold${more === 1 ? '' : 's'}`;
    } else nextEl.textContent = 'Nothing bigger left to pass.';
    const strip = n > 0 ? ` To really fold it this many times, Gallivan's formula says you'd need a strip at least ${fmtLen(stripNeeded(n))} long.` : '';
    noteEl.textContent = noteFor(n) + strip;
    el.classList.toggle('is-record', n === RECORD);
    foldBtn.disabled = n >= MAX_FOLDS;
    unfoldBtn.disabled = n === 0;
  }

  function fold(dir: 1 | -1): void {
    if (open) return;
    const next = Math.max(0, Math.min(MAX_FOLDS, n + dir));
    if (next === n) return;
    n = next;
    bounce = dir > 0 && !reduce ? 1 : 0;
    updateText();
    kick();
    if (n >= MAX_FOLDS) window.setTimeout(finish, reduce ? 0 : 900);
  }

  function finish(): void {
    if (open) return;
    open = true;
    const { best, isNewBest } = saveBest(SLUG, n);
    const p = lastPassed(n);
    const size = fmtLen(thick(n));
    const keep = document.createElement('div');
    keep.className = 'fp-keep';
    if (n < MAX_FOLDS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--white btn--small';
      b.textContent = '📄 Keep folding';
      b.addEventListener('click', close);
      keep.append(b);
    }
    over.innerHTML = '';
    over.append(
      createResultPanel(root, {
        label: 'You folded your paper',
        score: `${n} ${n === 1 ? 'time' : 'times'}`,
        shareScore: `${n} ${n === 1 ? 'time' : 'times'} (${size} thick${p ? `, past ${p.short}` : ''})`,
        message: p ? `It is now ${size} thick, past ${p.short}.` : `It is ${size} thick. Not even a credit card yet!`,
        best: `${best} ${best === 1 ? 'fold' : 'folds'}`,
        isNewBest: isNewBest && n > 0,
        playAgainLabel: '🔁 Start a new sheet',
        onPlayAgain: () => {
          n = 0;
          close();
          updateText();
          kick();
        },
        extra: keep,
      }),
    );
    over.hidden = false;
  }

  function close(): void {
    open = false;
    over.hidden = true;
    over.innerHTML = '';
    foldBtn.focus({ preventScroll: true });
  }

  // ---------- Drawing ----------
  function resize(): void {
    const r = view.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function kick(): void {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
  }

  function step(now: number): void {
    const dt = Math.min(64, now - last);
    last = now;
    const target = Math.log10(thick(n) * 1.8);
    if (reduce) camLog = target;
    else camLog += (target - camLog) * (1 - Math.exp(-dt / 160));
    bounce = Math.max(0, bounce - dt / 320);
    draw();
    if (Math.abs(target - camLog) > 0.0005 || bounce > 0) raf = requestAnimationFrame(step);
    else {
      camLog = target;
      raf = 0;
      draw();
    }
  }

  function label(text: string, sub: string, x: number, y: number, dark: boolean): void {
    c.textAlign = 'center';
    c.lineJoin = 'round';
    c.font = '800 13px system-ui, -apple-system, Segoe UI, sans-serif';
    c.lineWidth = 4;
    c.strokeStyle = dark ? 'rgba(18,23,51,.85)' : 'rgba(255,253,247,.9)';
    c.fillStyle = dark ? '#f4efe3' : INK;
    const yy = Math.max(34, y);
    c.strokeText(text, x, yy - 16);
    c.fillText(text, x, yy - 16);
    c.font = '600 11.5px system-ui, -apple-system, Segoe UI, sans-serif';
    c.strokeText(sub, x, yy - 3);
    c.fillText(sub, x, yy - 3);
  }

  function draw(): void {
    if (!w || !h) return;
    const groundH = 30;
    const ground = h - groundH;
    const area = ground - 70;
    const span = 10 ** camLog;
    const s = area / span;
    const space = clamp01((camLog - 4.3) / 1.2);
    const desk = clamp01((-0.3 - camLog) / 0.6);
    const dark = space > 0.5;

    const sky = c.createLinearGradient(0, 0, 0, ground);
    sky.addColorStop(0, rgb(blend(blend([207, 238, 255], [255, 248, 236], desk), [18, 23, 51], space)));
    sky.addColorStop(1, rgb(blend(blend([235, 248, 255], [255, 253, 247], desk), [28, 34, 73], space)));
    c.fillStyle = sky;
    c.fillRect(0, 0, w, ground);
    if (space > 0) {
      c.fillStyle = `rgba(255,255,255,${0.7 * space})`;
      for (let i = 0; i < 70; i++) {
        const sx = (i * 137.5) % w;
        const sy = (i * 71.3) % ground;
        c.fillRect(sx, sy, i % 5 ? 1.5 : 2.5, i % 5 ? 1.5 : 2.5);
      }
    }
    c.fillStyle = rgb(blend([107, 227, 168], [224, 180, 138], desk));
    c.fillRect(0, ground, w, groundH);
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, ground);
    c.lineTo(w, ground);
    c.stroke();

    const narrow = w < 520;
    const stackX = w * (narrow ? 0.22 : 0.26);
    const slots = [w * (narrow ? 0.55 : 0.56), w * (narrow ? 0.83 : 0.8)];
    const prev = lastPassed(n);
    const nx = nextUp(n);
    [prev, nx].forEach((l, i) => {
      if (!l) return;
      const x = slots[i];
      const hp = l.size * s;
      if (l.kind === 'far') {
        const y = ground - hp;
        c.setLineDash([5, 6]);
        c.strokeStyle = dark ? 'rgba(244,239,227,.6)' : 'rgba(31,26,46,.45)';
        c.lineWidth = 2;
        c.beginPath();
        if (y > 0) {
          c.moveTo(stackX, y);
          c.lineTo(w, y);
        }
        c.moveTo(x, ground);
        c.lineTo(x, Math.max(0, y));
        c.stroke();
        c.setLineDash([]);
        const iy = Math.max(52, y);
        l.draw(c, x, ground, 0, ground - iy);
        label(l.name, y < 52 ? `↑ ${l.sizeLabel}` : l.sizeLabel, x, iy - 20, dark);
      } else {
        const bw = Math.min(hp * (l.aspect ?? 1), w * (narrow ? 0.26 : 0.2));
        if (hp >= 1.5) l.draw(c, x, ground, Math.max(2, bw), hp);
        else {
          c.fillStyle = INK;
          c.fillRect(x - 6, ground - 2, 12, 2);
        }
        const top = ground - hp;
        label(l.name, hp < 1.5 ? `${l.sizeLabel} (tiny!)` : top < 26 ? `↑ ${l.sizeLabel}` : l.sizeLabel, x, top - 6, dark);
      }
    });

    // The paper stack, squashed a little right after a fold.
    const tPx = thick(n) * s;
    const squash = bounce > 0 ? 1 + Math.sin(bounce * Math.PI) * 0.08 : 1;
    const pw = narrow ? 40 : 52;
    const ph = tPx * squash;
    c.fillStyle = '#fffdf7';
    c.fillRect(stackX - pw / 2, ground - ph, pw, ph);
    const layers = 2 ** n;
    const per = ph / layers;
    c.strokeStyle = 'rgba(31,26,46,.35)';
    c.lineWidth = 1;
    c.beginPath();
    if (per >= 3 && layers <= 64) {
      for (let i = 1; i < layers; i++) {
        const y = ground - i * per;
        c.moveTo(stackX - pw / 2, y);
        c.lineTo(stackX + pw / 2, y);
      }
    } else {
      for (let y = ground - 4; y > Math.max(0, ground - ph); y -= 4) {
        c.moveTo(stackX - pw / 2 + 3, y);
        c.lineTo(stackX + pw / 2 - 3, y);
      }
    }
    c.stroke();
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.strokeRect(stackX - pw / 2, ground - ph, pw, ph);
    label('Your paper', fmtLen(thick(n)), stackX, ground - ph - 6, dark);

    // Ruler for the current zoom level.
    const raw = span * 0.35;
    const p10 = 10 ** Math.floor(Math.log10(raw));
    const nice = [5, 2, 1].map((k) => k * p10).find((v) => v <= raw) ?? p10;
    const rh = nice * s;
    const rx = 14;
    c.strokeStyle = dark ? '#f4efe3' : INK;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(rx, ground);
    c.lineTo(rx, ground - rh);
    c.moveTo(rx - 5, ground - rh);
    c.lineTo(rx + 5, ground - rh);
    c.moveTo(rx - 5, ground - rh / 2);
    c.lineTo(rx + 3, ground - rh / 2);
    c.stroke();
    c.save();
    c.translate(rx + 12, ground - rh / 2);
    c.rotate(-Math.PI / 2);
    c.textAlign = 'center';
    c.font = '700 11px system-ui, -apple-system, Segoe UI, sans-serif';
    c.fillStyle = dark ? '#f4efe3' : INK;
    c.fillText(fmtLen(nice), 0, 0);
    c.restore();
  }

  // ---------- Input ----------
  foldBtn.addEventListener('click', () => fold(1));
  unfoldBtn.addEventListener('click', () => fold(-1));
  $('[data-done]').addEventListener('click', finish);
  document.addEventListener('keydown', (e) => {
    if (open || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable]')) return;
    const k = e.key.toLowerCase();
    if (k === 'f') {
      e.preventDefault();
      fold(1);
    } else if (k === 'u') {
      e.preventDefault();
      fold(-1);
    }
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open && n < MAX_FOLDS) close();
  });

  new ResizeObserver(resize).observe(view);
  updateText();
  resize();
  const best = getBest(SLUG);
  if (best != null && best > 0) noteEl.textContent += ` Your best so far: ${best} folds.`;
}
