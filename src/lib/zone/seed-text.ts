// Zone's own fixed sentences, said in the reader's language at display time.
//
// The registry's first entries (the TEC apps, the operator) and every evidence record
// Zone writes itself (identity · wallet · reachable · no-fraud · application · review)
// are SYSTEM text in English, stored once in the trust service. They read as English
// inside the Arabic app. They are translated HERE, by exact match — never in the
// database, which stays the record of what was written.
//
// A person's own words — a submission's summary, an evidence note, a reviewer's
// comment — match nothing below and are shown exactly as they wrote them.

type Lang = 'en' | 'ar';

const SUMMARY_AR: Record<string, string> = {
  'Control plane — identity, SSO, and payment orchestration.': 'مركز التحكم — الهوية وتسجيل الدخول الموحّد وتنسيق المدفوعات.',
  'Transaction engine — orders, checkout, marketplace.': 'محرّك المعاملات — الطلبات والدفع والسوق.',
  'B2C stores — products, storefronts, delivery.': 'متاجر للمستهلكين — منتجات وواجهات متاجر وتوصيل.',
  'Ownership engine — NFTs, domains, real estate.': 'محرّك الملكية — NFTs والنطاقات والعقارات.',
  'Ecosystem intelligence — metrics, trends, signals.': 'ذكاء المنظومة — مقاييس واتجاهات وإشارات.',
  'System of record (personal) — goals, preferences, activity.': 'سجلّك الشخصي — الأهداف والتفضيلات والنشاط.',
  'Relationship graph — connections, trust, collaboration.': 'شبكة العلاقات — الاتصالات والثقة والتعاون.',
  'Verification Runtime — the trust layer of the Pi ecosystem.': 'منصّة التوثيق — طبقة الثقة في منظومة Pi.',
  'Operator and builder of the TEC federated platform.': 'مشغّل منصّة TEC وبانيها.',
};

const KIND_AR: Record<string, string> = {
  identity: 'الهوية', wallet: 'محفظة Pi', reachable: 'متاح ويعمل', 'no-fraud': 'لا بلاغات احتيال',
  application: 'الطلب', review: 'المراجعة', note: 'دليل',
};
const KIND_EN: Record<string, string> = {
  identity: 'Identity', wallet: 'Pi wallet', reachable: 'Live and reachable', 'no-fraud': 'No fraud reports',
  application: 'Application', review: 'Review', note: 'Evidence',
};

// Fixed notes, with the one variable part (a name, a reviewer) carried over as written.
const NOTES_AR: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^(.+) authenticates via Hub SSO \(C-123\) — one Pi principal per session\.$/, (m) => `${m[1]} يسجّل الدخول عبر الـ Hub — هوية Pi واحدة لكل جلسة.`],
  [/^Registered on the Pi Developer Portal \(Mainnet\) with a linked app wallet\.$/, () => 'مسجّل في بوابة مطوّري Pi (الشبكة الرئيسية) ومعه محفظة تطبيق مربوطة.'],
  [/^(.+) is deployed and reachable on its tecosystem\.app domain\.$/, (m) => `${m[1]} منشور ويعمل على نطاقه في tecosystem.app.`],
  [/^No open fraud reports or disputes at time of review\.$/, () => 'لا بلاغات احتيال أو نزاعات مفتوحة وقت المراجعة.'],
  [/^Operator identity established through Hub Pi SSO\.$/, () => 'هوية المشغّل ثابتة عبر تسجيل دخول Pi في الـ Hub.'],
  [/^Ships and operates the live Mainnet TEC ecosystem\.$/, () => 'يبني منظومة TEC الحيّة على الشبكة الرئيسية ويشغّلها.'],
  [/^Epic project "(.+)" submitted for Zone verification\.$/, (m) => `مشروع Epic «${m[1]}» قُدّم للتوثيق في Zone.`],
  [/^(.+) submitted for Zone verification\.$/, (m) => `«${m[1]}» قُدّم للتوثيق في Zone.`],
  [/^VERIFIED by ([^:]+): ([\s\S]*)$/, (m) => `وثّقه ${m[1]}: ${m[2]}`],
  [/^REVOKED by ([^:]+): ([\s\S]*)$/, (m) => `سحب توثيقه ${m[1]}: ${m[2]}`],
];

export function localSummary(text: string, lang: Lang): string {
  return lang === 'ar' ? SUMMARY_AR[text.trim()] ?? text : text;
}

export function localNote(text: string, lang: Lang): string {
  if (lang !== 'ar') return text;
  const t = text.trim();
  for (const [re, say] of NOTES_AR) {
    const m = t.match(re);
    if (m) return say(m);
  }
  return text;
}

/** An evidence record's kind as a label. An unknown kind is shown as it is. */
export function kindLabel(kind: string, lang: Lang): string {
  return (lang === 'ar' ? KIND_AR : KIND_EN)[kind] ?? kind;
}

/** Where an evidence record came from, said plainly. */
export function sourceLabel(source: string, lang: Lang): string {
  const ar: Record<string, string> = { applicant: 'مقدّم الطلب', 'zone-reviewer': 'مراجع Zone', zone: 'Zone', hub: 'الـ Hub', 'pi-portal': 'بوابة Pi' };
  const en: Record<string, string> = { applicant: 'applicant', 'zone-reviewer': 'Zone reviewer', zone: 'Zone', hub: 'Hub', 'pi-portal': 'Pi Portal' };
  return (lang === 'ar' ? ar : en)[source] ?? source;
}
