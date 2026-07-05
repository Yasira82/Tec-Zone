import { NextRequest, NextResponse } from 'next/server';
import { verify } from '@/lib/zone/registry';

// C-120 §5 API — GET /api/bff/zone/verify/:id
//   → { id, verified, status, evidence: [...], verified_at }
//
// PUBLIC read (Zone Free, C-120 §8: "Browse verified entities · Public evidence
// records"). Verification status is public by design — this is what lets a
// "Zone Verified" badge be embedded anywhere. No auth, no gateway: V1 is a
// Zone-owned, manually-curated static registry (C-120 §5, "No algorithms
// required"). Fail closed on a missing record → verified:false, never a throw.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = verify(id);
  return NextResponse.json(result, {
    status: result.verified ? 200 : 404,
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
