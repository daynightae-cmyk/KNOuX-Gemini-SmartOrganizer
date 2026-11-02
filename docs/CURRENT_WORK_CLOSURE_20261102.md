# Current work closure — before historical recovery

Starting main `0b7f5af567330ce60b23fa5afd54150140d04eac` was clean, matched fetched origin/main and had successful CI run 41390979065. The previous Clipboard Vault and CommandCanvas changes remain intact. Vite PID 8540 / Electron PID 1840 were healthy and reused; the other project's port 4174 was left untouched.

## Actual regression proof

`node apps/gemini-ui/scripts/reconciliation-electron.cjs` launched the canonical native main/preload with a disposable profile against the **existing** Vite server. It proved that two inspectors with otherwise-colliding positional keys retain separate drafts and selections across parent observations, canvas tab switches and an actual CSS HMR update. Only the new test-owned stylesheet was temporarily changed, then restored byte-for-byte. No server restart, source grant, owner-file scan or clipboard activation occurred.

The same native application captured Home, Files, Studio, Settings, Smart Scan, Repair and System at actual **content** sizes 1366×768, 1672×941 and 1920×1080, dark/light and EN/AR: 84 captures, zero renderer errors and zero page/horizontal overflow cases. See `docs/evidence/reconciliation-20261102/before/proof.json`. These are runtime/geometry checks and before-images; they are **not** owner visual approval, populated-source tests or a claim of exact reference equality. Existing empty/unmeasured/disabled states and baseline contrast differences remain visible.

## Windows metadata reliability investigation

Original CI 41363396551 failed on `5d27ec1` with `DESTINATION_LINK_REFUSED`; retry 2 passed unchanged, and subsequent 41390979065 passed on `0b7f5af`. The old helper discarded diagnostics and used the same 8-second deadline for both PowerShell launch/Add-Type and warmed queries. Consequently the original failure's exact cause cannot be proven retrospectively.

A controlled delayed-start regression reproduced refusal of a valid metadata reply when initialization exceeds the warm-query deadline. The transport now gives an initial worker a separate bounded 30-second budget, retains the 8-second warm-query deadline, and categorizes failures without paths, clipboard values or helper stderr. No retry, lstat-only fallback or attribute bypass was added. Junction/offline/recall/unknown-attribute checks remain fail-closed.

`npm run test:studio-safety` now runs in Windows CI. Local safety tests pass including real Unicode Win32 paths, missing paths, plain-to-junction replacement, malformed/null/invalid replies, process failures, cold-start delay, warm timeout and exhausted budgets. `npm run test:studio`, TypeScript (`npm run lint`), production build and native contracts also passed. The build's existing large-chunk warning remains.

This closes the active key/HMR/current-preview implementation increment. Historical PR/backup recovery follows separately. It does not close the larger Ultimate activation mission, installed-app/packaged effects or owner visual acceptance.
