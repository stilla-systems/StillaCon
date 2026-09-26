import { MerchantLocations } from "@/components/merchant-experience"
import { requireMerchantAccess } from "@/lib/merchant-auth"

export default async function MerchantLocationsPage() {
  await requireMerchantAccess("/merchant/locations")
  return <MerchantLocations />
}
