'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Copy, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentSuccessModalProps {
  reference: string;
  planName: string;
  onClose: () => void;
  onGenerateAccessCode: () => Promise<void>;
}

export function PaymentSuccessModal({
  reference,
  planName,
  onClose,
  onGenerateAccessCode,
}: PaymentSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [accessCode, setAccessCode] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  async function handleGenerateAccessCode() {
    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/devices/access-code', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate access code');
      }

      const data = await response.json();
      setAccessCode(data.accessCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate access code');
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
      <div className="glass w-full max-w-md rounded-2xl p-7 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="grid size-14 place-items-center rounded-full bg-emerald-400/10">
            <CheckCircle2 className="size-7 text-emerald-300" />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-secondary"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <h2 className="mt-4 text-2xl font-semibold">Payment Successful!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your {planName} subscription has been activated. Your access is ready.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-background/35 p-4">
          <p className="text-xs font-semibold text-primary">REFERENCE</p>
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-background p-2">
            <code className="flex-1 text-xs font-mono text-muted-foreground">{reference}</code>
            <button
              onClick={() => copyToClipboard(reference)}
              className="rounded-lg p-1 hover:bg-secondary"
              title="Copy to clipboard"
            >
              <Copy className={`size-4 ${copied ? 'text-emerald-300' : 'text-muted-foreground'}`} />
            </button>
          </div>
        </div>

        {!accessCode ? (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              Generate a unique 8-character access code to authorize your device.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={handleGenerateAccessCode}
              disabled={generating}
              className="mt-6 w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating Access Code
                </>
              ) : (
                'Generate Access Code'
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4">
              <p className="text-xs font-semibold text-emerald-300">YOUR ACCESS CODE</p>
              <p className="mt-3 text-center font-mono text-2xl font-bold tracking-widest text-emerald-300">
                {accessCode}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Keep this code safe. You'll need it to authorize your device.
              </p>
            </div>

            <Button
              onClick={() => copyToClipboard(accessCode)}
              variant="outline"
              className="mt-4 w-full"
            >
              <Copy className="size-4" />
              Copy Access Code
            </Button>

            <Button onClick={onClose} className="mt-3 w-full">
              Done
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
