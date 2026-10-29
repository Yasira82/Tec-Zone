import { describe, it, expect } from 'vitest';
import { localSummary, localNote, kindLabel, sourceLabel } from '@/lib/zone/seed-text';

// Zone's own fixed English sentences read in Arabic in the Arabic app; a person's own
// words are never touched.
describe('seed text', () => {
  it('a seeded summary is Arabic in ar and unchanged in en', () => {
    const s = 'Verification Runtime — the trust layer of the Pi ecosystem.';
    expect(localSummary(s, 'ar')).toMatch(/[؀-ۿ]/);
    expect(localSummary(s, 'en')).toBe(s);
  });

  it('the fixed evidence notes keep their one variable part', () => {
    expect(localNote('TEC Hub authenticates via Hub SSO (C-123) — one Pi principal per session.', 'ar')).toMatch(/^TEC Hub يسجّل/);
    expect(localNote('Epic project "Atlas" submitted for Zone verification.', 'ar')).toBe('مشروع Epic «Atlas» قُدّم للتوثيق في Zone.');
    expect(localNote('VERIFIED by yas55eR82: checked it, it works', 'ar')).toBe('وثّقه yas55eR82: checked it, it works');
  });

  it('a person’s own words pass through as written', () => {
    expect(localSummary('Launch a verified Pi business in minutes', 'ar')).toBe('Launch a verified Pi business in minutes');
    expect(localNote('photo of the shop sign', 'ar')).toBe('photo of the shop sign');
  });

  it('kinds and sources have labels; unknown ones are shown as they are', () => {
    expect(kindLabel('application', 'ar')).toBe('الطلب');
    expect(kindLabel('mystery', 'ar')).toBe('mystery');
    expect(sourceLabel('applicant', 'ar')).toBe('مقدّم الطلب');
  });
});
