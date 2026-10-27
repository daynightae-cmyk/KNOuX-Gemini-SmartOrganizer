# Files pilot — owner visual recovery

Baseline: owned worktree `visual-owner-rebuild`, branch `feat/knoux-visual-studio-rebuild-20261027`, HEAD `9eaa161ab8b7e81f629f69ec180021cf878f166f`. Workspace verifier PASS. Existing untracked missions retained. Studio design anchor: `d4eba0da18b02ec653a669ba0a0339071acff57f`.

## Source trace before implementation

- `files-visual.css` and `files-reference.css` both own heading, orbit, results and inspector geometry. The orbit has a 232px minimum layout height in `orbital-engine.css`, but its Files host is only 135–195px and uses scale(.62/.72). This makes the host and actual rendered controls disagree.
- `files-reference.css` uses an auto-sized header grid track. Search, native status, wrapped category pills and expandable filter/distribution details all contribute to that track; no bounded filter drawer exists. Results are given a minimum 180px height after the header rather than the remaining viewport height.
- Its <=1250px breakpoint changes the main canvas into `overflow-y:auto` and assigns 360px minimum results plus a 620px inspector. This creates the explicit page/main vertical-scroll chain rejected by the owner.
- The inspector combines a selected-file dossier, image, service preview and twelve 68px service tiles in one long scroll. Primary service context is below the fold. The reference has deliberate selected-file, action and recommended-tool zones.
- The heading says "Find instantly…" with no reference feature groups or coherent metric band. Arbitrary purple slabs and nested borders replace the reference navy/pearl composition.

## Responsibility ledger

`FilesPage.tsx` retains data/query/action/workbench ownership. `files-reference.css` owns Files-only route geometry and day/night materials. `files-visual.css` owns only Files typography and selection emphasis. Shared shell, Studio, native hooks, Electron/preload and other worktrees are outside this change.

The Files-specific legacy rules were removed from `reference-polish.css` and `orbital-engine.css` so they cannot reassert a 320px orbit cap or hidden heading overflow. `OrbitalControl.tsx` has only an optional icon prop; its default for all other routes is unchanged.

Fresh baseline measurements from the exported `9eaa161` source: DAY 1366 main overflow 2px, NIGHT 1366 main overflow 23px and results outside the intended viewport; both 1672 themes 0px. Final overview geometry is 0px overflow in all 20 renderer cases. Actual Electron measurements and image review remain separately identified in the acceptance report.

Before/after screenshots and ancestor geometry are stored separately in `docs/evidence/files-owner-pilot/{before,after}`. Browser fixture screenshots are renderer evidence, never proof of measured Windows data. Manual owner reference acceptance remains pending.
