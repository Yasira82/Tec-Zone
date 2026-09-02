'use client';

// TEC Zone — the Verification Runtime of the Pi ecosystem (C-120). Zone answers
// one question: "What can be trusted?" It records evidence and serves verified
// status — it never renders judgement (trust interpretation is Analytics + TEC
// AI, C-120 §4). App shell: Home / Registry / Verify / Settings bottom nav.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePiAuth } from '@yasser172/tec-auth';
import { useMe } from '@/lib-client/hooks/useMe';
import { useTranslation } from '@/lib/i18n';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { InviteCard } from '@/components/referral/InviteCard';
import { BottomNav, type ZoneTab } from './components/BottomNav';
import { SettingsView } from './components/SettingsView';
import { ZonePro } from './components/ZonePro';
import { TrustCheck } from './components/TrustCheck';
import { VerificationPanel } from './components/VerificationPanel';
import { ReviewPanel } from './components/ReviewPanel';
import { ENTITY_TYPES } from '@/lib/zone/registry';

// Flat entity shape served by /api/bff/zone/registry (real backend).
interface RegistryEntity {
  id: string; type: string; name: string; summary: string;
  status: string; verifiedAt: string | null; evidenceCount: number; domain?: string;
}

export default function ZoneHome() {
  const { user, isLoading, isAuthenticated } = usePiAuth();
  const me = useMe(); // server-resolved Pi username (Pi Browser hides tec_user from client JS — C-123 §3)
  const { t } = useTranslation();
  const [tab, setTab] = useState<ZoneTab>('home');

  /**
   * Signed in, as the SERVER sees it.
   *
   * `usePiAuth().isAuthenticated` reads `document.cookie`. Pi Browser stores
   * `tec_user` so the server can read it and client JS cannot (C-123 §3) — so on
   * the only platform this app ships to, that value is always false. Every panel
   * gated on it rendered nothing: the whole verification workflow was invisible
   * to the merchants it exists for.
   *
   * The page already knew this — `useMe()` is a server round-trip and the line
   * above says why. These two call sites were simply missed. The client flag is
   * kept as a fallback for a normal browser, never as the whole answer.
   */
  const signedIn = me.authenticated || isAuthenticated;

  const piName = me.username ?? user?.piUsername ?? null;
  const name = piName ? `@${piName}` : '';

  // Real data end-to-end (C-135 §4): "Zone Verified" is a factual claim — the
  // registry shows only live verified entities, or an honest "unavailable" state.
  const [entities, setEntities] = useState<RegistryEntity[]>([]);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let alive = true;
    fetch('/api/bff/zone/registry')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        if (d && d.source === 'live' && Array.isArray(d.entities)) {
          setEntities(d.entities as RegistryEntity[]);
          setStatus('ready');
        } else {
          setStatus('unavailable');
        }
      })
      .catch(() => { if (alive) setStatus('unavailable'); });
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

  const title =
    tab === 'registry' ? t.zone.nav.registry
    : tab === 'verify' ? t.zone.nav.verify
    : tab === 'settings' ? t.zone.nav.settings
    : (isLoading || !name ? t.zone.welcome : t.zone.welcomeName.replace('{name}', name));

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 22px calc(96px + env(safe-area-inset-bottom))' }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>{t.zone.brand}</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEC_COLORS.gold, margin: '6px 0 0' }}>{title}</h1>
          {tab === 'home' && (
            <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '6px 0 0', lineHeight: 1.6 }}>{t.zone.subtitle}</p>
          )}
        </header>

        {tab === 'home' && (
          <>
            {/* Trust Check — the interactive headline: "is X Zone Verified?" (public read). */}
            <TrustCheck />
            {/* Zone Pro — real Pi U2A payment (also the Pi Portal "Process a Transaction" step) */}
            <ZonePro />
            <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '24px 0 0', lineHeight: 1.5 }}>{t.zone.footer}</p>
            <InviteCard />
          </>
        )}

        {tab === 'verify' && (
          <>
            {/* Verification workflow (C-120 §7) — apply + attach evidence (signed-in only). */}
            <VerificationPanel isAuth={signedIn} authLoading={me.loading} />
            {/* Reviewer console (C-120 §7) — admin-only; hidden unless the queue loads. */}
            <ReviewPanel isAuth={signedIn} />
          </>
        )}

        {tab === 'registry' && (
          <section style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>Verified Registry</h2>
              {status === 'ready' && (
                <span style={{ fontSize: 11, color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}33`, borderRadius: 999, padding: '2px 10px' }}>V1 · live registry</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '6px 0 14px', lineHeight: 1.5 }}>
              Evidence-based, human-reviewed verification — “Zone Verified” is earned, never
              bought. Tap an entity to see its evidence.
            </p>

            {status === 'loading' && (
              <div style={{ fontSize: 13, color: TEC_COLORS.subtext, padding: '20px 0', textAlign: 'center' }}>Loading the verified registry…</div>
            )}
            {status === 'unavailable' && (
              <div style={{ background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 12, padding: 20, textAlign: 'center', color: TEC_COLORS.subtext, fontSize: 13 }}>
                The verified registry is unavailable right now. Please try again shortly — Zone never shows
                unconfirmed entities as verified.
              </div>
            )}

            {status === 'ready' && ENTITY_TYPES.map(({ type, icon, title: groupTitle, blurb }) => {
              const group = entities.filter((e) => e.type === type);
              return (
                <div key={type} style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: TEC_COLORS.text }}>{groupTitle}</span>
                    <span style={{ fontSize: 11, color: TEC_COLORS.subtext }}>· {group.length}</span>
                  </div>
                  <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '2px 0 10px' }}>{blurb}</p>

                  {group.length === 0 ? (
                    <div style={{ fontSize: 12, color: TEC_COLORS.subtext, fontStyle: 'italic', padding: '4px 0' }}>
                      No verified {groupTitle.toLowerCase()} yet — verification opens with Commerce activity (V2).
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
        )}

        {tab === 'settings' && <SettingsView />}
      </div>

      <BottomNav active={tab} onSelect={setTab} />
    </main>
  );
}
