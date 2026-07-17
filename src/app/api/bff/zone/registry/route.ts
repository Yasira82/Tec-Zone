import { NextResponse } from 'next/server';
import { REGISTRY } from '@/lib/zone/registry';

// GET /api/bff/zone/registry — the public verified registry (C-120).
// Server-only: calls the real Zone backend (zone module in identity-service) via
// the gateway. Zone verified status is PUBLIC (consumed by Hub → Zone → Analytics),
// so no auth is required — only the inter-service key. Falls back to the curated
// static registry (C-120 §5) if the backend is unreachable, so the app degrades
// gracefully. NEW-A: the gateway URL is server-only (API_GATEWAY_URL), never shipped.
const GW = process.env.API_GATEWAY_URL ?? '';

const gwHeaders = () => ({
  'Content-Type': 'application/json',
  'x-request-id': crypto.randomUUID(),
  ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
});

interface Entity {
  id: string; type: string; name: string; summary: string;
  status: string; verifiedAt: string | null; evidenceCount: number;
}

// backend (zone_entities) → frontend shape
function fromBackend(e: Record<string, unknown>): Entity {
  return {
    id:            String(e.handle ?? ''),
    type:          String(e.type ?? '').toLowerCase(),
    name:          String(e.name ?? ''),
    summary:       (e.summary as string) ?? '',
    status:        String(e.status ?? '').toLowerCase(),
    verifiedAt:    (e.verified_at as string) ?? null,
    evidenceCount: ((e._count as { evidence?: number })?.evidence) ?? 0,
  };
}

const sampleEntities = (): Entity[] =>
  REGISTRY.map((e) => ({
    id: e.id, type: e.type, name: e.name, summary: e.summary,
    status: e.status, verifiedAt: e.verifiedAt, evidenceCount: e.evidence.length,
  }));

export async function GET() {
  if (GW) {
    try {
      const res = await fetch(`${GW}/api/identity/zone/registry`, { headers: gwHeaders(), cache: 'no-store' });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const raw  = (data?.data?.entities ?? []) as Record<string, unknown>[];
        if (Array.isArray(raw) && raw.length) {
          return NextResponse.json(
            { source: 'live', entities: raw.map(fromBackend) },
            { headers: { 'Cache-Control': 'public, max-age=60' } },
          );
        }
      }
    } catch { /* fall through to the curated static registry */ }
  }
  return NextResponse.json(
    { source: 'sample', entities: sampleEntities() },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  );
}
