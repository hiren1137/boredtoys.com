import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { SCENARIOS, type Track } from './scenarios';

const SLUG = 'trolley-problem-game';
type State = 'start' | 'playing' | 'result';
type Choice = 'pull' | 'stay';

const STAY_PATH = 'M20 125H250C310 125 330 65 400 65H590';
const PULL_PATH = 'M20 125H250C310 125 330 185 400 185H590';

const fmt = (n: number) => n.toLocaleString('en-US');
const thingWord = (n: number) => (n === 1 ? 'thing' : 'things');

function victims(track: Track, y: number): string {
  const shown = Math.min(track.count, 4);
  let out = '';
  for (let i = 0; i < shown; i++) {
    out += `<text x="${476 + i * 28}" y="${y - 6}" font-size="26" text-anchor="middle">${track.icon}</text>`;
  }
  if (track.count === 0) out += `<text x="520" y="${y - 6}" font-size="26" text-anchor="middle">${track.icon}</text>`;
  if (track.count > 4) {
    out += `<g><rect x="540" y="${y - 44}" width="52" height="24" rx="12" fill="#ffd447" stroke="#1f1a2e" stroke-width="2.5"/><text x="566" y="${y - 27}" font-size="13" font-weight="900" text-anchor="middle" fill="#1f1a2e">×${track.count > 9999 ? '10k' : track.count}</text></g>`;
  }
  return out;
}

