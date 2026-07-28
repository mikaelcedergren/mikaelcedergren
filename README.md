# mikaelcedergren.com

Mikael Cedergren's portfolio + blog — Angular 22 SSG, served by Express on the Mac mini (port 3050),
fronted by nginx. See [AGENTS.md](AGENTS.md) for architecture, and
`/Users/cortex/Development/SERVER-STANDARD.md` for how every site here is served.

```bash
pnpm install
pnpm build      # prerender -> dist/browser, then flatten blog-post URLs
pnpm start      # serve at http://127.0.0.1:3050  (health: /healthz)
```

`pnpm build` is the local build. Production content is published atomically through the shared
release command:

```bash
node ../server-ops/bin/site-release.mjs --site mikaelcedergren --apply
```

The shared release and rollback contract is documented in
[`../SERVER-STANDARD.md`](../SERVER-STANDARD.md).
