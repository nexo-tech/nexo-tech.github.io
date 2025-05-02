---
date: 2025-05-02T11:04:12.088Z
draft: true
params:
  author: Oleg Pustovit
title: "How to expose your localhost app to the internet by building a Self‑Hosted HTTPS Tunnel with Go, WebSockets, and Yamux"
weight: 10
tags:
  - go
  - concurrency
  - functional-programming
---

# How to expose your [localhost](http://localhost) app to the internet by building a Self‑Hosted HTTPS Tunnel with Go, WebSockets, and Yamux

When you're developing a web app locally, it’s often useful to expose it to the internet — to share with teammates, test integrations, or run live demos. Tools like ngrok, Cloudflare Tunnel, or GitHub Codespaces make this easy, but they come with limitations:

- You're locked into fixed subdomains
- There's limited customization
- Free plans often restrict usage or throttle speed

If you already control a VM with a public IP and a domain name, it’s entirely possible to build your own self-hosted alternative — with full HTTPS support, automatic subdomain routing, and stream multiplexing — using nothing more than Go, WebSockets, and Yamux.

In this article, I’ll walk through how to build a lightweight HTTPS tunnel from scratch. You’ll learn how to forward raw TCP traffic over WebSockets, provision wildcard TLS certs automatically via Caddy + Cloudflare, and multiplex multiple requests through a single connection — without writing a full proxy or web server.

## Core Architecture: What pieces do you need

This article is an explanation how to build your own setup like ngrok, where you’ll learn specifics on provisioning TLS certificates for your wildcard domain names and setting up and automated scalable tunnel with Go and its rich ecosystem of libraries like `yamux` (for connection multiplexing) and websockets (`gorilla/websocket`).

#### Let’s define technical requirements for our self-hosted tunneling service

1. A service should be secure (HTTPS) and easily accessible from the internet (need reasoning and explanation)
2. It should expose minimal ports in the server firewall configuration (need explanations)
3. It should use basic HTTP based protocols (need reasoning and explainations)
4. It should dynamically generate a subdomain, like ngrok does, so every exposed app has its own subdomain, so there’s flexibility (need reasoning and explanation)
5. The service should serve multiple connected clients and needs to manage every connection in a flexible way (need reasoning and explanation)
6. The solution shouldn’t be overly complex and should use Go technical stack for simplicity

### The highlevel architecture

(diagram placeholder)
To build an HTTPS tunnel you need the following components:

