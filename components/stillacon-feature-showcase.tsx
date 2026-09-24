"use client"

import { useEffect, useRef, useState, type TouchEvent } from "react"
import { CalendarDays, Gauge, KeyRound, LockKeyhole, Network, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  { number: "01", title: "Made for real life", description: "From work calls to family streaming, get a connection designed around your day.", icon: Network },
  { number: "02", title: "Reliable by design", description: "Managed connectivity with transparent plans and support when you need it.", icon: ShieldCheck },
  { number: "03", title: "Simple access", description: "Choose your plan, pay securely and manage your connection from one place.", icon: KeyRound },
  { number: "04", title: "High-speed performance", description: "Up to 125 Mbps for browsing, work, streaming and everyday digital life.", icon: Gauge },
  { number: "05", title: "Secure by design", description: "Your account, devices and access stay organized in one secure experience.", icon: LockKeyhole },
  { number: "06", title: "Flexible plans", description: "Choose 24-hour, weekly or monthly access based on your needs.", icon: CalendarDays },
]

export function StillaconFeatureShowcase() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStart = useRef<number | null>(null)

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => setActive((current) => (current + 1) % features.length), 4500)
    return () => window.clearInterval(timer)
  }, [paused, active])

  function choose(index: number) {
    setActive(index)
    setPaused(true)
    window.setTimeout(() => setPaused(false), 4500)
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStart.current = event.touches[0]?.clientX ?? null
    setPaused(true)
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStart.current === null) return
    const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current
    if (Math.abs(delta) > 40) choose((active + (delta < 0 ? 1 : features.length - 1)) % features.length)
    else setPaused(false)
    touchStart.current = null
  }

  const feature = features[active]
  const Icon = feature.icon

  return <div className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-roledescription="carousel" aria-label="StillaCon features">
    <div className="flex items-center justify-between text-[10px] font-bold tracking-[.2em] text-primary"><span>STILLACON</span><span>{feature.number} / 06</span></div>
    <div className="relative mt-10 min-h-[190px] sm:min-h-[170px]" aria-live="polite">
      <div key={feature.number} className="animate-feature-in">
        <div className="grid size-16 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_32px_rgba(39,182,246,.16)]"><Icon className="size-8" aria-hidden="true" /></div>
        <h2 className="mt-7 text-2xl font-semibold tracking-[-.04em] text-balance sm:text-3xl">{feature.title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{feature.description}</p>
      </div>
    </div>
    <div className="mt-8 flex items-center gap-2" role="tablist" aria-label="Choose a feature">
      {features.map((item, index) => <button key={item.number} type="button" role="tab" aria-selected={index === active} aria-label={`Show feature ${item.number}: ${item.title}`} onClick={() => choose(index)} className={cn("h-2 rounded-full bg-primary/20 transition-[width,background-color]", index === active ? "w-10 bg-primary" : "w-2 hover:bg-primary/60")}><span className="sr-only">{item.title}</span></button>)}
    </div>
  </div>
}
