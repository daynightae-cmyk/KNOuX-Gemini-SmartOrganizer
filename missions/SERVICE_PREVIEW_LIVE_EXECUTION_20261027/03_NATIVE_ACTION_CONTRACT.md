# Typed Native Actions — exact workflow
Select source → Scope authorization → Real measure → Preview exact plan → Consent → Revalidate plan → Execute fixed operation → Verify postcondition → Journal receipt → Undo if safe.
Typed IPC only via Electron preload with session/sender/origin validation; no generic arbitrary shell, unbounded PowerShell, path traversal, symlink escape or raw token in renderer.
Events schema: opId, serviceId, sourceMode, sequence, phase, completed, total optional, timestamp, provenance, errors, receiptId. If total unknown use indeterminate progress; no invented 83%.
Security classes: A useful non-mutating real actions; B reversible actions with journal; C privileged/irreversible reviewed action with UAC where necessary, no fake undo; D external least-privilege OAuth with revoke, 401/403/429 handling.
Disallow auto-changing real Windows services/startup/registry/uninstall/repair, real user files or connected Google/AI accounts without separately approved runtime action.
Testing ownership: 40+ disposable files, symlink/locked/collision cases, Mock SCM/Registry/Task Scheduler, VM for privileged repairs, offline Google test harness. Verify postcondition not merely successful IPC call.
