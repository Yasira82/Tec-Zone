'use client';

// TEC Zone — the Verification Runtime of the Pi ecosystem (C-120). Zone answers
// one question: "What can be trusted?" It records evidence and serves verified
// status — it never renders judgement (trust interpretation is Analytics + TEC
// AI). V0 = Portal-ready scaffold + Zone Pro payment surface; the verified
// registry (Projects / Merchants / Builders) ships in V1, post-Portal.
import { usePiAuth } from '@yasser172/tec-auth';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { ZonePro } from './components/ZonePro';

const REGISTRY = [
  { icon: '🏗️', title: 'Projects',  body: 'Pi ecosystem projects — TEC and non-TEC.' },
  { icon: '🛍️', title: 'Merchants', body: 'Pi-accepting businesses, verified by evidence.' },
  { icon: '👷', title: 'Builders',  body: 'Developers, founders, and contributors.' },
];

export default function ZoneHome() {
  const { user, isLoading } = usePiAuth();
  const name = user?.piUsername ? `@${user.piUsername}` : 'there';

  const cardBase: React.CSSProperties = {
    background:   TEC_COLORS.surface,
    border:       `1px solid ${TEC_COLORS.gold}22`,
    borderRadius: 14,
    padding:      16,
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

        {/* Verified Registry — ships in V1 (post-Portal). Honest placeholder. */}
        <section style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>Verified Registry</h2>
            <span style={{ fontSize: 11, color: TEC_COLORS.subtext, border: `1px solid ${TEC_COLORS.gold}33`, borderRadius: 999, padding: '2px 10px' }}>V1 · coming soon</span>
          </div>
          <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '6px 0 14px', lineHeight: 1.5 }}>
            After Portal submission, Zone lists verified entities. Verification is
            evidence-based and human-reviewed — “Zone Verified” is earned, never bought.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {REGISTRY.map((r) => (
              <div key={r.title} style={cardBase}>
                <div style={{ fontSize: 20 }}>{r.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: TEC_COLORS.text, marginTop: 6 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 4, lineHeight: 1.5 }}>{r.body}</div>
              </div>
            ))}
          </div>
        </section>

        <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '22px 0 0', lineHeight: 1.5 }}>
          Zone records evidence; it does not compute trust scores or render judgement —
          those belong to Analytics and TEC AI (C-120 §4). Identity, payment, and asset
          truth stay with their owning services and are referenced by ID only.
        </p>
      </div>
    </main>
  );
}
