import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SITE_NAME, SITE } from '../config/site';

const root = process.cwd();
const fontDir = join(root, 'node_modules', '@fontsource', 'nunito', 'files');
const fonts = [
  { name: 'Nunito', data: readFileSync(join(fontDir, 'nunito-latin-700-normal.woff')), weight: 700 as const, style: 'normal' as const },
  { name: 'Nunito', data: readFileSync(join(fontDir, 'nunito-latin-900-normal.woff')), weight: 900 as const, style: 'normal' as const },
];

const CSS_VARS: Record<string, string> = {
  'var(--tomato)': '#ff7466',
  'var(--sunshine)': '#ffd447',
  'var(--mint)': '#6be3a8',
  'var(--sky)': '#6cc8ff',
  'var(--grape)': '#c7a3ff',
  'var(--bubblegum)': '#ffa3d1',
  'var(--tangerine)': '#ffac57',
};
export const resolveColor = (c: string) => CSS_VARS[c] ?? c;

const dataUri = (file: string) =>
  existsSync(file) ? `data:image/svg+xml;base64,${readFileSync(file).toString('base64')}` : undefined;

/** Rasterizes an SVG with system fonts so any <text> inside it renders. */
function svgToPngUri(file: string, width: number): string | undefined {
  if (!existsSync(file)) return undefined;
  const png = new Resvg(readFileSync(file), {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true, defaultFontFamily: 'Arial', sansSerifFamily: 'Arial' },
  })
    .render()
    .asPng();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

export type OgInput = {
  title: string;
  subtitle: string;
  label: string;
  color: string;
  thumb?: string;
};

export async function renderOg({ title, subtitle, label, color, thumb }: OgInput): Promise<Buffer> {
  const ink = '#1f1a2e';
  const mascot = dataUri(join(root, 'public', 'favicon.svg'));
  const art = thumb ? svgToPngUri(join(root, 'public', thumb), 800) : undefined;

  const tree = h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      background: '#fff8ec',
      padding: 40,
      fontFamily: 'Nunito',
      color: ink,
    },
    h(
      'div',
      {
        display: 'flex',
        // satori sizes are content-box: 1106x536 outer minus 48px padding and 6px border per side.
        width: 998,
        height: 428,
        background: resolveColor(color),
        border: `6px solid ${ink}`,
        borderRadius: 44,
        boxShadow: `14px 14px 0 ${ink}`,
        padding: 48,
        gap: 40,
        alignItems: 'center',
      },
      [
        h('div', { display: 'flex', flexDirection: 'column', flex: 1, height: '100%', justifyContent: 'space-between' }, [
          h(
            'div',
            {
              display: 'flex',
              alignSelf: 'flex-start',
              fontSize: 28,
              fontWeight: 900,
              background: '#fff',
              border: `4px solid ${ink}`,
              borderRadius: 999,
              padding: '6px 22px',
              letterSpacing: 2,
              textTransform: 'uppercase',
            },
            label,
          ),
          h('div', { display: 'flex', flexDirection: 'column', gap: 18 }, [
            h('div', { fontSize: title.length > 28 ? 64 : 76, fontWeight: 900, lineHeight: 1.05, letterSpacing: -1 }, title),
            h('div', { fontSize: 32, fontWeight: 700, lineHeight: 1.3 }, subtitle),
          ]),
          h('div', { display: 'flex', alignItems: 'center', gap: 14 }, [
            mascot ? h('img', { width: 64, height: 64 }, undefined, { src: mascot, width: 64, height: 64 }) : null,
            h('div', { display: 'flex', flexDirection: 'column' }, [
              h('div', { fontSize: 36, fontWeight: 900 }, SITE_NAME),
              h('div', { fontSize: 22, fontWeight: 700 }, SITE.domain),
            ]),
          ]),
        ]),
        art
          ? h(
              'div',
              {
                display: 'flex',
                width: 400,
                height: 300,
                background: '#fffdf7',
                border: `5px solid ${ink}`,
                borderRadius: 30,
                overflow: 'hidden',
                transform: 'rotate(3deg)',
              },
              h('img', { width: 400, height: 300 }, undefined, { src: art, width: 400, height: 300 }),
            )
          : null,
      ],
    ),
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
