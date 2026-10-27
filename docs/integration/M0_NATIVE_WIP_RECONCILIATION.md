# Canonical WIP native reconciliation

Original root checkpoint: a1d7360f2a68e3791da60ffad81589b110b1e87f. All original bytes are in external preservation and migration-history/m0-20261028/wip-root.

| Original addition | Active integrated disposition |
| --- | --- |
| Studio source/destination safe-route identities | Integrated in StudioBridge |
| Plan ID and executable metadata | Integrated in StudioBridge + typed preview contract |
| Cinematic inset:0 | Already integrated accepted version; no change required |
| Four older execute/cancel/undo IPC channels and bridge wrappers | Superseded by fixed OperationsV1 endpoints. Older path accepted renderer approved:true without independent Native confirmation and persisted roots as grants. Current OperationEngine supplies job arbitration, scoped session grants, bound content and independent Native consent. No unsafe parallel mutation channel is exposed. |
| Extended legacy execution progress event | Superseded by typed OperationEvent stream, consumed by live Studio/Files and vault |
| studio-exec-test.cjs | Preserved original; current test name delegates to hardened OperationEngine fixture regression |
| Root binary evidence, references, mission backups | Individually SHA-accounted in M0_WIP_DISPOSITION and M0_ARTIFACT_DISPOSITION; no image replaced silently |

This is replacement of a duplicate obsolete execution path, not loss of the organization execution/undo feature. Main/preload/renderer contract, rejection/consent, actual move and hash-verified recovery are tested through the current product controls.
