import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { PublicHeader, SectionTitle } from "@/components/stillacon-shell"
import { createAdminClient } from "@/lib/supabase/admin"
import { plans as fallbackPlans } from "@/lib/stillacon-data"

const planCopy: Record<string, { speed: string; label: string }> = {
  "24 Hours": { speed: "20 Mbps", label: "For quick access" },
  "1 Week": { speed: "20 Mbps", label: "For flexible routines" },
  "1 Month": { speed: "25 Mbps", label: "Best value" },
}

export default async function Plans() {
  const supabase = createAdminClient()
  const { data: livePlans } = await supabase
    .from("plans")
    .select("id, name, price, duration_days, active")
    .eq("active", true)
    .order("duration_days", { ascending: true })

  const plans = livePlans?.length
    ? livePlans.map((item) => ({
        ...item,
        priceLabel: `GHS ${Number(item.price).toFixed(2)}`,
        duration: `${item.duration_days} days`,
        ...(planCopy[item.name] ?? { speed: "Managed access", label: "Reliable community access" }),
      }))
    : fallbackPlans.map((item) => ({ ...item, priceLabel: item.price }))

  return <main className="min-h-screen"><PublicHeader /><div className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><SectionTitle eyebrow="SIMPLE, TRANSPARENT ACCESS" title="Choose your connection." description="Flexible plans for work, study, business and everything in between. Pricing is synced with the active StillaCon plans." /><div className="grid gap-4 md:grid-cols-3">{plans.map((item, i) => <div key={item.name} className={`glass rounded-2xl p-6 ${item.name === "1 Month" ? "border-primary/40 shadow-[0_0_40px_rgba(39,182,246,.1)]" : ""}`}><div className="flex items-center justify-between"><span className="text-xs font-semibold">{item.name}</span>{item.name === "1 Month" && <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold tracking-widest text-primary">BEST VALUE</span>}</div><p className="mt-8 text-4xl font-semibold">{item.priceLabel}</p><p className="mt-1 text-xs text-muted-foreground">{item.duration} · {item.speed}</p><p className="mt-5 text-sm leading-6 text-muted-foreground">{item.label}. Reliable managed access with a clear, simple experience.</p><ul className="mt-7 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground"><li className="flex gap-2"><Check className="size-4 text-primary" />Secure customer dashboard</li><li className="flex gap-2"><Check className="size-4 text-primary" />Mobile Money ready</li><li className="flex gap-2"><Check className="size-4 text-primary" />Local support</li></ul><Link href={`/connect?plan=${encodeURIComponent(item.name)}`} className="mt-8 flex h-9 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/80">Select plan <ArrowRight className="size-4" /></Link></div>)}</div></div></main>
}
