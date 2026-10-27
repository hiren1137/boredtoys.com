// Original sticker-style illustrations. Each sits on the bottom edge of its viewBox (the ground).
const INK = '#1f1a2e';

export interface Art {
  w: number;
  h: number;
  body: string;
}

const eyes = (x: number, y: number, gap: number, r = 2.6) =>
  `<circle cx="${x - gap}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x + gap}" cy="${y}" r="${r}" fill="${INK}"/>`;
const smile = (x: number, y: number, w: number) =>
  `<path d="M${x - w} ${y}q${w} ${w * 0.9} ${w * 2} 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
const face = (x: number, y: number, size: number) => eyes(x, y, size * 0.45, size * 0.14) + smile(x - size * 0.25, y + size * 0.35, size * 0.25);

function ring(cx: number, cy: number, rx: number, ry: number, n: number, len: number): string {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * rx;
    const y1 = cy + Math.sin(a) * ry;
    const x2 = cx + Math.cos(a) * (rx + len);
    const y2 = cy + Math.sin(a) * (ry + len);
    d += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return `<path d="${d}" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
}

function virus(): string {
  let spikes = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const x = 50 + Math.cos(a) * 43;
    const y = 50 + Math.sin(a) * 43;
    spikes += `<path d="M${(50 + Math.cos(a) * 28).toFixed(1)} ${(50 + Math.sin(a) * 28).toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="#ffa3d1"/>`;
  }
  return `<g stroke="${INK}" stroke-width="3">${spikes}<circle cx="50" cy="50" r="29" fill="#c7a3ff"/></g>
    <circle cx="38" cy="38" r="5" fill="#ab8ae6"/><circle cx="64" cy="62" r="4" fill="#ab8ae6"/>${face(50, 50, 16)}`;
}

const SPIKY_HEDGEHOG = (() => {
  let d = 'M22 76';
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    const r = i % 2 ? 58 : 46;
    d += `L${(80 + Math.cos(a) * r).toFixed(1)} ${(78 + Math.sin(a) * r * 0.95).toFixed(1)}`;
  }
  return `${d}L138 78Z`;
})();

