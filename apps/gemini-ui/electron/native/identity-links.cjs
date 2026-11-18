'use strict';

/**
 * KNOuX Gemini — fixed identity destinations.
 *
 * The Founder & Developer surface is allowed to hand these destinations to the
 * operating system. The renderer can only name one of the ids below; it can
 * never supply a URL, host, scheme, path or header. This mirrors the existing
 * `apps.settings.open` handoff: the renderer selects a capability id and main
 * resolves the actual URI from its own immutable table.
 *
 * Every entry is owned by KNOUX (knoux.store) or by the founder's verified
 * public profiles. Adding a destination is a code change and a review, not a
 * runtime input.
 */

const IDENTITY_LINKS = Object.freeze({
  website: Object.freeze({
    id: 'website',
    uri: 'https://knoux.store/',
    scheme: 'https',
    kind: 'web',
    labelEn: 'KNOUX website',
    labelAr: 'موقع KNOUX',
  }),
  product: Object.freeze({
    id: 'product',
    uri: 'https://smart.knoux.store/',
    scheme: 'https',
    kind: 'web',
    labelEn: 'SmartOrganizer product page',
    labelAr: 'صفحة منتج SmartOrganizer',
  }),
  email: Object.freeze({
    id: 'email',
    uri: 'mailto:admin@knoux.store',
    scheme: 'mailto',
    kind: 'mail',
    labelEn: 'Corporate email',
    labelAr: 'البريد المؤسسي',
  }),
  phone: Object.freeze({
    id: 'phone',
    uri: 'tel:+971503281920',
    scheme: 'tel',
    kind: 'tel',
    labelEn: 'Direct line',
    labelAr: 'الخط المباشر',
  }),
  whatsapp: Object.freeze({
    id: 'whatsapp',
    uri: 'https://wa.me/971503281920',
    scheme: 'https',
    kind: 'web',
    labelEn: 'WhatsApp',
    labelAr: 'واتساب',
  }),
  github_engineer: Object.freeze({
    id: 'github_engineer',
    uri: 'https://github.com/daynightae-cmyk',
    scheme: 'https',
    kind: 'web',
    labelEn: 'Engineering GitHub',
    labelAr: 'GitHub الهندسي',
  }),
  github_company: Object.freeze({
    id: 'github_company',
    uri: 'https://github.com/knoux-io',
    scheme: 'https',
    kind: 'web',
    labelEn: 'KNOUX GitHub',
    labelAr: 'GitHub الخاص بـ KNOUX',
  }),
  facebook_founder: Object.freeze({
    id: 'facebook_founder',
    uri: 'https://www.facebook.com/CopSadek',
    scheme: 'https',
    kind: 'web',
    labelEn: 'Founder on Facebook',
    labelAr: 'المؤسس على فيسبوك',
  }),
  facebook_company: Object.freeze({
    id: 'facebook_company',
    uri: 'https://www.facebook.com/knouxStore/',
    scheme: 'https',
    kind: 'web',
    labelEn: 'KNOUX on Facebook',
    labelAr: 'KNOUX على فيسبوك',
  }),
  tiktok: Object.freeze({
    id: 'tiktok',
    uri: 'https://www.tiktok.com/@knoux_7',
    scheme: 'https',
    kind: 'web',
    labelEn: 'KNOUX on TikTok',
    labelAr: 'KNOUX على تيك توك',
  }),
});

const IDENTITY_TARGETS = Object.freeze(Object.keys(IDENTITY_LINKS));

const ALLOWED_SCHEMES = Object.freeze(['https', 'mailto', 'tel']);

function resolveIdentityLink(target) {
  if (typeof target !== 'string' || !Object.prototype.hasOwnProperty.call(IDENTITY_LINKS, target)) {
    const error = new Error('The requested identity destination is not in the fixed allowlist.');
    error.code = 'IDENTITY_TARGET_INVALID';
    error.retryable = false;
    throw error;
  }
  const entry = IDENTITY_LINKS[target];
  // Defence in depth: a future edit cannot smuggle a non-allowlisted scheme in.
  let parsed;
  try {
    parsed = new URL(entry.uri);
  } catch {
    const error = new Error('The fixed identity destination is not a valid URI.');
    error.code = 'IDENTITY_URI_INVALID';
    error.retryable = false;
    throw error;
  }
  if (!ALLOWED_SCHEMES.includes(parsed.protocol.replace(':', ''))) {
    const error = new Error('The fixed identity destination uses a scheme KNOuX does not open.');
    error.code = 'IDENTITY_SCHEME_INVALID';
    error.retryable = false;
    throw error;
  }
  return entry;
}

/** Public, renderer-safe projection. No extra fields, no mutation. */
function publicIdentityLinks() {
  return IDENTITY_TARGETS.map(id => ({ ...IDENTITY_LINKS[id] }));
}

module.exports = {
  IDENTITY_LINKS,
  IDENTITY_TARGETS,
  ALLOWED_SCHEMES,
  resolveIdentityLink,
  publicIdentityLinks,
};
