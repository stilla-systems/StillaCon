"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarDays, Check, Copy, CreditCard, KeyRound, LogOut, MonitorSmartphone, RefreshCw, ShieldCheck, Smartphone, Wifi, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { AppShell, SectionTitle, StatusBadge } from "@/components/stillacon-shell"

type DashboardData = {
  customer: { name: string; email: string; phone: string; customerNumber: string }
  subscription: null | { id: string; status: string; startDate: string | null; expiryDate: string | null; plan: { name: string; price: number; currency: string; durationDays: number; speedLimitMbps: number | null } }
  payments: Array<{ id: string; subscriptionId: string | null; reference: string; amount: number; currency: string; status: string; paidAt: string | null; createdAt: string }>
  devices: Array<{ id: string; name: string; status: string; lastSeen: string | null }>
  hasIssuedAccessCode: boolean
}

function formatDate(value: string | null) {
  if (!value) return "Not started"
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(value))
}

function formatMoney(amount: number, currency = "GHS") {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
}

function daysRemaining(expiryDate: string | null) {
  if (!expiryDate) return 0
  return Math.max(0, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000))
}

export function CustomerDashboard({ data }: { data: DashboardData }) {
  const [accessCode, setAccessCode] = useState<string | null>(null)
  const [codeState, setCodeState] = useState<"idle" | "loading" | "error">("idle")
  const [copied, setCopied] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const active = data.subscription?.status === "ACTIVE" && daysRemaining(data.subscription.expiryDate) > 0
  const hasVerifiedPayment = Boolean(data.subscription?.id && data.payments.some((payment) => payment.status === "SUCCESS" && payment.subscriptionId === data.subscription?.id))
  const device = data.devices[0]
  const accessState = active && hasVerifiedPayment ? (device?.status === "AUTHORIZED" ? "ACTIVE" : "PENDING DEVICE") : data.subscription?.status === "EXPIRED" || (data.subscription && daysRemaining(data.subscription.expiryDate) === 0) ? "EXPIRED" : "NOT ACTIVE"

  async function requestAccessCode() {
    setCodeState("loading")
    const response = await fetch("/api/devices/access-code", { method: "POST" })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      setCodeState("error")
      return
    }
    setAccessCode(result.accessCode ?? null)
    setCodeState(result.accessCode ? "idle" : "error")
  }

  async function copyCode() {
    if (!accessCode) return
    await navigator.clipboard.writeText(accessCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function logout() {
    setLoggingOut(true)
    await createClient().auth.signOut()
    window.location.assign("/login")
  }

  return (
    <AppShell>
      <SectionTitle
        eyebrow="CUSTOMER DASHBOARD"
        title={`Welcome back, ${data.customer.name.split(" ")[0]}.`}
        description="Manage your StillaCon connection, subscription and secure device access from one place."
        action={<Button variant="outline" onClick={logout} disabled={loggingOut}><LogOut data-icon="inline-start" />{loggingOut ? "Signing out…" : "Sign out"}</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr_1fr]">
        <section className="glass rounded-2xl p-6 lg:p-7" aria-labelledby="access-heading">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[.18em] text-primary">INTERNET ACCESS</p>
              <h2 id="access-heading" className="mt-3 text-2xl font-semibold">{accessState === "ACTIVE" ? "Your connection is active" : accessState === "EXPIRED" ? "Your access has expired" : "Access is not active"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{active ? "Verified StillaCon service for your authorized device." : "Complete payment or renew your plan to restore access."}</p>
            </div>
            <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${accessState === "ACTIVE" ? "bg-emerald-400/10 text-emerald-300" : "bg-secondary text-muted-foreground"}`}><Wifi /></div>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3"><StatusBadge status={accessState} />{device && <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Smartphone className="size-4" />{device.name}</span>}</div>
          {active && hasVerifiedPayment && !accessCode && !data.hasIssuedAccessCode && <Button className="mt-6" onClick={requestAccessCode} disabled={codeState === "loading"}><KeyRound data-icon="inline-start" />{codeState === "loading" ? "Preparing secure code…" : "Prepare device access code"}</Button>}
          {data.hasIssuedAccessCode && !accessCode && <div className="mt-6 rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground"><ShieldCheck className="mb-2 size-5 text-primary" /><p>Your access code was already issued. For security, it cannot be displayed again.</p></div>}
          {accessCode && <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4"><p className="text-[10px] font-bold tracking-[.18em] text-primary">ONE-DEVICE ACCESS CODE</p><div className="mt-3 flex items-center justify-between gap-3"><code className="text-xl font-semibold tracking-[.2em] text-foreground">{accessCode}</code><Button size="icon" variant="outline" aria-label="Copy access code" onClick={copyCode}>{copied ? <Check /> : <Copy />}</Button></div><p className="mt-3 text-xs text-muted-foreground">Keep this code private. It is shown once and is bound to your authorized device.</p></div>}
          {codeState === "error" && <p className="mt-3 text-sm text-destructive">A secure access code is unavailable until your verified payment and active subscription are confirmed.</p>}
        </section>

        <section className="glass rounded-2xl p-6"><div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-[.18em] text-primary">SUBSCRIPTION</p><StatusBadge status={data.subscription?.status ?? "NOT ACTIVE"} /></div><h2 className="mt-5 text-2xl font-semibold">{data.subscription?.plan.name ?? "No active plan"}</h2><p className="mt-1 text-sm text-muted-foreground">{data.subscription ? `${formatMoney(data.subscription.plan.price, data.subscription.plan.currency)} · ${data.subscription.plan.durationDays} days` : "Choose a plan to get connected."}</p><div className="mt-7 flex items-center gap-3 border-t border-border pt-4"><CalendarDays className="size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Expiry date</p><p className="mt-1 text-sm font-medium">{formatDate(data.subscription?.expiryDate ?? null)}</p></div></div><p className="mt-4 text-sm text-muted-foreground">{active ? `${daysRemaining(data.subscription?.expiryDate ?? null)} days remaining` : "Renew to restore internet access."}</p><Link href="/plans" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"><RefreshCw className="size-4" />{active ? "Renew subscription" : "Choose a plan"}</Link></section>

        <section className="glass rounded-2xl p-6"><p className="text-[10px] font-bold tracking-[.18em] text-primary">ACCOUNT</p><h2 className="mt-5 text-xl font-semibold">{data.customer.name}</h2><p className="mt-1 break-all text-sm text-muted-foreground">{data.customer.email}</p><div className="mt-7 flex items-center gap-3 border-t border-border pt-4"><MonitorSmartphone className="size-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Customer number</p><p className="mt-1 text-sm font-medium">{data.customer.customerNumber}</p></div></div><p className="mt-4 text-xs text-muted-foreground">{data.customer.phone}</p></section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="glass rounded-2xl p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.18em] text-primary">PAYMENT HISTORY</p><h2 className="mt-2 text-xl font-semibold">Successful payments</h2></div><CreditCard className="size-5 text-muted-foreground" /></div>{data.payments.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No successful payments yet. Your payment history will appear here after verification.</div> : <div className="mt-5 flex flex-col gap-3">{data.payments.map((payment) => <div key={payment.id} className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{payment.reference}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(payment.paidAt ?? payment.createdAt)} · Paystack</p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><p className="text-sm font-semibold">{formatMoney(payment.amount, payment.currency)}</p><StatusBadge status={payment.status} /></div></div>)}</div>}</section>
        <section className="glass rounded-2xl p-6"><p className="text-[10px] font-bold tracking-[.18em] text-primary">DEVICE</p><h2 className="mt-2 text-xl font-semibold">Authorized device</h2>{device ? <div className="mt-6 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-secondary"><Smartphone className="size-4 text-primary" /></div><div><p className="text-sm font-medium">{device.name}</p><p className="mt-1 text-xs text-muted-foreground">Last seen {formatDate(device.lastSeen)}</p></div></div><StatusBadge status={device.status} /></div> : <div className="mt-6 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No device is authorized yet. Complete a verified payment to prepare one-device access.</div>}</section>
      </div>
    </AppShell>
  )
}

export function DashboardErrorState() { return <div className="mx-auto max-w-xl p-8 text-center"><X className="mx-auto size-10 text-destructive" /><h1 className="mt-4 text-2xl font-semibold">Dashboard unavailable</h1><p className="mt-2 text-sm text-muted-foreground">We could not load your customer data. Please try again.</p><Link href="/" className="mt-6 inline-flex text-sm text-primary">Return home</Link></div> }
