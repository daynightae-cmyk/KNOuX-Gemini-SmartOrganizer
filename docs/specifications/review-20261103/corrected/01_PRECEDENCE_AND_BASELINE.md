# 01 — Precedence and Baseline

This file exists because the first package contained two instructions that could not both be true: it told the implementation agent to treat the specification as the sole source of truth for required behavior *and* the archived ledgers as the sole source of truth for current state, while also telling it to verify the repository itself first. It also recorded a baseline that was already stale when it shipped.

Read this file before the execution prompt. It settles precedence, states the measured baseline, and sets the rules for working in a checkout that other agents are writing to.

---

## Part 1 — Precedence: what outranks what

### 1.1 What the specification is, and what it is not

This package is a **production-engineering execution specification**. It states behavior the product is required to have, the classes of evidence required to claim it, and the order in which work must be done.

It is **not** a description of the current product, and it is not a declaration that KNOuX is production-ready. Nothing in it is evidence that a feature works. Where it describes current implementation, that description is a snapshot taken by someone reading at a moment, and the moment has passed.

### 1.2 The precedence order for a claim about current state

Highest first. This replaces every "source of truth" sentence in the package.

| # | Authority | Why it ranks here | How to obtain it |
|---|---|---|---|
| 0 | **Behavior observed on a real Windows host in a real Electron session, at a recorded SHA** | The product runs here. Nothing above it exists. | `npm run desktop:smoke` / `desktop:packaged-smoke` in `apps/gemini-ui`, receipt retained |
| 1 | **The source tree at the current HEAD** | It is the definition of what the code does today, and it is cheap to read | Open the file. Cite `path:line`. Do not cite a ledger about the file |
| 2 | **A tested SHA with a machine-readable result behind it** | Proves behavior at a point in time; may be stale, cannot be fabricated if the command and exit code are recorded | Test script output, `native-smoke-*.json`, CI run on that exact commit |
| 3 | **An evidence file that has been opened and re-read at this baseline** | Real artifact, but it was produced under conditions you must re-check | Re-read it; record its date and the SHA it names |
| 4 | **The archived ledgers** (`LIVE_SERVICE_EXECUTION_STATUS_181.csv`, `SERVICE_WORKSPACE_IMPLEMENTATION.csv`, `SERVICE_REGISTRY_EVIDENCE.md`, `SERVICE_WORKBENCH_ACCEPTANCE.md`, `MISSION_LEDGER.json`) | Dated claims *about* the implementation. The archive's own readme says the CSV holds 181 registered entries, **not** 181 verified engines | `Evidence/` in this package |
| 5 | **Any sentence in any volume of this specification about what the code does today** | Written without repository access, or written from the layer above | Volumes 1–4 |

Two corollaries, both binding:

- **Newer verified implementation beats older specification.** If the code does something the document says must not happen, the code is not automatically wrong and the document is not automatically right. Record the divergence, keep working, and put it in the handover for the owner to settle. Do not silently revert working functionality to match a stale sentence, and do not silently edit the requirement to match the code.
- **A ledger can never promote a status.** `SERVICE_WORKSPACE_IMPLEMENTATION.csv` carries the phrase "Existing contract retained; not newly audited" in most rows. That is an assertion of non-audit. It is not evidence, and it must not be quoted in a status column as if it were.

### 1.3 Precedence for required behavior

Different axis, unchanged rule: the volumes define required behavior; the ledgers never do. If a ledger and a contract disagree about what *should* be built, the contract wins. If a contract and the owner disagree, the owner wins and the correction goes into the correction ledger with a date.

### 1.4 Terminology the package must stop using

`sole source of truth`, `the authoritative record` (about a ledger), and `as verified` (without a SHA) are retired. Use instead: `the ID registry` (for the 181-row CSV), `historical classification, as recorded on <date>`, and `verified at <sha> by <command>`.

---

## Part 2 — The measured baseline

