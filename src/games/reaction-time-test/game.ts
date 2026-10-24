import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';

const SLUG = 'reaction-time-test';
const ATTEMPTS = 5;
const MIN_WAIT = 1500;
const MAX_WAIT = 5000;
// Taps this soon after a screen change are ignored, so a double tap can't skip a screen by accident.
const GUARD_MS = 250;

type State = 'start' | 'waiting' | 'go' | 'shown' | 'early' | 'paused' | 'result';

const fmtMs = (ms: number) => `${Math.round(ms)} ms`;

function verdict(avg: number): string {
  if (avg < 150) return 'Wait, were you guessing? That is suspiciously fast. ⚡';
  if (avg < 200) return 'Lightning fingers! ⚡';
  if (avg < 250) return 'Cat-like reflexes. 🐱';
  if (avg < 300) return 'Nice and sharp. A solid run.';
  if (avg < 350) return 'Not bad at all. Maybe one more coffee? ☕';
  if (avg < 450) return 'A little sleepy today? 😴';
  return 'Were you checking your phone? 🐌';
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-rt';
  el.innerHTML = `
    <div class="g-rt-pad" tabindex="0" role="button" data-pad>
      <p class="g-rt-icon" data-icon aria-hidden="true"></p>
      <p class="g-rt-big" data-big></p>
      <p class="g-rt-sub" data-sub></p>
      <ol class="g-rt-pips" data-pips aria-label="Your attempts"></ol>
    </div>
    <p class="g-rt-sr" role="status" aria-live="assertive" data-live></p>
    <div class="g-rt-result" data-result hidden></div>`;
  root.append(el);

  const pad = el.querySelector<HTMLElement>('[data-pad]')!;
  const iconEl = el.querySelector<HTMLElement>('[data-icon]')!;
  const bigEl = el.querySelector<HTMLElement>('[data-big]')!;
  const subEl = el.querySelector<HTMLElement>('[data-sub]')!;
  const pipsEl = el.querySelector<HTMLElement>('[data-pips]')!;
  const liveEl = el.querySelector<HTMLElement>('[data-live]')!;
  const resultEl = el.querySelector<HTMLElement>('[data-result]')!;

  let state: State = 'start';
  let times: number[] = [];
  let timer = 0;
  let goAt = 0;
  let changedAt = 0;

  function show(next: State, icon: string, big: string, sub: string, live = `${big} ${sub}`): void {
    state = next;
    changedAt = performance.now();
    el.dataset.state = next;
    iconEl.textContent = icon;
    bigEl.textContent = big;
    subEl.textContent = sub;
    pad.setAttribute('aria-label', `${big}. ${sub}`);
    liveEl.textContent = live;
  }

  function renderPips(): void {
    pipsEl.replaceChildren();
    for (let i = 0; i < ATTEMPTS; i++) {
      const li = document.createElement('li');
      const t = times[i];
      li.className = t != null ? 'is-done' : i === times.length ? 'is-now' : '';
      if (t != null) {
        li.textContent = String(Math.round(t));
        const unit = document.createElement('span');
        unit.className = 'g-rt-unit';
        unit.textContent = ' ms';
        li.append(unit);
      } else {
        li.textContent = `#${i + 1}`;
      }
      pipsEl.append(li);
    }
  }

  function renderStart(): void {
    const best = getBest(SLUG);
    times = [];
    renderPips();
    show(
      'start',
      '⚡',
      'Tap to start',
      best != null
        ? `Your best average: ${fmtMs(best)}. Wait for green, then tap as fast as you can.`
        : 'Wait for green, then tap as fast as you can. Five tries.',
    );
  }

  function wait(): void {
    window.clearTimeout(timer);
    goAt = 0;
    resultEl.hidden = true;
    resultEl.replaceChildren();
    pad.hidden = false;
    renderPips();
    show('waiting', '✋', 'Wait for green…', `Attempt ${times.length + 1} of ${ATTEMPTS}`, 'Wait for green.');
    const delay = MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT);
    timer = window.setTimeout(go, delay);
  }

  function go(): void {
    show('go', '👆', 'TAP!', 'Now now now!', 'Tap now!');
    // Start the clock on the frame that paints the green screen.
    requestAnimationFrame(() => {
      if (state === 'go') goAt = performance.now();
    });
  }

  function hit(at: number): void {
    // A tap before the green frame was painted can't be a reaction to it.
    if (!goAt) {
      tooSoon();
      return;
    }
    const ms = Math.max(1, at - goAt);
    times.push(ms);
    renderPips();
    if (times.length >= ATTEMPTS) {
      finish();
      return;
    }
    show('shown', '⏱️', fmtMs(ms), `Tap to keep going. ${ATTEMPTS - times.length} left.`);
  }

  function tooSoon(): void {
    window.clearTimeout(timer);
    show('early', '🙈', 'Too soon!', 'You tapped before green. Tap to try that one again.');
  }

  function finish(): void {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const fastest = Math.min(...times);
    const { best, isNewBest } = saveBest(SLUG, Math.round(avg), true);

    const extra = document.createElement('div');
    extra.className = 'g-rt-list';
    const list = document.createElement('ol');
    times.forEach((t, i) => {
      const li = document.createElement('li');
      li.textContent = `#${i + 1}: ${fmtMs(t)}`;
      if (t === fastest) li.className = 'is-fast';
      list.append(li);
    });
    const fast = document.createElement('p');
    fast.textContent = `Fastest tap: ${fmtMs(fastest)}`;
    extra.append(list, fast);

    state = 'result';
    el.dataset.state = 'result';
    pad.hidden = true;
    liveEl.textContent = '';
    resultEl.replaceChildren(
      createResultPanel(root, {
        label: 'Your average reaction time',
        score: fmtMs(avg),
        message: verdict(avg),
        best: fmtMs(best),
        isNewBest,
        extra,
        onPlayAgain: () => {
          times = [];
          wait();
          pad.focus({ preventScroll: true });
        },
      }),
    );
    resultEl.hidden = false;
  }

  function act(at: number): void {
    if (performance.now() - changedAt < GUARD_MS && state !== 'go' && state !== 'waiting') return;
    switch (state) {
      case 'start':
      case 'shown':
      case 'early':
      case 'paused':
        wait();
        break;
      case 'waiting':
        tooSoon();
        break;
      case 'go':
        hit(at);
        break;
    }
  }

  // pointerdown fires on first contact, which is fairer than click (which waits for release).
  pad.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button > 0) return;
    e.preventDefault();
    const at = e.timeStamp > 0 && e.timeStamp <= performance.now() ? e.timeStamp : performance.now();
    pad.focus({ preventScroll: true });
    act(at);
  });
  pad.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (e.repeat) return;
    const at = e.timeStamp > 0 && e.timeStamp <= performance.now() ? e.timeStamp : performance.now();
    act(at);
  });
  // Stop long-press menus and text selection on touch screens.
  pad.addEventListener('contextmenu', (e) => e.preventDefault());

  // Switching tabs mid-attempt would make the timing meaningless, so pause instead.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (state === 'waiting' || state === 'go')) {
      window.clearTimeout(timer);
      show('paused', '⏸️', 'Paused', 'Tap to pick up where you left off.');
    }
  });

  renderStart();
}
