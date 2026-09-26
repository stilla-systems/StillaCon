import { MerchantDashboard } from "@/components/merchant-experience"
import { requireMerchantAccess } from "@/lib/merchant-auth"

export default async function MerchantDashboardPage() {
  await requireMerchantAccess("/merchant/dashboard")
  return <MerchantDashboard />
}
