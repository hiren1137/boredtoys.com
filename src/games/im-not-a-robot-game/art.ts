// Tiny hand-drawn SVG tiles. Every drawing uses a 100x100 viewBox.
const O = 'stroke="#1f1a2e" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';

export type ArtName =
  | 'apple'
  | 'banana'
  | 'pear'
  | 'cherry'
  | 'sock'
  | 'cat'
  | 'fish'
  | 'duck'
  | 'cloud'
  | 'tomato'
  | 'ball'
  | 'human'
  | 'robot'
  | 'disguise'
  | 'boot'
  | 'mushroom';

const ART: Record<ArtName, string> = {
  apple: `<path d="M50 32c-10-8-30-6-32 14-2 22 14 40 24 40 4 0 6-2 8-2s4 2 8 2c10 0 26-18 24-40-2-20-22-22-32-14z" fill="#ff5a4e" ${O}/>
    <path d="M50 32c0-8 2-14 6-18" fill="none" ${O}/><path d="M56 22c6-8 16-8 20-4-6 6-14 8-20 4z" fill="#6be3a8" ${O}/>`,
  banana: `<path d="M20 30c4 30 24 50 56 46 6-1 8-6 4-8-26 2-42-14-48-40-1-5-12-6-12 2z" fill="#ffd447" ${O}/>
    <path d="M22 26l-4-8" ${O} fill="none"/>`,
  pear: `<path d="M50 24c-8 0-10 10-10 18 0 8-14 14-14 28 0 12 12 18 24 18s24-6 24-18c0-14-14-20-14-28 0-8-2-18-10-18z" fill="#b6e36b" ${O}/>
    <path d="M50 24c0-6 1-10 4-14" fill="none" ${O}/>`,
  cherry: `<path d="M36 64c4-20 10-36 26-48M66 66c-2-18-2-34-4-50" fill="none" ${O}/>
    <circle cx="34" cy="70" r="14" fill="#d93a52" ${O}/><circle cx="68" cy="72" r="14" fill="#d93a52" ${O}/>
    <path d="M62 16c8-4 16-2 20 4-8 4-14 2-20-4z" fill="#6be3a8" ${O}/>`,
  sock: `<path d="M38 14h26v40c0 6 2 10 8 14 10 8 6 24-8 22-8-1-12-6-20-12-8-6-6-14-6-24z" fill="#ffa3d1" ${O}/>
    <path d="M38 24h26M38 34h26" ${O} fill="none"/>`,
  cat: `<path d="M22 30l8-16 14 12h12l14-12 8 16c4 8 6 16 6 26 0 18-16 30-36 30S12 74 12 56c0-10 6-18 10-26z" fill="#ffac57" ${O}/>
    <circle cx="38" cy="54" r="4" fill="#1f1a2e"/><circle cx="62" cy="54" r="4" fill="#1f1a2e"/>
    <path d="M46 64l4 4 4-4M50 68v4M30 66l-14 2M70 66l14 2" fill="none" ${O}/>`,
  fish: `<path d="M16 50c12-18 40-24 58-6l12-12v36L74 56c-18 18-46 12-58-6z" fill="#6cc8ff" ${O}/>
    <circle cx="34" cy="46" r="4" fill="#1f1a2e"/><path d="M50 40c4 6 4 14 0 20" fill="none" ${O}/>`,
  duck: `<path d="M24 58c0-14 10-22 22-22 0-12 8-20 18-20s16 8 16 18c0 6-4 10-8 12 10 2 14 10 14 18 0 12-14 20-30 20S24 76 24 58z" fill="#ffd447" ${O}/>
    <path d="M78 32l12 2-10 6z" fill="#ffac57" ${O}/><circle cx="66" cy="30" r="3.5" fill="#1f1a2e"/>`,
  cloud: `<path d="M26 72c-10 0-16-8-14-16 2-8 10-12 18-10 2-12 12-20 24-18 10 2 16 10 16 18 10-2 18 6 18 14s-6 12-14 12z" fill="#ffffff" ${O}/>`,
  tomato: `<circle cx="50" cy="56" r="30" fill="#ff5a4e" ${O}/>
    <path d="M36 30l8 6 6-10 6 10 8-6-2 10H38z" fill="#6be3a8" ${O}/>`,
  ball: `<circle cx="50" cy="50" r="34" fill="#ff7466" ${O}/>
    <path d="M18 40c20 8 44 8 64 0M22 66c18-8 38-8 56 0" fill="none" ${O}/>`,
  human: `<path d="M20 92c2-18 14-26 30-26s28 8 30 26z" fill="#6cc8ff" ${O}/>
    <circle cx="50" cy="42" r="22" fill="#f6c9a0" ${O}/>
    <path d="M28 38c2-14 12-20 22-20s20 6 22 20c-8-6-16-8-22-2-6-6-14-4-22 2z" fill="#6b4226" ${O}/>
    <circle cx="42" cy="44" r="3" fill="#1f1a2e"/><circle cx="58" cy="44" r="3" fill="#1f1a2e"/>
    <path d="M43 53c4 4 10 4 14 0" fill="none" ${O}/>`,
  robot: `<path d="M50 20V8" ${O}/><circle cx="50" cy="8" r="5" fill="#ff7466" ${O}/>
    <rect x="22" y="20" width="56" height="46" rx="8" fill="#c9c7d4" ${O}/>
    <rect x="32" y="32" width="12" height="10" rx="2" fill="#6cc8ff" ${O}/><rect x="56" y="32" width="12" height="10" rx="2" fill="#6cc8ff" ${O}/>
    <path d="M36 54h28" ${O}/><path d="M26 92V76h48v16" fill="#9d9aae" ${O}/>`,
  disguise: `<path d="M50 20V8" ${O}/><circle cx="50" cy="8" r="5" fill="#ff7466" ${O}/>
    <rect x="22" y="20" width="56" height="46" rx="8" fill="#c9c7d4" ${O}/>
    <circle cx="38" cy="38" r="8" fill="#fff" ${O}/><circle cx="62" cy="38" r="8" fill="#fff" ${O}/><path d="M46 38h8" ${O}/>
    <path d="M34 54c6-6 12-2 16 0 4-2 10-6 16 0-6 2-10 4-16 2-6 2-10 0-16-2z" fill="#6b4226" ${O}/>
    <path d="M26 92V76h48v16" fill="#9d9aae" ${O}/>`,
  boot: `<path d="M30 14h26v46l22 8c8 3 10 10 10 20H22l4-30z" fill="#b07a4f" ${O}/><path d="M22 80h66" ${O}/>`,
  mushroom: `<path d="M14 52c0-20 16-34 36-34s36 14 36 34z" fill="#ff7466" ${O}/>
    <path d="M38 52v26c0 6 6 8 12 8s12-2 12-8V52" fill="#fffdf7" ${O}/>
    <circle cx="34" cy="38" r="5" fill="#fff"/><circle cx="60" cy="32" r="6" fill="#fff"/><circle cx="72" cy="44" r="4" fill="#fff"/>`,
};

export function art(name: ArtName, cls = 'rb-art'): string {
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">${ART[name]}</svg>`;
}

export const LABELS: Record<ArtName, string> = {
  apple: 'an apple',
  banana: 'a banana',
  pear: 'a pear',
  cherry: 'some cherries',
  sock: 'a sock',
  cat: 'a cat',
  fish: 'a fish',
  duck: 'a duck',
  cloud: 'a cloud',
  tomato: 'a tomato',
  ball: 'a red ball',
  human: 'a human',
  robot: 'a robot',
  disguise: 'a robot wearing fake glasses and a mustache',
  boot: 'a boot',
  mushroom: 'a mushroom',
};
