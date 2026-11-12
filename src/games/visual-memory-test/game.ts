import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';

const SLUG = 'visual-memory-test';
type State = 'start' | 'show' | 'input' | 'pause' | 'result';

const HEARTS = 3;
const MISSES_PER_LEVEL = 3;

/** Grid side for a level: 3×3 first, growing to 7×7. */
function gridSize(level: number): number {
  if (level >= 12) return 7;
  if (level >= 9) return 6;
  if (level >= 6) return 5;
  if (level >= 3) return 4;
  return 3;
}

const tilesToRemember = (level: number) => level + 2;

function verdict(level: number): string {
  if (level >= 16) return 'Photographic? Maybe. Terrifying? Definitely. 📸';
  if (level >= 12) return 'Your brain took a picture and kept it. 🧠';
  if (level >= 9) return 'Big grids, no problem. Seriously sharp.';
  if (level >= 6) return 'Nice! You held a lot of squares in your head.';
  if (level >= 3) return 'A solid start. The grid grew teeth fast.';
  if (level >= 1) return 'You got going! Try again and push further.';
  return 'The squares won this time. Shake it off! 🙃';
}

const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export function mount(root: HTMLElement): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = document.createElement('div');
  el.className = 'g-vismem';
  el.tabIndex = -1;
  el.innerHTML = `
    <div class="g-hud">
      <p class="g-level" data-level>Level 1</p>
      <p class="g-hearts" data-hearts></p>
      <p class="g-status" role="status" aria-live="polite" data-status></p>
      <p class="g-lives" data-lives aria-hidden="true"></p>
    </div>
    <div class="g-board" data-board role="group" aria-label="Memory grid"></div>
    <div class="g-overlay" data-overlay></div>`;
  root.append(el);

  const levelEl = el.querySelector<HTMLElement>('[data-level]')!;
  const heartsEl = el.querySelector<HTMLElement>('[data-hearts]')!;
  const statusEl = el.querySelector<HTMLElement>('[data-status]')!;
  const livesEl = el.querySelector<HTMLElement>('[data-lives]')!;
  const board = el.querySelector<HTMLElement>('[data-board]')!;
  const overlay = el.querySelector<HTMLElement>('[data-overlay]')!;

  let state: State = 'start';
  let level = 1;
  let hearts = HEARTS;
  let misses = 0;
  let size = 3;
  let pattern = new Set<number>();
  let found = new Set<number>();
  let tiles: HTMLButtonElement[] = [];
  let focusIndex = 0;
  // Bumped on every new run so timers from an old run can't touch the board.
  let run = 0;
  const timers = new Set<number>();

  function later(ms: number, fn: () => void): void {
    const myRun = run;
    const id = window.setTimeout(() => {
      timers.delete(id);
      if (myRun === run) fn();
    }, ms);
    timers.add(id);
  }

  function clearTimers(): void {
    for (const id of timers) clearTimeout(id);
    timers.clear();
  }

  function setState(next: State): void {
    state = next;
    el.dataset.state = next;
    delete statusEl.dataset.tone;
    for (const t of tiles) t.setAttribute('aria-disabled', String(next !== 'input'));
  }

  function renderHud(): void {
    levelEl.textContent = `Level ${level}`;
    heartsEl.textContent = '❤️'.repeat(hearts) + '🤍'.repeat(HEARTS - hearts);
    heartsEl.setAttribute('aria-label', `${hearts} of ${HEARTS} hearts left`);
    livesEl.innerHTML = Array.from(
      { length: MISSES_PER_LEVEL },
      (_, i) => `<span class="g-life${i < misses ? ' is-used' : ''}"></span>`,
    ).join('');
  }

  function buildBoard(): void {
    size = gridSize(level);
    board.style.setProperty('--n', String(size));
    board.dataset.size = String(size);
    board.classList.remove('is-good', 'is-bad');
    tiles = Array.from({ length: size * size }, (_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'g-tile';
      b.dataset.index = String(i);
      b.tabIndex = -1;
      b.setAttribute('aria-label', `Row ${Math.floor(i / size) + 1}, column ${(i % size) + 1}`);
      return b;
    });
    board.replaceChildren(...tiles);
    focusIndex = Math.min(focusIndex, tiles.length - 1);
    tiles[focusIndex].tabIndex = 0;
  }

  function moveFocus(to: number): void {
    tiles[focusIndex].tabIndex = -1;
    focusIndex = to;
    tiles[to].tabIndex = 0;
    tiles[to].focus({ preventScroll: true });
  }

  function showStart(): void {
    setState('start');
    level = 1;
    hearts = HEARTS;
    misses = 0;
    buildBoard();
    renderHud();
    statusEl.textContent = 'Press Start to begin';
    const best = getBest(SLUG);
    overlay.hidden = false;
    overlay.innerHTML = `
      <div class="g-screen">
        <p class="g-big">Some squares light up for a moment. Tap every one of them once they go dark.</p>
        <p class="g-sub">Each level adds a square, and the grid keeps growing. You have 3 hearts.</p>
        ${best != null ? `<p class="g-best">Your best: level ${best}</p>` : ''}
        <button type="button" class="btn btn--big btn--grape" data-start>▶ Start</button>
        <p class="g-hint">Tap, click, or use the arrow keys and Enter</p>
      </div>`;
    overlay.querySelector('[data-start]')?.addEventListener('click', start);
  }

  function start(): void {
    clearTimers();
    run++;
    level = 1;
    hearts = HEARTS;
    overlay.hidden = true;
    overlay.replaceChildren();
    el.focus({ preventScroll: true });
    playLevel();
  }

  function playLevel(): void {
    misses = 0;
    found = new Set();
    buildBoard();
    renderHud();
    const count = tilesToRemember(level);
    pattern = new Set(shuffle([...tiles.keys()]).slice(0, count));
    setState('pause');
    statusEl.textContent = 'Get ready…';
    later(450, () => {
      setState('show');
      statusEl.textContent = `Remember ${count} squares`;
      for (const i of pattern) tiles[i].dataset.lit = 'true';
      later(Math.min(1700, 900 + count * 45), () => {
        for (const i of pattern) delete tiles[i].dataset.lit;
        setState('input');
        statusEl.textContent = `Your turn · 0 of ${count}`;
      });
    });
  }

  function press(i: number): void {
    if (state !== 'input') return;
    const tile = tiles[i];
    if (found.has(i) || tile.dataset.mark === 'wrong') return;
    if (pattern.has(i)) {
      found.add(i);
      tile.dataset.found = 'true';
      delete statusEl.dataset.tone;
      statusEl.textContent = `Your turn · ${found.size} of ${pattern.size}`;
      if (found.size === pattern.size) levelDone();
      return;
    }
    tile.dataset.mark = 'wrong';
    statusEl.dataset.tone = 'bad';
    misses++;
    renderHud();
    if (misses < MISSES_PER_LEVEL) {
      statusEl.textContent = `Not that one! ${MISSES_PER_LEVEL - misses} ${MISSES_PER_LEVEL - misses === 1 ? 'try' : 'tries'} left`;
      return;
    }
    loseHeart();
  }

  function levelDone(): void {
    setState('pause');
    statusEl.textContent = 'Nice! 🎉';
    board.classList.add('is-good');
    later(reduceMotion ? 500 : 800, () => {
      level++;
      playLevel();
    });
  }

  function loseHeart(): void {
    setState('pause');
    statusEl.dataset.tone = 'bad';
    hearts--;
    renderHud();
    board.classList.add('is-bad');
    for (const i of pattern) if (!found.has(i)) tiles[i].dataset.mark = 'missed';
    statusEl.textContent = hearts > 0 ? 'Three misses. Here is what you missed.' : 'Out of hearts!';
    later(reduceMotion ? 1000 : 1400, () => {
      if (hearts > 0) playLevel();
      else finish();
    });
  }

  function finish(): void {
    setState('result');
    const completed = level - 1;
    const { best, isNewBest } = saveBest(SLUG, completed);
    statusEl.textContent = `You reached level ${completed}`;
    overlay.hidden = false;
    overlay.replaceChildren(
      createResultPanel(root, {
        label: 'You reached',
        score: `Level ${completed}`,
        shareScore: `level ${completed}`,
        best: `level ${best}`,
        isNewBest: isNewBest && completed > 0,
        message: verdict(completed),
        onPlayAgain: start,
        hideShare: completed === 0,
      }),
    );
  }

  // Pointerdown makes taps feel instant, so the click that follows it is skipped.
  // A click with no pointerdown before it came from the keyboard (Enter or Space on a focused tile).
  let pointerPressed = false;
  board.addEventListener('pointerdown', (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>('.g-tile');
    if (!tile || e.button > 0) return;
    if (e.pointerType !== 'mouse') e.preventDefault();
    pointerPressed = true;
    press(Number(tile.dataset.index));
  });
  board.addEventListener('pointercancel', () => {
    pointerPressed = false;
  });
  board.addEventListener('click', (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>('.g-tile');
    if (!tile) return;
    if (pointerPressed) {
      pointerPressed = false;
      return;
    }
    press(Number(tile.dataset.index));
  });
  board.addEventListener('focusin', (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>('.g-tile');
    if (tile && Number(tile.dataset.index) !== focusIndex) {
      tiles[focusIndex].tabIndex = -1;
      focusIndex = Number(tile.dataset.index);
      tile.tabIndex = 0;
    }
  });
  board.addEventListener('keydown', (e) => {
    pointerPressed = false;
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -size, ArrowDown: size };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const row = Math.floor(focusIndex / size);
    const to = focusIndex + moves[e.key];
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && Math.floor(to / size) !== row) return;
    if (to < 0 || to >= tiles.length) return;
    moveFocus(to);
  });
  el.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && state === 'start' && e.target === el) {
      e.preventDefault();
      start();
    }
  });

  showStart();
}
