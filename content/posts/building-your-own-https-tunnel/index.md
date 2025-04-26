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

> TL;DR: I built a lightweight, self-hosted HTTP tunnel that turns `localhost` into a public **HTTPS** URL. No paid plans, no secret black boxes. Just one Go binary, Caddy with wildcard TLS, and a $0/month Oracle Cloud VM. [GitHub repo](https://github.com/nexo-tech/microtunnel)

## Why I Built It

My development workflow lives mostly on a free Oracle Cloud VM: SSH, Neovim, tmux—the usual hacker starter pack. I tried many ways to easily expose my local apps for testing webhooks, sharing demos, and collaborating with friends.

- **Ngrok**? Free plan naps after 2 hours. Paid plans needed for reserved domains and longer sessions.
- **Cloudflare Tunnel**? Closed source, and a bit heavier to set up (Cloudflare account, Zero Trust dashboard, connector configs).
- **Self-hosting other tunnels**? Often complex, heavyweight, or missing automatic HTTPS.

I wanted **full control**, **zero vendor lock-in**, and **wildcard HTTPS certificates** — without paying or managing unnecessary infrastructure.

Thus: a 300-line Go server, a single WebSocket multiplexed with [yamux](https://github.com/hashicorp/yamux), and Caddy configured with Cloudflare DNS for automatic wildcard TLS.

The result is a frictionless tunnel that costs $0/month, survives webhook storms, and gives you your own little "ngrok clone" that you fully own.

## Architecture Overview

![](./arch-diagram.svg)

- **Client** connects to `/tunnel` endpoint on the VM.
- Receives a **random 8-character subdomain** (e.g., `ab12cd34.tunnel.example.com`).
- **Each HTTP request** from browsers becomes a **new yamux stream**.
- Streams proxy through WebSocket to `localhost` on your laptop.
- **Caddy** handles HTTPS with wildcard certificates issued in seconds.

## How It Works

- **WebSocket** keeps the session alive and multiplexes requests using **yamux**.
- **Wildcard TLS** certificates are issued via Cloudflare DNS-01 challenge; every subdomain instantly green-locked.
- **Hijack** incoming HTTP connections to stream them directly without re-encoding.
- **Single binary** Go server and client; easy to compile and deploy.

The entire tunnel lives inside a WebSocket, allowing it to survive NAT, firewalls, and awkward corporate Wi-Fi without extra networking magic.

## Setup Guide

### Prerequisites

- a domain name (`example.com`)
- VM — could be a free-tier VM from AWS. Etc. I use a [free Oracle VM](https://nexo.sh/posts/setup-oracle-vm/) because it has more generous spects
- go (to build the app)

### Server and application setup 

You need to setup a VM. Here's how you could setup [free Oracle VM](https://nexo.sh/posts/setup-oracle-vm/), like I did. Alternatively you can run free-tier EC2 instance Amazon or equivalent VM on other Cloud service providers. 

Next step, would be to build a binary both on client and server by running

```sh
make build
```

This will compile `microtunnel` binary in the same folder. For running server application, you need to specify `port` and `base-domain-name` arguments:

```sh
./microtunnel --port 8080 --base-domain-name tunnel.example.com
```

### Configuring domain and caddy

We'll be using CloudFlare for DNS management because of flexibility with its API. You need to setup a wildcard A record to your VM.

![](./export2.svg)

I've used `*.tunnel` subdomain that points to machine VM (`39.58.172.55` in this case).

The next step would be generating API key on CloudFlare that allows creating SSL certs for wildcard DNS record. Go to profile (top right menu) -> API Token. Create token with the following permissions:

- Zone.Zone (Read)
- Zone.DNS (Edit)

Create a Caddyfile (or use the one from the repository):

```
{$TUNNEL_SERVER_DOMAIN_NAME} {
	tls {
		dns cloudflare {env.CF_API_TOKEN}
	}
	log {
		output stdout
		format console
		level DEBUG
	}
	reverse_proxy localhost:3000 {
		header_up Host {http.request.host}
		header_up X-Real-IP {http.request.remote}
		header_up X-Forwarded-For {http.request.remote}
		header_up X-Forwarded-Proto {http.request.scheme}
		header_up Connection {http.request.header.Connection}
		header_up Upgrade {http.request.header.Upgrade}
	}
}

*.{$DOMAIN} {
	tls {
		dns cloudflare {env.CF_API_TOKEN}
	}
	reverse_proxy localhost:3000
}
```

I used environment variables to put cloudflare token as CF_API_TOKEN and domains. Unfortunately default caddy installation doesn't support cloudflare api integration for DNS management, we must build own caddy and that is possible via their `xcaddy` build tool. Once xcaddy is installed, use command `make build/caddy` to setup the app.

After that you can run Caddy and start testing:

```
sudo -E ./caddy run --config ./Caddyfile
```

### Connecting to server

Now start your localhost app (e.g. django) on port 8080. And you can initiate the tunnel connection:

```
./microtunnel --server-url wss://example.com/tunnel --port 8080
```

After successful connection you should see the domain name returned. You can open your website and see the site running from the world


## Engineering Highlights

| Component        | Purpose                                                                              |
| :--------------- | :----------------------------------------------------------------------------------- |
| **yamux**        | Multiplex HTTP streams over a single TCP/WebSocket connection.                       |
| **WebSocket**    | Works seamlessly through proxies and NAT; fewer moving parts than raw TCP tunneling. |
| **Wildcard TLS** | Fast and automatic SSL certs for all subdomains; no manual renewal.                  |
| **HTTP Hijack**  | Directly stream request/response bytes without re-encoding at the HTTP layer.        |

### making yamux work with websockets

websockets and yamux work with different interfaces by default, it was necessary to write an adapter to net.Conn
(write additional considerations of this implementation)

## Security Notes

- Run Caddy with basic auth if the tunnel should not be public.
- Use scoped Cloudflare tokens limited to DNS editing.

## What's Next

- Simple authentication support (e.g., token-based handshakes).
- gRPC transport mode (early experiments).
- Prometheus metrics for tunnel traffic.

## Where to Find It

- Code: [GitHub →](https://github.com/nexo-tech/microtunnel) (MIT license)
- Instant install: `go install github.com/nexo-tech/microtunnel/cmd/...@latest`

If this saves you a billable hour or two, I'd appreciate a ⭐.

Cheers!


