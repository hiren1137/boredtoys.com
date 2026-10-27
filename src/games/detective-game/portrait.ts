import type { Look } from './cases';

const INK = '#1f1a2e';
const SKIN = ['#ffdcb8', '#f1b98b', '#c98b5e', '#8d5a3b'];
const HAIR: Record<Look['hairColor'], string> = {
  black: '#2b2233',
  brown: '#7a4a2a',
  blonde: '#f2c94c',
  red: '#d9572b',
  gray: '#b9b4c4',
};
export const SHIRT: Record<Look['shirt'], string> = {
  red: '#ff6b5c',
  yellow: '#ffd447',
  green: '#6be3a8',
  blue: '#6cc8ff',
  purple: '#b48cff',
  pink: '#ffa3d1',
};
const BACKDROP = ['#fff1c9', '#e3f4ff', '#ffe3ef', '#e6fbef'];

let uid = 0;

function hairBack(look: Look, c: string): string {
  if (look.hair === 'long') {
    return `<path d="M30 58 Q30 32 60 30 Q90 32 90 58 L92 98 Q84 102 78 96 L78 64 L42 64 L42 96 Q36 102 28 98 Z" fill="${c}"/>`;
  }
  return '';
}

function hairFront(look: Look, c: string): string {
  switch (look.hair) {
    case 'short':
    case 'long':
      return `<path d="M32 60 Q31 31 60 30 Q89 31 88 60 Q84 47 72 44 Q62 50 44 46 Q36 50 32 60 Z" fill="${c}"/>`;
    case 'curly':
      return [
        [36, 50], [44, 38], [56, 33], [68, 34], [79, 40], [86, 52], [33, 62], [87, 64],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/>`)
        .join('');
    case 'bun':
      return `<circle cx="60" cy="24" r="10" fill="${c}"/><path d="M33 58 Q33 33 60 32 Q87 33 87 58 Q78 44 60 44 Q42 44 33 58 Z" fill="${c}"/>`;
    default:
      return `<path d="M44 42 Q50 38 56 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`;
  }
}

function hat(look: Look): string {
  switch (look.hat) {
    case 'cap':
      return `<path d="M32 50 Q32 26 60 25 Q86 26 87 48 Z" fill="#4d8cff"/><path d="M80 47 Q98 46 104 52 Q92 55 78 53 Z" fill="#4d8cff"/><circle cx="60" cy="26" r="3" fill="${INK}"/>`;
    case 'beanie':
      return `<path d="M31 52 Q31 22 60 21 Q89 22 89 52 Z" fill="#ffac57"/><rect x="29" y="46" width="62" height="10" rx="5" fill="#ff8a3d"/><circle cx="60" cy="18" r="7" fill="#fff"/>`;
    case 'tophat':
      return `<rect x="26" y="40" width="68" height="8" rx="4" fill="${INK}"/><rect x="38" y="6" width="44" height="38" rx="4" fill="${INK}"/><rect x="38" y="32" width="44" height="7" fill="#ff7466"/>`;
    case 'chef':
      return `<rect x="38" y="30" width="44" height="18" rx="3" fill="#fff"/><circle cx="46" cy="22" r="12" fill="#fff"/><circle cx="60" cy="16" r="13" fill="#fff"/><circle cx="74" cy="22" r="12" fill="#fff"/>`;
    case 'bow':
      return `<path d="M72 30 L60 22 L60 40 Z" fill="#ff4fa3"/><path d="M72 30 L84 22 L84 40 Z" fill="#ff4fa3"/><circle cx="72" cy="31" r="5" fill="#ff4fa3"/>`;
    default:
      return '';
  }
}

function shirtPattern(look: Look, id: string): string {
  if (look.pattern === 'stripes') {
    return `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${SHIRT[look.shirt]}"/><rect y="7" width="12" height="5" fill="#fff" opacity=".85"/></pattern>`;
  }
  if (look.pattern === 'dots') {
    return `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${SHIRT[look.shirt]}"/><circle cx="4" cy="4" r="3" fill="#fff"/><circle cx="11" cy="11" r="3" fill="#fff"/></pattern>`;
  }
  return '';
}

/** Plain-words description of a look, used for screen readers and alt text. */
export function describe(name: string, look: Look): string {
  const hairText = look.hair === 'bald' ? 'bald' : `${look.hair === 'bun' ? 'a' : ''} ${look.hairColor} ${look.hair === 'bun' ? 'bun' : `${look.hair} hair`}`;
  const hatText: Record<Look['hat'], string> = {
    none: 'no hat',
    cap: 'a cap',
    beanie: 'a beanie',
    tophat: 'a top hat',
    chef: 'a chef hat',
    bow: 'a bow',
  };
  const parts = [
    hairText.trim(),
    hatText[look.hat],
    look.glasses ? 'glasses' : 'no glasses',
    look.mustache ? 'a mustache' : 'no mustache',
    `a ${look.shirt}${look.pattern === 'plain' ? '' : look.pattern === 'stripes' ? ' striped' : ' polka-dot'} shirt`,
  ];
  return `${name}: ${parts.join(', ')}`;
}

export function portrait(look: Look, seed: number): string {
  const id = `dg-p${++uid}`;
  const hairC = HAIR[look.hairColor];
  const shirtFill = look.pattern === 'plain' ? SHIRT[look.shirt] : `url(#${id})`;
  const glasses = look.glasses
    ? `<g fill="#fff" fill-opacity=".35" stroke="${INK}" stroke-width="3"><circle cx="49" cy="62" r="8"/><circle cx="71" cy="62" r="8"/></g><path d="M57 62h6" stroke="${INK}" stroke-width="3"/>`
    : '';
  const mustache = look.mustache
    ? `<path d="M48 76 Q53 70 60 74 Q67 70 72 76 Q66 79 60 76 Q54 79 48 76 Z" fill="${look.hair === 'bald' ? HAIR.gray : hairC}" stroke="${INK}" stroke-width="2"/>`
    : '';
  return `<svg viewBox="0 0 120 130" aria-hidden="true" focusable="false">
<defs>${shirtPattern(look, id)}</defs>
<rect x="2" y="2" width="116" height="126" rx="18" fill="${BACKDROP[seed % BACKDROP.length]}"/>
<g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
${hairBack(look, hairC)}
<path d="M22 130 Q24 98 60 96 Q96 98 98 130 Z" fill="${shirtFill}"/>
<rect x="53" y="84" width="14" height="14" rx="4" fill="${SKIN[look.skin]}"/>
<circle cx="31" cy="64" r="6" fill="${SKIN[look.skin]}"/><circle cx="89" cy="64" r="6" fill="${SKIN[look.skin]}"/>
<circle cx="60" cy="62" r="28" fill="${SKIN[look.skin]}"/>
${hairFront(look, hairC)}
</g>
<g fill="${INK}"><circle cx="49" cy="62" r="3.2"/><circle cx="71" cy="62" r="3.2"/></g>
<path d="M58 68 Q60 71 62 68" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M51 80 Q60 86 69 80" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
<g stroke="${INK}" stroke-width="3" stroke-linejoin="round">${mustache}${hat(look)}</g>
${glasses}
</svg>`;
}
