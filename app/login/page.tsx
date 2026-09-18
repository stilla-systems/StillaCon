"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { Network } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authErrorMessage, createClient } from "@/lib/supabase/client"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("")
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password })
    if (signInError) { setError(authErrorMessage(signInError.message)); setPending(false); return }
    router.push("/dashboard"); router.refresh()
  }
  return <main className="grid min-h-screen place-items-center px-5"><div className="w-full max-w-md"><Link href="/" className="mb-10 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Network /></span><span className="text-sm font-bold tracking-[.2em]">STILLA CONNECT</span></Link><div className="glass rounded-2xl p-7"><p className="text-[10px] font-bold tracking-[.2em] text-primary">CUSTOMER ACCESS</p><h1 className="mt-3 text-2xl font-semibold">Welcome back.</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to manage your connection.</p><form onSubmit={submit} className="mt-7 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs font-medium">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:border-primary" placeholder="you@example.com" /></label><label className="flex flex-col gap-2 text-xs font-medium">Password<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:border-primary" placeholder="••••••••" /></label>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<Button disabled={pending} className="mt-2 w-full">{pending ? "Signing in…" : "Sign in"}</Button></form><p className="mt-6 text-center text-xs text-muted-foreground">New to StillaCon? <Link href="/register" className="text-primary">Create an account</Link></p></div><p className="mt-5 text-center text-[11px] text-muted-foreground">Secure email and password access</p></div></main>
}
