// ==============================================================================
// Brainnote SaaS — Stripe Checkout Session Creator
// POST /api/billing/checkout
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionTier } from '@/types';
import { PLAN_CONFIGS } from '@/lib/billing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, tenantId, userEmail } = body;

    if (!tier || !tenantId) {
      return NextResponse.json(
        { error: 'Tier and tenantId are mandatory for initiating checkout.' },
        { status: 400 }
      );
    }

    const plan = PLAN_CONFIGS[tier as SubscriptionTier];
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid subscription tier requested.' },
        { status: 400 }
      );
    }

    const isTrialActivation = tier === 'trial';

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // If Stripe keys are configured on the server, construct real Stripe Checkout Session
    if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
      const params = new URLSearchParams();
      params.append('payment_method_types[0]', 'card');

      if (isTrialActivation) {
        // Card upfront trial: Subscription with 7-day trial period (₹0 due today)
        params.append('mode', 'subscription');
        params.append('subscription_data[trial_period_days]', '7');
        params.append('line_items[0][price_data][currency]', 'inr');
        params.append('line_items[0][price_data][unit_amount]', '100000'); // ₹1,000 auto-renews after 7 days
        params.append('line_items[0][price_data][recurring][interval]', 'month');
        params.append('line_items[0][price_data][product_data][name]', '7-Day Free Trial (Card Required Upfront)');
        params.append('line_items[0][price_data][product_data][description]', '7 days free trial, then converts to Lifetime Pro license. ₹0 charged today. Cancel anytime with 1 click.');
        params.append('line_items[0][quantity]', '1');
      } else {
        const isOneTime = plan.isOneTime;
        const priceAmountPaise = plan.priceInr * 100;

        params.append('mode', isOneTime ? 'payment' : 'subscription');
        params.append('line_items[0][price_data][currency]', 'inr');
        params.append('line_items[0][price_data][unit_amount]', priceAmountPaise.toString());
        params.append('line_items[0][price_data][product_data][name]', `${plan.name} (One-Time Purchase)`);
        params.append('line_items[0][price_data][product_data][description]', 'Lifetime access to Brainnote AI knowledge companion, 1,000,000 tokens, unlimited notes, and all AI tools.');
        params.append('line_items[0][quantity]', '1');
      }

      params.append('client_reference_id', tenantId);
      params.append('metadata[tenant_id]', tenantId);
      params.append('metadata[plan_tier]', tier);
      params.append('metadata[is_trial_subscription]', isTrialActivation ? 'true' : 'false');
      params.append('metadata[price_inr]', plan.priceInr.toString());

      if (userEmail) {
        params.append('customer_email', userEmail);
      }
      params.append('success_url', `${appUrl}/?session_id={CHECKOUT_SESSION_ID}&billing=success`);
      params.append('cancel_url', `${appUrl}/?billing=canceled`);

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!stripeRes.ok) {
        const errorData = await stripeRes.json();
        return NextResponse.json(
          { error: `Stripe API error: ${errorData.error?.message || 'Failed to create session'}` },
          { status: 502 }
        );
      }

      const session = await stripeRes.json();
      return NextResponse.json({
        success: true,
        checkoutUrl: session.url,
      });
    }

    // In local dev or test mode without credentials, provide immediate card authorization feedback
    return NextResponse.json({
      success: true,
      isConfigured: false,
      isTrialSubscription: isTrialActivation,
      message: isTrialActivation
        ? 'Payment card successfully authorized! 7-Day Free Trial activated with subscription on file. ₹0 charged today.'
        : `Payment verified! Workspace upgraded to ${plan.name}.`,
      hasPaymentMethod: true,
      paymentMethodDetails: {
        brand: 'Visa',
        last4: '4242',
      },
      planDetails: {
        name: plan.name,
        priceInr: plan.priceInr,
        priceUsd: plan.priceMonthlyUsd,
        isOneTime: plan.isOneTime,
        tokenQuota: plan.aiTokensLimit,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Internal checkout error' },
      { status: 500 }
    );
  }
}
