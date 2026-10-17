'use client';

export type TikTokContent = {
  content_id: string;
  content_type: 'product' | 'product_group';
  content_name: string;
};

export type TikTokEventPayload = {
  contents?: TikTokContent[];
  value?: number;
  currency?: 'NGN';
  search_string?: string;
};

type TikTokQueue = {
  identify: (data: Record<string, string>) => void;
  track: (event: string, data?: TikTokEventPayload) => void;
};

declare global {
  interface Window {
    ttq?: TikTokQueue;
  }
}

function withTikTok(callback: (queue: TikTokQueue) => void, attempt = 0) {
  if (typeof window === 'undefined') return;
  if (window.ttq) {
    callback(window.ttq);
    return;
  }
  if (attempt < 20) {
    window.setTimeout(() => withTikTok(callback, attempt + 1), 250);
  }
}

export function tikTokContent(
  id: string | number,
  name: string,
  type: TikTokContent['content_type'] = 'product',
): TikTokContent {
  return {
    content_id: String(id),
    content_type: type,
    content_name: name,
  };
}

export function commercePayload(
  content: TikTokContent,
  value?: number,
): TikTokEventPayload {
  return {
    contents: [content],
    ...(Number.isFinite(value) ? { value } : {}),
    currency: 'NGN',
  };
}

export function trackTikTokEvent(
  event: string,
  payload: TikTokEventPayload = {},
) {
  withTikTok((queue) => queue.track(event, payload));
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function identifyTikTokUser({
  email,
  phone,
  externalId,
}: {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
}) {
  if (typeof window === 'undefined' || !crypto.subtle) return;

  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = phone?.replace(/[^\d+]/g, '');
  const normalizedExternalId = externalId?.trim();
  const entries = await Promise.all([
    normalizedEmail
      ? sha256(normalizedEmail).then((value) => ['email', value] as const)
      : null,
    normalizedPhone
      ? sha256(normalizedPhone).then(
          (value) => ['phone_number', value] as const,
        )
      : null,
    normalizedExternalId
      ? sha256(normalizedExternalId).then(
          (value) => ['external_id', value] as const,
        )
      : null,
  ]);
  const payload = Object.fromEntries(entries.filter((entry) => entry !== null));
  if (Object.keys(payload).length) {
    withTikTok((queue) => queue.identify(payload));
  }
}
