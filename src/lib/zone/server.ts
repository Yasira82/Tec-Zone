// Server-only Zone backend access for the verification WORKFLOW (C-120 §7). Talks
// to the real Zone module (tec-identity-service) through the gateway. Writes forward
// the caller's verified JWT as `Authorization: Bearer` so the backend derives the
// owner from the token (never the body — P6); reviewer authorization (ADMIN) is
// enforced by the backend. Reads of verified status stay public (registry / verify).
// NEW-A: the gateway URL is server-only (API_GATEWAY_URL) — never shipped to the client.
const GW = process.env.API_GATEWAY_URL ?? '';

const gwHeaders = (token?: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-request-id': crypto.randomUUID(),
  ...(token && { Authorization: `Bearer ${token}` }),
  ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
});

export interface ZoneCallResult {
  ok: boolean;
  status: number;
  data?: unknown;   // the backend's `data` payload (entity | submissions)
  error?: string;
}

async function call(
  path: string, token: string, method: 'GET' | 'POST' | 'PATCH', body?: unknown,
): Promise<ZoneCallResult> {
  if (!GW) return { ok: false, status: 503, error: 'Gateway not configured' };
  try {
    const res = await fetch(`${GW}${path}`, {
      method,
      headers: gwHeaders(token),
      ...(body !== undefined && { body: JSON.stringify(body) }),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, status: res.status, data: json?.data ?? json };
    return { ok: false, status: res.status, error: String(json?.message ?? json?.error ?? 'Request failed') };
  } catch (err) {
    return { ok: false, status: 503, error: (err as Error).message };
  }
}

// ── Public verified-entity read (verify/[id]) ─────────────────
// "Zone Verified" is a factual claim backed by evidence — the detail page reads it
// LIVE from the backend, never from a static sample (C-120 §4 / C-135 §4). An
// unreachable backend resolves to `unavailable`; a live 404 to `not-found`.
export interface PublicEvidence { criterion: string; detail: string; reviewer: string; recordedAt: string; }
export interface PublicEntity {
  id: string; type: string; name: string; summary: string;
  status: string; verifiedAt: string | null; domain?: string;
  evidence: PublicEvidence[];
}
export type EntitySource = 'live' | 'not-found' | 'unavailable';

const day = (v: unknown) => (v ? String(v).slice(0, 10) : '');

export async function resolvePublicEntity(
  handle: string,
): Promise<{ entity: PublicEntity | null; source: EntitySource }> {
  if (!GW) return { entity: null, source: 'unavailable' };
  try {
    const res = await fetch(`${GW}/api/identity/zone/entity/${encodeURIComponent(handle)}`, {
      headers: gwHeaders(), cache: 'no-store',
    });
    if (res.status === 404) return { entity: null, source: 'not-found' };
    if (res.ok) {
      const e = (await res.json().catch(() => ({})))?.data?.entity as Record<string, unknown> | undefined;
      if (e) {
        const rows = Array.isArray(e.evidence) ? (e.evidence as Record<string, unknown>[]) : [];
        return {
          entity: {
            id:         String(e.handle ?? handle),
            type:       String(e.type ?? '').toLowerCase(),
            name:       String(e.name ?? ''),
            summary:    String(e.summary ?? ''),
            status:     String(e.status ?? '').toLowerCase(),
            verifiedAt: e.verified_at ? day(e.verified_at) : null,
            domain:     e.domain ? String(e.domain) : undefined,
            evidence:   rows.map((ev): PublicEvidence => ({
              criterion:  String(ev.kind ?? ''),
              detail:     String(ev.note ?? ''),
              reviewer:   String(ev.reviewer ?? e.reviewer ?? 'Zone reviewer'),
              recordedAt: day(ev.created_at),
            })),
          },
          source: 'live',
        };
      }
    }
  } catch { /* unreachable → unavailable */ }
  return { entity: null, source: 'unavailable' };
}

/** The caller's OWN verification submissions. */
export const listMySubmissions = (token: string) =>
  call('/api/identity/zone/my/submissions', token, 'GET');

/** The PENDING review queue (ADMIN only — the backend returns 403 for non-admins). */
export const listReviewQueue = (token: string) =>
  call('/api/identity/zone/review/queue', token, 'GET');

/** Submit an entity for verification (starts PENDING — never self-verified, C-120 §7). */
export const submitVerification = (
  token: string, body: { type: string; name: string; summary?: string; note?: string },
) => call('/api/identity/zone/verification', token, 'POST', body);

/** Append append-only supporting evidence to the caller's own PENDING submission. */
export const appendEvidence = (
  token: string, handle: string, body: { kind: string; note: string },
) => call(`/api/identity/zone/entity/${encodeURIComponent(handle)}/evidence`, token, 'POST', body);

/** Reviewer decision (VERIFY | REVOKE) — the backend enforces the ADMIN role + sign-off. */
export const reviewDecision = (
  token: string, handle: string, body: { decision: 'VERIFY' | 'REVOKE'; note: string },
) => call(`/api/identity/zone/entity/${encodeURIComponent(handle)}/review`, token, 'PATCH', body);
