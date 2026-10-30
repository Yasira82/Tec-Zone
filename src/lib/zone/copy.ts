// The words of Zone's screens that were English inside the Arabic app: Trust Check, Zone
// Pro, the Registry, the verification form, the reviewer queue, the public evidence page,
// Invite and Cancel. One module in both languages; `zoneCopy` can only fall back to
// English, never to an empty string. Evidence text itself (criteria, details) is DATA from
// the trust service and is shown as written.
import { useTranslation } from '@/lib/i18n';

type EntityKind = 'project' | 'merchant' | 'builder' | 'community';

const en = {
  type: { project: 'Project', merchant: 'Merchant', builder: 'Builder', community: 'Community' } as Record<EntityKind, string>,
  groups: {
    project:   { title: 'Projects',    blurb: 'Pi ecosystem projects — TEC and non-TEC.' },
    merchant:  { title: 'Merchants',   blurb: 'Pi-accepting businesses, verified by evidence.' },
    builder:   { title: 'Builders',    blurb: 'Developers, founders and contributors.' },
    community: { title: 'Communities', blurb: 'Verified Pi communities and collectives.' },
  } as Record<EntityKind, { title: string; blurb: string }>,
  status: { verified: 'Verified', pending: 'Pending review', revoked: 'Revoked' } as Record<string, string>,
  evidenceCount: (n: number) => `${n} evidence record${n === 1 ? '' : 's'}`,

  check: {
    title: 'Trust Check',
    hint: 'Is it Zone Verified? Search a project, merchant or builder to see its status and evidence.',
    placeholder: 'Search a name…',
    aria: 'Search the verified registry',
    searching: 'Checking…',
    none: 'No match in the verified registry. Zone never shows anything as verified without evidence — an unlisted name simply isn’t verified yet.',
  },

  registry: {
    title: 'Verified Registry', live: 'live',
    hint: 'Evidence-based, human-reviewed verification — “Zone Verified” is earned, never bought. Tap an entry to see its evidence.',
    loading: 'Loading the verified registry…',
    unavailable: 'The verified registry is unavailable right now. Try again shortly — Zone never shows unconfirmed entries as verified.',
  },

  apply: {
    title: 'Apply for verification',
    hintSignedOut: 'Sign in with Pi to submit your project, business or community for review. A human reviewer decides — verification is earned, never bought.',
    hint: 'Submit, then attach evidence. A human reviewer decides — verification is earned, never bought.',
    loading: 'Loading…',
    type: 'Type', name: 'Name', namePh: 'e.g. Pi Cafe',
    summary: 'Summary', summaryPh: 'What is it?',
    note: 'Opening note', notePh: 'Why should this be verified?',
    optional: '(optional)',
    submit: 'Submit for verification', submitting: 'Submitting…',
    pendingExists: 'You already have a pending request.',
    failed: 'Could not submit.', network: 'Network error — please try again.',
    reviewedBy: (who: string) => `reviewed by ${who}`,
    addEvidence: '+ Add evidence', evidencePh: 'Add supporting evidence…',
    add: 'Add evidence', adding: 'Adding…', cancel: 'Cancel',
    evidenceFailed: 'Could not add evidence.',
  },

  review: {
    title: 'Review queue', pending: (n: number) => `reviewer · ${n} pending`,
    hint: 'Read the evidence, then verify or revoke with a note. You may not decide your own submission.',
    empty: 'Nothing pending review.',
    by: (who: string) => `by ${who}`, priority: 'Priority (Pro)',
    notePh: 'Review note (required)…', noteRequired: 'A review note is required.',
    own: 'You cannot decide your own submission.', failed: 'Could not submit the decision.',
    verify: 'Verify', verifying: 'Verifying…', revoke: 'Revoke', revoking: 'Revoking…',
  },

  pro: {
    perMonth: '/ month',
    body: 'For builders and merchants — priority review, a detailed evidence report and an embeddable Zone Verified badge. Verification cannot be bought: Pro speeds the review, never the verdict.',
    upgrade: (p: number) => `Upgrade — ${p}π / month`, preparing: 'Preparing…', confirmInPi: 'Confirm in Pi…',
    startFailed: 'Could not start the payment. Please sign in again and retry.',
    failed: 'Payment failed. Please try again.',
    onPro: 'You’re on Pro', onProBody: 'Your subscription is active. Thanks for supporting TEC.',
    expires: (n: number) => `Expires in ${n} day${n === 1 ? '' : 's'}`,
    renew: 'Re-subscribe to keep Pro — a one-time monthly payment, no auto-renewal.',
    active: 'Zone Pro active',
    activeBody: 'Payment received. Your next verification request gets priority review — a reviewer sees it sooner. Speed only: the verdict is always the evidence’s.',
    cancel: 'Cancel subscription', cancelling: 'Cancelling…',
    cancelConfirm: 'Cancel Pro in this app? Your Pro here ends now. Other apps and the Hub plan are not affected.',
    cancelFailed: 'Could not cancel',
  },

  invite: {
    title: 'Invite & earn',
    anon: 'Sign in with Pi to get your invite link — share it and earn a reward when a friend joins.',
    body: 'Share your link — you both earn when a friend joins TEC through it.',
    copy: 'Copy link', copied: '✓ Copied',
  },

  page: {
    back: '← Verified Registry',
    unavailableTitle: 'Registry temporarily unavailable',
    unavailableBody: 'The Zone verification service is unavailable right now. Try again shortly — Zone never shows anything as verified without live evidence.',
    missingTitle: 'Not in the registry',
    missingBody: 'Nothing verified under this name. A missing record is not a negative verdict — Zone only asserts what evidence confirms.',
    badge: 'Zone Verified', verifiedOn: (d: string) => `Verified ${d}`,
    evidence: 'Evidence', evidenceHint: 'Append-only — every record says who added it and when.',
    reviewer: 'Reviewer',
    byApplicant: 'Submitted by the applicant',
    footer: '“Verified” = the evidence is confirmed. “Trusted” is how others read that evidence. This page shows the evidence itself.',
    shareTitle: 'Share your verification',
    shareHint: 'Put the live badge on your own site or app — anyone in Pi can tap it to see the evidence.',
    preview: 'Preview:', link: 'Verification link', embed: 'Embed code (HTML)', copy: 'Copy', copied: 'Copied',
  },

  footer: 'Zone records verified evidence — the facts behind what can be trusted. Verification is earned from evidence, never bought.',
};

