import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, hashAccessCode, makeAccessCode } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const db = createAdminClient();

    // Get customer record
    const { data: customers, error: customerError } = await db
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (customerError || !customers) {
      return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
    }

    // Check for active subscription
    const { data: subscriptions, error: subscriptionError } = await db
      .from('subscriptions')
      .select('*')
      .eq('customer_id', customers.id)
      .eq('status', 'ACTIVE')
      .gt('expiry_date', new Date().toISOString())
      .limit(1);

    if (subscriptionError) {
      return NextResponse.json(
        { error: 'Failed to check subscription' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 403 }
      );
    }

    const subscription = subscriptions[0];

    // An active subscription must have a durable successful Paystack payment
    // before any access credential can be exposed.
    const { data: successfulPayment, error: paymentError } = await db
      .from('payments')
      .select('id')
      .eq('customer_id', customers.id)
      .eq('subscription_id', subscription.id)
      .eq('provider', 'paystack')
      .eq('status', 'SUCCESS')
      .limit(1)
      .maybeSingle();

    if (paymentError) {
      return NextResponse.json({ error: 'Failed to verify payment state' }, { status: 500 });
    }

    if (!successfulPayment) {
      return NextResponse.json({ error: 'Verified payment required' }, { status: 403 });
    }

    // A code is returned only once. The database stores only its hash, so a
    // repeated request cannot mint or reveal another credential.
    const { data: existingCode, error: existingCodeError } = await db
      .from('access_codes')
      .select('id')
      .eq('subscription_id', subscription.id)
      .is('revoked_at', null)
      .maybeSingle();

    if (existingCodeError) {
      return NextResponse.json({ error: 'Failed to check access-code state' }, { status: 500 });
    }

    if (existingCode) {
      return NextResponse.json({ error: 'Access code already issued' }, { status: 409 });
    }

    const accessCode = makeAccessCode();
    const codeHash = await hashAccessCode(accessCode);

    // Check if device exists
    const { data: existingDevice, error: deviceError } = await db
      .from('devices')
      .select('id, status')
      .eq('customer_id', customers.id)
      .limit(1);

    if (deviceError) {
      return NextResponse.json(
        { error: 'Failed to check device' },
        { status: 500 }
      );
    }

    let deviceId: string;

    if (existingDevice && existingDevice.length > 0) {
      if (existingDevice[0].status === 'AUTHORIZED') {
        return NextResponse.json(
          { error: 'Access code already issued for this customer device' },
          { status: 409 }
        );
      }

      deviceId = existingDevice[0].id;
      // Update device status to AUTHORIZED
      const { error: updateError } = await db
        .from('devices')
        .update({ status: 'AUTHORIZED', last_seen: new Date().toISOString() })
        .eq('id', deviceId);

      if (updateError) {
        console.error('[v0] Device update error:', updateError);
      }
    } else {
      // Create new device
      const { data: newDevice, error: createError } = await db
        .from('devices')
        .insert([
          {
            customer_id: customers.id,
            device_name: 'Primary Device',
            device_identifier: `device-${Date.now()}`,
            status: 'AUTHORIZED',
          },
        ])
        .select('id')
        .single();

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create device record' },
          { status: 500 }
        );
      }

      deviceId = newDevice.id;
    }

    const { error: accessCodeError } = await db.from('access_codes').insert({
      customer_id: customers.id,
      subscription_id: subscription.id,
      device_id: deviceId,
      code_hash: codeHash,
    });

    if (accessCodeError) {
      if (accessCodeError.code === '23505') {
        return NextResponse.json({ error: 'Access code already issued' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to persist access code' }, { status: 500 });
    }

    return NextResponse.json({
      accessCode,
      deviceId,
      customerId: customers.id,
      subscriptionId: subscription.id,
      expiresAt: subscription.expiry_date,
    });
  } catch (error) {
    console.error('[v0] Access code generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
