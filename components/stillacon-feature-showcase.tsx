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
    const timer = window.setInterval(() => setActive((current) => (current + 1) % features.length), 4200)
    return () => window.clearInterval(timer)
  }, [])

  const visible = [0, 1, 2].map((offset) => features[(active + offset) % features.length])

  return <section className="relative mt-10 overflow-hidden rounded-[2rem] py-2" aria-labelledby="feature-showcase-heading">
    <div className="feature-ambient pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full" />
    <div className="mb-7 max-w-2xl">
      <p className="text-[10px] font-bold tracking-[.22em] text-primary">BUILT FOR BETTER CONNECTIVITY</p>
      <h2 id="feature-showcase-heading" className="mt-3 text-2xl font-semibold tracking-[-.04em] text-balance md:text-3xl">Everything You Need to Stay Connected</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-3" aria-live="polite">
      {visible.map((feature, index) => {
        const Icon = feature.icon
        const isActive = index === 0
        return <article key={`${feature.title}-${active}`} className={cn("feature-glass group relative min-h-[218px] rounded-[1.5rem] p-6 transition-all duration-300 hover:-translate-y-1", isActive && "feature-glass-active")}>
          <div className="flex items-start justify-between">
            <div className="feature-icon grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:shadow-[0_0_28px_rgba(39,182,246,.2)]"><Icon className="size-5" aria-hidden="true" /></div>
            {isActive && <span className="feature-indicator mt-2 size-1.5 rounded-full bg-primary" aria-label="Active feature" />}
          </div>
          <h3 className="mt-7 text-lg font-semibold tracking-[-.025em]">{feature.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
        </article>
      })}
    </div>
    <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Feature showcase position">
      {features.map((feature, index) => <button key={feature.title} type="button" role="tab" aria-selected={index === active} aria-label={`Show ${feature.title}`} onClick={() => setActive(index)} className={cn("h-1.5 rounded-full bg-primary/20 transition-all duration-300", index === active ? "w-8 bg-primary" : "w-1.5 hover:bg-primary/60")}><span className="sr-only">{feature.title}</span></button>)}
    </div>
  </section>
}
