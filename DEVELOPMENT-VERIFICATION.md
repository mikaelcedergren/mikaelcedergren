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
  the affected real page or post route in the already-running local product on port `4250`.
- E2E changes run the isolated repository-owned E2E command.
- Dependencies, repository authority, server code, installers, service and release definitions,
  sitemap and flattening machinery, product/build configuration, and this verifier's trust
  implementation use the complete `pnpm check` gate.
- Unclassified source changes fail conservatively into the complete gate.

The verifier observes the existing development environment; it never starts, stops, or repairs it.
Receipts and screenshots stay in ignored `.run/verification/` with private permissions. They are
local evidence and must never be committed.

The authoritative option meanings, hashing, evidence, escalation, and release-separation contract
lives in the Development root's
[`DEVELOPMENT-VERIFICATION.md`](https://github.com/mikaelcedergren/development-root/blob/main/DEVELOPMENT-VERIFICATION.md).
This file owns only this site's checks, paths, and rendered routes.
