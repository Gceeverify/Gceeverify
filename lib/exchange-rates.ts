const USD_NGN_RATE_URL = 'https://open.er-api.com/v6/latest/USD';
const FALLBACK_USD_NGN_RATE = 1327.93;
const DEFAULT_BOOST_MARKUP_PERCENT = 30;
const DEFAULT_NUMBER_MARKUP_PERCENT = 30;
const DEFAULT_LOG_MARKUP_PERCENT = 30;
const DEFAULT_VIRTUAL_EMAIL_MARKUP_PERCENT = 300;
const DEFAULT_VIRTUAL_EMAIL_LOW_PRICE_THRESHOLD_NGN = 90;
const DEFAULT_VIRTUAL_EMAIL_LOW_PRICE_MARKUP_PERCENT = 1500;
const DEFAULT_RESELLER_MARKUP_PERCENT = 40;
const NUMBER_TIER_INCREASE_PERCENT = {
  gold: 30,
  silver: 20,
  bronze: 10,
} as const;
const NUMBER_TIER_MINIMUM_GAP_PERCENT = {
  goldOverSilver: 20,
  silverOverBronze: 15,
} as const;
const NUMBER_BRONZE_MINIMUM_PRICE_NGN = 1000;
const SNAPCHAT_MINIMUM_PRICE_NGN = {
  gold: 3700,
  silver: 2800,
  bronze: 1200,
} as const;
const USA_FACEBOOK_FIXED_PRICE_NGN = {
  gold: 1670,
  silver: 1350,
  bronze: 1000,
} as const;
const UK_FACEBOOK_FIXED_PRICE_NGN = {
  gold: 800,
  silver: 638,
  bronze: 500,
} as const;
const UK_TIKTOK_FIXED_PRICE_NGN = {
  gold: 216,
  silver: 170,
  bronze: 100,
} as const;
const UK_DISCORD_FIXED_PRICE_NGN = {
  gold: 1900,
  silver: 1500,
  bronze: 1000,
} as const;
const NUMBER_LOW_PRICE_THRESHOLD_NGN = 1000;
const NUMBER_LOW_PRICE_INCREASE_PERCENT = 50;
const REGIONAL_LOW_PRICE_INCREASE_PERCENT = 30;
const OTHER_COUNTRIES_INCREASE_PERCENT = 40;
const SOCIAL_NUMBER_SERVICES = new Set([
  'whatsapp',
  'telegram',
  'facebook',
  'instagram',
  'tiktok',
  'snapchat',
  'twitter',
  'discord',
]);

const SMSBOWER_SERVICE_NAMES: Record<string, string> = {
  ds: 'discord',
  fb: 'facebook',
  fu: 'snapchat',
  ig: 'instagram',
  lf: 'tiktok',
  tg: 'telegram',
  tw: 'twitter',
  wa: 'whatsapp',
};

const SMSBOWER_COUNTRY_NAMES: Record<string, string> = {
  '12': 'usa',
  '16': 'england',
  '187': 'usa',
};

export type NumberPriceTier = keyof typeof NUMBER_TIER_INCREASE_PERCENT;

function normalizeNumberService(service: string) {
  const normalized = service.trim().toLowerCase();
  return SMSBOWER_SERVICE_NAMES[normalized] ?? normalized;
}

function normalizeNumberCountry(country: string) {
  const normalized = country.trim().toLowerCase();
  return SMSBOWER_COUNTRY_NAMES[normalized] ?? normalized;
}

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

export function getLogMarkupPercent() {
  const configuredMarkup = Number(process.env.LOG_MARKUP_PERCENT);
  return Number.isFinite(configuredMarkup) && configuredMarkup >= 0
    ? configuredMarkup
    : DEFAULT_LOG_MARKUP_PERCENT;
}

export function getLogPriceNgn(providerPriceUsd: number, usdToNgnRate: number) {
  const multiplier = 1 + getLogMarkupPercent() / 100;
  return convertUsdToNgn(providerPriceUsd * multiplier, usdToNgnRate);
}

