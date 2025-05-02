---
date: 2025-05-02T11:04:12.088Z
draft: true
params:
author: Oleg Pustovit
title: "Expose Localhost to the World: Self-Hosted Tunnel in Go"
weight: 10
tags:
  - go
  - concurrency
  - functional-programming
---

# Expose Localhost to the World: Self-Hosted Tunnel in Go

When you're developing a web app locally, it’s often useful to expose it to the internet — to share with teammates, test integrations, or run live demos. Tools like ngrok, Cloudflare Tunnel, or GitHub Codespaces make this easy, but they come with limitations:

- You're locked into fixed subdomains
- There's limited customization
- Free plans often restrict usage or throttle speed

If you already control a VM with a public IP and a domain name, it’s entirely possible to build your own self-hosted alternative — with full HTTPS support, automatic subdomain routing, and stream multiplexing — using nothing more than Go, WebSockets, and Yamux.

In this article, I’ll walk through how to build a lightweight HTTPS tunnel from scratch. You’ll learn how to forward raw TCP traffic over WebSockets, provision wildcard TLS certs automatically via Caddy + Cloudflare, and multiplex multiple requests through a single connection — without writing a full proxy or web server.

**In this guide, you’ll learn:**

- Why naïve HTTP proxying fails (and how Go's `Hijack()` fixes it)
- How to multiplex traffic using Yamux
- Setting up wildcard TLS with Caddy + Cloudflare
- Routing by subdomain to support multiple tunnel clients
- How WebSocket adapters enable TCP-like connections

#### Let’s define technical requirements for our self-hosted tunneling service

1. A service should be secure (HTTPS) and easily accessible from the internet.
2. It should expose minimal ports in the server firewall configuration.
3. It should use basic HTTP based protocols.
4. It should dynamically generate a subdomain, like ngrok does, so every exposed app has its own subdomain, so there’s flexibility.
5. The service should serve multiple connected clients and needs to manage every connection in a flexible way.
6. The solution shouldn’t be overly complex and should use Go technical stack for simplicity

### The highlevel architecture

(diagram placeholder)
To build an HTTPS tunnel you need the following components:

- a highly available server that is exposed to an internet
- Domain name and full control of DNS of it
- a local client (Go binary) running alongside your localhost app to forward traffic

Your highly available server allow specific TCP ports to allow the outside internet to connect to your app. and your Cloud/Hosting provider also needs to allow networking rules for handling incoming and outbound traffic.

#### Tunnel Client: A Local Agent That Connects Outbound

To make this tunnel work, we need a lightweight client running on the developer’s machine. This is a small Go binary that:

- Connects outbound to the tunnel server over a secure WebSocket connection
- Establishes a persistent Yamux session
- Forwards traffic between your local app (localhost:3000, for example) and the public internet

Because the connection is initiated from the local side, it avoids the need for port forwarding or firewall changes — which makes it ideal for NAT’d or restricted environments.

## The Naive Attempt (And Why It Breaks)

A common first instinct when building a tunnel is to read the incoming HTTP request, parse it into structured objects (e.g. `http.Request`), then forward that data to the tunnel client, reconstruct the request, and send it to the actual local app. This seems simple — and works in toy cases — but fails _immediately_ under real-world conditions.

Here’s why:

### Parsing and Reconstructing HTTP is Dangerous

At first glance, HTTP looks like a plain-text protocol — so why not just proxy it line by line? But HTTP has **many moving parts** that interact in non-obvious ways:

#### Key Pitfalls:

- **Chunked Transfer Encoding**: You must correctly decode chunked bodies and reassemble them — and _re-chunk_ them properly when forwarding. If you misalign chunk boundaries, the receiver might never finish reading.

- **Newline Normalization**: HTTP/1.1 uses `\r\n` line endings, but clients may tolerate variations. A naive proxy could introduce subtle bugs by rewriting or stripping them inconsistently.

- **WebSocket Frame Interference**: If you’re using WebSocket as the transport layer and naively forward data without a byte-level stream abstraction, your HTTP chunks might be split across frames, leading to invalid reads on the client side.

- **Connection Reuse**: HTTP/1.1 allows keep-alive connections and pipelined requests. Mishandling this can result in half-read requests, or worse — a later request being forwarded to the wrong backend.

### Error Propagation Is a Minefield

The HTTP spec allows for all sorts of _mid-flight behavior_ that is extremely hard to emulate correctly unless you forward raw bytes as-is.

#### Real Edge Cases That Break Naive Proxies:

- **Client disconnects mid-request**: If you’re buffering request bodies before sending, your proxy may still try to forward a partial/incomplete request — leading to timeouts or panics downstream.

- **Early server errors**: If the upstream server sends a `4xx` or `5xx` before reading the full body, your proxy must stop reading from the client — or risk deadlocks.

- **`Expect: 100-continue` handshake**: Many clients send headers first and wait for `HTTP/1.1 100 Continue` before sending the body. If your proxy doesn't implement this logic faithfully, uploads hang.

- **Half-duplex timing bugs**: If your proxy starts forwarding a response before the full request has been sent, you might violate sequencing expectations in some clients (e.g., `curl` with stdin streaming).

Naively decoding and re-encoding HTTP makes you responsible for _everything the Go stdlib already handles for you_. It’s a high-maintenance, low-reliability approach.

### Header Normalization Hell

HTTP headers are case-insensitive and unordered — _in theory_. In practice, many clients and servers rely on non-standard behavior.

#### What Can Go Wrong?

- **Duplicate headers**: Some headers (like `Set-Cookie`) are allowed to appear multiple times. Reconstructing them naively with a `map[string]string` loses this information.

- **Casing mismatches**: Headers like `X-Foo-Bar` vs `x-foo-bar` might be treated differently by legacy or spec-breaking systems — especially proxies, CDNs, or API gateways.

- **Header ordering**: Some HTTP/2 upgrade paths or custom clients expect a specific header order. Rebuilding requests from scratch may silently break these assumptions.

Unless you forward the **original byte representation** of the headers, you’re always risking behavioral drift. The only safe way to maintain fidelity is to skip interpretation entirely.

### Non-HTTP Traffic Masquerading as HTTP

Not all traffic on port 80/443 is pure HTTP. Some of the most common modern protocols use an HTTP-compatible handshake and then immediately upgrade:

- **WebSockets**: Start with `Upgrade: websocket`, then switch to a framed binary protocol.
- **gRPC**: Uses HTTP/2 headers and trailers with multiplexed streams — break it, and your client hangs or panics.
- **HTTP/2**: Starts with a connection preface (`PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n`) that breaks naive line-based parsers.

If your proxy assumes all traffic is simple HTTP/1.1, these connections will either fail outright or behave erratically. And since you can’t always determine the real protocol _until_ parsing a few frames — or even _after_ — it’s extremely risky to do selective decoding.

### Parsing is a Trap

You’re not building a browser or an API gateway — you’re building a **transport tunnel**. Trying to decode and reassemble HTTP manually means:

- Maintaining a full HTTP parser + serializer.
- Correctly handling edge cases, timeouts, upgrades, partial reads.
- Debugging subtle, protocol-specific bugs that should never be your concern.

Instead, you should treat HTTP like what it is: **a stream of bytes**. If the client sends valid HTTP, and the server expects valid HTTP, then the best thing you can do is **stay out of the way** and forward the raw stream.

In the next section, we’ll look at how using **`Hijack()` in Go** and a **WebSocket + Yamux byte stream tunnel** allows you to avoid all of this complexity — while retaining performance, correctness, and protocol fidelity.

So how do we avoid all this complexity while preserving performance and protocol fidelity?
The answer is simple in principle, but elegant in execution: treat every incoming connection as a raw byte stream, and forward it transparently to the client.

In the next section, we’ll walk through how to build a real working tunnel using Go, WebSockets, and Yamux — with full HTTPS support, multiplexed streams, and subdomain-based routing.

## The Real Setup: Building the Tunnel with Go, WebSocket, and Yamux

To expose a local application securely over the internet, we need a relay system that can accept public traffic on a remote server and forward it to the developer’s machine. A natural starting point is to open a TCP socket on a publicly accessible virtual machine and have the local tunnel client connect to it. Incoming HTTP requests can then be relayed through this connection and routed to a `localhost` server running on the developer’s machine. The responses are passed back the same way, creating a full-duplex tunnel.

However, simply relaying one connection at a time is insufficient. In the real world, many users may access the tunneled app simultaneously, triggering multiple incoming TCP connections on the server. All of these must be multiplexed efficiently over a single persistent connection between the server and the tunnel client — otherwise, scalability quickly breaks down.

### Handling Multi-Tenancy and the Layer 4 Dilemma

One of the critical architectural challenges is supporting multi-tenancy: the ability to route incoming connections to the correct local application, even when several apps are connected to the tunnel server simultaneously. Ideally, each tunneled app is identified by its subdomain (e.g., `appa.tunnel.org`, `appb.tunnel.org`) to allow for logical separation.

But there’s a catch. Subdomain routing relies on application-layer data — typically visible only once the HTTP headers have been parsed. At Layer 4 (TCP), we don’t yet have access to this information. While advanced setups could use the Server Name Indication (SNI) field in TLS to infer the subdomain during the TLS handshake, this adds complexity and pushes routing logic earlier in the connection lifecycle. For simplicity and flexibility, it’s better to move routing to the HTTP application layer where domain names are readily accessible.

### Hijacking TCP from HTTP: Going Low-Level in Go

Go’s networking stack is one of its biggest strengths, and the `net/http` package offers convenient abstractions for building traditional web servers. But in a tunnel, we don’t want to parse HTTP requests or write back responses via `http.ResponseWriter`. We want full control over the raw TCP connection so we can forward bytes directly to the tunnel client.

Go makes this possible with `http.Hijacker`. When an HTTP request arrives, calling `ResponseWriter.Hijack()` gives you access to the underlying `net.Conn` — the raw TCP socket. This is exactly what we need to bridge the incoming request with a Yamux stream over the tunnel.

Once the connection is hijacked, we no longer care about HTTP semantics. We stream raw bytes between the remote browser and the local application, preserving the exact content and behavior without modifying headers, buffering bodies, or managing chunked encoding.

### Scaling with Yamux: Multiplexing HTTP Requests

A tunnel must support multiple simultaneous HTTP requests, each potentially long-lived or high-throughput. Most Go servers treat each HTTP request as its own connection. That model breaks down when all traffic needs to flow through a single persistent tunnel.

To solve this, we use **Yamux** — a lightweight stream multiplexer that runs over any `net.Conn`. Yamux allows multiple independent streams (like virtual TCP connections) to be multiplexed over a single physical connection. That’s perfect for tunneling HTTP traffic through one WebSocket.

Here’s the core idea: on the server side, each hijacked connection opens a new Yamux stream. That stream is relayed to the tunnel client, which connects it to the appropriate local port. Data flows in both directions — from browser to app and back — over this virtual channel.

On the server, it looks like this:

```go
session, _ := yamux.Server(wsConn, nil)
for {
    stream, _ := session.Accept()
    go handleHTTPRequest(stream)
}
```

Each stream is independent, so concurrent requests can be processed in parallel with proper flow control and graceful shutdown.

### Routing Connections via Subdomains at the Application Layer

Since we’re operating at the HTTP layer after TLS termination, we now have access to useful metadata like the requested hostname. This makes subdomain-based routing trivial.

For example, if a user accesses `appa.tunnel.org`, the tunnel server reads the `Host` header and uses it to find the right tunnel client connected for that subdomain. The hijacked TCP stream is then routed through Yamux to the corresponding client, which forwards it to the correct local service.

This design provides multi-tenancy without introducing the complications of SNI parsing or raw TCP sniffing. It also enables flexible, per-subdomain isolation — similar to how commercial tunnel providers like ngrok operate.

_(Diagram of request flow and domain-based routing should be inserted here.)_

### Making It Work Over WebSocket

One more obstacle remains: getting this tunnel to work in environments where raw TCP connections are blocked or restricted. Many networks (especially corporate or campus ones) don’t allow inbound TCP connections or custom ports. That’s where WebSockets come in.

WebSockets are an HTTP-based, bidirectional protocol that works over standard ports (80/443) and supports full-duplex messaging. We can use them to emulate a persistent TCP channel between the tunnel server and the client — avoiding NAT, firewall, and root-access issues altogether.

However, WebSockets are message-based, not stream-based. That means they transmit discrete binary messages — not a continuous byte stream — which creates an incompatibility with tools like Yamux that expect a standard `net.Conn` interface.

### Adapting WebSocket to net.Conn

To bridge this gap, we build a simple adapter that wraps a WebSocket connection and exposes it as a `net.Conn`. This adapter manages a read buffer internally and exposes standard `Read()`, `Write()`, and `SetDeadline()` methods — just like a TCP socket.

Here's a rough sketch of the adapter:

```go
type WebSocketConn struct {
    conn *websocket.Conn
    // buffers, deadlines, etc.
}

func (w *WebSocketConn) Read(p []byte) (n int, err error) { ... }
func (w *WebSocketConn) Write(p []byte) (n int, err error) { ... }
func (w *WebSocketConn) SetDeadline(...) { ... }
```

- `Read()` receives binary frames, buffers them, and returns byte slices as requested.
- `Write()` takes a byte slice and wraps it into a binary WebSocket message.
- Deadline functions are forwarded to the underlying WebSocket, preserving timeout behavior.

This lets Yamux (and any other `net.Conn`-based library) treat the WebSocket tunnel exactly like a raw TCP connection. It’s an elegant and clean abstraction — no changes needed in upstream or downstream logic.

### Why This Works: Letting Lower Layers Handle Complexity

By using `Hijack()` and `net.Conn`, we treat each connection as a transparent stream. We don’t parse headers, decode chunked encoding, or manage HTTP buffering. We let the browser and local app handle that.

Similarly, Yamux handles stream management, and WebSockets provide reliable transport even over firewalls or NAT.

This layered design avoids reinventing low-level behaviors like:

- Frame reassembly
- Backpressure and flow control
- Packet retransmission and ordering

All of these are already built into TCP and the WebSocket libraries. By staying at a low enough abstraction level — just forwarding raw byte streams — we get correctness, performance, and flexibility “for free.”

Absolutely — here's a **rewritten and restructured version** of the _TLS & Wildcard Domains_ section, keeping **all your original ideas**, but improving the **flow, coherence, and tone**. It avoids promotional overtones while preserving clarity, and replaces bullets with cohesive paragraphs for readability and publication quality.

## TLS and Wildcard Domains via Caddy

Handling HTTPS in self-hosted environments is often painful — especially if you want automatic certificate provisioning, wildcard domain support, and multi-client flexibility. Instead of embedding TLS logic directly in the Go tunnel server, I delegated the responsibility to [Caddy](https://caddyserver.com/) — a lightweight reverse proxy and load balancer with excellent HTTPS automation.

Caddy handles the entire lifecycle of TLS certificates, including issuance, renewal, and integration with reverse proxy logic. It supports Let’s Encrypt out of the box, works well in HTTP-based setups like mine, and requires minimal configuration to get started. Since our tunnel system relies on routing requests by subdomain (e.g. `abc123.tunnel.example.com`), wildcard TLS is essential — and Caddy makes that easy to automate.

### Wildcard Certificates with DNS-01: What and Why

In a tunnel setup that dynamically generates subdomains for every client session, traditional per-domain TLS certificates would be impractical. That’s where **wildcard certificates** come in. A single cert for `*.tunnel.example.com` can cover any subdomain — meaning once the wildcard cert is issued, every new client gets an HTTPS-secure URL by default.

To obtain such a wildcard cert, the system must pass a **DNS-01 challenge**. Unlike HTTP challenges (which require hosting a special file on the domain), DNS-01 requires creating a temporary TXT record under the domain’s DNS zone. This proves to the certificate authority that you control the domain — without requiring any server restarts or open ports.

Let’s Encrypt, the most widely used CA, supports DNS-01 challenges natively. When Caddy requests a wildcard cert, Let’s Encrypt instructs it to add a specific TXT record (usually under `_acme-challenge.tunnel.example.com`) to verify domain ownership.

### Automating the DNS Challenge: Using the Cloudflare API (or Alternatives)

To satisfy this DNS challenge automatically, Caddy needs the ability to programmatically update DNS records. In my setup, the domain is managed via **Cloudflare**, which offers a simple DNS API for free. By giving Caddy scoped access to this API, it can handle certificate provisioning hands-free — adding and cleaning up TXT records as needed.

However, this does require a small customization step. The Cloudflare DNS plugin isn’t bundled with Caddy by default, so I used [`xcaddy`](https://github.com/caddyserver/xcaddy) to compile a custom binary of Caddy with DNS provider support built-in. This allows Caddy to authenticate with Cloudflare, handle the DNS-01 flow, and obtain wildcard certs for `*.tunnel.example.com` without any manual steps or web dashboard interaction.

While Cloudflare works well, it's not the only option. Caddy supports a wide range of DNS providers through plugins — including AWS Route53, DigitalOcean, and others. If you’re concerned about vendor lock-in or promotional restrictions, switching DNS providers is trivial. The key requirement is simply API support for DNS updates during cert issuance.

### One Cert, Unlimited Subdomains — Automatically

Once the wildcard cert is in place, Caddy terminates HTTPS at the edge and forwards traffic to the Go tunnel server. Since TLS termination happens at the proxy level, the server receives decrypted requests and can inspect headers like `Host` to route them to the correct tunnel client. This also means that clients connecting to randomly generated subdomains (like `u93ht7.tunnel.example.com`) receive valid, browser-trusted HTTPS connections instantly — no DNS configuration, no cert renewal logic, and no runtime changes needed.

This approach ensures that the tunnel can safely and dynamically expose multiple local applications to the public internet under unique, secure URLs — all from a single wildcard certificate.

## Security Practices and Operational Lessons

### Delegating TLS to Caddy: A Clean Separation

By offloading HTTPS to Caddy, the Go tunnel server can stay focused on what it does best: managing byte-level streams. This separation of concerns improves maintainability, simplifies error handling, and reduces the surface area for TLS-related bugs.

Caddy is also an ideal fit for resource-constrained environments. I’ve successfully run this setup on small virtual machines (including ARM64 boxes) without performance issues, and Caddy’s config format remains simple even with multiple subdomains in play.

### Security Boundaries and Considerations

All traffic between clients and the tunnel server passes through HTTPS, terminated at the edge by Caddy. The API token used for DNS updates is scoped to DNS only, limiting exposure in case of leaks. For authentication between the tunnel client and server, I currently rely on manual access control. This could be improved in future versions by implementing mutual TLS (mTLS) or token-based handshakes per client — a common pattern in production tunneling systems.

If you run this setup on a shared VM, you can layer in additional protections using HTTP Basic Auth at the Caddy level, or configure per-client authentication using custom logic in the Go server.

Here’s a more polished and narrative-driven ending to your article that ties everything together, reinforces your expertise, and leaves readers with a sense of clarity and inspiration — without sounding like a pitch.

## What’s Next?

This tunnel system started as a personal workaround — a way to expose local apps during development without hitting the limits of services like ngrok. But it quickly turned into something deeper: a small but complete blueprint for secure, multiplexed, and fully self-hosted networking infrastructure, all built from first principles using Go.

There’s plenty of room to evolve this further. In future iterations, I plan to introduce an authentication handshake at the tunnel layer, explore gRPC for more structured communication between clients and server, and integrate Prometheus metrics to monitor usage and performance over time. But even in its current form, this tunnel is lightweight, production-capable, and fully under your control.

If you want to understand what’s really happening under the hood when you click “share URL” in a tunneling service — or you want to build your own version without vendor limits — I’ve open-sourced the full code (link at the bottom of the article).

## Final Thoughts

Building things from scratch — even small ones — gives you a much sharper sense of where abstractions help and where they hurt. In this project, I deliberately avoided high-level proxies and frameworks in favor of raw TCP streams, simple UNIX-style design, and well-defined protocols like WebSocket and TLS.

In the end, the lesson was clear: when the system stays dumb, it stays correct. And when you understand the boundaries — what to parse, what to ignore, and what to delegate — you can build something secure, powerful, and refreshingly simple.

If you end up building your own tunnel or riffing on this design, I’d love to hear about it.

## Related Links

- 🧠 [Source Code on GitHub](https://github.com/nexo-tech/microtunnel) – MIT licensed, ~300 lines
- 📦 [xcaddy – Build Caddy with Plugins](https://github.com/caddyserver/xcaddy)
- 🔧 [Caddy DNS Providers List](https://caddyserver.com/docs/modules/dns.providers)
- ☁️ [Cloudflare API Token Permissions](https://developers.cloudflare.com/api/tokens/create/)
