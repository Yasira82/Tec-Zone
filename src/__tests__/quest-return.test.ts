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
const middleware = strip(read('middleware.ts'));
const layout     = strip(read('src/app/layout.tsx'));

describe('it only appears for a pioneer who came from the Quest', () => {
  it('is gated on the marker, never rendered by default', () => {
    // Zone is a real app with real users. A permanent campaign bar is wrong for
    // all of them.
    expect(barCode).toMatch(/if \(!show\) return null;/);
    expect(barCode).toMatch(/\.get\('q'\) === '1'/);
  });

  it('matches the marker instead of echoing it', () => {
    // Nothing from the Hub's link may become text on this app's screen.
    expect(barCode).not.toMatch(/searchParams\.get\('q'\)\s*\}/);
  });
});

describe('the marker survives the sign-in hop — the visit that needs it most', () => {
  it('the middleware carries q across the login redirect', () => {
    // `/app?q=1` with no session is redirected to the landing page, and the
    // query died there. So the ONE visitor who had to sign in — the one most
    // likely to be lost afterwards — was the only one who never got a way back.
    expect(middleware).toMatch(/searchParams\.get\('q'\) === '1'\) loginUrl\.searchParams\.set\('q', '1'\)/);
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
  it('links to the Quest, not to history', () => {
    expect(barCode).toMatch(/href=\{`\$\{HUB\}\/pioneers`\}/);
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
    expect(barCode).toMatch(/setShow\(marked\)/);
  });
});
