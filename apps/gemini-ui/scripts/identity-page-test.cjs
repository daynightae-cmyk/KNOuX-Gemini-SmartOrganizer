'use strict';

/**
 * Source gate for the Founder & Developer identity surface.
 *
 * The identity page is the only place in the product that hands a destination
 * to the operating system, so it is checked statically before any Electron run:
 * the native allowlist, the renderer mirror, the preload bridge, the contract
 * registry and the main-process handler must describe exactly the same ten
 * destinations. A drift here would either hide a contact or open a URL the
 * owner never approved, so the test fails closed.
 *
 * No network and no Electron are used; the runtime proof lives in
 * scripts/identity-inner-evidence.mjs.
 */

const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), 'utf8').replace(/\r\n/g, '\n');

const contract = JSON.parse(read('shared/native-contract.json'));
const pkg = JSON.parse(read('package.json'));
const native = require('../electron/native/identity-links.cjs');
const preload = read('electron/preload.cjs');
const mainSource = read('electron/main.cjs');
const navigation = read('src/context/NavigationContext.tsx');
const app = read('src/App.tsx');
const rendererNative = read('src/identity/native.ts');

const failures = [];
const assert = (condition, label) => {
  if (!condition) failures.push(label);
};

const IDENTITY_IDS = [
  'website',
  'product',
  'email',
  'phone',
  'whatsapp',
  'github_engineer',
  'github_company',
  'facebook_founder',
  'facebook_company',
  'tiktok',
];

function expectThrow(fn, code, label) {
  try {
    fn();
    failures.push(`${label} (no error thrown)`);
  } catch (error) {
    assert(error && error.code === code, `${label} (expected ${code}, got ${error && error.code})`);
    assert(error && error.message && error.message.length < 200, `${label} message must stay short`);
  }
}

