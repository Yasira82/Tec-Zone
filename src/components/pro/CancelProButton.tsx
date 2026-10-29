'use client';

import { useEffect, useState } from 'react';
import { useZoneCopy } from '@/lib/zone/copy';

/**
 * Cancel THIS app's Pro — and only this app's (owner decision, 2026-10-02: each
 * app's Pro card is its own, with its own cancel; the Hub plan is separate).
 *
 * Self-contained: it reads the app's own status and renders nothing unless there
 * is something here to cancel — not on the Testnet host, and not for a Pro bought
 * before the split (`legacy`), which belongs to the platform plan and ends on its
 * own date.
 */
const csrf = (): string => {
  if (typeof document === 'undefined') return '';
  return decodeURIComponent(document.cookie.match(/(?:^|;\s*)tec_csrf=([^;]*)/)?.[1] ?? '');
};

export function CancelProButton({ onCancelled }: { onCancelled?: () => void } = {}) {
  const c = useZoneCopy();
  const [show,   setShow]   = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    fetch('/api/bff/subscription', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json()).catch(() => ({}))
      .then((j: Record<string, unknown>) => {
        const d = ((j?.data ?? j) ?? {}) as Record<string, unknown>;
        const s = ((d.subscription ?? d) ?? {}) as Record<string, unknown>;
        const plan = String(s.plan ?? '').toUpperCase();
        setShow(s.isActive === true && plan !== 'FREE' && s.legacy !== true && s.testnet !== true);
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  const cancel = async () => {
    if (busy) return;
    if (!window.confirm(c.pro.cancelConfirm)) return;
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/bff/subscription/cancel', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf() },
        body: '{}',
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { message?: unknown; error?: unknown };
        throw new Error(String(b.message ?? b.error ?? c.pro.cancelFailed));
      }
      setShow(false);
      if (onCancelled) onCancelled(); else window.location.reload();
    } catch (e) {
      setError((e as Error).message || c.pro.cancelFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={cancel}
        disabled={busy}
        style={{
          padding: '8px 14px', borderRadius: 10, cursor: busy ? 'default' : 'pointer',
          background: 'transparent', border: '1px solid rgba(239,68,68,0.55)', color: '#ef4444',
          fontSize: 12, fontWeight: 700,
        }}
      >
        {busy ? c.pro.cancelling : c.pro.cancel}
      </button>
      {error && <div role="alert" style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>{error}</div>}
    </div>
  );
}
