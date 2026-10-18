#!/usr/bin/env node
// Refreshes spend-game net worths from Forbes Real-Time Billionaires.
//
//   npm run update-net-worth            update data + page copy, keep old values on any failure
//   npm run update-net-worth -- --check print the latest Forbes figures without writing anything
//
// The page copy must spell the figure the same way formatLong/formatShort/formatDate do
// (e.g. "$117.8 billion", "$117.8B", "October 17, 2026") so it can be swapped in place.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CONTENT_DIR } from './lib/games.mjs';
import { NET_WORTH_FILE as DATA_FILE, roundWorth, formatLong, formatShort, formatDate } from './lib/net-worth.mjs';

const FEED =
  'https://www.forbes.com/forbesapi/person/rtb/0/position/true.json?fields=uri,personName,finalWorth,timestamp&limit=500';
const MAX_SWING = 0.4;
const checkOnly = process.argv.includes('--check');

async function fetchFeed(attempts = 3) {
  for (let i = 1; ; i++) {
    try {
      return await fetchFeedOnce();
    } catch (err) {
      if (i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 3000 * i));
    }
  }
}

async function fetchFeedOnce() {
  const res = await fetch(FEED, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; net-worth-updater)', accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Forbes responded ${res.status}`);
  const json = await res.json();
  const list = json?.personList?.personsLists;
  if (!Array.isArray(list) || list.length === 0) throw new Error('Forbes feed had no people in it');
  return new Map(list.map((p) => [p.uri, p]));
}

function replaceAll(text, from, to) {
  return from === to ? text : text.split(from).join(to);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  return { ok: r.status === 0, output: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

async function main() {
  const entries = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  let feed;
  try {
    feed = await fetchFeed();
  } catch (err) {
    console.warn(`⚠ Could not reach Forbes (${err.message}). Keeping the current figures.`);
    return;
  }

  const nextEntries = structuredClone(entries);
  const fileEdits = new Map();
  const changes = [];

  for (const [slug, entry] of Object.entries(entries)) {
    if (!entry.forbesUri || entry.forbesUri.includes('TODO')) {
      console.warn(`⚠ ${slug}: forbesUri is not set, skipping.`);
      continue;
    }
    const person = feed.get(entry.forbesUri);
    const worthMillions = Number(person?.finalWorth);
    if (!person || !Number.isFinite(worthMillions) || worthMillions <= 0) {
      console.warn(`⚠ ${slug}: "${entry.forbesUri}" is not in the Forbes feed. Keeping ${formatLong(entry.netWorth)}.`);
      continue;
    }
    const netWorth = roundWorth(worthMillions * 1e6);
    const asOf = new Date(Number(person.timestamp) || Date.now()).toISOString().slice(0, 10);

    if (checkOnly) {
      console.log(`${slug}: ${formatLong(netWorth)} (${formatShort(netWorth)}) as of ${formatDate(asOf)}`);
      continue;
    }
    if (netWorth < 1e9) {
      console.warn(`⚠ ${slug}: Forbes figure ${formatLong(netWorth)} looks wrong. Keeping the current one.`);
      continue;
    }
    if (entry.netWorth > 0 && Math.abs(netWorth / entry.netWorth - 1) > MAX_SWING) {
      console.warn(
        `⚠ ${slug}: ${formatLong(entry.netWorth)} → ${formatLong(netWorth)} is a >${MAX_SWING * 100}% swing. ` +
          'Not applied automatically; update net-worth.json by hand if it is real.',
      );
      continue;
    }
    if (netWorth === entry.netWorth && asOf === entry.asOf) continue;

    nextEntries[slug] = { ...entry, netWorth, asOf };
    changes.push(`${slug}: ${formatLong(entry.netWorth)} → ${formatLong(netWorth)} (as of ${formatDate(asOf)})`);

    const mdPath = join(CONTENT_DIR, `${slug}.md`);
    if (!existsSync(mdPath) || entry.netWorth <= 0) continue;
    const before = readFileSync(mdPath, 'utf8');
    let after = before;
    after = replaceAll(after, formatLong(entry.netWorth), formatLong(netWorth));
    after = replaceAll(after, formatShort(entry.netWorth), formatShort(netWorth));
    after = replaceAll(after, formatDate(entry.asOf), formatDate(asOf));
    after = after.replace(/^updatedAt: *(\S+)/m, (line, current) => (asOf > current ? `updatedAt: ${asOf}` : line));
    if (!after.includes(formatLong(netWorth))) {
      console.warn(`⚠ ${slug}.md never mentions ${formatLong(netWorth)}; check the copy uses the exact format.`);
    }
    if (after !== before) fileEdits.set(mdPath, { before, after });

    const thumbPath = join(ROOT, 'public', 'thumbs', `${slug}.svg`);
    if (existsSync(thumbPath)) {
      const svg = readFileSync(thumbPath, 'utf8');
      const nextSvg = replaceAll(
        replaceAll(svg, formatLong(entry.netWorth), formatLong(netWorth)),
        formatShort(entry.netWorth),
        formatShort(netWorth),
      );
      if (nextSvg !== svg) fileEdits.set(thumbPath, { before: svg, after: nextSvg });
    }
  }

  if (checkOnly) return;
  if (changes.length === 0) {
    console.log('✔ Net worths are already up to date.');
    return;
  }

  const originalData = readFileSync(DATA_FILE, 'utf8');
  writeFileSync(DATA_FILE, `${JSON.stringify(nextEntries, null, 2)}\n`);
  for (const [path, { after }] of fileEdits) writeFileSync(path, after);

  // The new figures can change title/description lengths, so re-run every content rule.
  const validate = run(process.execPath, ['scripts/validate-content.mjs']);
  const sync = validate.ok ? run('npx', ['astro', 'sync']) : { ok: true, output: '' };
  if (!validate.ok || !sync.ok) {
    writeFileSync(DATA_FILE, originalData);
    for (const [path, { before }] of fileEdits) writeFileSync(path, before);
    console.warn('⚠ The new figures broke a content rule, so nothing was changed:');
    console.warn((validate.ok ? sync.output : validate.output).trim());
    console.warn('Fix the problem above (often a title or description that got too long), then run this again.');
    return;
  }

  console.log('✔ Updated net worths from Forbes Real-Time Billionaires:');
  for (const line of changes) console.log(`  ${line}`);
}

main().catch((err) => {
  console.warn(`⚠ Net worth update failed (${err.message}). Keeping the current figures.`);
});
