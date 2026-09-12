type ProviderStatus = {
  id: 'smsbower' | 'jap' | 'bulkacc';
  name: string;
  capability: string;
  connected: boolean;
  balance: number | null;
  currency: string;
  detail: string;
};

const REQUEST_TIMEOUT_MS = 8_000;

async function fetchWithTimeout(input: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function unavailable(
  id: ProviderStatus['id'],
  name: string,
  capability: string,
  detail: string,
): ProviderStatus {
  return { id, name, capability, connected: false, balance: null, currency: 'USD', detail };
}

async function getSmsBowerStatus(): Promise<ProviderStatus> {
  const apiKey = process.env.SMSBOWER_API_KEY;
  if (!apiKey) return unavailable('smsbower', 'SMSBower', 'Foreign numbers', 'API key not configured');

  const url = new URL('https://smsbower.page/stubs/handler_api.php');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('action', 'getBalance');
  const response = await fetchWithTimeout(url.toString());
  const body = await response.text();
  const match = body.match(/^ACCESS_BALANCE:([\d.]+)/);

  if (!response.ok || !match) {
    return unavailable('smsbower', 'SMSBower', 'Foreign numbers', body === 'BAD_KEY' ? 'Key rejected' : 'Provider unavailable');
  }

  return {
    id: 'smsbower',
    name: 'SMSBower',
    capability: 'Foreign numbers',
    connected: true,
    balance: Number(match[1]),
    currency: 'USD',
    detail: 'Activation API ready',
  };
}

async function getJapStatus(): Promise<ProviderStatus> {
  const apiKey = process.env.JAP_API_KEY;
  if (!apiKey) return unavailable('jap', 'Just Another Panel', 'Social boosting', 'API key not configured');

  const body = new URLSearchParams({ key: apiKey, action: 'balance' });
  const response = await fetchWithTimeout('https://justanotherpanel.com/api/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await response.json()) as { balance?: string; currency?: string; error?: string };

  if (!response.ok || data.balance === undefined) {
    return unavailable('jap', 'Just Another Panel', 'Social boosting', data.error || 'Provider unavailable');
  }

  return {
    id: 'jap',
    name: 'Just Another Panel',
    capability: 'Social boosting',
    connected: true,
    balance: Number(data.balance),
    currency: data.currency || 'USD',
    detail: 'SMM order API ready',
  };
}

async function getBulkAccStatus(): Promise<ProviderStatus> {
  const apiKey = process.env.BULKACC_API_KEY;
  if (!apiKey) return unavailable('bulkacc', 'BulkAcc', 'Account logs', 'API key not configured');

  const url = new URL('https://bulkacc.com/api/accounts');
  url.searchParams.set('apiKey', apiKey);
  const response = await fetchWithTimeout(url.toString());
  const data = (await response.json()) as { data?: number; statusCode?: number; message?: string };

  if (!response.ok || data.statusCode !== 200 || typeof data.data !== 'number') {
    return unavailable('bulkacc', 'BulkAcc', 'Account logs', data.message || 'Provider unavailable');
  }

  return {
    id: 'bulkacc',
    name: 'BulkAcc',
    capability: 'Account logs',
    connected: true,
    balance: data.data,
    currency: 'USD',
    detail: 'Inventory API ready',
  };
}

export async function GET() {
  const checks = await Promise.allSettled([
    getSmsBowerStatus(),
    getJapStatus(),
    getBulkAccStatus(),
  ]);
  const fallbacks = [
    unavailable('smsbower', 'SMSBower', 'Foreign numbers', 'Connection timed out'),
    unavailable('jap', 'Just Another Panel', 'Social boosting', 'Connection timed out'),
    unavailable('bulkacc', 'BulkAcc', 'Account logs', 'Connection timed out'),
  ];
  const providers = checks.map((check, index) =>
    check.status === 'fulfilled' ? check.value : fallbacks[index],
  );

  return Response.json(
    { providers, refreshedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
