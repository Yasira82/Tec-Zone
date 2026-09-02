import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The whole verification workflow was invisible in Pi Browser.
//
// `VerificationPanel` opened with `if (!isAuth) return null`, and it was handed
// `usePiAuth().isAuthenticated` — which answers from `document.cookie`. Pi
// Browser stores `tec_user` so the SERVER can read it and client JS cannot
// (C-123 §3), so on the only platform this app ships to that value is always
// false. The surface a merchant needs in order to REQUEST verification rendered
// nothing, and a blank section is indistinguishable from a broken page.
//
// The page already knew the answer: `useMe()` is a server round-trip and the
// line declaring it carries the C-123 note. Two call sites were simply missed.
//
// The identical bug shipped in Explorer's "My Business" tab weeks earlier. That
// is why it is pinned here rather than fixed and trusted.
const src = (p: string) => readFileSync(join(process.cwd(), 'src', p), 'utf8');

const strip = (s: string) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

describe('the verification surface is wired to the session the SERVER can see', () => {
  const page = strip(src('app/app/page.tsx'));

  it('resolves the session server-side', () => {
    expect(page).toContain('useMe()');
    expect(page).toMatch(/me\.authenticated/);
  });

  it('does not gate the applicant panel on the client-only flag ALONE', () => {
    const call = page.match(/<VerificationPanel[^>]*\/>/s)?.[0] ?? '';
    expect(call).toBeTruthy();
    expect(call).not.toMatch(/isAuth=\{\s*isAuthenticated\s*\}/);
  });

  it('tells the panel when the answer is still in flight', () => {
    // Otherwise the signed-out pitch flashes for everyone on every open, because
    // the answer arrives over the network.
    const call = page.match(/<VerificationPanel[^>]*\/>/s)?.[0] ?? '';
    expect(call).toContain('authLoading');
  });

  it('the check can actually fail', () => {
    expect('<VerificationPanel isAuth={isAuthenticated} />')
      .toMatch(/isAuth=\{\s*isAuthenticated\s*\}/);
  });
});

describe('no branch of the applicant panel renders an empty screen', () => {
  const panel = strip(src('app/app/components/VerificationPanel.tsx'));

  it('never bails out with a bare `return null`', () => {
    expect(panel).not.toMatch(/return\s+null\s*;/);
  });

  it('says something to a signed-out visitor instead of vanishing', () => {
    // Applying for verification is the reason a merchant opens this app. Tell
    // them what it does and how to start.
    const signedOut = panel.slice(panel.indexOf('if (!isAuth)'));
    expect(signedOut.slice(0, 600)).toMatch(/Sign in/i);
  });

  it('says something while the session resolves', () => {
    expect(panel).toMatch(/authLoading/);
  });
});

describe('the reviewer console decides authorization on the server', () => {
  const review = strip(src('app/app/components/ReviewPanel.tsx'));

  it('does NOT gate its load on the client auth flag', () => {
    // Deliberate, and the opposite of the applicant panel: a genuine ADMIN can
    // be signed in with isAuth=false in Pi Browser. The backend answers 403 for
    // a non-admin, so the queue simply does not load. Authorization belongs to
    // the server either way (P6).
    expect(review).toMatch(/useEffect\(\(\) => \{ load\(\); \}, \[\]\)/);
  });

  it('reports a load that never completed', () => {
    // A 403 is expected and handled. Reaching the catch means the request
    // failed — and the console silently disappearing for a real reviewer looks
    // exactly like not being an admin.
    const fn = review.slice(review.indexOf('async function load'));
    expect(fn.slice(0, 700)).toContain('reportError');
  });
});
