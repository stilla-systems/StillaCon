import { createAdminClient } from "@/lib/supabase/admin"
import { normalizePhoneNumber } from "@/lib/phone"

function makeCustomerNumber() {
  return `STC-${Math.floor(100000 + Math.random() * 900000)}`
}

export async function ensureCustomerRecord(user: { id: string; email?: string | null; phone?: string | null; user_metadata?: Record<string, unknown> | null }) {
  const db = createAdminClient()
  const metadata = user.user_metadata ?? {}
  const email = user.email?.trim().toLowerCase() || null
  const normalizedPhone = user.phone?.trim() ? normalizePhoneNumber(user.phone) : null
  const phone = normalizedPhone ?? "Not provided"
  const emailName = email ? email.split("@")[0].replace(/[._-]+/g, " ").trim() : "StillaCon customer"
  const fullName = typeof metadata.full_name === "string" && metadata.full_name.trim().length >= 2
    ? metadata.full_name.trim()
    : emailName || "StillaCon customer"

  const { data: byUser, error: userLookupError } = await db
    .from("customers")
    .select("id, user_id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (userLookupError) throw userLookupError
  if (byUser) return byUser

  let byPhone: { id: string; user_id: string | null } | null = null
  if (normalizedPhone) {
    const phoneLookup = await db.from("customers").select("id, user_id").eq("phone", normalizedPhone).maybeSingle()
    if (phoneLookup.error) throw phoneLookup.error
    byPhone = phoneLookup.data
  }

  if (byPhone) {
    if (byPhone.user_id && byPhone.user_id !== user.id) throw new Error("Customer phone is already linked to another account")
    const { data, error } = await db
      .from("customers")
      .update({ user_id: user.id, full_name: fullName, phone, email })
      .eq("id", byPhone.id)
      .select("id, user_id")
      .single()
    if (error) throw error
    return data
  }

  let byEmail: { id: string; user_id: string | null } | null = null
  if (email) {
    const emailLookup = await db.from("customers").select("id, user_id").eq("email", email).maybeSingle()
    if (emailLookup.error) throw emailLookup.error
    byEmail = emailLookup.data
  }

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
