import { redirect } from "next/navigation"
import { CustomerDashboard, DashboardErrorState } from "@/components/customer-dashboard"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirect=/dashboard")

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, customer_number, full_name, email, phone")
    .eq("user_id", user.id)
    .maybeSingle()

  if (customerError || !customer) return <DashboardErrorState />

  const [{ data: subscriptions, error: subscriptionError }, { data: payments, error: paymentsError }, { data: devices, error: devicesError }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, status, start_date, expiry_date, plan_id")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("payments")
      .select("id, subscription_id, provider_reference, amount, currency, status, paid_at, created_at")
      .eq("customer_id", customer.id)
      .eq("provider", "paystack")
      .eq("status", "SUCCESS")
      .order("created_at", { ascending: false }),
    supabase
      .from("devices")
      .select("id, device_name, status, last_seen")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ])

  if (subscriptionError || paymentsError || devicesError) return <DashboardErrorState />

  const subscription = subscriptions?.[0] ?? null
  let subscriptionView = null
  let hasIssuedAccessCode = false

  if (subscription) {
    const [{ data: plan }, { data: accessCode }] = await Promise.all([
      supabase
        .from("plans")
        .select("name, price, currency, duration_days, speed_limit_mbps")
        .eq("id", subscription.plan_id)
        .maybeSingle(),
      supabase
        .from("access_codes")
        .select("id")
        .eq("subscription_id", subscription.id)
        .is("revoked_at", null)
        .maybeSingle(),
    ])

    if (plan) {
      subscriptionView = {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.start_date,
        expiryDate: subscription.expiry_date,
        plan: {
          name: plan.name,
          price: Number(plan.price),
          currency: plan.currency,
          durationDays: plan.duration_days,
          speedLimitMbps: plan.speed_limit_mbps,
        },
      }
    }
    hasIssuedAccessCode = Boolean(accessCode)
  }

  return (
    <CustomerDashboard
      data={{
        customer: {
          name: customer.full_name,
          email: customer.email ?? user.email ?? "",
          phone: customer.phone,
          customerNumber: customer.customer_number,
        },
        subscription: subscriptionView,
        payments: (payments ?? []).map((payment) => ({
          id: payment.id,
          subscriptionId: payment.subscription_id,
          reference: payment.provider_reference ?? "Paystack payment",
          amount: Number(payment.amount),
          currency: payment.currency,
          status: payment.status,
          paidAt: payment.paid_at,
          createdAt: payment.created_at,
        })),
        devices: (devices ?? []).map((device) => ({
          id: device.id,
          name: device.device_name,
          status: device.status,
          lastSeen: device.last_seen,
        })),
        hasIssuedAccessCode,
      }}
    />
  )
}