Everything below was measured in the canonical checkout on **2026-11-03** by this correction pass. It is a dated observation, not a permanent baseline, and **it is already moving**: local `main` advanced **twice** while this package was being written, and the working tree changed from a Repair edit set to a Cleanup edit set between two commands in the same session.

### 2.1 The point that matters more than any number here

**Do not treat the numbers in this document as the baseline. Treat the commands in 2.6 as the baseline.** The repository is shared with at least two other writers. Any SHA pinned in prose is stale the moment it is published — the shipped package proved this by recording `8ff8131` as HEAD when the real tip was four commits further along.

This document proved it again while being written. `main` moved **twice** during this single correction pass:

| When | `main` tip | How it was observed |
|---|---|---|
| Session start | `e86fbf659c391b2a0dadb354ef7abcc6667ebe39` | first `git rev-parse HEAD` |
| ~40 minutes later | `ef25624bbf40a915aa38ca27e62b9263755982b3` — `feat(repair): integrate native evidence and specialised recovery workspaces` | the agent running the test inventory reported a different HEAD than the one I had recorded; `git reflog` showed the commit landing at 03:14:06 +0400 |
| While writing this section | `11875da98b460ecc4ac28fcee1ff9ee14d0790d7` — `feat(cleanup): integrate measured service workspaces and scope controls` | re-measured before publishing the table below |

Three tips in one pass, all on `main`, all in the canonical dirty checkout, none of them pushed. That is the fact the rest of this document is built around.

### 2.2 Measured at authoring time

| Item | Measured value | Note |
|---|---|---|
| Canonical workspace | `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer` | verifier `python scripts/verify-workspace.py` returned `"status": "PASS"` |
| Branch | `main` | the owner mandate is main-first |
| Local tip at session start | `e86fbf659c391b2a0dadb354ef7abcc6667ebe39` | |
| Local tip later in the same session | `ef25624bbf40a915aa38ca27e62b9263755982b3` (`ef25624`) | committed by another agent at 03:14:06 +0400 — this is why 2.1 exists |
| Local tip at publication | `11875da98b460ecc4ac28fcee1ff9ee14d0790d7` (`11875da`) | second concurrent commit during the same pass |
| `origin/main` | `8871103c7fd2a274a70fe2a069bb435f2ccb12ac` | **behind** local main |
| Divergence | `0 7` (0 behind, **7 unpushed ahead**) at publication; it was `0 6` twenty minutes earlier and `0 5` at the start | the package said "two unpushed commits"; that was stale before it shipped |
| Package's recorded HEAD | `8ff8131…` | five commits behind the tip at publication |
| Working tree | 5 tracked modifications + ~604 untracked paths | active concurrent work: Home search, Cleanup service rail, evidence PNGs, ledger edits. Earlier in the same pass it was 8 modified + 610 untracked; the concurrent agent committed some of it |
| Stash | empty | |
| Donor branch `origin/v0/knoux-smartorganizer-integration-b432675e` | **6 unique commits** (`d2c4b89`, `6856007`, `f00f661`, `c7e9fec`, `f815c4b`, `c01638d`) | PR #4 content; still the only branch holding work that is not in `main` |
| `codex/service-workspaces-20261101` | **0 unique commits** vs main | already fully contained; do not re-merge |
| `openhands/native-services-20261102` | **0 unique commits** vs main | already fully contained |
| `origin/feat/gemini-missions` | **0 unique commits** vs main | already fully contained |
| Worktrees | canonical `main`; `C:\KNOuX-OpenHands-NativeServices` at `41a3768` (**path missing**, git marks it *prunable*); two `C:\tmp\conversation-worktrees\…` at `8871103`, both clean | see 3.3 |
| Recorded implementation SHAs `71240ce`, `e819b2c`, `2a7fcbd`, `df655ab` | all present and **reachable** from current HEAD | previously verified work is not lost; no reason to downgrade it |
| CI on `main` | last observed success `8871103` — which is `origin/main`, not the local tip | the local tip has no CI proof precisely because it is unpushed |

