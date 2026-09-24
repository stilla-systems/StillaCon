import { Check } from "lucide-react"
import { PublicHeader, SectionTitle } from "@/components/stillacon-shell"
import { PaystackCheckout } from "@/components/paystack-checkout"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export default async function Plans() {
  const { data: plans } = await createAdminClient().from("plans").select("id,name,price,currency,duration_days,description,speed_limit_mbps").eq("active", true).eq("currency", "GHS").order("duration_days")
  return <main className="min-h-screen"><PublicHeader /><div className="mx-auto max-w-6xl px-5 py-16 lg:px-8"><SectionTitle eyebrow="SIMPLE, TRANSPARENT ACCESS" title="Choose your connection." description="One-time payment. Server-verified access for the duration you choose." /><div className="grid gap-4 md:grid-cols-3">{(plans ?? []).map((item, index) => <div key={item.id} className={`glass rounded-2xl p-6 ${index === 2 ? "border-primary/40 shadow-[0_0_40px_rgba(39,182,246,.1)]" : ""}`}><div className="flex items-center justify-between"><span className="text-xs font-semibold">{item.name}</span>{index === 2 && <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold tracking-widest text-primary">BEST VALUE</span>}</div><p className="mt-8 text-4xl font-semibold">GHS {Number(item.price).toFixed(2)}</p><p className="mt-1 text-xs text-muted-foreground">{item.duration_days} day{item.duration_days === 1 ? "" : "s"}{item.speed_limit_mbps ? ` · ${item.speed_limit_mbps} Mbps` : ""}</p><p className="mt-5 text-sm leading-6 text-muted-foreground">{item.description || "Reliable managed access with a clear, simple experience."}</p><ul className="mt-7 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground"><li className="flex gap-2"><Check className="size-4 text-primary" />Secure customer dashboard</li><li className="flex gap-2"><Check className="size-4 text-primary" />Paystack checkout</li><li className="flex gap-2"><Check className="size-4 text-primary" />Server-verified activation</li></ul><PaystackCheckout planId={item.id} price={`GHS ${Number(item.price).toFixed(2)}`} /></div>)}</div></div></main>
}
