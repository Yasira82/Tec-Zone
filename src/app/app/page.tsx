'use client';

// TEC Zone — the Verification Runtime of the Pi ecosystem (C-120). Zone answers
// one question: "What can be trusted?" It records evidence and serves verified
// status — it never renders judgement (trust interpretation is Analytics + TEC
// AI, C-120 §4). V1 = a manually-curated static Verified Registry; the first
// verified entities are the live TEC apps (dogfooding).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePiAuth } from '@yasser172/tec-auth';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { ZonePro } from './components/ZonePro';
import { ENTITY_TYPES, REGISTRY } from '@/lib/zone/registry';

// Flat entity shape served by /api/bff/zone/registry (real backend, sample fallback).
interface RegistryEntity {
  id: string; type: string; name: string; summary: string;
  status: string; verifiedAt: string | null; evidenceCount: number; domain?: string;
}

// Initial state = the curated static registry (renders instantly / SSR), replaced
// by the live backend registry once the BFF responds.
const initialEntities: RegistryEntity[] = REGISTRY.map((e) => ({
  id: e.id, type: e.type, name: e.name, summary: e.summary,
  status: e.status, verifiedAt: e.verifiedAt, evidenceCount: e.evidence.length, domain: e.domain,
}));

export default function ZoneHome() {
  const { user, isLoading } = usePiAuth();
  const name = user?.piUsername ? `@${user.piUsername}` : 'there';

  const [entities, setEntities] = useState<RegistryEntity[]>(initialEntities);
  const [source, setSource]     = useState<'sample' | 'live'>('sample');

  useEffect(() => {
    let alive = true;
    fetch('/api/bff/zone/registry')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.entities) return;
        setEntities(d.entities as RegistryEntity[]);
        setSource(d.source === 'live' ? 'live' : 'sample');
      })
      .catch(() => { /* keep the static registry */ });
    return () => { alive = false; };
  }, []);

  const entityCard: React.CSSProperties = {
    display: 'block', textDecoration: 'none',
    background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`,
    borderRadius: 12, padding: 14,
  };
  const badge: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, color: TEC_COLORS.gold,
    border: `1px solid ${TEC_COLORS.gold}55`, borderRadius: 999, padding: '2px 8px',
    whiteSpace: 'nowrap',
  };

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text, padding: '32px 22px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>TEC Zone · Verification Runtime</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEC_COLORS.gold, margin: '6px 0 0' }}>
            {isLoading ? 'Welcome' : `Welcome, ${name}`}
          </h1>
          <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '6px 0 0', lineHeight: 1.6 }}>
            The trust layer of the Pi ecosystem. Zone answers one question —
            <strong style={{ color: TEC_COLORS.text }}> “What can be trusted?”</strong> — by
            recording evidence, not by claiming authority (C-120).
          </p>
        </header>

        {/* Zone Pro — real Pi U2A payment (also the Pi Portal "Process a Transaction" step) */}
        <ZonePro />

        {/* Verified Registry — V1 static registry (manual curation, C-120 §5). */}
        <section style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>Verified Registry</h2>
            <span style={{ fontSize: 11, color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}33`, borderRadius: 999, padding: '2px 10px' }}>V1 · {source === 'live' ? 'live registry' : 'sample'}</span>
          </div>
          <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '6px 0 14px', lineHeight: 1.5 }}>
            Evidence-based, human-reviewed verification — “Zone Verified” is earned, never
            bought (C-120 §7). Tap an entity to see its evidence.
          </p>

          {ENTITY_TYPES.map(({ type, icon, title, blurb }) => {
            const group = entities.filter((e) => e.type === type);
            return (
              <div key={type} style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: TEC_COLORS.text }}>{title}</span>
                  <span style={{ fontSize: 11, color: TEC_COLORS.subtext }}>· {group.length}</span>
                </div>
                <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '2px 0 10px' }}>{blurb}</p>

                {group.length === 0 ? (
                  <div style={{ fontSize: 12, color: TEC_COLORS.subtext, fontStyle: 'italic', padding: '4px 0' }}>
                    No verified {title.toLowerCase()} yet — verification opens with Commerce activity (V2).
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    {group.map((e) => {
                      const isVerified = e.status === 'verified';
                      return (
                        <Link key={e.id} href={`/verify/${e.id}`} style={entityCard}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: TEC_COLORS.text }}>{e.name}</span>
                            <span style={{ ...badge, color: isVerified ? TEC_COLORS.gold : TEC_COLORS.subtext, borderColor: isVerified ? `${TEC_COLORS.gold}55` : `${TEC_COLORS.subtext}55` }}>
                              {isVerified ? '🛡️ Verified' : e.status}
                            </span>
                          </div>
                          {e.domain && <div style={{ fontSize: 11, color: TEC_COLORS.gold, marginTop: 3 }}>{e.domain}</div>}
                          <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 5, lineHeight: 1.5 }}>{e.summary}</div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '24px 0 0', lineHeight: 1.5 }}>
          Zone records evidence; it does not compute trust scores or render judgement —
          those belong to Analytics and TEC AI (C-120 §4). Identity, payment, and asset
          truth stay with their owning services and are referenced by ID only.
        </p>
      </div>
    </main>
  );
}
