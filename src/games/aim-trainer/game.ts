import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';

const SLUG = 'aim-trainer';
const TOTAL = 30;
const EDGE = 10;
const HUD_H = 46;

type State = 'start' | 'playing' | 'result';

function verdict(avg: number): string {
  if (avg < 300) return 'Lightning wrist! The targets never stood a chance. ⚡';
  if (avg < 380) return 'Sharp shooter. Very quick and very clean. 🎯';
  if (avg < 460) return 'Solid aim. You found a nice rhythm.';
  if (avg < 560) return 'Getting there. Your hand is warming up.';
  if (avg < 700) return 'Steady and careful. Now try a little faster.';
  return 'The targets thank you for taking your time. 🐢';
}

const fmtSec = (ms: number) => `${(ms / 1000).toFixed(2)} s`;

export function mount(root: HTMLElement): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = document.createElement('div');
  el.className = 'g-aim';
  el.innerHTML = `
    <div class="g-aim-field" data-field role="application" aria-label="Aim trainer play area"></div>
    <div class="g-aim-hud" data-hud hidden>
      <span>Left: <b data-left>${TOTAL}</b></span>
      <span>Time: <b data-time>0.00 s</b></span>
      <button type="button" class="btn btn--small btn--white" data-restart aria-label="Restart round">↺ Restart</button>
    </div>
    <div class="g-aim-intro" data-intro>
      <p class="g-aim-title">Hit the target to start</p>
      <p class="g-aim-sub">${TOTAL} targets. Be quick, be accurate.</p>
      <p class="g-aim-best" data-best></p>
    </div>
    <button type="button" class="g-aim-target" data-target><span class="g-aim-rings" aria-hidden="true"></span></button>
    <div class="g-aim-result" data-result hidden></div>`;
  root.append(el);

  const field = el.querySelector<HTMLElement>('[data-field]')!;
  const hud = el.querySelector<HTMLElement>('[data-hud]')!;
  const leftEl = el.querySelector<HTMLElement>('[data-left]')!;
  const timeEl = el.querySelector<HTMLElement>('[data-time]')!;
  const intro = el.querySelector<HTMLElement>('[data-intro]')!;
  const bestEl = el.querySelector<HTMLElement>('[data-best]')!;
  const target = el.querySelector<HTMLButtonElement>('[data-target]')!;
  const resultEl = el.querySelector<HTMLElement>('[data-result]')!;

  let state: State = 'start';
  let hits = 0;
  let misses = 0;
  let startTime = 0;
  let size = 64;
  let pos = { x: 0, y: 0 };
  let ticker = 0;
  // Only move focus to new targets for keyboard players, so mouse and touch rounds show no focus ring.
  let keyboardMode = false;

  function measure(): { w: number; h: number } {
    const w = el.clientWidth;
    const h = el.clientHeight;
    size = Math.round(Math.max(46, Math.min(68, Math.min(w, h) * 0.13)));
    target.style.setProperty('--size', `${size}px`);
    return { w, h };
  }

  function place(x: number, y: number): void {
    pos = { x, y };
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
  }

  function placeCenter(): void {
    const { w, h } = measure();
    place(Math.round((w - size) / 2), Math.round(Math.max(h * 0.55, h / 2) - size / 2));
  }

  function placeRandom(): void {
    const { w, h } = measure();
    const minX = EDGE;
    const maxX = Math.max(minX, w - EDGE - size);
    const minY = HUD_H + EDGE;
    const maxY = Math.max(minY, h - EDGE - size);
    // Keep the next target well away from the last one so every target needs a real move.
    const minJump = Math.max(size * 1.6, Math.min(w, h) * 0.28);
    let best = pos;
    let bestDist = -1;
    for (let i = 0; i < 40; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const d = Math.hypot(x - pos.x, y - pos.y);
      if (d >= minJump) {
        best = { x, y };
        break;
      }
      if (d > bestDist) {
        bestDist = d;
        best = { x, y };
      }
    }
    place(Math.round(best.x), Math.round(best.y));
  }

  function pop(): void {
    if (reduceMotion) return;
    target.classList.remove('is-pop');
    void target.offsetWidth;
    target.classList.add('is-pop');
  }

  function renderStart(focus = false): void {
    state = 'start';
    el.dataset.state = state;
    window.clearInterval(ticker);
    hud.hidden = true;
    intro.hidden = false;
    resultEl.hidden = true;
    resultEl.replaceChildren();
    target.hidden = false;
    target.setAttribute('aria-label', 'Start target. Hit it to begin.');
    const best = getBest(SLUG);
    bestEl.textContent = best != null ? `Your best: ${Math.round(best)} ms per target` : '';
    placeCenter();
    if (focus && keyboardMode) target.focus({ preventScroll: true });
  }

  function updateHud(): void {
    leftEl.textContent = String(TOTAL - hits);
    timeEl.textContent = fmtSec(performance.now() - startTime);
  }

  function begin(): void {
    state = 'playing';
    el.dataset.state = state;
    hits = 0;
    misses = 0;
    startTime = performance.now();
    intro.hidden = true;
    hud.hidden = false;
    updateHud();
    ticker = window.setInterval(updateHud, 100);
    next();
  }

  function next(): void {
    placeRandom();
    target.setAttribute('aria-label', `Target. ${TOTAL - hits} left.`);
    pop();
    if (keyboardMode) target.focus({ preventScroll: true });
  }

  function hit(): void {
    if (state === 'start') {
      begin();
      return;
    }
    if (state !== 'playing') return;
    hits += 1;
    if (hits >= TOTAL) finish();
    else {
      updateHud();
      next();
    }
  }

  function miss(x: number, y: number): void {
    misses += 1;
    const mark = document.createElement('span');
    mark.className = 'g-aim-miss';
    mark.textContent = '✕';
    mark.style.left = `${x}px`;
    mark.style.top = `${y}px`;
    el.append(mark);
    window.setTimeout(() => mark.remove(), reduceMotion ? 250 : 450);
  }

  function finish(): void {
    const total = performance.now() - startTime;
    window.clearInterval(ticker);
    state = 'result';
    el.dataset.state = state;
    hud.hidden = true;
    target.hidden = true;

    const avg = Math.round(total / TOTAL);
    const accuracy = Math.round((hits / (hits + misses)) * 100);
    const { best, isNewBest } = saveBest(SLUG, avg, true);

    const extra = document.createElement('ul');
    extra.className = 'g-aim-stats';
    extra.innerHTML = `
      <li><span>Accuracy</span><b>${accuracy}%</b></li>
      <li><span>Misses</span><b>${misses}</b></li>
      <li><span>Total time</span><b>${fmtSec(total)}</b></li>`;

    let message = verdict(avg);
    if (accuracy < 75) message += ' Lots of misses, so slow down a touch.';

    resultEl.replaceChildren(
      createResultPanel(root, {
        label: 'Average per target',
        score: `${avg} ms`,
        message,
        best: `${Math.round(best)} ms`,
        isNewBest,
        extra,
        onPlayAgain: () => renderStart(true),
      }),
    );
    resultEl.hidden = false;
  }

  // Pointer input covers mouse, pen and touch. Only the primary pointer counts.
  target.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    e.stopPropagation();
    hit();
  });
  // Keyboard presses arrive as clicks with detail 0; pointer clicks were already handled above.
  target.addEventListener('click', (e) => {
    if (e.detail === 0) hit();
  });
  field.addEventListener('pointerdown', (e) => {
    if (state !== 'playing' || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    miss(e.clientX - r.left, e.clientY - r.top);
  });
  el.addEventListener('pointerdown', () => (keyboardMode = false), true);
  el.addEventListener('keydown', () => (keyboardMode = true), true);

  // Holding Enter would fire a click on every key repeat, so only fresh presses count.
  target.addEventListener('keydown', (e) => {
    if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
  });
  el.querySelector('[data-restart]')!.addEventListener('click', () => renderStart(true));

  // Keep the target inside the stage if the screen is resized or rotated mid-round.
  new ResizeObserver(() => {
    if (state === 'start') placeCenter();
    else if (state === 'playing') {
      const { w, h } = measure();
      place(
        Math.round(Math.min(Math.max(EDGE, pos.x), Math.max(EDGE, w - EDGE - size))),
        Math.round(Math.min(Math.max(HUD_H + EDGE, pos.y), Math.max(HUD_H + EDGE, h - EDGE - size))),
      );
    }
  }).observe(el);

  renderStart();
}
