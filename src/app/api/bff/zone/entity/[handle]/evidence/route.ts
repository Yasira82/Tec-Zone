import { NextRequest, NextResponse } from 'next/server';
import { appendEvidence } from '@/lib/zone/server';

// POST /api/bff/zone/entity/:handle/evidence — append append-only supporting
// evidence to the caller's OWN pending submission (C-120 §7). The JWT is forwarded;
// the backend enforces owner-scope (P6) and that the submission is still PENDING.
// CSRF is enforced ONCE in middleware — do NOT re-check it here (KB C-12 §11).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const token = req.cookies.get('tec_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { handle } = await params;
  const body = await req.json().catch(() => ({}));
  const note = String(body?.note ?? '').trim();
  if (note.length < 2) return NextResponse.json({ error: 'note is required' }, { status: 400 });

  const r = await appendEvidence(token, handle, { kind: String(body?.kind ?? 'note'), note });
  if (r.ok) return NextResponse.json(r.data);
  return NextResponse.json({ error: r.error }, { status: r.status || 502 });
}
