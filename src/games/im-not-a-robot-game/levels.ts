import { art, LABELS, type ArtName } from './art';

export interface LevelCtx {
  body: HTMLElement;
  setPrompt(text: string): void;
  /** Shows the footer button; pass null to hide it. */
  setVerify(fn: (() => void) | null, label?: string): void;
  pass(msg?: string): void;
  fail(msg: string): void;
  later(fn: () => void, ms: number): void;
  frame(fn: (now: number) => boolean): void;
  onCleanup(fn: () => void): void;
}

export interface Level {
  prompt: string;
  hint: string;
  render(ctx: LevelCtx): void;
}

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

function button(label: string, cls = 'btn btn--white'): HTMLButtonElement {
  const b = h('button', cls);
  b.type = 'button';
  b.textContent = label;
  return b;
}

function center(ctx: LevelCtx, ...els: HTMLElement[]): void {
  const c = h('div', 'rb-center');
  c.append(...els);
  ctx.body.append(c);
}

/** A 3x3 grid of toggle tiles. Returns the set of selected indexes. */
function tileGrid(ctx: LevelCtx, items: ArtName[]): Set<number> {
  const picked = new Set<number>();
  const grid = h('div', 'rb-grid');
  items.forEach((name, i) => {
    const b = h('button', 'rb-tile', art(name));
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', `Tile ${i + 1}: ${LABELS[name]}`);
    b.addEventListener('click', () => {
      if (picked.has(i)) picked.delete(i);
      else picked.add(i);
      b.setAttribute('aria-pressed', String(picked.has(i)));
    });
    grid.append(b);
  });
  ctx.body.append(grid);
  return picked;
}

function sameSet(a: Set<number>, b: Set<number>): boolean {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

/** A text box with a label; Enter triggers the verify action. */
function textInput(ctx: LevelCtx, label: string, opts: { numeric?: boolean; placeholder?: string } = {}): HTMLInputElement {
  const id = `rb-in-${Math.random().toString(36).slice(2, 8)}`;
  const wrap = h('div', 'rb-field');
  const lab = h('label', 'rb-label');
  lab.htmlFor = id;
  lab.textContent = label;
  const input = h('input', 'rb-input');
  input.id = id;
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  if (opts.numeric) input.inputMode = 'numeric';
  if (opts.placeholder) input.placeholder = opts.placeholder;
  wrap.append(lab, input);
  ctx.body.append(wrap);
  return input;
}

function bindEnter(input: HTMLInputElement, fn: () => void): void {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fn();
    }
  });
}

const FRUIT: ArtName[] = ['banana', 'pear', 'cherry'];
const WORDS = ['wobble', 'pickle', 'noodle', 'kazoo', 'sprocket', 'gizmo', 'muffin', 'blorp', 'zigzag', 'turnip'];
const INKS = [
  { name: 'red', color: '#e23b2e' },
  { name: 'blue', color: '#2f6fe0' },
  { name: 'green', color: '#1f9d55' },
  { name: 'purple', color: '#8a4fd8' },
  { name: 'orange', color: '#ef7d1a' },
  { name: 'pink', color: '#e0559b' },
];
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SECRET = ['turnip', 'pudding', 'walrus', 'teapot', 'pancake', 'bubbles'];

