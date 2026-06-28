# mikaelcedergren.com

Mikael Cedergren's portfolio + blog — Angular 22 SSG, served by Express on the Mac mini (port 3050),
fronted by nginx. Migrated off CodeKit. See [AGENTS.md](AGENTS.md) for architecture, and
`/Users/cortex/Development/SERVER-STANDARD.md` for how every site here is served.

```bash
pnpm install
pnpm build      # prerender -> dist/browser, then flatten blog-post URLs
pnpm start      # serve at http://127.0.0.1:3050  (health: /healthz)
```
