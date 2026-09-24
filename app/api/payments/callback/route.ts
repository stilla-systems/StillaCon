import { NextResponse } from "next/server"
import { fulfillPaystackPayment } from "@/lib/payment-fulfillment"

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference")
  if (!reference) return NextResponse.redirect(new URL("/dashboard/payments?payment=failed", request.url))
  try { await fulfillPaystackPayment(reference); return NextResponse.redirect(new URL(`/dashboard/payments?payment=success&reference=${encodeURIComponent(reference)}`, request.url)) }
  catch { return NextResponse.redirect(new URL(`/dashboard/payments?payment=failed&reference=${encodeURIComponent(reference)}`, request.url)) }
}
