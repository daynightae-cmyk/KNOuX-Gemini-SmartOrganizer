# Shared task 04 — Restart-safe plan and receipt recovery (conditional native scope)

## First decide whether this is needed
Inspect existing Main native journal, execution plan lifecycle, vault/organization receipts, automation draft journal and restart reconciliation. Reuse already implemented mechanisms. Never overwrite or downgrade successful native receipts just to introduce a new database.

## Explicit trust boundary
The renderer is never authoritative for consent, effect completion or remaining work. Native provider issues plan version, digest, selected scope, action risk, consent nonce, expiration and state transitions. A restart cannot silently resume an effectful operation merely because renderer state persisted.

## Persist only minimum metadata
Operation ID, user/session scope, schema version, plan digest, permission grants/expiry, provider name, state transition time, idempotency key, signed/verified outcome receipt and postcondition evidence. Avoid file content, raw OAuth or AI credentials, unredacted secrets and unnecessary PII.

## Integrity/confidentiality
Windows OS-protected key storage or equivalent when actually available; authenticated encryption for sensitive state, tamper detection for all journal state, atomic writes and restrictive file permissions. Do not invent a cryptography design or silently fallback to plaintext if native protection unavailable.
Bound disk size, transaction count and retention policy; version schema and test migrations in isolated fixtures.

## Recovery states and operation
PENDING, REVIEWED, APPROVED, STARTED, PARTIAL, FAILED, CANCELLED, COMPLETED, RECONCILIATION_REQUIRED. On launch read protected journal, validate integrity and schema, re-query authoritative provider state, never trust old UI progress, never replay irreversible mutations automatically. Surface a user-controlled inspection/reconcile/recover action only when supported.

## Tests
Power loss between plan approval and execution; duplicate operation ID; interrupted move; partial vault restore; missing key; tampered record; stale authorization; multi-user switching; mismatched plan hash; corrupt journal; silent executor retry. Use temporary fixtures/VM only, never owner files.

## Acceptance
Readable recovery evidence and safe blocked state if runtime cannot protect metadata. No claim that restart recovery is complete merely because a draft survives reload.
