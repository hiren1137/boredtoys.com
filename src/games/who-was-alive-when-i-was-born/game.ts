import './game.css';
import { getBest, getJSON, saveBest, setJSON } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { CHECKED, FIELDS, PEOPLE, type Field, type Person } from './people';

const SLUG = 'who-was-alive-when-i-was-born';
const YEAR_KEY = 'who-was-alive:year';
const ROUNDS = 10;
const MIN_YEAR = 1450;
const PAGE = 30;

type Mode = 'explore' | 'quiz';

const nowYear = () => new Date().getFullYear();
const endOf = (p: Person) => p.died ?? nowYear();
const span = (p: Person) => `${p.born}–${p.died ?? 'today'}`;
const initials = (name: string) =>
  name
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && w[0] === w[0].toUpperCase())
    .map((w) => w[0])
    .slice(0, 2)
    .join('') || name[0];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
const yearsWord = (n: number) => `${n} ${n === 1 ? 'year' : 'years'}`;

function avatar(p: Person): string {
  return `<span class="wa-av" style="--av:${FIELDS[p.field].color}" aria-hidden="true">${esc(initials(p.name))}</span>`;
}

/** Was `x` alive at some point in the year `y` was born? null when years alone cannot tell. */
function aliveAtBirth(x: Person, y: Person): boolean | null {
  if (x.born === y.born || x.died === y.born) return null;
  return x.born < y.born && (x.died == null || x.died > y.born);
}

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Round {
  x: Person;
  y: Person;
  answer: boolean;
}