export const LEVELS: Level[] = [
  {
    prompt: 'Tick the box to prove you are a human.',
    hint: 'It really is just a checkbox. Enjoy it while it lasts.',
    render(ctx) {
      ctx.setVerify(null);
      const b = h('button', 'rb-check', '<span class="rb-box" aria-hidden="true"></span><span>I\'m not a robot</span>');
      b.type = 'button';
      b.setAttribute('role', 'checkbox');
      b.setAttribute('aria-checked', 'false');
      b.addEventListener('click', () => {
        if (b.classList.contains('is-busy')) return;
        b.classList.add('is-busy');
        ctx.later(() => {
          b.setAttribute('aria-checked', 'true');
          ctx.pass('Wow, a natural. Next!');
        }, 700);
      });
      center(ctx, b);
    },
  },
  {
    prompt: 'Tick every box that is true about you.',
    hint: 'You are a human, right? Leave the robot one alone.',
    render(ctx) {
      const items = shuffle([
        { t: 'I have elbows', ok: true },
        { t: 'I have eaten a sandwich at least once', ok: true },
        { t: 'I am a robot', ok: false },
        { t: 'I have been bored before', ok: true },
        { t: 'My favorite food is electricity', ok: false },
      ]);
      const list = h('div', 'rb-list');
      const boxes: HTMLInputElement[] = [];
      items.forEach((it, i) => {
        const lab = h('label', 'rb-opt');
        const cb = h('input');
        cb.type = 'checkbox';
        cb.dataset.i = String(i);
        boxes.push(cb);
        lab.append(cb, document.createTextNode(` ${it.t}`));
        list.append(lab);
      });
      ctx.body.append(list);
      ctx.setVerify(() => {
        const wrong = items.filter((it, i) => boxes[i].checked !== it.ok);
        if (!wrong.length) ctx.pass();
        else if (items.some((it, i) => !it.ok && boxes[i].checked)) ctx.fail('Interesting answer. Our robot detector just beeped.');
        else ctx.fail('You missed a true one. Do you not have elbows?');
      });
    },
  },
  {
    prompt: 'Select all tiles with an apple.',
    hint: 'Apples are the round red ones with a little leaf.',
    render(ctx) {
      const count = rand(3, 5);
      const items = shuffle([...Array(count).fill('apple'), ...Array.from({ length: 9 - count }, () => pick(FRUIT))]) as ArtName[];
      const picked = tileGrid(ctx, items);
      const want = new Set(items.map((n, i) => (n === 'apple' ? i : -1)).filter((i) => i >= 0));
      ctx.setVerify(() => (sameSet(picked, want) ? ctx.pass() : ctx.fail('Those are not all the apples. Or they are not apples at all.')));
    },
  },
  {
    prompt: 'Type the wobbly word below.',
    hint: 'Lowercase is fine. The squiggly line is not a letter.',
    render(ctx) {
      const word = pick(WORDS);
      const box = h('div', 'rb-warp');
      box.setAttribute('role', 'img');
      box.setAttribute('aria-label', `Distorted letters spelling ${word.split('').join(' ')}`);
      box.innerHTML =
        word
          .split('')
          .map((c) => {
            const r = rand(-28, 28);
            const y = rand(-10, 10);
            const s = (0.85 + Math.random() * 0.5).toFixed(2);
            return `<span style="transform: translateY(${y}px) rotate(${r}deg) scale(${s}); color: ${pick(INKS).color}">${c}</span>`;
          })
          .join('') +
        `<svg class="rb-warp-line" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 ${rand(30, 50)}C60 ${rand(0, 80)} 120 ${rand(0, 80)} 160 40S260 ${rand(0, 80)} 300 ${rand(30, 50)}" fill="none" stroke="currentColor" stroke-width="3"/></svg>`;
      ctx.body.append(box);
      const input = textInput(ctx, 'Type the word');
      const check = () => (norm(input.value) === word ? ctx.pass() : ctx.fail('Not quite. Are your eyes made of cameras?'));
      bindEnter(input, check);
      ctx.setVerify(check);
    },
  },
  {
    prompt: 'Set the slider to exactly',
    hint: 'Arrow keys move the slider one step at a time.',
    render(ctx) {
      const target = rand(12, 88);
      ctx.setPrompt(`Set the slider to exactly ${target}.`);
      const wrap = h('div', 'rb-field');
      const id = 'rb-slider';
      const lab = h('label', 'rb-label');
      lab.htmlFor = id;
      lab.textContent = 'Slider value';
      const out = h('output', 'rb-out', '50');
      const range = h('input', 'rb-range');
      range.type = 'range';
      range.id = id;
      range.min = '0';
      range.max = '100';
      range.value = '50';
      range.addEventListener('input', () => (out.textContent = range.value));
      wrap.append(lab, range, out);
      ctx.body.append(wrap);
      ctx.setVerify(() =>
        Number(range.value) === target ? ctx.pass() : ctx.fail(`That says ${range.value}. Close only counts in horseshoes.`),
      );
    },
  },
  {
    prompt: 'Select all the humans. Some robots are in disguise.',
    hint: 'Fake glasses do not hide an antenna.',
    render(ctx) {
      const humans = rand(2, 4);
      const disguised = rand(2, 3);
      const items = shuffle([
        ...Array(humans).fill('human'),
        ...Array(disguised).fill('disguise'),
        ...Array(9 - humans - disguised).fill('robot'),
      ]) as ArtName[];
      const picked = tileGrid(ctx, items);
      const want = new Set(items.map((n, i) => (n === 'human' ? i : -1)).filter((i) => i >= 0));
      ctx.setVerify(() =>
        sameSet(picked, want) ? ctx.pass() : ctx.fail('You just let a robot in a mustache through. Or left a human out.'),
      );
    },
  },
  {
    prompt: 'Press STOP when the marker is inside the green zone.',
    hint: 'Watch the marker bounce once, then time your tap.',
    render(ctx) {
      ctx.setVerify(null);
      const zoneStart = rand(15, 70);
      const zoneW = 14;
      const bar = h('div', 'rb-bar', `<span class="rb-zone" style="left:${zoneStart}%;width:${zoneW}%"></span><span class="rb-marker"></span>`);
      bar.setAttribute('aria-hidden', 'true');
      const marker = bar.querySelector('.rb-marker') as HTMLElement;
      const stop = button('⏹ STOP', 'btn btn--tomato btn--big');
      let pos = 0;
      let stopped = false;
      const t0 = performance.now();
      ctx.frame((now) => {
        const t = ((now - t0) / 1600) % 2;
        pos = (t < 1 ? t : 2 - t) * 100;
        marker.style.left = `${pos}%`;
        return !stopped;
      });
      stop.addEventListener('click', () => {
        if (stopped) return;
        stopped = true;
        if (pos >= zoneStart - 1 && pos <= zoneStart + zoneW + 1) ctx.pass('Perfect timing. Very human.');
        else ctx.fail('Missed the green zone. A robot would have nailed that. So… good?');
      });
      ctx.body.append(bar);
      center(ctx, stop);
    },
  },
  {
    prompt: 'Quick check: what is 2 + 2?',
    hint: 'Humans make mistakes. Robots never do. Be more human.',
    render(ctx) {
      const input = textInput(ctx, 'Your answer', { numeric: true });
      const check = () => {
        const v = norm(input.value);
        if (!v) return ctx.fail('Please type something. Anything.');
        if (v === '4' || v === 'four') ctx.fail('Correct. Suspiciously correct. Only a robot is that good at math.');
        else ctx.pass('Wrong! Beautifully, humanly wrong.');
      };
      bindEnter(input, check);
      ctx.setVerify(check);
    },
  },
  {
    prompt: 'Turn the cat so it is the right way up.',
    hint: 'Ears on top, chin at the bottom.',
    render(ctx) {
      let turns = rand(1, 7);
      const stage = h('div', 'rb-rotate', art('cat'));
      const svg = stage.querySelector('svg') as SVGElement;
      const show = () => (svg.style.transform = `rotate(${turns * 45}deg)`);
      show();
      const row = h('div', 'rb-row');
      const left = button('↺ Turn left');
      const right = button('↻ Turn right');
      left.addEventListener('click', () => {
        turns = (turns + 7) % 8;
        show();
      });
      right.addEventListener('click', () => {
        turns = (turns + 1) % 8;
        show();
      });
      row.append(left, right);
      ctx.body.append(stage, row);
      ctx.setVerify(() => (turns === 0 ? ctx.pass('The cat thanks you.') : ctx.fail('The cat is still dizzy. Keep turning.')));
    },
  },
  {
    prompt: 'Click the word painted in GREEN ink.',
    hint: 'Ignore what the word says. Look at its color.',
    render(ctx) {
      ctx.setVerify(null);
      const inks = shuffle(INKS.filter((c) => c.name !== 'green')).slice(0, 5);
      inks.push(INKS[2]);
      const order = shuffle(inks);
      const names = INKS.map((c) => c.name);
      const wrap = h('div', 'rb-words');
      order.forEach((ink) => {
        const word = pick(names.filter((n) => n !== ink.name));
        const b = h('button', 'rb-word');
        b.type = 'button';
        b.textContent = word.toUpperCase();
        b.style.color = ink.color;
        b.setAttribute('aria-label', `The word ${word} written in ${ink.name} ink`);
        b.addEventListener('click', () =>
          ink.name === 'green' ? ctx.pass() : ctx.fail(`That one is painted ${ink.name}. Reading is a very robot thing to do.`),
        );
        wrap.append(b);
      });
      ctx.body.append(wrap);
    },
  },
  {
    prompt: 'Please wait while we check you. Do not touch anything.',
    hint: 'Patience is a human skill. Do not press the shiny button.',
    render(ctx) {
      ctx.setVerify(null);
      const bar = h('div', 'rb-progress', '<span></span>');
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-label', 'Checking');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      const fill = bar.firstElementChild as HTMLElement;
      const note = h('p', 'rb-note', 'Scanning your vibes…');
      const tempt = button('⚡ Make it faster', 'btn btn--pink');
      tempt.addEventListener('click', () => ctx.fail('We said do not touch anything. Robots are so impatient.'));
      const t0 = performance.now();
      const lines = ['Scanning your vibes…', 'Counting your fingers…', 'Asking your houseplant…', 'Almost there…'];
      let done = false;
      ctx.frame((now) => {
        const k = Math.min(1, (now - t0) / 6000);
        fill.style.width = `${k * 100}%`;
        bar.setAttribute('aria-valuenow', String(Math.round(k * 100)));
        note.textContent = lines[Math.min(lines.length - 1, Math.floor(k * lines.length))];
        if (k >= 1 && !done) {
          done = true;
          ctx.pass('Patience confirmed.');
        }
        return k < 1;
      });
      ctx.body.append(bar, note);
      center(ctx, tempt);
    },
  },
  {
    prompt: 'Type "i am human" backwards.',
    hint: 'Start from the last letter: n, a, m…',
    render(ctx) {
      const input = textInput(ctx, 'Backwards text');
      const check = () =>
        norm(input.value) === 'namuh ma i' ? ctx.pass() : ctx.fail('That is not backwards enough. Try reading it in a mirror.');
      bindEnter(input, check);
      ctx.setVerify(check);
    },
  },
  {
    prompt: 'How many dots are there?',
    hint: 'Count them row by row. Touch the screen with your finger if it helps.',
    render(ctx) {
      const n = rand(11, 17);
      const cells = shuffle(Array.from({ length: 24 }, (_, i) => i)).slice(0, n);
      const dots = cells
        .map((c) => {
          const x = (c % 6) * 50 + 25 + rand(-10, 10);
          const y = Math.floor(c / 6) * 40 + 20 + rand(-8, 8);
          return `<circle cx="${x}" cy="${y}" r="${rand(7, 11)}" fill="${pick(INKS).color}" stroke="#1f1a2e" stroke-width="2.5"/>`;
        })
        .join('');
      const box = h('div', 'rb-dots', `<svg viewBox="0 0 300 160" aria-hidden="true">${dots}</svg>`);
      ctx.body.append(box);
      const input = textInput(ctx, 'Number of dots', { numeric: true });
      const check = () =>
        Number(input.value.trim()) === n ? ctx.pass() : ctx.fail('That is not the number. We counted. Twice.');
      bindEnter(input, check);
      ctx.setVerify(check);
    },
  },
  {
    prompt: 'Press and hold the button for exactly 3 seconds.',
    hint: 'Count slowly in your head: one banana, two banana, three banana.',
    render(ctx) {
      ctx.setVerify(null);
      const b = button('✋ Hold me', 'btn btn--grape btn--big rb-hold');
      let start = 0;
      const down = () => {
        if (start) return;
        start = performance.now();
        b.classList.add('is-holding');
        b.textContent = '✋ Holding…';
      };
      const up = () => {
        if (!start) return;
        const held = (performance.now() - start) / 1000;
        start = 0;
        b.classList.remove('is-holding');
        b.textContent = '✋ Hold me';
        if (held >= 2.6 && held <= 3.4) ctx.pass(`You held it for ${held.toFixed(2)} seconds. Human timing!`);
        else ctx.fail(`You held it for ${held.toFixed(2)} seconds. That is not 3.`);
      };
      b.addEventListener('pointerdown', (e) => {
        b.setPointerCapture?.(e.pointerId);
        down();
      });
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', () => {
        start = 0;
        b.classList.remove('is-holding');
      });
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      b.addEventListener('keydown', (e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          down();
        }
      });
      b.addEventListener('keyup', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          up();
        }
      });
      center(ctx, b);
    },
  },
  {
    prompt: 'Select all tiles with a stop sign.',
    hint: 'Look very closely. Then ask yourself if there are any at all.',
    render(ctx) {
      const pool: ArtName[] = ['tomato', 'ball', 'apple', 'cherry', 'mushroom'];
      const items = Array.from({ length: 9 }, () => pick(pool));
      const picked = tileGrid(ctx, items);
      ctx.setVerify(
        () => (picked.size === 0 ? ctx.pass('Correct. There were no stop signs. There never were.') : ctx.fail('That is not a stop sign. Why would you pick that?')),
        'Verify',
      );
    },
  },
  {
    prompt: 'Tick the box. It is a little shy.',
    hint: 'Keep chasing it. It gets tired eventually.',
    render(ctx) {
      ctx.setVerify(null);
      const area = h('div', 'rb-shy');
      const b = h('button', 'rb-check rb-check--small', '<span class="rb-box" aria-hidden="true"></span><span>I\'m human</span>');
      b.type = 'button';
      b.setAttribute('role', 'checkbox');
      b.setAttribute('aria-checked', 'false');
      let runs = 0;
      const spots = [
        [4, 6],
        [96, 94],
        [92, 4],
        [6, 92],
        [50, 50],
      ];
      const place = () => {
        const [x, y] = spots[runs % spots.length];
        b.style.left = `${x}%`;
        b.style.top = `${y}%`;
        b.style.transform = `translate(-${x}%, -${y}%)`;
      };
      place();
      b.addEventListener('click', () => {
        if (runs < 4) {
          runs += 1;
          place();
          return;
        }
        b.setAttribute('aria-checked', 'true');
        ctx.pass('Got it! It was just nervous.');
      });
      area.append(b);
      ctx.body.append(area);
    },
  },
  {
    prompt: 'Remember this code.',
    hint: 'Say the numbers out loud. It helps, honestly.',
    render(ctx) {
      const code = String(rand(10000, 99999));
      const show = h('p', 'rb-code', code);
      show.setAttribute('aria-live', 'polite');
      ctx.body.append(show);
      ctx.setVerify(null);
      ctx.later(() => {
        show.textContent = '•••••';
        ctx.setPrompt('Now type the code you just saw.');
        const input = textInput(ctx, 'The code');
        input.inputMode = 'numeric';
        input.focus({ preventScroll: true });
        const check = () => (input.value.trim() === code ? ctx.pass() : ctx.fail('Nope. Your memory has been reported to the authorities.'));
        bindEnter(input, check);
        ctx.setVerify(check);
      }, 2500);
    },
  },
  {
    prompt: 'Please rate your verification experience so far.',
    hint: 'We only accept glowing reviews.',
    render(ctx) {
      ctx.setVerify(null);
      const row = h('div', 'rb-stars');
      for (let i = 1; i <= 5; i++) {
        const b = h('button', 'rb-star', '★');
        b.type = 'button';
        b.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
        b.addEventListener('click', () =>
          i === 5 ? ctx.pass('Thank you! We love you too.') : ctx.fail(`${i} star${i > 1 ? 's' : ''}? Only a cold, heartless robot would say that.`),
        );
        row.append(b);
      }
      ctx.body.append(row);
    },
  },
  {
    prompt: 'Read the terms, then type the secret word hidden inside.',
    hint: 'Scroll all the way to the very bottom of the terms box.',
    render(ctx) {
      const secret = pick(SECRET);
      const terms = h(
        'div',
        'rb-terms',
        `<p>1. By reading this you agree that you are not a toaster.</p>
        <p>2. You promise to blink at least once per minute while verifying.</p>
        <p>3. Any robot found reading these terms must beep twice and leave quietly.</p>
        <p>4. Your snacks remain yours. We will not ask about the snacks.</p>
        <p>5. Socks lost in the dryer are not covered by these terms.</p>
        <p>6. You may not use a calculator, a cat or a very clever pigeon to help you.</p>
        <p>7. These terms may change whenever we get bored.</p>
        <p>8. Thank you for scrolling this far. Almost nobody does.</p>
        <p class="rb-secret">9. The secret word is <strong>${secret}</strong>.</p>`,
      );
      terms.tabIndex = 0;
      terms.setAttribute('aria-label', 'Terms of humanity, scrollable');
      ctx.body.append(terms);
      const input = textInput(ctx, 'Secret word');
      const check = () => (norm(input.value) === secret ? ctx.pass('A human who reads the terms. Rare!') : ctx.fail('Wrong word. Did you actually read the terms?'));
      bindEnter(input, check);
      ctx.setVerify(check);
    },
  },
  {
    prompt: 'Tap the one that does not belong.',
    hint: 'Most of these tiles are food. One of them is not.',
    render(ctx) {
      ctx.setVerify(null);
      const odd = pick<ArtName>(['sock', 'boot', 'robot', 'cloud']);
      const items: ArtName[] = Array.from({ length: 8 }, () => pick<ArtName>(['apple', 'banana', 'pear', 'cherry', 'tomato']));
      const at = rand(0, 8);
      items.splice(at, 0, odd);
      const grid = h('div', 'rb-grid');
      items.forEach((name, i) => {
        const b = h('button', 'rb-tile', art(name));
        b.type = 'button';
        b.setAttribute('aria-label', `Tile ${i + 1}: ${LABELS[name]}`);
        b.addEventListener('click', () => (i === at ? ctx.pass() : ctx.fail('That one totally belongs. It is food. Try again.')));
        grid.append(b);
      });
      ctx.body.append(grid);
    },
  },
  {
    prompt: 'What day of the week is it today?',
    hint: 'Check the corner of your screen. We will wait.',
    render(ctx) {
      const today = DAYS[new Date().getDay()];
      const input = textInput(ctx, 'Day of the week', { placeholder: 'e.g. Saturday' });
      const check = () => {
        const v = norm(input.value);
        if (v.length >= 3 && today.startsWith(v)) ctx.pass();
        else ctx.fail('That is not today. Have you been living in a server room?');
      };
      bindEnter(input, check);
      ctx.setVerify(check);
    },
  },
  {
    prompt: 'Tap the button 10 times in 3 seconds.',
    hint: 'Use two fingers, or tap Space really fast on a keyboard.',
    render(ctx) {
      ctx.setVerify(null);
      const b = button('👆 Tap! (0 / 10)', 'btn btn--mint btn--big');
      let taps = 0;
      let first = 0;
      let over = false;
      b.addEventListener('click', () => {
        if (over) return;
        if (!taps) {
          first = performance.now();
          ctx.later(() => {
            if (over) return;
            over = true;
            ctx.fail(`Only ${taps} taps in 3 seconds. Even a sleepy robot tapped faster.`);
          }, 3000);
        }
        taps += 1;
        b.textContent = `👆 Tap! (${taps} / 10)`;
        if (taps >= 10) {
          over = true;
          ctx.pass(`10 taps in ${((performance.now() - first) / 1000).toFixed(1)} seconds. Speedy fingers!`);
        }
      });
      center(ctx, b);
    },
  },
  {
    prompt: 'Final question. Are you a robot?',
    hint: 'Stick to your answer. Do not let us confuse you.',
    render(ctx) {
      ctx.setVerify(null);
      const asks = [
        'Final question. Are you a robot?',
        'Hmm. That is exactly what a robot would say. Are you a robot?',
        'Our scanner says you might be a toaster. Are you a robot?',
        'Last chance to be honest. Are you a robot?',
      ];
      let step = 0;
      const row = h('div', 'rb-row rb-row--big');
      const draw = () => {
        ctx.setPrompt(asks[step]);
        const yes = button(step === 2 ? 'Yes, beep boop' : 'Yes', 'btn btn--mint');
        const no = button(step === 3 ? 'No! I am a human!' : 'No', 'btn btn--tomato');
        yes.addEventListener('click', () => ctx.fail('Thank you for your honesty, robot. Please start this question again.'));
        no.addEventListener('click', () => {
          step += 1;
          if (step >= asks.length) ctx.pass('Fine. We believe you. Probably.');
          else draw();
        });
        row.replaceChildren(...(step % 2 ? [no, yes] : [yes, no]));
        (step % 2 ? no : yes).focus({ preventScroll: true });
      };
      ctx.body.append(row);
      draw();
    },
  },
];
