import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isSafeReference } from '@/lib/supabase/admin';
import { verifyPaystackTransaction } from '@/lib/paystack';
import { createSubscription } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');

    if (!reference || !isSafeReference(reference)) {
      return NextResponse.json(
        { error: 'Reference parameter is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    let verifyResponse;
    try {
      verifyResponse = await verifyPaystackTransaction(reference);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to verify payment' },
        { status: 500 }
      );
    }

    if (!verifyResponse.status || verifyResponse.data.status !== 'success') {
      return NextResponse.redirect(new URL('/auth/error?code=payment_failed', request.url));
    }

    const metadata = verifyResponse.data.metadata as {
      customerId?: string;
      planId?: string;
    };

    const sessionClient = await createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (!user?.id) {
      return NextResponse.redirect(new URL('/login?error=payment_auth_required', request.url));
    }

    const supabase = createAdminClient();
    const { data: customer } = await supabase
      .from('customers')
      .select('id, user_id')
      .eq('id', metadata?.customerId ?? '')
      .single();
    const { data: plan } = await supabase
      .from('plans')
      .select('id, price, duration_days, active')
      .eq('id', metadata?.planId ?? '')
      .single();

    if (
      !metadata?.customerId ||
      !metadata?.planId ||
      !customer ||
      customer.user_id !== user.id ||
      !plan ||
      !plan.active
    ) {
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    if (verifyResponse.data.customer.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Payment customer does not match account' }, { status: 400 });
    }

    const expectedAmount = Math.round(Number(plan.price) * 100);
    if (verifyResponse.data.amount !== expectedAmount) {
      return NextResponse.json({ error: 'Payment amount does not match selected plan' }, { status: 400 });
    }

    const expiryDate = new Date(Date.now() + Number(plan.duration_days) * 86400000);

    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('provider', 'paystack')
      .eq('provider_reference', reference)
      .maybeSingle();

    // Create the durable payment record only after Paystack verification and
    // server-side plan validation. The unique provider/reference index makes
    // this safe to retry.
    let paymentError = null;
    if (!existingPayment) {
      const result = await supabase
        .from('payments')
        .insert([
          {
            customer_id: metadata.customerId,
            provider: 'paystack',
            provider_reference: reference,
            amount: verifyResponse.data.amount / 100,
            currency: 'GHS',
            status: 'SUCCESS',
            paid_at: verifyResponse.data.paid_at
              ? new Date(verifyResponse.data.paid_at).toISOString()
              : new Date().toISOString(),
          },
        ]);
      paymentError = result.error;
    }

    if (paymentError) {
      // The unique provider/reference index makes retries idempotent. Any other
      // insert failure must stop activation because no durable payment exists.
      if (paymentError.code === '23505') {
        return NextResponse.redirect(
          new URL(`/dashboard?payment=success&reference=${encodeURIComponent(reference)}`, request.url)
        );
      }
      console.error('[v0] Payment record creation error:', paymentError);
      return NextResponse.json({ error: 'Could not record verified payment' }, { status: 500 });
    }

    const { data: activeSubscription, error: activeSubscriptionError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('plan_id', plan.id)
      .eq('status', 'ACTIVE')
      .gt('expiry_date', new Date().toISOString())
      .maybeSingle();

    if (activeSubscriptionError) {
      return NextResponse.json({ error: 'Could not check subscription state' }, { status: 500 });
    }

    let subscriptionId = activeSubscription?.id;
    if (!subscriptionId) {
      try {
        const createdSubscription = await createSubscription({
          customerId: customer.id,
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          expiryDate,
        });
        subscriptionId = createdSubscription.id;
      } catch (error) {
        console.error('[v0] Subscription creation error:', error);
        return NextResponse.json(
          { error: 'Payment verified but subscription creation failed' },
          { status: 500 }
        );
      }
    }

    const { error: paymentLinkError } = await supabase
      .from('payments')
      .update({ subscription_id: subscriptionId })
      .eq('provider', 'paystack')
      .eq('provider_reference', reference)
      .eq('customer_id', customer.id);

    if (paymentLinkError) {
      console.error('[v0] Payment subscription link error:', paymentLinkError);
      return NextResponse.json({ error: 'Could not finalize payment activation' }, { status: 500 });
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/dashboard?payment=success&reference=${reference}`, request.url)
    );
  } catch (error) {
    console.error('[v0] Payment verification error:', error);
    return NextResponse.redirect(new URL('/auth/error?code=verification_error', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reference = body.reference;

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    // Verify payment
    const verifyResponse = await verifyPaystackTransaction(reference);

    if (!verifyResponse.status) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: verifyResponse.data.status,
      amount: verifyResponse.data.amount,
      reference: verifyResponse.data.reference,
    });
  } catch (error) {
    console.error('[v0] Payment verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
