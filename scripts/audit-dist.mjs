#!/usr/bin/env node
// Checks every built page for the SEO basics: one H1, one correct canonical, an OG image and favicons.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { ROOT } from './lib/games.mjs';

const DIST = join(ROOT, 'dist');
const HOST = readFileSync(join(ROOT, 'src/config/site.ts'), 'utf8').match(/HOST = '([^']+)'/)?.[1];
const ORIGIN = `https://${HOST}`;
const REQUIRED_ICONS = ['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/site.webmanifest'];

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
  );

const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const tags = (html, re) => [...html.matchAll(re)].map((m) => m[0]);
const inDist = (url) => existsSync(join(DIST, decodeURI(new URL(url, ORIGIN).pathname)));

const errors = [];
const pages = walk(DIST);
for (const file of pages) {
  const rel = relative(DIST, file).split(sep).join('/');
  const path = rel === 'index.html' ? '/' : `/${rel.replace(/(index)?\.html$/, '').replace(/\/?$/, '/')}`;
  const html = readFileSync(file, 'utf8');
  const fail = (msg) => errors.push(`${path}: ${msg}`);

  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) fail(`expected 1 <h1>, found ${h1s}`);

  const canonicals = tags(html, /<link[^>]+rel="canonical"[^>]*>/g).map((t) => attr(t, 'href'));
  if (canonicals.length !== 1) fail(`expected 1 canonical, found ${canonicals.length}`);
  else if (canonicals[0] !== `${ORIGIN}${path}`) fail(`canonical is ${canonicals[0]}, expected ${ORIGIN}${path}`);

  for (const prop of ['property="og:image"', 'name="twitter:image"']) {
    const t = tags(html, new RegExp(`<meta[^>]+${prop}[^>]*>`, 'g'));
    if (t.length !== 1) fail(`expected 1 ${prop} tag, found ${t.length}`);
    else if (!inDist(attr(t[0], 'content'))) fail(`${prop} points to a missing file: ${attr(t[0], 'content')}`);
  }

  const iconHrefs = tags(html, /<link[^>]+rel="(?:icon|apple-touch-icon|manifest)"[^>]*>/g).map((t) => attr(t, 'href'));
  for (const icon of REQUIRED_ICONS) {
    if (!iconHrefs.includes(icon)) fail(`missing <link> for ${icon}`);
    else if (!inDist(icon)) fail(`${icon} is linked but not in dist/`);
  }
}

if (errors.length) {
  console.error(`\nPage audit failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error('');
  process.exit(1);
}
console.log(`Page audit passed for ${pages.length} pages (H1, canonical, OG image, favicons).`);
