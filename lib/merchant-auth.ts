import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requireMerchantAccess(pathname: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(pathname)}`)

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)

  const roleNames = (roles ?? []).map((item) => item.role as string)
  if (roleNames.includes("ADMIN") || roleNames.includes("SUPER_ADMIN")) return user
  if (!roleNames.includes("MERCHANT")) redirect("/merchant")
  return user
}

export async function requireAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin/merchants/applications")
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id)
  if (!(roles ?? []).some((item) => ["ADMIN", "SUPER_ADMIN"].includes(item.role as string))) redirect("/dashboard")
  return user
}
