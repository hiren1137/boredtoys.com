import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { WORDS } from './words';

const SLUG = 'typing-speed-test';
const DURATIONS = [15, 30, 60] as const;
type Duration = (typeof DURATIONS)[number];
type State = 'ready' | 'running' | 'result';

/** Extra wrong letters allowed past the end of a word, so a stuck key can't wreck the layout. */
const MAX_EXTRA = 8;
/** Live WPM waits this long before showing, so the first keys don't spike it. */
const LIVE_WPM_AFTER_MS = 2000;

interface Word {
  target: string;
  typed: string;
  el: HTMLSpanElement;
}

const bestKey = (d: Duration) => `${SLUG}-${d}s`;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function verdict(wpm: number): string {
  if (wpm >= 100) return 'Lightning hands! Are you secretly three typists? ⚡';
  if (wpm >= 80) return 'Whoa. Your keyboard needs a seatbelt. 🚀';
  if (wpm >= 60) return 'Speedy fingers! Your emails are scared of you. 🏎️';
  if (wpm >= 40) return 'Nice, comfy pace. You and your keyboard are friends. 🚗';
  if (wpm >= 20) return 'Steady and solid. Your fingers are warming up. 🚲';
  return 'Every fast typist started right here. Keep going! 🐢';
}

function shuffled(count: number): string[] {
  const out: string[] = [];
  let last = '';
  while (out.length < count) {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    if (w === last) continue;
    out.push(w);
    last = w;
  }
  return out;
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-type';
  el.dataset.state = 'ready';
  el.innerHTML = `
    <div class="g-type-hud">
      <div class="g-type-chips" role="group" aria-label="Test length">
        ${DURATIONS.map((d) => `<button type="button" class="g-type-chip" data-dur="${d}">${d}s</button>`).join('')}
      </div>
      <div class="g-type-stats">
        <span class="g-type-stat" title="Time left">⏱ <b data-time></b></span>
        <span class="g-type-stat" title="Words per minute">⚡ <b data-wpm>0</b> WPM</span>
      </div>
      <button type="button" class="btn btn--small btn--white g-type-restart" data-restart>↻ Restart</button>
    </div>
    <div class="g-type-box" data-box>
      <div class="g-type-view"><div class="g-type-words" data-words></div></div>
      <input class="g-type-input" data-input type="text" inputmode="text" enterkeyhint="next"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        aria-label="Type the words shown. Press space after each word." />
      <div class="g-type-cover" aria-hidden="true"><span>👆 Tap or click here, then start typing</span></div>
    </div>
    <div class="g-type-foot">
      <p class="g-type-hint" data-hint></p>
      <p class="g-type-best" data-best></p>
    </div>
    <div class="g-type-result" data-result tabindex="-1" hidden></div>`;
  root.append(el);

  const $ = <T extends HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
  const box = $<HTMLElement>('[data-box]');
  const wordsEl = $<HTMLElement>('[data-words]');
  const input = $<HTMLInputElement>('[data-input]');
  const timeEl = $<HTMLElement>('[data-time]');
  const wpmEl = $<HTMLElement>('[data-wpm]');
  const hintEl = $<HTMLElement>('[data-hint]');
  const bestEl = $<HTMLElement>('[data-best]');
  const resultEl = $<HTMLElement>('[data-result]');
  const chips = [...el.querySelectorAll<HTMLButtonElement>('[data-dur]')];

  let duration: Duration = 60;
  let state: State = 'ready';
  let words: Word[] = [];
  let idx = 0;
  let typed = '';
  let totalKeys = 0;
  let correctKeys = 0;
  let startAt = 0;
  let tick = 0;

  const current = () => words[idx];

  function addWords(count: number): void {
    const frag = document.createDocumentFragment();
    for (const target of shuffled(count)) {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = target;
      frag.append(span, ' ');
      words.push({ target, typed: '', el: span });
    }
    wordsEl.append(frag);
  }

  /** Paints one word's letters: correct, wrong, missed or extra, plus the caret on the current word. */
  function paint(w: Word, isCurrent: boolean): void {
    const { target, typed: t } = w;
    w.el.replaceChildren();
    const len = Math.max(target.length, t.length);
    for (let i = 0; i < len; i++) {
      const l = document.createElement('span');
      l.className = 'l';
      if (i >= target.length) {
        l.textContent = t[i];
        l.classList.add('is-extra');
      } else {
        l.textContent = target[i];
        if (i < t.length) l.classList.add(t[i] === target[i] ? 'is-ok' : 'is-bad');
        else if (!isCurrent) l.classList.add('is-missed');
      }
      if (isCurrent && i === t.length) l.classList.add('is-caret');
      w.el.append(l);
    }
    w.el.classList.toggle('is-current', isCurrent);
    w.el.classList.toggle('is-caret-end', isCurrent && t.length >= len);
    w.el.classList.toggle('is-wrong', !isCurrent && t !== target);
  }

  /** Keeps the current word on the second visible line once the first line is used up. */
  function scrollToCurrent(): void {
    const w = current();
    if (!w) return;
    const lineH = parseFloat(getComputedStyle(wordsEl).lineHeight) || w.el.offsetHeight;
    const line = Math.floor((w.el.offsetTop + 1) / lineH);
    const shift = Math.max(0, line - 1) * lineH;
    wordsEl.style.transform = shift ? `translateY(${-shift}px)` : '';
  }

  function counts(): { correctChars: number; rawChars: number; good: number; bad: number } {
    let correctChars = 0;
    let rawChars = 0;
    let good = 0;
    let bad = 0;
    for (let i = 0; i < idx; i++) {
      const w = words[i];
      rawChars += w.typed.length + 1;
      if (w.typed === w.target) {
        correctChars += w.target.length + 1;
        good++;
      } else bad++;
    }
    const cur = current();
    if (cur && typed) {
      rawChars += typed.length;
      if (cur.target.startsWith(typed)) correctChars += typed.length;
    }
    return { correctChars, rawChars, good, bad };
  }

  const perMinute = (chars: number, ms: number) => (ms > 0 ? Math.round(chars / 5 / (ms / 60000)) : 0);

  function renderTime(msLeft: number): void {
    timeEl.textContent = String(Math.max(0, Math.ceil(msLeft / 1000)));
  }

  function renderBest(): void {
    const best = getBest(bestKey(duration));
    bestEl.textContent = best != null ? `Your best (${duration}s): ${best} WPM` : '';
  }

  function renderChips(): void {
    for (const c of chips) c.setAttribute('aria-pressed', String(Number(c.dataset.dur) === duration));
  }

  function setState(next: State): void {
    state = next;
    el.dataset.state = next;
    hintEl.textContent =
      next === 'running'
        ? 'Press space after each word. Esc restarts.'
        : 'The clock starts on your first key. Press space after each word.';
  }

  function reset(): void {
    window.clearInterval(tick);
    words = [];
    idx = 0;
    typed = '';
    totalKeys = 0;
    correctKeys = 0;
    startAt = 0;
    wordsEl.replaceChildren();
    wordsEl.style.transform = '';
    addWords(120);
    paint(current(), true);
    input.value = '';
    input.disabled = false;
    resultEl.hidden = true;
    resultEl.replaceChildren();
    wpmEl.textContent = '0';
    renderTime(duration * 1000);
    renderBest();
    renderChips();
    setState('ready');
  }

  function restart(focus = true): void {
    reset();
    if (focus) input.focus({ preventScroll: true });
  }

  function start(): void {
    startAt = performance.now();
    setState('running');
    tick = window.setInterval(update, 100);
  }

  function update(): void {
    if (state !== 'running') return;
    const elapsed = performance.now() - startAt;
    const left = duration * 1000 - elapsed;
    if (left <= 0) {
      finish();
      return;
    }
    renderTime(left);
    wpmEl.textContent = elapsed >= LIVE_WPM_AFTER_MS ? String(perMinute(counts().correctChars, elapsed)) : '0';
  }

  function commit(): void {
    const w = current();
    w.typed = typed;
    paint(w, false);
    idx++;
    typed = '';
    if (idx > words.length - 40) addWords(60);
    paint(current(), true);
    scrollToCurrent();
  }

  /** Feeds one typed character through the game, counting it as a keystroke. */
  function typeChar(ch: string): void {
    const w = current();
    if (ch === ' ' || ch === '\n') {
      if (!typed) return; // a space before any letters does nothing
      totalKeys++;
      if (typed === w.target) correctKeys++;
      commit();
      return;
    }
    if (typed.length >= w.target.length + MAX_EXTRA) return;
    if (state === 'ready') start();
    totalKeys++;
    if (w.target[typed.length] === ch) correctKeys++;
    typed += ch;
  }

  function onInput(): void {
    if (state === 'result') {
      input.value = '';
      return;
    }
    const value = input.value;
    let common = 0;
    while (common < typed.length && common < value.length && typed[common] === value[common]) common++;
    // Deleting is free; anything new after the shared start counts as fresh keystrokes.
    typed = typed.slice(0, common);
    for (const ch of value.slice(common)) typeChar(ch);
    if (input.value !== typed) input.value = typed;
    current().typed = typed;
    paint(current(), true);
    update();
  }

  function finish(): void {
    window.clearInterval(tick);
    const ms = duration * 1000;
    const { correctChars, rawChars, good, bad } = counts();
    const wpm = perMinute(correctChars, ms);
    const raw = perMinute(rawChars, ms);
    const accuracy = totalKeys ? Math.round((correctKeys / totalKeys) * 100) : 0;
    setState('result');
    input.blur();
    input.disabled = true;
    renderTime(0);
    wpmEl.textContent = String(wpm);

    const { best, isNewBest } = saveBest(bestKey(duration), wpm);
    const extra = document.createElement('dl');
    extra.className = 'g-type-sum';
    const rows: [string, string][] = [
      ['Accuracy', `${accuracy}%`],
      ['Raw speed', `${raw} WPM`],
      ['Words', `${good} ✓ · ${bad} ✗`],
    ];
    for (const [k, v] of rows) {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = v;
      row.append(dt, dd);
      extra.append(row);
    }

    resultEl.replaceChildren(
      createResultPanel(root, {
        label: `Your typing speed (${duration}s test)`,
        score: `${wpm} WPM`,
        message: verdict(wpm),
        best: `${best} WPM`,
        isNewBest: isNewBest && wpm > 0,
        extra,
        hideShare: wpm === 0,
        onPlayAgain: () => restart(),
        // A key still flying when time runs out must not press Play again, so focus the card instead.
        autoFocus: false,
      }),
    );
    resultEl.hidden = false;
    resultEl.focus({ preventScroll: true });
    renderBest();
  }

  input.addEventListener('input', onInput);
  input.addEventListener('paste', (e) => e.preventDefault());
  input.addEventListener('drop', (e) => e.preventDefault());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (typed) typeChar(' ');
      input.value = typed;
      paint(current(), true);
    }
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      restart();
    }
  });
  // Clicking the words (not just the hidden input) still puts the cursor in the box.
  box.addEventListener('pointerdown', (e) => {
    if (e.target !== input && state !== 'result') {
      e.preventDefault();
      input.focus({ preventScroll: true });
    }
  });
  for (const c of chips) {
    c.addEventListener('click', () => {
      duration = Number(c.dataset.dur) as Duration;
      restart();
    });
  }
  $<HTMLButtonElement>('[data-restart]').addEventListener('click', () => restart());
  window.addEventListener('resize', scrollToCurrent);
  document.addEventListener('visibilitychange', () => {
    // Background tabs throttle timers; catch up as soon as the page is visible again.
    if (!document.hidden) update();
  });
  if (reducedMotion()) el.classList.add('is-still');

  reset();
}
