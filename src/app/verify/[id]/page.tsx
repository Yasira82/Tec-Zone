// TEC Zone — public verification page (C-120 V1). Shows the verified status and
// the append-only evidence for one entity. Public (Zone Free, C-120 §8): anyone
// can browse verified entities and their evidence. Zone records evidence — it
// does not render a trust score (C-120 §4).
import Link from 'next/link';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { resolvePublicEntity } from '@/lib/zone/server';
import ShareBadge from './ShareBadge';

// Rendered dynamically from the live Zone read-layer — "Zone Verified" is a factual
// claim backed by evidence and is NEVER served from a static sample (C-120 §4 /
// C-135 §4): a live 404 is "not in the registry"; an unreachable backend is an
// honest "temporarily unavailable".
export const dynamic = 'force-dynamic';

const TYPE_LABEL: Record<string, string> = {
  project: 'Project', merchant: 'Merchant', builder: 'Builder', community: 'Community',
};

export default async function VerifyPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { entity, source } = await resolvePublicEntity(id);

  const wrap: React.CSSProperties = {
    minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text,
    padding: '32px 22px', fontFamily: 'system-ui, -apple-system, sans-serif',
  };
  const inner: React.CSSProperties = { maxWidth: 680, margin: '0 auto' };

  if (!entity) {
    const unavailable = source === 'unavailable';
    return (
      <main style={wrap}>
        <div style={inner}>
          <Link href="/app" style={{ fontSize: 13, color: TEC_COLORS.gold, textDecoration: 'none' }}>← Verified Registry</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: TEC_COLORS.text, marginTop: 16 }}>
            {unavailable ? 'Registry temporarily unavailable' : 'Not in the registry'}
          </h1>
          <p style={{ fontSize: 13, color: TEC_COLORS.subtext, lineHeight: 1.6 }}>
            {unavailable
              ? <>The Zone verification service is unavailable right now. Please try again shortly — Zone never shows an entity as verified without live evidence.</>
              : <>No verified entity with id <code>{id}</code>. A missing record is not a negative verdict — Zone only asserts what evidence confirms (C-120 §4).</>}
          </p>
        </div>
      </main>
    );
  }

  const verified = entity.status === 'verified';
  const statusColor = verified ? TEC_COLORS.success : entity.status === 'revoked' ? TEC_COLORS.error : TEC_COLORS.subtext;

  return (
    <main style={wrap}>
      <div style={inner}>
        <Link href="/app" style={{ fontSize: 13, color: TEC_COLORS.gold, textDecoration: 'none' }}>← Verified Registry</Link>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>
              {TYPE_LABEL[entity.type] ?? entity.type}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: TEC_COLORS.text, margin: '4px 0 0' }}>{entity.name}</h1>
            {entity.domain && <div style={{ fontSize: 13, color: TEC_COLORS.gold, marginTop: 2 }}>{entity.domain}</div>}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 800, color: verified ? '#0a0800' : TEC_COLORS.text,
            background: verified ? `linear-gradient(135deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})` : 'transparent',
            border: verified ? 'none' : `1px solid ${statusColor}`,
            borderRadius: 999, padding: '6px 14px', whiteSpace: 'nowrap',
          }}>
            {verified ? '🛡️ Zone Verified' : entity.status === 'revoked' ? 'Revoked' : 'Pending review'}
          </div>
        </div>

        <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '14px 0 0', lineHeight: 1.6 }}>{entity.summary}</p>
        {entity.verifiedAt && (
          <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '8px 0 0' }}>Verified {entity.verifiedAt}</p>
        )}

        {/* Share / embed — only a genuinely verified entity may broadcast the badge
            (C-120 §7 — earned, never bought). This is Zone's reach into all of Pi. */}
        {verified && <ShareBadge handle={entity.id} />}

        <h2 style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.text, margin: '26px 0 4px' }}>Evidence</h2>
        <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '0 0 14px', lineHeight: 1.5 }}>
          Append-only — every record carries a human reviewer and a timestamp (C-120 §7).
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          {entity.evidence.map((ev, i) => (
            <div key={i} style={{ background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: TEC_COLORS.success, fontWeight: 900 }}>✓</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: TEC_COLORS.text }}>{ev.criterion}</span>
              </div>
              <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 6, lineHeight: 1.5 }}>{ev.detail}</div>
              <div style={{ fontSize: 11, color: TEC_COLORS.subtext, marginTop: 8, opacity: 0.8 }}>
                Reviewer: {ev.reviewer} · {ev.recordedAt}
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '22px 0 0', lineHeight: 1.5 }}>
          “Verified” = evidence confirmed. “Trusted” is the interpretation of that evidence
          by Analytics and TEC AI — a different function (C-120 §4). This page is the
          evidence, not a score.
        </p>
      </div>
    </main>
  );
}
