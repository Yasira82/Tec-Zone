import { describe, it, expect, vi, beforeEach } from 'vitest';

// The application record is written by the applicant. The public page must not print the
// reviewer's name on it — on a verified entity that reads as the reviewer having applied
// and approved their own request.
describe('resolvePublicEntity — who added each evidence record', () => {
  beforeEach(() => { vi.resetModules(); process.env.API_GATEWAY_URL = 'http://gw'; });

  it('marks the applicant record, keeps the reviewer on the review record', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: { entity: {
      handle: 'tec-nbf', type: 'PROJECT', name: 'TEC NBF', status: 'VERIFIED', reviewer: 'rev1',
      evidence: [
        { kind: 'application', note: 'x', source: 'applicant', created_at: '2026-10-07T00:00:00Z' },
        { kind: 'review', note: 'VERIFIED by rev1: ok', source: 'zone-reviewer', created_at: '2026-10-30T00:00:00Z' },
      ],
    } } }), { status: 200 })));
    const { resolvePublicEntity } = await import('@/lib/zone/server');
    const { entity } = await resolvePublicEntity('tec-nbf');
    expect(entity?.evidence[0]!.fromApplicant).toBe(true);
    expect(entity?.evidence[1]!.fromApplicant).toBe(false);
    expect(entity?.evidence[1]!.reviewer).toBe('rev1');
  });
});
