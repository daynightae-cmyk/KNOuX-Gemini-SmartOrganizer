# HANDOVER — historical Qoder implementation record

**Superseded execution location, 2026-11-03:** use canonical local `main` and
[START_HERE_DEEPSEEK.md](START_HERE_DEEPSEEK.md). The C: branch described below
has been merged into main in `21595ee`; it is no longer a coding destination.
The final Qoder note is retained at
`docs/handoffs/QODER_EXECUTION_RECORD_20261103.md`.

---

| Field | Value |
|---|---|
| Mission | All 14 domains / 181 registered service entries |
| Worktree | `C:\KNOUX-Codex-AllServices-20261103` |
| Branch | `codex/knoux-all-services-20261103` |
| Mission base | `0c853c9a66fb6e39317c0c13dc22d89aec62f995` |
| Pushed | **No.** Local branch only. No merge into `main`, no publication. |
| Owner WIP respected | `HomePage.tsx`, `src/home/search.ts`, `src/startup/**`, `theme-evidence-matrix.mjs`, `MISSION_LEDGER.json`, Smart Scan artwork — never read into this branch, never edited |

Read `docs/evidence/all-services-20261103/PREFLIGHT_RECEIPT.md` first: it records
the isolation gate, the fail-closed verifier change, capacity numbers and the
pre-edit baseline.

---

## Slice 1 — D14.02 / D14.08 AI credential boundary (Priority A)

### Defect that was actually present at the base commit

| Location | Behaviour |
|---|---|
| `src/lib/ai-session.ts` | provider key held in renderer page memory |
| `src/pages/SettingsPage.tsx:240` | renderer `fetch('https://openrouter.ai/api/v1/auth/key')` with `Authorization: Bearer <key>` |
| `src/components/chat/ApiKeySetupModal.tsx:73` | same direct renderer probe |
| `src/components/chat/KNOuXAssistantChat.tsx:158` | renderer `fetch` to OpenRouter/OpenAI chat completions with the bearer key |

Per correction C-08 this is a boundary violation against the target
architecture, **not** evidence that a key leaked. No leak was claimed or found.

### What was built

**New** `apps/gemini-ui/electron/native/ai-bridge.cjs` — a Main-process provider
gate that reuses the architecture already proven by `google-auth.cjs`:

- Fixed provider table: `openrouter` → `openrouter.ai`, `openai` →
  `api.openai.com`, `anthropic` → `api.anthropic.com`. HTTPS only, and
  `buildUrl()` re-checks the parsed hostname against its own table entry.
- The renderer **cannot** name a URL, host, path or header. `main.cjs` refuses
  any payload carrying `url/uri/endpoint/host/hostname/baseUrl/origin/headers/
  fetch/target` with `AI_DESTINATION_OVERRIDE_FORBIDDEN`.
- Per-provider auth style: `Authorization: Bearer` for OpenRouter/OpenAI,
  `x-api-key` + pinned `anthropic-version: 2023-06-01` for Anthropic.
- Bounded inputs: 24 messages max, 4 000 chars per message, 16 000 total (older
  turns trimmed), 256 KB response cap, 8 KB credential cap, 4 concurrent
  requests, timeout clamped to 1 s–120 s, token budget capped at 4 096.
- Model allowlist per provider; an unknown model falls back to the reviewed
  default instead of being forwarded.
- `AbortController` on every request, with `cancel` and `cancelAll`.
- **Redaction**: provider error bodies, thrown transport messages and completion
  text all pass through `redact()`, which strips the live credential plus
  `sk-*` / `Bearer` shapes. `getStatus()` returns a 12-hex SHA-256 fingerprint,
  never the key.
- Persistence is opt-in only: `persist: true` **and**
  `safeStorage.isEncryptionAvailable()` must both hold, otherwise the credential
  stays in Main memory and the refusal is surfaced as `AI_STORAGE_UNAVAILABLE`.
  When it does persist it is an atomic `0600` DPAPI blob under
  `userData/ai-bridge-v1/`, never plaintext.
