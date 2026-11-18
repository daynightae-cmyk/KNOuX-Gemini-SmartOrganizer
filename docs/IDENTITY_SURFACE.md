# Founder & Developer identity surface

The identity surface is the in-app answer to “who builds KNOUX, and how do I
reach them?”. It is a real product page, not a poster: every channel is a live
destination, every displayed value can be copied, and every external handoff is
owned by the main process.

## Where it opens

| Entry point | Element |
| --- | --- |
| Sidebar bottom card | `[data-testid="sidebar-identity"]` |
| Home command palette | search `founder`, `about`, `sadek` → `[data-testid="home-search-identity"]` |
| Router aliases | `#identity`, `#about`, `#founder`, `#developer` |
| Escape / back / close | returns to `#home` |

The surface renders **outside** `UnifiedSectionLayout`. It has no Living Glass
domain header, no service registry and no measurement, so
`SECTIONS_DIRECTORY` stays at exactly fourteen domains. `DomainSection` is
`Exclude<AppSection, 'identity'>` and every per-domain map is keyed by it, which
makes a fifteenth header a compile error rather than a style regression.

## Fixed destination table

`src/identity/profile.ts` (renderer mirror) and
`electron/native/identity-links.cjs` (main allowlist) contain the same ten
entries, in the same order. `scripts/identity-page-test.cjs` fails if any field
drifts.

| id | destination | scheme |
| --- | --- | --- |
| `website` | `https://knoux.store/` | https |
| `product` | `https://smart.knoux.store/` | https |
| `email` | `mailto:admin@knoux.store` | mailto |
| `phone` | `tel:+971503281920` | tel |
| `whatsapp` | `https://wa.me/971503281920` | https |
| `github_engineer` | `https://github.com/daynightae-cmyk` | https |
| `github_company` | `https://github.com/knoux-io` | https |
| `facebook_founder` | `https://www.facebook.com/CopSadek` | https |
| `facebook_company` | `https://www.facebook.com/knouxStore/` | https |
| `tiktok` | `https://www.tiktok.com/@knoux_7` | https |

## Security boundary

- The renderer can name an **id only**. No URL, scheme, host, path, header or
  query crosses the bridge.
- `identity.open` accepts exactly one request key (`target`); any extra key is
  rejected with `IDENTITY_REQUEST_INVALID`.
- Main resolves the id through its own frozen table and re-checks the parsed
  scheme against `https`, `mailto` and `tel`.
- Unknown ids, prototype keys (`__proto__`, `constructor`, `toString`) and
  non-strings fail with `IDENTITY_TARGET_INVALID` and open nothing.
- The channel runs through the same trusted-sender guard as every other native
  capability. There is no generic opener in `security.cjs`, and this slice does
  not add one.

In a browser preview there is no bridge. The page then uses the reviewed mirror,
labels itself `data-identity-mode="browser"`, and opens a destination only after
a real user click.

## Verification

```powershell
cd apps/gemini-ui
npm run test:identity     # static table, contract, preload, main, 14 headers
npm run evidence:identity # real Electron: 9 probes + 5 screenshots
```

Evidence is written to
`docs/evidence/inner-workspaces-20261103/identity-inner-workspace`:
`proof.json`, `layout-frames.json`, `clipboard-check.json` and the four desktop
frames plus the browser-preview frame. The evidence run **never opens a real
destination**; the positive open path is proven by the allowlist test and the
refusal probes, so no browser, mail client or dialer is launched.

## Adding a destination

1. Add the entry to both tables with the same `id`, `uri`, `scheme` and labels.
2. Run `npm run test:identity`; it fails until the order, fields and allowlist
   agree.
3. Run `npm run evidence:identity` for the runtime proof.

Adding a destination is a reviewed code change. It is never runtime input.
