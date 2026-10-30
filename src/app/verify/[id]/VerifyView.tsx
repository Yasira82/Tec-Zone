'use client';

// The public evidence page's view (C-120 V1) — the words in the reader's language.
import Link from 'next/link';
import { TEC_COLORS } from '@yasser172/tec-ui';
import type { EntitySource, PublicEntity } from '@/lib/zone/server';
import { useZoneCopy } from '@/lib/zone/copy';
import { useTranslation } from '@/lib/i18n';
import { localSummary, localNote, kindLabel } from '@/lib/zone/seed-text';
import { Icon } from '@/app/app/components/Icon';
import ShareBadge from './ShareBadge';

export function VerifyView({ entity, source }: { entity: PublicEntity | null; source: EntitySource }) {
  const c = useZoneCopy();
  const { locale } = useTranslation();
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
          <Link href="/app" style={{ fontSize: 13, color: TEC_COLORS.gold, textDecoration: 'none' }}>{c.page.back}</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: TEC_COLORS.text, marginTop: 16 }}>
            {unavailable ? c.page.unavailableTitle : c.page.missingTitle}
          </h1>
          <p style={{ fontSize: 13, color: TEC_COLORS.subtext, lineHeight: 1.6 }}>
            {unavailable ? c.page.unavailableBody : c.page.missingBody}
          </p>
        </div>
      </main>
    );
  }

  const verified = entity.status === 'verified';
  const statusColor = verified ? TEC_COLORS.success : entity.status === 'revoked' ? TEC_COLORS.error : TEC_COLORS.subtext;
  const kind = entity.type as keyof typeof c.type;

  return (
    <main style={wrap}>
      <div style={inner}>
        <Link href="/app" style={{ fontSize: 13, color: TEC_COLORS.gold, textDecoration: 'none' }}>{c.page.back}</Link>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>
              {c.type[kind] ?? entity.type}
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
            {verified
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="shield" size={14} strokeWidth={2.2} />{c.page.badge}</span>
              : c.status[entity.status] ?? entity.status}
          </div>
        </div>

        <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '14px 0 0', lineHeight: 1.6 }}>{localSummary(entity.summary, locale)}</p>
        {entity.verifiedAt && (
          <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '8px 0 0' }}>{c.page.verifiedOn(entity.verifiedAt)}</p>
        )}

        {/* Share / embed — only a genuinely verified entity may broadcast the badge
            (C-120 §7 — earned, never bought). This is Zone's reach into all of Pi. */}
        {verified && <ShareBadge handle={entity.id} />}

        <h2 style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.text, margin: '26px 0 4px' }}>{c.page.evidence}</h2>
        <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '0 0 14px', lineHeight: 1.5 }}>
          {c.page.evidenceHint}
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          {entity.evidence.map((ev, i) => (
            <div key={i} style={{ background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="check" size={15} color={TEC_COLORS.success} strokeWidth={2.6} />
                <span style={{ fontSize: 14, fontWeight: 800, color: TEC_COLORS.text }}>{kindLabel(ev.criterion, locale)}</span>
              </div>
              <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 6, lineHeight: 1.5 }}>{localNote(ev.detail, locale)}</div>
              <div style={{ fontSize: 11, color: TEC_COLORS.subtext, marginTop: 8, opacity: 0.8 }}>
                {ev.fromApplicant ? c.page.byApplicant : <>{c.page.reviewer}: <bdi>{ev.reviewer}</bdi></>} · <bdi>{ev.recordedAt}</bdi>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '22px 0 0', lineHeight: 1.5 }}>
          {c.page.footer}
        </p>
      </div>
    </main>
  );
}
