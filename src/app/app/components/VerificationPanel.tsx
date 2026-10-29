'use client';

// TEC Zone — the verification WORKFLOW surface (C-120 §7). A project/merchant/
// builder/community applies to be Zone Verified: submit a request (starts PENDING —
// never self-verified), then attach append-only supporting evidence. The verdict is
// a human reviewer's (ADMIN) decision, out of this applicant surface — "Zone
// Verified" is earned, never bought. Identity is the session (the BFF forwards the
// JWT; owner is derived from the token server-side, never a client field — P6).
import { useEffect, useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { buildHeaders } from '@/lib/request-id';
import { reportError } from '@/lib/observability/reportError';
import { useZoneCopy, type ZoneCopy } from '@/lib/zone/copy';

interface Submission {
  handle: string; type: string; name: string; summary?: string | null;
  status: string; reviewer?: string | null; verified_at?: string | null;
  _count?: { evidence?: number };
}

const TYPES = ['PROJECT', 'MERCHANT', 'BUILDER', 'COMMUNITY'] as const;
const kindOf = (v: string) => v.toLowerCase() as 'project' | 'merchant' | 'builder' | 'community';

const STATUS_TONE: Record<string, string> = {
  PENDING:  TEC_COLORS.subtext,
  VERIFIED: TEC_COLORS.gold,
  REVOKED:  '#EF4444',
};

export function VerificationPanel({ isAuth, authLoading = false }: {
  isAuth: boolean;
  /**
   * Whether the session is still being resolved server-side. Without it the
   * signed-out pitch flashes for everyone on every open, because the answer to
   * "am I signed in?" arrives over the network (C-123 §3).
   */
  authLoading?: boolean;
}) {
  const c = useZoneCopy();
  const [subs, setSubs]   = useState<Submission[] | null>(null);
  const [type, setType]   = useState('PROJECT');
  const [name, setName]   = useState('');
  const [summary, setSummary] = useState('');
  const [note, setNote]   = useState('');
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch('/api/bff/zone/verification', { cache: 'no-store' });
      if (!res.ok) { setSubs([]); return; }
      const data = await res.json().catch(() => ({}));
      setSubs((data.submissions as Submission[]) ?? []);
    } catch (err) {
      // An applicant with no submissions and one whose list failed to load see
      // the same screen — but they must not look the same to us.
      reportError(err, { where: 'VerificationPanel.load' });
      setSubs([]);
    }
  }

  useEffect(() => { if (isAuth) load(); }, [isAuth]);

  // `return null` was the whole workflow's failure mode. Gated on a client-read
  // cookie that Pi Browser hides, it rendered NOTHING — so the surface a
  // merchant needs to request verification was invisible on the only platform
  // this app ships to, and looked identical to a broken page.
  if (authLoading) {
    return (
      <section style={{ marginTop: 28 }}>
        <p style={{ fontSize: 13, color: TEC_COLORS.subtext }}>{c.apply.loading}</p>
      </section>
    );
  }

  if (!isAuth) {
    return (
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: '0 0 4px' }}>
          {c.apply.title}
        </h2>
        <p style={{ fontSize: 12.5, color: TEC_COLORS.subtext, margin: 0, lineHeight: 1.55 }}>
          {c.apply.hintSignedOut}
        </p>
      </section>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/bff/zone/verification', {
        method: 'POST', headers: buildHeaders(null),
        body: JSON.stringify({ type, name, summary: summary || undefined, note: note || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 409 ? c.apply.pendingExists : (data.error ?? c.apply.failed));
        return;
      }
      setName(''); setSummary(''); setNote('');
      await load();
    } catch { setError(c.apply.network); }
    finally { setBusy(false); }
  }

  const card: React.CSSProperties = {
    background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`,
    borderRadius: 12, padding: 14,
  };
  const input: React.CSSProperties = {
    // border-box: `width: 100%` plus padding pushed every field past the card's edge.
    width: '100%', boxSizing: 'border-box', minWidth: 0, padding: '10px 11px', background: TEC_COLORS.bg, color: TEC_COLORS.text,
    border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: '0 0 4px' }}>{c.apply.title}</h2>
      <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '0 0 12px', lineHeight: 1.5 }}>
        {c.apply.hint}
      </p>

      {/* My submissions */}
      {subs && subs.length > 0 && (
        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          {subs.map((s) => (
            <SubmissionRow key={s.handle} sub={s} onChanged={load} card={card} input={input} c={c} />
          ))}
        </div>
      )}

      {/* Apply form */}
      <form onSubmit={submit} style={{ ...card, display: 'grid', gap: 10 }}>
        {/* minmax(0, 1fr): a plain 1fr column grows to its widest child and spills out. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <label style={{ display: 'grid', gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 11.5, color: TEC_COLORS.subtext }}>{c.apply.type}</span>
            <select value={type} onChange={(e) => setType(e.target.value)} style={input}>
              {TYPES.map((v) => <option key={v} value={v}>{c.type[kindOf(v)]}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 11.5, color: TEC_COLORS.subtext }}>{c.apply.name}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} placeholder={c.apply.namePh} style={input} />
          </label>
        </div>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11.5, color: TEC_COLORS.subtext }}>{c.apply.summary} <span style={{ opacity: 0.6 }}>{c.apply.optional}</span></span>
          <input value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={140} placeholder={c.apply.summaryPh} style={input} />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11.5, color: TEC_COLORS.subtext }}>{c.apply.note} <span style={{ opacity: 0.6 }}>{c.apply.optional}</span></span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder={c.apply.notePh} style={input} />
        </label>
        {error && <div style={{ color: '#EF4444', fontSize: 12.5 }}>{error}</div>}
        <button type="submit" disabled={busy || name.trim().length < 2} style={primaryBtn(busy || name.trim().length < 2)}>
          {busy ? c.apply.submitting : c.apply.submit}
        </button>
      </form>
    </section>
  );
}

function SubmissionRow({
  sub, onChanged, card, input, c,
}: {
  sub: Submission; onChanged: () => void;
  card: React.CSSProperties; input: React.CSSProperties; c: ZoneCopy;
}) {
  const [open, setOpen] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tone = STATUS_TONE[sub.status] ?? TEC_COLORS.subtext;
  const isPending = sub.status === 'PENDING';

  async function addEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/bff/zone/entity/${encodeURIComponent(sub.handle)}/evidence`, {
        method: 'POST', headers: buildHeaders(null),
        body: JSON.stringify({ kind: 'note', note: evidence }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? c.apply.evidenceFailed); return; }
      setEvidence(''); setOpen(false);
      onChanged();
    } catch { setError(c.apply.network); }
    finally { setBusy(false); }
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: TEC_COLORS.text }}>
          {sub.name} <span style={{ fontSize: 11, fontWeight: 400, color: TEC_COLORS.subtext }}>@{sub.handle}</span>
        </span>
        <span style={{ fontSize: 10, fontWeight: 800, color: tone, border: `1px solid ${tone}55`, borderRadius: 999, padding: '2px 8px' }}>
          {c.status[sub.status.toLowerCase()] ?? sub.status}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: TEC_COLORS.subtext, marginTop: 4 }}>
        {c.evidenceCount(sub._count?.evidence ?? 0)}
        {sub.reviewer ? ` · ${c.apply.reviewedBy(sub.reviewer)}` : ''}
      </div>

      {isPending && (
        open ? (
          <form onSubmit={addEvidence} style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <input value={evidence} onChange={(e) => setEvidence(e.target.value)} required minLength={2} maxLength={200}
              placeholder={c.apply.evidencePh} style={input} />
            {error && <div style={{ color: '#EF4444', fontSize: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={busy || evidence.trim().length < 2} style={{ ...primaryBtn(busy || evidence.trim().length < 2), width: 'auto', padding: '8px 14px' }}>
                {busy ? c.apply.adding : c.apply.add}
              </button>
              <button type="button" onClick={() => { setOpen(false); setError(null); }} style={ghostBtn}>{c.apply.cancel}</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setOpen(true)} style={{ ...ghostBtn, marginTop: 10 }}>{c.apply.addEvidence}</button>
        )
      )}
    </div>
  );
}

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '10px 16px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? `${TEC_COLORS.gold}33` : TEC_COLORS.gold, color: disabled ? TEC_COLORS.subtext : '#050816',
  fontWeight: 800, fontSize: 13, width: '100%',
});

const ghostBtn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
  background: 'transparent', color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}44`,
  fontWeight: 700, fontSize: 12.5,
};
