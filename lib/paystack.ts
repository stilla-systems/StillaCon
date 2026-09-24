import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const PAYSTACK_API = "https://api.paystack.co"

export type PaystackTransaction = { reference: string; status: string; amount: number; currency: string; customer?: { email?: string }; metadata?: Record<string, unknown> }

function secret() {
  const value = process.env.PAYSTACK_SECRET_KEY
  if (!value) throw new Error("Paystack server configuration is missing.")
  return value
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_API}${path}`, { ...init, headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...init?.headers }, cache: "no-store" })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.status) throw new Error("Paystack request failed.")
  return body.data as T
}

export function makePaymentReference() { return `STC-${Date.now().toString(36).toUpperCase()}-${randomBytes(6).toString("hex").toUpperCase()}` }

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false
  const expected = createHmac("sha512", secret()).update(rawBody).digest("hex")
  const received = Buffer.from(signature, "utf8")
  const expectedBuffer = Buffer.from(expected, "utf8")
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer)
}

export function initializePaystackTransaction(input: { email: string; amountMinor: number; reference: string; metadata: Record<string, string> }) {
  const callbackUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/payments/callback` : "https://connect.stillasystems.com/api/payments/callback"
  return paystackRequest<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", { method: "POST", body: JSON.stringify({ email: input.email, amount: input.amountMinor, currency: "GHS", reference: input.reference, callback_url: callbackUrl, metadata: input.metadata }) })
}

export function verifyPaystackTransaction(reference: string) { return paystackRequest<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`) }
