import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { CASES, type Case } from './cases';
import { describe, portrait } from './portrait';

const SLUG = 'detective-game';
const MAX_STARS = CASES.length * 3;

type State = 'start' | 'case' | 'reveal' | 'done';

interface Round {
  data: Case;
  /** Suspect indexes in the order they are shown. */
  order: number[];
  clues: number;
  ruledOut: Set<number>;
  accused: number | null;
}

const RIGHT = ['Case closed! 🔎', 'Got them! 🕵️', 'Nailed it! ⭐', 'Elementary! 🎩'];
const WRONG = ['Wrong suspect! 🙈', 'Oops, innocent! 😬', 'Not them! 🫣', 'Plot twist! 😮'];
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const starText = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);
const starsFor = (clues: number) => 4 - clues;

function verdict(stars: number): string {
  const r = stars / MAX_STARS;
  if (r >= 0.9) return 'Legendary sleuth. Criminals are scared of your magnifying glass. 🕵️';
  if (r >= 0.65) return 'Sharp detective work. Very little gets past you.';
  if (r >= 0.4) return 'Solid sleuthing, with a few lucky guesses mixed in.';
  if (r >= 0.2) return 'A rookie detective. Try reading every clue before you accuse!';
  return 'The culprits are throwing you a thank-you party. 🎉';
}

const ruleLabel = (on: boolean) =>
  on ? '<span aria-hidden="true">↩</span><span class="dg-rule-text"> Undo</span>' : '<span aria-hidden="true">✕</span><span class="dg-rule-text"> Rule out</span>';

