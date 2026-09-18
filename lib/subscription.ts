import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Plan, Subscription } from '@/lib/domain';

export interface SubscriptionData {
  customerId: string;
  planId: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  startDate: Date;
  expiryDate: Date;
}

export async function createSubscription(data: SubscriptionData): Promise<Subscription> {
  const supabase = createAdminClient();

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert([
      {
        customer_id: data.customerId,
        plan_id: data.planId,
        status: data.status,
        start_date: data.startDate.toISOString(),
        expiry_date: data.expiryDate.toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }

  return {
    id: subscription.id,
    customerId: subscription.customer_id,
    planId: subscription.plan_id,
    status: subscription.status as Subscription['status'],
    startsAt: subscription.start_date,
    expiresAt: subscription.expiry_date,
    createdAt: subscription.created_at,
    updatedAt: subscription.updated_at,
  };
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: Subscription['status']
): Promise<Subscription> {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .update({ status })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  return {
    id: subscription.id,
    customerId: subscription.customer_id,
    planId: subscription.plan_id,
    status: subscription.status as Subscription['status'],
    startsAt: subscription.start_date,
    expiresAt: subscription.expiry_date,
    createdAt: subscription.created_at,
    updatedAt: subscription.updated_at,
  };
}

export async function getPlanById(planId: string): Promise<Plan> {
  const supabase = await createClient();

  const { data: plan, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch plan: ${error.message}`);
  }

  return {
    id: plan.id,
    name: plan.name,
    priceMinor: Math.round(plan.price * 100), // Convert GHS to minor units
    currency: 'GHS',
    speedMbps: plan.speed_limit_mbps || 0,
    durationDays: plan.duration_days,
    description: plan.description,
    active: plan.active,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  };
}

export async function getPlanByName(name: string): Promise<Plan> {
  const supabase = await createClient();

  const { data: plan, error } = await supabase
    .from('plans')
    .select('*')
    .eq('name', name)
    .single();

  if (error) {
    throw new Error(`Failed to fetch plan: ${error.message}`);
  }

  return {
    id: plan.id,
    name: plan.name,
    priceMinor: Math.round(plan.price * 100),
    currency: 'GHS',
    speedMbps: plan.speed_limit_mbps || 0,
    durationDays: plan.duration_days,
    description: plan.description,
    active: plan.active,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  };
}

export async function getActiveSubscription(customerId: string): Promise<Subscription | null> {
  const supabase = await createClient();

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'ACTIVE')
    .order('expiry_date', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }

  if (!subscriptions || subscriptions.length === 0) {
    return null;
  }

  const sub = subscriptions[0];
  return {
    id: sub.id,
    customerId: sub.customer_id,
    planId: sub.plan_id,
    status: sub.status as Subscription['status'],
    startsAt: sub.start_date,
    expiresAt: sub.expiry_date,
    createdAt: sub.created_at,
    updatedAt: sub.updated_at,
  };
}