### 2.3 Verification gates that exist and run today (measured, not assumed)

`apps/gemini-ui/package.json` defines them; there is **no aggregate `npm test`** and `lint` is `tsc --noEmit`, not ESLint.

Gated by CI (`.github/workflows/gemini-platform.yml`, `windows-latest`, on push and PR): `lint`, `build`, `test:theme`, `test:i18n`, `ledger:check`, plus 20 domain suites — `test:native`, `test:clipboard`, `test:studio`, `test:studio-safety`, `test:files`, `test:storage`, `test:scan`, `test:apps`, `test:cleanup`, `test:startup`, `test:system`, `test:repair`, `test:services`, `test:automation`, `test:workspace`, `test:settings`, `test:home`, `test:workbench`, `test:google`, `test:navigation`.

Not in CI: `desktop:smoke`, `desktop:packaged-smoke`, `desktop:pack`, `visual:matrix`, `test:entry` (Playwright runs only from `cinematic-entry.yml`, and only for PRs touching `apps/gemini-ui/**` or pushes to that feature branch).

Also measured: at least **15 test scripts exist that no npm script and no workflow runs**, including the ones that cover real mutation paths — `live-organization-test.cjs`, `storage-vault-test.cjs`, `service-actions-test.cjs`, `startup-actions-test.cjs`, `automation-runner-test.cjs`, `automation-scheduler-test.cjs`, `clipboard-electron-test.cjs`. Coverage exists and is unwired. Promoting an existing orphan into `package.json` is usually cheaper than writing a new test, and the matrix names the orphan per service.

**Every gated suite is synthetic.** They use temp directories, injected providers and mock SCM/registry adapters. Two of them explicitly list `reg.exe`, `sc.exe`, `schtasks`, `Stop-Service` as *forbidden strings* in a source denylist — which proves absence of mutation, not correct behavior. Real-runtime evidence is the two `native-smoke` receipts, both dated 2026-10-27, one of which is an **exit code 1** failure (`THUMBNAIL_PROVIDER_FAILED`) — see Volume 8 §50.1.

### 2.4 The native surface, measured

| Quantity | Value | Source |
|---|---|---|
| Registered channels | **140** | `apps/gemini-ui/shared/native-contract.json` |
| Registered capabilities | **137** | same (`bridge` 1, `folder` 1, plus per-domain families) |
| Operation channels **not** in that registry | **33** | literal `knoux:operations:v1:<method>` built in `electron/native/operation-ipc.cjs:10`, hardcoded again in `electron/preload.cjs:456-488` |
| Typed renderer binding functions with `NativeEnvelope<T>` returns | **120** across 12 domain files | `Matrix/native_binding_map.json` |
| Mutation executors that actually exist | **5 families** | organization `execute`/`undo`; StorageVault `vaultExecute`/`vaultRestore`; `StartupActions.apply` (HKCU Run only); `ServiceActions.apply` (start/stop only); `ClipboardVault.copyBack` (consented clipboard write) |
| Explicitly gated with **no** executor | install / update / uninstall, association write, registry write beyond HKCU Run, hosts write, DISM, SFC, `netsh` resets, recycle-bin empty, quarantine purge, OS-level scheduled tasks, any Google product write | `GATED_OPERATIONS` in `app-bridge.cjs`, `repair-providers.cjs`; headers in `cleanup-bridge.cjs`, `services-bridge.cjs` |
| Services registered in ledgers | **181** | `docs/LIVE_SERVICE_EXECUTION_STATUS_181.csv` |
| Service ids that key a renderer workbench today | **132** | `Matrix/matrix_181_v2.csv`; the other 49 are D01 (12), D02 (10), D03 (9), D04 (10), D14 (8) |

Two structural findings the corrected matrix carries per service:

