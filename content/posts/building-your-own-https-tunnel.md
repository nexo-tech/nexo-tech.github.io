---
date: 2025-04-16T04:14:54-08:00
draft: true
params:
  author: Oleg Pustovit
title: "Build Your Own HTTPS Tunnel in 300 Lines of Go"
weight: 10
tags:
  - go
  - caddy
  - hacks
---

> TL;DR: I built a lightweight, self-hosted HTTP tunnel that turns `localhost` into a public **HTTPS** URL. No paid plans, no secret black boxes. Just one Go binary, Caddy with wildcard TLS, and a $0/month Oracle Cloud VM. [GitHub repo](https://github.com/<your-handle>/caddy-tunnel)

---

## Why I Built It

My development workflow lives mostly on a free Oracle Cloud VM: SSH, Neovim, tmux—the usual hacker starter pack. I tried many ways to easily expose my local apps for testing webhooks, sharing demos, and collaborating with friends.

- **Ngrok**? Free plan naps after 2 hours.
- **Cloudflare Tunnel**? Closed source.
- **Self-hosting other tunnels**? Often complex, heavyweight, or missing automatic HTTPS.

I wanted **full control**, **zero vendor lock-in**, and **wildcard HTTPS certificates** — without paying or managing unnecessary infrastructure.

Thus: a 300-line Go server, a single WebSocket multiplexed with [yamux](https://github.com/hashicorp/yamux), and Caddy configured with Cloudflare DNS for automatic wildcard TLS.

The result is a frictionless tunnel that costs $0/month, survives webhook storms, and gives you your own little "ngrok clone" that you fully own.

---

## Architecture Overview

```text
┌─────────────┐         wss://$BASE/tunnel          ┌──────────────┐
│  Laptop     │  ⇄ yamux-multiplexed WebSocket ⇄  │  VM @ OCI    │
│  :8080      │                                   │ Caddy + Go   │
└─────────────┘            │                      └─────────────────
    ▲ Local TCP         │                            *.tunnel.example.com
    └└└└└└└└└└└└└└└└└└└└└
```

- **Client** connects to `/tunnel` endpoint on the VM.
- Receives a **random 8-character subdomain** (e.g., `ab12cd34.tunnel.example.com`).
- **Each HTTP request** from browsers becomes a **new yamux stream**.
- Streams proxy through WebSocket to `localhost` on your laptop.
- **Caddy** handles HTTPS with wildcard certificates issued in seconds.

---

## How It Works

- **WebSocket** keeps the session alive and multiplexes requests using **yamux**.
- **Wildcard TLS** certificates are issued via Cloudflare DNS-01 challenge; every subdomain instantly green-locked.
- **Hijack** incoming HTTP connections to stream them directly without re-encoding.
- **Single binary** Go server and client; easy to compile and deploy.

The entire tunnel lives inside a WebSocket, allowing it to survive NAT, firewalls, and awkward corporate Wi-Fi without extra networking magic.

---

## Setup Guide (Copy/Paste Ready)

**1. Build everything**

```bash
make build
# Compiles Go binaries and a custom Caddy with Cloudflare DNS module
```

**2. Boot the Edge (on the VM)**

```bash
export CF_API_TOKEN=<your-cloudflare-dns-token>
make up/caddy
./tunnel-server -port 3000 -base-domain-name tunnel.example.com
```

**3. Start a Tunnel (on your Laptop)**

```bash
./tunnel-client -port 8080 -server-url wss://tunnel.example.com/tunnel
# ▶ Tunnel ready at ab12cd34.tunnel.example.com
```

You can now point GitHub, Stripe, or whatever webhook you’re testing to your live HTTPS URL. No more "Connection refused" sadness.

---

## Engineering Highlights

| Component | Purpose |
| :--- | :--- |
| **yamux** | Multiplex HTTP streams over a single TCP/WebSocket connection. |
| **WebSocket** | Works seamlessly through proxies and NAT; fewer moving parts than raw TCP tunneling. |
| **Wildcard TLS** | Fast and automatic SSL certs for all subdomains; no manual renewal. |
| **HTTP Hijack** | Directly stream request/response bytes without re-encoding at the HTTP layer. |

---

## Security Notes

- Run Caddy with basic auth if the tunnel should not be public.
- Use scoped Cloudflare tokens limited to DNS editing.
- No DoS protections yet; PRs are welcome.

---

## What's Next

- JWT-signed handshakes and revocation list.
- Native gRPC transport (experimenting with ALPN multiplexing).
- Prometheus metrics for tunnel traffic.

---

## Where to Find It

- Code: [GitHub →](https://github.com/<your-handle>/caddy-tunnel) (MIT license)
- Instant install: `go install github.com/<your-handle>/caddy-tunnel/cmd/...@latest`
- Feedback / PRs / Stars are extremely welcome.

If this saves you a billable hour or two, I'd appreciate a ⭐—and if you're building your own indie hacker stack, I'd love to hear how you use it!

Cheers!


