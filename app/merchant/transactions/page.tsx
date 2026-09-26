import { MerchantTransactions } from "@/components/merchant-experience"
import { requireMerchantAccess } from "@/lib/merchant-auth"

export default async function MerchantTransactionsPage() {
  await requireMerchantAccess("/merchant/transactions")
  return <MerchantTransactions />
}
