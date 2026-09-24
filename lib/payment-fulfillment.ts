import { createHash, randomBytes } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyPaystackTransaction } from "@/lib/paystack"

export async function fulfillPaystackPayment(reference: string) {
  const supabase = createAdminClient()
  const { data: existing } = await supabase.from("payments").select("id,status,customer_id,subscription_id,amount,currency,metadata").eq("provider", "PAYSTACK").eq("provider_reference", reference).maybeSingle()
  if (!existing) throw new Error("Payment reference was not initialized by StillaCon.")
  if (existing.status === "SUCCESS") return { paymentId: existing.id, subscriptionId: existing.subscription_id, alreadyFulfilled: true }

  const transaction = await verifyPaystackTransaction(reference)
  if (transaction.status !== "success" || transaction.currency !== "GHS" || transaction.amount !== Math.round(Number(existing.amount) * 100)) throw new Error("Paystack payment validation failed.")

  const metadata = (existing.metadata ?? {}) as Record<string, unknown>
  const planId = String(metadata.plan_id ?? "")
  const { data: plan } = await supabase.from("plans").select("id,duration_days").eq("id", planId).eq("active", true).eq("currency", "GHS").maybeSingle()
  if (!plan) throw new Error("Payment plan is no longer available.")

  let subscriptionId = existing.subscription_id as string
  if (!subscriptionId) throw new Error("Payment has no pending subscription.")
  const startsAt = new Date()
  const expiresAt = new Date(startsAt.getTime() + Number(plan.duration_days) * 86400000)
  const { error: subscriptionError } = await supabase.from("subscriptions").update({ status: "ACTIVE", start_date: startsAt.toISOString(), expiry_date: expiresAt.toISOString() }).eq("id", subscriptionId).eq("customer_id", existing.customer_id).neq("status", "ACTIVE")
  if (subscriptionError) throw new Error("Subscription activation failed.")

  const { data: device } = await supabase.from("devices").select("id").eq("customer_id", existing.customer_id).in("status", ["PENDING", "AUTHORIZED"]).order("created_at", { ascending: true }).limit(1).maybeSingle()
  if (device) {
    const { data: code } = await supabase.from("access_codes").select("id").eq("subscription_id", subscriptionId).maybeSingle()
    if (!code) {
      const plaintext = randomBytes(6).toString("hex").toUpperCase()
      await supabase.from("access_codes").insert({ customer_id: existing.customer_id, subscription_id: subscriptionId, device_id: device.id, code_hash: createHash("sha256").update(plaintext).digest("hex") })
    }
  }
  const { error: paymentError } = await supabase.from("payments").update({ status: "SUCCESS", paid_at: new Date().toISOString(), payment_method: "PAYSTACK", metadata: { ...metadata, paystack: transaction } }).eq("id", existing.id).neq("status", "SUCCESS")
  if (paymentError) throw new Error("Payment recording failed.")
  return { paymentId: existing.id, subscriptionId, alreadyFulfilled: false }
}
