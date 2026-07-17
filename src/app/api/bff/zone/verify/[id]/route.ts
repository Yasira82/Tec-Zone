import { NextRequest, NextResponse } from 'next/server';
import { verify, type VerifyResult } from '@/lib/zone/registry';

// C-120 §5 API — GET /api/bff/zone/verify/:id
//   → { id, verified, status, evidence: [...], verified_at }
//
// PUBLIC read (Zone Free — verified status is public by design; this is what lets a
// "Zone Verified" badge embed anywhere). Server-only: calls the real Zone backend
// (zone module in identity-service) via the gateway with the inter-service key; no
// user auth. Falls back to the curated static registry (C-120 §5) if the backend is
// unreachable. Fail closed on a missing record → verified:false, never a throw.
const GW = process.env.API_GATEWAY_URL ?? '';

const gwHeaders = () => ({
  'Content-Type': 'application/json',
  'x-request-id': crypto.randomUUID(),
  ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
});

// backend entity (zone_entities + zone_evidence) → the C-120 §5 verify shape
function fromBackend(e: Record<string, unknown>): VerifyResult {
  const status = String(e.status ?? '').toLowerCase() as VerifyResult['status'];
  const evidence = ((e.evidence ?? []) as Record<string, unknown>[]).map((ev) => ({
    criterion:  String(ev.kind ?? ''),
    detail:     String(ev.note ?? ''),
    reviewer:   String(ev.source ?? (e.reviewer as string) ?? 'zone'),
    recordedAt: String(ev.created_at ?? ''),
  }));
  return {
    id:          String(e.handle ?? ''),
    verified:    status === 'verified',
    status,
    evidence,
    verified_at: (e.verified_at as string) ?? null,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (GW) {
    try {
      const res = await fetch(`${GW}/api/identity/zone/entity/${encodeURIComponent(id)}`, {
        headers: gwHeaders(), cache: 'no-store',
      });
      if (res.ok) {
        const data   = await res.json().catch(() => ({}));
        const entity = data?.data?.entity;
        if (entity) {
          const result = fromBackend(entity);
          return NextResponse.json(result, {
            status: result.verified ? 200 : 404,
            headers: { 'Cache-Control': 'public, max-age=300' },
          });
        }
      }
      if (res.status === 404) {
        return NextResponse.json(
          { id, verified: false, status: 'unknown', evidence: [], verified_at: null },
          { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } },
        );
      }
    } catch { /* fall through to the curated static registry */ }
  }

  const result = verify(id);
  return NextResponse.json(result, {
    status: result.verified ? 200 : 404,
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
