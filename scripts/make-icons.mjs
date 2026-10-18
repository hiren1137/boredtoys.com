#!/usr/bin/env node
// Renders public/favicon.svg into the PNG/ICO icons browsers and phones ask for.
// Run after changing the mascot: npm run icons
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { ROOT } from './lib/games.mjs';

const config = readFileSync(join(ROOT, 'src/config/site.ts'), 'utf8');
const SITE_NAME = config.match(/SITE_NAME = '([^']+)'/)?.[1] ?? 'Games';
const SITE = { description: config.match(/description:\s*'([^']+)'/)?.[1] ?? '' };
const PUBLIC = join(ROOT, 'public');
const BG = '#fff8ec';
const mascot = readFileSync(join(PUBLIC, 'favicon.svg'), 'utf8');
const inner = mascot.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const png = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

/** Mascot on a solid tile; phones and launchers crop transparent icons badly. */
const tile = (scale) => {
  const pad = (64 - 64 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${BG}"/><g transform="translate(${pad} ${pad}) scale(${scale})">${inner}</g></svg>`;
};

function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

writeFileSync(join(PUBLIC, 'favicon.ico'), ico([16, 32, 48].map((size) => ({ size, data: png(mascot, size) }))));
writeFileSync(join(PUBLIC, 'apple-touch-icon.png'), png(tile(0.82), 180));
writeFileSync(join(PUBLIC, 'icon-192.png'), png(tile(0.82), 192));
writeFileSync(join(PUBLIC, 'icon-512.png'), png(tile(0.82), 512));
writeFileSync(join(PUBLIC, 'icon-maskable-512.png'), png(tile(0.62), 512));
writeFileSync(
  join(PUBLIC, 'site.webmanifest'),
  `${JSON.stringify(
    {
      name: SITE_NAME,
      short_name: SITE_NAME,
      description: SITE.description,
      start_url: '/',
      display: 'browser',
      background_color: BG,
      theme_color: BG,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  )}\n`,
);
console.log('✔ Wrote favicon.ico, apple-touch-icon.png, icon-192/512.png, icon-maskable-512.png, site.webmanifest');
