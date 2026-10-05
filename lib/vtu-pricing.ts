const VTU_SERVICE_FEE_PERCENT = 7.5;
const VTU_SERVICE_FEE_MINIMUM_NGN = 50;
const VTU_SERVICE_FEE_MAXIMUM_NGN = 750;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function getVtuServiceChargeNgn(baseAmount: number) {
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) return 0;

  const percentageFee = baseAmount * (VTU_SERVICE_FEE_PERCENT / 100);
  return roundMoney(
    Math.min(
      VTU_SERVICE_FEE_MAXIMUM_NGN,
      Math.max(VTU_SERVICE_FEE_MINIMUM_NGN, percentageFee),
    ),
  );
}

export function getVtuQuote(baseAmount: number) {
  const normalizedBase = roundMoney(baseAmount);
  const serviceCharge = getVtuServiceChargeNgn(normalizedBase);

  return {
    baseAmount: normalizedBase,
    serviceCharge,
    totalAmount: roundMoney(normalizedBase + serviceCharge),
    serviceFeePercent: VTU_SERVICE_FEE_PERCENT,
  };
}

export function getVtuServiceFeeDescription() {
  return `${VTU_SERVICE_FEE_PERCENT}% (minimum ₦${VTU_SERVICE_FEE_MINIMUM_NGN}, maximum ₦${VTU_SERVICE_FEE_MAXIMUM_NGN})`;
}
