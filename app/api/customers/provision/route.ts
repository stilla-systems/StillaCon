import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureCustomerRecord } from "@/lib/customer-provision"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  try {
    const customer = await ensureCustomerRecord(user)
    return NextResponse.json({ customerId: customer.id })
  } catch (error) {
    console.error("[v0] Customer provisioning failed", error)
    return NextResponse.json({ error: "We could not finish setting up your customer profile." }, { status: 500 })
  }
}
