import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { createSound } from './sound';

const SLUG = 'sequence-memory-test';
type State = 'start' | 'watch' | 'input' | 'result';

const TILE_COLORS = ['#ff7466', '#ffd447', '#6be3a8', '#6cc8ff', '#c7a3ff', '#ffa3d1', '#ffac57', '#a8e05f', '#5fd4d0'];

function verdict(level: number): string {
  if (level >= 20) return 'Is your brain a filing cabinet? 🗄️';
  if (level >= 15) return 'Elephants are taking notes from you. 🐘';
  if (level >= 11) return 'Huge memory. The tiles are a little scared.';
  if (level >= 8) return 'Really solid! Your brain did a great job.';
  if (level >= 5) return 'Nice run. Your memory is warming up.';
  if (level >= 2) return 'A good start. The tiles got sneaky fast.';
  return 'Oops! Shake it off and give it another go. 🙃';
}

export function mount(root: HTMLElement): void {
  const sound = createSound();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = document.createElement('div');
  el.className = 'g-seqmem';
  el.tabIndex = -1;
  el.innerHTML = `
    <div class="g-top">
      <p class="g-level" data-level>Level 1</p>
      <p class="g-status" role="status" aria-live="polite" data-status></p>
      <button type="button" class="g-mute" data-mute></button>
    </div>
    <div class="g-board" data-board role="group" aria-label="Memory tiles, numbered 1 to 9"></div>
    <div class="g-overlay" data-overlay></div>`;
  root.append(el);

  const levelEl = el.querySelector<HTMLElement>('[data-level]')!;
  const statusEl = el.querySelector<HTMLElement>('[data-status]')!;
  const muteBtn = el.querySelector<HTMLButtonElement>('[data-mute]')!;
  const board = el.querySelector<HTMLElement>('[data-board]')!;
  const overlay = el.querySelector<HTMLElement>('[data-overlay]')!;

  const tiles = TILE_COLORS.map((color, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'g-tile';
    b.style.setProperty('--c', color);
    b.dataset.index = String(i);
    b.setAttribute('aria-label', `Tile ${i + 1}`);
    b.innerHTML = `<span class="g-num" aria-hidden="true">${i + 1}</span>`;
    board.append(b);
    return b;
  });

  let state: State = 'start';
  let sequence: number[] = [];
  let pos = 0;
  // Bumped on every new run so timers from an old run can't touch the board.
  let run = 0;
  const timers = new Set<number>();

  function later(ms: number, fn: () => void): void {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
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
    const locked = next !== 'input';
    for (const t of tiles) t.setAttribute('aria-disabled', String(locked));
  }

  function renderMute(): void {
    const muted = sound.isMuted();
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
    muteBtn.setAttribute('aria-pressed', String(muted));
  }

  function light(i: number, ms: number): void {
    const tile = tiles[i];
    tile.dataset.lit = 'true';
    sound.tile(i);
    const myRun = run;
    later(ms, () => {
      if (myRun === run) delete tile.dataset.lit;
    });
  }

  function clearMarks(): void {
    board.classList.remove('is-good', 'is-bad');
    for (const t of tiles) {
      delete t.dataset.lit;
      delete t.dataset.mark;
    }
  }

  function showStart(): void {
    setState('start');
    clearMarks();
    levelEl.textContent = 'Level 1';
    statusEl.textContent = 'Press Start to begin';
    const best = getBest(SLUG);
    overlay.hidden = false;
    overlay.innerHTML = `
      <div class="g-screen">
        <p class="g-big">Watch the tiles light up, then tap them back in the same order.</p>
        <p class="g-sub">One new step is added every level.</p>
        ${best != null ? `<p class="g-best">Your best: level ${best}</p>` : ''}
        <button type="button" class="btn btn--big btn--grape" data-start>▶ Start</button>
        <p class="g-hint">Tap, click, or press keys 1 to 9</p>
      </div>`;
    overlay.querySelector('[data-start]')?.addEventListener('click', start);
  }

  function start(): void {
    clearTimers();
    run++;
    sequence = [];
    overlay.hidden = true;
    overlay.replaceChildren();
    el.focus({ preventScroll: true });
    nextLevel();
  }

  function nextLevel(): void {
    clearMarks();
    let step = Math.floor(Math.random() * 9);
    // Avoid the same tile three times in a row, which is hard to see.
    const n = sequence.length;
    if (n >= 2 && sequence[n - 1] === step && sequence[n - 2] === step) step = (step + 1 + Math.floor(Math.random() * 8)) % 9;
    sequence.push(step);
    pos = 0;
    levelEl.textContent = `Level ${sequence.length}`;
    playback();
  }

  function playback(): void {
    setState('watch');
    statusEl.textContent = 'Watch…';
    const level = sequence.length;
    const flash = Math.max(320, 550 - level * 12);
    const gap = Math.max(130, 200 - level * 4);
    const myRun = run;
    let at = 650;
    sequence.forEach((i) => {
      later(at, () => {
        if (myRun === run) light(i, flash);
      });
      at += flash + gap;
    });
    later(at, () => {
      if (myRun !== run) return;
      setState('input');
      statusEl.textContent = `Your turn · 0 of ${sequence.length}`;
    });
  }

  function press(i: number): void {
    if (state !== 'input') return;
    const tile = tiles[i];
    delete tile.dataset.lit;
    void tile.offsetWidth;
    light(i, 220);
    if (sequence[pos] === i) {
      pos++;
      statusEl.textContent = `Your turn · ${pos} of ${sequence.length}`;
      if (pos === sequence.length) {
        setState('watch');
        statusEl.textContent = 'Nice! 🎉';
        later(220, () => {
          board.classList.add('is-good');
          sound.levelUp();
        });
        later(900, nextLevel);
      }
    } else {
      fail(i);
    }
  }

  function fail(wrong: number): void {
    setState('watch');
    const completed = sequence.length - 1;
    const correct = sequence[pos];
    sound.fail();
    board.classList.add('is-bad');
    tiles[wrong].dataset.mark = 'wrong';
    if (correct !== wrong) tiles[correct].dataset.mark = 'right';
    statusEl.textContent = `Oops! It was tile ${correct + 1}.`;
    later(reduceMotion ? 900 : 1200, () => finish(completed));
  }

  function finish(completed: number): void {
    setState('result');
    const { best, isNewBest } = saveBest(SLUG, completed);
    statusEl.textContent = `You remembered ${completed} step${completed === 1 ? '' : 's'}`;
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
  el.addEventListener('keydown', (e) => {
    pointerPressed = false;
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= 9) {
      e.preventDefault();
      press(n - 1);
    } else if ((e.key === ' ' || e.key === 'Enter') && state === 'start' && e.target === el) {
      e.preventDefault();
      start();
    }
  });
  muteBtn.addEventListener('click', () => {
    sound.setMuted(!sound.isMuted());
    renderMute();
  });

  renderMute();
  showStart();
}
