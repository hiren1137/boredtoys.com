// Original sticker-style art. Outlines use currentColor so they stay visible as the water darkens;
// pupils stay ink-colored inside white eyes. Glowing bits carry the ds-glow class.
const INK = '#1f1a2e';
const GLOW = '#fff59a';

export interface Art {
  w: number;
  h: number;
  body: string;
}

const eye = (x: number, y: number, r = 5) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + r * 0.2}" cy="${y}" r="${(r * 0.5).toFixed(1)}" fill="${INK}" stroke="none"/>`;
const smile = (x: number, y: number, w: number) => `<path d="M${x - w} ${y}q${w} ${w * 0.8} ${w * 2} 0" fill="none"/>`;
const glow = (x: number, y: number, r: number) => `<circle class="ds-glow" cx="${x}" cy="${y}" r="${r}" fill="${GLOW}"/>`;

/** A simple fish facing right: tail on the left, eye on the right. */
function fish(w: number, h: number, color: string, extra = '', eyeR = 5, belly = ''): Art {
  const cy = h / 2;
  const bodyL = w * 0.22;
  const body = `<path d="M4 ${cy - h * 0.32}L${bodyL + 4} ${cy}L4 ${cy + h * 0.32}Z" fill="${color}"/>
    <path d="M${bodyL} ${cy}C${bodyL + w * 0.15} ${cy - h * 0.5} ${w - 10} ${cy - h * 0.42} ${w - 4} ${cy}C${w - 10} ${cy + h * 0.42} ${bodyL + w * 0.15} ${cy + h * 0.5} ${bodyL} ${cy}Z" fill="${color}"/>
    ${belly}${extra}${eye(w * 0.76, cy - h * 0.08, eyeR)}`;
  return { w, h, body };
}

function whale(w: number, h: number, color: string, belly: string, extra = ''): Art {
  const body = `<path d="M8 ${h * 0.25}l18 ${h * 0.2}l-18 ${h * 0.2}z" fill="${color}"/>
    <path d="M24 ${h * 0.45}C40 ${h * 0.1} ${w * 0.75} ${h * 0.12} ${w - 6} ${h * 0.38}C${w - 2} ${h * 0.62} ${w * 0.8} ${h * 0.82} ${w * 0.45} ${h * 0.8}C${w * 0.25} ${h * 0.78} 34 ${h * 0.62} 24 ${h * 0.45}Z" fill="${color}"/>
    <path d="M${w * 0.42} ${h * 0.78}C${w * 0.6} ${h * 0.84} ${w * 0.82} ${h * 0.76} ${w - 8} ${h * 0.56}" fill="none" stroke="${belly}" stroke-width="5"/>
    ${extra}${eye(w * 0.8, h * 0.45, 4)}`;
  return { w, h, body };
}

function diver(tank: boolean, mask = '#6cc8ff'): string {
  return `<path d="M10 40l26 6M10 52l26-2" stroke-width="5"/>
    <path d="M6 34l10 8-10 4zM6 56l10-6-10 12z" fill="#ffd447"/>
    <rect x="34" y="36" width="48" height="20" rx="10" fill="#c7a3ff"/>
    ${tank ? '<rect x="40" y="24" width="34" height="12" rx="6" fill="#ffac57"/>' : ''}
    <path d="M58 56l-6 16M70 54l4 16" stroke-width="5"/>
    <circle cx="90" cy="44" r="12" fill="#ffd2b0"/>
    <rect x="86" y="36" width="14" height="10" rx="3" fill="${mask}"/>
    ${tank ? '<path d="M92 52q6 8-6 10" fill="none"/>' : '<path d="M96 34v-16" stroke-width="4"/>'}`;
}

