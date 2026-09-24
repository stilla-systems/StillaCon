import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell, SectionTitle } from "@/components/stillacon-shell"

export default async function PaymentResult({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login?next=/dashboard/payments")
  const { payment } = await searchParams
  const success = payment === "success"
  return <AppShell><SectionTitle eyebrow="PAYMENT STATUS" title={success ? "Payment received." : "Payment not completed."} description={success ? "Your Paystack transaction was verified server-side. Subscription activation is now reflected in your account." : "No access was activated. You can safely return to plans and try again."} /><div className="glass max-w-xl rounded-2xl p-6"><p className="text-sm text-muted-foreground">{success ? "Thank you for choosing StillaCon. Your payment reference is being recorded against your customer account." : "A callback visit is never treated as proof of payment. Only a successful Paystack verification can activate access."}</p><div className="mt-6 flex gap-3"><Link href="/plans" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">View plans</Link><Link href="/dashboard" className="rounded-lg border border-border px-4 py-2 text-sm font-medium">Dashboard</Link></div></div></AppShell>
}
