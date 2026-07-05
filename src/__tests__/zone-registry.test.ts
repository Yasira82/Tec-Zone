import { describe, it, expect } from 'vitest';
import { REGISTRY, verify, getEntity, listByType } from '@/lib/zone/registry';

describe('TEC Zone — Verified Registry (C-120 V1)', () => {
  it('every entity has evidence with a reviewer + timestamp (C-120 §7)', () => {
    for (const e of REGISTRY) {
      expect(e.evidence.length).toBeGreaterThan(0);
      for (const ev of e.evidence) {
        expect(ev.reviewer).toBeTruthy();
        expect(ev.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
      }
    }
  });

  it('verify() returns the C-120 contract for a known entity', () => {
    const r = verify('tec-zone');
    expect(r).toMatchObject({ id: 'tec-zone', verified: true, status: 'verified' });
    expect(r.verified_at).toBeTruthy();
    expect(r.evidence.length).toBeGreaterThan(0);
  });

  it('verify() fails closed for an unknown id (no throw, not verified)', () => {
    const r = verify('does-not-exist');
    expect(r.verified).toBe(false);
    expect(r.status).toBe('unknown');
    expect(r.evidence).toEqual([]);
    expect(getEntity('does-not-exist')).toBeNull();
  });

  it('projects include the live TEC apps (dogfooding)', () => {
    const ids = listByType('project').map((e) => e.id);
    expect(ids).toContain('tec-hub');
    expect(ids).toContain('tec-zone');
  });
});
