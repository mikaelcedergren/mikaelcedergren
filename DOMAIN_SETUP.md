# Domain setup — mikaelcedergren.com

The shared go-live procedure (DNS → static IP → router → nginx → certbot → HTTPS) lives in the root [`GO-LIVE.md`](../GO-LIVE.md) and [`SERVER-STANDARD.md`](../SERVER-STANDARD.md). This file records only what is specific to this repo.

| Field | Value |
| --- | --- |
| Domain(s) | `mikaelcedergren.com`, `www.mikaelcedergren.com` |
| Local target | `127.0.0.1:3050` |
| Daemon | `com.mikaelcedergren.server` |
| Health | `/healthz` |
| nginx | shared proxy snippets + micro-cache |
| Status | live HTTPS (HTTP redirects to HTTPS) |

Cloudflared is not used; public traffic uses the static-IP nginx path.
