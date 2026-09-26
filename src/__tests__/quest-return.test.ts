/**
 * The way back to the Founding 100 Quest.
 *
 * ── Why this exists at all ──────────────────────────────────────────────────
 *
 * Pi Browser HAS NO TABS. Its top-right control opens an "About Current URL"
 * panel with a recently-visited list, not a tab switcher — so `target="_blank"`
 * on the Hub's Quest link is inert there and the Quest page does not stay open
 * behind the visit.
 *
 * That leaves one history stack, and a first visit to any app pushes the whole
 * SSO chain onto it. Pressing back from `/app` surfaces at the HUB'S OWN
 * LANDING PAGE — a "Sign in with Pi" screen for a session the pioneer already
 * has. Observed on a phone, not theorised.
 *
 * So the return is a FORWARD navigation to a known URL, rendered by the app.
 * These assertions pin the three properties that decide whether it works for
 * the visit that needs it most: the first one.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const bar        = read('src/components/pioneer/QuestReturn.tsx');
const barCode    = strip(bar);
const middleware = strip(read('src/middleware.ts'));
const layout     = strip(read('src/app/layout.tsx'));

describe('it only appears for a pioneer sent by a Hub surface', () => {
  it('is gated on the marker, never rendered by default', () => {
    // Zone is a real app with real users. A permanent campaign bar is wrong for
    // all of them.
    expect(barCode).toMatch(/if \(!dest\) return null;/);
  });

  it('LOOKS the destination up — it never reads a path off the URL', () => {
    // ── A rewrite of this file's own earlier assertion ─────────────────────
    // It pinned `.get('q') === '1'`, which was right while there was exactly
    // one place to go back to. There are two: the Founding Quest (/pioneers)
    // and the reward campaign (/hub/campaign), and a pioneer sent by the
    // campaign who is handed a link back to the Quest has been returned to the
    // wrong errand.
    //
    // The fix is a table, not a wider match. `?q=/hub/campaign` would have been
    // shorter and would have let whoever built the link choose what this app
    // renders as its way home — on the one element a stranded visitor is meant
    // to trust. The value is an index or it is nothing.
    expect(barCode).toMatch(/const RETURN_TO: Record<string/);
    expect(barCode).toMatch(/hasOwnProperty\.call\(RETURN_TO, q\)/);
    expect(barCode).toMatch(/href=\{`\$\{HUB\}\$\{dest\.path\}`\}/);
  });

  it('knows both surfaces, and only those', () => {
    expect(bar).toMatch(/'1':\s*\{\s*\n?\s*path: '\/pioneers'/);
    expect(bar).toMatch(/'2':\s*\{\s*\n?\s*path: '\/hub\/campaign'/);
  });

  it('re-checks the stored key on the way OUT, not just on the way in', () => {
    // A value written by an older build, or by hand, must resolve to nothing
    // rather than to a broken link.
    expect(barCode).toMatch(/hasOwnProperty\.call\(RETURN_TO, key\)/);
  });

  it('matches the marker instead of echoing it', () => {
    // Nothing from the Hub's link may become text on this app's screen.
    expect(barCode).not.toMatch(/searchParams\.get\('q'\)\s*\}/);
  });
});

describe('the marker survives the sign-in hop — the visit that needs it most', () => {
  it('there is no login redirect for q to be lost on (C-123 §11)', () => {
    // The middleware used to bounce a session-less `/app?q=1` to the landing
    // page and had to carry `q` across that hop. It no longer redirects a page
    // load at all — the page opens where the Quest link sent it, `q` included,
    // and the Quest's links now arrive signed in (C-123 §12).
    expect(middleware).not.toMatch(/NextResponse\.redirect/);
  });

  it('the bar is in the root layout, so it also captures on the landing page', () => {
    // Capture has to happen where the marker lands, and after the redirect that
    // is `/`, not `/app`. Mounting this only on the app shell would read the
    // flag one navigation too late.
    expect(layout).toMatch(/<QuestReturn \/>/);
    expect(layout).toMatch(/import \{ QuestReturn \}/);
  });

  it('remembers it for the rest of the visit', () => {
    expect(barCode).toMatch(/sessionStorage\.setItem\(FLAG/);
  });

  it('forgets it — a campaign bar must not outlive the campaign visit', () => {
    // Stored with a timestamp and bounded, so somebody using Zone for its own
    // sake tomorrow is not still being sent back to a Quest they finished.
    expect(barCode).toMatch(/WINDOW_MS/);
    expect(barCode).toMatch(/Date\.now\(\) - at < WINDOW_MS/);
  });
});

describe('it is a forward navigation to a real Hub URL', () => {
  it('links to a Hub surface, not to history', () => {
    expect(barCode).toMatch(/href=\{`\$\{HUB\}\$\{dest\.path\}`\}/);
    expect(barCode).not.toMatch(/history\.back|router\.back/);
  });

  it('refuses a placeholder HUB value', () => {
    // The `C_HUB_URL` shape: a non-URL env value that became a live redirect
    // target and 404'd across the fleet. Here it would be a dead way back.
    expect(barCode).toMatch(/\^https\?:\\\/\\\//);
    expect(barCode).toContain("'https://hub.tecosystem.app'");
  });
});

describe('storage is never allowed to decide the page', () => {
  it('still shows the bar when sessionStorage throws', () => {
    // Private window, or storage blocked. A pioneer who just arrived from the
    // Quest keeps their way back; only the memory of it is lost.
    // `marked` is now the KEY that arrived on this load, not a boolean — so the
    // fallback still resolves through the same table and cannot show a bar
    // pointing nowhere.
    expect(barCode).toMatch(/setFrom\(marked\)/);
  });
});

describe('it is a file that can be copied, not a file that must be wired', () => {
  it('imports nothing from the APP — only a package every app already has', () => {
    // It goes into twenty-three apps. Every `@/` import is a dependency each of
    // them has to satisfy identically — and `tec-template-base` has no
    // `LocaleProvider`, so `useTranslation()` there does not degrade, it THROWS
    // and takes the whole layout with it. A component whose job is to rescue a
    // stranded visitor must not be the thing that breaks the page.
    //
    // `@yasser172/tec-ui` is a different kind of dependency: a published package
    // in all 24 package.json files, not a path that may or may not resolve.
    expect(barCode).not.toMatch(/from '@\//);
    expect(barCode).not.toMatch(/useTranslation/);
    expect(barCode).toMatch(/from '@yasser172\/tec-ui'/);
  });

  it('reads the language the way the provider writes it', () => {
    // Agrees with the app when there is a provider, and still answers when
    // there is not.
    expect(barCode).toMatch(/localStorage\.getItem\('tec_locale'\)/);
    expect(barCode).toMatch(/document\.documentElement\.lang/);
  });

  it('paints from TEC_COLORS — not literals, and not var()', () => {
    // ── A correction to this file's own earlier assertion ──────────────────
    // It pinned the hex `#FBB44A`, reasoning that the component "cannot assume
    // a token file". The premise was right — 3 of 24 layouts do not import the
    // tokens, so `var(--tec-gold)` paints nothing there, silently — but the
    // conclusion was wrong. A literal is forbidden outright by Life's theme
    // guard, which caught it the first time this file was copied.
    //
    // TEC_COLORS answers both: a package every app depends on, plain hex at
    // runtime so it needs no token file, and each app's OWN palette — the three
    // excluded repos are on tec-ui 2.x and the bar there matches the app around
    // it rather than importing a colour that app has not adopted.
    expect(barCode).not.toMatch(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
    expect(barCode).not.toMatch(/var\(--tec-/);
    expect(barCode).toMatch(/TEC_COLORS\.gold/);
  });
});
