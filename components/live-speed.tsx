"use client"

import { useEffect, useState } from "react"

const speedSamples = [118, 121, 124, 127, 125, 122, 126, 129]

export function LiveSpeed() {
  const [speed, setSpeed] = useState(speedSamples[0])

  useEffect(() => {
    let targetIndex = 0
    let frame: number | undefined
    let target = speedSamples[0]
    let current = speedSamples[0]
    const changeTarget = () => {
      targetIndex = (targetIndex + 1) % speedSamples.length
      target = speedSamples[targetIndex]
    }
    const interval = window.setInterval(changeTarget, 1800)
    const tick = () => {
      current += (target - current) * 0.045
      if (Math.abs(target - current) < 0.08) current = target
      setSpeed(Math.round(current))
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => {
      window.clearInterval(interval)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return <span aria-label="Simulated connection speed">{speed} Mbps</span>
}

export function getSignalStrength(speed: number) {
  if (speed < 120) return 3
  if (speed < 125) return 3.5
  return 4
}