export const ART: Record<string, Art> = {
  boat: {
    w: 130,
    h: 96,
    body: `<path d="M64 10v52" stroke-width="4"/><path d="M68 14l36 42H68z" fill="#fff"/><path d="M60 22L30 56h30z" fill="#ffa3d1"/>
      <path d="M14 62h104l-14 22H28z" fill="#ff7466"/><path d="M8 90q10-6 20 0t20 0 20 0 20 0 20 0 20 0" fill="none" stroke="#6cc8ff" stroke-width="4"/>
      <path d="M96 8q6-6 12 0 6-6 12 0" fill="none"/>`,
  },
  jelly: {
    w: 70,
    h: 84,
    body: `<path d="M8 36C8 8 62 8 62 36q-6 6-13 0-7 6-14 0-7 6-14 0-7 6-13 0z" fill="#ffa3d1" fill-opacity=".85"/>
      <path d="M22 42q-6 14 2 26t-2 14M35 42q6 16-2 28M48 42q-6 14 2 24t-2 16" fill="none"/>
      <circle cx="26" cy="24" r="5" fill="#c7a3ff" stroke="none"/><circle cx="44" cy="24" r="5" fill="#c7a3ff" stroke="none"/>`,
  },
  snorkel: { w: 110, h: 80, body: diver(false, '#ffd447') },
  clownfish: fish(
    84,
    56,
    '#ffac57',
    `<path d="M34 10q-6 18 0 36M54 9q-6 19 0 38" fill="none" stroke="#fff" stroke-width="7"/><path d="M34 10q-6 18 0 36M54 9q-6 19 0 38" fill="none" stroke-width="2"/>`,
  ),
  seahorse: {
    w: 56,
    h: 100,
    body: `<path d="M30 12c14-6 22 8 12 16 10 8 10 26-2 34-10 6-8 18 2 22 4 2 4 8-2 8-14 0-22-16-14-30 6-10 2-18-6-22 0-14 2-24 10-28z" fill="#ffd447"/>
      <path d="M40 18l14-2-6 8" fill="#ffd447"/><path d="M20 40c-8 2-10 10-4 14" fill="#ffac57"/>${eye(36, 18, 4)}`,
  },
  star: {
    w: 76,
    h: 72,
    body: `<path d="M38 4l9 22 24 2-18 16 6 24-21-13-21 13 6-24L5 28l24-2z" fill="#ff7466"/>
      <circle cx="38" cy="40" r="2" fill="#fff" stroke="none"/><circle cx="28" cy="34" r="2" fill="#fff" stroke="none"/><circle cx="48" cy="34" r="2" fill="#fff" stroke="none"/>${eye(32, 30, 3.5)}${eye(44, 30, 3.5)}`,
  },
  kelp: {
    w: 70,
    h: 120,
    body: `<path d="M24 118C10 90 34 70 22 44S30 10 26 2" fill="none" stroke="#3aa66e" stroke-width="7"/>
      <path d="M24 98c-14-4-18-14-14-20 8 2 14 10 14 20zM30 74c12-4 18-14 16-22-10 2-16 12-16 22zM22 50c-12-2-16-12-12-18 8 2 12 10 12 18zM28 26c12-2 16-10 14-16-8 0-14 8-14 16z" fill="#6be3a8"/>
      <path d="M52 118c-6-20 8-34 2-50" fill="none" stroke="#3aa66e" stroke-width="6"/><path d="M54 92c10-4 14-12 10-18-8 2-10 10-10 18z" fill="#6be3a8"/>`,
  },
  turtle: {
    w: 110,
    h: 76,
    body: `<path d="M30 22L10 8l4 22zM30 54L8 70l6-22zM78 22l18-14-2 22zM78 54l18 16-4-22z" fill="#6be3a8"/>
      <ellipse cx="54" cy="38" rx="34" ry="26" fill="#3aa66e"/><path d="M30 38h48M54 14v48M38 22l32 32M70 22L38 54" stroke-width="2" opacity=".6"/>
      <ellipse cx="96" cy="38" rx="12" ry="10" fill="#6be3a8"/>${eye(100, 34, 3.5)}`,
  },
  octopus: {
    w: 86,
    h: 92,
    body: `<path d="M18 50c-8 16-16 22-10 30 4 4 10-6 16-14M30 56c-4 16-4 28 4 30s4-14 6-26M50 56c4 14 0 26 8 28s4-16 0-28M64 50c10 12 14 24 22 20s-6-14-14-24" fill="#c7a3ff"/>
      <path d="M14 38C14 6 72 6 72 38c0 16-14 22-29 22S14 54 14 38z" fill="#c7a3ff"/>${eye(32, 36, 5)}${eye(54, 36, 5)}${smile(37, 46, 6)}`,
  },
  manta: {
    w: 140,
    h: 80,
    body: `<path d="M70 18C40 18 22 30 4 50c26-6 44-2 66 6 22-8 40-12 66-6-18-20-36-32-66-32z" fill="#4a4e8f"/>
      <path d="M46 56c8 6 40 6 48 0" fill="#e8ecff"/><path d="M70 56c0 10 2 18 0 22" fill="none"/>
      <path d="M58 20l-4-10M82 20l4-10" stroke-width="4"/>${eye(60, 30, 3.5)}${eye(80, 30, 3.5)}`,
  },
  scuba: { w: 110, h: 80, body: diver(true) },
  shark: {
    w: 150,
    h: 80,
    body: `<path d="M8 20l22 22-22 18z" fill="#8f9ab0"/><path d="M72 22l10-20 14 22z" fill="#8f9ab0"/>
      <path d="M26 42C46 20 110 16 146 40c-30 22-96 20-120 2z" fill="#8f9ab0"/><path d="M40 46c30 12 70 10 100-4" fill="#fff"/>
      <path d="M86 52l-6 14 16-12z" fill="#8f9ab0"/><path d="M118 44l4 4 4-4 4 4" fill="none" stroke-width="2"/>${eye(122, 34, 3.5)}`,
  },
  liberty: {
    w: 60,
    h: 120,
    body: `<rect x="12" y="92" width="36" height="26" fill="#d9dde8"/><path d="M18 92l6-48h12l6 48z" fill="#6be3a8"/>
      <circle cx="30" cy="36" r="9" fill="#6be3a8"/><path d="M22 28l-4-8M30 26v-9M38 28l4-8" stroke-width="2.5"/>
      <path d="M38 50l10-32" stroke-width="5"/><path d="M44 18c-4-6 2-14 6-16 2 6 2 12-6 16z" class="ds-glow" fill="#ffd447"/>`,
  },
  bluewhale: whale(170, 70, '#6c8fd6', '#c9d7f5', '<path d="M90 56l-10 14 18-10z" fill="#6c8fd6"/>'),
  coelacanth: fish(
    120,
    60,
    '#4e7ab8',
    `<circle cx="50" cy="24" r="3" fill="#fff" stroke="none"/><circle cx="70" cy="36" r="3" fill="#fff" stroke="none"/><circle cx="60" cy="18" r="2.5" fill="#fff" stroke="none"/>
     <path d="M54 48l-8 12 14-6zM70 50l2 10 8-10z" fill="#4e7ab8"/>`,
  ),
  freediver: {
    w: 100,
    h: 96,
    body: `<path d="M40 4v24" stroke-width="3" stroke-dasharray="4 4"/><rect x="26" y="26" width="30" height="12" rx="4" fill="#ffd447"/>
      <rect x="32" y="38" width="18" height="34" rx="9" fill="#ff7466"/><circle cx="41" cy="80" r="10" fill="#ffd2b0"/>
      <path d="M34 42l-14-10M50 42l14-10" stroke-width="5"/>`,
  },
  dolphin: {
    w: 130,
    h: 70,
    body: `<path d="M10 22l14 16-14 14z" fill="#9fb4cc"/><path d="M60 22l8-16 12 18z" fill="#9fb4cc"/>
      <path d="M22 38C40 16 92 14 112 30c8 0 14 2 16 6-8 4-16 6-24 4-26 16-64 12-82-2z" fill="#9fb4cc"/>
      <path d="M40 46c24 8 50 6 66-2" fill="none" stroke="#e8ecff" stroke-width="5"/><path d="M66 50l-4 12 12-10z" fill="#9fb4cc"/>${eye(100, 32, 3.5)}`,
  },
  scubarecord: {
    w: 100,
    h: 100,
    body: `<rect x="20" y="10" width="60" height="40" rx="8" fill="#ffd447"/><path d="M34 30l10 10 22-20" fill="none" stroke-width="5"/>
      <path d="M50 50v14" stroke-width="4"/><circle cx="50" cy="78" r="16" fill="#fff"/><path d="M50 78l8-8" stroke-width="3"/><circle cx="50" cy="78" r="3" fill="${INK}" stroke="none"/>`,
  },
  nautilus: {
    w: 86,
    h: 76,
    body: `<path d="M44 6C70 6 82 26 80 44s-18 28-36 28c-16 0-24-12-22-24s14-18 24-14c8 4 8 14 0 16" fill="#fff4e0"/>
      <path d="M50 8c-4 10-2 18 6 22M64 12c-6 8-6 18 4 24M76 26c-8 4-12 12-6 22" fill="none" stroke="#ffac57" stroke-width="5"/>
      <path d="M24 50c-10 2-18 8-20 16M26 58c-8 6-12 12-10 16M34 64c-4 6-4 10 0 12" fill="none"/>${eye(30, 46, 4)}`,
  },
  penguin: {
    w: 60,
    h: 110,
    body: `<path d="M30 6c18 0 24 30 24 56s-8 42-24 42S6 88 6 62 12 6 30 6z" fill="#2b2f4a"/><path d="M30 30c12 0 14 20 14 36s-4 30-14 30-14-14-14-30 2-36 14-36z" fill="#fff"/>
      <path d="M20 28c-4 4-4 10 0 12" fill="none" stroke="#ffd447" stroke-width="5"/><path d="M30 22l6 4-6 3z" fill="#ffac57"/>
      ${eye(24, 18, 3.5)}${eye(36, 18, 3.5)}<path d="M20 104l-6 4h14zM40 104l6 4H32z" fill="#ffac57"/>`,
  },
  lanternfish: fish(80, 44, '#5d6b8a', `${glow(36, 30, 3)}${glow(46, 32, 3)}${glow(56, 30, 3)}${glow(66, 27, 2.5)}`, 6),
  barreleye: {
    w: 100,
    h: 70,
    body: `<path d="M6 38l18-12v24z" fill="#4c5a74"/><path d="M22 38C30 24 70 22 92 36c-20 14-60 16-70 2z" fill="#4c5a74"/>
      <path d="M52 30C52 6 88 4 88 30z" fill="#e6fbff" fill-opacity=".45"/><circle cx="64" cy="22" r="5" fill="#6be3a8"/><circle cx="76" cy="22" r="5" fill="#6be3a8"/>
      <path d="M86 40l6-2" stroke-width="2"/>`,
  },
  vampire: {
    w: 86,
    h: 92,
    body: `<path d="M43 8C60 8 66 30 64 48c10 8 18 20 16 34-12-2-20-10-24-18-4 10-8 18-13 24-5-6-9-14-13-24-4 8-12 16-24 18-2-14 6-26 16-34-2-18 4-40 21-40z" fill="#b8455c"/>
      <path d="M30 18c-6-8-2-14 2-14 2 4 2 10-2 14zM56 18c6-8 2-14-2-14-2 4-2 10 2 14z" fill="#b8455c"/>${eye(35, 38, 6)}${eye(51, 38, 6)}`,
  },
  giantsquid: {
    w: 160,
    h: 70,
    body: `<path d="M62 30C40 20 22 10 4 18c14 8 26 14 52 22M62 40C40 50 20 60 4 54c16-6 28-12 52-20" fill="#d97a63"/>
      <path d="M60 28h34c36 0 56 6 62 8-6 2-26 8-62 8H60z" fill="#e8907a"/><path d="M140 30l16 6-16 6z" fill="#d97a63"/>${eye(78, 36, 9)}`,
  },
  goblin: {
    w: 140,
    h: 70,
    body: `<path d="M6 22l20 16-20 16z" fill="#f2b8c6"/><path d="M56 22l10-14 10 16z" fill="#f2b8c6"/>
      <path d="M22 38C44 20 96 22 136 24c-10 6-18 10-30 14 0 8-8 14-18 12-24 6-52 4-66-12z" fill="#f2b8c6"/>
      <path d="M90 42l18 6-4-10M92 46l4 4 4-4 4 4" fill="#fff"/>${eye(104, 32, 3)}`,
  },
  leatherback: {
    w: 110,
    h: 76,
    body: `<path d="M34 24L8 4l6 30zM34 52L8 72l8-26zM74 26l14-12v16zM74 50l14 12V46z" fill="#4a5568"/>
      <path d="M20 38c0-16 20-24 44-24s34 10 34 24-10 24-34 24-44-8-44-24z" fill="#2d3748"/><path d="M26 30h64M26 38h70M26 46h64" stroke="#a0aec0" stroke-width="2"/>
      <ellipse cx="98" cy="38" rx="10" ry="9" fill="#4a5568"/>${eye(101, 35, 3)}`,
  },
  isopod: {
    w: 90,
    h: 60,
    body: `<path d="M10 30C10 10 76 8 82 30S10 50 10 30z" fill="#e6c9a8"/><path d="M24 14v32M36 12v36M48 12v36M60 13v34M70 16v28" stroke-width="2"/>
      <path d="M82 26l8-6M82 34l8 6M20 46l-4 8M34 48l-2 8M48 48v8M62 48l2 8" stroke-width="2.5"/>${eye(76, 24, 3.5)}`,
  },
  seal: {
    w: 130,
    h: 70,
    body: `<path d="M6 30l14 10-14 14z" fill="#9c8a7a"/><path d="M18 42C30 20 90 18 110 28c12 2 18 10 16 18-6 6-18 6-28 4-22 10-62 10-80-8z" fill="#9c8a7a"/>
      <path d="M118 42q8 4 6 12" fill="#9c8a7a"/><path d="M60 48l-6 14 16-10z" fill="#7d6b5c"/>${eye(108, 34, 3.5)}<path d="M120 40l8-2M120 44l8 2" stroke-width="1.5"/>`,
  },
  angler: {
    w: 100,
    h: 84,
    body: `<path d="M58 22C52 6 70 0 80 8" fill="none" stroke-width="2.5"/>${glow(82, 9, 6)}
      <path d="M6 48l16-14v28z" fill="#3b2f4f"/><path d="M20 48c0-22 20-30 40-30s36 14 36 30-14 30-38 30-38-8-38-30z" fill="#3b2f4f"/>
      <path d="M62 56h32c-2 8-14 16-32 14z" fill="#fff4f4"/><path d="M64 56l4 6 4-6 4 6 4-6 4 6 4-6 4 6" fill="none" stroke="#fff" stroke-width="2"/>${eye(64, 38, 6)}`,
  },
  sperm: whale(170, 76, '#7b7f8e', '#a8acbb', '<path d="M100 18h56c8 0 10 14 4 22H100z" fill="#7b7f8e"/><path d="M90 60l-8 14 18-10z" fill="#7b7f8e"/>'),
  gulper: {
    w: 130,
    h: 70,
    body: `<path d="M4 40c20-10 34 10 54 0" fill="none" stroke-width="4"/>${glow(5, 40, 3)}
      <path d="M56 34c10-6 30-8 40-6l30-22c0 28-6 50-30 54-14 2-34-2-40-10z" fill="#2f3a5a"/><path d="M98 30l26-22c0 22-6 40-26 46z" fill="#5a3a5a"/>${eye(92, 26, 3)}`,
  },
  vent: {
    w: 90,
    h: 120,
    body: `<path d="M44 40c-8-10 4-20-4-32M50 36c8-10-2-18 6-28" fill="none" stroke="#9aa3b5" stroke-width="7" opacity=".7"/>
      <path d="M30 118l6-74h18l6 74z" fill="#5c4a3d"/><path d="M8 118l14-30h14l-4 30zM82 118l-14-34H56l4 34z" fill="#6e5847"/>
      <path d="M38 44h14" stroke="#ff7466" stroke-width="5"/>`,
  },
  tubeworm: {
    w: 90,
    h: 110,
    body: `<path d="M18 108V44M42 108V30M66 108V50" stroke="#fff" stroke-width="11"/><path d="M18 108V44M42 108V30M66 108V50" stroke-width="2" opacity=".3"/>
      <path d="M8 46c0-14 20-14 20 0zM32 32c0-16 20-16 20 0zM56 52c0-14 20-14 20 0z" fill="#ff5470"/>`,
  },
  beaked: whale(160, 66, '#8c6f62', '#c9a99a', '<path d="M148 34l12 2-12 4" fill="#8c6f62"/><path d="M84 54l-8 12 16-8z" fill="#8c6f62"/>'),
  dumbo: {
    w: 86,
    h: 86,
    body: `<path d="M14 26c-12-6-14 10-2 14M72 26c12-6 14 10 2 14" fill="#ffac57"/>
      <path d="M43 6c20 0 28 18 26 34 8 4 14 14 12 22-10 4-18 0-22-6 0 10-6 22-16 22s-16-12-16-22c-4 6-12 10-22 6-2-8 4-18 12-22-2-16 6-34 26-34z" fill="#ffc8a8"/>
      ${eye(34, 32, 5)}${eye(52, 32, 5)}`,
  },
  average: {
    w: 70,
    h: 110,
    body: `<path d="M35 6v98" stroke-width="3" stroke-dasharray="6 5"/><path d="M20 20l15-14 15 14M20 90l15 14 15-14" fill="none" stroke-width="4"/>
      <rect x="6" y="40" width="58" height="30" rx="8" fill="#6cc8ff"/><path d="M16 55h38" stroke="#fff" stroke-width="4"/>`,
  },
  titanic: {
    w: 150,
    h: 80,
    body: `<path d="M8 50l70-10 4 34H18z" fill="#3a3540" transform="rotate(-6 40 60)"/><path d="M92 40l50 8-10 26H96z" fill="#3a3540" transform="rotate(10 120 60)"/>
      <rect x="34" y="26" width="12" height="18" fill="#b5651d" transform="rotate(-6 40 60)"/><rect x="54" y="24" width="12" height="18" fill="#b5651d" transform="rotate(-6 40 60)"/>
      <path d="M2 78h146" stroke-width="3"/><path d="M84 76l6-14 6 14" fill="#5c5560"/>`,
  },
  seapig: {
    w: 90,
    h: 64,
    body: `<path d="M10 36c0-16 20-24 40-24s34 8 34 22-14 18-34 18-40 0-40-16z" fill="#f2b8d0" fill-opacity=".9"/>
      <path d="M30 14l-4-10M44 12l2-10M60 14l6-8" stroke-width="3"/><path d="M18 50l-4 10M32 52l-2 10M48 52v10M64 50l2 10M76 46l6 8" stroke-width="3"/>${eye(70, 30, 3.5)}`,
  },
  tripod: {
    w: 110,
    h: 90,
    body: `<path d="M34 36L24 88M48 38l2 50M84 36l10 52" stroke-width="3"/>
      ${fish(110, 50, '#7a8aa6').body}`,
  },
  nodules: {
    w: 100,
    h: 56,
    body: `<path d="M4 52h92" stroke-width="3"/><path d="M10 50c0-12 8-18 16-18s14 8 12 18zM40 50c2-8 8-12 14-10s8 6 6 10zM62 50c0-14 10-22 20-20s12 12 10 20z" fill="#3b3234"/>
      <circle cx="22" cy="40" r="2" fill="#7a6a6c" stroke="none"/><circle cx="80" cy="38" r="2.5" fill="#7a6a6c" stroke="none"/>`,
  },
  alvin: {
    w: 130,
    h: 90,
    body: `<path d="M20 30h80c14 0 22 10 22 22s-8 22-22 22H20C10 74 4 64 4 52s6-22 16-22z" fill="#fff"/><path d="M60 30V14h24v16" fill="#ff7466"/>
      <circle cx="100" cy="54" r="10" fill="#6cc8ff"/><path d="M20 74v10M40 74v10" stroke-width="4"/><path d="M112 66l14 10" stroke-width="4"/>${glow(124, 50, 4)}`,
  },
  amphipod: {
    w: 100,
    h: 66,
    body: `<path d="M12 36c0-18 18-26 40-26s38 10 38 24-14 20-40 20-38-2-38-18z" fill="#f4f1ea"/>
      <path d="M30 12v38M44 10v42M58 11v40M72 14v34" stroke-width="2"/><path d="M88 26l10-12M90 30l10-4M20 50l-6 12M36 54l-2 10M52 54v10M68 52l2 10" stroke-width="2.5"/>${eye(82, 26, 3.5)}`,
  },
  snailfish: fish(96, 50, '#f6dce4', `<path d="M24 36c20 10 40 10 60-2" fill="none" stroke="#e6b3c2" stroke-width="3"/>`, 4),
  deepestfish: fish(92, 48, '#efe3ea', `<path d="M40 14l6 8M54 12l4 8" stroke-width="2"/>`, 4),
  everest: {
    w: 130,
    h: 100,
    body: `<path d="M4 96L50 18l16 22 14-14 46 70z" fill="#9aa3b5"/><path d="M38 38l12-20 16 22-8 6-8-8-6 6z" fill="#fff"/>
      <path d="M50 18V4" stroke-width="3"/><path d="M50 4h12l-4 4 4 4H50" fill="#ff7466"/>`,
  },
  xeno: {
    w: 76,
    h: 60,
    body: `<path d="M8 54c-4-14 4-22 12-22-2-12 10-20 18-14 6-12 22-10 24 2 12 0 16 14 8 22 6 4 4 12 0 12z" fill="#e8d9c0"/>
      <path d="M22 44c4-4 8-4 12 0M42 36c4-4 8-4 12 0M48 50c4-4 8-4 10 0" fill="none" stroke-width="2"/>`,
  },
  challenger: {
    w: 140,
    h: 100,
    body: `<path d="M2 98c20-30 40-40 68-40s48 10 68 40z" fill="#2b2a3d"/><path d="M70 58V20" stroke-width="3"/><path d="M70 20h30l-6 8 6 8H70" fill="#ffd447"/>
      <circle cx="40" cy="30" r="14" fill="#a9b4c8"/><rect x="26" y="8" width="28" height="12" rx="4" fill="#ffac57"/>${glow(52, 34, 3)}`,
  },
};
