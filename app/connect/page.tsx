"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { ArrowRight, LockKeyhole, Network, Loader2, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Connect() {
  const searchParams = useSearchParams()
  const planName = searchParams.get("plan") ?? "1 Month"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function startCheckout() {
    setLoading(true)
    setError("")
    const response = await fetch("/api/payments/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planName }) })
    const result = await response.json().catch(() => null)
    if (!response.ok) { setError(result?.error ?? "Unable to start checkout."); setLoading(false); return }
    window.location.assign(result.authorizationUrl)
  }

  return <main className="grid min-h-screen place-items-center px-5 py-10"><div className="w-full max-w-md"><div className="mb-10 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Network /></span><div><p className="text-sm font-bold tracking-[.2em]">STILLA</p><p className="text-[10px] tracking-[.28em] text-primary">CONNECT</p></div></div><div className="glass rounded-[2rem] p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.2em] text-primary">SECURE CHECKOUT</p><h1 className="mt-3 text-3xl font-semibold">Activate {planName}.</h1></div><div className="grid size-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300"><Wifi /></div></div><p className="mt-5 text-sm leading-6 text-muted-foreground">Sign in to continue to Paystack. Your subscription will activate automatically after the payment is verified.</p>{error && <p role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}<div className="mt-8 flex flex-col gap-3"><Button onClick={startCheckout} disabled={loading} className="h-11 justify-between rounded-xl">{loading ? <><Loader2 className="animate-spin" />Opening secure checkout</> : <>Continue to payment <ArrowRight /></>}</Button><Link href="/plans" className="flex h-11 items-center justify-center rounded-xl border border-border text-sm font-medium hover:bg-secondary">Choose another plan</Link></div><div className="mt-8 flex gap-3 rounded-xl border border-border bg-background/35 p-3 text-xs text-muted-foreground"><LockKeyhole className="size-4 shrink-0 text-primary" /><span>Payments are processed by Paystack. StillaCon never stores card or Mobile Money details.</span></div></div><p className="mt-6 text-center text-xs text-muted-foreground">Need help? <Link href="/support" className="text-primary">Contact support</Link></p></div></main>
}
