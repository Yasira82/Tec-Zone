# TEC Zone — Claude Code Instructions

> ⚡ **SESSION START:** اقرأ `knowledge-base/C-02___CURRENT_STATE_.md` + **runtime charter
> `knowledge-base/C-120___ZONE_CONSTITUTIONAL_RUNTIME_CHARTER.md`** من `yasira82/tec-knowledge-base` (branch: `main`).

## What This App Is

**The Verification Runtime** of the Pi ecosystem (C-120) — a **TIER 1 Constitutional
Runtime**, the same constitutional level as Hub. Zone is NOT an app, a content
platform, or a community portal. Zone answers one question:

```
"What can be trusted?"
```

Zone **records evidence** and serves verified status for the Pi ecosystem's
Projects, Merchants, Builders, and Communities. It is consumed BY other runtimes
(Hub → Zone → Analytics), not primarily by end users. `zone.pi` is a strategic
asset — the potential Pi-ecosystem-wide verification standard.

Built from `tec-template-base` (Next.js 15 frontend).

**Current Phase: Zone V0 — App Scaffold & Portal Readiness (C-120 §5).** Identity /
domain / slug / legal + themed home shell + **Zone Pro payment surface** (the Pi
Portal "Process a Transaction" gate) done. The verified registry is **V1, post-Portal**.
Not yet deployed.

---

## Pi App Identity

| Field | Value |
|-------|-------|
| **App** | TEC Zone |
| **Domain** | `https://zone.tecosystem.app` |
| **Pi App ID** | ⏳ TBD — register at Pi Developer Portal · then Vercel `NEXT_PUBLIC_PI_APP_ID` |
| **APP_SOURCE slug** | `zone` (payment-service resolves `PI_API_KEY_ZONE`) |
| **PI_SANDBOX** | `false` (Mainnet) |

---

## Zone-Specific Rules (C-120)

### The constitutional boundary — evidence vs judgement
Zone **OWNS**: verified entities (Projects · Merchants · Builders · Communities),
evidence records (append-only), verification audit trail, and institutional memory.
Zone does **NOT OWN**:
- **Trust score computation** → Analytics interprets the signals.
- **Recommendations** → TEC AI reasons from Zone data.
- **The relationship graph** → Connection (C-107).
- **Identity / payment / asset truth** → auth / payment / asset services.

```
"Verified" = evidence confirmed.        (Zone)
"Trusted"  = interpretation of evidence. (Analytics + TEC AI)
Conflating them is an architectural violation (C-120 §4).
```

### Verification integrity (C-120 §7)
- Human reviewers required; no automated verification without sign-off (two-reviewer
  rule for institutional verifications).
- Evidence is **append-only** — never deleted, only superseded; every decision logged
  with reviewer + timestamp.
- **"Zone Verified" cannot be purchased — only earned.** Zone Pro speeds the review
  queue, never the verdict. Paid listings do not affect verification status.

### Consistency model
Zone verification reads = strong for the current verified status; the evidence
timeline is append-only. Never present a verification as financial truth.

### Isolation (P6)
Derive identity from the `tec_user` session cookie server-side, **never** from a query
param or request body. No session → fail closed.

**Reference of record:** `yasira82/tec-knowledge-base` —
`C-120___ZONE_CONSTITUTIONAL_RUNTIME_CHARTER.md` (charter) + `C-12_Dual_Mode_Payment.md`
(payment anti-regression) + `C-123` (session/cookies) + `C-121` (knowledge pipeline).

---

## Stack

- Next.js 15 App Router + TypeScript strict · React 18
- `@yasser172/tec-ui` (design system) · `@yasser172/tec-auth` · `@yasser172/tec-sdk`
- Vitest (unit) + Playwright (e2e) · Deployment: Vercel

---

## Architecture Rules (non-negotiable)

### CSRF — middleware ONLY (P2 single source of truth)
CSRF is enforced in **`middleware.ts`** and **nowhere else**: a request is trusted
if the double-submit token matches **OR** it is first-party (Origin host === Host /
`*.tecosystem.app`).
- ❌ **NEVER** add a CSRF check inside a route handler (`csrfCookie !== csrfHeader`
  → 403). It 403's legit Mode-2 payments in Pi Browser (drops `sameSite=None`
  cookies). The CI `payment-policy` job fails the build if you do. (KB C-12 §11)
- ✅ A route may *forward* `x-csrf-token` to a downstream call; it must never *validate* it.

### ADR-007 — Dual-mode payment (Pi foreign session)
Every buy handler MUST guard before touching `window.Pi`:
```typescript
const isHubNavigation = () =>
  document.referrer.toLowerCase().includes('hub.tecosystem.app');
if (isHubNavigation() || !(window as any).Pi || !piReady) {
  redirectToHubPayment(...);   // Mode 1: Hub modal → /hub?pay=1&...
  return;
}
// Mode 2: standalone — createPaymentRecord() then createU2APayment() (src/lib/pi-payment.ts)
```
> The hub-entry signal is `__tec_hub_entry` (sessionStorage) **OR** referrer — the
> landing page (C-123 LAW 2) made referrer-alone unreliable (C-12 §3). Do not remove it.

