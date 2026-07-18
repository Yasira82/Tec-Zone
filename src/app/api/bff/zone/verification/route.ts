import { NextRequest, NextResponse } from 'next/server';
import { submitVerification, listMySubmissions } from '@/lib/zone/server';

// TEC Zone — verification workflow (C-120 §7).
//   GET  → the caller's OWN submissions (identity from the session JWT, P6).
//   POST → submit an entity for verification. Starts PENDING — a submitter can NEVER
//          self-verify; the JWT is forwarded and the backend derives the owner from
//          the token, never the request body.
// CSRF is enforced ONCE in middleware — do NOT re-check it here (KB C-12 §11).
const ENTITY_TYPES = ['PROJECT', 'MERCHANT', 'BUILDER', 'COMMUNITY'];

export async function GET(req: NextRequest) {
  const token = req.cookies.get('tec_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await listMySubmissions(token);
  if (r.ok) return NextResponse.json(r.data ?? { submissions: [] });
  return NextResponse.json({ error: r.error }, { status: r.status || 502 });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('tec_access_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? '').trim();
  const type = String(body?.type ?? '').toUpperCase();
  if (name.length < 2) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!ENTITY_TYPES.includes(type)) return NextResponse.json({ error: 'invalid entity type' }, { status: 400 });

  const r = await submitVerification(token, {
    type, name, summary: body?.summary, note: body?.note,
  });
  if (r.ok) return NextResponse.json(r.data, { status: 201 });
  return NextResponse.json({ error: r.error }, { status: r.status || 502 });
}
