import './game.css';
import { getJSON, setJSON, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { copyText, readContext } from '../../lib/share';
import { PERSONAS, PROMPTS, TRAIT_NAMES, type Persona, type Prompt, type Trait } from './prompts';

const SLUG = 'this-or-that-game';
const ROUND = 20;
const SEEN_KEY = `seen:${SLUG}`;
const LAST_KEY = `last:${SLUG}`;
const DUO_KEY = `${SLUG}-duo`;
const TRAITS: Trait[] = ['cozy', 'bold', 'chaos', 'order'];

type State = 'start' | 'playing' | 'handoff' | 'result';
type Pick = 'a' | 'b';

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Prefers prompts the player did not see last round, so back-to-back rounds feel fresh. */
function pickRound(): Prompt[] {
  const seen = new Set(getJSON<string[]>(SEEN_KEY, []));
  const fresh = shuffle(PROMPTS.filter((p) => !seen.has(p.id)));
  const old = shuffle(PROMPTS.filter((p) => seen.has(p.id)));
  const round = [...fresh, ...old].slice(0, ROUND);
  setJSON(
    SEEN_KEY,
    round.map((p) => p.id),
  );
  return round;
}

function traitCounts(round: Prompt[], picks: Pick[]): Record<Trait, number> {
  const c: Record<Trait, number> = { cozy: 0, bold: 0, chaos: 0, order: 0 };
  picks.forEach((p, i) => (c[round[i][p].trait] += 1));
  return c;
}

function personaFor(counts: Record<Trait, number>): Persona {
  const ranked = TRAITS.slice().sort((x, y) => counts[y] - counts[x]);
  return PERSONAS[`${ranked[0]}+${ranked[1]}`];
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-tot';
  root.append(el);
  const ctx = readContext(root);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let state: State = 'start';
  let duo = false;
  let player = 0;
  let round: Prompt[] = [];
  let answers: Pick[][] = [[], []];
  let busy = false;

  function setState(s: State): void {
    state = s;
    el.dataset.state = s;
  }

  function renderStart(): void {
    setState('start');
    const last = getJSON<{ name: string; emoji: string } | null>(LAST_KEY, null);
    el.innerHTML = `
      <div class="tot-start">
        <div class="tot-vs" aria-hidden="true"><span>THIS</span><b>or</b><span>THAT</span></div>
        <p class="tot-big">Pick a side. ${ROUND} silly debates.</p>
        <p>Choose one option for each question. At the end you get a summary of your own picks and a personality to match.</p>
        ${last && typeof last.name === 'string' ? `<p class="tot-last">Last time you were <strong></strong></p>` : ''}
        <div class="tot-modes">
          <button type="button" class="btn btn--big btn--mint" data-solo>🙋 Play solo</button>
          <button type="button" class="btn btn--sky" data-duo>📱 Pass the phone (2 players)</button>
        </div>
      </div>`;
    const lastEl = el.querySelector('.tot-last strong');
    if (lastEl && last) lastEl.textContent = `${last.emoji} ${last.name}`;
    el.querySelector('[data-solo]')?.addEventListener('click', () => begin(false));
    el.querySelector('[data-duo]')?.addEventListener('click', () => begin(true));
  }

  function begin(twoPlayers: boolean): void {
    duo = twoPlayers;
    player = 0;
    answers = [[], []];
    round = pickRound();
    renderPrompt();
  }

  function renderPrompt(): void {
    setState('playing');
    busy = false;
    const i = answers[player].length;
    const p = round[i];
    const who = duo ? `<span class="tot-pill tot-pill--who">Player ${player + 1}</span>` : '';
    el.innerHTML = `
      <div class="tot-play">
        <div class="tot-top">
          ${who}
          <span class="tot-pill">${i + 1} / ${ROUND}</span>
          <span class="tot-pill tot-pill--theme"></span>
          <button type="button" class="btn btn--small btn--white" data-back ${i === 0 ? 'disabled' : ''}>↩ Back</button>
        </div>
        <div class="tot-bar" aria-hidden="true"><span style="width:${(i / ROUND) * 100}%"></span></div>
        <h2 class="tot-q" tabindex="-1"></h2>
        <div class="tot-options">
          <button type="button" class="tot-opt tot-opt--a" data-pick="a"><span class="tot-emoji" aria-hidden="true"></span><span class="tot-label"></span></button>
          <span class="tot-or" aria-hidden="true">or</span>
          <button type="button" class="tot-opt tot-opt--b" data-pick="b"><span class="tot-emoji" aria-hidden="true"></span><span class="tot-label"></span></button>
        </div>
        <p class="tot-keys">Keyboard: ← or 1 for the left side, → or 2 for the right side</p>
      </div>`;
    (el.querySelector('.tot-pill--theme') as HTMLElement).textContent = p.theme;
    (el.querySelector('.tot-q') as HTMLElement).textContent = p.q;
    for (const side of ['a', 'b'] as const) {
      const b = el.querySelector(`[data-pick="${side}"]`) as HTMLButtonElement;
      (b.querySelector('.tot-emoji') as HTMLElement).textContent = p[side].emoji;
      (b.querySelector('.tot-label') as HTMLElement).textContent = p[side].label;
      b.addEventListener('click', () => choose(side));
    }
    el.querySelector('[data-back]')?.addEventListener('click', back);
  }

  function choose(side: Pick): void {
    if (state !== 'playing' || busy) return;
    busy = true;
    answers[player].push(side);
    const btn = el.querySelector(`[data-pick="${side}"]`);
    btn?.classList.add('is-picked');
    el.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((b) => (b.disabled = true));
    window.setTimeout(advance, reduceMotion ? 120 : 320);
  }

  function back(): void {
    if (state !== 'playing' || busy || !answers[player].length) return;
    answers[player].pop();
    renderPrompt();
    (el.querySelector('[data-pick="a"]') as HTMLElement)?.focus({ preventScroll: true });
  }

  function advance(): void {
    if (answers[player].length < ROUND) {
      renderPrompt();
      return;
    }
    if (duo && player === 0) renderHandoff();
    else renderResult();
  }

  function renderHandoff(): void {
    setState('handoff');
    el.innerHTML = `
      <div class="tot-start">
        <p class="tot-big">📱 Pass the phone to Player 2</p>
        <p>Player 1 is done. Player 2 gets the same ${ROUND} questions in the same order. No peeking at each other's picks!</p>
        <button type="button" class="btn btn--big btn--mint" data-p2>I am Player 2, let's go</button>
      </div>`;
    const b = el.querySelector('[data-p2]') as HTMLButtonElement;
    b.addEventListener('click', () => {
      player = 1;
      renderPrompt();
    });
    b.focus({ preventScroll: true });
  }

  function traitBars(counts: Record<Trait, number>): HTMLElement {
    const ul = document.createElement('ul');
    ul.className = 'tot-traits';
    for (const t of TRAITS) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="tot-trait-name">${TRAIT_NAMES[t]}</span><span class="tot-trait-bar"><span class="is-${t}" style="width:${(counts[t] / ROUND) * 100}%"></span></span><span class="tot-trait-n">${counts[t]}</span>`;
      ul.append(li);
    }
    return ul;
  }

  function picksText(header: string): string {
    const lines = round.map((p, i) => {
      const a = round[i][answers[0][i]].label;
      if (!duo) return `${i + 1}. ${p.q} ${a}`;
      const b = round[i][answers[1][i]].label;
      return `${i + 1}. ${p.q} P1: ${a} / P2: ${b}${answers[0][i] === answers[1][i] ? ' ✅' : ''}`;
    });
    return `${header}\n${lines.join('\n')}\n${ctx.url}`;
  }

  function copyButton(header: string): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'tot-copy';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn--pink';
    b.textContent = '📋 Copy all the picks';
    const status = document.createElement('p');
    status.className = 'share-status';
    status.setAttribute('role', 'status');
    b.addEventListener('click', async () => {
      const ok = await copyText(picksText(header));
      status.textContent = ok ? 'Copied! Paste your picks anywhere.' : 'Could not copy on this browser.';
    });
    wrap.append(b, status);
    return wrap;
  }

  function picksList(): HTMLElement {
    const details = document.createElement('details');
    details.className = 'tot-log';
    details.innerHTML = `<summary>See every pick</summary>`;
    const ol = document.createElement('ol');
    round.forEach((p, i) => {
      const li = document.createElement('li');
      const q = document.createElement('span');
      q.className = 'tot-log-q';
      q.textContent = p.q;
      const a = document.createElement('span');
      a.className = 'tot-log-a';
      if (duo) {
        const same = answers[0][i] === answers[1][i];
        li.className = same ? 'is-same' : 'is-diff';
        a.textContent = `${same ? '✅' : '❌'} P1: ${p[answers[0][i]].label} · P2: ${p[answers[1][i]].label}`;
      } else {
        a.textContent = `${p[answers[0][i]].emoji} ${p[answers[0][i]].label}`;
      }
      li.append(q, a);
      ol.append(li);
    });
    details.append(ol);
    return details;
  }

  function renderResult(): void {
    setState('result');
    const counts1 = traitCounts(round, answers[0]);
    const p1 = personaFor(counts1);
    const extra = document.createElement('div');
    extra.className = 'tot-summary';
    let panel: HTMLElement;

    if (!duo) {
      setJSON(LAST_KEY, { name: p1.name, emoji: p1.emoji });
      extra.append(traitBars(counts1), picksList(), copyButton(`My This or That picks (${p1.name}):`));
      panel = createResultPanel(root, {
        label: 'Your This or That personality',
        score: `${p1.emoji} ${p1.name}`,
        shareScore: p1.name,
        message: p1.blurb,
        extra,
        playAgainLabel: '🔁 New round',
        onPlayAgain: () => begin(false),
      });
    } else {
      const counts2 = traitCounts(round, answers[1]);
      const p2 = personaFor(counts2);
      const agree = answers[0].filter((a, i) => a === answers[1][i]).length;
      const { best, isNewBest } = saveBest(DUO_KEY, agree);
      const people = document.createElement('div');
      people.className = 'tot-duo';
      for (const [n, p] of [
        [1, p1],
        [2, p2],
      ] as const) {
        const card = document.createElement('div');
        card.className = 'tot-duo-card';
        const t = document.createElement('p');
        t.className = 'tot-duo-name';
        t.textContent = `Player ${n}`;
        const v = document.createElement('p');
        v.className = 'tot-duo-persona';
        v.textContent = `${p.emoji} ${p.name}`;
        card.append(t, v);
        people.append(card);
      }
      extra.append(people, picksList(), copyButton(`We agreed on ${agree} of ${ROUND} in This or That:`));
      const ratio = agree / ROUND;
      const message =
        ratio === 1
          ? 'A perfect match. Are you two the same person?'
          : ratio >= 0.75
            ? 'You two think alike. Suspiciously alike.'
            : ratio >= 0.5
              ? 'Mostly on the same page, with a few loud arguments.'
              : ratio >= 0.25
                ? 'You disagree a lot. Dinner plans must be tricky.'
                : 'Total opposites. This friendship runs on chaos.';
      panel = createResultPanel(root, {
        label: 'You agreed on',
        score: `${agree} / ${ROUND}`,
        shareScore: `we agreed on ${agree} of ${ROUND} picks`,
        message,
        best: `${best} / ${ROUND} agreed`,
        isNewBest,
        extra,
        playAgainLabel: '🔁 Play again together',
        onPlayAgain: () => begin(true),
      });
    }

    const menu = document.createElement('button');
    menu.type = 'button';
    menu.className = 'btn btn--small btn--white tot-menu';
    menu.textContent = duo ? '🙋 Switch to solo' : '📱 Try 2-player mode';
    menu.addEventListener('click', () => begin(!duo));
    el.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'tot-result';
    wrap.append(panel, menu);
    el.append(wrap);
  }

  document.addEventListener('keydown', (e) => {
    if (state !== 'playing' || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable]')) return;
    if (!root.isConnected) return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === '1') {
      e.preventDefault();
      choose('a');
    } else if (k === 'ArrowRight' || k === '2') {
      e.preventDefault();
      choose('b');
    } else if (k === 'Backspace') {
      e.preventDefault();
      back();
    }
  });

  renderStart();
}
