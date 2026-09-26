const USD_NGN_RATE_URL = 'https://open.er-api.com/v6/latest/USD';
const FALLBACK_USD_NGN_RATE = 1327.93;
const DEFAULT_BOOST_MARKUP_PERCENT = 30;
const DEFAULT_NUMBER_MARKUP_PERCENT = 30;

type ExchangeRateResponse = {
  result?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
};

export type UsdToNgnRate = {
  rate: number;
  updatedAt: string | null;
  source: string;
  sourceUrl: string;
};

export async function getUsdToNgnRate(): Promise<UsdToNgnRate> {
  const configuredRate = Number(process.env.USD_NGN_RATE);
  if (Number.isFinite(configuredRate) && configuredRate > 0) {
    return {
      rate: configuredRate,
      updatedAt: null,
      source: 'Configured exchange rate',
      sourceUrl: 'https://www.cbn.gov.ng/rates/ExchRateByCurrency.html',
    };
  }

  try {
    const response = await fetch(USD_NGN_RATE_URL, {
      next: { revalidate: 86_400 },
    });
    const data = (await response.json()) as ExchangeRateResponse;
    const rate = Number(data.rates?.NGN);
    if (!response.ok || data.result !== 'success' || !Number.isFinite(rate)) {
      throw new Error('USD to NGN rate is unavailable.');
    }
    return {
      rate,
      updatedAt: data.time_last_update_utc ?? null,
      source: 'ExchangeRate-API',
      sourceUrl: 'https://www.exchangerate-api.com',
    };
  } catch {
    return {
      rate: FALLBACK_USD_NGN_RATE,
      updatedAt: null,
      source: 'Fallback exchange rate',
      sourceUrl: 'https://www.cbn.gov.ng/rates/ExchRateByCurrency.html',
    };
  }
}

export function convertUsdToNgn(amountUsd: number, rate: number) {
  return Math.round(amountUsd * rate * 100) / 100;
}

export function getBoostMarkupPercent() {
  const configuredMarkup = Number(process.env.BOOST_MARKUP_PERCENT);
  return Number.isFinite(configuredMarkup) && configuredMarkup >= 0
    ? configuredMarkup
    : DEFAULT_BOOST_MARKUP_PERCENT;
}

export function getBoostRateNgn(providerRateUsd: number, usdToNgnRate: number) {
  const multiplier = 1 + getBoostMarkupPercent() / 100;
  return convertUsdToNgn(providerRateUsd * multiplier, usdToNgnRate);
}

export function getNumberMarkupPercent() {
  const configuredMarkup = Number(process.env.NUMBER_MARKUP_PERCENT);
  return Number.isFinite(configuredMarkup) && configuredMarkup >= 0
    ? configuredMarkup
    : DEFAULT_NUMBER_MARKUP_PERCENT;
}

export function getNumberPriceNgn(
  providerPriceUsd: number,
  usdToNgnRate: number,
) {
  const multiplier = 1 + getNumberMarkupPercent() / 100;
  return convertUsdToNgn(providerPriceUsd * multiplier, usdToNgnRate);
}