function makeRounds(): Round[] {
  const rounds: Round[] = [];
  const used = new Set<Person>();
  let guard = 0;
  while (rounds.length < ROUNDS && guard++ < 500) {
    const y = PEOPLE[Math.floor(Math.random() * PEOPLE.length)];
    if (used.has(y)) continue;
    const want = Math.random() < 0.5;
    const pool = PEOPLE.filter((x) => x !== y && !used.has(x) && aliveAtBirth(x, y) === want);
    // Close calls make the best questions: prefer people whose life starts or ends near the other's birth.
    const margin = (x: Person) =>
      want ? Math.min(y.born - x.born, endOf(x) - y.born) : x.born > y.born ? x.born - y.born : y.born - (x.died as number);
    const close = pool.filter((x) => margin(x) <= 12);
    const pick = shuffle(close.length ? close : pool.filter((x) => margin(x) <= 40))[0];
    if (!pick) continue;
    used.add(y).add(pick);
    rounds.push({ x: pick, y, answer: want });
  }
  return rounds;
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-alive';
  root.append(el);

  let mode: Mode = 'explore';
  let keyHandler: ((e: KeyboardEvent) => void) | null = null;

  const tabs = document.createElement('div');
  tabs.className = 'wa-tabs';
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', 'Choose a mode');
  tabs.innerHTML = `
    <button type="button" class="btn btn--small" data-mode="explore">🔎 Explore a year</button>
    <button type="button" class="btn btn--small" data-mode="quiz">❓ Play the quiz</button>`;
  const body = document.createElement('div');
  body.className = 'wa-body';
  el.append(tabs, body);
  tabs.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) =>
    b.addEventListener('click', () => setMode(b.dataset.mode as Mode)),
  );

  function setMode(m: Mode): void {
    mode = m;
    keyHandler = null;
    tabs.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => {
      const on = b.dataset.mode === m;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('btn--mint', on);
      b.classList.toggle('btn--white', !on);
    });
    if (m === 'explore') renderExploreStart();
    else renderQuizStart();
  }

  document.addEventListener('keydown', (e) => {
    if (!keyHandler || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select')) return;
    keyHandler(e);
  });

  // ---------- Explore ----------

  function renderExploreStart(error = ''): void {
    el.dataset.state = 'start';
    const saved = getJSON<number | null>(YEAR_KEY, null);
    body.innerHTML = `
      <form class="wa-start" novalidate>
        <p class="wa-big">What year were you born?</p>
        <p>See which of ${PEOPLE.length} famous people from history were alive that year, and how many years you shared.</p>
        <label class="wa-label" for="wa-year">Birth year</label>
        <input class="wa-year" id="wa-year" name="year" type="number" inputmode="numeric" min="${MIN_YEAR}" max="${nowYear()}" placeholder="e.g. 2008" value="${saved ?? ''}" />
        <p class="wa-error" role="alert">${error}</p>
        <button type="submit" class="btn btn--big btn--mint">👀 Show who was alive</button>
      </form>`;
    const form = body.querySelector('form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const y = Number((form.elements.namedItem('year') as HTMLInputElement).value);
      if (!Number.isInteger(y) || y < MIN_YEAR || y > nowYear()) {
        renderExploreStart(`Please type a year between ${MIN_YEAR} and ${nowYear()}.`);
        (body.querySelector('.wa-year') as HTMLInputElement | null)?.focus();
        return;
      }
      setJSON(YEAR_KEY, y);
      renderExplore(y);
    });
  }

  function renderExplore(year: number): void {
    el.dataset.state = 'explore';
    const alive = PEOPLE.filter((p) => p.born <= year && endOf(p) >= year);
    const missed = PEOPLE.filter((p) => p.died != null && p.died < year && p.died >= year - 15).sort(
      (a, b) => (b.died as number) - (a.died as number),
    );
    const n = alive.length;
    const oldest = [...alive].sort((a, b) => a.born - b.born)[0];
    const message = n
      ? `The oldest was ${oldest.name}, who turned ${year - oldest.born} that year.`
      : 'Nobody on our list was around yet. You are a true pioneer.';

    const panel = createResultPanel(root, {
      label: `Famous people alive in ${year}`,
      score: `${n} of ${PEOPLE.length}`,
      shareScore: `Born in ${year}, I shared the planet with ${n} famous people from history`,
      message,
      playAgainLabel: '📅 Try another year',
      onPlayAgain: () => renderExploreStart(),
      autoFocus: false,
    });

    const wrap = document.createElement('div');
    wrap.className = 'wa-explore';
    const fieldsHere = (Object.keys(FIELDS) as Field[]).filter((f) => alive.some((p) => p.field === f));
    wrap.innerHTML = `
      <div class="wa-controls">
        <div class="wa-chips" role="group" aria-label="Filter by field">
          <button type="button" class="wa-chip" data-field="all" aria-pressed="true">All</button>
          ${fieldsHere.map((f) => `<button type="button" class="wa-chip" data-field="${f}" aria-pressed="false" style="--chip:${FIELDS[f].color}"><span aria-hidden="true">${FIELDS[f].emoji}</span> ${FIELDS[f].label}</button>`).join('')}
        </div>
        <div class="wa-sort" role="group" aria-label="Sort">
          <button type="button" class="wa-chip" data-sort="age" aria-pressed="true">Oldest first</button>
          <button type="button" class="wa-chip" data-sort="shared" aria-pressed="false">Most years shared</button>
        </div>
      </div>
      <p class="wa-legend"><span class="wa-key wa-key--life"></span> their life <span class="wa-key wa-key--you"></span> years shared with you (from ${year})</p>
      <ol class="wa-list" aria-label="People alive in ${year}"></ol>
      <div class="wa-more-wrap"></div>
      ${
        missed.length
          ? `<section class="wa-missed"><h3>Just missed you</h3><p>These people died in the 15 years before ${year}.</p><ul>${missed
              .map((p) => `<li>${avatar(p)}<span><strong>${esc(p.name)}</strong> (${span(p)}), ${yearsWord(year - (p.died as number))} too early</span></li>`)
              .join('')}</ul></section>`
          : ''
      }
      <details class="wa-sources">
        <summary>About the dates</summary>
        <p>Every birth and death year was checked against Wikidata in ${CHECKED}. People whose birth year is disputed were left out. We only use years, so someone who died in the same year you were born is listed with a "same year" note, because we cannot tell who came first. People without an end year were living as of ${CHECKED}.</p>
      </details>`;
    body.replaceChildren(panel, wrap);

    const list = wrap.querySelector('.wa-list') as HTMLOListElement;
    const moreWrap = wrap.querySelector('.wa-more-wrap') as HTMLElement;
    let field: Field | 'all' = 'all';
    let sort: 'age' | 'shared' = 'age';
    let shown = PAGE;

    const axisStart = Math.min(year, ...alive.map((p) => p.born));
    const axisEnd = nowYear();
    const pct = (y: number) => ((y - axisStart) / Math.max(1, axisEnd - axisStart)) * 100;

    function drawList(): void {
      const rows = alive
        .filter((p) => field === 'all' || p.field === field)
        .sort((a, b) => (sort === 'age' ? a.born - b.born || a.name.localeCompare(b.name) : endOf(b) - endOf(a) || a.born - b.born));
      list.innerHTML = rows
        .slice(0, shown)
        .map((p) => {
          const shared = endOf(p) - year;
          const ageNote = p.born === year ? 'born that same year' : `turned ${year - p.born} that year`;
          const end = p.died == null ? 'still alive' : p.died === year ? 'died that same year' : `died ${p.died}`;
          const together = shared === 0 ? 'same year' : `${yearsWord(shared)} shared`;
          return `<li class="wa-row">
            ${avatar(p)}
            <div class="wa-info">
              <p class="wa-name"><strong>${esc(p.name)}</strong> <span class="wa-span">${span(p)}</span></p>
              <p class="wa-known">${esc(p.known)}. ${ageNote}, ${end}.</p>
              <div class="wa-track" role="img" aria-label="${esc(p.name)}: ${together}">
                <span class="wa-life" style="left:${pct(p.born)}%;width:${pct(endOf(p)) - pct(p.born)}%"></span>
                <span class="wa-you" style="left:${pct(year)}%;width:${Math.max(0.6, pct(endOf(p)) - pct(year))}%"></span>
              </div>
            </div>
            <span class="wa-together">${together}</span>
          </li>`;
        })
        .join('');
      moreWrap.innerHTML = '';
      if (rows.length > shown) {
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'btn btn--white';
        more.textContent = `Show ${Math.min(PAGE, rows.length - shown)} more (${rows.length - shown} left)`;
        more.addEventListener('click', () => {
          shown += PAGE;
          drawList();
        });
        moreWrap.append(more);
      }
      if (!rows.length) list.innerHTML = '<li class="wa-empty">Nobody from this group was alive that year.</li>';
    }

    const press = (sel: string, active: HTMLElement) =>
      wrap.querySelectorAll<HTMLButtonElement>(sel).forEach((b) => b.setAttribute('aria-pressed', String(b === active)));
    wrap.querySelectorAll<HTMLButtonElement>('[data-field]').forEach((b) =>
      b.addEventListener('click', () => {
        field = b.dataset.field as Field | 'all';
        shown = PAGE;
        press('[data-field]', b);
        drawList();
      }),
    );
    wrap.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((b) =>
      b.addEventListener('click', () => {
        sort = b.dataset.sort as 'age' | 'shared';
        press('[data-sort]', b);
        drawList();
      }),
    );
    drawList();
    panel.tabIndex = -1;
    panel.focus({ preventScroll: true });
  }

  // ---------- Quiz ----------

  let rounds: Round[] = [];
  let idx = 0;
  let score = 0;
  let answered = false;

  function renderQuizStart(): void {
    el.dataset.state = 'start';
    const best = getBest(SLUG);
    body.innerHTML = `
      <div class="wa-start">
        <p class="wa-big">Was X alive when Y was born?</p>
        <p>${ROUNDS} quick questions about famous people from history. Answer yes or no, then see both lifetimes side by side.</p>
        ${best != null ? `<p class="wa-best">Your best: ${best} / ${ROUNDS}</p>` : ''}
        <button type="button" class="btn btn--big btn--mint" data-go>▶ Start the quiz</button>
        <p class="wa-keys">Keyboard: Y for yes, N for no, Enter for next</p>
      </div>`;
    body.querySelector('[data-go]')?.addEventListener('click', startQuiz);
    keyHandler = null;
  }

  function startQuiz(): void {
    rounds = makeRounds();
    idx = 0;
    score = 0;
    renderRound();
  }

  function renderRound(): void {
    el.dataset.state = 'quiz';
    answered = false;
    const r = rounds[idx];
    body.innerHTML = `
      <div class="wa-quiz">
        <div class="wa-top">
          <span class="wa-pill">Question ${idx + 1} / ${rounds.length}</span>
          <span class="wa-pill wa-pill--score">Score: ${score}</span>
        </div>
        <div class="wa-q">
          <div class="wa-q-people">
            <div class="wa-q-person">${avatar(r.x)}<strong>${esc(r.x.name)}</strong><small>${esc(r.x.known)}</small></div>
            <div class="wa-q-person">${avatar(r.y)}<strong>${esc(r.y.name)}</strong><small>${esc(r.y.known)}</small></div>
          </div>
          <h2 class="wa-q-text">Was <span>${esc(r.x.name)}</span> alive when <span>${esc(r.y.name)}</span> was born?</h2>
        </div>
        <div class="wa-answers">
          <button type="button" class="btn btn--big btn--mint" data-ans="yes">👍 Yes</button>
          <button type="button" class="btn btn--big btn--tomato" data-ans="no">👎 No</button>
        </div>
        <div class="wa-reveal" aria-live="polite"></div>
      </div>`;
    body.querySelectorAll<HTMLButtonElement>('[data-ans]').forEach((b) =>
      b.addEventListener('click', () => answer(b.dataset.ans === 'yes')),
    );
    (body.querySelector('[data-ans="yes"]') as HTMLElement | null)?.focus({ preventScroll: true });
    keyHandler = (e) => {
      const k = e.key.toLowerCase();
      if (!answered && (k === 'y' || k === 'n')) {
        e.preventDefault();
        answer(k === 'y');
      }
    };
  }

  function answer(yes: boolean): void {
    if (answered) return;
    answered = true;
    const r = rounds[idx];
    const right = yes === r.answer;
    if (right) score++;
    body.querySelectorAll<HTMLButtonElement>('[data-ans]').forEach((b) => {
      b.disabled = true;
      b.classList.toggle('is-picked', (b.dataset.ans === 'yes') === yes);
    });
    const pill = body.querySelector('.wa-pill--score');
    if (pill) pill.textContent = `Score: ${score}`;

    const lo = Math.min(r.x.born, r.y.born);
    const hi = Math.max(endOf(r.x), endOf(r.y));
    const pct = (y: number) => ((y - lo) / Math.max(1, hi - lo)) * 100;
    const bar = (p: Person) => `
      <div class="wa-cmp-row">
        <span class="wa-cmp-name">${esc(p.name)} <small>${span(p)}</small></span>
        <div class="wa-track"><span class="wa-life" style="left:${pct(p.born)}%;width:${pct(endOf(p)) - pct(p.born)}%;--av:${FIELDS[p.field].color}"></span>
        <span class="wa-mark" style="left:${pct(r.y.born)}%"></span></div>
      </div>`;
    let why: string;
    if (r.answer) {
      why = `${r.x.name} was born in ${r.x.born}${r.x.died ? ` and died in ${r.x.died}` : ''}, so they turned ${r.y.born - r.x.born} in ${r.y.born}, the year ${r.y.name} was born.`;
    } else if (r.x.born > r.y.born) {
      why = `${r.x.name} was born in ${r.x.born}, ${yearsWord(r.x.born - r.y.born)} after ${r.y.name} (${r.y.born}).`;
    } else {
      why = `${r.x.name} died in ${r.x.died}, ${yearsWord(r.y.born - (r.x.died as number))} before ${r.y.name} was born in ${r.y.born}.`;
    }
    const reveal = body.querySelector('.wa-reveal') as HTMLElement;
    reveal.innerHTML = `
      <p class="wa-verdict ${right ? 'is-right' : 'is-wrong'}">${right ? '✅ Correct!' : '❌ Not quite.'} The answer is <strong>${r.answer ? 'yes' : 'no'}</strong>.</p>
      <p>${esc(why)}</p>
      <div class="wa-cmp">${bar(r.x)}${bar(r.y)}<p class="wa-cmp-note">The dashed line marks ${r.y.born}.</p></div>`;
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'btn btn--mint';
    next.textContent = idx + 1 < rounds.length ? 'Next question ➜' : 'See my score ➜';
    next.addEventListener('click', advance);
    reveal.append(next);
    next.focus({ preventScroll: true });
    keyHandler = (e) => {
      if (e.key === 'Enter' && document.activeElement !== next) {
        e.preventDefault();
        advance();
      }
    };
  }

  function advance(): void {
    idx++;
    if (idx < rounds.length) renderRound();
    else renderQuizResult();
  }

  function renderQuizResult(): void {
    el.dataset.state = 'result';
    keyHandler = null;
    const { best, isNewBest } = saveBest(SLUG, score);
    const message =
      score === ROUNDS
        ? 'A perfect score. You might be a time traveler.'
        : score >= 8
          ? 'History buff alert. You really know your timelines.'
          : score >= 5
            ? 'Not bad! Some of those lifetimes overlap in sneaky ways.'
            : 'History is tricky. Play again and the dates will start to stick.';
    body.replaceChildren(
      createResultPanel(root, {
        label: 'Your quiz score',
        score: `${score} / ${rounds.length}`,
        shareScore: `I scored ${score}/${rounds.length} on the quiz`,
        message,
        best: `${best} / ${ROUNDS}`,
        isNewBest,
        onPlayAgain: startQuiz,
      }),
    );
  }

  setMode(mode);
}
