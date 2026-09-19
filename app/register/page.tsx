"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authErrorMessage, createClient } from "@/lib/supabase/client"
import { normalizePhoneNumber } from "@/lib/phone"

export default function Register() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError("")
    setMessage("")
    try {
      if (password !== confirmPassword) { setError("Passwords do not match."); return }
      const normalizedPhone = normalizePhoneNumber(phone)
      const { data, error: signUpError } = await createClient().auth.signUp({ phone: normalizedPhone, password, options: { data: { phone: normalizedPhone } } })
      if (signUpError) { setError(authErrorMessage(signUpError.message)); return }
      if (data.session) {
        const provisionResponse = await fetch("/api/customers/provision", { method: "POST" })
        if (!provisionResponse.ok) { setError("Account created, but we could not finish setting up your customer profile."); return }
        router.replace("/dashboard")
        router.refresh()
      } else {
        setMessage("Account created. Confirm your phone number with the verification code before signing in.")
      }
    } catch (caught) {
      setError(caught instanceof Error && caught.message.startsWith("Enter a valid") ? caught.message : "We could not connect to StillaCon. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  return <main className="grid min-h-screen place-items-center px-5 py-8"><div className="glass w-full max-w-md rounded-2xl p-7"><Link href="/" className="text-xs font-bold tracking-[.2em] text-primary">STILLA CONNECT</Link><h1 className="mt-8 text-2xl font-semibold">Create your account.</h1><p className="mt-2 text-sm text-muted-foreground">Sign up with your Ghanaian phone number.</p><form onSubmit={submit} className="mt-7 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium">Phone number<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:border-primary" placeholder="+233 24 123 4567" autoComplete="tel" /></label><label className="flex flex-col gap-2 text-xs font-medium">Password<span className="relative"><input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 pr-10 text-sm outline-none focus:border-primary" placeholder="At least 8 characters" autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label><label className="flex flex-col gap-2 text-xs font-medium">Confirm password<span className="relative"><input required minLength={8} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 pr-10 text-sm outline-none focus:border-primary" autoComplete="new-password" /><button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">{showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}{message && <p role="status" className="text-xs text-primary">{message}</p>}<Button type="submit" disabled={pending} className="mt-2 w-full">{pending ? "Creating account..." : "Create account"}</Button></form><p className="mt-6 text-center text-sm text-muted-foreground">Already registered? <Link href="/login" className="text-primary hover:underline">Sign in</Link></p></div></main>
}
