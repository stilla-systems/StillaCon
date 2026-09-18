import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return client
}

export function authRedirectUrl() {
  return process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`
}

export function authErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes("email not confirmed")) return "Please confirm your email before signing in."
  if (normalized.includes("rate limit") || normalized.includes("too many")) return "Too many attempts. Please try again later."
  if (normalized.includes("already registered") || normalized.includes("already exists") || normalized.includes("user already")) return "An account with this email already exists. Try signing in instead."
  if (normalized.includes("invalid login credentials") || normalized.includes("invalid email") || normalized.includes("password")) return "Invalid email or password."
  return "We could not complete that request. Please try again."
}
