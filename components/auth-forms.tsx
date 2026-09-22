"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("233")) return `+${digits}`
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`
  return `+233${digits}`
}

const inputClass = "h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:border-primary"

export function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)
    const phone = normalizePhone(form.phone)
    const { error: signupError } = await createClient().auth.signUp({
      phone,
      password: form.password,
      options: { data: { full_name: form.fullName, email: form.email || null } },
    })
    setLoading(false)
    if (signupError) {
      setError(signupError.message.toLowerCase().includes("already") ? "An account already exists for this phone number." : "We could not create your account. Check your details and try again.")
      return
    }
    setMessage("Account created. Check your phone for the verification code.")
    router.push("/login")
  }

  return <main className="grid min-h-screen place-items-center px-5"><div className="glass w-full max-w-md rounded-2xl p-7"><Link href="/" className="text-xs font-bold tracking-[.2em] text-primary">STILLA CONNECT</Link><h1 className="mt-8 text-2xl font-semibold">Create your account.</h1><p className="mt-2 text-sm text-muted-foreground">Get started with managed community Internet.</p><form onSubmit={submit} className="mt-7 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium">Full name<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} placeholder="Kwame Mensah" /></label><label className="flex flex-col gap-2 text-xs font-medium">Phone number<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+233 24 000 0000" /></label><label className="flex flex-col gap-2 text-xs font-medium">Email <span className="font-normal text-muted-foreground">(optional)</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="you@example.com" /></label><label className="flex flex-col gap-2 text-xs font-medium">Password<input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="At least 8 characters" /></label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}{message && <p role="status" className="text-xs text-primary">{message}</p>}<button disabled={loading} className="mt-2 h-10 rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">{loading ? "Creating account…" : "Create account"}</button></form><p className="mt-6 text-center text-xs text-muted-foreground">Already registered? <Link href="/login" className="text-primary">Sign in</Link></p></div></main>
}

export function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
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
      setError("Invalid phone/email or password.")
      return
    }
    router.push("/dashboard")
  }

  return <main className="grid min-h-screen place-items-center px-5"><div className="w-full max-w-md"><Link href="/" className="mb-10 block text-sm font-bold tracking-[.2em] text-primary">STILLA CONNECT</Link><div className="glass rounded-2xl p-7"><p className="text-[10px] font-bold tracking-[.2em] text-primary">CUSTOMER ACCESS</p><h1 className="mt-3 text-2xl font-semibold">Welcome back.</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to manage your connection.</p><form onSubmit={submit} className="mt-7 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium">Email or phone<input required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={inputClass} placeholder="you@example.com or +233..." /></label><label className="flex flex-col gap-2 text-xs font-medium">Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" /></label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<button disabled={loading} className="mt-2 h-10 rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button></form><p className="mt-6 text-center text-xs text-muted-foreground">New to StillaCon? <Link href="/register" className="text-primary">Create an account</Link></p></div></div></main>
}
