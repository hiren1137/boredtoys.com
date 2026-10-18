#!/usr/bin/env node
// Usage: npm run new-game -- <slug> "<Title>" <category> [--spend]
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readGames } from './lib/games.mjs';

const CATEGORIES = ['reflex', 'memory', 'puzzle', 'drawing', 'quiz', 'toy', 'simulation'];
const COLORS = {
  reflex: '#ff7466',
  memory: '#c7a3ff',
  puzzle: '#6cc8ff',
  drawing: '#6be3a8',
  quiz: '#ffd447',
  toy: '#ffa3d1',
  simulation: '#ffac57',
};

const args = process.argv.slice(2);
const spend = args.includes('--spend');
const [slug, title, category] = args.filter((a) => a !== '--spend');

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  console.error('Usage: npm run new-game -- <slug> "<Title>" <category> [--spend]');
  console.error(`Categories: ${CATEGORIES.join(', ')}\n`);
  process.exit(1);
}

if (!slug || !title || !category) die('Missing arguments.');
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) die(`Slug "${slug}" must be lowercase and hyphenated, e.g. reaction-time-test.`);
if (!CATEGORIES.includes(category)) die(`Unknown category "${category}".`);

const files = {
  game: join(ROOT, 'src', 'games', slug, 'game.ts'),
  css: join(ROOT, 'src', 'games', slug, 'game.css'),
  content: join(ROOT, 'src', 'content', 'games', `${slug}.md`),
  thumb: join(ROOT, 'public', 'thumbs', `${slug}.svg`),
  data: join(ROOT, 'src', 'data', 'spend', `${slug}.ts`),
};
for (const [k, f] of Object.entries(files)) {
  if (k === 'data' && !spend) continue;
  if (k === 'css' && spend) continue;
  if (existsSync(f)) die(`${f.replace(ROOT + '/', '')} already exists. Refusing to overwrite.`);
}

// Keyword overlap check against existing games.
const tokens = (s) => new Set(String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && w !== 'game' && w !== 'games' && w !== 'test'));
const mine = tokens(slug);
const overlaps = readGames()
  .map(({ data }) => {
    const theirs = new Set([...tokens(data.slug), ...tokens(data.primaryKeyword)]);
    const shared = [...mine].filter((t) => theirs.has(t));
    const ratio = shared.length / Math.max(1, Math.min(mine.size, theirs.size));
    return { slug: data.slug, kw: data.primaryKeyword, shared, ratio };
  })
  .filter((o) => o.ratio >= 0.5);

const today = new Date().toISOString().slice(0, 10);
const titleCase = (s) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

const gameTs = spend
  ? `import { mountSpend } from '../_spend/engine';
import data from '../../data/spend/${slug}';

export function mount(root: HTMLElement): void {
  mountSpend(root, data);
}
`
  : `import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';

const SLUG = '${slug}';
type State = 'start' | 'playing' | 'result';

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-${slug}';
  root.append(el);

  let state: State = 'start';
  let score = 0;

  function render(): void {
    el.dataset.state = state;
    el.replaceChildren();
    if (state === 'start') {
      const best = getBest(SLUG);
      const box = document.createElement('div');
      box.className = 'g-screen';
      box.innerHTML = \`
        <p class="g-big">TODO: one line telling the player what to do</p>
        \${best != null ? \`<p>Your best: \${best}</p>\` : ''}
        <button type="button" class="btn btn--big btn--mint" data-start>▶ Start</button>
        <p class="g-hint">Tap, click or press Space</p>\`;
      box.querySelector('[data-start]')?.addEventListener('click', start);
      el.append(box);
    } else if (state === 'playing') {
      const area = document.createElement('div');
      area.className = 'g-area';
      area.tabIndex = 0;
      area.setAttribute('role', 'application');
      area.setAttribute('aria-label', '${title.replace(/'/g, "\\'")} play area');
      area.textContent = \`Score: \${score}\`;
      el.append(area);
      area.focus({ preventScroll: true });
    } else {
      const { best, isNewBest } = saveBest(SLUG, score);
      el.append(
        createResultPanel(root, {
          label: 'Your score',
          score: String(score),
          best: String(best),
          isNewBest,
          message: 'TODO: a fun message based on the score',
          onPlayAgain: start,
        }),
      );
    }
  }

  function start(): void {
    score = 0;
    state = 'playing';
    render();
  }

  function act(): void {
    if (state !== 'playing') return;
    score += 1;
    if (score >= 10) finish();
    else render();
  }

  function finish(): void {
    state = 'result';
    render();
  }

  // Pointer events cover mouse, pen and touch in one handler.
  el.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    e.preventDefault();
    act();
  });
  // Keyboard: Space or Enter acts, only while the game has focus.
  el.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      if ((e.target as HTMLElement).closest('button, a')) return;
      e.preventDefault();
      if (state === 'start') start();
      else act();
    }
  });

  render();
}
`;

const gameCss = `.g-${slug} {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  text-align: center;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
.g-${slug} .g-screen {
  max-width: 420px;
}
.g-${slug} .g-big {
  font-family: var(--font-round);
  font-weight: 900;
  font-size: 1.6rem;
}
.g-${slug} .g-hint {
  margin-top: 12px;
  color: var(--ink-soft);
  font-size: 0.9rem;
}
.g-${slug} .g-area {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 900;
  cursor: pointer;
}
`;