- Anthropic request shaping: system turns are hoisted to the top-level `system`
  field and leading assistant turns are trimmed, because Anthropic rejects both.

**Wired** through the existing fixed contract, no new IPC pattern:
`shared/native-contract.json` (+6 channels, +6 capabilities),
`electron/preload.cjs` (`knouxAiV1`, six named methods, no event stream),
`electron/main.cjs` (`aiGuard` behind the existing `assertTrustedSender` guard,
redaction before any error crosses IPC, `bridge.status` now reports the AI
capabilities as platform-independent).

**Renderer rewritten** so the key never enters it:

- `shared/native-contracts.ts` — typed `AiShellApi` with no destination field.
- `src/lib/ai-bridge.ts` (new) — envelope unwrapper; a browser preview returns
  `AI_BRIDGE_UNAVAILABLE` instead of pretending.
- `src/lib/ai-session.ts` (rewritten) — non-secret mirror: provider, `hasKey`,
  fingerprint, storage boundary, measured error. No key field, no storage call.
- `SettingsPage.tsx` — direct fetch removed; adds Hand to Engine / Test
  Connection / Disconnect & Erase, an explicit persistence opt-in, and a measured
  bridge-state panel.
- `ApiKeySetupModal.tsx` — direct fetch removed; one-way handoff, clears the
  draft immediately, refuses to claim DPAPI in a browser.
- `KNOuXAssistantChat.tsx` — chat no longer fetches; it calls
  `ai.complete`, gains a Cancel control, and the "OpenAI Code Console v2 /
  not connected" fiction plus the fabricated DPAPI migration note were replaced
  with measured state. The fabricated Anthropic placeholder was corrected.
- `App.tsx` — no longer receives or stores a key.

### Verification

| Suite | Result |
|---|---|
| `npm run test:ai` (`scripts/ai-bridge-test.cjs`, new) | **PASS — 154 checks, 0 failures** |
| `npm run test:native` | **PASS — 0 failures** (its renderer credential scan was strengthened from 2 literal names to host/Bearer/fetch/XHR/sendBeacon and still passes) |
| `npm run test:settings` | **PASS — 8 checks** (the stale "no native vault exists yet" assertion was replaced with the new boundary) |
| `npm run test:theme` | **PASS — 12/12** |
| `npm run test:i18n`, `test:workbench`, `test:navigation`, `test:workspace` | **PASS** |
| `npm run lint` (`tsc --noEmit`) | **PASS — exit 0** |
| `npm run build` (vite production) | **PASS — exit 0**, `dist/index.html` CSP present |
| `npm run ledger:check` | **PASS — ok true, 0 problems** |

Static proof of the closed boundary, from the new suite: a walk over every
`src/**.{ts,tsx,js,jsx}` file finds **zero** provider host literals, zero
`Authorization:`/`Bearer ${` constructions, zero `fetch(`, zero XHR or
`sendBeacon`, and zero credential-shaped storage keys.

Two regressions were caught by running the impact suites rather than only the
new one, and both were fixed:

1. `test:theme` failed — the Cancel button introduced `#1b3766` / `#24507f`,
   navy literals outside the generated night-material bridge. Replaced with the
   already-mapped values used elsewhere in that file.
2. `test:settings` failed — it pinned the *old* honesty string. Rewritten to pin
   the new one, including negative assertions that the stale claims are gone.

### Honest tier of this slice

`IMPLEMENTED_AND_FIXTURE_TESTED` plus `VERIFIED_IN_ELECTRON_DEV` for the runtime
registration (see the smoke receipt below), **not** `VERIFIED_ON_WINDOWS_NATIVE`
for a real provider conversation: no live OpenRouter/OpenAI/Anthropic key was
used and no real provider request was made. Every network assertion above runs
against an injected fetch. `npm run desktop:smoke` result:
