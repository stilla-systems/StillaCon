import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { MerchantReviewControls } from "@/components/admin-merchant-review"
import { Logo, SectionTitle } from "@/components/stillacon-shell"

export default async function AdminMerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["ADMIN", "SUPER_ADMIN"]).maybeSingle()
  if (!role) redirect("/dashboard")
  const { id } = await params; const admin = createAdminClient()
  const { data: application } = await admin.from("merchant_applications").select("id, application_number, full_name, business_name, phone, email, business_address, city, region, country, connectivity_provider, connectivity_plan, equipment_description, intended_service_area, status, created_at, merchant_id").eq("id", id).single()
  if (!application) notFound()
  const fields = [["Applicant", application.full_name], ["Business", application.business_name], ["Phone", application.phone], ["Email", application.email], ["Location", `${application.business_address}, ${application.city}, ${application.region}, ${application.country}`], ["Connectivity", `${application.connectivity_provider} · ${application.connectivity_plan ?? "Plan not specified"}`], ["Equipment / setup", application.equipment_description], ["Intended service area", application.intended_service_area]]
  return <main className="min-h-screen"><header className="border-b border-border/70 px-5 py-5 lg:px-8"><Logo /></header><section className="mx-auto max-w-4xl px-5 py-12 lg:px-8"><Link href="/admin/merchants/applications" className="text-sm text-muted-foreground hover:text-foreground">← All applications</Link><SectionTitle eyebrow={`APPLICATION · ${application.application_number}`} title={application.business_name} description={`Submitted ${new Date(application.created_at).toLocaleDateString("en-GH")}`} action={<span className="rounded-full bg-secondary px-3 py-1 text-xs">{application.status}</span>} /><div className="mt-8 grid gap-3 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="rounded-2xl border border-border/70 bg-card/60 p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6">{value}</p></div>)}</div><div className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-6"><p className="text-xs font-bold tracking-[.18em] text-primary">REVIEW ACTIONS</p><p className="mt-2 text-sm text-muted-foreground">Status changes are validated server-side and recorded in the audit log.</p><div className="mt-5"><MerchantReviewControls id={application.id} status={application.status} /></div></div></section></main>
}
