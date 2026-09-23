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

export function maskPhone(phone: string) {
  return phone.length > 6 ? `${phone.slice(0, 5)}••••${phone.slice(-2)}` : phone
}

const inputClass = "h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:border-primary"

function authError(message: string, code?: string) {
  const normalized = message.toLowerCase()
  if (code === "phone_provider_disabled" || normalized.includes("phone signups are disabled")) return "Phone registration is disabled in Supabase."
  if (code === "sms_provider_not_configured" || normalized.includes("sms provider")) return "Phone verification needs an SMS provider in Supabase."
  if (normalized.includes("already") || normalized.includes("exists")) return "This phone number is already registered. Please sign in."
  if (normalized.includes("invalid") || normalized.includes("phone")) return "Enter a valid Ghanaian phone number."
  if (normalized.includes("password") && normalized.includes("weak")) return "Choose a stronger password with at least 8 characters."
  return "We couldn't complete that request. Please try again."
}

function PasswordField({ label, value, onChange, visible, onToggle, autoComplete }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; autoComplete: string }) {
  return <label className="flex flex-col gap-2 text-xs font-medium">{label}<span className="relative"><input required minLength={8} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} w-full pr-10`} autoComplete={autoComplete} placeholder="At least 8 characters" /><button type="button" onClick={onToggle} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground"><span aria-hidden="true">{visible ? <EyeOff size={16} /> : <Eye size={16} />}</span></button></span></label>
}

export function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: "", phone: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("")
    const phone = normalizePhone(form.phone)
    if (!/^\+233\d{9}$/.test(phone)) return setError("Enter a valid Ghanaian phone number, such as 0241234567.")
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.")
    setLoading(true)
    const metadata = form.fullName.trim() ? { full_name: form.fullName.trim() } : undefined
    const { data, error: signupError } = await createClient().auth.signUp({ phone, password: form.password, options: metadata ? { data: metadata } : undefined })
    setLoading(false)
    if (signupError) { console.error("[v0] Supabase registration failed", { operation: "auth.signUp", message: signupError.message, code: signupError.code, status: signupError.status }); setError(authError(signupError.message, signupError.code ?? undefined)); return }
    if (data.session) { router.push("/dashboard"); return }
    router.push(`/verify?phone=${encodeURIComponent(phone)}`)
  }

  return <main className="grid min-h-screen place-items-center px-5"><div className="glass w-full max-w-md rounded-2xl p-7"><Link href="/" className="text-xs font-bold tracking-[.2em] text-primary">STILLA CONNECT</Link><h1 className="mt-8 text-2xl font-semibold">Create your account.</h1><p className="mt-2 text-sm text-muted-foreground">Get started with managed community Internet.</p><form onSubmit={submit} className="mt-7 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium">Full name <span className="font-normal text-muted-foreground">(optional)</span><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} placeholder="Kwame Mensah" autoComplete="name" /></label><label className="flex flex-col gap-2 text-xs font-medium">Phone number<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="0241234567" autoComplete="tel" /></label><PasswordField label="Password" value={form.password} onChange={(password) => setForm({ ...form, password })} visible={showPassword} onToggle={() => setShowPassword(!showPassword)} autoComplete="new-password" /><PasswordField label="Confirm password" value={form.confirmPassword} onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} autoComplete="new-password" />{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<button disabled={loading} className="mt-2 h-10 rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">{loading ? "Creating account…" : "Create account"}</button></form><p className="mt-6 text-center text-xs text-muted-foreground">Already have an account? <Link href="/login" className="text-primary">Sign in</Link></p></div></main>
}

export function LoginForm() {
  const router = useRouter(); const [identifier, setIdentifier] = useState(""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); const isEmail = identifier.includes("@"); const phone = normalizePhone(identifier); if (!isEmail && !/^\+233\d{9}$/.test(phone)) return setError("Enter a valid Ghanaian phone number."); setLoading(true); const { error: loginError } = await createClient().auth.signInWithPassword({ ...(isEmail ? { email: identifier.trim() } : { phone }), password }); setLoading(false); if (loginError) { console.error("[v0] Supabase login failed", { operation: "auth.signInWithPassword", message: loginError.message, code: loginError.code, status: loginError.status }); setError("Invalid phone or password."); return }; router.push("/dashboard") }
  return <main className="grid min-h-screen place-items-center px-5"><div className="w-full max-w-md"><Link href="/" className="mb-10 block text-sm font-bold tracking-[.2em] text-primary">STILLA CONNECT</Link><div className="glass rounded-2xl p-7"><p className="text-[10px] font-bold tracking-[.2em] text-primary">CUSTOMER ACCESS</p><h1 className="mt-3 text-2xl font-semibold">Welcome back.</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to manage your connection.</p><form onSubmit={submit} className="mt-7 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium">Phone number<input required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={inputClass} placeholder="0241234567" autoComplete="tel" /></label><PasswordField label="Password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword(!showPassword)} autoComplete="current-password" />{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<button disabled={loading} className="mt-2 h-10 rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button></form><p className="mt-6 text-center text-xs text-muted-foreground">New to StillaCon? <Link href="/register" className="text-primary">Create an account</Link></p></div></div></main>
}

export function SignOutButton() { const router = useRouter(); const [loading, setLoading] = useState(false); async function signOut() { setLoading(true); await createClient().auth.signOut(); router.replace("/login"); router.refresh() } return <button type="button" onClick={signOut} disabled={loading} className="mt-8 w-full rounded-xl border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:bg-accent disabled:opacity-60">{loading ? "Signing out…" : "Sign out"}</button> }

export function VerifyForm({ phone }: { phone: string }) {
  const router = useRouter(); const [otp, setOtp] = useState(""); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false); const [cooldown, setCooldown] = useState(0)
  async function verify(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setMessage(""); if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit verification code."); setLoading(true); const { error: verifyError } = await createClient().auth.verifyOtp({ phone, token: otp, type: "sms" }); setLoading(false); if (verifyError) { setError(/expired/i.test(verifyError.message) ? "This code has expired. Request a new code." : "That code is invalid. Check it and try again."); return }; router.replace("/dashboard"); router.refresh() }
  async function resend() { if (cooldown > 0 || loading) return; setError(""); setMessage(""); setLoading(true); const { error: resendError } = await createClient().auth.resend({ type: "sms", phone }); setLoading(false); if (resendError) { setError("We couldn't resend the code. Please try again."); return }; setMessage("A new verification code was sent."); setCooldown(30); const timer = window.setInterval(() => setCooldown((value) => { if (value <= 1) { window.clearInterval(timer); return 0 }; return value - 1 }), 1000) }
  return <main className="grid min-h-screen place-items-center px-5"><div className="glass w-full max-w-md rounded-2xl p-7"><Link href="/" className="text-xs font-bold tracking-[.2em] text-primary">STILLA CONNECT</Link><h1 className="mt-8 text-2xl font-semibold">Verify your phone.</h1><p className="mt-2 text-sm text-muted-foreground">Enter the code sent to {maskPhone(phone)}.</p><form onSubmit={verify} className="mt-7 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium">Verification code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputClass} tracking-[.35em]`} autoComplete="one-time-code" /></label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}{message && <p role="status" className="text-xs text-emerald-400">{message}</p>}<button disabled={loading} className="h-10 rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60">{loading ? "Verifying…" : "Verify phone"}</button></form><button type="button" onClick={resend} disabled={loading || cooldown > 0} className="mt-5 w-full text-center text-xs text-primary disabled:text-muted-foreground">{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</button><p className="mt-6 text-center text-xs text-muted-foreground"><Link href="/login" className="text-primary">Return to sign in</Link></p></div></main>
}

export function AuthError({ message }: { message: string }) { return <main className="grid min-h-screen place-items-center px-5"><div className="glass w-full max-w-md rounded-2xl p-7"><h1 className="text-xl font-semibold">Authentication required</h1><p className="mt-2 text-sm text-muted-foreground">{message}</p><Link href="/login" className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground">Sign in</Link></div></main> }
