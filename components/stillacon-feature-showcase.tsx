"use client"

import { useEffect, useState } from "react"
import { Gauge, KeyRound, LockKeyhole, Network, ShieldCheck, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  { title: "Fast & Reliable", description: "Enjoy dependable high-speed internet powered by a professional connectivity infrastructure.", icon: Network },
  { title: "Unlimited Access", description: "Stay connected throughout your active plan without worrying about traditional data limits.", icon: Gauge },
  { title: "Simple Plans", description: "Choose a plan that fits your needs and activate your connection in just a few steps.", icon: SlidersHorizontal },
  { title: "Secure Access", description: "Your connection is protected with controlled access designed for registered StillaCon customers.", icon: ShieldCheck },
  { title: "Flexible Connectivity", description: "Connect from supported locations and stay online when you need reliable internet access.", icon: LockKeyhole },
  { title: "Easy Management", description: "Manage your plan, payments, connection status and access details from one simple dashboard.", icon: KeyRound },
]

export function StillaconFeatureShowcase() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % features.length), 3900)
    return () => window.clearInterval(timer)
  }, [])

  const feature = features[active]
  const Icon = feature.icon

  return (
    <section className="relative mt-10 overflow-hidden rounded-[2rem] py-2" aria-labelledby="feature-showcase-heading">
      <div className="feature-ambient pointer-events-none absolute left-1/2 top-[58%] -z-10 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="mb-7 max-w-2xl">
        <p className="text-[10px] font-bold tracking-[.22em] text-primary">BUILT FOR BETTER CONNECTIVITY</p>
        <h2 id="feature-showcase-heading" className="mt-3 text-2xl font-semibold tracking-[-.04em] text-balance md:text-3xl">Everything You Need to Stay Connected</h2>
      </div>
      <div className="relative mx-auto flex min-h-[320px] max-w-[680px] items-center justify-center" aria-live="polite">
        <article key={feature.title} className="feature-glass feature-vanish-card w-full rounded-[1.75rem] p-8 text-center sm:p-10">
          <div className="feature-icon mx-auto grid size-14 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_28px_rgba(39,182,246,.12)]">
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <h3 className="mt-7 text-2xl font-semibold tracking-[-.035em]">{feature.title}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">{feature.description}</p>
          <div className="mx-auto mt-8 flex items-center justify-center gap-1.5" aria-label={`Feature ${active + 1} of ${features.length}`}>
            {features.map((item, index) => <span key={item.title} className={cn("h-1 rounded-full transition-all duration-500", index === active ? "feature-progress-active w-7 bg-primary" : "w-1.5 bg-primary/20")} />)}
          </div>
        </article>
      </div>
      <p className="sr-only">Feature {active + 1} of {features.length}: {feature.title}</p>
    </section>
  )
}
