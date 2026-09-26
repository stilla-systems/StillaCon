import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const transitions: Record<string, string[]> = {
  APPLIED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "REQUESTED_INFORMATION"],
  REQUESTED_INFORMATION: ["UNDER_REVIEW"],
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["ADMIN", "SUPER_ADMIN"]).maybeSingle()
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const nextStatus = body.status as string
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""
  if (!transitions[body.previousStatus]?.includes(nextStatus)) return NextResponse.json({ error: "Invalid status transition" }, { status: 400 })
  if ((nextStatus === "REJECTED" || nextStatus === "REQUESTED_INFORMATION") && !reason) return NextResponse.json({ error: "A reason is required" }, { status: 400 })

  const admin = createAdminClient()
  const { data: application, error: readError } = await admin.from("merchant_applications").select("id, application_number, applicant_user_id, full_name, business_name, phone, email, business_address, city, region, country, connectivity_provider, connectivity_plan, equipment_description, intended_service_area, status, merchant_id").eq("id", id).single()
  if (readError || !application || application.status !== body.previousStatus) return NextResponse.json({ error: "Application changed or not found" }, { status: 409 })

  let merchantId = application.merchant_id
  if (nextStatus === "APPROVED" && !merchantId) {
    const { data: merchant, error } = await admin.from("merchants").insert({ user_id: application.applicant_user_id, merchant_number: await nextMerchantNumber(admin), business_name: application.business_name, contact_name: application.full_name, phone: application.phone, email: application.email, business_address: application.business_address, city: application.city, region: application.region, country: application.country, status: "APPROVED", verification_status: "APPROVED" }).select("id").single()
    if (error) return NextResponse.json({ error: "Could not create merchant" }, { status: 500 })
    merchantId = merchant.id
    await admin.from("user_roles").upsert({ user_id: application.applicant_user_id, role: "MERCHANT" }, { onConflict: "user_id,role" })
  }
  const { error: updateError } = await admin.from("merchant_applications").update({ status: nextStatus, merchant_id: merchantId, reviewed_at: new Date().toISOString(), reviewed_by: user.id, verification_information: reason ? { review_request: reason } : undefined }).eq("id", id).eq("status", body.previousStatus)
  if (updateError) return NextResponse.json({ error: "Could not update application" }, { status: 500 })
  const action = nextStatus === "UNDER_REVIEW" ? "MERCHANT_APPLICATION_REVIEW_STARTED" : nextStatus === "APPROVED" ? "MERCHANT_APPLICATION_APPROVED" : nextStatus === "REJECTED" ? "MERCHANT_APPLICATION_REJECTED" : "MERCHANT_APPLICATION_INFORMATION_REQUESTED"
  await admin.from("audit_logs").insert({ actor_id: user.id, action, resource_type: "merchant_application", resource_id: id, metadata: { application_id: id, merchant_id: merchantId, previous_status: body.previousStatus, new_status: nextStatus, reason: reason || null } })
  if (nextStatus === "APPROVED" && merchantId) await admin.from("audit_logs").insert({ actor_id: user.id, action: "MERCHANT_ACTIVATED", resource_type: "merchant", resource_id: merchantId, metadata: { application_id: id, merchant_id: merchantId } })
  return NextResponse.json({ ok: true, status: nextStatus, merchantId })
}

async function nextMerchantNumber(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.rpc("next_merchant_number")
  return data as string
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["ADMIN", "SUPER_ADMIN"]).maybeSingle()
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const admin = createAdminClient(); const { id } = await params
  const { data, error } = await admin.from("merchant_applications").select("id, application_number, applicant_user_id, full_name, business_name, phone, email, business_address, city, region, country, connectivity_provider, connectivity_plan, equipment_description, intended_service_area, status, created_at, merchant_id").eq("id", id).single()
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { return PATCH(request, context) }

