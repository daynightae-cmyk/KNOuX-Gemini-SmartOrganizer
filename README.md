# KNOuX Gemini SmartOrganizer

Independent, private Windows Gemini application. The old KNOuX Root renderer, legacy Electron main, Root CI and old installer are not included.

App: apps/gemini-ui/ (Gemini-only Electron entrypoint and renderer).
Native reusable engines: electron/ (only the transitive closure actually required by Studio, Files and Storage).
Missions: missions/. Approved artwork: references/.

Snapshot: daynightae-cmyk/Knoux-SmartOrganizer at e3d612e5e53fabd18fd2f66f9045118632d9c92d. The original repository and Windows worktrees were not modified.

Setup: npm run install:app; npm run lint; npm run build; npm run test:native; npm run test:studio; npm run test:files; npm run test:storage; npm run desktop:smoke.

Working branch for further domains: feat/gemini-missions. Original Root CI visual acceptance must NOT run in this repository. No real user file mutations without approval.
