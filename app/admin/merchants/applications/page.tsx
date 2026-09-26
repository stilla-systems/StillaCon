import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Logo, SectionTitle } from "@/components/stillacon-shell"

export default async function AdminMerchantApplicationsPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin/merchants/applications")
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["ADMIN", "SUPER_ADMIN"]).maybeSingle()
  if (!role) redirect("/dashboard")
  const admin = createAdminClient(); const { data: applications } = await admin.from("merchant_applications").select("id, application_number, full_name, business_name, phone, email, city, region, connectivity_provider, status, created_at").order("created_at", { ascending: false })
  return <main className="min-h-screen"><header className="border-b border-border/70 px-5 py-5 lg:px-8"><Logo /></header><section className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><SectionTitle eyebrow="OPERATIONS / MERCHANTS" title="Application review" description="Review, approve, or request information from merchant applicants." /><div className="mt-8 overflow-x-auto rounded-2xl border border-border/70 bg-card/60"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-border/70 text-xs text-muted-foreground"><tr>{["Application", "Applicant", "Business", "Location", "Connectivity", "Status", "Submitted"].map((heading) => <th key={heading} className="p-4 font-medium">{heading}</th>)}</tr></thead><tbody>{applications?.map((application) => <tr key={application.id} className="border-b border-border/50 last:border-0"><td className="p-4"><Link className="font-medium text-primary hover:underline" href={`/admin/merchants/${application.id}`}>{application.application_number}</Link></td><td className="p-4">{application.full_name}<span className="block text-xs text-muted-foreground">{application.email}</span></td><td className="p-4">{application.business_name}<span className="block text-xs text-muted-foreground">{application.phone}</span></td><td className="p-4">{application.city}, {application.region}</td><td className="p-4">{application.connectivity_provider}</td><td className="p-4"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs">{application.status}</span></td><td className="p-4 text-muted-foreground">{new Date(application.created_at).toLocaleDateString("en-GH")}</td></tr>)}</tbody></table>{!applications?.length && <p className="p-8 text-sm text-muted-foreground">No merchant applications have been submitted.</p>}</div></section></main>
}
