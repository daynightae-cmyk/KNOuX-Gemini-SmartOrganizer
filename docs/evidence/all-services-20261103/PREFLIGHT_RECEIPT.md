# KNOuX 181-Service Mission — Safety Preflight Receipt

Captured in the isolated execution worktree before any source edit.
Redacted: no user profile path, no credential, no personal file name.

## Isolation gate

| Field | Observed | Authoritative source |
|---|---|---|
| Worktree | `C:\KNOUX-Codex-AllServices-20261103` | `git rev-parse --show-toplevel` |
| Branch | `codex/knoux-all-services-20261103` | `git branch --show-current` |
| Starting HEAD | `0c853c9a66fb6e39317c0c13dc22d89aec62f995` | `git rev-parse HEAD` |
| Tracked status at entry | empty (`git status --short` printed nothing) | direct read |
| Git common dir | the canonical `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer\.git` | `git rev-parse --path-format=absolute --git-common-dir` |
| Origin | `https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git` | `git remote get-url origin` |
| Worktree re-created? | No. Reused exactly as the owner-authorized handoff created it. | — |

`git worktree list` also showed the canonical `main` at `a1aacd8` (it had moved
past `0c853c9` after the handoff snapshot), two live OpenHands conversation
worktrees, and `C:/KNOuX-OpenHands-NativeServices` marked `prunable`. Nothing
was pruned, deleted, fetched, rebased or reset.

## Fail-closed workspace verifier

`python scripts/verify-workspace.py` originally returned:

```
KNOuX_CANONICAL_WORKSPACE_BLOCKED: WRONG WORKSPACE: C:\KNOUX-Codex-AllServices-20261103
```

The verifier is an exact-path allowlist that already carries four dated
owner-authorization exceptions (`visual-owner-rebuild`, `live-organization`,
`unified-20261028`, `anima-v0-integration`). This mission's owner-authorized
checkout was not registered in it, so the guard blocked the authorized worktree
rather than guarding it.

Following that established pattern, an exception was added for this exact path
and branch only, plus two extra fail-closed checks that did not exist before:

- the isolated branch must never be `main`;
- the authorized base commit `0c853c9…` must be an ancestor of `HEAD`.

Post-change result:

```json
{
  "workspace": "C:\\KNOUX-Codex-AllServices-20261103",
  "origin": "https://github.com/daynightae-cmyk/KNOuX-Gemini-SmartOrganizer.git",
  "branch": "codex/knoux-all-services-20261103",
  "sha": "0c853c9a66fb6e39317c0c13dc22d89aec62f995",
  "status": "PASS"
}
```

Negative control (the guard still fails closed): running the same script from an
unregistered directory returns
`KNOuX_CANONICAL_WORKSPACE_BLOCKED: WRONG WORKSPACE` with exit code 1.

## Canonical checkout ownership — protected, untouched

Dirty tracked files observed in the canonical `main` checkout belong to other
running agents and were never read into, copied to, staged, committed or
modified from this worktree:

```
apps/gemini-ui/scripts/theme-evidence-matrix.mjs
apps/gemini-ui/src/home/search.ts
apps/gemini-ui/src/pages/HomePage.tsx
apps/gemini-ui/src/pages/StartupPage.tsx
apps/gemini-ui/src/startup/PlanGate.tsx
apps/gemini-ui/src/startup/ServiceRail.tsx
apps/gemini-ui/src/startup/AutorunRegister.tsx
docs/MISSION_LEDGER.json
docs/evidence/living-glass-20261102/artwork-day1672/smart_scan-day-en-1672x941-body-end.png
```

This mission therefore avoids `HomePage.tsx`, `src/home/search.ts` and every
`src/startup/**` file.

## Machine capacity at preflight

| Drive | Free |
|---|---|
| C: | ~8.1 GB of 140 GB |
| D: | ~1.0 GB of 62 GB |

Consequence: no mass archiving, no duplicate backup, and dependencies were
installed with `npm ci --ignore-scripts` first (470 packages) so that nothing
downloads until a test actually needs it. The Electron runtime was fetched
separately only after the static suites were green.

## Baseline before any edit

| Check | Command | Exit |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | 0 |
| Native contract suite | `node scripts/native-contract-test.cjs` | 0 (PASS, 0 failures) |

Both baselines were recorded so a later failure can be attributed rather than
assumed.