export function getVirtualEmailPriceNgn(
  providerPriceUsd: number,
  usdToNgnRate: number,
) {
  const configuredMarkup = Number(process.env.VIRTUAL_EMAIL_MARKUP_PERCENT);
  const configuredThreshold = Number(
    process.env.VIRTUAL_EMAIL_LOW_PRICE_THRESHOLD_NGN,
  );
  const configuredLowPriceMarkup = Number(
    process.env.VIRTUAL_EMAIL_LOW_PRICE_MARKUP_PERCENT,
  );
  const standardMarkup =
    Number.isFinite(configuredMarkup) && configuredMarkup >= 0
      ? configuredMarkup
      : DEFAULT_VIRTUAL_EMAIL_MARKUP_PERCENT;
  const lowPriceThreshold =
    Number.isFinite(configuredThreshold) && configuredThreshold >= 0
      ? configuredThreshold
      : DEFAULT_VIRTUAL_EMAIL_LOW_PRICE_THRESHOLD_NGN;
  const lowPriceMarkup =
    Number.isFinite(configuredLowPriceMarkup) && configuredLowPriceMarkup >= 0
      ? configuredLowPriceMarkup
      : DEFAULT_VIRTUAL_EMAIL_LOW_PRICE_MARKUP_PERCENT;
  const providerPriceNgn = providerPriceUsd * usdToNgnRate;
  const markup =
    providerPriceNgn < lowPriceThreshold ? lowPriceMarkup : standardMarkup;
  return Math.round(providerPriceNgn * (1 + markup / 100) * 100) / 100;
}

export function getResellerMarkupPercent() {
  const configuredMarkup = Number(process.env.RESELLER_MARKUP_PERCENT);
  return Number.isFinite(configuredMarkup) && configuredMarkup >= 0
    ? configuredMarkup
    : DEFAULT_RESELLER_MARKUP_PERCENT;
}

export function getResellerPriceNgn(providerPriceNgn: number) {
  const multiplier = 1 + getResellerMarkupPercent() / 100;
  return Math.round(providerPriceNgn * multiplier * 100) / 100;
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
  tier: NumberPriceTier,
  service: string,
  country: string,
) {
  const baseMarkupMultiplier = 1 + getNumberMarkupPercent() / 100;
  const tierMultiplier = 1 + getNumberTierIncreasePercent(tier) / 100;
  const multiplier = baseMarkupMultiplier * tierMultiplier;
  const calculatedPrice = convertUsdToNgn(
    providerPriceUsd * multiplier,
    usdToNgnRate,
  );
  const fixedPrice = getNumberFixedPriceNgn(service, tier, country);
  let adjustedPrice =
    fixedPrice ??
    Math.max(calculatedPrice, getNumberMinimumPriceNgn(service, tier, country));
  const regionalIncreasePercent = getNumberRegionalLowPriceIncreasePercent(
    service,
    country,
  );
  const regionalIncreaseApplications =
    getNumberRegionalLowPriceIncreaseApplications(service, country);
  if (
    adjustedPrice < NUMBER_LOW_PRICE_THRESHOLD_NGN &&
    regionalIncreasePercent > 0
  ) {
    for (let step = 0; step < regionalIncreaseApplications; step += 1) {
      adjustedPrice =
        Math.round(adjustedPrice * (1 + regionalIncreasePercent / 100) * 100) /
        100;
    }
  }
  const priceAfterLowPriceIncrease =
    adjustedPrice < NUMBER_LOW_PRICE_THRESHOLD_NGN
      ? Math.round(
          adjustedPrice * (1 + getNumberLowPriceIncreasePercent() / 100) * 100,
        ) / 100
      : adjustedPrice;
  const countryIncreasePercent = getNumberCountryIncreasePercent(country);
  return countryIncreasePercent > 0
    ? Math.round(
        priceAfterLowPriceIncrease * (1 + countryIncreasePercent / 100) * 100,
      ) / 100
    : priceAfterLowPriceIncrease;
}

