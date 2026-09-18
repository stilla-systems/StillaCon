'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Wifi } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CheckoutFormProps {
  planName: string;
  planPrice: string;
  planDuration: string;
  onCheckoutStart: () => Promise<void>;
  isLoading?: boolean;
}

export function CheckoutForm({
  planName,
  planPrice,
  planDuration,
  onCheckoutStart,
  isLoading = false,
}: CheckoutFormProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(isLoading);

  async function handleCheckout() {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await onCheckoutStart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="glass rounded-2xl p-7">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 grid size-16 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-xl font-semibold text-emerald-300">Payment Successful</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your {planName} subscription is now active. You can generate your access code
            from the dashboard.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[.2em] text-primary">SECURE CHECKOUT</p>
          <h1 className="mt-3 text-3xl font-semibold">Activate {planName}.</h1>
        </div>
        <div className="grid size-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <Wifi />
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-background/35 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Plan Price</span>
          <span className="text-2xl font-semibold">{planPrice}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Duration</span>
          <span className="text-primary">{planDuration}</span>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        Sign in to continue to Paystack. Your subscription will activate automatically after the
        payment is verified.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-5 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3"
        >
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="h-11 justify-between rounded-xl"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Opening secure checkout
            </>
          ) : (
            <>
              Continue to Paystack
              <span className="text-xs text-primary-foreground/80">→</span>
            </>
          )}
        </Button>
        <a
          href="/plans"
          className="flex h-11 items-center justify-center rounded-xl border border-border text-sm font-medium hover:bg-secondary"
        >
          Choose another plan
        </a>
      </div>

      <div className="mt-8 flex gap-3 rounded-xl border border-border bg-background/35 p-3 text-xs text-muted-foreground">
        <div className="size-4 shrink-0 rounded-full border border-primary/40 bg-primary/5" />
        <span>Payments are processed by Paystack. StillaCon never stores card or Mobile Money details.</span>
      </div>
    </div>
  );
}
