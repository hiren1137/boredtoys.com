import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';

const SLUG = 'draw-a-perfect-circle';
type State = 'start' | 'playing' | 'result';
interface Pt {
  x: number;
  y: number;
}

const MAX_MS = 8000;
const MIN_RADIUS = 50;
const DOT_ZONE = 28;
const FULL_TURN = Math.PI * 2;
const ALMOST_FULL = FULL_TURN * 0.94;

const FAILS = {
  close: ['Too close to the dot! Give it some room to breathe.', 'You poked the dot. The dot is upset.'],
  small: ['That is a dot, not a circle. Go bigger!', 'Tiny! Even an ant would want more room.'],
  slow: ['Too slow! The circle fell asleep.', 'Circles are fast. Try it in one smooth swoop.'],
  loop: ['Go all the way around the dot!', 'That is a rainbow, not a circle. Keep going around.'],
};
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

function verdict(score: number): string {
  if (score >= 98) return 'Are you secretly a compass? 🧭';
  if (score >= 95) return 'Wow. Mathematicians are weeping with joy.';
  if (score >= 90) return 'Super round! That is a seriously good circle.';
  if (score >= 80) return 'Nice and round. A little wobble, but nice.';
  if (score >= 70) return 'Round-ish. It has a lot of personality.';
  if (score >= 50) return 'That is more of a potato. 🥔';
  return 'Bold. Abstract. Not a circle. 🎨';
}

