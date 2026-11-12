import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { WORDS } from './words';

const SLUG = 'verbal-memory-test';
type State = 'start' | 'playing' | 'over';

const LIVES = 3;
/** Chance of showing a word you've already seen: starts low and climbs to the max over RAMP_TURNS. */
const REPEAT_MIN = 0.35;
const REPEAT_MAX = 0.55;
const RAMP_TURNS = 40;
/** Ignore a second tap or key press this soon after an answer, so one press never answers two words. */
const INPUT_GUARD_MS = 140;
/** Let the last red flash show before the result card appears. */
const GAME_OVER_DELAY_MS = 450;

const wordsLabel = (n: number) => `${n} word${n === 1 ? '' : 's'}`;

function verdict(score: number): string {
  if (score < 10) return 'A shaky start. The words got tangled up. Have another go!';
  if (score < 25) return 'Nice warm-up. Your word shelf is filling up.';
  if (score < 50) return 'Solid memory! You kept a lot of words straight.';
  if (score < 80) return 'Impressive. Your brain is a well-sorted library. 📚';
  if (score < 120) return 'Wow. That is a seriously sticky memory.';
  return 'Are you secretly a dictionary with legs? 📖';
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-verbal';
  el.tabIndex = -1;
  root.append(el);

  let state: State = 'start';
  let score = 0;
  let lives = LIVES;
  let turn = 0;
  let word = '';
  let seen = new Set<string>();
  let fresh: string[] = [];
  let readyAt = 0;
  let overTimer = 0;

  // Elements of the play screen, rebuilt on every start.
  let wordEl: HTMLElement | null = null;
  let cardEl: HTMLElement | null = null;
  let scoreEl: HTMLElement | null = null;
  let livesEl: HTMLElement | null = null;
  let statusEl: HTMLElement | null = null;

  function setState(next: State): void {
    state = next;
    el.dataset.state = next;
    el.replaceChildren();
  }

  function renderStart(): void {
    setState('start');
    const best = getBest(SLUG);
    const box = document.createElement('div');
    box.className = 'vm-start';
    box.innerHTML = `
      <p class="vm-kicker">🧠 Verbal memory test</p>
      <p class="vm-big">Words appear one at a time. Have you seen this word before in this game?</p>
      <p class="vm-sub">Press <strong>Seen</strong> or <strong>New</strong>. You have ${LIVES} lives.</p>
      ${best != null ? `<p class="vm-best">Your best: ${wordsLabel(best)}</p>` : ''}
      <button type="button" class="btn btn--big btn--grape" data-start>▶ Start</button>
      <p class="vm-hint">Keyboard: <kbd>S</kbd> for Seen, <kbd>N</kbd> for New</p>`;
    box.querySelector('[data-start]')?.addEventListener('click', startGame);
    el.append(box);
  }

  function renderLives(): void {
    if (!livesEl) return;
    livesEl.replaceChildren();
    for (let i = 0; i < LIVES; i++) {
      const h = document.createElement('span');
      h.className = i < lives ? 'vm-heart' : 'vm-heart is-lost';
      h.textContent = i < lives ? '❤️' : '🤍';
      livesEl.append(h);
    }
    livesEl.setAttribute('aria-label', `${lives} of ${LIVES} lives left`);
  }

  function startGame(): void {
    window.clearTimeout(overTimer);
    score = 0;
    lives = LIVES;
    turn = 0;
    seen = new Set();
    fresh = shuffle(WORDS);
    readyAt = 0;
    setState('playing');

    const play = document.createElement('div');
    play.className = 'vm-play';
    play.innerHTML = `
      <div class="vm-hud">
        <p class="vm-lives" data-lives role="img"></p>
        <p class="vm-score">Score: <strong data-score>0</strong></p>
        <button type="button" class="vm-restart" data-restart>↺ Restart</button>
      </div>
      <div class="vm-card" data-card>
        <p class="vm-word" data-word aria-live="polite"></p>
      </div>
      <p class="vm-status" data-status role="status"></p>
      <div class="vm-buttons">
        <button type="button" class="vm-btn vm-btn--seen" data-answer="seen">Seen <kbd>S</kbd></button>
        <button type="button" class="vm-btn vm-btn--new" data-answer="new">New <kbd>N</kbd></button>
      </div>`;
    el.append(play);
    wordEl = play.querySelector('[data-word]');
    cardEl = play.querySelector('[data-card]');
    scoreEl = play.querySelector('[data-score]');
    livesEl = play.querySelector('[data-lives]');
    statusEl = play.querySelector('[data-status]');
    play.querySelector('[data-restart]')?.addEventListener('click', startGame);
    for (const b of play.querySelectorAll<HTMLButtonElement>('[data-answer]')) {
      b.addEventListener('click', () => answer(b.dataset.answer === 'seen'));
    }
    renderLives();
    nextWord();
    el.focus({ preventScroll: true });
  }

  function nextWord(): void {
    const repeatChance = REPEAT_MIN + (REPEAT_MAX - REPEAT_MIN) * Math.min(1, turn / RAMP_TURNS);
    // Never repeat the word that is on screen right now.
    const repeats = [...seen].filter((w) => w !== word);
    if ((repeats.length && Math.random() < repeatChance) || !fresh.length) {
      word = repeats[Math.floor(Math.random() * repeats.length)] ?? [...seen][0];
    } else {
      word = fresh.pop()!;
    }
    turn++;
    if (wordEl) {
      wordEl.textContent = word;
      // Restart the pop-in animation for every new word.
      wordEl.classList.remove('is-in');
      void wordEl.offsetWidth;
      wordEl.classList.add('is-in');
    }
  }

  function flash(right: boolean): void {
    if (!cardEl) return;
    cardEl.classList.remove('is-right', 'is-wrong');
    void cardEl.offsetWidth;
    cardEl.classList.add(right ? 'is-right' : 'is-wrong');
  }

  function answer(saidSeen: boolean): void {
    if (state !== 'playing' || lives <= 0 || performance.now() < readyAt) return;
    const wasSeen = seen.has(word);
    const right = saidSeen === wasSeen;
    seen.add(word);
    if (right) score++;
    else lives--;
    if (scoreEl) scoreEl.textContent = String(score);
    renderLives();
    flash(right);
    if (statusEl) {
      statusEl.textContent = right
        ? '✓ Correct'
        : wasSeen
          ? `✗ "${word}" was a repeat`
          : `✗ "${word}" was new`;
      statusEl.className = `vm-status ${right ? 'is-right' : 'is-wrong'}`;
    }
    if (lives <= 0) {
      readyAt = Infinity;
      overTimer = window.setTimeout(gameOver, GAME_OVER_DELAY_MS);
      return;
    }
    readyAt = performance.now() + INPUT_GUARD_MS;
    nextWord();
  }

  function gameOver(): void {
    setState('over');
    const { best, isNewBest } = saveBest(SLUG, score);
    const stats = document.createElement('p');
    stats.className = 'vm-stats';
    stats.textContent = `${seen.size} different words came up in ${turn} turns.`;
    el.append(
      createResultPanel(root, {
        label: 'You remembered',
        score: wordsLabel(score),
        shareScore: wordsLabel(score),
        best: wordsLabel(best),
        isNewBest: isNewBest && score > 0,
        message: verdict(score),
        extra: stats,
        onPlayAgain: startGame,
        hideShare: score === 0,
      }),
    );
  }

  // S / N (or the arrow keys) answer while a game is running. Typing in a form field elsewhere is left alone.
  document.addEventListener('keydown', (e) => {
    if (state !== 'playing' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const k = e.key.toLowerCase();
    if (k === 's' || k === 'arrowleft') {
      e.preventDefault();
      answer(true);
    } else if (k === 'n' || k === 'arrowright') {
      e.preventDefault();
      answer(false);
    }
  });

  renderStart();
}
