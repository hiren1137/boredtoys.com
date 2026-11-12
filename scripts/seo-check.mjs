#!/usr/bin/env node
// Crawls the built site in dist/ the way a search engine would and checks the technical SEO basics:
// internal links (broken, redirecting, orphans, click depth), the sitemap, duplicate titles,
// descriptions and H1s, JSON-LD schema and images.
//
//   node scripts/seo-check.mjs            run every check (part of `npm run build`)
//   npm run seo:check                     same, plus the full internal link map
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep, extname } from 'node:path';
import { ROOT, readGames } from './lib/games.mjs';

const DIST = join(ROOT, 'dist');
const HOST = readFileSync(join(ROOT, 'src/config/site.ts'), 'utf8').match(/HOST = '([^']+)'/)?.[1];
const ORIGIN = `https://${HOST}`;
const MAX_DEPTH = 3;
const MIN_CONTEXTUAL_LINKS = 2;
const report = process.argv.includes('--report');

if (!existsSync(DIST)) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
  );
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const decode = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const errors = [];
const warnings = [];

// ---- Read every built page ----
const pages = new Map();
for (const file of walk(DIST)) {
  const rel = relative(DIST, file).split(sep).join('/');
  if (rel === '404.html') continue; // served for missing URLs, never crawled as a page
  const path = rel === 'index.html' ? '/' : `/${rel.replace(/(index)?\.html$/, '').replace(/\/?$/, '/')}`;
  const html = readFileSync(file, 'utf8');
  const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? '';
  const copy = html.match(/<article class="page-copy[^"]*">([\s\S]*?)<\/article>/)?.[1] ?? '';
  pages.set(path, {
    html,
    indexable: !/noindex/.test(robots),
    title: decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''),
    description: html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '',
    h1: decode(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? ''),
    canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1],
    links: [...html.matchAll(/<a\s[^>]*href="([^"]*)"/g)].map((m) => m[1]),
    contextual: [...copy.matchAll(/<a\s[^>]*href="([^"]*)"/g)].map((m) => m[1]),
  });
}

const fileExists = (p) => {
  const f = join(DIST, decodeURI(p));
  return existsSync(f) && (statSync(f).isFile() || existsSync(join(f, 'index.html')));
};

/** Resolves an href to an internal path, or null for external links. Flags hrefs that would redirect. */
function internalPath(href, from) {
  if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return null;
  let url;
  try {
    url = new URL(href, ORIGIN + from);
  } catch {
    errors.push(`${from}: unparseable link "${href}"`);
    return null;
  }
  const host = url.hostname.replace(/^www\./, '');
  if (host !== HOST.replace(/^www\./, '')) return null;
  if (url.protocol !== 'https:' || url.hostname !== HOST) {
    errors.push(`${from}: link "${href}" points to ${url.protocol}//${url.hostname} and will redirect; use ${ORIGIN}`);
  }
  if (url.search) warnings.push(`${from}: link "${href}" has a query string; link to the clean URL instead`);
  const path = url.pathname;
  if (!extname(path) && !path.endsWith('/')) {
    errors.push(`${from}: link "${href}" is missing its trailing slash and will redirect`);
    return `${path}/`;
  }
  return path;
}

// ---- Links, inlinks and contextual links ----
const inlinks = new Map([...pages.keys()].map((p) => [p, new Set()]));
const contextualIn = new Map([...pages.keys()].map((p) => [p, new Set()]));
const outlinks = new Map();
for (const [path, page] of pages) {
  const targets = new Set();
  for (const href of page.links) {
    const target = internalPath(href, path);
    if (!target) continue;
    if (!pages.has(target) && !fileExists(target)) {
      errors.push(`${path}: broken internal link to ${target}`);
      continue;
    }
    if (pages.has(target)) targets.add(target);
  }
  outlinks.set(path, targets);
  // Links from noindex pages still pass discovery, but only indexable pages count against orphans.
  if (page.indexable) for (const t of targets) if (t !== path) inlinks.get(t).add(path);
  for (const href of page.contextual) {
    const target = internalPath(href, path);
    if (target && target !== path && pages.has(target)) contextualIn.get(target).add(path);
  }
}

// ---- Crawl from the homepage: reachability and click depth ----
const depth = new Map([['/', 0]]);
const queue = ['/'];
while (queue.length) {
  const p = queue.shift();
  for (const t of outlinks.get(p) ?? []) {
    if (!depth.has(t)) {
      depth.set(t, depth.get(p) + 1);
      queue.push(t);
    }
  }
}

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: readFileSync(join(ROOT, 'src/config/site.ts'), 'utf8').match(/RELEASE_TIMEZONE = '([^']+)'/)?.[1],
}).format(new Date());
const gamePaths = new Set(
  readGames()
    .filter(({ data }) => {
      const day = data.publishedAt instanceof Date ? data.publishedAt.toISOString().slice(0, 10) : String(data.publishedAt);
      return process.env.SHOW_SCHEDULED === '1' || day <= today;
    })
    .map(({ data }) => `/${data.slug}/`),
);

for (const [path, page] of pages) {
  if (!page.indexable) continue;
  if (path !== '/' && inlinks.get(path).size === 0) errors.push(`${path}: orphan page (no internal links from other indexable pages)`);
  if (!depth.has(path)) errors.push(`${path}: not reachable by following links from the homepage`);
  else if (depth.get(path) > MAX_DEPTH) errors.push(`${path}: ${depth.get(path)} clicks from the homepage (max ${MAX_DEPTH})`);
  if (page.canonical !== `${ORIGIN}${path}`) errors.push(`${path}: canonical is ${page.canonical}, expected ${ORIGIN}${path}`);
  if (gamePaths.has(path)) {
    const ctx = new Set(page.contextual.map((h) => internalPath(h, path)).filter((t) => gamePaths.has(t) && t !== path));
    if (ctx.size < MIN_CONTEXTUAL_LINKS) {
      errors.push(`${path}: page copy links to ${ctx.size} other game${ctx.size === 1 ? '' : 's'} (min ${MIN_CONTEXTUAL_LINKS})`);
    }
    if (contextualIn.get(path).size === 0) warnings.push(`${path}: no other game's copy links to it`);
  }
}

