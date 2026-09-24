import { cn } from "@/lib/utils"

type AnimatedWifiProps = {
  size?: number
  className?: string
  label?: string
  signalStrength?: number
}

export function AnimatedWifi({ size = 56, className, label = "Wi-Fi signal", signalStrength = 4 }: AnimatedWifiProps) {
  return (
    <span
      role="img"
      aria-label={label}
      data-signal-strength={signalStrength}
      className={cn("animated-wifi inline-flex shrink-0 text-primary", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 32 32" className="size-full overflow-visible" fill="none">
        <path className="animated-wifi__arc animated-wifi__arc--outer" d="M4.5 12.5C10.86 6.16 21.14 6.16 27.5 12.5" />
        <path className="animated-wifi__arc animated-wifi__arc--middle" d="M8.75 16.75C12.75 12.76 19.25 12.76 23.25 16.75" />
        <path className="animated-wifi__arc animated-wifi__arc--inner" d="M12.85 20.85C14.59 19.12 17.41 19.12 19.15 20.85" />
        <circle className="animated-wifi__dot" cx="16" cy="25.25" r="1.65" />
      </svg>
    </span>
  )
}
