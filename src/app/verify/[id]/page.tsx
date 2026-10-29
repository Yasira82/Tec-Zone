// TEC Zone — public verification page (C-120 V1). Shows the verified status and
// the append-only evidence for one entity. Public (Zone Free, C-120 §8): anyone
// can browse verified entities and their evidence. Zone records evidence — it
// does not render a trust score (C-120 §4).
import { resolvePublicEntity } from '@/lib/zone/server';
import { VerifyView } from './VerifyView';

// Rendered dynamically from the live Zone read-layer — "Zone Verified" is a factual
// claim backed by evidence and is NEVER served from a static sample (C-120 §4 /
// C-135 §4): a live 404 is "not in the registry"; an unreachable backend is an
// honest "temporarily unavailable".
export const dynamic = 'force-dynamic';

// The words are the reader's language, which only the browser knows (the locale is kept
// client-side), so the page reads the entity here and VerifyView says it.
export default async function VerifyPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { entity, source } = await resolvePublicEntity(id);
  return <VerifyView entity={entity} source={source} />;
}