### ADR-009 — Unified payment contract
`amount` is a **number**; gateway path is **`/api/payment/*`** (singular); the only
inter-service header is **`x-internal-key`** + `INTERNAL_SECRET`. Don't re-declare
payment Zod locally — shapes live in `@yasser172/tec-sdk`. Approve under
`PI_API_KEY_ZONE` (never the default Hub key — the Analytics approve→502 lesson, C-12 §11).

### Two-SDK boundary
```
Client components → src/lib-client/*  (browser state, Pi hooks)
API routes (BFF)  → @yasser172/tec-sdk via /api/bff/*  (server-only)
```

### Auth / cookies (LOCKED)
SSO via Hub cookies `tec_access_token`, `tec_csrf`, `tec_user`. Never localStorage.
Identity is derived from the `tec_user` cookie server-side — **never from the request body**.

---

## Setup status + Roadmap (C-120 §5)

```
Zone V0 — App Scaffold & Portal Readiness (customized from template):
  ✅ package.json name = tec-zone · APP_SOURCE = 'zone'
  ✅ sso-callback ALLOWED_AUDIENCES → zone.tecosystem.app + tec-zone.vercel.app
  ✅ privacy + terms → TEC Zone / zone.tecosystem.app
  ✅ NEW-A: no NEXT_PUBLIC_API_GATEWAY_URL / Railway host in the client bundle
  ✅ layout Pi init is hub-entry-aware (C-12 §3 / ADR-007 foreign-session skip)
  ✅ /app themed as the Zone home shell + Zone Pro (real Pi U2A payment surface)
  ✅ payment-service: PI_API_KEY_ZONE registered (C-120 §5) — ops sets it on Railway

Next (before live):
  □ Register Pi App ID (Pi Developer Portal) → set Vercel NEXT_PUBLIC_PI_APP_ID +
    API_GATEWAY_URL · INTERNAL_SECRET · SSO_SECRET · PI_SANDBOX=false.
  □ Hub SSO: add zone.tecosystem.app + tec-zone.vercel.app to Hub /api/auth/sso
    ALLOWED_TARGETS + Hub domain registry.
  □ Deploy (Vercel) + runtime-verify login (C-123) + a real Zone Pro payment
    Mode 1 (Hub) AND Mode 2 (standalone) — completes the Portal "Process a Transaction" gate.

Zone V1+ (post-Portal — C-120 §5): static Verified Registry (Projects · Merchants ·
  Builders) → Evidence Registry (V2) → Dynamic Trust Graph (V3, Connection) →
  Ecosystem Intelligence Layer (V4). Trust scores are computed BY Analytics and
  served BY Zone — Zone never computes them (C-120 §4).
```

> Zone monetization (C-120 §8) is subscription-style (Zone Pro / Enterprise). The
> payment scaffold + `isHubNavigation()` guard are kept for the Portal gate and
> optionality; any direct buy MUST keep the ADR-007 guard and needs `PI_API_KEY_ZONE`.

---

## What NOT To Do

- Do NOT compute or present trust scores — Zone records evidence; Analytics/TEC AI judge (C-120 §4)
- Do NOT let "Zone Verified" be purchasable — verification is evidence-based only (C-120 §7)
- Do NOT delete evidence records — append-only, supersede instead
- Do NOT validate CSRF in a route handler — middleware only (CI blocks it)
- Do NOT send `amount` as a string, or use `/payments` / `x-service-secret`
- Do NOT skip the ADR-007 `isHubNavigation()` guard before `window.Pi`
- Do NOT store tokens in localStorage; do NOT derive identity from the body
- Do NOT add `NEXT_PUBLIC_*` for internal service URLs or `INTERNAL_SECRET`

---

## Commit Convention

```
feat(zone):  new verification feature   fix(payment): payment flow fix (test carefully)
fix(zone):   bug fix                     chore(scope):  build/config
```

---

## Skills

Available via plugin — invoke automatically when the situation matches:

| Situation | Skill |
|-----------|-------|
| Writing new feature or fixing a bug → use TDD | `/tdd` |
| Bug, regression, or unexpected behavior | `/diagnose` |
| Writing or modifying tests | `/test-guard` |
| Writing or modifying BFF routes, payment handlers, or API contracts | `/clean-code-guard` |
| Updating docs, CLAUDE.md, or knowledge-base entries | `/docs-guard` |
| Planning a new feature or architectural decision | `/grill-with-docs` |
| Breaking down a roadmap item into GitHub Issues | `/to-issues` |
| Session is getting long or context is filling up | `/handoff` |
| Adding pre-commit hooks to this repo | `/setup-pre-commit` |
