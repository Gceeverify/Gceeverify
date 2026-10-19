import {
  getBigisubExamPrices,
  purchaseBigisubExam,
} from '@/lib/provider-clients';
import { getCurrentUser } from '@/lib/auth';
import {
  extractProviderPurchaseDetails,
  providerReference,
  recordOrder,
} from '@/lib/orders';
import { createAdminClient } from '@/lib/supabase/admin';
import { getVtuQuote } from '@/lib/vtu-pricing';
import { withWalletCharge } from '@/lib/wallet';
import {
  getVtuDataVariations,
  getVtuTvVariations,
  purchaseVtuAirtime,
  purchaseVtuData,
  purchaseVtuElectricity,
  purchaseVtuTv,
  requeryVtuOrder,
  verifyVtuCustomer,
  VtuApiError,
  type VtuOrderData,
} from '@/lib/vtu-ng';
import {
  beginVtuOrder,
  reconcileVtuOrderData,
  refundVtuOrder,
  updateVtuOrder,
  type VtuTrackedOrder,
} from '@/lib/vtu-orders';

const phonePattern = /^(?:0[789]\d{9}|\+234[789]\d{9})$/;
const cableProviders = new Set(['dstv', 'gotv', 'startimes', 'showmax']);
const meterTypes = new Set(['prepaid', 'postpaid']);
const networkIds = new Map([
  ['1', 'mtn'],
  ['2', 'airtel'],
  ['3', 'glo'],
  ['4', '9mobile'],
]);
const idempotencyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const orderNotFoundGraceMs = 3 * 60 * 1000;
const ambiguousProviderErrors = new Set([
  'provider_timeout',
  'provider_unavailable',
]);

const electricityProviders = [
  {
    name: 'Ikeja Electric (IKEDC)',
    code: 'ikeja-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Eko Electric (EKEDC)',
    code: 'eko-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Kano Electric (KEDCO)',
    code: 'kano-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Port Harcourt Electric (PHED)',
    code: 'portharcourt-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Jos Electric (JED)',
    code: 'jos-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Ibadan Electric (IBEDC)',
    code: 'ibadan-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Kaduna Electric (KAEDCO)',
    code: 'kaduna-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Abuja Electric (AEDC)',
    code: 'abuja-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Enugu Electric (EEDC)',
    code: 'enugu-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Benin Electric (BEDC)',
    code: 'benin-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Aba Electric (ABEDC)',
    code: 'aba-electric',
    min_amount: 1000,
    service_charge: 0,
  },
  {
    name: 'Yola Electric (YEDC)',
    code: 'yola-electric',
    min_amount: 1000,
    service_charge: 0,
  },
] as const;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function providerError(error: unknown, fallback: string, status = 400) {
  const responseStatus =
    error instanceof VtuApiError && error.status >= 400 && error.status < 500
      ? error.status
      : status;
  return Response.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: responseStatus },
  );
}

function requestIdFor(idempotencyKey: string) {
  return `gcv_${idempotencyKey.replaceAll('-', '')}`;
}

function responseFromStoredOrder(
  order: VtuTrackedOrder,
  quote: ReturnType<typeof getVtuQuote>,
) {
  const providerResponse = order.metadata.providerResponse;
  return Response.json(
    {
      ...(providerResponse &&
      typeof providerResponse === 'object' &&
      !Array.isArray(providerResponse)
        ? providerResponse
        : {}),
      transaction_id: order.providerOrderId ?? undefined,
      reference: order.providerRequestId,
      status: order.status,
      ...quote,
    },
    {
      status:
        order.status === 'processing' || order.status === 'pending' ? 202 : 200,
    },
  );
}

