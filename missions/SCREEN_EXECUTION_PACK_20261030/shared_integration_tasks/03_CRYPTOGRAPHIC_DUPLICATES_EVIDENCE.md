# Shared task 03 — Exact cryptographic duplicate evidence viewer

## Scope
Extend existing Files duplicate discovery and any existing Storage duplicate verification contract; do not build a second scanning engine or expose duplicate deletion from a new UI.

## Evidence model
Provide stable duplicate group ID, item IDs, canonical authorized paths, byte size, observed modified timestamp, source identity/fingerprint, hash algorithm, digest, bytes actually hashed, verifiedAt, reader outcome, and changed-since-detection status.
Separate:
1. Candidate: identical byte lengths only.
2. Hash-verified: streaming cryptographic digest over complete content.
3. Byte-confirmed: actual byte-for-byte confirmation if strict policy requires it.
4. Uncertain: partial read, access denied, file changed, unavailable or stale.

Never equate same name, size or creation timestamp with a verified duplicate. SHA hash does not certify that every candidate is still unchanged at action time; revalidate before effect.

## Dedicated scene
Use original Files/Storage screenshots and color identity. Open evidence inspector from a duplicate group; side-by-side file cards show real paths (safe truncation), digests, read coverage, source of data, risk, and whether a recheck is required. Group navigation, bounded preview, sort/filter by evidence confidence, copy redacted digest and export readable report. Keyboard access and no clipped paths.

## Safety
No implicit deletion, move, hardlink replacement or user-choice preselection. Generate an immutable, file-identity-bound plan with collision/symlink protection and explicit consent for any effect; execute via existing Cleanup/Organization provider only after source recheck. Never label an unverified inverse operation as Undo.

## Native architecture and tests
Read-only streaming hashing on authorized roots, bounded memory, cancellation, error class mapping, symlink/junction restrictions, no arbitrary renderer file reads.
Fixtures: identical content/different names; same size/different bytes; mutation during scan; locked file; permission denied; hash cancellation; huge/sparse file; path case collision; duplicate links/hardlinks; inaccessible network volume.
Report per-group proof and no fake computed hashes.
