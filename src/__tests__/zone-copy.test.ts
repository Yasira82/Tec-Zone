import { describe, it, expect } from 'vitest';
import { zoneCopy } from '@/lib/zone/copy';

// Zone's screens were English inside the Arabic app. Both languages have every word,
// and the Arabic is not the English left in place.
const flat = (o: unknown, pre = ''): [string, unknown][] =>
  o && typeof o === 'object'
    ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => flat(v, pre ? `${pre}.${k}` : k))
    : [[pre, typeof o === 'function' ? (o as (x: never) => string)(3 as never) : o]];

describe('zone copy', () => {
  const en = Object.fromEntries(flat(zoneCopy('en')));
  const ar = Object.fromEntries(flat(zoneCopy('ar')));

  it('Arabic has exactly the English keys, each a non-empty string', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    for (const v of Object.values(ar)) expect(typeof v === 'string' && v.trim().length > 0).toBe(true);
  });

  it('every Arabic sentence is Arabic', () => {
    const latinOnly = Object.entries(ar).filter(([, v]) => !/[؀-ۿ]/.test(String(v)) && !/^Zone Pro$/.test(String(v)));
    expect(latinOnly).toEqual([]);
  });

  it('an unknown language falls back to English, never to nothing', () => {
    expect(zoneCopy('xx').check.title).toBe('Trust Check');
  });
});