async function executePurchase(input: {
  userId: string;
  idempotencyKey: string;
  category: string;
  serviceName: string;
  quote: ReturnType<typeof getVtuQuote>;
  metadata: Record<string, string | number | boolean | null>;
  purchase: (requestId: string) => Promise<{ data: VtuOrderData }>;
}) {
  const order = await beginVtuOrder({
    userId: input.userId,
    idempotencyKey: input.idempotencyKey,
    providerRequestId: requestIdFor(input.idempotencyKey),
    category: input.category,
    serviceName: input.serviceName,
    amount: input.quote.totalAmount,
    metadata: { ...input.metadata, ...input.quote },
  });

  if (!['pending', 'processing'].includes(order.status)) {
    return responseFromStoredOrder(order, input.quote);
  }

  try {
    let response: { data: VtuOrderData };
    try {
      response = await input.purchase(order.providerRequestId);
    } catch (error) {
      if (error instanceof VtuApiError && error.code === 'duplicate_order') {
        throw new VtuApiError(
          `VTU.ng blocked this duplicate ${input.serviceName} order because a similar purchase was made within the last three minutes. Your wallet has been refunded. Wait three minutes, then try again.`,
          409,
          error.code,
          true,
        );
      }
      if (
        error instanceof VtuApiError &&
        ['duplicate_request', 'duplicate_request_id'].includes(error.code)
      ) {
        response = await requeryVtuOrder(order.providerRequestId);
      } else {
        throw error;
      }
    }
    const reconciliation = await reconcileVtuOrderData({
      data: response.data,
      requestId: order.providerRequestId,
    });
    return Response.json(
      {
        ...response.data,
        transaction_id:
          response.data.order_id === undefined
            ? undefined
            : String(response.data.order_id),
        reference: order.providerRequestId,
        status: reconciliation.status,
        ...input.quote,
      },
      { status: reconciliation.status === 'processing' ? 202 : 201 },
    );
  } catch (error) {
    const providerRejectedOrder =
      error instanceof VtuApiError &&
      error.status >= 400 &&
      error.status < 500 &&
      !ambiguousProviderErrors.has(error.code);
    if (
      error instanceof VtuApiError &&
      (error.definitiveFailure || providerRejectedOrder)
    ) {
      await refundVtuOrder({
        providerRequestId: order.providerRequestId,
        reason: `Automatic refund: VTU.ng rejected ${input.serviceName}`,
        metadata: {
          providerErrorCode: error.code,
          providerError: error.message,
        },
      });
      return Response.json({
        reference: order.providerRequestId,
        status: 'refunded',
        message: `${error.message} Your wallet has been refunded automatically.`,
        ...input.quote,
      });
    }

    await updateVtuOrder({
      orderId: order.id,
      userId: input.userId,
      providerOrderId: order.providerOrderId,
      status: 'processing',
      metadata: {
        providerStatus: 'awaiting-requery',
        providerErrorCode:
          error instanceof VtuApiError ? error.code : 'unknown_error',
        providerError:
          error instanceof Error ? error.message : 'Unknown provider error',
        lastCheckedAt: new Date().toISOString(),
      },
    });
    return Response.json(
      {
        reference: order.providerRequestId,
        status: 'processing',
        message:
          'VTU.ng has not confirmed the final status yet. This order will be checked automatically.',
        ...input.quote,
      },
      { status: 202 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    if (service === 'data') {
      const network = networkIds.get(searchParams.get('network') ?? '');
      if (!network) {
        return Response.json(
          { error: 'Choose a valid mobile network.' },
          { status: 400 },
        );
      }
      const plans = (await getVtuDataVariations(network))
        .filter((plan) => plan.availability.toLowerCase() === 'available')
        .map((plan) => ({
          id: Number(plan.variation_id),
          network_name: plan.service_name,
          plantype: plan.service_name,
          size: plan.data_plan,
          plan_volume: plan.data_plan,
          validity: '',
          amount: Number(plan.price),
          plan_amount: Number(plan.price),
          plan_disabled: false,
        }));
      return Response.json({ plans });
    }
    if (service === 'cable') {
      const provider = text(searchParams.get('provider')).toLowerCase();
      if (!cableProviders.has(provider)) {
        return Response.json(
          { error: 'Choose a valid TV provider.' },
          { status: 400 },
        );
      }
      const plans = (await getVtuTvVariations(provider))
        .filter((plan) => plan.availability.toLowerCase() === 'available')
        .map((plan) => ({
          id: Number(plan.variation_id),
          cable_name: plan.service_name,
          product_name: plan.package_bouquet,
          variation_code: String(plan.variation_id),
          amount: Number(plan.price),
        }));
      return Response.json({ plans });
    }
    if (service === 'electricity') {
      return Response.json({ providers: electricityProviders });
    }
    if (service === 'exam') {
      return Response.json({ prices: await getBigisubExamPrices() });
    }
    return Response.json(
      { error: 'Choose a valid utility service.' },
      { status: 400 },
    );
  } catch (error) {
    return providerError(error, 'Utility services could not be loaded.', 502);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Sign in to continue.' }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = text(body.action);
    const service = text(body.service);
    const provider = text(body.provider).toLowerCase();
    const account = text(body.account);
    const phone = text(body.phone);
    const meterType = text(body.meterType).toLowerCase();

    if (action === 'track') {
      const requestId = text(body.requestId);
      if (!requestId.startsWith('gcv_')) {
        return Response.json(
          { error: 'Enter a valid VTU order reference.' },
          { status: 400 },
        );
      }
      const admin = createAdminClient();
      const { data: order } = await admin
        .from('orders')
        .select('id,created_at')
        .eq('provider', 'VTU.ng')
        .eq('provider_request_id', requestId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!order) {
        return Response.json(
          { error: 'VTU order not found.' },
          { status: 404 },
        );
      }
      try {
        const response = await requeryVtuOrder(requestId);
        const reconciled = await reconcileVtuOrderData({
          data: response.data,
          requestId,
        });
        return Response.json({
          ...response.data,
          transaction_id:
            response.data.order_id === undefined
              ? undefined
              : String(response.data.order_id),
          reference: requestId,
          status: reconciled.status,
        });
      } catch (error) {
        if (error instanceof VtuApiError && error.code === 'order_not_found') {
          const orderAge = Date.now() - new Date(order.created_at).getTime();
          if (orderAge < orderNotFoundGraceMs) {
            return Response.json(
              {
                reference: requestId,
                status: 'processing',
                message: 'VTU.ng is still confirming this order.',
              },
              { status: 202 },
            );
          }
          await refundVtuOrder({
            providerRequestId: requestId,
            reason:
              'Automatic refund: VTU.ng could not find the order after the confirmation window',
            metadata: {
              providerErrorCode: error.code,
              providerError: error.message,
              lastCheckedAt: new Date().toISOString(),
            },
          });
          return Response.json({
            reference: requestId,
            status: 'refunded',
            message:
              'VTU.ng could not confirm this purchase. Your wallet has been refunded automatically.',
          });
        }
        throw error;
      }
    }

    if (
      action === 'verify' &&
      (service === 'cable' || service === 'electricity')
    ) {
      if (
        service === 'cable' &&
        (!cableProviders.has(provider) || account.length < 5)
      ) {
        return Response.json(
          { error: 'Enter a valid TV provider and smartcard number.' },
          { status: 400 },
        );
      }
      if (
        service === 'electricity' &&
        (!electricityProviders.some((item) => item.code === provider) ||
          !meterTypes.has(meterType) ||
          !/^\d{10,15}$/.test(account))
      ) {
        return Response.json(
          { error: 'Enter a valid provider, meter type and meter number.' },
          { status: 400 },
        );
      }
      if (service === 'cable' && provider === 'showmax') {
        return Response.json({
          customer_name: 'Showmax account',
          customer_id: account,
        });
      }
      const verification = await verifyVtuCustomer({
        customerId: account,
        serviceId: provider,
        variationId: service === 'electricity' ? meterType : undefined,
      });
      return Response.json(verification.data);
    }

    if (action !== 'purchase') {
      return Response.json(
        { error: 'Choose a valid utility action.' },
        { status: 400 },
      );
    }

    const idempotencyKey = text(body.idempotencyKey);
    if (!idempotencyPattern.test(idempotencyKey)) {
      return Response.json(
        {
          error:
            'This checkout session expired. Please review the purchase again.',
        },
        { status: 409 },
      );
    }

    if (service === 'airtime') {
      const network = networkIds.get(text(body.provider));
      const amount = positiveNumber(body.amount);
      const minimum = network === 'mtn' ? 10 : 50;
      if (
        !network ||
        !phonePattern.test(account) ||
        !amount ||
        amount < minimum ||
        amount > 50_000
      ) {
        return Response.json(
          {
            error: `Enter a valid network, phone number and amount from ₦${minimum} to ₦50,000.`,
          },
          { status: 400 },
        );
      }
      const quote = getVtuQuote(amount);
      return await executePurchase({
        userId: user.id,
        idempotencyKey,
        category: 'vtu-airtime',
        serviceName: 'Airtime recharge',
        quote,
        metadata: { network, phoneNumber: account, rechargeValue: amount },
        purchase: (requestId) =>
          purchaseVtuAirtime({
            requestId,
            phone: account,
            serviceId: network,
            amount,
          }),
      });
    }

    if (service === 'data') {
      const network = networkIds.get(text(body.provider));
      const planId = text(body.plan);
      if (!network || !/^\d+$/.test(planId) || !phonePattern.test(account)) {
        return Response.json(
          { error: 'Choose a valid data plan and enter a valid phone number.' },
          { status: 400 },
        );
      }
      const plan = (await getVtuDataVariations(network)).find(
        (item) =>
          String(item.variation_id) === planId &&
          item.availability.toLowerCase() === 'available',
      );
      if (!plan) {
        return Response.json(
          { error: 'That data plan is no longer available.' },
          { status: 409 },
        );
      }
      const quote = getVtuQuote(Number(plan.price));
      return await executePurchase({
        userId: user.id,
        idempotencyKey,
        category: 'vtu-data',
        serviceName: `${plan.service_name} ${plan.data_plan}`,
        quote,
        metadata: {
          network,
          phoneNumber: account,
          plan: planId,
          planName: plan.data_plan,
        },
        purchase: (requestId) =>
          purchaseVtuData({
            requestId,
            phone: account,
            serviceId: network,
            variationId: planId,
          }),
      });
    }

    if (service === 'cable') {
      const planId = text(body.plan);
      if (
        !cableProviders.has(provider) ||
        account.length < 5 ||
        !phonePattern.test(phone) ||
        !/^\d+$/.test(planId)
      ) {
        return Response.json(
          { error: 'Complete the TV subscription details.' },
          { status: 400 },
        );
      }
      const [verification, plans] = await Promise.all([
        provider === 'showmax'
          ? Promise.resolve({ data: { customer_name: 'Showmax account' } })
          : verifyVtuCustomer({ customerId: account, serviceId: provider }),
        getVtuTvVariations(provider),
      ]);
      const plan = plans.find(
        (item) =>
          String(item.variation_id) === planId &&
          item.availability.toLowerCase() === 'available',
      );
      if (!plan) {
        return Response.json(
          { error: 'That TV package is no longer available.' },
          { status: 409 },
        );
      }
      const quote = getVtuQuote(Number(plan.price));
      return await executePurchase({
        userId: user.id,
        idempotencyKey,
        category: 'vtu-cable',
        serviceName: plan.package_bouquet,
        quote,
        metadata: {
          cableProvider: provider,
          smartcardNumber: account,
          contactPhone: phone,
          customerName: text(verification.data.customer_name),
          packageName: plan.package_bouquet,
        },
        purchase: (requestId) =>
          purchaseVtuTv({
            requestId,
            customerId: account,
            serviceId: provider,
            variationId: planId,
            subscriptionType: 'change',
          }),
      });
    }

    if (service === 'electricity') {
      const amount = positiveNumber(body.amount);
      if (
        !electricityProviders.some((item) => item.code === provider) ||
        !meterTypes.has(meterType) ||
        !/^\d{10,15}$/.test(account) ||
        !phonePattern.test(phone) ||
        !amount
      ) {
        return Response.json(
          { error: 'Complete the electricity payment details.' },
          { status: 400 },
        );
      }
      const verification = await verifyVtuCustomer({
        customerId: account,
        serviceId: provider,
        variationId: meterType,
      });
      const minimum =
        positiveNumber(verification.data.min_purchase_amount) ?? 1000;
      const maximum =
        positiveNumber(verification.data.max_purchase_amount) ?? 100_000;
      if (amount < minimum || amount > maximum) {
        return Response.json(
          {
            error: `Enter an amount from ₦${minimum.toLocaleString('en-NG')} to ₦${maximum.toLocaleString('en-NG')}.`,
          },
          { status: 400 },
        );
      }
      const selectedProvider = electricityProviders.find(
        (item) => item.code === provider,
      )!;
      const quote = getVtuQuote(amount);
      return await executePurchase({
        userId: user.id,
        idempotencyKey,
        category: 'vtu-electricity',
        serviceName: `${selectedProvider.name} electricity`,
        quote,
        metadata: {
          meterNumber: account,
          contactPhone: phone,
          customerName: text(verification.data.customer_name),
          customerAddress: text(verification.data.customer_address) || null,
          meterType,
          utilityValue: amount,
        },
        purchase: (requestId) =>
          purchaseVtuElectricity({
            requestId,
            customerId: account,
            serviceId: provider,
            variationId: meterType,
            amount,
          }),
      });
    }

    // Exam PINs are not part of VTU.ng v2. Preserve the existing provider so
    // this service keeps working while the requested utilities move to VTU.ng.
    if (service === 'exam') {
      const quantity = Number(body.quantity);
      if (!provider || ![1, 2, 5].includes(quantity)) {
        return Response.json(
          { error: 'Choose an exam and a valid quantity.' },
          { status: 400 },
        );
      }
      const price = (await getBigisubExamPrices()).find(
        (item) =>
          item.code.toLowerCase() === provider ||
          item.exam_type.toLowerCase() === provider,
      );
      if (!price) {
        return Response.json(
          { error: 'That exam PIN is no longer available.' },
          { status: 409 },
        );
      }
      const quote = getVtuQuote(price.amount * quantity);
      const result = await withWalletCharge({
        userId: user.id,
        amount: quote.totalAmount,
        description: `VTU ${price.name || price.exam_type} PIN purchase`,
        purchase: () => purchaseBigisubExam(price.code, quantity),
      });
      await recordOrder({
        userId: user.id,
        category: 'exam-pin',
        serviceName: price.name || price.exam_type,
        provider: 'Bigisub',
        providerOrderId: providerReference(result),
        amount: quote.totalAmount,
        currency: 'NGN',
        status: 'completed',
        metadata: {
          quantity,
          examProvider: price.name || price.exam_type,
          ...quote,
          delivery: extractProviderPurchaseDetails(result),
        },
      });
      return Response.json({ ...result, ...quote }, { status: 201 });
    }

    return Response.json(
      { error: 'Choose a valid utility service.' },
      { status: 400 },
    );
  } catch (error) {
    return providerError(error, 'The utility request could not be completed.');
  }
}
