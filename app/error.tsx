"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error("[v0] StillaCon route error", error) }, [error]); return <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center"><p className="text-[10px] font-bold tracking-[.22em] text-primary">STILLACON</p><h1 className="mt-4 text-3xl font-semibold">We could not load this view.</h1><p className="mt-3 text-sm text-muted-foreground">Please try again. Your account and connection data remain protected.</p><Button className="mt-6" onClick={() => reset()}>Try again</Button></main> }
