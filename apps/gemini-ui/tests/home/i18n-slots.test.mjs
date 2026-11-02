/**
 * KNOuX — bilingual slot guard.
 *
 * Home's helper is `t(isArabic, english, arabic)`. Passing the two strings in
 * the wrong order is invisible to TypeScript and to a screenshot taken in one
 * language: the English build renders Arabic prose and nobody notices until an
 * Arabic-speaking user does. Six such calls shipped into the rebuilt Home and
 * were caught by eye. This test makes that class of mistake a build failure.
 *
 * Run: node --test tests/home/i18n-slots.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, '../../src');
const ARABIC = /[\u0600-\u06FF]/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(tsx|ts)$/.test(entry)) yield full;
  }
}

/** `t(isArabic, A, B)` — three literal-argument forms the codebase actually uses. */
const CALL = /(?:\bt|localeText)\(\s*(?:isArabic|ar|isAr)\s*,\s*(['"])((?:(?!\1)[\s\S])*?)\1\s*,\s*(['"])((?:(?!\3)[\s\S])*?)\3\s*[,)]/g;

const offenders = [];
for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(CALL)) {
    const [, , first, , second] = match;
    const firstIsArabic = ARABIC.test(first);
    const secondIsArabic = ARABIC.test(second);
    if (firstIsArabic && !secondIsArabic) {
      offenders.push(`${path.relative(SRC, file)}: english slot holds Arabic "${first.slice(0, 48)}"`);
    }
  }
}

test('no bilingual helper is called with the Arabic string in the English slot', () => {
  assert.deepEqual(offenders, [], `swapped translation arguments:\n${offenders.join('\n')}`);
});

test('the guard actually sees the Home call sites', () => {
  // A regex that matches nothing would pass the test above just as happily.
  const home = readFileSync(path.join(SRC, 'components/home/ApprovedHomeScreen.tsx'), 'utf8');
  const seen = [...home.matchAll(CALL)].length;
  assert.ok(seen >= 20, `expected the bilingual call pattern to be recognised in Home, found ${seen}`);
});