/** Arc-length weighted roundness: 100 means every point is the same distance from the center. */
function roundness(points: Pt[], c: Pt): { score: number; mean: number } {
  if (points.length < 3) return { score: 0, mean: 0 };
  let total = 0;
  let sumR = 0;
  const rs: number[] = [];
  const ws: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const w = Math.hypot(b.x - a.x, b.y - a.y) || 0.0001;
    const r = Math.hypot((a.x + b.x) / 2 - c.x, (a.y + b.y) / 2 - c.y);
    rs.push(r);
    ws.push(w);
    total += w;
    sumR += r * w;
  }
  const mean = sumR / total;
  let dev = 0;
  for (let i = 0; i < rs.length; i++) dev += Math.abs(rs[i] - mean) * ws[i];
  dev /= total;
  const score = Math.max(0, Math.min(100, 100 * (1 - (2 * dev) / mean)));
  return { score, mean };
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-circle';
  el.tabIndex = -1;
  const canvas = document.createElement('canvas');
  canvas.className = 'g-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Drawing area. Draw a circle around the dot in the middle.');
  const live = document.createElement('div');
  live.className = 'g-live';
  live.setAttribute('aria-hidden', 'true');
  const hint = document.createElement('div');
  hint.className = 'g-hint';
  const overlay = document.createElement('div');
  overlay.className = 'g-overlay';
  el.append(canvas, live, hint, overlay);
  root.append(el);

  const ctx = canvas.getContext('2d')!;
  let state: State = 'start';
  let w = 0;
  let h = 0;
  let center: Pt = { x: 0, y: 0 };
  let points: Pt[] = [];
  let angle = 0;
  let lastAngle = 0;
  let startTime = 0;
  let pointerId: number | null = null;
  let timer = 0;

  function resize(): void {
    const rect = el.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    center = { x: w / 2, y: h / 2 };
    if (state === 'playing') reset();
    else redraw();
  }

  function colorFor(r: number, mean: number): string {
    if (!mean) return 'hsl(140 70% 38%)';
    const off = Math.min(1, Math.abs(r - mean) / (mean * 0.18));
    return `hsl(${Math.round(140 - off * 140)} 75% ${42 - off * 4}%)`;
  }

  function drawDot(): void {
    ctx.beginPath();
    ctx.arc(center.x, center.y, 7, 0, FULL_TURN);
    ctx.fillStyle = '#1f1a2e';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(center.x, center.y, 13, 0, FULL_TURN);
    ctx.strokeStyle = 'rgba(31,26,46,.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function redraw(): void {
    ctx.clearRect(0, 0, w, h);
    drawDot();
    if (points.length < 2) return;
    const { mean } = roundness(points, center);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const r = Math.hypot(b.x - center.x, b.y - center.y);
      ctx.strokeStyle = colorFor(r, mean);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  function setHint(text: string): void {
    hint.textContent = text;
  }

  function reset(): void {
    points = [];
    angle = 0;
    pointerId = null;
    window.clearTimeout(timer);
    live.textContent = '';
    live.classList.remove('is-shown');
    state = 'start';
    overlay.replaceChildren();
    el.dataset.state = state;
    const best = getBest(SLUG);
    setHint(
      best != null
        ? `Draw a circle around the dot in one stroke. Your best: ${best.toFixed(1)}%`
        : 'Draw a circle around the dot in one stroke',
    );
    redraw();
  }

  function local(e: PointerEvent): Pt {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function begin(e: PointerEvent): void {
    if (pointerId !== null) return;
    if (state === 'result') reset();
    const p = local(e);
    if (Math.hypot(p.x - center.x, p.y - center.y) < DOT_ZONE) {
      fail(pick(FAILS.close));
      return;
    }
    pointerId = e.pointerId;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Capture is a nice-to-have; drawing still works without it.
    }
    state = 'playing';
    el.dataset.state = state;
    setHint('');
    points = [p];
    angle = 0;
    lastAngle = Math.atan2(p.y - center.y, p.x - center.x);
    startTime = performance.now();
    timer = window.setTimeout(() => {
      if (state === 'playing') fail(pick(FAILS.slow));
    }, MAX_MS);
    redraw();
  }

  function move(e: PointerEvent): void {
    if (state !== 'playing' || e.pointerId !== pointerId) return;
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
    for (const ev of events.length ? events : [e]) {
      const p = local(ev);
      const prev = points[points.length - 1];
      if (Math.hypot(p.x - prev.x, p.y - prev.y) < 2) continue;
      if (Math.hypot(p.x - center.x, p.y - center.y) < DOT_ZONE) {
        fail(pick(FAILS.close));
        return;
      }
      points.push(p);
      const a = Math.atan2(p.y - center.y, p.x - center.x);
      let d = a - lastAngle;
      if (d > Math.PI) d -= FULL_TURN;
      if (d < -Math.PI) d += FULL_TURN;
      angle += d;
      lastAngle = a;
      if (Math.abs(angle) >= FULL_TURN) {
        finish();
        return;
      }
    }
    const { score } = roundness(points, center);
    if (points.length > 8) {
      live.textContent = `${score.toFixed(1)}%`;
      live.classList.add('is-shown');
    }
    redraw();
  }

  function end(e: PointerEvent): void {
    if (state !== 'playing' || e.pointerId !== pointerId) return;
    if (Math.abs(angle) >= ALMOST_FULL) finish();
    else fail(pick(FAILS.loop));
  }

  function release(): void {
    window.clearTimeout(timer);
    if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
    pointerId = null;
  }

  function fail(message: string): void {
    release();
    state = 'result';
    el.dataset.state = state;
    live.classList.remove('is-shown');
    redraw();
    const best = getBest(SLUG);
    overlay.replaceChildren(
      createResultPanel(root, {
        label: 'Oops',
        score: '✗',
        message,
        best: best != null ? `${best.toFixed(1)}%` : undefined,
        playAgainLabel: '✏️ Try again',
        onPlayAgain: reset,
        hideShare: true,
      }),
    );
  }

  /** Small copy of the drawing so it stays visible next to the score. */
  function preview(): HTMLCanvasElement {
    let reach = 0;
    for (const p of points) reach = Math.max(reach, Math.abs(p.x - center.x), Math.abs(p.y - center.y));
    const half = reach + 10;
    const size = 96;
    const small = document.createElement('canvas');
    const dpr = canvas.width / w;
    small.width = size * 2;
    small.height = size * 2;
    small.className = 'g-preview';
    small.setAttribute('role', 'img');
    small.setAttribute('aria-label', 'Your circle');
    small
      .getContext('2d')
      ?.drawImage(canvas, (center.x - half) * dpr, (center.y - half) * dpr, half * 2 * dpr, half * 2 * dpr, 0, 0, size * 2, size * 2);
    return small;
  }

  function finish(): void {
    release();
    const elapsed = performance.now() - startTime;
    const { score, mean } = roundness(points, center);
    if (mean < MIN_RADIUS) return fail(pick(FAILS.small));
    if (elapsed > MAX_MS) return fail(pick(FAILS.slow));
    state = 'result';
    el.dataset.state = state;
    const rounded = Math.round(score * 10) / 10;
    live.textContent = `${rounded.toFixed(1)}%`;
    live.classList.add('is-shown');
    redraw();
    const { best, isNewBest } = saveBest(SLUG, rounded);
    overlay.replaceChildren(
      createResultPanel(root, {
        label: 'Your circle is',
        score: `${rounded.toFixed(1)}%`,
        message: verdict(rounded),
        best: `${best.toFixed(1)}%`,
        isNewBest,
        extra: preview(),
        playAgainLabel: '✏️ Draw again',
        onPlayAgain: reset,
      }),
    );
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    begin(e);
  });
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', (e) => {
    if (e.pointerId === pointerId) fail(pick(FAILS.loop));
  });
  el.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'Escape') && state !== 'start') {
      if ((e.target as HTMLElement).closest('button, a') && e.key !== 'Escape') return;
      e.preventDefault();
      reset();
    }
  });

  new ResizeObserver(() => resize()).observe(el);
  resize();
  reset();
}