// ---- Sitemap: exactly the indexable, canonical pages ----
const sitemapUrls = existsSync(join(DIST, 'sitemap-0.xml'))
  ? [...readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  : [];
if (!sitemapUrls.length) errors.push('sitemap-0.xml is missing or empty');
const inSitemap = new Set();
for (const url of sitemapUrls) {
  const path = url.startsWith(ORIGIN) ? url.slice(ORIGIN.length) : null;
  if (!path) {
    errors.push(`sitemap: ${url} is not on ${ORIGIN}`);
    continue;
  }
  inSitemap.add(path);
  const page = pages.get(path);
  if (!page) errors.push(`sitemap: ${url} has no built page`);
  else if (!page.indexable) errors.push(`sitemap: ${url} is noindex and must not be listed`);
}
for (const [path, page] of pages) {
  if (page.indexable && !inSitemap.has(path)) errors.push(`${path}: indexable but missing from the sitemap`);
}
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (!robots.includes(`Sitemap: ${ORIGIN}/sitemap-index.xml`)) errors.push('robots.txt does not point to the sitemap');
if (/^Disallow:\s*\/\s*$/m.test(robots)) errors.push('robots.txt blocks the whole site');

// ---- Duplicate titles, descriptions and H1s among indexable pages ----
for (const field of ['title', 'description', 'h1']) {
  const seen = new Map();
  for (const [path, page] of pages) {
    if (!page.indexable) continue;
    if (!page[field]) {
      errors.push(`${path}: missing ${field}`);
      continue;
    }
    const other = seen.get(page[field]);
    if (other) errors.push(`${path}: duplicate ${field} with ${other}: "${page[field]}"`);
    else seen.set(page[field], path);
  }
}

// ---- JSON-LD schema ----
const REQUIRED_SCHEMA = (path) => {
  if (path === '/') return ['WebSite', 'Organization'];
  if (gamePaths.has(path)) return ['VideoGame', 'BreadcrumbList', 'FAQPage'];
  if (/^\/category\/[^/]+\/$/.test(path)) return ['CollectionPage', 'BreadcrumbList'];
  return [];
};
for (const [path, page] of pages) {
  if (!page.indexable) continue;
  const types = new Set();
  for (const m of page.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch {
      errors.push(`${path}: invalid JSON-LD`);
      continue;
    }
    for (const node of [data, ...(data['@graph'] ?? [])].flat()) {
      if (node?.['@type']) [node['@type']].flat().forEach((t) => types.add(t));
      if (node?.['@type'] === 'BreadcrumbList') {
        for (const item of node.itemListElement ?? []) {
          const url = item.item?.['@id'] ?? item.item;
          if (typeof url === 'string' && url.startsWith(ORIGIN) && !pages.has(url.slice(ORIGIN.length))) {
            errors.push(`${path}: breadcrumb points to missing page ${url}`);
          }
        }
      }
    }
  }
  for (const t of REQUIRED_SCHEMA(path)) if (!types.has(t)) errors.push(`${path}: missing ${t} JSON-LD`);
}

// ---- Images: alt text, explicit size, the first image is never lazy ----
for (const [path, page] of pages) {
  const imgs = [...page.html.matchAll(/<img\s[^>]*>/g)].map((m) => m[0]);
  imgs.forEach((tag, i) => {
    const src = attr(tag, 'src');
    if (attr(tag, 'alt') == null) errors.push(`${path}: <img src="${src}"> has no alt attribute`);
    if (!attr(tag, 'width') || !attr(tag, 'height')) errors.push(`${path}: <img src="${src}"> has no width/height`);
    if (i === 0 && attr(tag, 'loading') === 'lazy') warnings.push(`${path}: first image ${src} is lazy-loaded (may hurt LCP)`);
  });
}

// ---- Output ----
const indexable = [...pages].filter(([, p]) => p.indexable);
if (report) {
  const rows = indexable
    .map(([path]) => ({
      path,
      depth: depth.get(path) ?? '-',
      in: inlinks.get(path).size,
      ctxIn: contextualIn.get(path).size,
      out: outlinks.get(path).size,
    }))
    .sort((a, b) => a.in - b.in || a.path.localeCompare(b.path));
  console.log('\nInternal link map (fewest incoming links first):\n');
  console.log('  in  copy-in  out  depth  page');
  for (const r of rows) {
    console.log(`${String(r.in).padStart(4)}  ${String(r.ctxIn).padStart(7)}  ${String(r.out).padStart(3)}  ${String(r.depth).padStart(5)}  ${r.path}`);
  }
  console.log('\n  in = indexable pages linking here, copy-in = games linking here from their page copy\n');
}
for (const w of warnings) console.warn(`  ⚠ ${w}`);
if (errors.length) {
  console.error(`\nSEO check failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error('');
  process.exit(1);
}
const maxDepth = Math.max(...indexable.map(([p]) => depth.get(p) ?? 0));
console.log(
  `SEO check passed for ${indexable.length} indexable pages: no orphans, no broken or redirecting links, ` +
    `max ${maxDepth} clicks from home, sitemap matches, titles/descriptions/H1s unique, schema present.`,
);
