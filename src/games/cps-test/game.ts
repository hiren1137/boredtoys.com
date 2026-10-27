import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';

const SLUG = 'cps-test';
const MODES = [1, 5, 10, 30, 60] as const;
type Mode = (typeof MODES)[number];
const DEFAULT_MODE: Mode = 5;
// After the timer runs out, ignore input for a moment so a last frantic click can't skip the result.
const COOLDOWN_MS = 700;
const MAX_RIPPLES = 14;

type State = 'ready' | 'playing' | 'cooldown' | 'result';

const bestKey = (mode: Mode) => `${SLUG}-${mode}s`;
const seconds = (mode: Mode) => `${mode} second${mode === 1 ? '' : 's'}`;

function verdict(cps: number): string {
  if (cps >= 14) return 'Is that a hummingbird in your hand? 🐦';
  if (cps >= 10) return 'Turbo fingers! That is seriously fast. ⚡';
  if (cps >= 8) return 'Speedy! Your mouse definitely felt that.';
  if (cps >= 6) return 'Solid clicking with a nice, steady rhythm.';
  if (cps >= 4) return 'Warming up. Try lighter, quicker taps.';
  return 'Calm and collected. Maybe a little too calm. 🐢';
}

export function mount(root: HTMLElement): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = document.createElement('div');
  el.className = 'g-cps';
  el.innerHTML = `
    <div class="g-cps-top">
      <div class="g-cps-modes" role="group" aria-label="Test length">
        ${MODES.map((m) => `<button type="button" class="g-cps-mode" data-mode="${m}" aria-label="${seconds(m)}">${m}s</button>`).join('')}
      </div>
      <p class="g-cps-best" data-best></p>
    </div>
    <div class="g-cps-stats">
      <div><span>Clicks</span><b data-clicks>0</b></div>
      <div><span>Time left</span><b data-left></b></div>
      <div><span>CPS</span><b data-cps>0.00</b></div>
    </div>
    <div class="g-cps-zone" data-zone tabindex="0" role="button" aria-describedby="g-cps-status">
      <p class="g-cps-call" data-call></p>
      <p class="g-cps-sub" data-sub></p>
    </div>
    <p class="g-cps-sr" id="g-cps-status" role="status" aria-live="polite" data-status></p>
    <button type="button" class="btn btn--small btn--white g-cps-restart" data-restart hidden>↺ Restart</button>
    <div class="g-cps-result" data-result hidden></div>`;
  root.append(el);

  const zone = el.querySelector<HTMLElement>('[data-zone]')!;
  const callEl = el.querySelector<HTMLElement>('[data-call]')!;
  const subEl = el.querySelector<HTMLElement>('[data-sub]')!;
  const clicksEl = el.querySelector<HTMLElement>('[data-clicks]')!;
  const leftEl = el.querySelector<HTMLElement>('[data-left]')!;
  const cpsEl = el.querySelector<HTMLElement>('[data-cps]')!;
  const bestEl = el.querySelector<HTMLElement>('[data-best]')!;
  const statusEl = el.querySelector<HTMLElement>('[data-status]')!;
  const restartBtn = el.querySelector<HTMLButtonElement>('[data-restart]')!;
  const resultEl = el.querySelector<HTMLElement>('[data-result]')!;
  const modeBtns = [...el.querySelectorAll<HTMLButtonElement>('[data-mode]')];

  let mode: Mode = DEFAULT_MODE;
  let state: State = 'ready';
  let clicks = 0;
  let startTime = 0;
  let endTimer = 0;
  let cooldownTimer = 0;
  let frame = 0;
  // Bumped on every reset so timers from an earlier round can never touch a new one.
  let round = 0;

  const durationMs = () => mode * 1000;

  function setState(next: State): void {
    state = next;
    el.dataset.state = next;
    const busy = next === 'playing' || next === 'cooldown';
    for (const b of modeBtns) b.disabled = busy;
    restartBtn.hidden = next !== 'playing';
  }

  function renderModes(): void {
    for (const b of modeBtns) b.setAttribute('aria-pressed', String(Number(b.dataset.mode) === mode));
    const best = getBest(bestKey(mode));
    bestEl.textContent = best != null ? `Your best (${mode}s): ${best.toFixed(2)} CPS` : `No ${mode}s best yet`;
  }

  function renderStats(elapsed: number): void {
    clicksEl.textContent = String(clicks);
    leftEl.textContent = `${(Math.max(0, durationMs() - elapsed) / 1000).toFixed(mode === 1 ? 2 : 1)} s`;
    // Live CPS settles quickly; wait a moment so the first click doesn't read as a huge number.
    cpsEl.textContent = elapsed > 250 ? (clicks / (elapsed / 1000)).toFixed(2) : '0.00';
  }

  function reset(): void {
    round += 1;
    window.clearTimeout(endTimer);
    window.clearTimeout(cooldownTimer);
    cancelAnimationFrame(frame);
    clicks = 0;
    setState('ready');
    resultEl.hidden = true;
    resultEl.replaceChildren();
    zone.hidden = false;
    callEl.textContent = 'Click here to start';
    subEl.textContent = `The ${mode}-second timer starts on your first click.`;
    zone.setAttribute('aria-label', `Click zone. Click, tap or press Space to start the ${mode}-second test.`);
    renderModes();
    renderStats(0);
  }

  function tick(): void {
    if (state !== 'playing') return;
    renderStats(performance.now() - startTime);
    frame = requestAnimationFrame(tick);
  }

  function begin(now: number): void {
    const myRound = round;
    clicks = 0;
    startTime = now;
    setState('playing');
    callEl.textContent = 'Click! Click! Click!';
    subEl.textContent = 'Keep going until the timer hits zero.';
    statusEl.textContent = `Go! ${seconds(mode)} on the clock.`;
    endTimer = window.setTimeout(() => {
      if (myRound === round) finish();
    }, durationMs());
    frame = requestAnimationFrame(tick);
  }

  function ripple(x: number, y: number): void {
    zone.classList.remove('is-squish');
    void zone.offsetWidth;
    zone.classList.add('is-squish');
    if (zone.querySelectorAll('.g-cps-ripple').length >= MAX_RIPPLES) return;
    const r = document.createElement('span');
    r.className = 'g-cps-ripple';
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    r.addEventListener('animationend', () => r.remove());
    zone.append(r);
  }

  /** One click, tap or key press. Position is relative to the zone, used for the ripple. */
  function press(x: number, y: number): void {
    const now = performance.now();
    if (state === 'ready') begin(now);
    else if (state !== 'playing') return;
    else if (now - startTime >= durationMs()) {
      // The end timer is a little late; a click after time is up never counts.
      finish();
      return;
    }
    clicks += 1;
    clicksEl.textContent = String(clicks);
    if (!reduceMotion) ripple(x, y);
  }

  function finish(): void {
    if (state !== 'playing') return;
    const myRound = round;
    window.clearTimeout(endTimer);
    cancelAnimationFrame(frame);
    setState('cooldown');
    renderStats(durationMs());
    callEl.textContent = "Time's up!";
    subEl.textContent = '';
    statusEl.textContent = `Time's up. ${clicks} clicks.`;
    cooldownTimer = window.setTimeout(() => {
      if (myRound === round) showResult();
    }, COOLDOWN_MS);
  }

  function showResult(): void {
    setState('result');
    const cps = Math.round((clicks / mode) * 100) / 100;
    const { best, isNewBest } = saveBest(bestKey(mode), cps);
    renderModes();

    resultEl.replaceChildren(
      createResultPanel(root, {
        label: `${clicks} click${clicks === 1 ? '' : 's'} in ${seconds(mode)}`,
        score: `${cps.toFixed(2)} CPS`,
        shareScore: `${cps.toFixed(2)} CPS in ${seconds(mode)}`,
        message: verdict(cps),
        best: `${best.toFixed(2)} CPS`,
        isNewBest,
        hideShare: clicks === 0,
        onPlayAgain: () => {
          reset();
          zone.focus({ preventScroll: true });
        },
      }),
    );
    zone.hidden = true;
    resultEl.hidden = false;
  }

  // Every pointer counts, so each finger on a touch screen is its own click.
  zone.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const r = zone.getBoundingClientRect();
    press(e.clientX - r.left, e.clientY - r.top);
  });
  zone.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    // Holding the key down would auto-repeat, so only fresh presses count.
    if (e.repeat) return;
    press(zone.clientWidth / 2, zone.clientHeight / 2);
  });
  zone.addEventListener('contextmenu', (e) => e.preventDefault());
  zone.addEventListener('dblclick', (e) => e.preventDefault());

  for (const b of modeBtns) {
    b.addEventListener('click', () => {
      if (state === 'playing' || state === 'cooldown') return;
      mode = Number(b.dataset.mode) as Mode;
      reset();
    });
  }
  restartBtn.addEventListener('click', () => {
    reset();
    zone.focus({ preventScroll: true });
  });

  // Leaving the tab mid-round would leave the timer running while nobody can click, so start over.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') reset();
  });

  reset();
}
