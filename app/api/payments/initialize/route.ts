import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { initializePaystackTransaction, calculateExpiryDate } from '@/lib/paystack';
import { getPlanByName } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const { planName } = await request.json();

    if (!planName) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get or create customer record with the privileged server client after authenticating the session.
    const db = createAdminClient();
    const { data: customers, error: customerError } = await db
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (customerError) {
      return NextResponse.json(
        { error: 'Failed to fetch customer record' },
        { status: 500 }
      );
    }

    let customerId: string;

    if (customers && customers.length > 0) {
      customerId = customers[0].id;
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await db
        .from('customers')
        .insert([
          {
            user_id: user.id,
            customer_number: `STC-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
            full_name: user.user_metadata?.full_name || user.email,
            phone: user.user_metadata?.phone || '0000000000',
            email: user.email,
            status: 'PENDING',
          },
        ])
        .select('id')
        .single();

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create customer record' },
          { status: 500 }
        );
      }

      customerId = newCustomer.id;
    }

    // Get plan details
    let plan;
    try {
      plan = await getPlanByName(planName);
    } catch (error) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Initialize Paystack transaction
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paystackResponse = await initializePaystackTransaction({
      email: user.email,
      amount: plan.priceMinor, // Already in minor units (kobo)
      metadata: {
        customerId,
        planId: plan.id,
        planName: plan.name,
        expiryDate: calculateExpiryDate(plan.durationDays).toISOString(),
      },
      callback_url: `${appUrl}/api/payments/verify`,
    });

    if (!paystackResponse.status) {
      return NextResponse.json(
        { error: 'Failed to initialize payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
      reference: paystackResponse.data.reference,
    });
  } catch (error) {
    console.error('[v0] Payment initialization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