- a highly available server that is exposed to an internet
- Domain name and full control of DNS of it
- your local setup with [localhost](http://localhost) application running on certain TCP port

Your highly available server allow specific TCP ports to allow the outside internet to connect to your app. and your Cloud/Hosting provider also needs to allow networking rules for handling incoming and outbound traffic

## The Naive Way (and Why It Fails)

So when he says:

> Hijack incoming HTTP connections to stream them directly without re-encoding

He means:

> “Instead of acting like a web server, I grab the raw socket and just pipe it to the client’s machine as-is, like a smart TCP proxy — saving complexity and improving performance.”

Let me know if you want to see Go code that shows how the hijack and pipe actually works.

#### **Why it’s tricky:**

- If you’re proxying HTTP manually, you must correctly parse and reassemble these chunks — including:
  - Keeping the right newlines
  - Stripping them if needed
  - Making sure chunk boundaries don’t get split across WebSocket frames
- If you mess this up, the receiving end gets malformed data or never knows the request ended.

---

### **🧯 3.**

### **Error propagation and edge behavior**

#### **Problems here:**

- What happens if the client disconnects mid-request?
- What if the server sends an error response early (before reading the full body)?
- What if you get a 100 Continue interim response?
- How do you forward Expect: 100-continue logic?

When you’re decoding and re-encoding HTTP manually, **you become responsible for faithfully reproducing** these edge cases. Otherwise, subtle bugs appear — e.g. an API call that hangs indefinitely, or an upload that fails in a confusing way.

---

### **🧭 4.**

### **Header Normalization and Casing**

#### **Why it matters:**

HTTP headers are case-insensitive, but not all libraries treat them identically. Some clients (especially older or unusual ones) rely on quirks like:

- Duplicated headers (Set-Cookie)
- Weird casing (x-Foo-Bar)
- Header ordering

If you reconstruct requests manually, you can easily lose or mangle headers — and some backends might reject the request or behave differently.

---

### **🧪 5.**

### **Non-HTTP Protocols over HTTP Ports**

Some clients will start a connection expecting WebSockets, gRPC, or HTTP/2 upgrade headers. These look like HTTP — but behave differently. If you’re parsing naively, you can’t always tell what protocol is in play.

---

### **🧰 So what’s the alternative?**

When Oleg says he **hijacks the connection and tunnels the raw bytes**, he avoids all of this.

He lets the browser and the target server handle:

- Keep-alive
- Chunked encoding
- Header quirks
- Connection lifecycle

His tunnel becomes a **dumb pipe** — but in the best way. It doesn’t try to interpret HTTP — it just carries it faithfully.

### The simplest bare-bones setup operating and level 4 — TCP

The natural and obvious step for getting this app ready is to an open TCP socket on specific port on a virtual machine and then let the client connect to that socket. Then the incoming users will be sending HTTP requests and they will be relayed over that socket to client, client will direct that TCP traffic to the [localhost](http://localhost) app and receive from it data. An important component here would be TCP connection multiplexing — it’s important because there will be many TCP connections that will come from the internet to VM and they have to be multiplexed over a single TCP connection to the client.

This is a very important component in this setup, but there are problems: we need to suport multi-tenancy in client connections. however we have to distinguish when one users connects for app 1 that is tunneled, and when they connect to app 2 (e.g. with a subdomain). But the problem with subdomains are, we have to operate on HTTP application layer, but when we are working on a level 4 TCP layer we don’t have a luxiry of this. There comes solutions with SNI data from the upstream load balancer, but that adds more complications to the setup.

## The Real Setup: WebSocket + Yamux + Go

### Using HTTP layer to define routing of multiple connections

(diagram is needed here)

to handle routing properly let’s move our setup to application layer, this way every request initiated from the outside world could be hosted and we can easily see the upstream domain name that was used for connection. E.g. [appa.tunnel.org](http://appa.tunnel.org) and [app-b.tunnel.org](http://app-b.tunnel.org) can be routed to correct downstream clients and communicate with right yamux mmultiplexer

Code example:

(needed)

#### Transmitting a raw TCP traffic from an active HTTP request.

Go is very flexible in networking programming and has powerful abstractions, while it has http request and response writers, if needed you have an option to go abstraction lower and get underlying net.Conn for the active connection. We gnerally need to use net.Conn to transit it over yamux multiplexer. And Go provides utility called net Hijack. but using that call we can feed that connection into yamux and retreive response. Note that this way we have to manually handle HTTP response instead of using response writer

(code example needd)

HTTP is a stream-based protocol, but vanilla Go servers (and many proxies) handle one connection per request. This doesn’t scale well over a single tunnel. If we want to allow N requests concurrently through a single WebSocket, we need to **multiplex**.

**Yamux** is a lightweight stream multiplexer designed to run over any net.Conn. It gives us:

- Stream-based communication over one connection.
- Backpressure support and clean shutdown semantics.
- Simple framing protocol.

In Go terms:

```jsx
session, _ := yamux.Server(wsConn, nil)
for {
    stream, _ := session.Accept()
    go handleHTTPRequest(stream)
}
```

On the client side, we just mirror this and open a new stream per proxied request.

In Go’s net/http server, after a request comes in, you usually handle it by reading from http.Request and writing back to http.ResponseWriter. That’s great for normal web apps — but it’s **too high-level** when you’re building a tunnel.

Sometimes, you want to **bypass all the HTTP parsing and buffering** and just get access to the raw TCP connection underneath.

That’s what Go’s [ResponseWriter.Hijack()](https://pkg.go.dev/net/http#Hijacker) does:

> It gives you the raw net.Conn — the actual socket — so you can take over and do whatever you want with it.

---

#### **🧵 Why hijack in this project?**

In the tunnel server:

- A browser sends an HTTP request to something.tunnel.example.com.
- Instead of decoding the request and re-encoding it for the client, the server **hijacks** the connection.
- Now it has direct access to the underlying byte stream (HTTP request and all).
- It **opens a new yamux stream** over the WebSocket to the tunnel client (running on your laptop).
- It starts piping bytes **directly**, in both directions:
  - From browser → to your local app.
  - From your local app → back to the browser.

No decoding. No buffering. No parsing headers and writing new ones.

---

#### **⚡Why avoid re-encoding?**

Because it:

- **Adds overhead** (CPU, latency)
- **Introduces bugs** (chunked encoding, headers, content length mismatches)
- **Loses fidelity** (you might accidentally mangle something the client or server depends on)

By **streaming the raw bytes**, you:

- Preserve exact behavior (e.g., WebSockets, chunked uploads, etc.)
- Handle weird edge cases naturally (no need to re-implement HTTP quirks)
- Keep the tunnel fast and lightweight

### Making our setup more resillient by using custom websocket protocol for sending receiving TCP traffic from/to client

Okay, now we can look at how to simplify the setup. Occasionally on some network firewalls it may not be always possible to open up arbitrary TCP ports, but without that having client/server communication for tunneling apps is not possible with raw TCP. Fortunately, nowadays there are bidirectional messaging protocols available that could be used. As an example we can point out to gRPC streaming and very commonly used nowadays — WebSockets.

Unlike traditional tools that forward raw TCP, we tunnel over **WebSockets** — meaning all traffic rides over a single HTTP/1.1 connection upgraded to wss://.

Advantages:

- **Firewall & NAT friendly** – WebSocket is just HTTP at the start, so it works on locked-down networks.
- **No root needed** – We avoid raw TCP listeners or iptables tricks.
- **Stream-friendly** – We can hijack the HTTP connection at the byte level and forward it as-is.
- **Multiplexable** – WebSocket supports framing, so we can layer yamux over it and run multiple streams (i.e. HTTP requests) concurrently.

Websockets establihs their connection over HTTP and then upgrade it to allowe sending and receiving messages. Of course we are often used to websockets to power real-time chats or dashboards in regular web apps. In this instance, we’ll look at how at how to utilisie bidirectional nature of websockets in emulating consistent TCP connection.

We have to understand that websockets operate on higher level packed messages abstractions, rather than passing raw bytes over sockets.

In go example I’m using `gorilla/websocket` library to handle websockets and it’s using wbesocket.Conn abstrtaction that is not so compatible with regular net.Conn. Go language allows to build an adapter.

Here’s the tricky part: WebSockets in Go (via gorilla/websocket) don’t expose net.Conn. But **yamux expects a byte stream**, not message-based frames.

The solution is a small adapter that wraps a WebSocket connection and implements:

```jsx
type WebSocketConn struct {
    conn *websocket.Conn
    // buffers, deadlines, etc.
}

func (w *WebSocketConn) Read(p []byte) (n int, err error)
func (w *WebSocketConn) Write(p []byte) (n int, err error)
func (w *WebSocketConn) SetDeadline(...)
```

- **Read**: Accumulate data from incoming binary frames.
- **Write**: Send byte slices as binary messages.
- **Deadlines**: Wrap underlying websocket timeouts.

With this, we can treat the WebSocket like any net.Conn and feed it directly to yamux.

### **🎯 Problem: WebSockets ≠**

### **net.Conn**

The **Go net.Conn interface** is how most network code in Go expects to read/write data. It acts like a raw pipe: you can shove bytes into it (Write()), or pull bytes out (Read()), and set timeouts (SetDeadline()).

But **WebSockets don’t work like that**. They’re higher-level:

- They send/receive **framed messages** — kind of like discrete “envelopes” of data.
- You can’t just pull arbitrary bytes from them like a pipe — you get **whole messages**, not byte streams.

But tools like **yamux** expect to operate on plain net.Conn — they want to treat the connection like a raw duplex socket.

So now you have a mismatch:

> ❌ yamux wants a pipe (net.Conn), but you’re holding an envelope-based mailbox (WebSocket).

---

### **✅ Solution: Write an**

### **adapter**

### **that makes WebSockets**

### **look like**

### **a**

### **net.Conn**

Imagine a little translator that sits between the two systems and smooths things over:

#### **1.**

#### **Read(): stream bytes from frames**

- WebSockets give you _one message at a time_.
- But Read() might ask for just 50 bytes — not a whole message.
- So the adapter:
  - Waits for a new WebSocket message.
  - Stores it in an internal buffer.
  - Serves pieces of it to the Read() caller as needed.
  - Keeps going until the whole frame is consumed, then grabs the next.

📦 **Analogy**: Like unwrapping a full granola bar, then breaking off pieces every time someone asks for a bite.

---

#### **2.**

#### **Write(): send byte slices as binary WebSocket messages**

- net.Conn.Write([]byte) means: “send this blob of data over the wire.”
- The adapter wraps that blob into a **binary WebSocket frame** and sends it.

There’s no streaming here — each Write() becomes one message.

📨 **Analogy**: Every time someone hands you some bytes, you seal them in an envelope and ship it.

---

#### **3.**

#### **Deadlines: map to WebSocket timeouts**

- Go’s net.Conn has SetReadDeadline() and SetWriteDeadline() — for timeouts.
- The WebSocket library also supports setting timeouts internally.
- The adapter just maps one to the other.

⏱️ **Analogy**: “If this person doesn’t respond in 5 seconds, give up” — the adapter tells the WebSocket layer to enforce that.

---

### **🔧 Why this matters**

This adapter lets you **treat a WebSocket like a raw TCP socket** — which means you can:

- Use **yamux** to multiplex streams
- Avoid rewriting network logic
- Plug into existing libraries expecting net.Conn

It’s a clean abstraction bridge — kind of like writing an “HDMI to USB” converter so you can plug one protocol into another without modifying either.

> “Because I designed this tunnel to work at a
>
> _low enough level_

Let’s break that into pieces.

---

### **📎 First: What are “edge cases” here?**

In networking, **edge cases** are the weird, rare, or difficult scenarios that don’t show up in the happy path but break things when they do. Here are some real examples:

#### **🔄 Frame Buffering**

- What if your client sends a WebSocket message in pieces, or it arrives slowly over time?
- What if your Read() call only gets **part** of the message?

You’d need to handle buffering correctly so you don’t misread data or stall.

#### **🛑 Backpressure**

- What if the sender is very fast, but the receiver is slow?
- If you don’t apply **flow control**, you risk:
  - Running out of memory
  - Dropping data
  - Overwhelming the receiver

Systems need to slow down the sender until the receiver catches up — this is called **backpressure**.

---

### **🧠 Why didn’t Oleg have to deal with these?**

Because he used **existing, low-level protocols** that already handle these cases:

#### **✅ WebSockets:**

- Handle **framing** (breaking messages into chunks).
- Handle **reassembly** of partial messages.
- Apply **backpressure** internally — most WebSocket libraries won’t let you flood the pipe.

#### **✅ TCP:**

- Already has **flow control** and **retransmission**.
- Automatically handles packet loss, delays, etc.

So Oleg’s design is smart: he leans on **battle-tested layers** (WebSocket → TCP) instead of writing complex buffering logic himself.

---

### **📦 Why abstraction level matters**

When you stay at a **low enough level** — just forwarding byte streams — you don’t need to:

- Understand chunked encoding
- Handle partial HTTP messages
- Buffer JSON blobs
- Detect malformed headers

You just move bytes from point A to point B. And the lower layers (WebSocket, TCP) do all the “annoying” work for you.

---

At this point websocket should transmit TCP traffic just fine let’s go over security and SSL configuration.

## TLS & Wildcard Domains via Caddy

### Securing server with TLS — using Caddy and Cloudflare API

I chose combination of already exising load balancer and reverse proxy that can seamlessly manage SSL certicates. This is something that may be painful to do manually, so choosing and off the shelf solution works great.

Caddy allows to provisition SSL certs with let’s encrypt and is very flexible in configuration. We operate on HTTP level, so caddy fits perfectly here.

The problematic part is to get SSL cert dynamicall issued based for a wildcard certificate that could be used on a virtual machione. To handle that I used Cloudflare to fully manage my DNS. and advantage of cloudflare is that it gives an API for free

#### **🧩 Here’s how it works, step-by-step:**

1. **Caddy wants a TLS cert for \*.tunnel.example.com**, so it triggers the DNS-01 challenge with Let’s Encrypt (or another CA).
2. Let’s Encrypt says:

   > “Prove you control tunnel.example.com. Add a TXT record to the DNS: \_acme-challenge.tunnel.example.com with this random value.”

3. **Caddy uses your Cloudflare API token** to automatically:
   - Add that TXT record to your domain’s DNS zone via Cloudflare’s API.
   - Wait a bit until DNS propagates.
   - Tell Let’s Encrypt: “Okay, check now.”
4. **Let’s Encrypt looks up \_acme-challenge.tunnel.example.com** and sees the proof.
5. ✅ Success! It issues a cert that covers \*.tunnel.example.com and tunnel.example.com.
6. Caddy installs that cert. Now **any subdomain**, like:

   - abc123.tunnel.example.com
   - foo.tunnel.example.com
   - yourapp.tunnel.example.com

   …will be trusted by browsers with the green padlock — **without needing more DNS changes**.

---

#### **🧠 Why this works**

- **DNS-01 is domain-wide proof**. You’re proving control of the domain, not each individual subdomain.
- The wildcard cert is valid for _any_ subdomain under that wildcard.
- That’s why you can dynamically hand out subdomains to each tunnel client, and they’ll all “just work” with HTTPS — no extra DNS calls, no manual certs.

#### **❓What is “Wildcard TLS” and “DNS-01 challenge”?**

**TLS (formerly SSL)** is what gives websites the secure padlock in your browser — it encrypts data so no one can spy on it in transit.

Normally, each subdomain (like app.example.com, blog.example.com) would need its _own_ TLS certificate. But a **wildcard certificate** (e.g. *.example.com) lets you cover *all\* subdomains with a single cert — super useful if you’re dynamically creating lots of them, like abc123.tunnel.example.com, xyz789.tunnel.example.com, etc.

To get a TLS certificate, you usually have to **prove you own the domain**. There are a few ways to do that — one of them is called the **DNS-01 challenge**.

---

#### **✅ How does the DNS-01 challenge work?**

It’s pretty clever. The certificate authority (in this case, Let’s Encrypt via Caddy) asks you:

> “If you really control example.com, prove it by adding a special record to its DNS.”

So your server uses the **Cloudflare API** to automatically add this temporary DNS record. Then, the certificate authority checks the DNS, sees the proof, and issues a certificate — in this case, a **wildcard cert** that covers any subdomain like \*.tunnel.example.com.

This is all done programmatically, no manual copy-pasting or clicking around in web dashboards.

---

#### **🔒 Why is this useful here?**

This tunnel system generates **random subdomains** every time you connect (e.g., 3f9k7t2x.tunnel.example.com) so you can share your local server securely without collisions or configuration.

By using **wildcard TLS with Cloudflare DNS-01**, the server can automatically give each of these subdomains a valid HTTPS certificate. That’s why they’re “instantly green-locked” — your browser trusts them _just like_ a regular secure website.

---

#### **🧠 The big win**

This setup lets a $0/month server:

- Handle unlimited secure subdomains automatically
- Avoid paid TLS services or hard-coded domains
- Stay 100% under your control (no ngrok limits, no vendor lock-in)

It’s an elegant use of a few powerful building blocks — wildcard TLS, Cloudflare’s DNS API, and Caddy’s automation — to turn a simple Go app into a fully-featured HTTPS tunnel with very little overhead.

## Security, Gotchas, and Lessons

#### **🔒 TLS and Subdomain Routing with Caddy**

Instead of baking TLS into the Go server, we delegate it to **Caddy**, which excels at automatic HTTPS:

- Handles wildcard certs via Cloudflare DNS.
- Automatically renews certs.
- Can route requests by subdomain to specific tunnel clients.

Why Caddy?

- Native DNS-01 support (for issuing wildcard certs).
- Dead-simple config.
- Runs well on low-memory VMs.

---

#### **⚠️ Security Considerations**

- **TLS is mandatory**: All tunnels go through HTTPS via Caddy.
- **Cloudflare API tokens** are scoped to DNS only, minimizing blast radius.
- **Authentication** is currently manual — a future improvement is token-based handshakes per client.

If you’re running this on a shared VM, it’s easy to layer HTTP Basic Auth via Caddy or add mTLS at the tunnel level.

---

#### **🚧 Gotchas and Lessons**

1. **Manual HTTP parsing is painful**

   Originally I tried parsing HTTP requests and responses myself. Edge cases like chunked transfer encoding or connection reuse made it painful. Hijacking and streaming raw bytes is far cleaner.

2. **Yamux + WebSocket buffering just works**

   Surprisingly, backpressure, flow control, and stream isolation worked out of the box once the net.Conn adapter was solid.

3. **Wildcard certs + subdomains are a superpower**

   Issuing certs dynamically per subdomain with Cloudflare DNS is fast, and every client can have its own URL like xyz123.tunnel.example.com.

---

#### **🛠 Go Ecosystem Observations**

- The **http.Hijacker** interface is underused but critical for tunneling.
- **Yamux** is battle-tested (used in HashiCorp projects).
- **Go’s net/http** stack, while high-level, can be cleanly escaped into raw TCP when needed.

Cross-compilation is trivial — I deploy the tunnel server on a $0 Oracle VM (ARM64) and the client on macOS, Linux, or WSL without issues.

## Next Steps + Repo

---

#### **🧪 Future Directions**

- Authentication handshake before tunnel opens.
- gRPC transport support (structured binary protocol).
- Prometheus metrics via middleware for tunnel traffic.

---

#### **📦 Code & Repo**

Everything described here lives in [this GitHub repo](https://www.notion.so/How-to-expose-your-localhost-app-to-the-internet-by-building-a-Self-Hosted-HTTPS-Tunnel-with-Go-Web-1e75d032cdcd80e1a620e4758cf575aa?pvs=21) — under MIT license. It’s about ~300 lines of Go, plus Caddy config and Makefile.

If you’re curious about how tunnels work under the hood — or want to own the full stack of your own HTTPS endpoint — it’s a rewarding weekend project.
