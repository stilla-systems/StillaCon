"use client"

import { useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PaystackCheckout({ planId, price, email }: { planId: string; price: string; email?: string | null }) {
  const [billingEmail, setBillingEmail] = useState(email ?? "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  async function startPayment() {
    setError(""); setLoading(true)
    try { const response = await fetch("/api/payments/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, billingEmail }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Payment could not be started."); window.location.assign(body.authorizationUrl) }
    catch (paymentError) { setError(paymentError instanceof Error ? paymentError.message : "Payment could not be started."); setLoading(false) }
  }
  return <div className="mt-6 border-t border-border pt-5"><label className="block text-xs font-medium" htmlFor={`billing-email-${planId}`}>Billing email</label><input id={`billing-email-${planId}`} type="email" value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-2 h-10 w-full rounded-lg border border-border bg-background/60 px-3 text-sm outline-none ring-primary/30 focus:ring-2" required /><p className="mt-2 text-[11px] text-muted-foreground">Used for this Paystack receipt. It does not change your phone login.</p>{error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}<Button type="button" className="mt-4 w-full" onClick={startPayment} disabled={loading || !billingEmail.trim()}>{loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ArrowRight data-icon="inline-start" />} {loading ? "Preparing secure checkout…" : `Pay ${price}`}</Button></div>
}
