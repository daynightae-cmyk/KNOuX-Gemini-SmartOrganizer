# Cinematic entry evidence

Actual Chromium renders at the requested viewport, locale and theme. WebP compression only; original capture digests and dimensions are in [run-results.json](run-results.json).

[Silent original motion recording](entry-demo.mp4) · [frame timing](demo-timing.json) · [reference provenance](reference-manifest.json)

The movie records the real browser transition with original CDP frame timestamps. It contains no soundtrack; audio gestures/voices are verified separately by automated instrumentation. The Home shown is the upstream measured Home renderer. Browser captures truthfully show native-unavailable values; actual Windows bridge behavior is verified separately in CI.

| Viewport | Locale | Theme | Ready | Entering | Real Home |
|---|---|---|---|---|---|
| 1366x768 | en | dark | [capture](1366x768-en-dark-ready.webp) | [capture](1366x768-en-dark-entering.webp) | [capture](1366x768-en-dark-home.webp) |
| 1366x768 | en | light | [capture](1366x768-en-light-ready.webp) | [capture](1366x768-en-light-entering.webp) | [capture](1366x768-en-light-home.webp) |
| 1366x768 | ar | dark | [capture](1366x768-ar-dark-ready.webp) | [capture](1366x768-ar-dark-entering.webp) | [capture](1366x768-ar-dark-home.webp) |
| 1366x768 | ar | light | [capture](1366x768-ar-light-ready.webp) | [capture](1366x768-ar-light-entering.webp) | [capture](1366x768-ar-light-home.webp) |
| 1672x941 | en | dark | [capture](1672x941-en-dark-ready.webp) | [capture](1672x941-en-dark-entering.webp) | [capture](1672x941-en-dark-home.webp) |
| 1672x941 | en | light | [capture](1672x941-en-light-ready.webp) | [capture](1672x941-en-light-entering.webp) | [capture](1672x941-en-light-home.webp) |
| 1672x941 | ar | dark | [capture](1672x941-ar-dark-ready.webp) | [capture](1672x941-ar-dark-entering.webp) | [capture](1672x941-ar-dark-home.webp) |
| 1672x941 | ar | light | [capture](1672x941-ar-light-ready.webp) | [capture](1672x941-ar-light-entering.webp) | [capture](1672x941-ar-light-home.webp) |
| 1920x1080 | en | dark | [capture](1920x1080-en-dark-ready.webp) | [capture](1920x1080-en-dark-entering.webp) | [capture](1920x1080-en-dark-home.webp) |
| 1920x1080 | en | light | [capture](1920x1080-en-light-ready.webp) | [capture](1920x1080-en-light-entering.webp) | [capture](1920x1080-en-light-home.webp) |
| 1920x1080 | ar | dark | [capture](1920x1080-ar-dark-ready.webp) | [capture](1920x1080-ar-dark-entering.webp) | [capture](1920x1080-ar-dark-home.webp) |
| 1920x1080 | ar | light | [capture](1920x1080-ar-light-ready.webp) | [capture](1920x1080-ar-light-entering.webp) | [capture](1920x1080-ar-light-home.webp) |
