'use client';

// TEC Zone — share / embed the "Zone Verified" badge. This is how Zone reaches the
// wider Pi ecosystem: a verified project puts the badge on its OWN site/app, and it
// always reflects the live verdict (the SVG is served from Zone). The badge links back
// to the public evidence page — proof anyone in Pi can check. "Zone Verified" is earned,
// never bought (C-120 §7); this only lets an already-verified entity broadcast it.
import { useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard blocked — the value is visible to select manually */ }
  }
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <code style={{
          flex: 1, minWidth: 0, background: TEC_COLORS.bg, color: TEC_COLORS.text,
          border: `1px solid ${TEC_COLORS.gold}33`, borderRadius: 8, padding: '9px 11px',
          fontSize: 12, overflowX: 'auto', whiteSpace: 'nowrap',
        }}>{value}</code>
        <button onClick={copy} style={{
          background: copied ? TEC_COLORS.success : TEC_COLORS.gold, color: '#0a0800', border: 'none',
          borderRadius: 8, padding: '0 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
    </div>
  );
}

export default function ShareBadge({ handle }: { handle: string }) {
  // Absolute URLs so the copied snippets work when pasted on ANY external site.
  const [origin] = useState(() => (typeof window !== 'undefined' ? window.location.origin : 'https://zone.tecosystem.app'));
  const verifyUrl = `${origin}/verify/${handle}`;
  const badgeUrl  = `${origin}/badge/${handle}.svg`;
  const embed = `<a href="${verifyUrl}"><img src="${badgeUrl}" alt="Zone Verified" height="20"></a>`;

  return (
    <section style={{ marginTop: 26, background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🔗</span>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>Share your verification</h2>
      </div>
      <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '6px 0 12px', lineHeight: 1.5 }}>
        Put the live badge on your own site or app — anyone in the Pi ecosystem can tap it to see the evidence.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: TEC_COLORS.subtext }}>Preview:</span>
        <img src={`/badge/${handle}.svg`} alt="Zone Verified badge" height={20} />
      </div>

      <CopyRow label="Verification link" value={verifyUrl} />
      <CopyRow label="Embed code (HTML)" value={embed} />
    </section>
  );
}
