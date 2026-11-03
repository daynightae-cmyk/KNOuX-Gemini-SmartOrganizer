# 181-Service Matrix v2 - readable view

The authority is `matrix_181_v2.csv` (38 columns per row). This file is a navigation view of the same generated rows: nothing here is hand-entered, so it cannot disagree with the CSV.

Measured HEAD: `11875da98b460ecc4ac28fcee1ff9ee14d0790d7`  |  origin/main: `8871103c7fd2a274a70fe2a069bb435f2ccb12ac`  |  divergence: 0 behind /  ahead7

## Per-domain supply

| domain | entries | located integration points | named by gated test | registered capabilities in family |
|---|---|---|---|---|
| D03 Organization Studio | 9 | 0 | 0 | 10 |
| D02 Smart Scan | 10 | 0 | 0 | 8 |
| D06 Files | 12 | 12 | 0 | 12 |
| D07 Storage | 12 | 12 | 0 | 4 |
| D08 Cleanup (Clean Room) | 12 | 12 | 12 | 12 |
| D11 Repair Lab (Recovery) | 12 | 12 | 3 | 9 |
| D09 Startup (Boot Control) | 12 | 12 | 12 | 14 |
| D12 Services Commander | 12 | 12 | 0 | 9 |
| D10 System / Network / Hardware | 36 | 36 | 36 | 16 |
| D05 Applications | 12 | 12 | 0 | 12 |
| D13 Automation (Flow Studio) | 12 | 12 | 2 | 13 |
| D14 Settings / Engine / AI | 8 | 0 | 0 | 0 |
| D04 Google Workspace | 10 | 0 | 0 | 8 |
| D01 Home Command Center | 12 | 0 | 0 | 0 |

## Reversibility classes and what each one owes

| class | entries | completion condition lives in |
|---|---|---|
| READ_ONLY_BY_DESIGN | 98 | Contracts/*.md, line 'Completion condition for this class' |
| REVERSIBLE_WITH_JOURNAL | 25 | Contracts/*.md, line 'Completion condition for this class' |
| ACTION_WITHOUT_EXECUTOR_YET | 17 | Contracts/*.md, line 'Completion condition for this class' |
| PROVIDER_DEPENDENT | 13 | Contracts/*.md, line 'Completion condition for this class' |
| UNCLASSIFIED_NO_IN_CODE_SERVICE | 12 | Contracts/*.md, line 'Completion condition for this class' |
| PRIVILEGED_WINDOWS | 9 | Contracts/*.md, line 'Completion condition for this class' |
| IRREVERSIBLE_OR_VENDOR_SIDE | 7 | Contracts/*.md, line 'Completion condition for this class' |

## Reading one row

`spec_ref` domain identifier; `ledger_id` the ID registry value; `in_code_catalog_id` whether that id keys anything in the renderer; `frontend_integration_point` `path:line [kind]` where kind is one of WORKBENCH_MAP, CASE_WORKBENCH, CASE_JSX, TERNARY_BRANCH, ICON_SWITCH - **an ICON_SWITCH or rail hit is not a workbench**, which is why the strongest site is the one reported; `component_definition` where the mapped component is actually defined; `native_ops_referenced` identifiers literally present at that site; `renderer_binding_function_count` typed envelope-returning functions in that domain's binding file; `historical_*` copied from the ledger; `current_runtime_verification` what has been proven now; `revalidation` the flag; `codex_inspection_task` the concrete next read.
