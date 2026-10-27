**FAST-SPRINT PRIORITY: Read 00_FAST_TRACK_VISUAL_SPRINT.md FIRST. Implement both visual themes NOW, do a minimal build, commit/push to the isolated visual branch, then proceed to next screen without waiting for full tests or approvals.**

# Task 09 — Repair Lab — KNOuX Signature Visual Overhaul

**Primary references:**
- **Night / dark:** `references/night/09_repair.png`
- **Day / light / الوضع النهاري:** `references/day/09_repair.png`

**Work order:** Task 09 of 10. Commit/push after a short day/night preview and compile check, then continue automatically. Follow `00_MASTER_VISUAL_DIRECTIVE.md`, `DESIGN_SYSTEM_AND_QA.md`, and implement both night + day theme fidelity.

## Objective
Deliver this screen in both **night/dark** and **day/light (الوضع النهاري)** modes, matching the paired references while preserving real product behavior.

Rebuild the existing **Repair Lab** screen around the reference composition and visual character. Hero: **Diagnose. Repair. Recover.**. This is NOT an image-as-background implementation; use real React controls, accessible charts, structured text, interactive inspector panels, CSS/SVG/Canvas2D effects, and existing real native state.

## Required product areas
- Diagnostic tool cards for SFC/DISM/network/restore from actual capabilities
- Risk and permission classification near each action
- Stage-by-stage repair plan, elevation/reboot requirements
- Right execution journal and real rollback capability labels

## Signature action mechanism
Repair diagnostic wheel cannot silently run elevated commands; inspect→review→confirm→execute→verify stages.

## Safety and integrity
No automatic restore-point creation or rollback guarantees; failures/elevation/cancellation clearly represented.

## Typography / cards / layout acceptance
- Replace long, narrow horizontal cards and tiny captions with a clear heading, 1–2 line concise description, strong icon and single actionable button; preserve all meaningful actions.
- Desktop composition: 3-zone shell when room permits (existing nav, hero/content, action inspector). At 1366×768, switch to responsive inspector drawer or smaller, scrollable stack; don't shrink fonts to make a screenshot fit.
- Readable body >=14px at default 100% display scale, metadata >=12px; line height >=1.4, labels may wrap. Arabic is first-class RTL. No overlapping, clipped buttons or stretched copy.
- Preserve existing backend contracts, native bridge capabilities, workbench functionality, guardrails, dark/light themes, language, cinematic entry and actual measured data.

## Deferred comprehensive acceptance checklist — post-sprint QA only
1. Compare the real rendered screen to both paired references — night `references/night/09_repair.png` and day `references/day/09_repair.png` — with labeled before/after/diff, and identify deliberate differences (e.g. real data and dynamic states).
2. Test 1366×768, 1672×941, 1920×1080 in EN/AR and dark/light, including actual Windows Electron screenshot.
3. Keyboard-only walkthrough, reduced-motion, empty/loading/error/offline, missing permissions, zero-results, action confirmation and cancel/undo when supported.
4. Test real selected backend action at its appropriate safe level; real destructive actions only with explicit owner consent, never during visual QA.
5. Show files changed, test results, exact SHA, unresolved design deviations and review decision. Screenshot similarity alone cannot mark the task complete.

**Do not merge into main while Qoder works on the canonical Windows checkout.** Complete feature-branch commits sequentially; request owner integration approval after functionality and visual QA.


## Paired-reference rule
- The dark image defines the premium night identity.
- The day image defines the soft-glass daylight identity aligned with the Codex startup entry.
- Shared layout, hierarchy and component structure should stay consistent across both themes.
