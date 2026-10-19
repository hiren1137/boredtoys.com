import './game.css';
import { getJSON, setJSON } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { LEVELS, type SiteCtx } from './levels';

const SLUG = 'dark-patterns-game';
const BEST_KEY = `record:${SLUG}`;
const TOTAL = LEVELS.length;

type State = 'start' | 'site' | 'lesson' | 'result';
interface Run {
  levels: number;
  mistakes: number;
  time: number;
}

function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
}

function isBetter(a: Run, b: Run | null): boolean {
  if (!b) return true;
  if (a.levels !== b.levels) return a.levels > b.levels;
  if (a.mistakes !== b.mistakes) return a.mistakes < b.mistakes;
  return a.time < b.time;
}

function readBest(): Run | null {
  const r = getJSON<Run | null>(BEST_KEY, null);
  return r && typeof r.levels === 'number' && typeof r.mistakes === 'number' && typeof r.time === 'number' ? r : null;
}

const describe = (r: Run) =>
  `${r.levels}/${TOTAL} sites, ${r.mistakes} ${r.mistakes === 1 ? 'mistake' : 'mistakes'}, ${formatTime(r.time)}`;

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-dark';
  root.append(el);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let state: State = 'start';
  let level = 0;
  let done = 0;
  let mistakes = 0;
  let levelMistakes = 0;
  let elapsed = 0;
  let lastTick = 0;
  let ticker = 0;
  let token = 0;
  let cleanups: (() => void)[] = [];
  const log: { pattern: string; ok: boolean; mistakes: number }[] = [];

  let timeEl: HTMLElement | null = null;
  let toastTimer = 0;

  function setState(s: State): void {
    state = s;
    el.dataset.state = s;
  }

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
    ticker = window.setInterval(tick, 250);
  }
  function stopClock(): void {
    if (ticker) tick();
    clearInterval(ticker);
    ticker = 0;
  }

  function renderStart(): void {
    setState('start');
    const best = readBest();
    el.innerHTML = `
      <div class="dp-start">
        <p class="dp-kicker">${TOTAL} sneaky fake websites</p>
        <p class="dp-big">Can you outsmart the tricks?</p>
        <p>Each level is a pretend website with one simple task, like closing a pop-up or cancelling a trial. The sites will try to trick you. Finish the task without falling for it.</p>
        ${best ? `<p class="dp-best">Your best run: ${describe(best)}</p>` : ''}
        <button type="button" class="btn btn--big btn--mint" data-start>🕵️ Start level 1</button>
        <p class="dp-note">All brands here are made up. Nothing is bought, sent or shared.</p>
      </div>`;
    el.querySelector('[data-start]')?.addEventListener('click', begin);
  }

  function begin(): void {
    level = 0;
    done = 0;
    mistakes = 0;
    elapsed = 0;
    log.length = 0;
    renderSite();
  }

  function renderSite(): void {
    runCleanups();
    token += 1;
    const my = token;
    setState('site');
    levelMistakes = 0;
    const def = LEVELS[level];
    el.innerHTML = `
      <div class="dp-play">
        <div class="dp-top">
          <span class="dp-pill">Level ${level + 1} / ${TOTAL}</span>
          <span class="dp-pill dp-pill--bad" data-mistakes>❌ ${mistakes}</span>
          <span class="dp-pill dp-pill--time" data-time aria-label="Time">${formatTime(elapsed)}</span>
          <button type="button" class="btn btn--small btn--white" data-skip>Skip ⏭</button>
        </div>
        <p class="dp-task"><span>Your task</span><strong></strong></p>
        <div class="dp-browser">
          <div class="dp-chrome" aria-hidden="true">
            <span class="dp-dots"><i></i><i></i><i></i></span>
            <span class="dp-url"></span>
            <span class="dp-fake">FAKE SITE</span>
          </div>
          <div class="dp-site" data-site role="region"></div>
          <p class="dp-toast" data-toast role="status" aria-live="assertive"></p>
        </div>
      </div>`;
    (el.querySelector('.dp-task strong') as HTMLElement).textContent = def.task;
    (el.querySelector('.dp-url') as HTMLElement).textContent = `🔒 ${def.domain}`;
    const site = el.querySelector('[data-site]') as HTMLElement;
    site.setAttribute('aria-label', `Pretend website: ${def.brand}`);
    timeEl = el.querySelector('[data-time]');
    el.querySelector('[data-skip]')?.addEventListener('click', () => {
      if (my === token) finishLevel(false);
    });
    startClock();

    const ctx: SiteCtx = {
      site,
      mistake: (msg) => {
        if (my !== token || state !== 'site') return;
        mistakes += 1;
        levelMistakes += 1;
        const m = el.querySelector('[data-mistakes]');
        if (m) m.textContent = `❌ ${mistakes}`;
        toast(msg);
      },
      complete: () => {
        if (my !== token || state !== 'site') return;
        finishLevel(true);
      },
      later: (fn, ms) => {
        const id = window.setTimeout(() => my === token && fn(), ms);
        cleanups.push(() => clearTimeout(id));
      },
      every: (fn, ms) => {
        const id = window.setInterval(() => my === token && fn(), ms);
        cleanups.push(() => clearInterval(id));
      },
    };
    def.render(ctx);
  }

  function toast(msg: string): void {
    const t = el.querySelector('[data-toast]') as HTMLElement | null;
    if (!t) return;
    t.textContent = `Oops! ${msg}`;
    t.classList.remove('is-on');
    void t.offsetWidth;
    t.classList.add('is-on');
    if (!reduceMotion) {
      const b = el.querySelector('.dp-browser');
      b?.classList.remove('is-shake');
      void (b as HTMLElement | null)?.offsetWidth;
      b?.classList.add('is-shake');
    }
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => t.classList.remove('is-on'), 2800);
  }

  function finishLevel(ok: boolean): void {
    stopClock();
    runCleanups();
    token += 1;
    const my = token;
    setState('lesson');
    if (ok) done += 1;
    const def = LEVELS[level];
    log.push({ pattern: def.pattern, ok, mistakes: levelMistakes });
    const show = () => {
      if (my !== token) return;
      const last = level + 1 >= TOTAL;
      el.innerHTML = `
        <div class="dp-lesson">
          <p class="dp-verdict ${ok ? 'is-ok' : 'is-skip'}">${ok ? '✅ Task complete!' : '⏭ Skipped'}</p>
          <p class="dp-lesson-kicker">The trick on this site was called</p>
          <h2 class="dp-pattern" tabindex="-1"></h2>
          <p class="dp-explain"></p>
          <p class="dp-lesson-stats">${ok ? `Mistakes on this site: <strong>${levelMistakes}</strong>` : 'No worries. You can learn it anyway.'}</p>
          <button type="button" class="btn btn--big btn--mint" data-next>${last ? 'See my results ➜' : `Next site ➜`}</button>
        </div>`;
      (el.querySelector('.dp-pattern') as HTMLElement).textContent = def.pattern;
      (el.querySelector('.dp-explain') as HTMLElement).textContent = def.explain;
      const next = el.querySelector('[data-next]') as HTMLButtonElement;
      next.addEventListener('click', () => {
        level += 1;
        if (level >= TOTAL) renderResult();
        else renderSite();
      });
      next.focus({ preventScroll: true });
    };
    if (ok) {
      const site = el.querySelector('.dp-browser');
      site?.classList.add('is-done');
      window.setTimeout(show, reduceMotion ? 250 : 700);
    } else show();
  }

  function renderResult(): void {
    setState('result');
    timeEl = null;
    const run: Run = { levels: done, mistakes, time: Math.round(elapsed) };
    const prev = readBest();
    const isNewBest = isBetter(run, prev);
    if (isNewBest) setJSON(BEST_KEY, run);
    const best = isNewBest ? run : (prev as Run);

    const extra = document.createElement('div');
    extra.className = 'dp-summary';
    const stats = document.createElement('ul');
    stats.className = 'dp-stats';
    stats.innerHTML = `
      <li><strong>${done}</strong> of ${TOTAL} tasks done</li>
      <li><strong>${mistakes}</strong> ${mistakes === 1 ? 'trick' : 'tricks'} fell for</li>
      <li><strong>${formatTime(elapsed)}</strong> on the sites</li>`;
    const details = document.createElement('details');
    details.className = 'dp-log';
    details.innerHTML = '<summary>Every trick you met</summary>';
    const ol = document.createElement('ol');
    for (const l of log) {
      const li = document.createElement('li');
      li.textContent = `${l.pattern}: ${l.ok ? (l.mistakes ? `done, ${l.mistakes} ${l.mistakes === 1 ? 'mistake' : 'mistakes'}` : 'done, no mistakes') : 'skipped'}`;
      ol.append(li);
    }
    details.append(ol);
    extra.append(stats, details);

    const message =
      done === TOTAL && mistakes === 0
        ? 'Not a single trick worked on you. Dark pattern detector: fully charged.'
        : done === TOTAL && mistakes <= 4
          ? 'You escaped every site and barely got fooled. Nicely done.'
          : done === TOTAL
            ? 'You made it out of every site, with a few souvenirs along the way.'
            : 'Some sites got the better of you. Play again and spot them faster.';

    el.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'dp-result';
    wrap.append(
      createResultPanel(root, {
        label: 'Sites escaped',
        score: `${done} / ${TOTAL}`,
        shareScore: `${done}/${TOTAL} sites with ${mistakes} ${mistakes === 1 ? 'mistake' : 'mistakes'} in ${formatTime(elapsed)}`,
        message,
        best: describe(best),
        isNewBest,
        extra,
        onPlayAgain: begin,
      }),
    );
    el.append(wrap);
  }

  renderStart();
}
