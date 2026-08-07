'use client';

// TEC Zone — Trust Check. The interactive answer to Zone's one question,
// "What can be trusted?" (C-120). Anyone (signed-in or not) types a project /
// merchant / builder and sees its verified status + evidence link — Zone RECORDS
// evidence, it never computes trust scores (C-120 §4). Public read.
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { TEC_COLORS } from '@yasser172/tec-ui';

interface Hit {
  handle: string; type: string; name: string; summary: string;
  status: string; verifiedAt: string | null; evidenceCount: number;
}

const TYPE_ICON: Record<string, string> = {
  project: '🚀', merchant: '🏪', builder: '🛠️', community: '🌐',
};

export function TrustCheck() {
  const [q, setQ]         = useState('');
  const [hits, setHits]   = useState<Hit[]>([]);
  const [state, setState] = useState<'idle' | 'searching' | 'done'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback((term: string) => {
    const t = term.trim();
    if (t.length < 1) { setHits([]); setState('idle'); return; }
    setState('searching');
    fetch(`/api/bff/zone/lookup?q=${encodeURIComponent(t)}`, { cache: 'no-store' })
      .then((r) => r.json()).catch(() => ({}))
      .then((d) => { setHits(Array.isArray(d?.results) ? (d.results as Hit[]) : []); setState('done'); })
      .catch(() => { setHits([]); setState('done'); });
  }, []);

  const onChange = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => run(v), 300);   // debounce
  };

  const card: React.CSSProperties = {
    background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}33`,
    borderRadius: 16, padding: 18, marginTop: 22,
  };

  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>🛡️</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>Trust Check</h2>
      </div>
      <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '0 0 12px', lineHeight: 1.5 }}>
        Is it Zone Verified? Search a project, merchant, or builder to see its verified status + evidence.
      </p>

      <input
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search — e.g. TEC Hub, a merchant, a builder…"
        aria-label="Trust Check search"
        style={{
          width: '100%', boxSizing: 'border-box', background: TEC_COLORS.bg, color: TEC_COLORS.text,
          border: `1px solid ${TEC_COLORS.gold}44`, borderRadius: 10, padding: '11px 13px', fontSize: 14,
        }}
      />

      <div style={{ marginTop: 12 }}>
        {state === 'searching' && (
          <div style={{ fontSize: 13, color: TEC_COLORS.subtext, padding: '6px 0' }}>Checking…</div>
        )}
        {state === 'done' && hits.length === 0 && (
          <div style={{ fontSize: 13, color: TEC_COLORS.subtext, padding: '6px 0', lineHeight: 1.5 }}>
            No match in the verified registry. Zone never shows an entity as verified without evidence —
            an unlisted entity simply isn’t verified yet.
          </div>
        )}
        {hits.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {hits.map((e) => {
              const verified = e.status === 'verified';
              return (
                <Link key={e.handle} href={`/verify/${e.handle}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                  background: TEC_COLORS.bg, border: `1px solid ${verified ? TEC_COLORS.gold + '55' : '#ffffff14'}`,
                  borderRadius: 10, padding: '10px 12px',
                }}>
                  <span style={{ fontSize: 18 }}>{TYPE_ICON[e.type] ?? '•'}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: TEC_COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: TEC_COLORS.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.evidenceCount} evidence record{e.evidenceCount === 1 ? '' : 's'}
                    </span>
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
                    color: verified ? TEC_COLORS.gold : TEC_COLORS.subtext,
                    border: `1px solid ${verified ? TEC_COLORS.gold + '55' : TEC_COLORS.subtext + '55'}`,
                    borderRadius: 999, padding: '2px 9px',
                  }}>
                    {verified ? '🛡️ Verified' : e.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
