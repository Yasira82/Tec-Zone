import { NextRequest } from 'next/server';
import { resolvePublicEntity } from '@/lib/zone/server';

// GET /badge/<handle>.svg — a public, embeddable "Zone Verified" badge (SVG) for ANY
// Pi project/merchant, reading the LIVE verified status (C-120 §4 — never a static
// claim). This is Zone's outward reach into the whole Pi ecosystem: a verified project
// embeds <img src="https://zone.tecosystem.app/badge/<handle>.svg"> on its own site/app
// and it always reflects the current verdict (verified · pending · not verified · revoked).
// Public read; no auth. Cached briefly at the edge.
export const dynamic = 'force-dynamic';

// Shields-style two-segment badge. Width is derived from the message text so it never
// clips. Text is plain (no emoji — emoji rendering in <img>-embedded SVG is unreliable);
// a drawn shield check carries the meaning.
function badgeSvg(message: string, color: string): string {
  const CH = 6.6;                       // approx px per char at 11px system font
  const labelText = 'Zone';
  const labelW = Math.round(10 + labelText.length * CH + 16); // + room for the shield mark
  const msgW   = Math.round(14 + message.length * CH);
  const w = labelW + msgW;
  const h = 20;
  const labelMid = (labelW + 16) / 2 + 2;   // shift right past the shield glyph
  const msgMid   = labelW + msgW / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="Zone: ${message}">
  <title>Zone: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${w}" height="${h}" rx="4" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${h}" fill="#0B1020"/>
    <rect x="${labelW}" width="${msgW}" height="${h}" fill="${color}"/>
    <rect width="${w}" height="${h}" fill="url(#s)"/>
  </g>
  <g transform="translate(6,3.2)" fill="#FBBF24" aria-hidden="true">
    <path d="M7 0 L13 2 V6.5 C13 10.5 10.5 13 7 14 C3.5 13 1 10.5 1 6.5 V2 Z" fill="#FBBF24" opacity="0.95"/>
    <path d="M4.2 6.8 L6.2 8.8 L10 4.6" stroke="#0B1020" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelMid}" y="14" fill="#010101" fill-opacity=".3">${labelText}</text>
    <text x="${labelMid}" y="13">${labelText}</text>
    <text x="${msgMid}" y="14" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${msgMid}" y="13">${message}</text>
  </g>
</svg>`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const id = handle.replace(/\.svg$/i, '').trim();

  let message = 'not verified';
  let color = '#6b7280';               // gray — no verdict
  try {
    const { entity } = await resolvePublicEntity(id);
    if (entity?.status === 'verified')      { message = 'Verified';       color = '#16a34a'; }
    else if (entity?.status === 'pending')  { message = 'pending review'; color = '#a16207'; }
    else if (entity?.status === 'revoked')  { message = 'revoked';        color = '#b91c1c'; }
  } catch { /* unreachable → "not verified" gray, fail-safe */ }

  return new Response(badgeSvg(message, color), {
    headers: {
      'content-type':  'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
}
