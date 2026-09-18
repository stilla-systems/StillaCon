import { createAdminClient } from "@/lib/supabase/admin"

function makeCustomerNumber() {
  return `STC-${Math.floor(100000 + Math.random() * 900000)}`
}

export async function ensureCustomerRecord(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }) {
  const db = createAdminClient()
  const metadata = user.user_metadata ?? {}
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "StillaCon customer"
  const phone = typeof metadata.phone === "string" ? metadata.phone.trim() : ""
  const email = user.email?.trim().toLowerCase() ?? ""

  const { data: byUser, error: userLookupError } = await db
    .from("customers")
    .select("id, user_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (userLookupError) throw userLookupError
  if (byUser) return byUser

  if (!email || !phone || fullName.length < 2) {
    throw new Error("Customer profile information is incomplete")
  }

  const { data: byEmail, error: emailLookupError } = await db
    .from("customers")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle()
  if (emailLookupError) throw emailLookupError

  if (byEmail) {
    if (byEmail.user_id && byEmail.user_id !== user.id) throw new Error("Customer email is already linked to another account")
    const { data, error } = await db
      .from("customers")
      .update({ user_id: user.id, full_name: fullName, phone })
      .eq("id", byEmail.id)
      .select("id, user_id")
      .single()
    if (error) throw error
    return data
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await db
      .from("customers")
      .insert({ user_id: user.id, customer_number: makeCustomerNumber(), full_name: fullName, phone, email, status: "PENDING" })
      .select("id, user_id")
      .single()
    if (!error) return data
    if (error.code !== "23505") throw error
  }

  throw new Error("Could not create customer record")
}
