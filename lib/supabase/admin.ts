import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error('Supabase server credentials are not configured');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isSafeReference(reference: string) {
  return /^[A-Za-z0-9._-]{4,120}$/.test(reference);
}

export function makeAccessCode() {
  return `STC-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
}

export async function hashAccessCode(code: string) {
  const bytes = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
