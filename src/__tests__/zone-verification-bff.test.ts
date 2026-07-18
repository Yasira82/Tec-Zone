// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// TEC Zone — verification workflow BFF (C-120 §7). These tests lock the contract:
// the write routes forward the session JWT as Bearer (owner derived server-side,
// never the body — P6), validate before hitting the backend, and pass backend
// status codes (401/409/403) through unchanged.

const GW = 'https://api.example.com';

const makeReq = (opts: { cookies?: Record<string, string>; body?: unknown; method?: string; url?: string }) => {
  const cookieStr = opts.cookies
    ? Object.entries(opts.cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ')
    : '';
  const headers: Record<string, string> = {};
  if (cookieStr) headers['Cookie'] = cookieStr;
  return new NextRequest(opts.url ?? 'http://localhost/api/bff/zone/verification', {
    method:  opts.method ?? 'POST',
    headers,
    body:    opts.body ? JSON.stringify(opts.body) : undefined,
  });
};

const okJson = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300, status, json: async () => ({ data }),
});
const errJson = (message: string, status: number) => ({
  ok: false, status, json: async () => ({ message }),
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_GATEWAY_URL = GW;
  process.env.INTERNAL_SECRET = 'secret';
});

describe('POST /api/bff/zone/verification (submit)', () => {
  it('returns 401 without an access token', async () => {
    const { POST } = await import('@/app/api/bff/zone/verification/route');
    const res = await POST(makeReq({ body: { type: 'MERCHANT', name: 'Pi Cafe' } }));
    expect(res.status).toBe(401);
  });

  it('forwards the JWT as Bearer + x-internal-key and sends NO owner (P6)', async () => {
    global.fetch = vi.fn().mockResolvedValue(okJson({ entity: { handle: 'pi-cafe', status: 'PENDING' } }, 201));
    const { POST } = await import('@/app/api/bff/zone/verification/route');
    const res = await POST(makeReq({
      cookies: { tec_access_token: 'jwt-123' },
      body:    { type: 'merchant', name: 'Pi Cafe', summary: 'coffee in Pi' },
    }));
    expect(res.status).toBe(201);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe(`${GW}/api/identity/zone/verification`);
    expect(init.headers.Authorization).toBe('Bearer jwt-123');
    expect(init.headers['x-internal-key']).toBe('secret');
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject({ type: 'MERCHANT', name: 'Pi Cafe' });
    expect(sent.owner).toBeUndefined();
  });

  it('rejects an invalid type at the BFF (no backend call)', async () => {
    global.fetch = vi.fn();
    const { POST } = await import('@/app/api/bff/zone/verification/route');
    const res = await POST(makeReq({ cookies: { tec_access_token: 'jwt-123' }, body: { type: 'NOPE', name: 'X' } }));
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('passes a backend 409 (one pending request per owner) through', async () => {
    global.fetch = vi.fn().mockResolvedValue(errJson('You already have a pending verification request', 409));
    const { POST } = await import('@/app/api/bff/zone/verification/route');
    const res = await POST(makeReq({ cookies: { tec_access_token: 'jwt-123' }, body: { type: 'PROJECT', name: 'Another' } }));
    expect(res.status).toBe(409);
  });
});

describe('POST /api/bff/zone/entity/:handle/evidence (append)', () => {
  it('forwards evidence to the backend entity path (owner-scoped upstream)', async () => {
    global.fetch = vi.fn().mockResolvedValue(okJson({ entity: { handle: 'pi-cafe' } }));
    const { POST } = await import('@/app/api/bff/zone/entity/[handle]/evidence/route');
    const res = await POST(
      makeReq({ cookies: { tec_access_token: 'jwt-123' }, body: { note: 'Pi SSO verified' }, url: 'http://localhost/api/bff/zone/entity/pi-cafe/evidence' }),
      { params: Promise.resolve({ handle: 'pi-cafe' }) },
    );
    expect(res.status).toBe(200);
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toBe(`${GW}/api/identity/zone/entity/pi-cafe/evidence`);
  });

  it('rejects an empty note (no backend call)', async () => {
    global.fetch = vi.fn();
    const { POST } = await import('@/app/api/bff/zone/entity/[handle]/evidence/route');
    const res = await POST(
      makeReq({ cookies: { tec_access_token: 'jwt-123' }, body: { note: '' }, url: 'http://localhost/api/bff/zone/entity/pi-cafe/evidence' }),
      { params: Promise.resolve({ handle: 'pi-cafe' }) },
    );
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/bff/zone/entity/:handle/review (reviewer decision)', () => {
  it('forwards VERIFY as a PATCH to the backend review route', async () => {
    global.fetch = vi.fn().mockResolvedValue(okJson({ entity: { handle: 'pi-cafe', status: 'VERIFIED' } }));
    const { PATCH } = await import('@/app/api/bff/zone/entity/[handle]/review/route');
    const res = await PATCH(
      makeReq({ method: 'PATCH', cookies: { tec_access_token: 'jwt-admin' }, body: { decision: 'verify', note: 'criteria met' }, url: 'http://localhost/api/bff/zone/entity/pi-cafe/review' }),
      { params: Promise.resolve({ handle: 'pi-cafe' }) },
    );
    expect(res.status).toBe(200);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${GW}/api/identity/zone/entity/pi-cafe/review`);
    expect(init.method).toBe('PATCH');
  });

  it('passes a backend 403 (non-admin) through to the caller', async () => {
    global.fetch = vi.fn().mockResolvedValue(errJson('Reviewer role required', 403));
    const { PATCH } = await import('@/app/api/bff/zone/entity/[handle]/review/route');
    const res = await PATCH(
      makeReq({ method: 'PATCH', cookies: { tec_access_token: 'jwt-user' }, body: { decision: 'VERIFY', note: 'note' }, url: 'http://localhost/api/bff/zone/entity/pi-cafe/review' }),
      { params: Promise.resolve({ handle: 'pi-cafe' }) },
    );
    expect(res.status).toBe(403);
  });

  it('rejects an invalid decision at the BFF (no backend call)', async () => {
    global.fetch = vi.fn();
    const { PATCH } = await import('@/app/api/bff/zone/entity/[handle]/review/route');
    const res = await PATCH(
      makeReq({ method: 'PATCH', cookies: { tec_access_token: 'jwt-admin' }, body: { decision: 'MAYBE', note: 'x' }, url: 'http://localhost/api/bff/zone/entity/pi-cafe/review' }),
      { params: Promise.resolve({ handle: 'pi-cafe' }) },
    );
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('GET /api/bff/zone/review/queue (admin review queue)', () => {
  it('returns 401 without a token', async () => {
    const { GET } = await import('@/app/api/bff/zone/review/queue/route');
    const res = await GET(makeReq({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('forwards the JWT and returns the queue for an admin', async () => {
    global.fetch = vi.fn().mockResolvedValue(okJson({ queue: [{ handle: 'pi-cafe', status: 'PENDING' }] }));
    const { GET } = await import('@/app/api/bff/zone/review/queue/route');
    const res  = await GET(makeReq({ method: 'GET', cookies: { tec_access_token: 'jwt-admin' } }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.queue[0].handle).toBe('pi-cafe');
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe(`${GW}/api/identity/zone/review/queue`);
    expect(init.headers.Authorization).toBe('Bearer jwt-admin');
  });

  it('passes a backend 403 (non-admin) through so the UI hides the panel', async () => {
    global.fetch = vi.fn().mockResolvedValue(errJson('Reviewer role required', 403));
    const { GET } = await import('@/app/api/bff/zone/review/queue/route');
    const res = await GET(makeReq({ method: 'GET', cookies: { tec_access_token: 'jwt-user' } }));
    expect(res.status).toBe(403);
  });
});
