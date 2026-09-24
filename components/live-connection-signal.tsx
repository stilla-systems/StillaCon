"use client"

import { useEffect, useState } from "react"
import { AnimatedWifi } from "@/components/animated-wifi"

const speeds = [118, 121, 124, 127, 125, 122, 126, 129]

export function LiveConnectionSignal() {
  const [strength, setStrength] = useState(3)
  useEffect(() => {
    let index = 0
    const timer = window.setInterval(() => {
      index = (index + 1) % speeds.length
      const speed = speeds[index]
      setStrength(speed < 120 ? 3 : speed < 125 ? 3.5 : 4)
    }, 1800)
    return () => window.clearInterval(timer)
  }, [])
  return <AnimatedWifi size={64} signalStrength={strength} label="Live simulated Wi-Fi signal" />
}
