import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { HELPER_EMOJI, RULES, charCount, type RuleContext } from './rules';

const SLUG = 'password-game';
type State = 'start' | 'playing' | 'result';

function formatTime(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
}

function dayOfYear(d: Date): number {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
}

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-password';
  el.innerHTML = `
    <div class="pw-play" data-play>
      <label class="pw-label" for="pw-input">Please choose a password</label>
      <div class="pw-box">
        <textarea id="pw-input" class="pw-input" rows="1" spellcheck="false" autocomplete="off"
          autocapitalize="off" autocorrect="off" data-input></textarea>
        <span class="pw-count" data-count aria-label="Character count">0</span>
      </div>
      <div class="pw-tools">
        <button type="button" class="btn btn--small btn--white" data-emoji-toggle aria-expanded="false" aria-controls="pw-emoji">😀 Emoji helper</button>
        <span class="pw-timer" data-timer aria-hidden="true"></span>
      </div>
      <div class="pw-emoji" id="pw-emoji" data-emoji hidden></div>
      <p class="pw-best" data-best></p>
      <div class="pw-confirm" data-confirm hidden>
        <label class="pw-label" for="pw-confirm">Final step: type your password again to confirm it</label>
        <textarea id="pw-confirm" class="pw-input" rows="1" spellcheck="false" autocomplete="off"
          autocapitalize="off" autocorrect="off" data-confirm-input></textarea>
      </div>
      <ol class="pw-rules" data-rules aria-live="polite"></ol>
    </div>
    <div class="pw-result" data-result hidden></div>`;
  root.append(el);

  const $ = <T extends Element>(s: string) => el.querySelector(s) as T;
  const input = $<HTMLTextAreaElement>('[data-input]');
  const count = $<HTMLElement>('[data-count]');
  const rulesEl = $<HTMLOListElement>('[data-rules]');
  const confirmBox = $<HTMLElement>('[data-confirm]');
  const confirmInput = $<HTMLTextAreaElement>('[data-confirm-input]');
  const timerEl = $<HTMLElement>('[data-timer]');
  const bestEl = $<HTMLElement>('[data-best]');
  const play = $<HTMLElement>('[data-play]');
  const result = $<HTMLElement>('[data-result]');
  const emojiBox = $<HTMLElement>('[data-emoji]');
  const emojiToggle = $<HTMLButtonElement>('[data-emoji-toggle]');

  let state: State = 'start';
  let ctx: RuleContext;
  let revealed = 0;
  let startedAt = 0;
  let tick = 0;
  let lastFocused: HTMLTextAreaElement = input;
  const cards: HTMLLIElement[] = [];

  for (const { emoji, label } of HELPER_EMOJI) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pw-emoji-btn';
    b.textContent = emoji;
    b.setAttribute('aria-label', `Insert ${label}`);
    b.title = label;
    b.addEventListener('click', () => insertAtCursor(lastFocused, emoji));
    emojiBox.append(b);
  }
  emojiToggle.addEventListener('click', () => {
    const open = emojiBox.hidden;
    emojiBox.hidden = !open;
    emojiToggle.setAttribute('aria-expanded', String(open));
  });

  function insertAtCursor(target: HTMLTextAreaElement, text: string): void {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.setRangeText(text, start, end, 'end');
    target.focus();
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function autosize(t: HTMLTextAreaElement): void {
    t.style.height = 'auto';
    t.style.height = `${t.scrollHeight}px`;
  }

  function showBest(): void {
    const best = getBest(SLUG);
    bestEl.textContent = best != null ? `Your fastest win: ${formatTime(best)}` : '';
  }

  function reset(): void {
    state = 'start';
    ctx = {
      now: () => new Date(),
      digitTarget: 30 + (dayOfYear(new Date()) % 6),
      factorA: rand(6, 9),
      factorB: rand(6, 9),
    };
    revealed = 0;
    startedAt = 0;
    window.clearInterval(tick);
    timerEl.textContent = '';
    cards.length = 0;
    rulesEl.replaceChildren();
    input.value = '';
    confirmInput.value = '';
    confirmBox.hidden = true;
    autosize(input);
    count.textContent = '0';
    play.hidden = false;
    result.hidden = true;
    result.replaceChildren();
    el.dataset.state = state;
    showBest();
  }

  function card(i: number): HTMLLIElement {
    if (!cards[i]) {
      const li = document.createElement('li');
      li.className = 'pw-rule is-new';
      li.innerHTML = `<span class="pw-rule-head"><span class="pw-rule-icon" aria-hidden="true"></span>Rule ${i + 1}</span><span class="pw-rule-text"></span>`;
      rulesEl.append(li);
      cards[i] = li;
      window.setTimeout(() => li.classList.remove('is-new'), 400);
    }
    return cards[i];
  }

  function evaluate(): void {
    const pw = input.value;
    count.textContent = String(charCount(pw));
    if (state === 'result') return;
    if (state === 'start' && pw.length > 0) {
      state = 'playing';
      el.dataset.state = state;
      startedAt = performance.now();
      tick = window.setInterval(() => {
        timerEl.textContent = `⏱ ${formatTime(performance.now() - startedAt)}`;
        evaluate();
      }, 1000);
    }
    if (state !== 'playing') return;

    if (revealed === 0) revealed = 1;
    let results = RULES.slice(0, revealed).map((r) => r.check(pw, ctx));
    while (revealed < RULES.length && results.every(Boolean)) {
      revealed++;
      results = RULES.slice(0, revealed).map((r) => r.check(pw, ctx));
    }

    let order = 0;
    const indices = [...Array(revealed).keys()].reverse();
    for (const pass of [false, true]) {
      for (const i of indices) {
        if (results[i] !== pass) continue;
        const li = card(i);
        li.classList.toggle('is-ok', pass);
        li.classList.toggle('is-bad', !pass);
        li.style.order = String(order++);
        (li.querySelector('.pw-rule-icon') as HTMLElement).textContent = pass ? '✓' : '✗';
        (li.querySelector('.pw-rule-text') as HTMLElement).textContent = RULES[i].text(ctx);
        li.setAttribute('aria-label', `Rule ${i + 1}, ${pass ? 'passed' : 'not passed'}: ${RULES[i].text(ctx)}`);
      }
    }

    const allPass = revealed === RULES.length && results.every(Boolean);
    confirmBox.hidden = !allPass;
    if (allPass && confirmInput.value === pw && pw.length > 0) win(pw);
  }

  function win(pw: string): void {
    state = 'result';
    el.dataset.state = state;
    window.clearInterval(tick);
    const ms = performance.now() - startedAt;
    const secs = Math.max(1, Math.round(ms / 1000));
    const { best, isNewBest } = saveBest(SLUG, secs * 1000, true);
    const final = document.createElement('div');
    final.className = 'pw-final';
    final.innerHTML = `<p class="pw-final-label">Your final password (${charCount(pw)} characters)</p>`;
    const code = document.createElement('p');
    code.className = 'pw-final-code';
    code.textContent = pw;
    final.append(code);
    result.replaceChildren(
      createResultPanel(root, {
        label: 'You beat all the rules in',
        score: formatTime(ms),
        shareScore: formatTime(ms),
        message: `${RULES.length} silly rules, one very confused password. You did it!`,
        best: formatTime(best),
        isNewBest,
        extra: final,
        onPlayAgain: () => {
          reset();
          input.focus();
        },
      }),
    );
    play.hidden = true;
    result.hidden = false;
  }

  input.addEventListener('input', () => {
    autosize(input);
    evaluate();
  });
  confirmInput.addEventListener('input', () => {
    autosize(confirmInput);
    evaluate();
  });
  input.addEventListener('focus', () => (lastFocused = input));
  confirmInput.addEventListener('focus', () => (lastFocused = confirmInput));
  [input, confirmInput].forEach((t) =>
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault();
    }),
  );

  reset();
}
