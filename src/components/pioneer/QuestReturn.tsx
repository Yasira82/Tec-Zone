'use client';

// A way back to the Founding 100 Quest that does not depend on the browser.
//
// ── Why the back button cannot do this job ──────────────────────────────────
//
// Pi Browser has NO TABS. Its top-right control opens an "About Current URL"
// panel with a recently-visited list — there is no second tab to return to, so
// `target="_blank"` on the Quest link is inert there and the Hub page does not
// stay open behind the visit.
//
// That leaves the single history stack, and the first visit to any app pushes
// the whole SSO chain onto it (app landing → Hub SSO → back). Pressing back
// from `/app` walks into that chain and surfaces at the HUB'S OWN LANDING PAGE
// — observed, not theorised. A pioneer who wanted the next app instead gets a
// "Sign in with Pi" screen for a session they already have.
//
// So the return has to be a FORWARD navigation to a known URL. That is the one
// thing that behaves the same in every browser.
//
// ── Why a marker, and why it is remembered ─────────────────────────────────
//
// Zone is a real app with real users; a permanent "back to the Quest" bar would
// be wrong for all of them. The Hub's Quest link carries `?q=1`, and only a
// visitor who arrived that way sees the bar.
//
// It is remembered in `sessionStorage` because the param does NOT survive a
// first visit: `/app?q=1` with no session is redirected to the sign-in landing,
// and the query is dropped on the way. The middleware now carries `q` across
// that hop, the landing captures it here, and the bar appears after sign-in —
// which is exactly the visit where the pioneer is most likely to be lost.
//
// Bounded to six hours: the Quest is one sitting. A flag with no end would
// still be showing a campaign bar to somebody using Zone for its own sake
// tomorrow.
//
// ── Strings live here, not in the dictionaries ─────────────────────────────
//
// This file is copied verbatim into twenty-three apps. A version that also
// needed two dictionary edits per app is a version that gets pasted wrong
// somewhere, and the campaign bar is not app vocabulary.

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';

const FLAG   = 'tec_quest_return';
const WINDOW_MS = 6 * 60 * 60 * 1000;

/** The Hub, sanitised. A non-http placeholder here becomes a dead link — the
 *  `C_HUB_URL` shape that once made login 404 across the fleet. */
const HUB = (() => {
  const raw = (process.env.NEXT_PUBLIC_HUB_URL ?? '').trim();
  if (!/^https?:\/\//i.test(raw)) return 'https://hub.tecosystem.app';
  try { return new URL(raw).origin; } catch { return 'https://hub.tecosystem.app'; }
})();

/**
 * Where `q` sends you back to — a CLOSED SET, keyed by a fixed value.
 *
 * Two Hub surfaces send pioneers into apps and both leave them stranded the
 * same way: the Founding 100 Quest (`/pioneers`) and the reward campaign
 * (`/hub/campaign`). A pioneer sent by the campaign and handed a link back to
 * the Quest has been returned to the wrong errand.
 *
 * The destination is LOOKED UP, never taken from the URL. `?q=/hub/campaign`
 * would have been shorter and would have made this component render a path a
 * stranger chose — on a page that exists to tell somebody where to go next.
 * The value is an index into this table or it is nothing.
 */
const RETURN_TO: Record<string, { path: string; en: [string, string]; ar: [string, string] }> = {
  '1': {
    path: '/pioneers',
    en: ['Back to the Quest',   'Founding 100'],
    ar: ['ارجع للمهمة',          'المئة المؤسِّسة'],
  },
  '2': {
    path: '/hub/campaign',
    en: ['Back to the campaign', 'Pioneer reward'],
    ar: ['ارجع للحملة',           'مكافأة الرواد'],
  },
};

export function QuestReturn() {
  const { locale } = useTranslation();
  /** The key into RETURN_TO, or null. Never a path read off the URL. */
  const [from, setFrom] = useState<string | null>(null);

  useEffect(() => {
    let marked: string | null = null;

    // Arrived from a Hub surface — remember WHICH one before the URL is cleaned.
    try {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q && Object.prototype.hasOwnProperty.call(RETURN_TO, q)) {
        // `key|timestamp`. One entry, because two would eventually disagree —
        // a remembered destination and a separate remembered time can be
        // written apart and read together.
        sessionStorage.setItem(FLAG, `${q}|${Date.now()}`);
        marked = q;
      }
    } catch { /* private window, or storage blocked — fall through to the read */ }

    // Take the marker out of the address bar. It is campaign plumbing; leaving
    // it there means it gets shared, bookmarked, and eventually reported as a
    // bug in a URL nobody meant to publish.
    if (marked) {
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete('q');
        window.history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch { /* replaceState is cosmetic — never let it decide the bar */ }
    }

    try {
      const parts = (sessionStorage.getItem(FLAG) ?? '').split('|');
      const key = parts[0] ?? '';
      const at  = Number(parts[1] ?? '');
      const fresh = Number.isFinite(at) && at > 0 && Date.now() - at < WINDOW_MS;
      // Checked against the table on the way OUT as well as the way in. A value
      // written by an older build, or by hand, resolves to nothing rather than
      // to a broken link.
      setFrom(fresh && Object.prototype.hasOwnProperty.call(RETURN_TO, key) ? key : null);
    } catch {
      // Storage unreadable. Show it only if THIS load carried the marker —
      // a pioneer who just arrived still gets their way back.
      setFrom(marked);
    }
  }, []);

  const dest = from ? RETURN_TO[from] : undefined;
  if (!dest) return null;

  const [back, hint] = locale === 'ar' ? dest.ar : dest.en;

  return (
    <a
      href={`${HUB}${dest.path}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', textDecoration: 'none',
        background: '#0B1020', borderBottom: '1px solid #FBB44A33',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* The arrow points back in reading order, so it still means "back" in
          Arabic instead of pointing at the next app. */}
      <span style={{ color: '#FBB44A', fontSize: 16, lineHeight: 1 }}>
        {locale === 'ar' ? '→' : '←'}
      </span>
      <span style={{ color: '#FBB44A', fontSize: 13, fontWeight: 800 }}>{back}</span>
      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginInlineStart: 'auto' }}>
        {hint}
      </span>
    </a>
  );
}
