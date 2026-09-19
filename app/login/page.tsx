"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Network } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authErrorMessage, createClient } from "@/lib/supabase/client"
import { normalizePhoneNumber } from "@/lib/phone"

export default function Login() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError("")
    try {
      const normalizedPhone = normalizePhoneNumber(phone)
      const { error: signInError } = await createClient().auth.signInWithPassword({ phone: normalizedPhone, password })
      if (signInError) { setError(authErrorMessage(signInError.message)); return }
      const provisionResponse = await fetch("/api/customers/provision", { method: "POST" })
      if (!provisionResponse.ok) { setError("Your account is valid, but we could not finish setting up your customer profile."); return }
      router.replace("/dashboard")
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error && caught.message.startsWith("Enter a valid") ? caught.message : "We could not connect to StillaCon. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  return <main className="grid min-h-screen place-items-center px-5"><div className="w-full max-w-md"><Link href="/" className="mb-10 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Network /></span><span className="text-sm font-bold tracking-[.2em]">STILLA CONNECT</span></Link><div className="glass rounded-2xl p-7"><p className="text-[10px] font-bold tracking-[.2em] text-primary">CUSTOMER ACCESS</p><h1 className="mt-3 text-2xl font-semibold">Sign in.</h1><p className="mt-2 text-sm text-muted-foreground">Use your phone number and password.</p><form onSubmit={submit} className="mt-7 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium">Phone number<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:border-primary" placeholder="+233 24 123 4567" autoComplete="tel" /></label><label className="flex flex-col gap-2 text-xs font-medium">Password<span className="relative"><input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 pr-10 text-sm outline-none focus:border-primary" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<Button type="submit" disabled={pending} className="mt-2 w-full">{pending ? "Signing in..." : "Sign in"}</Button></form><p className="mt-6 text-center text-sm text-muted-foreground">New to StillaCon? <Link href="/register" className="text-primary hover:underline">Create an account</Link></p></div></div></main>
}
