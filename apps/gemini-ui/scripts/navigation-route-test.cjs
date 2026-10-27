'use strict';

/**
 * KNOuX Gemini — navigation hash-listener regression test.
 *
 * The hash listener must be registered once and read the latest section from a
 * ref. Re-registering it on every section change with a stale closure allowed a
 * queued hashchange event to revert a newer route (observed under rapid smoke
 * navigation). This is a source gate; the Electron smoke proves real routing.
 */

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const appRoot = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(appRoot, 'src', 'context', 'NavigationContext.tsx'), 'utf8');
const failures = [];

function check(name, run) {
  try {
    run();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, message: String(error?.message || error) });
    console.log(`  ✗ ${name}: ${error?.message || error}`);
  }
}

console.log('[navigation-route-test]');

check('current section is mirrored into a ref', () => {
  assert.match(source, /const currentSectionRef = useRef<AppSection>\(currentSection\)/);
  assert.match(source, /currentSectionRef\.current = currentSection/);
});

check('hash listener reads the latest section and registers once', () => {
  assert.match(source, /const parsed = tryNormalizeSection\(hash\)/);
  assert.match(source, /parsed !== currentSectionRef\.current/);
  assert.match(source, /currentSectionRef\.current = parsed/);
  const effect = source.slice(source.indexOf('Listen to hash changes'), source.indexOf('const navigateTo'));
  assert.match(effect, /window\.addEventListener\('hashchange', handleHashChange\)/);
  assert.match(effect, /return \(\) => window\.removeEventListener\('hashchange', handleHashChange\)/);
  assert.match(effect, /\}, \[\]\);/);
  assert.ok(!/\[currentSection\]/.test(effect), 'listener must not re-register on every section');
});

check('navigateTo and goBack update the ref with the route', () => {
  const navigate = source.slice(source.indexOf('const navigateTo'), source.indexOf('const goBack'));
  assert.match(navigate, /currentSectionRef\.current = normalized/);
  const back = source.slice(source.indexOf('const goBack'), source.indexOf('const isActive'));
  assert.match(back, /currentSectionRef\.current = 'home'/);
  assert.match(back, /currentSectionRef\.current = previous/);
});

const result = { ok: failures.length === 0, checks: 3, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
console.log('[navigation-route-test] PASS');
