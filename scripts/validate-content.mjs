// Checks the parts of each game page that the zod schema cannot see (the markdown body and files on disk).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, CONTENT_DIR, readGames } from './lib/games.mjs';
import { NET_WORTH_FILE, formatLong } from './lib/net-worth.mjs';

const REQUIRED_H2 = ['How To Play', 'What Your Score Means', 'Tips To Improve'];
const BANNED = ['this guide', 'in this guide', 'the catch is'];
const SMALL_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'at', 'by', 'in', 'of', 'on', 'to', 'up', 'as', 'vs', 'via', 'per', 'with', 'from', 'into',
]);

const errors = [];
const games = readGames();
const slugs = new Set(games.map((g) => g.data.slug));
const paragraphOwners = new Map();
const keywordOwners = new Map();

const plain = (md) =>
  md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/[*_`>|]/g, ' ');
const words = (s) => plain(s).split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/['’]s\b/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function isTitleCase(heading) {
  return heading.split(/\s+/).every((w, i) => {
    const bare = w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
    if (!bare || /^[0-9]/.test(bare)) return true;
    if (i > 0 && SMALL_WORDS.has(bare.toLowerCase())) return true;
    return bare[0] === bare[0].toUpperCase();
  });
}

for (const { file, data, body } of games) {
  const where = `src/content/games/${file}`;
  const fail = (msg) => errors.push(`${where}: ${msg}`);
  const slug = data.slug;
  const kw = String(data.primaryKeyword ?? '').toLowerCase();

  if (`${slug}.md` !== file) fail(`file name must be "${slug}.md"`);
  if (/\bTODO\b/.test(body)) fail('body still contains TODO placeholders');

  const count = words(body).length;
  if (count < 400 || count > 700) fail(`body must be 400-700 words, got ${count}`);

  const first100 = norm(words(`${data.h1 ?? ''} ${data.intro ?? ''} ${body}`).slice(0, 100).join(' '));
  if (!first100.includes(norm(kw))) fail('primary keyword must appear in the first 100 words');

  if (/^#\s/m.test(body)) fail('body must not contain an H1 (the layout renders it)');
  const h2s = [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
  const headings = [...body.matchAll(/^#{2,6}\s+(.+)$/gm)].map((m) => m[1].trim());
  for (const req of REQUIRED_H2) {
    if (!h2s.some((h) => h.startsWith(req))) fail(`missing H2 starting with "${req}"`);
  }
  if (!h2s.some((h) => norm(h).includes(norm(kw)))) fail('at least one H2 must contain the primary keyword');
  for (const h of headings) {
    if (h.includes('?')) fail(`heading must not be a question: "${h}"`);
    if (!isTitleCase(h)) fail(`heading must be Title Case: "${h}"`);
  }

  const lower = `${body} ${data.intro ?? ''}`.toLowerCase();
  for (const phrase of BANNED) if (lower.includes(phrase)) fail(`banned phrase "${phrase}"`);

  for (const para of body.split(/\n\s*\n/)) {
    const key = norm(plain(para));
    if (key.length < 60) continue;
    const owner = paragraphOwners.get(key);
    if (owner && owner !== slug) fail(`paragraph reused from ${owner}: "${para.slice(0, 60)}..."`);
    paragraphOwners.set(key, slug);
  }

  const kwOwner = keywordOwners.get(kw);
  if (kwOwner) fail(`primary keyword "${kw}" already used by ${kwOwner}`);
  keywordOwners.set(kw, slug);

  for (const rel of data.related ?? []) {
    if (rel === slug) fail('related must not include itself');
    else if (!slugs.has(rel)) fail(`related slug "${rel}" does not exist`);
  }

  if (!existsSync(join(ROOT, 'src', 'games', slug, 'game.ts'))) fail(`missing src/games/${slug}/game.ts`);
  if (!existsSync(join(ROOT, 'public', 'thumbs', `${slug}.svg`))) fail(`missing public/thumbs/${slug}.svg`);
}

const worths = existsSync(NET_WORTH_FILE) ? JSON.parse(readFileSync(NET_WORTH_FILE, 'utf8')) : {};
for (const [slug, entry] of Object.entries(worths)) {
  const where = 'src/data/spend/net-worth.json';
  if (!slugs.has(slug)) errors.push(`${where}: "${slug}" has no matching game`);
  if (!entry.forbesUri || entry.forbesUri.includes('TODO')) errors.push(`${where}: set forbesUri for "${slug}"`);
  if (!(entry.netWorth > 0)) {
    errors.push(`${where}: netWorth for "${slug}" must be set (run npm run update-net-worth -- --check)`);
    continue;
  }
  const md = join(CONTENT_DIR, `${slug}.md`);
  if (existsSync(md) && !readFileSync(md, 'utf8').includes(formatLong(entry.netWorth))) {
    errors.push(`src/content/games/${slug}.md: copy must mention the current figure "${formatLong(entry.netWorth)}"`);
  }
}

if (errors.length) {
  console.error(`\nContent validation failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error('');
  process.exit(1);
}
console.log(`Content validation passed for ${games.length} game${games.length === 1 ? '' : 's'}.`);
