import { MerchantCustomers } from "@/components/merchant-experience"
import { requireMerchantAccess } from "@/lib/merchant-auth"

export default async function MerchantCustomersPage() {
  await requireMerchantAccess("/merchant/customers")
  return <MerchantCustomers />
}
