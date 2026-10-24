import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';

const SLUG = 'number-memory-test';
type State = 'start' | 'show' | 'answer' | 'passed' | 'over';

/** How long a number stays on screen: a fixed second plus a bit more for every digit. */
const showMs = (digits: number) => 1000 + 650 * digits;
/** Ignore Enter/click on the next screen for a moment, so one key press can't skip two screens. */
const INPUT_GUARD_MS = 350;

function randomNumber(digits: number): string {
  let s = String(1 + Math.floor(Math.random() * 9));
  for (let i = 1; i < digits; i++) s += String(Math.floor(Math.random() * 10));
  return s;
}

const digitsLabel = (n: number) => `${n} digit${n === 1 ? '' : 's'}`;

function verdict(score: number): string {
  if (score === 0) return 'The number slipped right out of your head. Shake it off and go again!';
  if (score <= 4) return 'A warm-up round. Your memory is still stretching.';
  if (score <= 6) return 'Solid! That is phone-number territory.';
  if (score <= 8) return 'Right around the famous magic number seven. Nice brain.';
  if (score <= 11) return 'Big brain energy. You are beating the classic limit.';
  if (score <= 15) return 'Seriously impressive. Do you chunk digits like a pro?';
  return 'Are you a calculator in a human costume? 🤖';
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-numem';
  root.append(el);

  let state: State = 'start';
  let level = 1;
  let target = '';
  let timer = 0;
  let readyAt = 0;
  // Bumped on every new round so a timer from an old round can never fire into a new one.
  let round = 0;

  function clearTimer(): void {
    if (timer) window.clearTimeout(timer);
    timer = 0;
  }

  function setState(next: State): void {
    state = next;
    el.dataset.state = next;
    el.replaceChildren();
  }

  function levelChip(): HTMLElement {
    const hud = document.createElement('div');
    hud.className = 'nm-hud';
    const chip = document.createElement('p');
    chip.className = 'nm-chip';
    chip.textContent = `Level ${level}`;
    const restart = document.createElement('button');
    restart.type = 'button';
    restart.className = 'nm-restart';
    restart.textContent = '↺ Restart';
    restart.addEventListener('click', startGame);
    hud.append(chip, restart);
    return hud;
  }

  function renderStart(): void {
    clearTimer();
    setState('start');
    const best = getBest(SLUG);
    const box = document.createElement('div');
    box.className = 'nm-start';
    box.innerHTML = `
      <p class="nm-kicker">🧠 Number memory test</p>
      <p class="nm-big">A number flashes up. Remember it, then type it back.</p>
      <p class="nm-sub">Every round adds one more digit. One wrong digit ends the run.</p>
      ${best != null ? `<p class="nm-best">Your best: ${digitsLabel(best)}</p>` : ''}
      <button type="button" class="btn btn--big btn--grape" data-start>▶ Start</button>`;
    box.querySelector('[data-start]')?.addEventListener('click', startGame);
    el.append(box);
  }

  function startGame(): void {
    clearTimer();
    level = 1;
    showLevel();
  }

  function showLevel(): void {
    clearTimer();
    round++;
    const myRound = round;
    target = randomNumber(level);
    setState('show');

    const wrap = document.createElement('div');
    wrap.className = 'nm-show';
    const num = document.createElement('p');
    num.className = 'nm-number';
    num.style.setProperty('--len', String(level));
    num.textContent = target;
    num.setAttribute('aria-label', `Remember this number: ${target.split('').join(' ')}`);
    const bar = document.createElement('div');
    bar.className = 'nm-bar';
    const fill = document.createElement('span');
    fill.style.transitionDuration = `${showMs(level)}ms`;
    bar.append(fill);
    const hint = document.createElement('p');
    hint.className = 'nm-sub';
    hint.textContent = 'Memorize it!';
    wrap.append(levelChip(), num, bar, hint);
    el.append(wrap);

    // Start the shrink on the next frame so the transition actually runs.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (myRound === round) fill.style.transform = 'scaleX(0)';
      }),
    );
    timer = window.setTimeout(() => {
      if (myRound === round && state === 'show') askAnswer();
    }, showMs(level));
  }

  function askAnswer(): void {
    clearTimer();
    setState('answer');
    let submitted = false;

    const form = document.createElement('form');
    form.className = 'nm-answer';
    form.noValidate = true;
    form.innerHTML = `
      <label class="nm-label" for="nm-input">What was the number?</label>
      <input id="nm-input" class="nm-input" type="text" inputmode="numeric" pattern="[0-9]*"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" maxlength="60" />
      <p class="nm-error" role="alert" aria-live="assertive"></p>
      <button type="submit" class="btn btn--big btn--grape">Submit</button>`;
    form.prepend(levelChip());
    const input = form.querySelector('input')!;
    const error = form.querySelector<HTMLElement>('.nm-error')!;
    input.addEventListener('input', () => {
      error.textContent = '';
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitted || state !== 'answer') return;
      const answer = input.value.replace(/\s+/g, '');
      if (!answer) {
        error.textContent = 'Type the number first.';
        input.focus({ preventScroll: true });
        return;
      }
      submitted = true;
      if (answer === target) passed();
      else gameOver(answer);
    });
    el.append(form);
    input.focus({ preventScroll: true });
  }

  function passed(): void {
    setState('passed');
    readyAt = performance.now() + INPUT_GUARD_MS;
    const box = document.createElement('div');
    box.className = 'nm-passed';
    box.innerHTML = `
      <p class="nm-kicker nm-kicker--good">✅ Level ${level} passed</p>
      <p class="nm-number nm-number--done" style="--len:${level}">${target}</p>
      <p class="nm-sub">Next up: ${digitsLabel(level + 1)}.</p>
      <button type="button" class="btn btn--big btn--grape" data-next>Next ▶</button>`;
    const next = box.querySelector<HTMLButtonElement>('[data-next]')!;
    next.addEventListener('click', goNext);
    el.append(box);
    next.focus({ preventScroll: true });
  }

  function goNext(): void {
    if (state !== 'passed' || performance.now() < readyAt) return;
    level++;
    showLevel();
  }

  function diffRow(label: string, text: string, other: string, len: number, cls: string): HTMLElement {
    const row = document.createElement('div');
    row.className = 'nm-diff-row';
    const name = document.createElement('span');
    name.className = 'nm-diff-label';
    name.textContent = label;
    const digits = document.createElement('span');
    digits.className = `nm-diff-digits ${cls}`;
    for (let i = 0; i < len; i++) {
      const d = document.createElement('span');
      const ch = text[i];
      if (ch == null) {
        d.textContent = '_';
        d.className = 'is-missing';
      } else {
        d.textContent = ch;
        if (ch !== other[i]) d.className = 'is-wrong';
      }
      digits.append(d);
    }
    row.append(name, digits);
    return row;
  }

  function gameOver(answer: string): void {
    clearTimer();
    setState('over');
    const score = level - 1;
    const { best, isNewBest } = saveBest(SLUG, score);

    const len = Math.max(target.length, answer.length);
    const diff = document.createElement('div');
    diff.className = 'nm-diff';
    diff.setAttribute('aria-label', `The number was ${target}. You typed ${answer}.`);
    diff.append(
      diffRow('Number', target, answer, len, 'is-target'),
      diffRow('You typed', answer, target, len, 'is-answer'),
    );

    el.append(
      createResultPanel(root, {
        label: 'You remembered',
        score: digitsLabel(score),
        shareScore: digitsLabel(score),
        best: digitsLabel(best),
        isNewBest: isNewBest && score > 0,
        message: verdict(score),
        extra: diff,
        onPlayAgain: startGame,
        hideShare: score === 0,
      }),
    );
  }

  // Enter moves on from the "passed" screen even if focus wandered off the Next button.
  el.addEventListener('keydown', (e) => {
    if (state === 'passed' && e.key === 'Enter' && !(e.target as HTMLElement).closest('button')) {
      e.preventDefault();
      goNext();
    }
  });

  renderStart();
}
