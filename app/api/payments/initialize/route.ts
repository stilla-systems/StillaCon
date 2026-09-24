import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { initializePaystackTransaction, makePaymentReference } from "@/lib/paystack"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 })
    const body = await request.json().catch(() => null)
    const planId = typeof body?.planId === "string" ? body.planId : ""
    const email = typeof body?.billingEmail === "string" ? body.billingEmail.trim().toLowerCase() : ""
    if (!planId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "A valid billing email and plan are required." }, { status: 400 })
    const admin = createAdminClient()
    const [{ data: customer }, { data: plan }] = await Promise.all([
      admin.from("customers").select("id,email").eq("user_id", user.id).maybeSingle(),
      admin.from("plans").select("id,name,price,currency,duration_days").eq("id", planId).eq("active", true).eq("currency", "GHS").maybeSingle(),
    ])
    if (!customer || !plan) return NextResponse.json({ error: "Customer or plan was not found." }, { status: 404 })
    if (customer.email !== email) { const { error } = await admin.from("customers").update({ email }).eq("id", customer.id); if (error) return NextResponse.json({ error: "Billing email could not be saved." }, { status: 500 }) }
    const reference = makePaymentReference()
    const { data: subscription, error: subscriptionError } = await admin.from("subscriptions").insert({ customer_id: customer.id, plan_id: plan.id, status: "PENDING" }).select("id").single()
    if (subscriptionError || !subscription) return NextResponse.json({ error: "Payment could not be prepared." }, { status: 500 })
    const { error: paymentError } = await admin.from("payments").insert({ customer_id: customer.id, subscription_id: subscription.id, provider: "PAYSTACK", provider_reference: reference, amount: plan.price, currency: "GHS", status: "PENDING", metadata: { plan_id: plan.id, plan_name: plan.name, duration_days: plan.duration_days } })
    if (paymentError) return NextResponse.json({ error: "Payment could not be prepared." }, { status: 500 })
    const checkout = await initializePaystackTransaction({ email, amountMinor: Math.round(Number(plan.price) * 100), reference, metadata: { customer_id: customer.id, subscription_id: subscription.id, plan_id: plan.id } })
    return NextResponse.json({ authorizationUrl: checkout.authorization_url, reference: checkout.reference })
  } catch (error) { console.error("[v0] Paystack initialization failed", error instanceof Error ? error.message : "unknown"); return NextResponse.json({ error: "Payment service is temporarily unavailable." }, { status: 503 }) }
}
