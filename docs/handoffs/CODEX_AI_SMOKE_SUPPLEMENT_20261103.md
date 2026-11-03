# Codex native AI smoke supplement — 2026-11-03

This is the unique correction salvaged from Codex's local HANDOVER.md.
Canonical HANDOVER.md was not replaced because main contains a newer Qoder-to-DeepSeek handover.

The isolated AI boundary probe used an injected fetch. No live OpenRouter,
OpenAI or Anthropic credential was used; real provider network authorization
is **not verified**.

The archived `npm run desktop:smoke` at
`docs/evidence/all-services-20261103/smoke-run-1cd7e8d/`
exited **1** overall. Cleanup, System, Repair, Services, Automation,
Settings, Home and Workbench Host probes were red in that run.

The AI boundary subset inside the same receipt reported:
`securityOk: true`, `bridgeOk: true`, `providerOk: true`.
The separate real-Electron `ai-electron-probe.json` reports **29 checks,
zero failures**, covering runtime registration, provider request shape,
redaction and Windows DPAPI availability, with
`dpapiEncryptionAvailable: true`.

These subset results do **not** mean whole-app smoke or live AI provider
verification passed. Preserve this distinction through release gating.
