'use strict';
const { ok, fail } = require('./security.cjs');
const CHANNELS = Object.freeze({
  clipboardStatus: 'knoux:clipboard:v1:status',
  clipboardConfigure: 'knoux:clipboard:v1:configure',
  clipboardList: 'knoux:clipboard:v1:list',
  clipboardGet: 'knoux:clipboard:v1:get',
  clipboardPin: 'knoux:clipboard:v1:pin',
  clipboardRemove: 'knoux:clipboard:v1:remove',
  clipboardClear: 'knoux:clipboard:v1:clear',
  clipboardCopy: 'knoux:clipboard:v1:copy',
});
const invalid = () => { throw Object.assign(new Error('Invalid vault request.'), { code: 'CLIPBOARD_INPUT_INVALID' }); };
function object(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) invalid();
  return value;
}
function registerClipboardIpc({ ipcMain, getVault, assertSender, confirm }) {
  const methods = {
    clipboardStatus: { noArgs: true, run: vault => vault.status() },
    clipboardConfigure: { run: async (vault, request) => {
      vault.validatePolicy(request);
      if (request.enabled === true && !vault.status().enabled && !await confirm('capture')) throw Object.assign(new Error('Cancelled.'), { code: 'CLIPBOARD_CONSENT_CANCELLED' });
      return vault.configure(request);
    } },
    clipboardList: { run: (vault, request) => vault.list(object(request, ['query', 'type', 'pinnedOnly'])) },
    clipboardGet: { run: (vault, request) => vault.get(object(request, ['id']).id) },
    clipboardPin: { run: (vault, request) => { object(request, ['id', 'pinned']); return vault.pin(request.id, request.pinned); } },
    clipboardRemove: { run: async (vault, request) => {
      object(request, ['id']); await vault.get(request.id);
      if (!await confirm('remove')) throw Object.assign(new Error('Cancelled.'), { code: 'CLIPBOARD_CONSENT_CANCELLED' });
      return vault.remove(request.id);
    } },
    clipboardClear: { noArgs: true, run: async vault => {
      if (!await confirm('clear')) throw Object.assign(new Error('Cancelled.'), { code: 'CLIPBOARD_CONSENT_CANCELLED' });
      return vault.clear();
    } },
    clipboardCopy: { run: async (vault, request) => {
      object(request, ['id']); await vault.get(request.id);
      if (!await confirm('copy')) throw Object.assign(new Error('Cancelled.'), { code: 'CLIPBOARD_CONSENT_CANCELLED' });
      return vault.copyBack(request.id);
    } },
  };
  for (const [name, method] of Object.entries(methods)) ipcMain.handle(CHANNELS[name], async (event, ...args) => {
    const capability = `clipboard.${name.slice('clipboard'.length).toLowerCase()}`;
    try {
      assertSender(event);
      const vault = getVault();
      if (!vault) throw Object.assign(new Error('Unavailable.'), { code: 'CLIPBOARD_UNAVAILABLE' });
      if (args.length !== (method.noArgs ? 0 : 1)) invalid();
      const data = await method.run(vault, args[0]);
      return ok({ capability, source: 'Electron opt-in local Clipboard Vault', permission: 'user-initiated', data });
    } catch (error) {
      // No clipboard content, paths, provider exceptions or decryption details
      // are ever returned in errors or written to the operation journal.
      return fail({ capability, source: 'Clipboard Vault', permission: 'not-granted', error: {
        code: /^(?:CLIPBOARD_[A-Z_]+|UNTRUSTED_SENDER)$/.test(error?.code || '') ? error.code : 'CLIPBOARD_REQUEST_FAILED',
        message: 'The vault request was not completed. Check consent and local storage status.',
      } });
    }
  });
}
module.exports = { CHANNELS, registerClipboardIpc };
