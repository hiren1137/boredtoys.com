import './game.css';
import { getJSON, setJSON } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { LEVELS, type LevelCtx } from './levels';

const SLUG = 'im-not-a-robot-game';
const PROGRESS_KEY = `progress:${SLUG}`;
const BEST_KEY = `record:${SLUG}`;
const TOTAL = LEVELS.length;

type State = 'start' | 'playing' | 'result';
interface Progress {
  level: number;
  elapsed: number;
  fails: number;
}
interface BestRecord {
  maxLevel: number;
  fastest: number | null;
}

function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
}

function readProgress(): Progress | null {
  const p = getJSON<Progress | null>(PROGRESS_KEY, null);
  if (!p || typeof p.level !== 'number' || p.level < 1 || p.level >= TOTAL) return null;
  return { level: Math.floor(p.level), elapsed: Math.max(0, Number(p.elapsed) || 0), fails: Math.max(0, Number(p.fails) || 0) };
}

function readRecord(): BestRecord {
  const r = getJSON<Partial<BestRecord> | null>(BEST_KEY, null);
  return {
    maxLevel: typeof r?.maxLevel === 'number' ? r.maxLevel : 0,
    fastest: typeof r?.fastest === 'number' ? r.fastest : null,
  };
}

const SHIELD = `<svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true"><path d="M20 3l14 5v10c0 9-6 16-14 19C12 34 6 27 6 18V8z" fill="#6cc8ff" stroke="#1f1a2e" stroke-width="3" stroke-linejoin="round"/><path d="M13 20l5 5 9-10" fill="none" stroke="#1f1a2e" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-robot';
  root.append(el);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  let state: State = 'start';
  let level = 0;
  let fails = 0;
  let levelFails = 0;
  let elapsed = 0;
  let lastTick = 0;
  let ticker = 0;
  let token = 0;
  let locked = false;
  let cleanups: (() => void)[] = [];

  let card: HTMLElement;
  let promptEl: HTMLElement;
  let bodyEl: HTMLElement;
  let verifyBtn: HTMLButtonElement;
  let statusEl: HTMLElement;
  let hintEl: HTMLElement;
  let levelEl: HTMLElement;
  let timeEl: HTMLElement;
  let verifyFn: (() => void) | null = null;

  const saveProgress = () => setJSON(PROGRESS_KEY, { level, elapsed: Math.round(elapsed), fails });
  const clearProgress = () => setJSON(PROGRESS_KEY, null);

  function runCleanups(): void {
    for (const fn of cleanups) fn();
    cleanups = [];
  }

  function tick(): void {
    const now = performance.now();
    elapsed += now - lastTick;
    lastTick = now;
    if (timeEl) timeEl.textContent = formatTime(elapsed);
  }

  function startClock(): void {
    lastTick = performance.now();
    clearInterval(ticker);
    ticker = window.setInterval(() => {
      tick();
    }, 250);
  }

  function stopClock(): void {
    if (ticker) tick();
    clearInterval(ticker);
    ticker = 0;
  }

  function renderStart(): void {
    state = 'start';
    el.dataset.state = state;
    const saved = readProgress();
    const rec = readRecord();
    const bestLine =
      rec.fastest != null
        ? `<p class="rb-best">Your fastest full clear: ${formatTime(rec.fastest)}</p>`
        : rec.maxLevel > 0
          ? `<p class="rb-best">Your best so far: ${rec.maxLevel} of ${TOTAL} levels</p>`
          : '';
    el.innerHTML = `
      <div class="rb-start">
        <div class="rb-start-badge">${SHIELD}<span>Human check</span></div>
        <p class="rb-big">Prove you are not a robot.</p>
        <p>${TOTAL} checks stand between you and freedom. Each one gets a little stranger. Pass a check to unlock the next one.</p>
        ${bestLine}
        <div class="rb-start-actions">
          ${
            saved
              ? `<button type="button" class="btn btn--big btn--mint" data-resume>▶ Continue at level ${saved.level + 1}</button>
                 <button type="button" class="btn btn--white" data-new>Start over</button>`
              : `<button type="button" class="btn btn--big btn--mint" data-new>🤖 Begin verification</button>`
          }
        </div>
        ${saved ? `<p class="rb-small">Time so far: ${formatTime(saved.elapsed)}</p>` : ''}
      </div>`;
    el.querySelector('[data-new]')?.addEventListener('click', () => begin(null));
    el.querySelector('[data-resume]')?.addEventListener('click', () => begin(readProgress()));
  }

  function begin(from: Progress | null): void {
    level = from?.level ?? 0;
    elapsed = from?.elapsed ?? 0;
    fails = from?.fails ?? 0;
    state = 'playing';
    el.dataset.state = state;
    el.innerHTML = `
      <div class="rb-play">
        <div class="rb-top">
          <span class="rb-pill" data-level></span>
          <span class="rb-pill rb-pill--time" aria-label="Time" data-time>0s</span>
          <button type="button" class="btn btn--small btn--white" data-quit>🏳️ Give up</button>
        </div>
        <section class="rb-card" data-card aria-labelledby="rb-prompt">
          <div class="rb-head">
            <p class="rb-kicker">Select, type or tap to verify</p>
            <h2 class="rb-prompt" id="rb-prompt" tabindex="-1" data-prompt></h2>
          </div>
          <div class="rb-body" data-body></div>
          <div class="rb-foot">
            <span class="rb-brand">${SHIELD}<span>BeepCheck</span></span>
            <button type="button" class="btn btn--sky" data-verify>Verify</button>
          </div>
        </section>
        <p class="rb-status" role="status" data-status></p>
        <p class="rb-hint" data-hint></p>
      </div>`;
    const $ = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
    card = $('[data-card]');
    promptEl = $('[data-prompt]');
    bodyEl = $('[data-body]');
    verifyBtn = $<HTMLButtonElement>('[data-verify]');
    statusEl = $('[data-status]');
    hintEl = $('[data-hint]');
    levelEl = $('[data-level]');
    timeEl = $('[data-time]');
    verifyBtn.addEventListener('click', () => verifyFn?.());
    $('[data-quit]').addEventListener('click', () => finish(false));
    timeEl.textContent = formatTime(elapsed);
    levelFails = 0;
    startClock();
    renderLevel();
  }

  function renderLevel(failMsg = ''): void {
    runCleanups();
    token += 1;
    const my = token;
    locked = false;
    const def = LEVELS[level];
    levelEl.textContent = `Level ${level + 1} / ${TOTAL}`;
    promptEl.textContent = def.prompt;
    bodyEl.replaceChildren();
    statusEl.textContent = failMsg;
    statusEl.className = failMsg ? 'rb-status is-bad' : 'rb-status';
    hintEl.textContent = levelFails > 0 ? `💡 Hint: ${def.hint}` : '';
    verifyFn = null;
    verifyBtn.hidden = false;
    verifyBtn.textContent = 'Verify';

    const ctx: LevelCtx = {
      body: bodyEl,
      setPrompt: (t) => {
        if (my === token) promptEl.textContent = t;
      },
      setVerify: (fn, label = 'Verify') => {
        if (my !== token) return;
        verifyFn = fn;
        verifyBtn.hidden = !fn;
        verifyBtn.textContent = label;
      },
      pass: (msg) => {
        if (my === token && !locked) pass(msg);
      },
      fail: (msg) => {
        if (my === token && !locked) fail(msg);
      },
      later: (fn, ms) => {
        const id = window.setTimeout(() => {
          if (my === token) fn();
        }, ms);
        cleanups.push(() => clearTimeout(id));
      },
      frame: (fn) => {
        let raf = 0;
        const loop = (now: number) => {
          if (my !== token) return;
          if (fn(now)) raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        cleanups.push(() => cancelAnimationFrame(raf));
      },
      onCleanup: (fn) => cleanups.push(fn),
    };
    def.render(ctx);

    if (!coarse) {
      const first = bodyEl.querySelector<HTMLElement>('input, button, [tabindex="0"]');
      (first ?? promptEl).focus({ preventScroll: true });
    }
  }

  function pass(msg?: string): void {
    locked = true;
    verifyFn = null;
    statusEl.textContent = `✅ ${msg ?? 'Verified. You seem human enough.'}`;
    statusEl.className = 'rb-status is-good';
    card.classList.add('is-pass');
    bodyEl.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input').forEach((b) => (b.disabled = true));
    level += 1;
    levelFails = 0;
    const done = level >= TOTAL;
    if (!done) saveProgress();
    const my = token;
    window.setTimeout(
      () => {
        if (my !== token || state !== 'playing') return;
        card.classList.remove('is-pass');
        if (done) finish(true);
        else renderLevel();
      },
      reduceMotion ? 700 : 1000,
    );
  }

  function fail(msg: string): void {
    fails += 1;
    levelFails += 1;
    saveProgress();
    renderLevel(`❌ ${msg}`);
    if (!reduceMotion) {
      card.classList.remove('is-shake');
      void card.offsetWidth;
      card.classList.add('is-shake');
    }
  }

  function finish(cleared: boolean): void {
    stopClock();
    runCleanups();
    token += 1;
    state = 'result';
    el.dataset.state = state;
    clearProgress();
    const levels = cleared ? TOTAL : level;
    const rec = readRecord();
    const prevMax = rec.maxLevel;
    const prevFast = rec.fastest;
    const next: BestRecord = {
      maxLevel: Math.max(rec.maxLevel, levels),
      fastest: cleared && (rec.fastest == null || elapsed < rec.fastest) ? Math.round(elapsed) : rec.fastest,
    };
    setJSON(BEST_KEY, next);
    const isNewBest = cleared ? prevFast == null || elapsed < prevFast : levels > prevMax;
    const time = formatTime(elapsed);

    const extra = document.createElement('ul');
    extra.className = 'rb-stats';
    extra.innerHTML = `
      <li><strong>${levels}</strong> of ${TOTAL} levels cleared</li>
      <li><strong>${time}</strong> on the clock</li>
      <li><strong>${fails}</strong> failed ${fails === 1 ? 'attempt' : 'attempts'}</li>`;

    const message = cleared
      ? fails === 0
        ? 'Not one mistake. Honestly, that is a little suspicious.'
        : 'Verified! You are officially, certifiably human. Probably.'
      : levels === 0
        ? 'You gave up before the first box. Very robot of you.'
        : `You made it to level ${levels + 1} before the machines won.`;

    const best = next.fastest != null ? `${formatTime(next.fastest)} full clear` : `${next.maxLevel} of ${TOTAL} levels`;

    el.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'rb-result';
    wrap.append(
      createResultPanel(root, {
        label: cleared ? 'All checks passed in' : 'Levels cleared',
        score: cleared ? time : `${levels} / ${TOTAL}`,
        shareScore: cleared ? `all ${TOTAL} levels in ${time}` : `${levels} of ${TOTAL} levels in ${time}`,
        message,
        best,
        isNewBest,
        extra,
        playAgainLabel: '🔁 Verify again',
        onPlayAgain: () => begin(null),
      }),
    );
    el.append(wrap);
  }

  window.addEventListener('pagehide', () => {
    if (state === 'playing') {
      tick();
      saveProgress();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (state !== 'playing') return;
    if (document.hidden) {
      tick();
      saveProgress();
    }
  });

  renderStart();
}
