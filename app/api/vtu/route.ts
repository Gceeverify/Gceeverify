import {
  getBigisubCablePlans,
  getBigisubDataPlans,
  getBigisubElectricityProviders,
  getBigisubExamPrices,
  getBigisubWallet,
  purchaseBigisubAirtime,
  purchaseBigisubCable,
  purchaseBigisubData,
  purchaseBigisubElectricity,
  purchaseBigisubExam,
  verifyBigisubCable,
  verifyBigisubElectricity,
} from '@/lib/provider-clients';
import { getCurrentUser } from '@/lib/auth';
import { providerReference, recordOrder } from '@/lib/orders';
import { getVtuPriceNgn } from '@/lib/exchange-rates';
import { withWalletCharge } from '@/lib/wallet';

const phonePattern = /^0[789]\d{9}$/;
const cableProviders = new Set(['dstv', 'gotv', 'startimes', 'showmax']);
const meterTypes = new Set(['prepaid', 'postpaid']);

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function positiveNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function providerError(error: unknown, fallback: string, status = 400) {
  return Response.json(
    { error: error instanceof Error ? error.message : fallback },
    { status },
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    if (service === 'wallet') return Response.json(await getBigisubWallet());
    if (service === 'data') {
      const network = Number(searchParams.get('network'));
      if (![1, 2, 3, 4].includes(network)) {
        return Response.json(
          { error: 'Choose a valid mobile network.' },
          { status: 400 },
        );
      }
      const plans = (await getBigisubDataPlans(network)).filter(
        (plan) => !plan.plan_disabled,
      );
      return Response.json({
        plans: plans.map((plan) => ({
          ...plan,
          amount: getVtuPriceNgn(plan.amount),
          plan_amount: getVtuPriceNgn(plan.plan_amount || plan.amount),
        })),
      });
    }
    if (service === 'cable') {
      const provider = text(searchParams.get('provider')).toLowerCase();
      if (!cableProviders.has(provider)) {
        return Response.json(
          { error: 'Choose a valid TV provider.' },
          { status: 400 },
        );
      }
      const plans = await getBigisubCablePlans(provider);
      return Response.json({
        plans: plans.map((plan) => ({
          ...plan,
          amount: getVtuPriceNgn(plan.amount),
        })),
      });
    }
    if (service === 'electricity') {
      return Response.json({
        providers: await getBigisubElectricityProviders(),
      });
    }
    if (service === 'exam') {
      const prices = await getBigisubExamPrices();
      return Response.json({
        prices: prices.map((price) => ({
          ...price,
          amount: getVtuPriceNgn(price.amount),
        })),
      });
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

    if (action === 'verify' && service === 'cable') {
      if (!cableProviders.has(provider) || account.length < 8) {
        return Response.json(
          { error: 'Enter a valid TV provider and smartcard number.' },
          { status: 400 },
        );
      }
      return Response.json(await verifyBigisubCable(provider, account));
    }

    if (action === 'verify' && service === 'electricity') {
      if (
        !provider ||
        !meterTypes.has(meterType) ||
        !/^\d{10,15}$/.test(account)
      ) {
        return Response.json(
          { error: 'Enter a valid provider, meter type and meter number.' },
          { status: 400 },
        );
      }
      return Response.json(
        await verifyBigisubElectricity(provider, account, meterType),
      );
    }

    if (action !== 'purchase') {
      return Response.json(
        { error: 'Choose a valid utility action.' },
        { status: 400 },
      );
    }

    if (service === 'airtime') {
      const network = Number(body.provider);
      const amount = positiveNumber(body.amount);
      if (
        ![1, 2, 3, 4].includes(network) ||
        !phonePattern.test(account) ||
        !amount ||
        amount < 25
      ) {
        return Response.json(
          {
            error:
              'Enter a valid network, phone number and amount of at least ₦25.',
          },
          { status: 400 },
        );
      }
      // Airtime is sold at face value: the entered recharge amount is also
      // the checkout total and wallet debit. Plan-based VTU services keep
      // their configured retail pricing below.
      const charge = amount;
      const result = await withWalletCharge({
        userId: user.id,
        amount: charge,
        description: `VTU airtime purchase for ${account}`,
        purchase: () => purchaseBigisubAirtime(network, account, amount),
      });
      await recordOrder({
        userId: user.id,
        category: 'vtu-airtime',
        serviceName: 'Airtime recharge',
        provider: 'Bigisub',
        providerOrderId: providerReference(result),
        amount: charge,
        currency: 'NGN',
        status: 'completed',
        metadata: { network, rechargeValue: amount },
      });
      return Response.json(result, { status: 201 });
    }

    if (service === 'data') {
      const network = Number(body.provider);
      const plan = Number(body.plan);
      if (
        ![1, 2, 3, 4].includes(network) ||
        !Number.isInteger(plan) ||
        !phonePattern.test(account)
      ) {
        return Response.json(
          {
            error:
              'Choose a valid data plan and enter an 11-digit phone number.',
          },
          { status: 400 },
        );
      }
      const matchingPlan = (await getBigisubDataPlans(network)).find(
        (item) => item.id === plan && !item.plan_disabled,
      );
      if (!matchingPlan)
        return Response.json(
          { error: 'That data plan is no longer available.' },
          { status: 409 },
        );
      const charge = getVtuPriceNgn(
        matchingPlan.plan_amount || matchingPlan.amount,
      );
      const result = await withWalletCharge({
        userId: user.id,
        amount: charge,
        description: `VTU data purchase for ${account}`,
        purchase: () => purchaseBigisubData(network, plan, account),
      });
      await recordOrder({
        userId: user.id,
        category: 'vtu-data',
        serviceName: `${matchingPlan.network_name} ${matchingPlan.plan_volume || matchingPlan.size}`,
        provider: 'Bigisub',
        providerOrderId: providerReference(result),
        amount: charge,
        currency: 'NGN',
        status: 'completed',
        metadata: { network, plan },
      });
      return Response.json(result, { status: 201 });
    }

    if (service === 'cable') {
      const planId = Number(body.plan);
      if (
        !cableProviders.has(provider) ||
        account.length < 8 ||
        !phonePattern.test(phone) ||
        !Number.isInteger(planId)
      ) {
        return Response.json(
          { error: 'Complete the TV subscription details.' },
          { status: 400 },
        );
      }
      const [verified, plans] = await Promise.all([
        verifyBigisubCable(provider, account),
        getBigisubCablePlans(provider),
      ]);
      const plan = plans.find((item) => item.id === planId);
      if (!verified.valid || !plan) {
        return Response.json(
          { error: 'The smartcard or selected package could not be verified.' },
          { status: 409 },
        );
      }
      const charge = getVtuPriceNgn(plan.amount);
      const result = await withWalletCharge({
        userId: user.id,
        amount: charge,
        description: `VTU cable purchase for ${account}`,
        purchase: () => purchaseBigisubCable({
          cableType: provider,
          cardNumber: account,
          phone,
          amount: plan.amount,
          customerName: verified.customer_name,
        }),
      });
      await recordOrder({
        userId: user.id,
        category: 'vtu-cable',
        serviceName: plan.product_name,
        provider: 'Bigisub',
        providerOrderId: providerReference(result),
        amount: charge,
        currency: 'NGN',
        status: 'completed',
        metadata: { cableProvider: provider },
      });
      return Response.json(result, { status: 201 });
    }

    if (service === 'electricity') {
      const amount = positiveNumber(body.amount);
      if (
        !provider ||
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
      const [verified, providers] = await Promise.all([
        verifyBigisubElectricity(provider, account, meterType),
        getBigisubElectricityProviders(),
      ]);
      const selectedProvider = providers.find((item) => item.code === provider);
      if (!selectedProvider || amount < selectedProvider.min_amount) {
        return Response.json(
          {
            error: `The minimum payment for this provider is ₦${selectedProvider?.min_amount ?? 500}.`,
          },
          { status: 400 },
        );
      }
      const charge = getVtuPriceNgn(amount);
      const result = await withWalletCharge({
        userId: user.id,
        amount: charge,
        description: `VTU electricity purchase for ${account}`,
        purchase: () => purchaseBigisubElectricity({
          company: provider,
          meterNumber: account,
          meterType,
          phone,
          amount,
          customerName: verified.customer_name,
          customerAddress: verified.customer_address,
        }),
      });
      await recordOrder({
        userId: user.id,
        category: 'vtu-electricity',
        serviceName: `${selectedProvider.name} electricity`,
        provider: 'Bigisub',
        providerOrderId: providerReference(result),
        amount: charge,
        currency: 'NGN',
        status: 'completed',
        metadata: { meterType, utilityValue: amount },
      });
      return Response.json(result, { status: 201 });
    }

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
      if (!price)
        return Response.json(
          { error: 'That exam PIN is no longer available.' },
          { status: 409 },
        );
      const charge = getVtuPriceNgn(price.amount * quantity);
      const result = await withWalletCharge({
        userId: user.id,
        amount: charge,
        description: `VTU ${price.name || price.exam_type} PIN purchase`,
        purchase: () => purchaseBigisubExam(price.code, quantity),
      });
      await recordOrder({
        userId: user.id,
        category: 'exam-pin',
        serviceName: price.name || price.exam_type,
        provider: 'Bigisub',
        providerOrderId: providerReference(result),
        amount: charge,
        currency: 'NGN',
        status: 'completed',
        metadata: { quantity },
      });
      return Response.json(result, { status: 201 });
    }

    return Response.json(
      { error: 'Choose a valid utility service.' },
      { status: 400 },
    );
  } catch (error) {
    return providerError(error, 'The utility request could not be completed.');
  }
}
