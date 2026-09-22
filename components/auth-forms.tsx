"use client"

import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "")
  const normalized = digits.startsWith("233") ? digits : digits.startsWith("0") ? `233${digits.slice(1)}` : `233${digits}`
  return `+${normalized}`
}

const inputClass = "h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:border-primary"

export function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)
    const phone = normalizePhone(form.phone)
    if (!/^\+233\d{9}$/.test(phone)) {
      setLoading(false)
      setError("Enter a valid Ghanaian phone number, such as 0241234567.")
      return
    }
    if (form.password !== form.confirmPassword) {
      setLoading(false)
      setError("Passwords do not match.")
      return
    }
    const metadata = form.fullName.trim() ? { full_name: form.fullName.trim() } : undefined
    const { data, error: signupError } = await createClient().auth.signUp({
      phone,
      password: form.password,
      options: metadata ? { data: metadata } : undefined,
    })
    setLoading(false)
    if (signupError) {
      console.error("[v0] Supabase registration failed", { operation: "auth.signUp", message: signupError.message, code: signupError.code, status: signupError.status })
      const normalizedMessage = signupError.message.toLowerCase()
      if (normalizedMessage.includes("already") || normalizedMessage.includes("exists") || signupError.code === "user_already_exists") {
        setError("This phone number is already registered. Please sign in.")
      } else if (signupError.code === "phone_provider_disabled" || normalizedMessage.includes("phone signups are disabled")) {
        setError("Phone registration is disabled in Supabase. Enable the Phone provider and configure an SMS provider before registering.")
      } else if (signupError.code === "sms_provider_not_configured" || normalizedMessage.includes("sms provider")) {
        setError("Phone registration needs an SMS provider in Supabase before verification codes can be sent.")
      } else if (normalizedMessage.includes("phone") && (normalizedMessage.includes("disabled") || normalizedMessage.includes("not enabled"))) {
        setError("Phone registration is disabled in Supabase. Enable the Phone provider before registering.")
      } else if (normalizedMessage.includes("confirm") || normalizedMessage.includes("sms") || normalizedMessage.includes("verification")) {
        setError("Check your phone for the verification code.")
      } else if (normalizedMessage.includes("invalid") || normalizedMessage.includes("phone")) {
        setError("Enter a valid Ghanaian phone number.")
      } else {
        setError("We couldn't create your account right now. Please try again.")
      }
      return
    }
    if (data.session) {
      router.push("/dashboard")
      return
    }
    setMessage("Account created. Check your phone for the verification code, then sign in.")
  }

  return <main className="grid min-h-screen place-items-center px-5"><div className="glass w-full max-w-md rounded-2xl p-7"><Link href="/" className="text-xs font-bold tracking-[.2em] text-primary">STILLA CONNECT</Link><h1 className="mt-8 text-2xl font-semibold">Create your account.</h1><p className="mt-2 text-sm text-muted-foreground">Get started with managed community Internet.</p><form onSubmit={submit} className="mt-7 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium">Full name <span className="font-normal text-muted-foreground">(optional)</span><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} placeholder="Kwame Mensah" /></label><label className="flex flex-col gap-2 text-xs font-medium">Phone number<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+233 24 000 0000" /></label><label className="flex flex-col gap-2 text-xs font-medium">Email <span className="font-normal text-muted-foreground">(optional)</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="you@example.com" /></label><label className="flex flex-col gap-2 text-xs font-medium">Password<span className="relative"><input required minLength={8} type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${inputClass} w-full pr-10`} placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground"><span aria-hidden="true">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</span></button></span></label><label className="flex flex-col gap-2 text-xs font-medium">Confirm password<span className="relative"><input required minLength={8} type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={`${inputClass} w-full pr-10`} placeholder="Re-enter your password" /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground"><span aria-hidden="true">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</span></button></span></label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}{message && <p role="status" className="text-xs text-primary">{message}</p>}<button disabled={loading} className="mt-2 h-10 rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">{loading ? "Creating account…" : "Create account"}</button></form><p className="mt-6 text-center text-xs text-muted-foreground">Already registered? <Link href="/login" className="text-primary">Sign in</Link></p></div></main>
}

export function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)
    const value = identifier.includes("@") ? { email: identifier.trim() } : { phone: normalizePhone(identifier) }
    const { error: loginError } = await createClient().auth.signInWithPassword({ ...value, password })
    setLoading(false)
    if (loginError) {
      console.error("[v0] Supabase login failed", { operation: "auth.signInWithPassword", message: loginError.message, code: loginError.code, status: loginError.status })
      setError("Invalid phone/email or password.")
      return
    }
    router.push("/dashboard")
  }

  return <main className="grid min-h-screen place-items-center px-5"><div className="w-full max-w-md"><Link href="/" className="mb-10 block text-sm font-bold tracking-[.2em] text-primary">STILLA CONNECT</Link><div className="glass rounded-2xl p-7"><p className="text-[10px] font-bold tracking-[.2em] text-primary">CUSTOMER ACCESS</p><h1 className="mt-3 text-2xl font-semibold">Welcome back.</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to manage your connection.</p><form onSubmit={submit} className="mt-7 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium">Email or phone<input required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={inputClass} placeholder="you@example.com or +233..." /></label><label className="flex flex-col gap-2 text-xs font-medium">Password<span className="relative"><input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} w-full pr-10`} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground"><span aria-hidden="true">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</span></button></span></label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<button disabled={loading} className="mt-2 h-10 rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button></form><p className="mt-6 text-center text-xs text-muted-foreground">New to StillaCon? <Link href="/register" className="text-primary">Create an account</Link></p></div></div></main>
}
