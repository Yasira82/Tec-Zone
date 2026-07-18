import { NextRequest, NextResponse } from 'next/server';
import { listReviewQueue } from '@/lib/zone/server';

// GET /api/bff/zone/review/queue — the PENDING review queue (C-120 §7).
// The JWT is forwarded; the BACKEND enforces the ADMIN role. A non-admin caller
// receives 403 (passed through) — the UI uses that to hide the review panel.
// CSRF is enforced ONCE in middleware — this is a read, no CSRF concern.
export async function GET(req: NextRequest) {
  const token = req.cookies.get('tec_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await listReviewQueue(token);
  if (r.ok) return NextResponse.json(r.data ?? { queue: [] });
  return NextResponse.json({ error: r.error }, { status: r.status || 502 });
}
