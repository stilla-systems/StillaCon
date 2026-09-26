import { MerchantEarnings } from "@/components/merchant-experience"
import { requireMerchantAccess } from "@/lib/merchant-auth"

export default async function MerchantEarningsPage() {
  await requireMerchantAccess("/merchant/earnings")
  return <MerchantEarnings />
}
