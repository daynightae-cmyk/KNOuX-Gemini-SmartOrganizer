
---

## Appendix B — Handover Template (`HANDOVER.md`) **[REQ]**

Codex maintains one `HANDOVER.md` containing, in order: (1) the Step 0 Git state and decisions; (2) the crosswalk summary; (3) per-service status table identical in shape to Appendix A but with **current** evidence references; (4) **Blocked on owner input** (B-G*, B-S*, D-*) with the exact configuration key names, where they are set and how to verify; (5) separate gate table per service (Part 3.3); (6) known limitations stated plainly (e.g. same-volume quarantine frees no bytes; WinGet has no rollback; CPU temperatures not exposed by Windows); (7) the list of evidence directories created; (8) anything Codex found that contradicts this specification, with the correction applied. No secret, token, client value or personal path appears in this file.

## Appendix C — Product Completion Definition

The product is complete only when: every Class A service answers its user question accurately with provenance and honest unavailable states; every Class B service lets the user perform the action after deliberate approval, with verified effects, a durable journal and real undo; every Class C service performs the supported OS operation with protected defaults, per-action consent/UAC and truthful irreversibility; every Class D service has real authorization, revocation and least-privilege calls when connected; every service opens a distinct specialist workbench with working controls in EN/AR, Day/Night at the three viewports; packaged builds pass the same effect tests; and production gates (signing, updates, Google verification where applicable) are honestly satisfied or listed as blocked. Priority: real user outcomes over pretty dashboards over synthetic numbers; user safety is never traded for a green checkbox.
