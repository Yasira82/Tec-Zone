/**
 * A session is BOTH cookies — the guard and `/api/auth/me` must agree.
 *
 * Seen on a phone: an app opened from the Hub rendered its screens, and every
 * one of them said "Not signed in". The guard admitted the visitor on
 * `tec_access_token` alone; `/me` also needs `tec_user`. With one cookie
 * lapsed and the other not, the person sat between the two definitions — past
 * the door, with no name and no way to sign in.
 *
 * Run against the real middleware, not its source text: what matters is where
 * a request ends up.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';

const visit = (cookies: Record<string, string>, path = '/app?q=1') => {
  const req = new NextRequest(`https://zone.tecosystem.app${path}`);
  for (const [k, v] of Object.entries(cookies)) req.cookies.set(k, v);
  return middleware(req);
};

const redirectedTo = (res: Response) => res.headers.get('location');

describe('the page guard admits a WHOLE session only', () => {
  it('sends a half session (token, no tec_user) to sign in', () => {
    const res = visit({ tec_access_token: 'tok' });
    expect(res.status).toBe(307);
    expect(redirectedTo(res)).toContain('/?redirect=%2Fapp');
  });

  it('keeps the Hub-surface marker across that hop', () => {
    // The one visitor who had to sign in is the one most likely to be lost
    // afterwards — the way back must survive the redirect.
    expect(redirectedTo(visit({ tec_access_token: 'tok' }))).toContain('q=1');
  });

  it('sends the other half (tec_user, no token) too', () => {
    expect(visit({ tec_user: '{"piUsername":"a"}' }).status).toBe(307);
  });

  it('treats a blank cookie as absent', () => {
    expect(visit({ tec_access_token: 'tok', tec_user: '  ' }).status).toBe(307);
  });

  it('lets a whole session through', () => {
    const res = visit({ tec_access_token: 'tok', tec_user: '{"piUsername":"a"}' });
    expect(redirectedTo(res)).toBeNull();
  });
});
