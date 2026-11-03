#!/usr/bin/env python3
"""Generator for the KNOuX Codex execution specification (documentation only)."""
import json, importlib.util, sys, os, collections, re

HERE = os.path.dirname(os.path.abspath(__file__))
MERGED = sys.argv[1]
OUT = sys.argv[2]
merged = json.load(open(MERGED, encoding='utf-8'))

def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

DOMAINS = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14']
mods = {d: load('d' + d) for d in DOMAINS}

DOMNAME = {'01':'Home','02':'Smart Scan','03':'Organization Studio','04':'Google Workspace','05':'Applications','06':'Files','07':'Storage','08':'Cleanup','09':'Startup','10':'System / Network / Hardware','11':'Repair Lab','12':'Services','13':'Automation','14':'Settings / Engine / AI'}

# ---------- class templates ----------
LIFE = {
'A': "Capability check (SP-01) → scope authorization where file-based (SP-03) → bounded, cancellable read through the provider → normalize with provenance → virtualized render → refresh/export → honest empty/partial/unavailable states. No plan, no approval and no write channel exist for this service.",
'B': "Capability check → exact resource selection → preflight (risk, conflicts, protected-path screening) → immutable plan with `planHash` (SP-04) → specific in-app approval + native confirmation (SP-13) → bounded execution with per-item progress → postcondition read-back → durable journal (SP-05) → recovery/undo where technically real, with conflict check.",
'C': "Capability check → protected-default screening → exact selection → preflight with irreversibility statement → immutable plan → specific approval (in-app + native) → elevation request through SP-07 only if the operation needs it (never automatic; one UAC per approved operation) → bounded execution → effect verification independent of exit code → journal → recovery only where the OS genuinely offers it; irreversible effects carry **no Undo control**.",
'D': "Capability state `needs-credential` → `needs-consent` → browser PKCE consent (never an embedded webview) → scope-grant check → authenticated, quota-aware call → read-back verification for writes → disconnect (revoke at Google, purge local copies) → honest offline vs API-error states.",
}
SEC = {
'A': "Read-only. Requires an authorized scope where it reads user files (SP-03); no write, delete, execute or elevate path may exist on this service's IPC channels (asserted by G-A10). No network egress. Paths and identifiers in exports are the user's to export; nothing is sent anywhere.",
'B': "Class B. Per-operation approval bound to `planHash`; renderer cannot grant approval; Main re-validates scope, fingerprints and protected paths at execution time; no blanket or standing approval; originals preserved or quarantined with metadata wherever the operation supports recovery; no elevation.",
'C': "Class C. Protected targets are refused even with approval; explicit irreversible warning before and after; per-action UAC through SP-07 and never automatic; no force/cascade options; effect verified by independent read-back; no recovery claim beyond what the OS provides; real effects on owner systems remain `BLOCKED_REQUIRES_USER_ACTION` until the owner performs them at time of use.",
'D': "Class D. Least-privilege scopes requested incrementally at first use; tokens only in Main under SP-08; the renderer never sees a token, authorization code or verifier; writes are preview-first with operation-specific consent; third-party personal data is never sent to an AI provider without separate explicit consent (restricted Google data: never); disconnect revokes and purges.",
}
ERR = {
'A': "Provider missing/denied/timeout/malformed → typed capability state or `E_PROVIDER`/`E_PARSE` with remediation; cancel stops the real walker/process and discards partial display as incomplete; retry is idempotent; restart restores the last persisted result labelled with its sample time.",
'B': "Stale/changed resource → `E_STALE_PLAN`/`E_FINGERPRINT`, nothing executed for that item; partial failure journaled per item; cancel stops new items and finishes or atomically rolls back the in-flight item; crash/interruption → on restart state `interrupted` with the journal's last verified stage and an offer to continue, undo or abandon; undo refuses on destination conflict with an explanation.",
'C': "As class B, plus: elevation denied → `E_ELEVATION_DENIED` with no effect; reboot-required effects flagged; verification failure → `E_VERIFY` shown as unverified, never as success; an irreversible partial failure is reported exactly (what changed, what did not) with the manual remediation the OS supports.",
'D': "Offline ≠ API error ≠ auth error ≠ quota; 401 → `needs-reauthorization`; 403 scope → disabled control with `SCOPE_NOT_GRANTED:<scope>`; 429/5xx → backoff with jitter and `Retry-After`; duplicate submissions are idempotent; revoke failure reported honestly; cancel aborts the request and shows no partial write as success.",
}
EVID = {
'A': "Evidence records (Part 8.4) at L2 (provider mocks), L4 (dev Electron) and L5 (packaged Electron) covering G-A1…G-A10 and every service-specific test; UI matrix captures (Part 8.5) in a new directory; the re-audit answers to the 15 questions (Part 8.2) citing file + symbol; for hardware/OS-dependent claims, an L6 record from a real Windows host or an explicit `NOT_RUN`.",
'B': "Everything in class A, plus L3 disposable-fixture effect diffs (before/after tree/registry hashes), journal excerpts (sanitized), crash-recovery records for every journal stage, undo/restore diffs, packaged-Electron effect records (G-B13); owner-data run recorded as `BLOCKED_REQUIRES_USER_ACTION` unless the owner performed it.",
'C': "Everything in class B, plus mock-elevation-helper records (granted/denied/hash-mismatch), irreversibility-copy screenshots (before and after), reboot-flag tests, and an L6 record on a disposable Windows machine/VM profile or an explicit `NOT_RUN` with blocker B-S2.",
'D': "Evidence records labelled `mock` for the mock OAuth/API server runs (G-D1…G-D9); the Console scope label screenshot/text for every requested scope (7.2.2); token-leak scan output; a separate record for any live-account run labelled `live` (owner-performed, blocker B-G2).",
}
GENERIC = {
'A': "G-A1…G-A10",
'B': "G-A1…G-A3, G-A5…G-A9 where reads exist, plus G-B1…G-B13",
'C': "G-B1…G-B13 plus G-C1…G-C6",
'D': "G-D1…G-D10",
}

