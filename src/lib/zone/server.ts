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

/** The caller's OWN verification submissions. */
export const listMySubmissions = (token: string) =>
  call('/api/identity/zone/my/submissions', token, 'GET');

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