export type ZoneCopy = typeof en;

const ar: ZoneCopy = {
  type: { project: 'مشروع', merchant: 'تاجر', builder: 'مطوّر', community: 'مجتمع' },
  groups: {
    project:   { title: 'المشاريع',  blurb: 'مشاريع منظومة Pi — من TEC وخارجها.' },
    merchant:  { title: 'التجّار',   blurb: 'أعمال تقبل Pi، موثّقة بالأدلة.' },
    builder:   { title: 'المطوّرون', blurb: 'مطوّرون ومؤسسون ومساهمون.' },
    community: { title: 'المجتمعات', blurb: 'مجتمعات ومجموعات Pi موثّقة.' },
  },
  status: { verified: 'موثّق', pending: 'قيد المراجعة', revoked: 'سُحب التوثيق' },
  evidenceCount: (n) => (n === 0 ? 'لا أدلة بعد' : n === 1 ? 'دليل واحد' : n === 2 ? 'دليلان' : n <= 10 ? `${n} أدلة` : `${n} دليلًا`),

  check: {
    title: 'فحص الثقة',
    hint: 'هل هو موثّق في Zone؟ ابحث عن مشروع أو تاجر أو مطوّر لترى حالته وأدلته.',
    placeholder: 'ابحث باسم…',
    aria: 'ابحث في السجل الموثّق',
    searching: 'جارٍ الفحص…',
    none: 'لا نتيجة في السجل الموثّق. Zone لا يعرض شيئًا كموثّق بلا أدلة — والاسم غير الموجود ببساطة لم يُوثَّق بعد.',
  },

  registry: {
    title: 'السجل الموثّق', live: 'مباشر',
    hint: 'توثيق قائم على الأدلة ويراجعه إنسان — «موثّق في Zone» يُكتسب ولا يُشترى. اضغط على أي اسم لترى أدلته.',
    loading: 'جارٍ تحميل السجل الموثّق…',
    unavailable: 'السجل الموثّق غير متاح الآن. حاول بعد قليل — Zone لا يعرض أي شيء غير مؤكَّد كموثّق.',
  },

  apply: {
    title: 'اطلب التوثيق',
    hintSignedOut: 'سجّل دخولك بـ Pi لتقدّم مشروعك أو عملك أو مجتمعك للمراجعة. القرار لمراجع بشري — التوثيق يُكتسب ولا يُشترى.',
    hint: 'قدّم الطلب، ثم أضف الأدلة. القرار لمراجع بشري — التوثيق يُكتسب ولا يُشترى.',
    loading: 'جارٍ التحميل…',
    type: 'النوع', name: 'الاسم', namePh: 'مثلًا: كافيه Pi',
    summary: 'نبذة', summaryPh: 'ما هو؟',
    note: 'ملاحظة افتتاحية', notePh: 'لماذا يستحق التوثيق؟',
    optional: '(اختياري)',
    submit: 'قدّم للتوثيق', submitting: 'جارٍ التقديم…',
    pendingExists: 'لديك طلب قيد المراجعة بالفعل.',
    failed: 'تعذّر التقديم.', network: 'خطأ في الاتصال — حاول مرة أخرى.',
    reviewedBy: (who) => `راجعه ${who}`,
    addEvidence: '+ أضف دليلًا', evidencePh: 'أضف دليلًا داعمًا…',
    add: 'أضف الدليل', adding: 'جارٍ الإضافة…', cancel: 'إلغاء',
    evidenceFailed: 'تعذّرت إضافة الدليل.',
  },

  review: {
    title: 'قائمة المراجعة', pending: (n) => `مراجع · ${n} قيد الانتظار`,
    hint: 'اقرأ الأدلة، ثم وثّق أو اسحب التوثيق مع ملاحظة. لا يمكنك أن تحكم على طلبك أنت.',
    empty: 'لا شيء ينتظر المراجعة.',
    by: (who) => `من ${who}`, priority: 'أولوية (Pro)',
    notePh: 'ملاحظة المراجعة (مطلوبة)…', noteRequired: 'ملاحظة المراجعة مطلوبة.',
    own: 'لا يمكنك أن تحكم على طلبك أنت.', failed: 'تعذّر إرسال القرار.',
    verify: 'وثّق', verifying: 'جارٍ التوثيق…', revoke: 'اسحب التوثيق', revoking: 'جارٍ السحب…',
  },

  pro: {
    perMonth: '/ شهريًا',
    body: 'للمطوّرين والتجّار — مراجعة بأولوية، وتقرير أدلة مفصّل، وشارة «موثّق في Zone» تضعها في موقعك. التوثيق لا يُشترى: Pro يُسرّع المراجعة فقط، ولا يغيّر الحكم.',
    upgrade: (p) => `ترقية — ${p}π شهريًا`, preparing: 'جارٍ التحضير…', confirmInPi: 'أكّد في Pi…',
    startFailed: 'تعذّر بدء الدفع. سجّل الدخول من جديد وحاول مرة أخرى.',
    failed: 'لم يتم الدفع. حاول مرة أخرى.',
    onPro: 'أنت مشترك في Pro', onProBody: 'اشتراكك فعّال. شكرًا لدعمك TEC.',
    expires: (n) => `ينتهي بعد ${n} ${n === 1 ? 'يوم' : n === 2 ? 'يومين' : n <= 10 ? 'أيام' : 'يومًا'}`,
    renew: 'جدّد الاشتراك لتحتفظ بـ Pro — دفعة واحدة كل شهر، بلا تجديد تلقائي.',
    active: 'Zone Pro مُفعّل',
    activeBody: 'تم استلام الدفعة. طلب التوثيق القادم يحصل على مراجعة بأولوية — يراه المراجع أسرع. السرعة فقط: الحكم دائمًا للأدلة.',
    cancel: 'إلغاء الاشتراك', cancelling: 'جارٍ الإلغاء…',
    cancelConfirm: 'إلغاء Pro في هذا التطبيق؟ ينتهي Pro هنا الآن، ولا تتأثر التطبيقات الأخرى ولا خطة الـ Hub.',
    cancelFailed: 'تعذّر الإلغاء',
  },

  invite: {
    title: 'ادعُ واكسب',
    anon: 'سجّل دخولك بـ Pi لتحصل على رابط دعوتك — شاركه واكسب مكافأة عندما ينضم صديق.',
    body: 'شارك رابطك — تكسبان معًا عندما ينضم صديق إلى TEC عبره.',
    copy: 'انسخ الرابط', copied: '✓ تم النسخ',
  },

  page: {
    back: '→ السجل الموثّق',
    unavailableTitle: 'السجل غير متاح مؤقتًا',
    unavailableBody: 'خدمة التوثيق في Zone غير متاحة الآن. حاول بعد قليل — Zone لا يعرض أي شيء كموثّق بلا أدلة حيّة.',
    missingTitle: 'غير موجود في السجل',
    missingBody: 'لا يوجد شيء موثّق بهذا الاسم. غياب السجل ليس حكمًا سلبيًا — Zone يؤكد فقط ما تثبته الأدلة.',
    badge: 'موثّق في Zone', verifiedOn: (d) => `وُثّق في ${d}`,
    evidence: 'الأدلة', evidenceHint: 'تُضاف ولا تُعدّل — كل سجل يذكر من أضافه ومتى.',
    reviewer: 'المراجع',
    byApplicant: 'قدّمه صاحب الطلب',
    footer: '«موثّق» = الأدلة مؤكَّدة. «موثوق» هو قراءة الآخرين لتلك الأدلة. هذه الصفحة تعرض الأدلة نفسها.',
    shareTitle: 'شارك توثيقك',
    shareHint: 'ضع الشارة الحيّة في موقعك أو تطبيقك — أي شخص في Pi يضغط عليها يرى الأدلة.',
    preview: 'معاينة:', link: 'رابط التوثيق', embed: 'كود التضمين (HTML)', copy: 'نسخ', copied: 'تم النسخ',
  },

  footer: 'Zone يسجّل أدلة موثّقة — الحقائق وراء ما يمكن الوثوق به. التوثيق يُكتسب بالأدلة، ولا يُشترى.',
};

const COPY = { en, ar } as const;

export function zoneCopy(locale: string): ZoneCopy {
  return locale === 'ar' ? COPY.ar : COPY.en;
}

/** The copy for the reader's language, inside a client component. */
export function useZoneCopy(): ZoneCopy {
  return zoneCopy(useTranslation().locale);
}
