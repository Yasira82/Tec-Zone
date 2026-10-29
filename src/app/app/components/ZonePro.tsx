'use client';

// Zone Pro — the monetization surface (C-120 §8). A real Pi User-to-App payment;
// this also satisfies the Pi Portal "Process a Transaction" checklist step (the
// V0 gate that Zone V1 depends on). ADR-007 dual-mode: Hub navigation → Mode 1
// (Hub modal); standalone in Pi Browser → Mode 2 (direct createU2APayment).
// Approves under PI_API_KEY_ZONE (never the default Hub key — C-12 §11).
import { useEffect, useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import {
  isHubNavigation,
  redirectToHubPayment,
  createPaymentRecord,
  createU2APayment,
} from '@/lib/pi-payment';
import { CancelProButton } from '@/components/pro/CancelProButton';
import { useZoneCopy } from '@/lib/zone/copy';
import { Icon } from './Icon';

const PRICE   = 10;                     // π / month
const ITEM_ID = 'zone_pro_monthly';
const MEMO    = 'TEC Zone — Pro (1 month)';

// Always render a STRING — a gateway/payment error body can be an object
// ({ code, message }); rendering it as a React child throws (minified #31).
const asText = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.error === 'string')   return o.error;
    try { return JSON.stringify(v); } catch { return 'Payment failed.'; }
  }
  return v == null ? '' : String(v);
};

type Status = 'idle' | 'creating' | 'paying' | 'success' | 'error';

export function ZonePro() {
  const [piReady, setPiReady] = useState(false);
  const c = useZoneCopy();
  const [status,  setStatus]  = useState<Status>('idle');
  const [message, setMessage] = useState('');

  // Reflect the real subscription (activated by commerce-service when a Pro payment
  // completes). Pro ONLY while the period is live — no auto-renewal / no downgrade job.
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/bff/subscription', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json()).catch(() => ({}))
      .then((j: Record<string, unknown>) => {
        const d = (j?.data ?? j ?? {}) as Record<string, unknown>;
        const s = ((d?.subscription ?? d) ?? {}) as Record<string, unknown>;
        const end  = typeof s.current_period_end === 'string' ? new Date(s.current_period_end) : null;
        const live = s.isActive !== false && !(s.isExpired === true || (end !== null && end.getTime() < Date.now()));
        const plan = String(s.plan ?? '').toUpperCase();
        setIsSubscribed(live && (plan === 'PRO' || plan === 'ENTERPRISE'));
        // Renewal signal (Pi Pro is one-time, no auto-renewal) — commerce sends
        // daysRemaining; fall back to the period end. Drives a re-subscribe nudge.
        const days = typeof s.daysRemaining === 'number'
          ? s.daysRemaining
          : end ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000)) : null;
        setDaysRemaining(days);
      })
      .catch(() => {});
  }, []);


  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as { __TEC_PI_READY?: boolean }).__TEC_PI_READY) { setPiReady(true); return; }
    const h = () => setPiReady(true);
    window.addEventListener('tec-pi-ready', h, { once: true });
    return () => window.removeEventListener('tec-pi-ready', h);
  }, []);

  // Mode-1 round-trip: the Hub returns to /app?payment_status=success|error.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p  = new URLSearchParams(window.location.search);
    const st = p.get('payment_status');
    if (!st) return;
    if (st === 'success') setStatus('success');
    else if (st === 'error') { setStatus('error'); setMessage(''); }  // worded at render, in the reader's language
    window.history.replaceState({}, '', '/app');
  }, []);

  const handleUpgrade = async () => {
    if (status === 'creating' || status === 'paying') return;

    // ADR-007 (C-76): check Hub navigation FIRST — before any Pi SDK call.
    if (isHubNavigation() || (window as { __TEC_PI_FOREIGN_SESSION?: boolean }).__TEC_PI_FOREIGN_SESSION
        || !(window as { Pi?: unknown }).Pi || !piReady) {
      redirectToHubPayment({ amount: PRICE, itemId: ITEM_ID, memo: MEMO });
      return;
    }

    // Mode 2 — standalone Pi Browser payment.
    setStatus('creating');
    setMessage('');
    try {
      const internalId = await createPaymentRecord(PRICE, ITEM_ID, MEMO);
      if (!internalId) {
        setStatus('error');
        setMessage(c.pro.startFailed);
        return;
      }
      setStatus('paying');
      const result = await createU2APayment(PRICE, MEMO, { item_id: ITEM_ID, plan: 'zone_pro' }, internalId);
      if (result.success && result.status === 'completed') {
        setStatus('success');
      } else if (result.status === 'cancelled') {
        setStatus('idle');
      } else {
        setStatus('error');
        setMessage(asText(result.message) || c.pro.failed);
      }
    } catch (err) {
      setStatus('error');
      setMessage(asText(err) || c.pro.failed);
    }
  };

  const card: React.CSSProperties = {
    background:   TEC_COLORS.surface,
    border:       `1px solid ${TEC_COLORS.gold}55`,
    borderRadius: 16,
    padding:      20,
    marginTop:    24,
  };

  if (isSubscribed) {
    return (
      <div style={{ background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}55`, borderRadius: 16, padding: 20, marginTop: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.gold }}>★ {c.pro.onPro}</div>
        <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 6 }}>
          {c.pro.onProBody}
        </div>
        {typeof daysRemaining === 'number' && (
          <div style={{ fontSize: 12, fontWeight: daysRemaining <= 7 ? 700 : 600, color: daysRemaining <= 7 ? TEC_COLORS.gold : TEC_COLORS.subtext, marginTop: 8 }}>
            {daysRemaining <= 7 ? '⏳ ' : ''}{c.pro.expires(daysRemaining)}
            {daysRemaining <= 7 && <div style={{ fontWeight: 500, marginTop: 2 }}>{c.pro.renew}</div>}
          </div>
        )}
        <CancelProButton />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ ...card, borderColor: `${TEC_COLORS.success}66` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.success }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={16} color={TEC_COLORS.success} strokeWidth={2.4} />{c.pro.active}</span></div>
        <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 6, lineHeight: 1.5 }}>
          {c.pro.activeBody}
        </div>
      </div>
    );
  }

  const busy = status === 'creating' || status === 'paying';

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.gold }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="shield" size={16} color={TEC_COLORS.gold} strokeWidth={2} />Zone Pro</span></div>
        <div style={{ fontSize: 20, fontWeight: 900, color: TEC_COLORS.text }}>
          {PRICE}π<span style={{ fontSize: 12, color: TEC_COLORS.subtext, fontWeight: 600 }}> {c.pro.perMonth}</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 8, lineHeight: 1.5 }}>
        {c.pro.body}
      </div>

      <button
        onClick={() => { void handleUpgrade(); }}
        disabled={busy}
        style={{
          marginTop: 14, width: '100%', padding: '12px 16px', borderRadius: 12,
          background: busy ? '#333' : `linear-gradient(135deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})`,
          color: busy ? '#888' : '#0a0800',
          border: 'none', fontSize: 14, fontWeight: 800,
          cursor: busy ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'creating' ? c.pro.preparing
          : status === 'paying' ? c.pro.confirmInPi
          : c.pro.upgrade(PRICE)}
      </button>

      {status === 'error' && (
        <div style={{ fontSize: 12, color: TEC_COLORS.error, marginTop: 10 }}>{message || c.pro.failed}</div>
      )}
    </div>
  );
}
