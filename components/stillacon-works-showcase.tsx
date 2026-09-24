"use client"

import { useEffect, useState } from "react"
import { CreditCard, Globe2, LayoutGrid, Wifi } from "lucide-react"

const steps = [
  { number: "01", title: "Choose Your Plan", description: "Select the connection period that works for you — whether you need StillaCon for a day, a week, or the full month.", label: "Simple plans. No unnecessary complexity.", icon: LayoutGrid },
  { number: "02", title: "Pay Securely", description: "Complete your payment through the available StillaCon payment experience and receive confirmation instantly.", label: "Fast. Secure. Convenient.", icon: CreditCard },
  { number: "03", title: "Activate Your Access", description: "Once your payment is confirmed, your StillaCon access details become available so you can connect your supported device.", label: "Activate and connect.", icon: Wifi },
  { number: "04", title: "Stay Connected", description: "Connect within supported StillaCon coverage and manage your plan, connection status, payments and access details from your account.", label: "Your connection. Your dashboard.", icon: Globe2 },
]

export function StillaconWorksShowcase() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % steps.length), 3600)
    return () => window.clearInterval(timer)
  }, [])
  const step = steps[active]
  const Icon = step.icon
  return (
    <section className="relative mt-10 overflow-hidden rounded-[2rem] py-2" aria-labelledby="works-heading">
      <div className="feature-ambient pointer-events-none absolute left-1/2 top-[58%] -z-10 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="mb-7 max-w-2xl"><p className="text-[10px] font-bold tracking-[.22em] text-primary">HOW STILLACon WORKS</p><h2 id="works-heading" className="mt-3 text-2xl font-semibold tracking-[-.04em] text-balance md:text-3xl">Get Connected in Just a Few Simple Steps</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Choose your plan, complete your payment, activate your access, and enjoy reliable connectivity through StillaCon.</p></div>
      <div className="relative mx-auto flex min-h-[330px] max-w-[650px] items-center justify-center" aria-live="polite">
        <article key={step.number} className="feature-glass feature-vanish-card w-full rounded-[1.75rem] p-8 text-center sm:p-10"><div className="mb-5 text-[10px] font-bold tracking-[.22em] text-primary">STEP {step.number}</div><div className="feature-icon mx-auto grid size-14 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_28px_rgba(39,182,246,.12)]"><Icon className="size-6" aria-hidden="true" /></div><h3 className="mt-6 text-2xl font-semibold tracking-[-.035em]">{step.title}</h3><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">{step.description}</p><p className="mt-6 text-xs font-medium text-primary/80">{step.label}</p></article>
      </div>
      <div className="mt-6 flex justify-center gap-2" aria-label={`Step ${active + 1} of ${steps.length}`}>{steps.map((item, index) => <span key={item.number} className={`h-1 rounded-full transition-all duration-700 ${index === active ? "feature-progress-active w-8 bg-primary" : "w-1.5 bg-primary/20"}`} />)}</div>
    </section>
  )
}
