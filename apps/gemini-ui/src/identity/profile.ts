/**
 * KNOuX — Founder & Developer identity data.
 *
 * Single source of truth for the in-app identity surface. Every link here is
 * mirrored one-for-one by `electron/native/identity-links.cjs`, which is the
 * only module allowed to hand a URI to the operating system. A source gate
 * (`scripts/identity-page-test.cjs`) fails if the two tables ever drift.
 *
 * No statistic on this page is invented. The product facts below are the ones
 * the repository can prove: the domain count, the service registry size, the
 * read-only native bridge, and the licence.
 */

export const PRODUCT_VERSION = '0.4.0-gemini.0';

export interface IdentityLink {
  id: string;
  uri: string;
  scheme: 'https' | 'mailto' | 'tel';
  kind: 'web' | 'mail' | 'tel';
  labelEn: string;
  labelAr: string;
}

/**
 * Static mirror of the native allowlist, used only when the preload bridge is
 * absent (browser preview or a failed handshake). The native bridge, when
 * present, is always authoritative and replaces this list at runtime.
 */
export const IDENTITY_LINKS: readonly IdentityLink[] = Object.freeze([
  { id: 'website', uri: 'https://knoux.store/', scheme: 'https', kind: 'web', labelEn: 'KNOUX website', labelAr: 'موقع KNOUX' },
  { id: 'product', uri: 'https://smart.knoux.store/', scheme: 'https', kind: 'web', labelEn: 'SmartOrganizer product page', labelAr: 'صفحة منتج SmartOrganizer' },
  { id: 'email', uri: 'mailto:admin@knoux.store', scheme: 'mailto', kind: 'mail', labelEn: 'Corporate email', labelAr: 'البريد المؤسسي' },
  { id: 'phone', uri: 'tel:+971503281920', scheme: 'tel', kind: 'tel', labelEn: 'Direct line', labelAr: 'الخط المباشر' },
  { id: 'whatsapp', uri: 'https://wa.me/971503281920', scheme: 'https', kind: 'web', labelEn: 'WhatsApp', labelAr: 'واتساب' },
  { id: 'github_engineer', uri: 'https://github.com/daynightae-cmyk', scheme: 'https', kind: 'web', labelEn: 'Engineering GitHub', labelAr: 'GitHub الهندسي' },
  { id: 'github_company', uri: 'https://github.com/knoux-io', scheme: 'https', kind: 'web', labelEn: 'KNOUX GitHub', labelAr: 'GitHub الخاص بـ KNOUX' },
  { id: 'facebook_founder', uri: 'https://www.facebook.com/CopSadek', scheme: 'https', kind: 'web', labelEn: 'Founder on Facebook', labelAr: 'المؤسس على فيسبوك' },
  { id: 'facebook_company', uri: 'https://www.facebook.com/knouxStore/', scheme: 'https', kind: 'web', labelEn: 'KNOUX on Facebook', labelAr: 'KNOUX على فيسبوك' },
  { id: 'tiktok', uri: 'https://www.tiktok.com/@knoux_7', scheme: 'https', kind: 'web', labelEn: 'KNOUX on TikTok', labelAr: 'KNOUX على تيك توك' },
] as const);

/** The exact contact values displayed as selectable text. */
export const CONTACT = Object.freeze({
  email: 'admin@knoux.store',
  phoneDisplay: '+971 50 328 1920',
  phoneAlt: '050 328 1920',
  website: 'knoux.store',
  product: 'smart.knoux.store',
});

export interface Role {
  id: string;
  en: string;
  ar: string;
}

export const ROLES: readonly Role[] = Object.freeze([
  { id: 'founder', en: 'Founder', ar: 'المؤسس' },
  { id: 'software', en: 'Software Engineer', ar: 'مهندس برمجيات' },
  { id: 'product', en: 'Digital Product Builder', ar: 'باني منتجات رقمية' },
  { id: 'automation', en: 'AI Automation Engineer', ar: 'مهندس أتمتة بالذكاء الاصطناعي' },
]);

export interface Pillar {
  id: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  /** Concrete evidence from this repository, not a marketing claim. */
  proofEn: string;
  proofAr: string;
}

export const PILLARS: readonly Pillar[] = Object.freeze([
  {
    id: 'windows',
    titleEn: 'Windows desktop engineering',
    titleAr: 'هندسة تطبيقات Windows',
    bodyEn: 'Native Node and PowerShell providers behind an Electron main/preload/renderer split, with a typed contract and a trusted-sender check on every channel.',
    bodyAr: 'مزوّدات أصلية بـ Node وPowerShell خلف فصل صارم بين Main وpreload وrenderer، مع عقد مكتوب وتحقق من المرسل الموثوق في كل قناة.',
    proofEn: 'Native bridge v1 · read-only by default',
    proofAr: 'جسر أصلي v1 · للقراءة فقط افتراضيًا',
  },
  {
    id: 'consent',
    titleEn: 'Explicit-consent product safety',
    titleAr: 'أمان المنتج بموافقة صريحة',
    bodyEn: 'Every effect that changes the device is planned, shown as an immutable preview, and applied only after its own approval. Nothing runs silently.',
    bodyAr: 'كل أثر يغيّر الجهاز يُخطَّط ويُعرض كمعاينة ثابتة، ولا يُطبَّق إلا بموافقة مستقلة. لا شيء يعمل بصمت.',
    proofEn: '181 registered service paths · 14 domains',
    proofAr: '181 مسار خدمة مسجل · 14 نطاقًا',
  },
  {
    id: 'ai',
    titleEn: 'AI automation that stays reversible',
    titleAr: 'أتمتة ذكاء اصطناعي قابلة للتراجع',
    bodyEn: 'Provider-agnostic AI with session-memory credentials, bounded requests and an explicit proxy boundary. Workflow runs and schedules are reviewed before they arm.',
    bodyAr: 'ذكاء اصطناعي مستقل عن المزود بمفاتيح في ذاكرة الجلسة، وطلبات محدودة، وحدود وكيل صريحة. تُراجع عمليات الأتمتة والجداول قبل التفعيل.',
    proofEn: 'Session-only keys · no background scheduler without approval',
    proofAr: 'مفاتيح الجلسة فقط · لا جدولة خلفية دون موافقة',
  },
  {
    id: 'design',
    titleEn: 'Bilingual design systems',
    titleAr: 'أنظمة تصميم ثنائية اللغة',
    bodyEn: 'One token layer drives Day and Night, then English LTR and Arabic RTL. Screens consume roles instead of raw colours, so both themes stay one product.',
    bodyAr: 'طبقة رموز واحدة تقود الوضعين النهاري والليلي، ثم الإنجليزية LTR والعربية RTL. تستهلك الشاشات الأدوار بدل الألوان الخام ليبقى المنتج واحدًا.',
    proofEn: 'Day/Night token pairs · verified at four viewports',
    proofAr: 'أزواج رموز نهاري/ليلي · مُتحقَّق منها في أربع مقاسات',
  },
]);

export const PRODUCT_FACTS = Object.freeze([
  { id: 'name', labelEn: 'Product', labelAr: 'المنتج', value: 'KNOuX SmartOrganizer' },
  { id: 'version', labelEn: 'Build', labelAr: 'الإصدار', value: PRODUCT_VERSION },
  { id: 'platform', labelEn: 'Platform', labelAr: 'المنصة', value: 'Windows-first desktop (Electron)' },
  { id: 'license', labelEn: 'Licence', labelAr: 'الترخيص', value: 'MIT' },
] as const);
