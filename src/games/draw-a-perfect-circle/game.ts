import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { buildShareRow, readContext } from '../../lib/share';
import { createSound } from './sound';

const SLUG = 'draw-a-perfect-circle';
type State = 'idle' | 'playing' | 'scored' | 'failed';
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
  close: ['Too close to the dot!', 'You poked the dot. The dot is upset.'],
  small: ['Too small! Go bigger.', 'Tiny! Even an ant wants more room.'],
  slow: ['Too slow! Try one smooth swoop.', 'The circle fell asleep. Go faster!'],
  loop: ['Go all the way around!', 'That is a rainbow, not a circle.'],
};
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

function verdict(score: number): string {
  if (score >= 98) return 'Are you secretly a compass? 🧭';
  if (score >= 95) return 'Mathematicians are weeping with joy.';
  if (score >= 90) return 'Super round!';
  if (score >= 80) return 'Nice and round.';
  if (score >= 70) return 'Round-ish. Lots of personality.';
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

const scoreColor = (score: number) => `hsl(${Math.round(Math.max(0, Math.min(1, (score - 50) / 45)) * 140)} 70% 36%)`;

export function mount(root: HTMLElement): void {
  const sound = createSound();
  const share = readContext(root);

  const el = document.createElement('div');
  el.className = 'g-circle';
  el.tabIndex = -1;
  el.innerHTML = `
    <canvas class="g-canvas" role="img" aria-label="Drawing area. Draw a circle around the dot in the middle."></canvas>
    <div class="g-center" role="status" aria-live="polite">
      <p class="g-score" data-score></p>
      <p class="g-msg" data-msg></p>
      <p class="g-best" data-best></p>
    </div>
    <button type="button" class="g-mute" data-mute></button>
    <div class="g-bar">
      <p class="g-hint" data-hint></p>
      <div class="g-share" data-share hidden></div>
    </div>`;
  root.append(el);

  const canvas = el.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const scoreEl = el.querySelector<HTMLElement>('[data-score]')!;
  const msgEl = el.querySelector<HTMLElement>('[data-msg]')!;
  const bestEl = el.querySelector<HTMLElement>('[data-best]')!;
  const hintEl = el.querySelector<HTMLElement>('[data-hint]')!;
  const shareEl = el.querySelector<HTMLElement>('[data-share]')!;
  const muteBtn = el.querySelector<HTMLButtonElement>('[data-mute]')!;

  let state: State = 'idle';
  let w = 0;
  let h = 0;
  let center: Pt = { x: 0, y: 0 };
  let points: Pt[] = [];
  let angle = 0;
  let lastAngle = 0;
  let startTime = 0;
  let pointerId: number | null = null;
  let timer = 0;
  let lastScore = '';

  function setState(next: State): void {
    state = next;
    el.dataset.state = next;
  }

  function renderMute(): void {
    const muted = sound.isMuted();
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
    muteBtn.setAttribute('aria-pressed', String(muted));
  }

  function bestText(): string {
    const best = getBest(SLUG);
    return best != null ? `Best: ${best.toFixed(1)}%` : '';
  }

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
    const moved = Math.abs(center.x - w / 2) > 1 || Math.abs(center.y - h / 2) > 1;
    center = { x: w / 2, y: h / 2 };
    if (moved && state !== 'idle') idle();
    else redraw();
  }

  function colorFor(r: number, mean: number): string {
    if (!mean) return 'hsl(140 70% 38%)';
    const off = Math.min(1, Math.abs(r - mean) / (mean * 0.18));
    return `hsl(${Math.round(140 - off * 140)} 75% ${42 - off * 4}%)`;
  }

  function redraw(): void {
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.arc(center.x, center.y, 7, 0, FULL_TURN);
    ctx.fillStyle = '#1f1a2e';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(center.x, center.y, 13, 0, FULL_TURN);
    ctx.strokeStyle = 'rgba(31,26,46,.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (points.length < 2) return;
    const { mean } = roundness(points, center);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.globalAlpha = state === 'failed' ? 0.35 : 1;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      ctx.strokeStyle = state === 'failed' ? '#9a93a8' : colorFor(Math.hypot(b.x - center.x, b.y - center.y), mean);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function showText(score: string, msg: string, best: string, color = ''): void {
    scoreEl.textContent = score;
    scoreEl.style.color = color;
    msgEl.textContent = msg;
    bestEl.textContent = best;
  }

  function idle(): void {
    release();
    points = [];
    setState('idle');
    showText('', '', '');
    shareEl.hidden = true;
    hintEl.textContent = getBest(SLUG) != null ? `✏️ Draw a circle around the dot · ${bestText()}` : '✏️ Draw a circle around the dot';
    redraw();
  }

  function local(e: PointerEvent): Pt {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function begin(e: PointerEvent): void {
    if (pointerId !== null) return;
    const p = local(e);
    points = [];
    shareEl.hidden = true;
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
    setState('playing');
    hintEl.textContent = '';
    showText('', '', '');
    points = [p];
    angle = 0;
    lastAngle = Math.atan2(p.y - center.y, p.x - center.x);
    startTime = performance.now();
    timer = window.setTimeout(() => {
      if (state === 'playing') fail(pick(FAILS.slow));
    }, MAX_MS);
    sound.startTone();
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
    if (points.length > 8) {
      const { score } = roundness(points, center);
      scoreEl.textContent = `${score.toFixed(1)}%`;
      scoreEl.style.color = scoreColor(score);
      sound.updateTone(score);
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
    setState('failed');
    sound.fail();
    showText('✗', message, bestText());
    hintEl.textContent = 'Draw again any time';
    redraw();
  }

  function finish(): void {
    release();
    const elapsed = performance.now() - startTime;
    const { score, mean } = roundness(points, center);
    if (mean < MIN_RADIUS) return fail(pick(FAILS.small));
    if (elapsed > MAX_MS) return fail(pick(FAILS.slow));
    setState('scored');
    const rounded = Math.round(score * 10) / 10;
    const { best, isNewBest } = saveBest(SLUG, rounded);
    lastScore = `${rounded.toFixed(1)}%`;
    sound.chime(rounded, isNewBest);
    showText(lastScore, verdict(rounded), isNewBest ? '🏆 New best!' : `Best: ${best.toFixed(1)}%`, scoreColor(rounded));
    hintEl.textContent = 'Draw again any time';
    shareEl.hidden = false;
    redraw();
  }

  shareEl.append(buildShareRow(share, () => lastScore || undefined));
  renderMute();
  muteBtn.addEventListener('click', () => {
    sound.setMuted(!sound.isMuted());
    renderMute();
  });

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
    if ((e.key === 'Escape' || e.key === 'r') && state !== 'idle') {
      e.preventDefault();
      sound.stopTone();
      idle();
    }
  });

  new ResizeObserver(() => resize()).observe(el);
  resize();
  idle();
}
