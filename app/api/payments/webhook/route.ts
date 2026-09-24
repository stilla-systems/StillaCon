import { NextResponse } from "next/server"
import { verifyPaystackSignature } from "@/lib/paystack"
import { fulfillPaystackPayment } from "@/lib/payment-fulfillment"

export async function POST(request: Request) {
  const rawBody = await request.text()
  try { if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) return NextResponse.json({ error: "Invalid signature." }, { status: 401 }); const payload = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } }; if (payload.event === "charge.success" && payload.data?.reference) await fulfillPaystackPayment(payload.data.reference); return NextResponse.json({ received: true }) }
  catch { return NextResponse.json({ error: "Webhook could not be processed." }, { status: 400 }) }
}