export const ART: Record<string, Art> = {
  virus: { w: 100, h: 100, body: virus() },

  bacterium: {
    w: 140,
    h: 56,
    body: `<path d="M106 34c8-12 14 10 22-2s8-10 9-16" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <rect x="4" y="14" width="104" height="40" rx="20" fill="#6be3a8" stroke="${INK}" stroke-width="3"/>
      <path d="M70 26q8 8 18 2" fill="none" stroke="#3fbf83" stroke-width="3" stroke-linecap="round"/>${face(36, 32, 15)}`,
  },

  yeast: {
    w: 100,
    h: 82,
    body: `<g stroke="${INK}" stroke-width="3"><circle cx="78" cy="30" r="16" fill="#ffe58a"/><circle cx="40" cy="48" r="32" fill="#ffd447"/></g>
      <circle cx="56" cy="62" r="5" fill="#f2bf2a"/>${face(36, 44, 17)}`,
  },

  rbc: {
    w: 100,
    h: 100,
    body: `<circle cx="50" cy="50" r="46" fill="#ff7466" stroke="${INK}" stroke-width="3"/>
      <circle cx="50" cy="52" r="24" fill="#ff958a" stroke="#d95a4d" stroke-width="2"/>${face(50, 48, 16)}`,
  },

  paramecium: {
    w: 150,
    h: 72,
    body: `${ring(75, 37, 65, 26, 36, 6)}
      <ellipse cx="75" cy="37" rx="65" ry="26" fill="#6cc8ff" stroke="${INK}" stroke-width="3"/>
      <path d="M58 40q14 12 30 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="40" cy="30" r="7" fill="#a9dcff" stroke="${INK}" stroke-width="2"/><circle cx="72" cy="26" r="4" fill="#a9dcff"/>
      ${face(112, 33, 15)}`,
  },

  mite: {
    w: 100,
    h: 80,
    body: `<path d="M30 40L8 26M28 48L6 54M30 56L14 76M38 62L32 78M70 40L92 26M72 48L94 54M70 56L86 76M62 62L68 78" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3"><ellipse cx="50" cy="16" rx="11" ry="9" fill="#ffc98c"/><ellipse cx="50" cy="44" rx="28" ry="24" fill="#ffac57"/></g>
      ${face(50, 44, 15)}`,
  },

  tardigrade: {
    w: 150,
    h: 80,
    body: `<g stroke="${INK}" stroke-width="3" fill="#ffa3d1"><ellipse cx="34" cy="64" rx="10" ry="12"/><ellipse cx="62" cy="66" rx="10" ry="11"/><ellipse cx="90" cy="66" rx="10" ry="11"/><ellipse cx="118" cy="64" rx="10" ry="12"/>
      <rect x="10" y="12" width="132" height="50" rx="25"/></g>
      <path d="M52 16q-4 22 0 44M80 15q-4 24 0 46M108 16q-4 22 0 44" fill="none" stroke="#e57fb0" stroke-width="3"/>
      <path d="M28 76l-3 3M34 77v4M40 76l3 3M112 76l-3 3M118 77v4M124 76l3 3" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
      ${eyes(30, 30, 7, 2.8)}<circle cx="24" cy="44" r="4.5" fill="#fff" stroke="${INK}" stroke-width="2.4"/>`,
  },

  flea: {
    w: 100,
    h: 90,
    body: `<path d="M62 60l18-18 12 44M42 64l-8 22M54 64l2 22M26 58l-12 26" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <g stroke="${INK}" stroke-width="3" fill="#c98b5a"><ellipse cx="56" cy="40" rx="34" ry="26" transform="rotate(-12 56 40)"/><circle cx="22" cy="50" r="14"/></g>
      <path d="M44 22q8 18 0 38M64 18q8 20 2 40" fill="none" stroke="#a86a3e" stroke-width="3"/><circle cx="18" cy="46" r="3" fill="${INK}"/>`,
  },

  fruitfly: {
    w: 110,
    h: 80,
    body: `<path d="M48 56l-8 20M62 58l0 18M76 56l8 20" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3"><ellipse cx="60" cy="22" rx="26" ry="12" fill="#eaf7ff" transform="rotate(-18 60 22)"/><ellipse cx="80" cy="26" rx="22" ry="10" fill="#eaf7ff" transform="rotate(10 80 26)"/>
      <ellipse cx="64" cy="48" rx="32" ry="14" fill="#e8b562"/><circle cx="28" cy="46" r="13" fill="#e8b562"/></g>
      <path d="M74 36v24M86 38v20" stroke="#b98236" stroke-width="3"/><circle cx="23" cy="43" r="7" fill="#ff5b4d" stroke="${INK}" stroke-width="2"/>`,
  },

  ant: {
    w: 150,
    h: 70,
    body: `<path d="M58 44L40 66M64 46L62 68M70 44L88 66M24 22Q14 4 4 10M28 20Q30 2 40 4" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3" fill="#3b2f52"><ellipse cx="110" cy="38" rx="32" ry="21"/><ellipse cx="64" cy="38" rx="17" ry="11"/><circle cx="28" cy="34" r="15"/></g>
      <circle cx="22" cy="31" r="3.5" fill="#fff"/><path d="M98 26q10-6 20 0" fill="none" stroke="#6a5a8a" stroke-width="3" stroke-linecap="round"/>`,
  },

  ladybug: {
    w: 100,
    h: 72,
    body: `<path d="M30 66l-4 5M50 67v5M70 66l4 5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3"><circle cx="16" cy="52" r="13" fill="${INK}"/><path d="M14 66A40 42 0 0 1 94 66Z" fill="#ff7466"/></g>
      <path d="M54 25v41" stroke="${INK}" stroke-width="3"/>
      <g fill="${INK}"><circle cx="36" cy="44" r="6"/><circle cx="72" cy="40" r="6"/><circle cx="42" cy="58" r="4.5"/><circle cx="76" cy="56" r="4.5"/></g>
      <circle cx="11" cy="48" r="2.8" fill="#fff"/><circle cx="19" cy="47" r="2.8" fill="#fff"/>`,
  },

  bee: {
    w: 120,
    h: 90,
    body: `<path d="M50 76l-4 12M66 78v10M82 76l4 12" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3"><ellipse cx="54" cy="24" rx="16" ry="22" fill="#f4fbff" transform="rotate(-20 54 24)"/><ellipse cx="78" cy="26" rx="14" ry="20" fill="#f4fbff" transform="rotate(16 78 26)"/>
      <path d="M102 52l14 3-13 6Z" fill="${INK}"/><ellipse cx="66" cy="56" rx="40" ry="25" fill="#ffd447"/></g>
      <path d="M58 32q-6 24 0 48M78 32q-6 24 0 48" fill="none" stroke="${INK}" stroke-width="8"/>
      <circle cx="26" cy="54" r="15" fill="${INK}"/><circle cx="20" cy="50" r="3.5" fill="#fff"/>
      <path d="M22 40q-6-14-12-14M28 40q2-14 10-16" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
  },

  snail: {
    w: 130,
    h: 90,
    body: `<path d="M16 64L10 38M24 62L28 36" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3"><circle cx="10" cy="36" r="4.5" fill="#c9ef9b"/><circle cx="28" cy="34" r="4.5" fill="#c9ef9b"/>
      <path d="M4 86Q4 62 26 62H112Q128 66 126 86Z" fill="#c9ef9b"/><circle cx="78" cy="42" r="32" fill="#ffac57"/></g>
      <path d="M78 42m-4 0a4 4 0 1 1 8 0a10 10 0 1 1-20 0a16 16 0 1 1 32 0a22 22 0 1 1-44 0" fill="none" stroke="${INK}" stroke-width="3"/>
      ${face(20, 72, 13)}`,
  },

  hummingbird: {
    w: 120,
    h: 90,
    body: `<path d="M56 66l-2 18M66 66l2 18" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M96 30L119 24" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3"><path d="M30 58L4 72l6-18 16-6Z" fill="#3fbf83"/><ellipse cx="58" cy="50" rx="32" ry="18" fill="#6be3a8" transform="rotate(-14 58 50)"/>
      <circle cx="86" cy="34" r="14" fill="#6be3a8"/><ellipse cx="52" cy="26" rx="26" ry="10" fill="#c3f7dc" transform="rotate(-38 52 26)"/></g>
      <path d="M78 44q8 6 16-2" fill="#ff7466" stroke="${INK}" stroke-width="2.4"/><circle cx="90" cy="31" r="3" fill="${INK}"/>`,
  },

  mouse: {
    w: 150,
    h: 80,
    body: `<path d="M118 62q24 2 30-14" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3"><ellipse cx="60" cy="74" rx="9" ry="5" fill="#ffa3d1"/><ellipse cx="100" cy="74" rx="9" ry="5" fill="#ffa3d1"/>
      <ellipse cx="82" cy="48" rx="42" ry="27" fill="#c9c3d8"/><circle cx="48" cy="22" r="14" fill="#ffa3d1"/><ellipse cx="36" cy="50" rx="25" ry="20" fill="#c9c3d8"/></g>
      <circle cx="12" cy="52" r="4.5" fill="#ff7aa8" stroke="${INK}" stroke-width="2"/><circle cx="30" cy="44" r="3" fill="${INK}"/>
      <path d="M16 58l-14 4M18 62l-12 9" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  },

  hedgehog: {
    w: 140,
    h: 90,
    body: `<path d="M40 82v6M110 82v6" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="${SPIKY_HEDGEHOG}" fill="#8b6a4e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="28" cy="66" rx="24" ry="19" fill="#f1d6b8" stroke="${INK}" stroke-width="3"/>
      <circle cx="5" cy="66" r="4.5" fill="${INK}"/><circle cx="22" cy="60" r="3" fill="${INK}"/>
      <path d="M14 74q6 4 12 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  },

  cat: {
    w: 150,
    h: 100,
    body: `<path d="M120 64q30-2 26-40" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <path d="M120 64q30-2 26-40" fill="none" stroke="#ffac57" stroke-width="3" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3" fill="#ffac57"><rect x="50" y="68" width="12" height="30" rx="6"/><rect x="104" y="68" width="12" height="30" rx="6"/>
      <ellipse cx="84" cy="62" rx="42" ry="23"/><path d="M18 30L20 6 36 20ZM44 20L58 6 58 30Z"/><circle cx="38" cy="40" r="23"/></g>
      <path d="M76 42v18M90 42v18M104 46v14" stroke="#e5862f" stroke-width="4" stroke-linecap="round"/>
      ${eyes(38, 38, 9, 3)}<path d="M35 47l3 3 3-3" fill="#ff7aa8" stroke="${INK}" stroke-width="2"/>
      <path d="M22 48L6 46M22 52L8 56M54 48l16-2M54 52l14 4" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
  },

  penguin: {
    w: 70,
    h: 130,
    body: `<g stroke="${INK}" stroke-width="3"><ellipse cx="24" cy="125" rx="10" ry="4" fill="#ffac57"/><ellipse cx="46" cy="125" rx="10" ry="4" fill="#ffac57"/>
      <ellipse cx="35" cy="68" rx="31" ry="56" fill="#2a2440"/><ellipse cx="37" cy="80" rx="20" ry="42" fill="#fffdf7"/></g>
      <path d="M22 44q14-8 28 0" fill="none" stroke="#ffd447" stroke-width="6" stroke-linecap="round"/>
      <path d="M44 28l14 4-14 3Z" fill="#ffac57" stroke="${INK}" stroke-width="2"/><circle cx="38" cy="24" r="3" fill="#fff"/>`,
  },

  human: {
    w: 60,
    h: 160,
    body: `<g stroke="${INK}" stroke-width="3"><rect x="17" y="96" width="12" height="58" rx="5" fill="#6cc8ff"/><rect x="31" y="96" width="12" height="58" rx="5" fill="#6cc8ff"/>
      <ellipse cx="22" cy="155" rx="9" ry="4" fill="${INK}"/><ellipse cx="38" cy="155" rx="9" ry="4" fill="${INK}"/>
      <rect x="6" y="50" width="10" height="44" rx="5" fill="#f2c29b"/><rect x="44" y="50" width="10" height="44" rx="5" fill="#f2c29b"/>
      <rect x="13" y="46" width="34" height="56" rx="12" fill="#ff7466"/><circle cx="30" cy="25" r="19" fill="#f2c29b"/></g>
      <path d="M12 22q4-16 18-16t18 16q-10-6-18-2t-18 2Z" fill="#5a3b2a" stroke="${INK}" stroke-width="2.4"/>
      ${face(30, 26, 14)}`,
  },

  polarbear: {
    w: 170,
    h: 90,
    body: `<g stroke="${INK}" stroke-width="3" fill="#f6f2ea"><rect x="42" y="56" width="18" height="32" rx="8"/><rect x="118" y="56" width="18" height="32" rx="8"/>
      <ellipse cx="100" cy="46" rx="60" ry="32"/><circle cx="48" cy="18" r="8"/><ellipse cx="34" cy="42" rx="30" ry="22"/></g>
      <circle cx="6" cy="46" r="5" fill="${INK}"/><circle cx="28" cy="34" r="3" fill="${INK}"/>
      <path d="M10 54q8 4 14 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  },

  ostrich: {
    w: 90,
    h: 150,
    body: `<path d="M44 92L40 146M58 92L62 146" stroke="#f2c9b3" stroke-width="7" stroke-linecap="round"/>
      <path d="M44 92L40 146M58 92L62 146" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
      <path d="M30 146h12M58 146h12" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3"><path d="M80 70q12-2 8 18-8-4-14-6Z" fill="#fffdf7"/><ellipse cx="52" cy="78" rx="34" ry="22" fill="#3b2f52"/>
      <path d="M26 72Q14 40 22 14" fill="none" stroke="#f2c9b3" stroke-width="9" stroke-linecap="round"/><circle cx="24" cy="14" r="10" fill="#f2c9b3"/></g>
      <path d="M26 72Q14 40 22 14" fill="none" stroke="${INK}" stroke-width="1.5" opacity=".4"/>
      <path d="M14 14l-12 3 12 3Z" fill="#ffac57" stroke="${INK}" stroke-width="2"/><circle cx="22" cy="11" r="2.8" fill="${INK}"/>`,
  },

  elephant: {
    w: 150,
    h: 120,
    body: `<path d="M140 52q8 10 4 26" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3" fill="#b9b4c9"><rect x="58" y="80" width="20" height="38" rx="7"/><rect x="112" y="80" width="20" height="38" rx="7"/>
      <ellipse cx="94" cy="60" rx="52" ry="36"/><path d="M22 52Q8 76 14 104q4 6 10 0Q18 82 34 64Z"/><circle cx="38" cy="46" r="26"/>
      <ellipse cx="54" cy="48" rx="18" ry="25" fill="#d7d2e4"/></g>
      <path d="M26 66q-10 6-8 16" fill="none" stroke="#fffdf7" stroke-width="5" stroke-linecap="round"/>
      <circle cx="30" cy="40" r="3" fill="${INK}"/>`,
  },

  crocodile: {
    w: 200,
    h: 50,
    body: `<g stroke="${INK}" stroke-width="3" fill="#6bbf7a"><rect x="58" y="34" width="12" height="15" rx="5"/><rect x="124" y="34" width="12" height="15" rx="5"/>
      <path d="M2 36Q2 24 18 24H52Q72 12 110 14Q150 16 198 34Q150 40 110 42Q60 46 18 42Q2 42 2 36Z"/></g>
      <path d="M8 34h44" stroke="${INK}" stroke-width="2.4"/><path d="M12 34l3 4 3-4 3 4 3-4 3 4 3-4 3 4 3-4" fill="#fff" stroke="${INK}" stroke-width="1.5"/>
      <path d="M70 16l5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="46" cy="18" r="6" fill="#6bbf7a" stroke="${INK}" stroke-width="2.4"/><circle cx="46" cy="18" r="2.5" fill="${INK}"/>`,
  },

  giraffe: {
    w: 100,
    h: 200,
    body: `<g stroke="${INK}" stroke-width="3" fill="#ffd447"><rect x="32" y="116" width="10" height="80" rx="5"/><rect x="64" y="116" width="10" height="80" rx="5"/>
      <path d="M36 112L18 34 34 30 56 106Z"/><ellipse cx="56" cy="112" rx="38" ry="22"/><ellipse cx="22" cy="26" rx="18" ry="11"/></g>
      <path d="M94 104q6 10 2 24" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <g fill="#ffac57"><circle cx="46" cy="106" r="6"/><circle cx="66" cy="102" r="7"/><circle cx="80" cy="116" r="5"/><circle cx="56" cy="122" r="5"/><circle cx="30" cy="80" r="4"/><circle cx="26" cy="56" r="4"/></g>
      <path d="M22 16L20 4M30 16l2-12" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="4" r="3" fill="${INK}"/><circle cx="32" cy="4" r="3" fill="${INK}"/>
      <circle cx="18" cy="23" r="2.6" fill="${INK}"/><path d="M8 30q4 3 8 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
  },

  orca: {
    w: 200,
    h: 80,
    body: `<g stroke="${INK}" stroke-width="3"><path d="M96 34L104 2 120 34Z" fill="#2a2440"/>
      <path d="M2 54Q4 30 50 28Q120 24 170 46L198 30 192 54 198 76 168 62Q110 80 40 76Q4 74 2 54Z" fill="#2a2440"/>
      <path d="M70 70l-6 9 16-6Z" fill="#2a2440"/></g>
      <path d="M8 60Q40 74 96 66Q60 60 30 56Z" fill="#fffdf7"/><ellipse cx="44" cy="42" rx="11" ry="5" fill="#fffdf7"/>
      <circle cx="30" cy="44" r="2.8" fill="#fffdf7"/>`,
  },

  whaleshark: {
    w: 220,
    h: 80,
    body: `<g stroke="${INK}" stroke-width="3" fill="#5f8fd6"><path d="M108 34L126 8 138 34Z"/><path d="M180 44L216 8 206 44 216 76Z"/>
      <path d="M2 48Q4 30 40 28Q110 24 186 44Q120 74 40 72Q2 70 2 48Z"/><path d="M70 66l-12 12 26-8Z"/></g>
      <path d="M6 50h22" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M44 36q-3 12 0 24M50 36q-3 12 0 24" fill="none" stroke="${INK}" stroke-width="2"/>
      <g fill="#fffdf7"><circle cx="66" cy="36" r="2.6"/><circle cx="80" cy="44" r="2.6"/><circle cx="96" cy="36" r="2.6"/><circle cx="112" cy="46" r="2.6"/><circle cx="128" cy="40" r="2.6"/><circle cx="146" cy="46" r="2.6"/><circle cx="74" cy="56" r="2.6"/><circle cx="104" cy="58" r="2.6"/><circle cx="160" cy="48" r="2.6"/></g>
      <circle cx="20" cy="40" r="2.8" fill="${INK}"/>`,
  },

  bluewhale: {
    w: 240,
    h: 70,
    body: `<g stroke="${INK}" stroke-width="3" fill="#7fb6e8"><path d="M150 34L160 24 166 36Z"/><path d="M206 40L238 22 230 42 238 62Z"/>
      <path d="M2 46Q4 26 50 24Q130 22 212 42Q140 66 50 66Q2 66 2 46Z"/><path d="M74 58l-14 11 28-6Z"/></g>
      <path d="M8 52Q40 62 90 58M10 56Q40 66 80 62" fill="none" stroke="#4f86c4" stroke-width="2"/>
      <circle cx="28" cy="40" r="2.8" fill="${INK}"/>`,
  },

  kelp: {
    w: 60,
    h: 220,
    body: `<path d="M30 216Q16 170 32 130Q46 90 26 50Q18 28 30 6" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <path d="M30 216Q16 170 32 130Q46 90 26 50Q18 28 30 6" fill="none" stroke="#9c7a2e" stroke-width="3.5" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="2.6" fill="#a9c85a"><ellipse cx="42" cy="190" rx="14" ry="6" transform="rotate(-30 42 190)"/><ellipse cx="14" cy="160" rx="14" ry="6" transform="rotate(30 14 160)"/>
      <ellipse cx="48" cy="120" rx="12" ry="6" transform="rotate(-30 48 120)"/><ellipse cx="16" cy="94" rx="14" ry="6" transform="rotate(30 16 94)"/>
      <ellipse cx="40" cy="60" rx="13" ry="6" transform="rotate(-30 40 60)"/><ellipse cx="14" cy="30" rx="12" ry="5" transform="rotate(30 14 30)"/></g>
      <g fill="#ffd447" stroke="${INK}" stroke-width="2"><circle cx="32" cy="184" r="4"/><circle cx="24" cy="156" r="4"/><circle cx="38" cy="114" r="4"/><circle cx="26" cy="88" r="4"/></g>
      <path d="M18 218q12-8 24 0" fill="#9c7a2e" stroke="${INK}" stroke-width="3"/>`,
  },

  sequoia: {
    w: 80,
    h: 220,
    body: `<path d="M24 218L32 40H48L56 218Z" fill="#c0603d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M36 200v-60M46 190v-40" stroke="#93422a" stroke-width="2.6" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3" fill="#3f9b5f"><ellipse cx="22" cy="116" rx="18" ry="11"/><ellipse cx="60" cy="100" rx="18" ry="12"/>
      <ellipse cx="24" cy="74" rx="20" ry="13"/><ellipse cx="58" cy="56" rx="19" ry="13"/><ellipse cx="40" cy="30" rx="20" ry="22"/></g>`,
  },

  redwood: {
    w: 60,
    h: 240,
    body: `<path d="M22 238L27 30H33L38 238Z" fill="#b5523a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <g stroke="${INK}" stroke-width="3" fill="#2f8a52"><path d="M30 150L6 170H54Z"/><path d="M30 112L8 136H52Z"/><path d="M30 76L10 100H50Z"/>
      <path d="M30 42L12 66H48Z"/><path d="M30 6L16 32H44Z"/></g>`,
  },

  pando: {
    w: 400,
    h: 28,
    body: (() => {
      let trees = '';
      for (let x = 14, i = 0; x < 392; x += 17, i++) {
        const h = 9 + (i % 3) * 2;
        trees += `<path d="M${x} 27V${27 - h}" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M${x} 27V${27 - h}" stroke="#fffdf7" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="${x}" cy="${27 - h - 4}" r="6" fill="${i % 2 ? '#ffd447' : '#b9e36b'}" stroke="${INK}" stroke-width="1.8"/>`;
      }
      return `${trees}<path d="M8 27H392" stroke="#8b6a4e" stroke-width="2" stroke-dasharray="4 3"/>`;
    })(),
  },

  fungus: {
    w: 480,
    h: 30,
    body: (() => {
      let caps = '';
      for (const x of [40, 52, 150, 236, 248, 330, 430, 442]) {
        caps += `<path d="M${x} 16v-6" stroke="#f1d6b8" stroke-width="3"/><path d="M${x - 6} 11q6-9 12 0Z" fill="#ffc65c" stroke="${INK}" stroke-width="1.6"/>`;
      }
      return `<rect x="2" y="15" width="476" height="14" rx="7" fill="#8b6a4e" stroke="${INK}" stroke-width="2.4"/>
        <path d="M10 22Q60 16 110 24T210 20T320 24T470 21M40 26Q90 20 150 22M260 18Q300 26 360 20" fill="none" stroke="#f1d6b8" stroke-width="1.6" stroke-linecap="round"/>${caps}`;
    })(),
  },
};