1. **There is no crosswalk from catalog id to capability id anywhere in the renderer.** Searched for `capabilityId`, `SERVICE_TO_CAPABILITY`, `nativeCapability` — zero hits. Capability strings appear only as the second argument of `assertEnvelope(...)` in the 12 `src/*/native.ts` files. So the claim "service X uses operation Y" has to be established by reading code, per service, and that is now written as an explicit task in each contract.
2. **The 33 operation channels bypass the registry**, and the permission value they emit (`per-operation-consent`) is not a member of the declared `PermissionGate` union (`'read-only' | 'user-initiated' | 'not-granted'`), because `security.cjs` `envelopeBase` passes `permission` through without validating it. Registering those channels and validating that field are concrete, small, high-value fixes.

### 2.5 What this pass did *not* verify

State this as plainly as the facts above. This correction pass **ran no per-service runtime gate and executed no acceptance test**. The numbers in 2.2–2.4 come from reading files, running read-only git commands, one `gh run list` query, and the generators in `build/`. Any statement in this package that a service works is inherited from a dated record, flagged accordingly, and is not this pass's claim.

### 2.6 The commands that establish the baseline (run these, in order, before anything else)

```bash
# 0. guard first; if it FAILs, stop and do not initialize or checkout anything else
python scripts/verify-workspace.py

# 1. where am I, exactly
git rev-parse HEAD && git rev-parse --abbrev-ref HEAD
git rev-list --left-right --count origin/main...HEAD     # "behind ahead"
git status --porcelain | wc -l && git status --porcelain | head -30

# 2. who else is writing here
git worktree list
git reflog -n 10 --date=iso                                 # commits by others land here
git stash list

# 3. is any recorded work still reachable
for s in 71240ce e819b2c 2a7fcbd df655ab 8ff8131; do
  git cat-file -e "$s^{commit}" 2>/dev/null \
    && { git merge-base --is-ancestor "$s" HEAD && echo "$s REACHABLE" || echo "$s PRESENT-NOT-REACHABLE"; } \
    || echo "$s ABSENT";
done

# 4. which donors still hold unique work (expect only v0/...b432675e)
for b in codex/service-workspaces-20261101 openhands/native-services-20261102 \
         origin/feat/gemini-missions origin/v0/knoux-smartorganizer-integration-b432675e; do
  printf "%s -> %s unique\n" "$b" "$(git rev-list --count HEAD.."$b")";
done

# 5. gates, on a clean exact SHA you control, never in the shared dirty checkout
cd apps/gemini-ui && npm run lint && npm run build
npm run test:native && npm run test:studio && npm run test:storage
# record: command, exit code, counts, SHA, and whether the run was fixture or real
```

Record the output verbatim in your handover. If any number differs from §2.2, **the new measurement wins** and §2.2 becomes the historical record — that is the intended behavior, not a failure.

---

## Part 3 — Concurrent-agent protection

The checkout is shared. Other writers are active now: the canonical worktree received a commit from another agent mid-session, and its dirty file set changed between two of my own commands. These rules are what keep a second agent from destroying that work while following this specification.

### 3.1 Hard prohibitions in the canonical checkout

Never, in `D:\KNOUX-Workspace\KNOuX-Gemini-SmartOrganizer`, without a separate owner instruction naming the exact command:

- `git reset --hard`, `git checkout -- <path>`, `git restore`, `git clean` (any flags), `git stash drop`
- `git worktree prune`, `git worktree remove`, `git branch -D`, `git push --force`, history rewriting
- deleting or overwriting untracked files, including anything under `docs/evidence/`, `apps/gemini-ui/visual-evidence/`, `docs/handoffs/`
- committing another agent's modified file as part of your own commit
- merging into `main`, or pushing anything, on the strength of this document alone

The `?? ` and ` M ` entries in `git status` here are not junk. They are someone's in-flight work. Through this single pass the count moved between `8 modified + 610 untracked` and `5 modified + 604 untracked` as another agent committed part of it — nobody cleaned anything.