def spec_ids(domain):
    items = [d for d in merged if d['mission'] == domain]
    return {d['id']: 'D%s.%02d' % (domain, i + 1) for i, d in enumerate(items)}

def derive_status(d, o):
    if o.get('st'):
        return o['st'], o.get('conf', 'MEDIUM')
    if d['slice'] == 'IMPLEMENTED_AND_TESTED_FIXTURES':
        return 'IMPLEMENTED_AND_TESTED_FIXTURES', 'HIGH (commit-bound; reachability from HEAD unverified)'
    if d['slice'] == 'PARTIAL':
        return 'PARTIAL', 'HIGH (commit-bound; reachability from HEAD unverified)'
    reg = (d.get('reg') or {}).get('status', '').strip('*')
    if reg in ('MEASURED_READ_ONLY', 'UNSUPPORTED'):
        return reg, 'MEDIUM (registry 2026-10-26; historical)'
    if reg == 'PARTIAL':
        return 'GATED_PREVIEW_ONLY', 'MEDIUM (registry 2026-10-26; historical)'
    if reg == 'IMPLEMENTED_AND_TESTED':
        return 'IMPLEMENTED_AND_TESTED_FIXTURES', 'MEDIUM (registry; local drafts only)'
    return 'UNASSESSED', 'LOW'

status_counter = collections.Counter()
index_rows = []
body = []
alltests = 0

