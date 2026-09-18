import crypto from 'crypto';

const PAYSTACK_API_BASE = 'https://api.paystack.co';
function getSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }
  return secretKey;
}

export interface PaystackInitializeRequest {
  email: string;
  amount: number; // in kobo (minor units)
  metadata?: Record<string, unknown>;
  callback_url?: string;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    status: 'success' | 'failed' | 'abandoned';
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    metadata?: Record<string, unknown>;
  };
}

export async function initializePaystackTransaction(
  request: PaystackInitializeRequest
): Promise<PaystackInitializeResponse> {
  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.statusText}`);
  }

  return response.json();
}

export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const response = await fetch(
    `${PAYSTACK_API_BASE}/transaction/verify/${reference}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getSecretKey()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.statusText}`);
  }

  return response.json();
}

export function verifyPaystackWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const computed = crypto
    .createHmac('sha512', getSecretKey())
    .update(payload)
    .digest('hex');

  return computed === signature;
}

export function generateAccessCode(): string {
  // Generate a unique 8-character alphanumeric access code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function calculateExpiryDate(durationDays: number): Date {
  const now = new Date();
  return new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
}
