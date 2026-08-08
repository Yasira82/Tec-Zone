'use client';

// TEC Zone — reviewer console (C-120 §7). A human reviewer (ADMIN) works the PENDING
// verification queue: read the append-only evidence, then VERIFY or REVOKE with a
// mandatory note. Everything is enforced server-side — the backend returns 403 for a
// non-admin, so this panel simply renders nothing unless the queue loads. "Zone
// Verified" is earned, never bought; a reviewer may not decide their own submission.
import { useEffect, useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { buildHeaders } from '@/lib/request-id';

interface Evidence { kind: string; note: string; source: string; created_at?: string }
interface QueueItem {
  handle: string; type: string; name: string; summary?: string | null;
  owner?: string | null; evidence?: Evidence[]; priority?: boolean;
}

// `isAuth` is accepted for API compatibility with the caller but intentionally not
// used to gate the load — see the note on the effect below (C-123).
export function ReviewPanel(_props: { isAuth: boolean }) {
  const [queue, setQueue]   = useState<QueueItem[] | null>(null);
  const [isAdmin, setAdmin] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/bff/zone/review/queue', { cache: 'no-store' });
      if (!res.ok) { setAdmin(false); return; }          // 403 non-admin / 401 → hide
      const data = await res.json().catch(() => ({}));
      setQueue((data.queue as QueueItem[]) ?? []);
      setAdmin(true);
    } catch { setAdmin(false); }
  }

  // Always attempt the load — do NOT gate on the client-side `isAuth` flag, which is
  // unreliable in Pi Browser (the C-123 session saga): a genuine ADMIN could be logged
  // in yet have isAuth=false and never see the queue. Authorization is decided
  // server-side — the BFF forwards the session cookie and the backend returns 403 for a
  // non-admin, so the panel simply stays hidden (setAdmin(false)) unless the queue loads.
  useEffect(() => { load(); }, []);

  if (!isAdmin) return null;

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>Review queue</h2>
        <span style={{ fontSize: 11, color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}33`, borderRadius: 999, padding: '2px 10px' }}>
          reviewer · {queue?.length ?? 0} pending
        </span>
      </div>
      <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '6px 0 12px', lineHeight: 1.5 }}>
        Read the evidence, then verify or revoke with a note. You may not decide your own
        submission (separation of duties, C-120 §7).
      </p>

      {queue && queue.length === 0 && (
        <div style={{ background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 12, padding: 14, fontSize: 13, color: TEC_COLORS.subtext, textAlign: 'center' }}>
          Nothing pending review. 🎉
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {queue?.map((item) => <ReviewRow key={item.handle} item={item} onDone={load} />)}
      </div>
    </section>
  );
}

function ReviewRow({ item, onDone }: { item: QueueItem; onDone: () => void }) {
  const [note, setNote]   = useState('');
  const [busy, setBusy]   = useState<null | 'VERIFY' | 'REVOKE'>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: 'VERIFY' | 'REVOKE') {
    if (busy) return;
    if (note.trim().length < 2) { setError('A review note is required.'); return; }
    setBusy(decision); setError(null);
    try {
      const res = await fetch(`/api/bff/zone/entity/${encodeURIComponent(item.handle)}/review`, {
        method: 'PATCH', headers: buildHeaders(null),
        body: JSON.stringify({ decision, note: note.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 403 ? 'You cannot decide your own submission.' : (data.error ?? 'Could not submit the decision.'));
        return;
      }
      onDone();
    } catch { setError('Network error — please try again.'); }
    finally { setBusy(null); }
  }

  return (
    <div style={{ background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: TEC_COLORS.text }}>
          {item.name} <span style={{ fontSize: 11, fontWeight: 400, color: TEC_COLORS.subtext }}>@{item.handle} · {item.type?.toLowerCase()}</span>
        </span>
        {item.owner && <span style={{ fontSize: 10.5, color: TEC_COLORS.subtext }}>by {item.owner}</span>}
        {item.priority && (
          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}55`, borderRadius: 999, padding: '1px 7px' }}>
            ⭐ Priority (Pro)
          </span>
        )}
      </div>
      {item.summary && <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 4 }}>{item.summary}</div>}

      {/* Append-only evidence timeline */}
      {item.evidence && item.evidence.length > 0 && (
        <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
          {item.evidence.map((ev, i) => (
            <li key={i} style={{ fontSize: 11.5, color: TEC_COLORS.subtext, lineHeight: 1.5, borderLeft: `2px solid ${TEC_COLORS.gold}44`, paddingLeft: 8 }}>
              <span style={{ color: TEC_COLORS.gold }}>{ev.kind}</span> · {ev.note} <span style={{ opacity: 0.6 }}>({ev.source})</span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        <input
          value={note} onChange={(e) => setNote(e.target.value)} maxLength={200}
          placeholder="Review note (required)…"
          style={{ width: '100%', padding: '9px 11px', background: TEC_COLORS.bg, color: TEC_COLORS.text, border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 8, fontSize: 13, outline: 'none' }}
        />
        {error && <div style={{ color: '#EF4444', fontSize: 12.5 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => decide('VERIFY')} disabled={!!busy} style={btn(!!busy, TEC_COLORS.gold, '#050816')}>
            {busy === 'VERIFY' ? 'Verifying…' : '🛡️ Verify'}
          </button>
          <button onClick={() => decide('REVOKE')} disabled={!!busy} style={btn(!!busy, 'transparent', '#EF4444', '#EF4444')}>
            {busy === 'REVOKE' ? 'Revoking…' : 'Revoke'}
          </button>
        </div>
      </div>
    </div>
  );
}

const btn = (disabled: boolean, bg: string, fg: string, border?: string): React.CSSProperties => ({
  flex: 1, padding: '9px 14px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? '#ffffff1a' : bg, color: disabled ? TEC_COLORS.subtext : fg,
  border: border ? `1px solid ${border}66` : 'none', fontWeight: 800, fontSize: 13,
});
