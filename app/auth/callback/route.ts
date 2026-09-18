import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureCustomerRecord } from "@/lib/customer-provision"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next")
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(new URL(`/login?error=auth_callback_failed`, url.origin))
    if (data.user) await ensureCustomerRecord(data.user)
  }
  return NextResponse.redirect(new URL(next?.startsWith("/") ? next : "/dashboard", url.origin))
}
