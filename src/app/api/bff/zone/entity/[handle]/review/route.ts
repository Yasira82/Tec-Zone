import { NextRequest, NextResponse } from 'next/server';
import { reviewDecision } from '@/lib/zone/server';

// PATCH /api/bff/zone/entity/:handle/review — reviewer decision (VERIFY | REVOKE).
// The JWT is forwarded; the BACKEND enforces the ADMIN role + separation of duties
// (a reviewer may not decide their own submission) + human sign-off (C-120 §7).
// A non-admin caller receives 403 from the backend. "Zone Verified" is earned, never
// purchased. CSRF is enforced ONCE in middleware — do NOT re-check it here.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const token = req.cookies.get('tec_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { handle } = await params;
  const body = await req.json().catch(() => ({}));
  const decision = String(body?.decision ?? '').toUpperCase();
  const note     = String(body?.note ?? '').trim();
  if (decision !== 'VERIFY' && decision !== 'REVOKE') {
    return NextResponse.json({ error: 'decision must be VERIFY or REVOKE' }, { status: 400 });
  }
  if (note.length < 2) return NextResponse.json({ error: 'a review note is required' }, { status: 400 });

  const r = await reviewDecision(token, handle, { decision: decision as 'VERIFY' | 'REVOKE', note });
  if (r.ok) return NextResponse.json(r.data);
  return NextResponse.json({ error: r.error }, { status: r.status || 502 });
}
