const INK = '#1f1a2e';
const wrap = (inner: string) =>
  `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const cloud = (fill: string, y = 0) =>
  `<path d="M17 ${36 + y}a9 9 0 0 1 1-18 13 13 0 0 1 25-3 10 10 0 0 1 4 21z" fill="${fill}"/>`;
const drop = (x: number, y: number) =>
  `<path class="am-drop" d="M${x} ${y}c-2.5 4-3.5 6-3.5 7.5a3.5 3.5 0 0 0 7 0c0-1.5-1-3.5-3.5-7.5z" fill="#6cc8ff"/>`;

export const ICONS: Record<string, string> = {
  rain: wrap(`${cloud('#ffffff', -2)}${drop(22, 42)}${drop(33, 46)}${drop(44, 41)}`),
  thunder: wrap(
    `${cloud('#9aa0c4', -4)}<path class="am-bolt" d="M35 34l-9 13h7l-4 12 13-17h-7l5-8z" fill="#ffd447"/>`,
  ),
  wind: wrap(
    `<g class="am-sway"><path d="M8 24h28a7 7 0 1 0-7-7"/><path d="M8 34h40a7 7 0 1 1-7 7"/><path d="M8 44h20a5.5 5.5 0 1 1-5.5 5.5"/></g>`,
  ),
  waves: wrap(
    `<path class="am-sway" d="M4 42c6-16 20-22 30-16-8 1-11 8-7 13 4 4 10 2 12-2 4 6 10 8 21 4v15H4z" fill="#6cc8ff"/><path d="M4 52c6-3 10-3 15 0s10 3 15 0 10-3 15 0 10 3 11 1" stroke="#fff" stroke-width="2.5"/>`,
  ),
  fire: wrap(
    `<path d="M14 54l36-9M14 45l36 9" stroke="#8a5a3c" stroke-width="7"/><path d="M14 54l36-9M14 45l36 9" stroke-width="2"/><path class="am-flicker" d="M32 8c9 10 14 16 14 25a14 14 0 0 1-28 0c0-6 3-10 6-14 2 4 3 6 6 7-2-7 0-12 2-18z" fill="#ffac57"/><path d="M32 26c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" fill="#ffd447"/>`,
  ),
  stream: wrap(
    `<path d="M4 38c8-4 14 4 22 0s14-4 22 0 10 2 12 0v18H4z" fill="#6cc8ff"/><path class="am-sway" d="M10 46c5-2 8 2 13 0M32 50c5-2 8 2 13 0" stroke="#fff" stroke-width="2.5"/><path d="M10 38c0-6 5-9 10-9s9 4 9 9z" fill="#b9b3c6"/><path d="M40 37c0-5 4-8 8-8s8 3 8 8z" fill="#dcd8e4"/>`,
  ),
  birds: wrap(
    `<g class="am-hop"><path d="M14 40c0-10 8-17 18-17 6 0 10 3 12 7l8 1-7 4c0 9-8 16-18 16-8 0-13-5-13-11z" fill="#ffd447"/><path d="M22 40c4 4 10 4 14 0" /><circle cx="40" cy="31" r="2" fill="${INK}" stroke="none"/></g><path d="M24 56l2-7M34 56l-1-7"/><path d="M48 12v10a3 3 0 1 1-3-3M54 8v8a2.5 2.5 0 1 1-2.5-2.5" stroke-width="2.5"/>`,
  ),
  crickets: wrap(
    `<path d="M44 6a10 10 0 1 0 12 12 8 8 0 0 1-12-12z" fill="#ffd447"/><g class="am-hop"><ellipse cx="30" cy="42" rx="15" ry="8" fill="#6be3a8"/><circle cx="15" cy="38" r="5" fill="#6be3a8"/><path d="M12 34c-4-8-6-14-4-20M15 33c0-8 2-14 6-18M24 49l-4 7M36 49l4 7M42 38l10-10 4 22"/></g>`,
  ),
  fan: wrap(
    `<circle cx="32" cy="28" r="20" fill="#ffffff"/><g class="am-spin"><path d="M32 28c-2-8 0-14 6-15 4 4 0 11-6 15zM32 28c8 1 13 5 12 11-5 2-10-4-12-11zM32 28c-5 6-11 8-15 4 1-6 8-6 15-4z" fill="#6cc8ff"/></g><circle cx="32" cy="28" r="3" fill="${INK}"/><path d="M32 48v8M22 58h20"/>`,
  ),
  white: wrap(
    `<rect x="8" y="12" width="48" height="40" rx="10" fill="#ffffff"/><path class="am-buzz" d="M12 32l3-6 3 11 3-14 3 16 3-12 3 9 3-13 3 15 3-10 3 8 3-7 3 3" stroke-width="2.5"/>`,
  ),
  pink: wrap(
    `<rect x="8" y="12" width="48" height="40" rx="10" fill="#ffa3d1"/><path class="am-buzz" d="M12 32c2-6 4-6 6 0s4 8 6 0 4-8 6 0 4 7 6 0 4-6 6 0 4 5 6 0" stroke-width="2.5"/>`,
  ),
  brown: wrap(
    `<rect x="8" y="12" width="48" height="40" rx="10" fill="#c9905f"/><path class="am-buzz" d="M12 32c5-10 9-10 13 0s8 10 13 0 9-9 14 0" stroke-width="2.5"/>`,
  ),
  traffic: wrap(
    `<g class="am-drive"><path d="M6 44v-8l6-2 7-9h20l9 9 8 2v8z" fill="#ff7466"/><path d="M22 28h7v6h-11zM33 28h5l5 6H33z" fill="#6cc8ff" stroke-width="2.5"/><circle cx="18" cy="45" r="5.5" fill="${INK}"/><circle cx="46" cy="45" r="5.5" fill="${INK}"/></g><path d="M4 56h56" stroke-dasharray="6 6"/>`,
  ),
  clock: wrap(
    `<circle cx="32" cy="32" r="23" fill="#ffffff"/><path d="M32 13v4M32 47v4M13 32h4M47 32h4"/><path d="M32 32V21" stroke-width="3.5"/><path class="am-tick" d="M32 32l9 6" stroke="#ff7466" stroke-width="3.5"/><circle cx="32" cy="32" r="2.5" fill="${INK}"/>`,
  ),
  purr: wrap(
    `<g class="am-breathe"><path d="M10 50c0-12 9-20 22-20s22 8 22 20z" fill="#ffac57"/><path d="M16 34l-2-12 9 7M48 34l2-12-9 7" fill="#ffac57"/><path d="M22 40c2 2 4 2 6 0M36 40c2 2 4 2 6 0M30 45l2 2 2-2"/></g><path d="M50 14h6l-6 7h6M44 6h4l-4 4h4" stroke-width="2.5"/>`,
  ),
  chimes: wrap(
    `<path d="M12 10h40" stroke-width="4"/><path d="M18 10v8M28 10v6M38 10v10M48 10v7" stroke-width="2"/><g class="am-sway"><rect x="15" y="18" width="6" height="26" rx="3" fill="#c7a3ff"/><rect x="25" y="16" width="6" height="34" rx="3" fill="#6cc8ff"/><rect x="35" y="20" width="6" height="22" rx="3" fill="#ffa3d1"/><rect x="45" y="17" width="6" height="30" rx="3" fill="#ffd447"/></g><path d="M32 50v6"/><circle cx="32" cy="58" r="2.5" fill="${INK}"/>`,
  ),
};