async function main() {
  const profile = await import('../src/identity/profile.ts');
  const links = profile.IDENTITY_LINKS;

  /* ---------------------------------------------------------- table parity */

  assert(native.IDENTITY_TARGETS.length === IDENTITY_IDS.length, 'native allowlist has ten destinations');
  assert(links.length === IDENTITY_IDS.length, 'renderer mirror has ten destinations');
  assert(
    JSON.stringify(native.IDENTITY_TARGETS) === JSON.stringify(IDENTITY_IDS),
    'native destination order is the reviewed order'
  );
  assert(
    JSON.stringify(links.map((entry) => entry.id)) === JSON.stringify(IDENTITY_IDS),
    'renderer mirror order matches the native allowlist'
  );

  const nativeTable = native.publicIdentityLinks();
  for (const id of IDENTITY_IDS) {
    const entry = links.find((candidate) => candidate.id === id);
    assert(Boolean(entry), `renderer mirror contains ${id}`);
    const projected = nativeTable.find((candidate) => candidate.id === id);
    assert(Boolean(projected), `native allowlist contains ${id}`);
    if (!entry || !projected) continue;
    assert(entry.uri === projected.uri, `${id} uri matches between native and renderer`);
    assert(entry.scheme === projected.scheme, `${id} scheme matches between native and renderer`);
    assert(entry.kind === projected.kind, `${id} kind matches between native and renderer`);
    assert(entry.labelEn === projected.labelEn, `${id} English label matches`);
    assert(entry.labelAr === projected.labelAr, `${id} Arabic label matches`);
    assert(entry.labelEn.trim().length > 0 && entry.labelAr.trim().length > 0, `${id} has bilingual labels`);
    assert(entry.uri === entry.uri.trim(), `${id} uri has no surrounding whitespace`);
    assert(native.ALLOWED_SCHEMES.includes(entry.scheme), `${id} scheme is allowlisted`);
  }

  /* ------------------------------------------------------------ uri shapes */

  for (const entry of links) {
    const parsed = new URL(entry.uri);
    const protocol = parsed.protocol.replace(':', '');
    assert(protocol === entry.scheme, `${entry.id} uri protocol matches its declared scheme`);
    if (entry.scheme === 'https') {
      assert(entry.uri.startsWith('https://'), `${entry.id} is an explicit https url`);
      assert(!entry.uri.includes('?') && !entry.uri.includes('#'), `${entry.id} carries no query or fragment`);
      assert(Boolean(parsed.hostname) && parsed.hostname.includes('.'), `${entry.id} has a real host`);
    }
    if (entry.scheme === 'mailto') {
      assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.uri.replace(/^mailto:/, '')), `${entry.id} is a valid mail address`);
    }
    if (entry.scheme === 'tel') {
      assert(/^tel:\+?[0-9]{6,15}$/.test(entry.uri), `${entry.id} is a dialable number`);
    }
  }

  /* ----------------------------------------------------- rejection contract */

  expectThrow(() => native.resolveIdentityLink('unknown'), 'IDENTITY_TARGET_INVALID', 'unknown destination rejected');
  expectThrow(() => native.resolveIdentityLink('__proto__'), 'IDENTITY_TARGET_INVALID', 'prototype key rejected');
  expectThrow(() => native.resolveIdentityLink('constructor'), 'IDENTITY_TARGET_INVALID', 'constructor key rejected');
  expectThrow(() => native.resolveIdentityLink('toString'), 'IDENTITY_TARGET_INVALID', 'inherited key rejected');
  expectThrow(() => native.resolveIdentityLink('Website'), 'IDENTITY_TARGET_INVALID', 'ids are case sensitive');
  expectThrow(() => native.resolveIdentityLink(''), 'IDENTITY_TARGET_INVALID', 'empty destination rejected');
  expectThrow(() => native.resolveIdentityLink(undefined), 'IDENTITY_TARGET_INVALID', 'missing destination rejected');
  expectThrow(() => native.resolveIdentityLink(42), 'IDENTITY_TARGET_INVALID', 'non-string destination rejected');
  expectThrow(() => native.resolveIdentityLink({ uri: 'https://evil.example' }), 'IDENTITY_TARGET_INVALID', 'object destination rejected');
  assert(native.resolveIdentityLink('website').uri === 'https://knoux.store/', 'a known destination resolves to its own uri');

  /* --------------------------------------------------------- bridge mirror */

  assert(contract.contractVersion === 1, 'contract version must remain 1');
  assert(contract.channels.identityLinks === 'knoux:identity:v1:links', 'links channel is fixed');
  assert(contract.channels.identityOpen === 'knoux:identity:v1:open', 'open channel is fixed');
  assert(contract.capabilities['identity.links'].mode === 'read-only', 'links capability is read-only');
  assert(contract.capabilities['identity.open'].mode === 'user-initiated', 'open capability is user-initiated');
  assert(
    contract.capabilities['identity.links'].channel === contract.channels.identityLinks &&
      contract.capabilities['identity.open'].channel === contract.channels.identityOpen,
    'capability registry points at the identity channels'
  );

  for (const channel of [contract.channels.identityLinks, contract.channels.identityOpen]) {
    assert(preload.includes(channel), `preload mirrors ${channel}`);
  }
  assert(preload.includes("exposeInMainWorld(\n  'knouxIdentityV1'"), 'preload exposes knouxIdentityV1');
  assert(preload.includes('links: () => ipcRenderer.invoke(CHANNELS.identityLinks)'), 'preload links calls the fixed channel');
  assert(
    preload.includes('open: (target) => ipcRenderer.invoke(CHANNELS.identityOpen, { target: String(target || \'\') })'),
    'preload open sends only a destination id'
  );
  assert(!/knouxIdentityV1[\s\S]{0,400}openExternal/.test(preload), 'preload cannot call openExternal itself');
  assert(!preload.includes('identityOpen, target'), 'no raw target is forwarded without wrapping');

  assert(mainSource.includes('resolveIdentityLink(request.target)'), 'main resolves the id through the allowlist');
  assert(mainSource.includes('shell.openExternal(entry.uri)'), 'main opens the resolved uri');
  assert(mainSource.includes("key !== 'target'"), 'main rejects any extra request key');
  assert(mainSource.includes('IDENTITY_REQUEST_INVALID'), 'main reports extra keys as an invalid request');
  assert(!mainSource.includes('identity-links.cjs\').IDENTITY_LINKS'), 'main does not expose the internal table to the renderer');

  /* ------------------------------------------------------- renderer safety */

  assert(
    rendererNative.includes('IDENTITY_LINKS.find((candidate) => candidate.id === target)'),
    'renderer validates the destination against its own table before calling the bridge'
  );
  assert(rendererNative.includes('IDENTITY_TARGET_INVALID'), 'renderer refuses unknown destinations');
  assert(rendererNative.includes('window.open(entry.uri'), 'browser preview opens only a resolved entry');
  assert(!rendererNative.includes('window.open(target'), 'browser preview never opens a raw target');

  /* ------------------------------------------------------ product identity */

  assert(profile.PRODUCT_VERSION === pkg.version, 'identity build label matches package.json');
  assert(profile.ROLES.length === 4, 'four reviewed roles');
  for (const role of profile.ROLES) {
    assert(role.en.trim().length > 0 && role.ar.trim().length > 0, `role ${role.id} is bilingual`);
  }
  assert(profile.PILLARS.length === 4, 'four reviewed pillars');
  assert(
    JSON.stringify(profile.PILLARS.map((pillar) => pillar.id)) === JSON.stringify(['windows', 'consent', 'ai', 'design']),
    'pillar ids stay the reviewed set'
  );
  for (const pillar of profile.PILLARS) {
    for (const key of ['titleEn', 'titleAr', 'bodyEn', 'bodyAr', 'proofEn', 'proofAr']) {
      assert(typeof pillar[key] === 'string' && pillar[key].trim().length > 0, `pillar ${pillar.id}.${key} is present`);
    }
  }
  const versionFact = profile.PRODUCT_FACTS.find((fact) => fact.id === 'version');
  assert(Boolean(versionFact) && versionFact.value === profile.PRODUCT_VERSION, 'facts show the real build number');
  assert(profile.CONTACT.email === 'admin@knoux.store', 'corporate email matches the canonical contact');
  assert(profile.CONTACT.phoneDisplay === '+971 50 328 1920', 'direct line matches the canonical contact');

  /* -------------------------------------------------- fourteen headers only */

  const directory = navigation.slice(
    navigation.indexOf('export const SECTIONS_DIRECTORY'),
    navigation.indexOf('export function tryNormalizeSection')
  );
  assert((directory.match(/\{ id: '/g) || []).length === 14, 'SECTIONS_DIRECTORY still holds exactly fourteen domains');
  assert(!directory.includes("id: 'identity'"), 'identity is not a fifteenth navigation entry');
  assert(navigation.includes('export type DomainSection = Exclude<AppSection, \'identity\'>'), 'domain maps exclude identity');
  assert(navigation.includes("if (s === 'identity' || s === 'about' || s === 'founder' || s === 'developer') return 'identity'"), 'about/founder aliases resolve to identity');
  assert(app.includes("currentSection === 'identity' ?"), 'App renders identity as its own surface');
  assert(app.includes('<IdentityPage onClose={() => navigateTo(\'home\')} />'), 'identity has a real close path');
  assert(app.includes("{currentSection !== 'identity' && ("), 'assistant chat stays out of the identity surface');

  const identityPage = read('src/identity/IdentityPage.tsx');
  assert(
    !identityPage.includes('<header'),
    'identity chrome must not use a bare header: the legacy day theme repaints every header white'
  );
  assert(
    identityPage.includes('<bdi lang="ar" dir="rtl">'),
    'the Arabic name is isolated as inline text, not as a right-aligned block'
  );
  assert(
    read('src/identity/identity.css').includes('position: fixed;'),
    'the identity surface fills the frameless window independently of #root height'
  );

  const result = {
    ok: failures.length === 0,
    destinations: IDENTITY_IDS.length,
    schemes: [...new Set(links.map((entry) => entry.scheme))],
    productVersion: profile.PRODUCT_VERSION,
    failures,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log('[identity-page] PASS');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