### 3.2 Where you work instead

Create your own worktree with your own branch, from a base you measured and recorded, and work only there:

```bash
git worktree add ../KNOuX-codex-<mission> -b codex/<mission>-<date> <measured-base-sha>
```

Never `cd` into the canonical checkout to "quickly fix" something. If a change must land in the canonical tree, it lands by reviewed merge into a base that is current at merge time — not by editing files someone else has open.

### 3.3 Known shared artifacts and their exact state

| Artifact | State at authoring | Protection rule |
|---|---|---|
| `C:\KNOuX-OpenHands-NativeServices` (branch `openhands/native-services-20261102`, at `41a3768`) | directory **missing**; git reports the registration *prunable* | **Do not prune.** The branch is fully contained in `main` (0 unique commits), so nothing is lost either way — but pruning removes another agent's registration and its reflog entry. Record it and leave it. |
| two `C:\tmp\conversation-worktrees\<uuid>\KNOuX-OpenHands-NativeServices` at `8871103` | present, both clean | leave alone; they belong to OpenHands conversations |
| `docs/MISSION_LEDGER.json` | **currently modified** by another agent | do not stage it. If your mission requires a ledger edit, note it in the handover instead of writing it |
| `docs/evidence/**`, `apps/gemini-ui/visual-evidence/**` | actively written by capture scripts (346 tracked files under `visual-evidence/`) | never regenerate in place from a shared checkout; some suites were skipped in this pass *because* they overwrite tracked artifacts |
| `apps/gemini-ui/src/cleanup/CleanupLiveStage.tsx`, `src/home/search-history.ts`, `src/repair/RepairLiveStage.tsx`, `scripts/verify-execution-evidence.py`, `docs/PROJECT_EXECUTION_CONTROL_20261102.md`, `docs/SECOND_GENERATION_PROJECT_EXECUTION_PROMPT.md` | untracked, in flight | read-only for you; they are another agent's uncommitted work |
| `origin/v0/knoux-smartorganizer-integration-b432675e` (6 commits, PR #4) | unmerged donor | integrate by reviewed cherry-pick only; PR #4's entry checks were failing per the visual handoff, so verify before you reuse them |

### 3.4 Ownership boundaries

The visual/live-workspace files are owned by the agents currently editing them (Home search, Cleanup inner workspace, Repair inner workspace are visibly mid-flight). Native contract files (`shared/native-contract.json`, `shared/native-contracts.ts`, `electron/preload.cjs`, `electron/native/*.cjs`) are the stable layer this specification most often needs changed — changes there are additive and backward-compatible only, and a breaking change requires a version bump, a compatibility shim and a contract test.

Before editing any file, run `git log -1 --format='%an %ar %s' -- <path>` and `git status --porcelain -- <path>`. If it is dirty and not yours, stop and work around it.

### 3.5 The preservation step, before you switch anything

```bash
git bundle create ../KNOuX-preserve-$(date +%Y%m%d-%H%M).bundle --all
git diff > ../KNOuX-wip-tracked.patch               # tracked modifications, as-is
git log --oneline origin/main..HEAD > ../KNOuX-unpushed-commits.txt
```

Write these **outside** the repository. They are the undo button for your own mistakes; they are also how you prove you did not lose someone else's work.

---

## Part 4 — How the rest of the package fits this file

- The execution prompt (`00_AGENT_EXECUTION_PROMPT.md`) starts at Part 2 §2.6 and treats this file as the precedence authority.
- The working matrix is `Matrix/matrix_181_v2.csv`, generated by `build/matrix_v2.py` from this repository, and it separates historical classification from current-runtime verification.
- The 157 unreassessed entries are queued in `Matrix/revalidation_queue.md`.
- Contract completeness, per service with all twelve A–L parts, is in `Contracts/`.
- Everything the archive could not support is written as a Codex task, never as a fact.
- `02_CORRECTION_LEDGER.md` lists each change made to the original package and why.