for dom in DOMAINS:
    m = mods[dom]
    ids = spec_ids(dom)
    items = [d for d in merged if d['mission'] == dom]
    missing = [d['id'] for d in items if d['id'] not in m.S]
    extra = [k for k in m.S if k not in ids]
    if missing or extra:
        raise SystemExit('domain %s: missing %s extra %s' % (dom, missing, extra))
    body.append('\n---\n\n## Domain %s — %s (%d services)\n' % (dom, DOMNAME[dom], len(items)))
    body.append(m.INTRO.strip() + '\n')
    for d in items:
        o = m.S[d['id']]
        sid = ids[d['id']]
        st, conf = derive_status(d, o)
        status_counter[st] += 1
        cls = o.get('cls', d['cls'])
        base_cls = cls[0]
        index_rows.append((sid, d['id'], d['name'], cls, st, conf.split(' ')[0]))
        # paths
        paths = []
        for p in d['files'].split(';'):
            p = p.strip()
            if p and 'visual-sprint' not in p and 'service-workspaces.css' not in p:
                paths.append('`' + p + '`')
        if d['evid']:
            for p in d['evid'].split(';'):
                p = p.strip()
                if p:
                    paths.append('`' + p + '`')
        paths = paths + [x for x in o.get('pa', [])]
        paths = paths + m.ANCHORS
        seen = set(); pl = []
        for p in paths:
            if p not in seen:
                seen.add(p); pl.append(p)
        lines = []
        lines.append('### %s — %s' % (sid, d['name']))
        lines.append('')
        lines.append('| Field | Value |')
        lines.append('|---|---|')
        lines.append('| Spec ID / CSV ID | **%s** / `%s` |' % (sid, d['id']))
        lines.append('| Class | %s (ledger provisional: %s)%s |' % (cls, d['cls'], (' — ' + o['clsnote']) if o.get('clsnote') else ''))
        lines.append('| Ledger baseline | %s |' % d['base'].replace('|', '/'))
        sl = d['slice'] if d['slice'] != 'NOT_REASSESSED_IN_THIS_SLICE' else 'not reassessed in the 181-row slice'
        lines.append('| Ledger slice status | `%s`%s |' % (d['slice'], (' @ `%s`' % d['sha']) if d['sha'] else ''))
        lines.append('| **Reconciled status** | **`%s`** — confidence %s |' % (st, conf))
        lines.append('| Uncertainty | %s |' % o.get('unc', 'Re-audit at current HEAD required (Part 8.2); registry/acceptance rows predate later commits.'))
        lines.append('| Gates with evidence | %s |' % o.get('gates', 'implementation: see status · fixture-test: see evidence paths · dev/packaged smoke: as recorded in registry/acceptance rows (historical) · packaged-effect, Windows-host, owner-data, visual sign-off: `NOT_RUN`'))
        lines.append('')
        lines.append('**Existing functionality.** ' + o['ex'])
        lines.append('')
        lines.append('**Existing implementation paths** (evidence-named; locate by symbol before editing): ' + ', '.join(pl))
        lines.append('')
        lines.append('**Verified missing behaviour.** ' + o['mi'])
        lines.append('')
        lines.append('**Required native integration.** ' + o['nat'])
        lines.append('')
        lines.append('**Required UI integration** (inside the existing `ServiceWorkbenchHost`, Living Glass tokens only). ' + o['ui'])
        lines.append('')
        lc = LIFE[base_cls]
        if o.get('lc'):
            lc += ' **Service-specific:** ' + o['lc']
        lines.append('**Expected operation lifecycle.** ' + lc)
        lines.append('')
        lines.append('**Security and consent.** ' + SEC[base_cls] + (' **Service-specific:** ' + o['sec'] if o.get('sec') else ''))
        lines.append('')
        lines.append('**Errors, cancellation and recovery.** ' + ERR[base_cls] + (' **Service-specific:** ' + o['er'] if o.get('er') else ''))
        lines.append('')
        lines.append('**Acceptance tests.** Generic suite: %s (Part 8.3b), parameterized with this service\'s fixture. Service-specific:' % GENERIC[base_cls])
        for i, t in enumerate(o['t'], 1):
            lines.append('- **AT-%s-S%d** %s' % (sid, i, t))
            alltests += 1
        lines.append('')
        lines.append('**Evidence necessary for completion.** ' + EVID[base_cls] + (' **Additionally:** ' + o['evx'] if o.get('evx') else ''))
        if o.get('dep'):
            lines.append('')
            lines.append('**Depends on / hands off to.** ' + o['dep'])
        lines.append('')
        body.append('\n'.join(lines))

# ------------- assemble -------------
front = open(os.path.join(HERE, '00_front_a.md'), encoding='utf-8').read() + '\n' + open(os.path.join(HERE, '00_front_b.md'), encoding='utf-8').read()
summary = ['| Status | Services |', '|---|---|']
for k, v in sorted(status_counter.items(), key=lambda x: -x[1]):
    summary.append('| `%s` | %d |' % (k, v))
summary.append('| **Total** | **%d** |' % sum(status_counter.values()))
front = front.replace('@@STATUS_SUMMARY@@', '\n'.join(summary))

generic = open(os.path.join(HERE, '08b_generic_tests.md'), encoding='utf-8').read()
tail = open(os.path.join(HERE, '99_tail.md'), encoding='utf-8').read()

idx = ['## Appendix A — 181-Row Service Index (reconciled)', '', '| Spec ID | CSV ID | Service | Class | Reconciled status | Confidence |', '|---|---|---|---|---|---|']
for r in index_rows:
    idx.append('| %s | `%s` | %s | %s | `%s` | %s |' % r)
idx.append('')

doc = front + '\n' + generic + '\n' + '\n---\n\n# Part 12 — Domain Chapters and Per-Service Contracts\n\nEach entry follows the same field order. "Generic suite" tests are defined once in Part 8.3b. Service-specific tests are numbered `AT-<spec ID>-S<n>`.\n' + '\n'.join(body) + '\n---\n\n' + '\n'.join(idx) + '\n' + tail
open(OUT, 'w', encoding='utf-8').write(doc)
print('services', sum(status_counter.values()), 'service-specific tests', alltests, 'chars', len(doc))
print(dict(status_counter))