/** Scrolls a node into view only when it is off screen, so the page never jumps needlessly. */
function bringIntoView(node: Element | null): void {
  if (!node) return;
  const r = node.getBoundingClientRect();
  if (r.top >= 0 && r.top < window.innerHeight - 80) return;
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-detective';
  root.append(el);

  let state: State = 'start';
  let rounds: Round[] = [];
  let index = 0;
  let solved = 0;
  let stars = 0;

  const current = () => rounds[index];

  function setState(next: State): void {
    state = next;
    el.dataset.state = next;
  }

  function start(): void {
    rounds = shuffle(CASES).map((data) => ({
      data,
      order: shuffle([0, 1, 2, 3]),
      clues: 1,
      ruledOut: new Set<number>(),
      accused: null,
    }));
    index = 0;
    solved = 0;
    stars = 0;
    showCase();
  }

  function renderStart(): void {
    setState('start');
    const best = getBest(SLUG);
    el.innerHTML = `
      <div class="dg-start">
        <p class="dg-emoji" aria-hidden="true">🕵️</p>
        <p class="dg-big">${CASES.length} silly cases. 4 suspects each.</p>
        <p class="dg-sub">Read the clues, study the suspects and accuse the culprit. The fewer clues you need, the more stars you earn.</p>
        ${best != null ? `<p class="dg-best">Your best: ${best} of ${MAX_STARS} ★</p>` : ''}
        <button type="button" class="btn btn--big btn--sky" data-start>🔍 Start investigating</button>
      </div>`;
    el.querySelector('[data-start]')?.addEventListener('click', start);
  }

  function headerHtml(): string {
    return `
      <div class="dg-top">
        <span class="dg-pill">Case ${index + 1} of ${rounds.length}</span>
        <span class="dg-pill" aria-label="${stars} stars so far">★ ${stars}</span>
        <button type="button" class="dg-restart" data-restart>↺ Restart</button>
      </div>`;
  }

  function showCase(): void {
    setState('case');
    const r = current();
    el.innerHTML = `
      ${headerHtml()}
      <div class="dg-case">
        <p class="dg-title" tabindex="-1" data-case-title>${esc(r.data.title)}</p>
        <p class="dg-scene">${esc(r.data.scene)}</p>
      </div>
      <div class="dg-clues">
        <ol class="dg-cluelist" data-clues aria-live="polite"></ol>
        <div class="dg-cluebar">
          <button type="button" class="btn btn--small btn--white" data-more></button>
          <span class="dg-worth" data-worth></span>
        </div>
      </div>
      <ul class="dg-suspects" role="list">
        ${r.order
          .map((si, pos) => {
            const s = r.data.suspects[si];
            return `
          <li class="dg-card" data-card="${si}">
            <div class="dg-face" role="img" aria-label="${esc(describe(s.name, s.look))}">${portrait(s.look, pos + index)}</div>
            <p class="dg-name">${esc(s.name)}</p>
            <p class="dg-says">“${esc(s.says)}”</p>
            <div class="dg-actions">
              <button type="button" class="dg-rule" data-rule="${si}" aria-pressed="false" aria-label="Rule out ${esc(s.name)}">${ruleLabel(false)}</button>
              <button type="button" class="btn btn--small btn--tomato dg-accuse" data-accuse="${si}">Accuse</button>
            </div>
          </li>`;
          })
          .join('')}
      </ul>`;
    el.querySelector('[data-restart]')?.addEventListener('click', start);
    el.querySelector('[data-more]')?.addEventListener('click', moreClue);
    el.querySelectorAll<HTMLButtonElement>('[data-rule]').forEach((b) =>
      b.addEventListener('click', () => toggleRule(Number(b.dataset.rule))),
    );
    el.querySelectorAll<HTMLButtonElement>('[data-accuse]').forEach((b) =>
      b.addEventListener('click', () => accuse(Number(b.dataset.accuse))),
    );
    renderClues();
    el.querySelector<HTMLElement>('[data-case-title]')?.focus({ preventScroll: true });
    bringIntoView(el);
  }

  function renderClues(): void {
    const r = current();
    const list = el.querySelector<HTMLElement>('[data-clues]');
    const more = el.querySelector<HTMLButtonElement>('[data-more]');
    const worth = el.querySelector<HTMLElement>('[data-worth]');
    if (!list || !more || !worth) return;
    list.innerHTML = r.data.clues
      .slice(0, r.clues)
      .map((c, i) => `<li class="dg-clue${i === r.clues - 1 && i > 0 ? ' is-new' : ''}"><b>Clue ${i + 1}:</b> ${esc(c.text)}</li>`)
      .join('');
    const left = r.data.clues.length - r.clues;
    more.hidden = left === 0;
    more.textContent = `🔍 Reveal clue ${r.clues + 1} (${left} left)`;
    worth.innerHTML = `Accuse now for <span class="dg-stars" aria-label="${starsFor(r.clues)} stars">${starText(starsFor(r.clues))}</span>`;
  }

  function moreClue(): void {
    const r = current();
    if (state !== 'case' || r.clues >= r.data.clues.length) return;
    r.clues += 1;
    renderClues();
    if (r.clues >= r.data.clues.length) el.querySelector<HTMLElement>('.dg-accuse')?.focus({ preventScroll: true });
  }

  function toggleRule(si: number): void {
    const r = current();
    if (state !== 'case') return;
    if (r.ruledOut.has(si)) r.ruledOut.delete(si);
    else r.ruledOut.add(si);
    const on = r.ruledOut.has(si);
    el.querySelector(`[data-card="${si}"]`)?.classList.toggle('is-out', on);
    const btn = el.querySelector<HTMLButtonElement>(`[data-rule="${si}"]`);
    if (btn) {
      btn.setAttribute('aria-pressed', String(on));
      btn.innerHTML = ruleLabel(on);
    }
  }

  function accuse(si: number): void {
    const r = current();
    if (state !== 'case' || r.accused != null) return;
    r.accused = si;
    const right = si === r.data.culprit;
    const earned = right ? starsFor(r.clues) : 0;
    if (right) solved += 1;
    stars += earned;
    showReveal(right, earned);
  }

  function showReveal(right: boolean, earned: number): void {
    setState('reveal');
    const r = current();
    const culprit = r.data.suspects[r.data.culprit];
    const accused = r.data.suspects[r.accused as number];
    const last = index >= rounds.length - 1;
    el.innerHTML = `
      ${headerHtml()}
      <div class="dg-reveal ${right ? 'is-right' : 'is-wrong'}" role="status">
        <p class="dg-verdict">${right ? pick(RIGHT) : pick(WRONG)}</p>
        <div class="dg-reveal-face" role="img" aria-label="${esc(describe(culprit.name, culprit.look))}">${portrait(culprit.look, 1)}</div>
        <p class="dg-reveal-name">${right ? `It was ${esc(culprit.name)}!` : `${esc(accused.name)} is innocent. It was ${esc(culprit.name)}!`}</p>
        <p class="dg-reveal-text">${esc(r.data.reveal)}</p>
        <p class="dg-earned"><span class="dg-stars">${starText(earned)}</span> ${right ? `+${earned} star${earned === 1 ? '' : 's'}` : 'No stars this time'}</p>
        <button type="button" class="btn btn--big btn--mint" data-next>${last ? '🏁 See my results' : 'Next case →'}</button>
      </div>`;
    el.querySelector('[data-restart]')?.addEventListener('click', start);
    const next = el.querySelector<HTMLButtonElement>('[data-next]');
    next?.addEventListener('click', () => {
      if (last) finish();
      else {
        index += 1;
        showCase();
      }
    });
    next?.focus({ preventScroll: true });
    bringIntoView(el);
  }

  function finish(): void {
    setState('done');
    const { best, isNewBest } = saveBest(SLUG, stars);
    el.replaceChildren(
      createResultPanel(root, {
        label: 'Detective stars',
        score: `${stars} ★`,
        shareScore: `${solved}/${rounds.length} cases and ${stars} stars`,
        message: `You cracked ${solved} of ${rounds.length} cases. ${verdict(stars)}`,
        best: `${best} of ${MAX_STARS} ★`,
        isNewBest,
        playAgainLabel: '🔁 New investigation',
        onPlayAgain: start,
        hideShare: solved === 0,
      }),
    );
  }

  renderStart();
}
