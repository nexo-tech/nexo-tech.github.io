---
date: 2026-04-07T09:00:00-07:00
draft: false
params:
  author: Oleg Pustovit
title: "Why AI Agents Need a Package Manager"
weight: 10
tags:
  - ai-agents
  - package-manager
  - agentpack
  - rust
  - open-source
  - agentic-ai
  - developer-tools
topics:
  - "AI & Agents"
  - "Developer Tools"
description: "The AI agent ecosystem is where npm was in 2010. Everyone is building agents, but nobody has solved distribution. Here's why I built agentpack."
keywords:
  - AI agent package manager
  - agentic AI tools
  - AI agent skills
  - agentpack
---

The AI agent ecosystem is where npm was in 2010. Everyone is building agents, but nobody has solved distribution.

I've been building production AI systems for the past two years — multi-agent orchestration, tool-calling pipelines, RAG stacks — and the same problem keeps surfacing: **how do you give an agent a new capability without rebuilding everything?**

Right now, the answer is copy-paste. You find a prompt template on GitHub, download some Python scripts, wire them together manually, pray the dependencies don't conflict. We've been here before. We solved it for JavaScript (npm), for Rust (cargo), for Python (pip). Why hasn't anyone solved it for agents?

## The Problem: Agents Are Software, but We Don't Treat Them That Way

Modern AI agents are composable systems. An agent that can browse the web, query databases, and write code is really three skill modules glued together by an orchestrator. But today those "skills" live as:

- Loose Python files in GitHub repos
- Hardcoded tool definitions inside agent frameworks
- Prompt templates copy-pasted from blog posts
- MCP servers with no versioning or dependency management

There's no `package.json` for agents. No lockfile. No semantic versioning. No registry.

## What a Package Manager for Agents Looks Like

I've been working on [agentpack](https://github.com/OlegHQ/agentpack) — a Rust CLI that treats agent skills as first-class packages. Here's the core thesis:

1. **Skills are packages.** Each skill has a manifest (name, version, dependencies, compatible runtimes), an entry point, and a test suite.
2. **Agents declare dependencies.** An agent's config file lists which skills it needs, pinned to specific versions.
3. **Installation is deterministic.** `agentpack install` resolves the dependency tree, downloads skills, and wires them into your agent runtime — the same way cargo or npm would.
4. **Publishing is open.** Anyone can publish a skill to the registry. Quality emerges from community curation, star counts, and download metrics.

```bash
# Install a skill for your agent
agentpack install web-browser@1.2.0

# List installed skills
agentpack list

# Publish your own skill
agentpack publish ./my-custom-tool
```

## Why Rust?

Performance and portability. Agent skill resolution needs to be fast — when you're spinning up 50 agents in parallel, you can't wait 30 seconds for dependency resolution. Rust gives us:

- Sub-second installs via compiled resolution logic
- Single binary distribution (no runtime dependencies)
- Cross-platform support (Linux, macOS, Windows) from day one
- Memory safety without garbage collection pauses

## The Bigger Picture: Composable AI Infrastructure

Package management is the first layer. Once you have versioned, distributable skills, you unlock:

- **Agent marketplaces** — discover and install pre-built capabilities
- **Enterprise skill governance** — control which tools your agents can use
- **Reproducible deployments** — lockfiles guarantee identical agent behavior across environments
- **Community-driven innovation** — the same network effects that made npm's ecosystem explode

We're at an inflection point. The teams that build the infrastructure layer for AI agents will define how the next generation of software is built. Package management isn't glamorous, but it's foundational.

**agentpack is open source.** Check it out on [GitHub](https://github.com/OlegHQ/agentpack), install via Homebrew (`brew install OlegHQ/tap/agentpack`), and tell me what skills you'd want in the registry.
