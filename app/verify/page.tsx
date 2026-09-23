import { VerifyForm } from "@/components/auth-forms"

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ phone?: string }> }) {
  const { phone } = await searchParams
  if (!phone || !/^\+233\d{9}$/.test(phone)) return <VerifyForm phone="+233•••••••••" />
  return <VerifyForm phone={phone} />
}
