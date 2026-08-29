# mikaelcedergren.com

Mikael Cedergren's portfolio + blog — Angular 22 SSG, served by a strict compiled TypeScript
composition of the shared Express runtime on the Mac mini (port 3050), fronted by nginx. See
[AGENTS.md](AGENTS.md) for architecture, and
`/Users/cortex/Development/SERVER-STANDARD.md` for how every site here is served.

```bash
pnpm install
pnpm build      # generate sitemap, prerender/flatten 15 routes, compile server/dist/index.js
pnpm build:server:release # internal self-contained server-artifact build
pnpm start      # serve at http://127.0.0.1:3050 (health: /healthz)
pnpm check      # canonical platform, format, typecheck, test, and production-build gate
pnpm e2e        # isolated Chromium journeys on a temporary build and port
```

`pnpm build` is the local build. Production content is published atomically through the shared
release command:

```bash
node ../server-ops/bin/site-release.mjs --site mikaelcedergren --browser-only --apply
```

This command is only for a change proved browser-only. Publish a change proved server-only through
the shared server-release flow; anything that can affect both closures, or whose scope is
uncertain, uses the paired transaction. The shared classification, release, and rollback contract
is documented in
[`../SERVER-STANDARD.md`](../SERVER-STANDARD.md).

The isolated server contract runs only compiled `server/dist/index.js` against a temporary browser
tree. It verifies that manifest-derived health identity stays pinned to the sealed server artifact
even when the operational checkout manifest changes, plus synthetic server-release identity, shared
errors and security/cache headers, section and literal `.html` routing, missing responses, and
graceful shutdown without touching the live service.

The tracked LaunchDaemon template executes only the selected atomic `current-server` artifact and
its matching identity. The package comes from GitHub `main`, while `pnpm-lock.yaml` records the
exact immutable resolution and the root migration ledger alone owns mutable installation,
selection, and running evidence.

`bin/install-server-daemon` is the check-first definition installer. Its default/`--check` mode is
non-mutating; after the authorised first selection, `--apply` validates the selected artifact and
delegates the exact unloaded/target-state write to the shared
[`server-ops` installer contract](../server-ops/README.md#install-service-definitions-after-a-first-selection).
It never bootstraps or restarts the service.

The dedicated `mikaelcedergren-server` workspace is the production dependency boundary. Server
publication deploys only its declared compiled output and production closure beneath the staged
artifact's `server/` directory, then places the immutable root product manifest beside it. Browser
dependencies, source TypeScript, tests, and mutable checkout files stay outside the artifact.
