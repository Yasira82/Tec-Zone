import { NextRequest, NextResponse } from 'next/server';
import { searchZone } from '@/lib/zone/server';

// GET /api/bff/zone/lookup?q=… — public Trust Check (verified-status search). No auth:
// verified reads are public (C-120 §4). Server-only gateway access via lib/zone/server;
// the gateway URL never reaches the client (NEW-A).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const { ok, results } = await searchZone(q);
  return NextResponse.json({ ok, results });
}
