import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaults, loadPreferences, transition } from '../../src/features/cinematic-entry/model';
import { EntryAudio } from '../../src/features/cinematic-entry/audio';
test('readiness is required; repeated Enter and finish are idempotent', () => {
  assert.equal(transition('INIT', 'ENTER'), 'INIT');
  assert.equal(transition('FORMING', 'ENTER'), 'FORMING');
  assert.equal(transition('READY', 'ENTER'), 'ENTERING');
  assert.equal(transition('ENTERING', 'ENTER'), 'ENTERING');
  assert.equal(transition('ENTERING', 'FINISH'), 'ACTIVE');
  assert.equal(transition('ACTIVE', 'FINISH'), 'ACTIVE');
  assert.equal(transition('ACTIVE', 'REPLAY'), 'INIT');
});
test('preferences tolerate corrupt or unavailable storage, mute by default', () => {
  assert.deepEqual(loadPreferences({ getItem: () => '{' }), defaults);
  assert.deepEqual(loadPreferences({ getItem: () => { throw Error('denied'); } }), defaults);
  assert.deepEqual(loadPreferences({ getItem: () => '{"seen":true,"muted":"false","always":true,"secret":"ignored"}' }), { ...defaults, seen: true, always: true });
});
test('audio is lazy, denial is nonfatal, pending resume cancelled on dispose', async () => {
  let created = 0, closed = 0, resume!: () => void;
  const audio = new EntryAudio(() => { created++; return { state: 'running', resume: () => new Promise<void>(r => { resume = r; }), close: async () => { closed++; } } as unknown as AudioContext; });
  assert.equal(created, 0); const playing = audio.gesture('enter'); assert.equal(created, 1);
  audio.dispose(); resume(); assert.equal(await playing, false); assert.equal(closed, 1);
  const denied = new EntryAudio(() => { throw Error('denied'); }); assert.equal(await denied.gesture('enter'), false);
});