export function getNumberTierIncreasePercent(tier: NumberPriceTier) {
  return NUMBER_TIER_INCREASE_PERCENT[tier];
}

export function getOrderedNumberPricesNgn(
  prices: Partial<Record<NumberPriceTier, number>>,
) {
  const ordered = { ...prices };
  if (ordered.bronze !== undefined) {
    ordered.bronze = Math.max(ordered.bronze, NUMBER_BRONZE_MINIMUM_PRICE_NGN);
  }
  if (ordered.bronze !== undefined && ordered.silver !== undefined) {
    ordered.silver = Math.max(
      ordered.silver,
      Math.round(
        ordered.bronze *
          (1 + NUMBER_TIER_MINIMUM_GAP_PERCENT.silverOverBronze / 100) *
          100,
      ) / 100,
    );
  }
  if (ordered.silver !== undefined && ordered.gold !== undefined) {
    ordered.gold = Math.max(
      ordered.gold,
      Math.round(
        ordered.silver *
          (1 + NUMBER_TIER_MINIMUM_GAP_PERCENT.goldOverSilver / 100) *
          100,
      ) / 100,
    );
  }
  return ordered;
}

export function getNumberMinimumPriceNgn(
  service: string,
  tier: NumberPriceTier,
  _country: string,
) {
  const normalizedService = normalizeNumberService(service);
  if (normalizedService === 'snapchat') {
    return SNAPCHAT_MINIMUM_PRICE_NGN[tier];
  }
  return 0;
}

export function getNumberFixedPriceNgn(
  service: string,
  tier: NumberPriceTier,
  country: string,
) {
  const normalizedService = normalizeNumberService(service);
  const normalizedCountry = normalizeNumberCountry(country);
  if (normalizedService === 'facebook' && normalizedCountry === 'usa') {
    return USA_FACEBOOK_FIXED_PRICE_NGN[tier];
  }
  if (normalizedCountry === 'england') {
    if (normalizedService === 'facebook') {
      return UK_FACEBOOK_FIXED_PRICE_NGN[tier];
    }
    if (normalizedService === 'tiktok') {
      return UK_TIKTOK_FIXED_PRICE_NGN[tier];
    }
    if (normalizedService === 'discord') {
      return UK_DISCORD_FIXED_PRICE_NGN[tier];
    }
  }
  return null;
}

export function getNumberLowPriceIncreasePercent() {
  return NUMBER_LOW_PRICE_INCREASE_PERCENT;
}

export function getNumberLowPriceThresholdNgn() {
  return NUMBER_LOW_PRICE_THRESHOLD_NGN;
}

export function getNumberCountryIncreasePercent(country: string) {
  const normalizedCountry = normalizeNumberCountry(country);
  return normalizedCountry === 'usa' || normalizedCountry === 'england'
    ? 0
    : OTHER_COUNTRIES_INCREASE_PERCENT;
}

export function getNumberRegionalLowPriceIncreasePercent(
  service: string,
  country: string,
) {
  const hasFixedPrice =
    getNumberFixedPriceNgn(service, 'gold', country) !== null;
  const normalizedCountry = normalizeNumberCountry(country);
  const normalizedService = normalizeNumberService(service);
  const eligibleCountryAndService =
    normalizedCountry === 'england' ||
    (normalizedCountry === 'usa' &&
      SOCIAL_NUMBER_SERVICES.has(normalizedService));
  return eligibleCountryAndService && !hasFixedPrice
    ? REGIONAL_LOW_PRICE_INCREASE_PERCENT
    : 0;
}

export function getNumberRegionalLowPriceIncreaseApplications(
  service: string,
  country: string,
) {
  if (getNumberRegionalLowPriceIncreasePercent(service, country) === 0) {
    return 0;
  }
  const normalizedService = normalizeNumberService(service);
  const receivesSecondUkIncrease =
    normalizeNumberCountry(country) === 'england' &&
    (normalizedService === 'instagram' || normalizedService === 'twitter');
  return receivesSecondUkIncrease ? 2 : 1;
}
