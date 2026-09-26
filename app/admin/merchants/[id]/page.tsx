import { AdminMerchants } from "@/components/merchant-experience"
export default async function AdminMerchantDetailPage({ params }: { params: Promise<{ id: string }> }) { await params; return <AdminMerchants /> }
