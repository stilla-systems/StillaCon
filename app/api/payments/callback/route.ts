import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

function accessCode() {
  return `STC-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`
}

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference")
  if (!reference) return NextResponse.redirect(new URL("/plans?payment=missing", request.url))

  const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  })
  const payload = await verifyResponse.json().catch(() => null)
  const transaction = payload?.data
  if (!verifyResponse.ok || !payload?.status || transaction?.status !== "success") {
    return NextResponse.redirect(new URL(`/plans?payment=failed&reference=${encodeURIComponent(reference)}`, request.url))
  }

  const admin = createAdminClient()
  const { data: payment } = await admin.from("payments").select("id,customer_id,metadata,status,amount,currency").eq("provider", "PAYSTACK").eq("provider_reference", reference).maybeSingle()
  if (!payment) return NextResponse.redirect(new URL("/plans?payment=unmatched", request.url))
  if (payment.status === "SUCCESS") return NextResponse.redirect(new URL(`/dashboard?payment=success&reference=${encodeURIComponent(reference)}`, request.url))

  const metadata = (payment.metadata ?? {}) as { plan_id?: string }
  if (!metadata.plan_id || Number(transaction.amount) !== Math.round(Number(payment.amount) * 100) || transaction.currency !== payment.currency) {
    return NextResponse.redirect(new URL("/plans?payment=amount-mismatch", request.url))
  }

  const now = new Date()
  const { data: plan } = await admin.from("plans").select("duration_days").eq("id", metadata.plan_id).single()
  if (!plan) return NextResponse.redirect(new URL("/plans?payment=plan-missing", request.url))
  const expiry = new Date(now)
  expiry.setUTCDate(expiry.getUTCDate() + plan.duration_days)

  const { data: existing } = await admin.from("subscriptions").select("id").eq("customer_id", payment.customer_id).in("status", ["PENDING", "ACTIVE"]).order("created_at", { ascending: false }).limit(1).maybeSingle()
  let subscriptionId = existing?.id
  if (subscriptionId) {
    const { error } = await admin.from("subscriptions").update({ plan_id: metadata.plan_id, status: "ACTIVE", start_date: now.toISOString(), expiry_date: expiry.toISOString() }).eq("id", subscriptionId)
    if (error) return NextResponse.redirect(new URL("/plans?payment=activation-error", request.url))
  } else {
    const { data: created, error } = await admin.from("subscriptions").insert({ customer_id: payment.customer_id, plan_id: metadata.plan_id, status: "ACTIVE", start_date: now.toISOString(), expiry_date: expiry.toISOString() }).select("id").single()
    if (error || !created) return NextResponse.redirect(new URL("/plans?payment=activation-error", request.url))
    subscriptionId = created.id
  }

  const code = accessCode()
  await admin.from("devices").insert({ customer_id: payment.customer_id, device_name: "StillaCon access device", device_identifier: code, status: "PENDING" })
  await admin.from("payments").update({ status: "SUCCESS", subscription_id: subscriptionId, paid_at: now.toISOString(), metadata: { ...metadata, paystack_transaction_id: transaction.id, access_code: code } }).eq("id", payment.id)
  await admin.from("customers").update({ status: "ACTIVE" }).eq("id", payment.customer_id)

  return NextResponse.redirect(new URL(`/dashboard?payment=success&access_code=${encodeURIComponent(code)}`, request.url))
}
