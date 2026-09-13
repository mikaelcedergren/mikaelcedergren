# Change-aware development verification

Run `pnpm verify:change` after a coherent local change. It compares the exact current source with
the last successful proof, reuses checks only while their owned inputs are byte-identical, and runs
independent selected checks together. The first run deliberately executes the complete `pnpm check`
gate.

Useful controls:

```bash
pnpm verify:change --plan
pnpm verify:change --visual
pnpm verify:change --force
pnpm verify:change --full
```

## Mikael Cedergren map

- Documentation uses formatting only.
- Interface and editorial-page changes use formatting, types, a production SSG browser build, and
  the affected real page route in the already-running local product on port `4250`.
- E2E changes run the isolated repository-owned E2E command.
- Dependencies, repository authority, server code, installers, service and release definitions,
  sitemap generation, product/build configuration, and this verifier's trust
  implementation use the complete `pnpm check` gate.
- Unclassified source changes fail conservatively into the complete gate.

The verifier observes the existing development environment; it never starts, stops, or repairs it.
Receipts and screenshots stay in ignored `.run/verification/` with private permissions. They are
local evidence and must never be committed.

The authoritative option meanings, hashing, evidence, escalation, and release-separation contract
lives in the Development root's
[`DEVELOPMENT-VERIFICATION.md`](https://github.com/mikaelcedergren/development-root/blob/main/DEVELOPMENT-VERIFICATION.md).
This file owns only this site's checks, paths, and rendered routes.

## Angular development cache regression

`pnpm e2e:hmr` exercises this repository's installed Angular build package in a
synthetic lazy-component fixture. It checks template hot updates, a disconnected
client during a TypeScript rebuild, stylesheet hot updates, and reloads. The shared
hermetic runner owns the temporary files, exact loopback port, and process cleanup.

The canonical `pnpm check` includes this regression. The tracked pnpm patch fixes
Angular's stale template metadata at its owning development-server layer and survives
a frozen install. Keep it until an upstream version passes the regression without
the patch; do not disable hot reload to hide a failure.

## Résumé PDF

`/resume/?pdf` downloads `Mikael-Cedergren-CV.pdf`; the ordinary résumé and other routes
remain unchanged. A manual download link remains available if the browser suppresses the
initial download.

Production browser builds (including staged releases) generate the PDF from their own
prerendered résumé before the artifact is sealed. `pnpm resume:pdf` rebuilds it and updates
the ignored development asset. Local browser builds update that asset as well. Run
`pnpm resume:pdf` after editing résumé content while development is running, or to create
the download on a fresh checkout.

The PDF renderer uses the shared hermetic Chromium runner against a copy of the built
site. It preserves source text, removes repeated decorative pull quotes, applies
`resume-print.css`, embeds fonts, and writes the finished PDF atomically. It never calls
public services. `build:html` is the internal HTML-only build used by the ordinary E2E
controller so browser tests do not recursively start another runner.