function scene(stay: Track, pull: Track): string {
  return `
  <svg class="tp-svg" viewBox="0 0 600 250" width="600" height="250" aria-hidden="true">
    <g fill="none" stroke-linecap="round">
      <path d="${STAY_PATH}" stroke="#b07a4f" stroke-width="20" stroke-dasharray="5 13"/>
      <path d="${PULL_PATH}" stroke="#b07a4f" stroke-width="20" stroke-dasharray="5 13"/>
      <path class="tp-rail tp-rail--stay" d="${STAY_PATH}" stroke-width="7"/>
      <path class="tp-rail tp-rail--pull" d="${PULL_PATH}" stroke-width="7"/>
    </g>
    <g class="tp-victims tp-victims--stay">${victims(stay, 65)}</g>
    <g class="tp-victims tp-victims--pull">${victims(pull, 185)}</g>
    <g class="tp-lever" transform="translate(236 222)">
      <rect x="-22" y="-6" width="44" height="14" rx="5" fill="#dcd8e4" stroke="#1f1a2e" stroke-width="3"/>
      <g class="tp-stick">
        <path d="M0 0V-40" stroke="#1f1a2e" stroke-width="6" stroke-linecap="round"/>
        <circle cx="0" cy="-44" r="9" fill="#ff7466" stroke="#1f1a2e" stroke-width="3"/>
      </g>
    </g>
    <g class="tp-trolley" transform="translate(70 125)">
      <g transform="translate(-38 -44)">
        <rect x="4" y="4" width="68" height="34" rx="8" fill="#ff7466" stroke="#1f1a2e" stroke-width="3.5"/>
        <rect x="12" y="10" width="16" height="12" rx="3" fill="#6cc8ff" stroke="#1f1a2e" stroke-width="2.5"/>
        <rect x="32" y="10" width="16" height="12" rx="3" fill="#6cc8ff" stroke="#1f1a2e" stroke-width="2.5"/>
        <rect x="52" y="10" width="14" height="12" rx="3" fill="#6cc8ff" stroke="#1f1a2e" stroke-width="2.5"/>
        <path d="M38 4V-6" stroke="#1f1a2e" stroke-width="3"/>
        <circle cx="20" cy="40" r="6" fill="#1f1a2e"/>
        <circle cx="56" cy="40" r="6" fill="#1f1a2e"/>
      </g>
    </g>
  </svg>`;
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-trolley';
  root.append(el);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let state: State = 'start';
  let level = 0;
  let busy = false;
  let choices: Choice[] = [];

  const hitFor = (i: number, c: Choice) => (c === 'pull' ? SCENARIOS[i].pull : SCENARIOS[i].stay);
  const totals = () =>
    choices.reduce(
      (t, c, i) => {
        const tr = hitFor(i, c);
        t.all += tr.count;
        if (tr.people) t.people += tr.count;
        if (c === 'pull') t.pulls += 1;
        return t;
      },
      { all: 0, people: 0, pulls: 0 },
    );

  function renderStart(): void {
    state = 'start';
    el.dataset.state = state;
    const best = getBest(SLUG);
    el.innerHTML = `
      <div class="tp-start">
        <p class="tp-kicker">${SCENARIOS.length} levels of moral nonsense</p>
        <p class="tp-big">A trolley is coming. You are next to the lever.</p>
        <p>Each level, choose to pull the lever or do nothing. We will count up everything that gets hit.</p>
        ${best != null ? `<p class="tp-best">Your lowest total so far: ${fmt(best)} ${thingWord(best)}</p>` : ''}
        <button type="button" class="btn btn--big btn--mint" data-start>🚋 Start the trolley</button>
        <p class="tp-keys">Keyboard: P to pull, D to do nothing</p>
      </div>`;
    el.querySelector('[data-start]')?.addEventListener('click', () => {
      choices = [];
      level = 0;
      renderLevel();
    });
  }

  function renderLevel(): void {
    state = 'playing';
    el.dataset.state = state;
    busy = false;
    const s = SCENARIOS[level];
    const t = totals();
    el.innerHTML = `
      <div class="tp-level">
        <div class="tp-top">
          <span class="tp-pill">Level ${level + 1} / ${SCENARIOS.length}</span>
          <span class="tp-pill tp-pill--hit" aria-live="polite">Hit so far: ${fmt(t.all)}</span>
        </div>
        <h2 class="tp-title">${s.title}</h2>
        <p class="tp-setup">${s.setup}</p>
        <div class="tp-scene" data-scene="stay">${scene(s.stay, s.pull)}</div>
        <div class="tp-options">
          <div class="tp-option">
            <p class="tp-option-what"><span aria-hidden="true">⬆️</span> Do nothing: <strong>${s.stay.label}</strong></p>
            <button type="button" class="btn btn--sky" data-choice="stay">🙈 Do nothing</button>
          </div>
          <div class="tp-option">
            <p class="tp-option-what"><span aria-hidden="true">⬇️</span> Pull the lever: <strong>${s.pull.label}</strong></p>
            <button type="button" class="btn btn--tomato" data-choice="pull">🕹️ Pull the lever</button>
          </div>
        </div>
        <p class="tp-outcome" data-outcome aria-live="polite"></p>
      </div>`;
    el.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((b) =>
      b.addEventListener('click', () => choose(b.dataset.choice as Choice)),
    );
    if (level > 0) (el.querySelector('[data-choice="stay"]') as HTMLElement)?.focus({ preventScroll: true });
  }

  function choose(c: Choice): void {
    if (state !== 'playing' || busy) return;
    busy = true;
    const s = SCENARIOS[level];
    const track = c === 'pull' ? s.pull : s.stay;
    choices[level] = c;
    const sceneEl = el.querySelector('.tp-scene') as HTMLElement;
    sceneEl.dataset.scene = c;
    el.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((b) => {
      b.disabled = true;
      b.classList.toggle('is-picked', b.dataset.choice === c);
    });

    const done = () => {
      sceneEl.classList.add(`is-hit-${c}`);
      const outcome = el.querySelector('[data-outcome]') as HTMLElement;
      const verb = c === 'pull' ? 'You pulled the lever.' : 'You did nothing.';
      outcome.innerHTML = '';
      const text = document.createElement('span');
      text.textContent =
        track.count === 0 ? `${verb} Nothing got hit. Phew!` : `${verb} The trolley hit ${track.label.toLowerCase()}.`;
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'btn btn--mint';
      next.textContent = level + 1 < SCENARIOS.length ? 'Next level ➜' : 'See my results ➜';
      next.addEventListener('click', advance);
      outcome.append(text, next);
      next.focus({ preventScroll: true });
      const hit = el.querySelector('.tp-pill--hit');
      if (hit) hit.textContent = `Hit so far: ${fmt(totals().all)}`;
    };

    const path = sceneEl.querySelector(c === 'pull' ? '.tp-rail--pull' : '.tp-rail--stay') as SVGPathElement;
    const trolley = sceneEl.querySelector('.tp-trolley') as SVGGElement;
    if (reduceMotion || typeof path.getTotalLength !== 'function') {
      const end = path.getPointAtLength?.(path.getTotalLength() * 0.72);
      if (end) trolley.setAttribute('transform', `translate(${end.x} ${end.y})`);
      done();
      return;
    }
    const total = path.getTotalLength() * 0.72;
    const start = performance.now();
    let finished = false;
    const step = (now: number) => {
      if (finished) return;
      const k = Math.min(1, (now - start) / 950);
      const eased = k * k * (3 - 2 * k);
      const p = path.getPointAtLength(50 + (total - 50) * eased);
      trolley.setAttribute('transform', `translate(${p.x} ${p.y})`);
      if (k < 1) requestAnimationFrame(step);
      else {
        finished = true;
        done();
      }
    };
    requestAnimationFrame(step);
    // Throttled tabs can stall requestAnimationFrame, so never leave the player stuck.
    setTimeout(() => {
      if (finished) return;
      step(start + 950);
    }, 1400);
  }

  function advance(): void {
    level += 1;
    if (level < SCENARIOS.length) renderLevel();
    else renderResult();
  }

  function renderResult(): void {
    state = 'result';
    el.dataset.state = state;
    const t = totals();
    const { best, isNewBest } = saveBest(SLUG, t.all, true);
    const extra = document.createElement('div');
    extra.className = 'tp-summary';
    const stats = document.createElement('ul');
    stats.className = 'tp-stats';
    stats.innerHTML = `
      <li><strong>${fmt(t.people)}</strong> ${t.people === 1 ? 'person' : 'people'} hit</li>
      <li><strong>${t.pulls}</strong> of ${SCENARIOS.length} levers pulled</li>
      <li><strong>${SCENARIOS.length - t.pulls}</strong> times you did nothing</li>`;
    const details = document.createElement('details');
    details.className = 'tp-log';
    details.innerHTML = `<summary>See every choice you made</summary>`;
    const list = document.createElement('ol');
    choices.forEach((c, i) => {
      const li = document.createElement('li');
      li.textContent = `${SCENARIOS[i].title}: ${c === 'pull' ? 'pulled the lever' : 'did nothing'} (${hitFor(i, c).label})`;
      list.append(li);
    });
    details.append(list);
    extra.append(stats, details);

    const message =
      t.all === 0
        ? 'Somehow nothing got hit. Are you a wizard?'
        : t.pulls === 0
          ? 'You never touched the lever. Very relaxed. Maybe too relaxed.'
          : t.pulls === SCENARIOS.length
            ? 'You pulled every single lever. The lever is tired now.'
            : 'Every trolley has been dealt with. Your conscience may now take a nap.';
    el.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'tp-result';
    wrap.append(
      createResultPanel(root, {
        label: 'Total things hit',
        score: fmt(t.all),
        shareScore: `${fmt(t.all)} ${thingWord(t.all)}`,
        message,
        best: `${fmt(best)} ${thingWord(best)} (lowest)`,
        isNewBest,
        extra,
        onPlayAgain: () => {
          choices = [];
          level = 0;
          renderLevel();
        },
      }),
    );
    el.append(wrap);
  }

  document.addEventListener('keydown', (e) => {
    if (state !== 'playing' || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable]')) return;
    const k = e.key.toLowerCase();
    if (k === 'p') {
      e.preventDefault();
      choose('pull');
    } else if (k === 'd') {
      e.preventDefault();
      choose('stay');
    }
  });

  renderStart();
}
