export interface GameContext {
  slug: string;
  title: string;
  url: string;
  shareText: string;
  siteName: string;
}

/** Reads the page context that GameLayout writes onto the game root as data attributes. */
export function readContext(el: HTMLElement): GameContext {
  const host = (el.closest('[data-game]') as HTMLElement | null) ?? el;
  const d = host.dataset;
  return {
    slug: d.slug ?? '',
    title: d.title ?? document.title,
    url: d.url ?? location.href,
    shareText: d.shareText ?? '{score}',
    siteName: d.siteName ?? '',
  };
}

export function fillShareText(template: string, score: string): string {
  return template.replace(/\{score\}/g, score);
}

export function shareMessage(ctx: GameContext, score?: string): string {
  const text = score == null ? `Play ${ctx.title}:` : fillShareText(ctx.shareText, score);
  return `${text} ${ctx.url}`;
}

export const canNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export async function nativeShare(ctx: GameContext, score?: string): Promise<boolean> {
  const text = score == null ? `Play ${ctx.title}:` : fillShareText(ctx.shareText, score);
  try {
    await navigator.share({ title: ctx.title, text, url: ctx.url });
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function xIntentUrl(ctx: GameContext, score?: string): string {
  const text = score == null ? `Play ${ctx.title}:` : fillShareText(ctx.shareText, score);
  const params = new URLSearchParams({ text, url: ctx.url });
  return `https://x.com/intent/post?${params.toString()}`;
}

/** Builds Share / Copy link / Share on X buttons. Native share is only offered where the browser supports it. */
export function buildShareRow(ctx: GameContext, getScore: () => string | undefined): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'result-share';
  const row = document.createElement('div');
  row.className = 'result-actions';
  const status = document.createElement('p');
  status.className = 'share-status';
  status.setAttribute('role', 'status');

  if (canNativeShare()) {
    const b = button('📤 Share', 'btn btn--sky');
    b.addEventListener('click', async () => {
      const ok = await nativeShare(ctx, getScore());
      if (ok) status.textContent = 'Thanks for sharing!';
    });
    row.append(b);
  }

  const copy = button('🔗 Copy link', 'btn btn--white');
  copy.addEventListener('click', async () => {
    const ok = await copyText(shareMessage(ctx, getScore()));
    status.textContent = ok ? 'Copied! Paste it anywhere.' : 'Could not copy. Try selecting the address bar.';
  });
  row.append(copy);

  const x = document.createElement('a');
  x.className = 'btn btn--white';
  x.textContent = '𝕏 Share on X';
  x.target = '_blank';
  x.rel = 'noopener';
  x.addEventListener('pointerdown', () => (x.href = xIntentUrl(ctx, getScore())));
  x.addEventListener('focus', () => (x.href = xIntentUrl(ctx, getScore())));
  x.href = xIntentUrl(ctx, getScore());
  row.append(x);

  wrap.append(row, status);
  return wrap;
}

function button(label: string, className: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.textContent = label;
  return b;
}