const md = `---
slug: ${slug}
title: "${title.replace(/"/g, '\\"')}"
h1: "TODO ${titleCase(slug.replace(/-/g, ' '))}"
metaTitle: "TODO ${titleCase(slug.replace(/-/g, ' '))}"
metaDescription: "TODO 140-155 characters, includes the primary keyword, written as a hook someone wants to click."
primaryKeyword: "TODO ${slug.replace(/-/g, ' ')}"
secondaryKeywords:
  - "TODO keyword one"
  - "TODO keyword two"
  - "TODO keyword three"
category: ${category}
tags:
  - "TODO"
shortDescription: "TODO under 90 characters"
intro: "TODO one short intro line that includes the primary keyword."
thumbAlt: "TODO describe the thumbnail art"
faqs:
  - question: "TODO question one"
    answer: "TODO answer one"
  - question: "TODO question two"
    answer: "TODO answer two"
  - question: "TODO question three"
    answer: "TODO answer three"
  - question: "TODO question four"
    answer: "TODO answer four"
related: []
featured: false
publishedAt: ${today}
updatedAt: ${today}
shareText: "TODO I got {score} on ${title.replace(/"/g, '\\"')}. Beat that:"
stageHeight: ${spend ? 1200 : 560}
${spend ? 'stageHeightMobile: 1200\n' : ''}---

## How To Play TODO

TODO

## What Your Score Means

TODO

## Tips To Improve

TODO

## Fun Facts and Background

TODO
`;

const color = COLORS[category];
const thumb = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="400" height="300" fill="#fffdf7"/>
  <rect x="40" y="40" width="320" height="220" rx="28" fill="${color}" stroke="#1f1a2e" stroke-width="6"/>
  <text x="200" y="185" font-family="system-ui, sans-serif" font-size="120" font-weight="900" text-anchor="middle" fill="#1f1a2e">?</text>
</svg>
`;

const spendData = `import type { SpendData } from '../../games/_spend/types';
import { netWorthFor } from './net-worth';

// Net worth lives in net-worth.json and is refreshed from Forbes. Prices should be realistic and roughly current.
const data: SpendData = {
  slug: '${slug}',
  person: 'TODO Full Name',
  possessive: "TODO Full Name's",
  ...netWorthFor('${slug}'),
  sourceName: 'Forbes Real-Time Billionaires',
  sourceUrl: 'https://www.forbes.com/profile/TODO-forbes-uri/',
  items: [
    // { id: 'burger', name: 'Cheeseburger', price: 6, icon: 'burger' },
  ],
};

export default data;
`;

mkdirSync(join(ROOT, 'src', 'games', slug), { recursive: true });
mkdirSync(join(ROOT, 'src', 'content', 'games'), { recursive: true });
mkdirSync(join(ROOT, 'public', 'thumbs'), { recursive: true });
writeFileSync(files.game, gameTs);
if (!spend) writeFileSync(files.css, gameCss);
writeFileSync(files.content, md);
writeFileSync(files.thumb, thumb);
if (spend) {
  mkdirSync(join(ROOT, 'src', 'data', 'spend'), { recursive: true });
  writeFileSync(files.data, spendData);
  const worthFile = join(ROOT, 'src', 'data', 'spend', 'net-worth.json');
  const worths = existsSync(worthFile) ? JSON.parse(readFileSync(worthFile, 'utf8')) : {};
  worths[slug] = { forbesUri: 'TODO-forbes-uri', netWorth: 0, asOf: today };
  writeFileSync(worthFile, `${JSON.stringify(worths, null, 2)}\n`);
}

const rel = (f) => f.replace(ROOT + '/', '');
console.log(`\n✔ Scaffolded "${title}" (${category})\n`);
for (const [k, f] of Object.entries(files)) {
  if ((k === 'data' && !spend) || (k === 'css' && spend)) continue;
  console.log(`  + ${rel(f)}`);
}
if (overlaps.length) {
  console.log('\n⚠ Possible keyword overlap. Check before building:');
  for (const o of overlaps) console.log(`  - ${o.slug} ("${o.kw}") shares: ${o.shared.join(', ')}`);
}
console.log(`
Every TODO must be replaced. The build fails while any remain.

QA checklist (run before shipping):
  [ ] Plays correctly on a phone (touch) and desktop (mouse + keyboard)
  [ ] No console errors
  [ ] Personal best saves and survives a refresh
  [ ] Share button works and includes the real score + URL
  [ ] npm run build passes (schema validation included)
  [ ] Lighthouse 95+ on all four categories
  [ ] metaTitle 50-60 chars (with suffix), metaDescription 140-155 chars
  [ ] Primary keyword in the slug, H1, metaTitle, first 100 words, and at least one H2
  [ ] Appears on homepage, its category page, sitemap, RSS and llms.txt
  [ ] OG image renders correctly (/og/${slug}.png)
  [ ] Rich Results Test passes for the page's JSON-LD
`);
