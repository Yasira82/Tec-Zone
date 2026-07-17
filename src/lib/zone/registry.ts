// TEC Zone — Verified Registry (C-120 V1: Static Verified Registry).
//
// Zone RECORDS evidence and serves verified status — it never computes trust
// scores or renders judgement (that is Analytics + TEC AI, C-120 §4). This
// module is the manual-curation data source for V1: "No algorithms required"
// (C-120 §5). Evidence is APPEND-ONLY and every record carries a human reviewer
// + timestamp (C-120 §7). "Zone Verified" is earned, never bought.
//
// Verification criteria (V1, C-120 §5):
//   ✓ Pi identity verified (Hub)
//   ✓ Active Pi wallet
//   ✓ App/project accessible and functional
//   ✓ No reported fraud

export type EntityType = 'project' | 'merchant' | 'builder' | 'community';
export type VerificationStatus = 'verified' | 'pending' | 'revoked';

export interface EvidenceRecord {
  /** The verification criterion this record attests to (C-120 §5). */
  criterion: string;
  /** Human-readable detail of the evidence. */
  detail:    string;
  /** The human reviewer who signed off (C-120 §7 — no automated verification). */
  reviewer:  string;
  /** ISO timestamp — append-only; records are never mutated, only superseded. */
  recordedAt: string;
}

export interface VerifiedEntity {
  id:         string;      // stable slug — the verification page is /verify/<id>
  type:       EntityType;
  name:       string;
  domain?:    string;
  summary:    string;
  status:     VerificationStatus;
  verifiedAt: string | null;   // null while pending
  evidence:   EvidenceRecord[];
}

const REVIEWER = 'TEC Verification Council';
const V1_DATE  = '2026-07-05';

// Standard V1 evidence for a live, Hub-federated TEC app — each app genuinely
// meets the four V1 criteria (Pi identity via Hub SSO, active wallet, a
// reachable Mainnet deployment, no reported fraud). This is dogfooding: the
// first verified entities are the TEC apps themselves.
const tecAppEvidence = (name: string): EvidenceRecord[] => [
  { criterion: 'Pi identity verified (Hub)', detail: `${name} authenticates via Hub SSO (C-123) — one Pi principal per session.`, reviewer: REVIEWER, recordedAt: V1_DATE },
  { criterion: 'Active Pi wallet',           detail: 'Registered on the Pi Developer Portal (Mainnet) with a linked app wallet.', reviewer: REVIEWER, recordedAt: V1_DATE },
  { criterion: 'Accessible and functional',  detail: `${name} is deployed and reachable on its tecosystem.app domain.`, reviewer: REVIEWER, recordedAt: V1_DATE },
  { criterion: 'No reported fraud',          detail: 'No open fraud reports or disputes at time of review.', reviewer: REVIEWER, recordedAt: V1_DATE },
];

const project = (id: string, name: string, domain: string, summary: string): VerifiedEntity => ({
  id, type: 'project', name, domain, summary, status: 'verified', verifiedAt: V1_DATE, evidence: tecAppEvidence(name),
});

// Curated V1 registry. Projects = the live TEC apps (verifiable today).
// Builders = the platform operator. Merchants open with Commerce activity (V2).
export const REGISTRY: VerifiedEntity[] = [
  project('tec-hub',        'TEC Hub',        'hub.tecosystem.app',        'Control plane — identity, SSO, and payment orchestration.'),
  project('tec-commerce',   'TEC Commerce',   'commerce.tecosystem.app',   'Transaction engine — orders, checkout, marketplace.'),
  project('tec-ecommerce',  'TEC Ecommerce',  'ecommerce.tecosystem.app',  'B2C stores — products, storefronts, delivery.'),
  project('tec-assets',     'TEC Assets',     'assets.tecosystem.app',     'Ownership engine — NFTs, domains, real estate.'),
  project('tec-analytics',  'TEC Analytics',  'analytics.tecosystem.app',  'Ecosystem intelligence — metrics, trends, signals.'),
  project('tec-life',       'TEC Life',       'life.tecosystem.app',       'System of record (personal) — goals, preferences, activity.'),
  project('tec-connection', 'TEC Connection', 'connection.tecosystem.app', 'Relationship graph — connections, trust, collaboration.'),
  project('tec-zone',       'TEC Zone',       'zone.tecosystem.app',       'Verification Runtime — the trust layer of the Pi ecosystem.'),
  {
    id: 'the-elite-consortium', type: 'builder', name: 'The Elite Consortium',
    summary: 'Operator and builder of the TEC federated platform.',
    status: 'verified', verifiedAt: V1_DATE,
    evidence: [
      { criterion: 'Pi identity verified (Hub)', detail: 'Operator identity established through Hub Pi SSO.', reviewer: REVIEWER, recordedAt: V1_DATE },
      { criterion: 'Accessible and functional',  detail: 'Ships and operates 8 live Mainnet apps in the TEC ecosystem.', reviewer: REVIEWER, recordedAt: V1_DATE },
      { criterion: 'No reported fraud',          detail: 'No open fraud reports or disputes at time of review.', reviewer: REVIEWER, recordedAt: V1_DATE },
    ],
  },
];

export const ENTITY_TYPES: { type: EntityType; icon: string; title: string; blurb: string }[] = [
  { type: 'project',  icon: '🏗️', title: 'Projects',  blurb: 'Pi ecosystem projects — TEC and non-TEC.' },
  { type: 'merchant', icon: '🛍️', title: 'Merchants', blurb: 'Pi-accepting businesses, verified by evidence.' },
  { type: 'builder',  icon: '👷', title: 'Builders',  blurb: 'Developers, founders, and contributors.' },
  { type: 'community', icon: '🤝', title: 'Communities', blurb: 'Verified Pi communities and collectives.' },
];

export const listByType = (type: EntityType): VerifiedEntity[] =>
  REGISTRY.filter((e) => e.type === type);

export const getEntity = (id: string): VerifiedEntity | null =>
  REGISTRY.find((e) => e.id === id) ?? null;

// C-120 §5 API contract: GET /api/v1/zone/verify/:entity_id
//   → { verified, evidence: [...], verified_at }
export interface VerifyResult {
  id:          string;
  verified:    boolean;
  status:      VerificationStatus | 'unknown';
  evidence:    EvidenceRecord[];
  verified_at: string | null;
}

export const verify = (id: string): VerifyResult => {
  const entity = getEntity(id);
  if (!entity) return { id, verified: false, status: 'unknown', evidence: [], verified_at: null };
  return {
    id,
    verified:    entity.status === 'verified',
    status:      entity.status,
    evidence:    entity.evidence,
    verified_at: entity.verifiedAt,
  };
};
