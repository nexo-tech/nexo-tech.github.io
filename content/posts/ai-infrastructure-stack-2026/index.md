---
date: 2026-04-17T09:00:00-07:00
draft: false
params:
  author: Oleg Pustovit
title: "The AI Infrastructure Stack in 2026: What's Missing"
weight: 10
tags:
  - ai-infrastructure
  - developer-tools
  - agentic-ai
  - ai-tooling
  - agentpack
topics:
  - "AI & Agents"
  - "Developer Tools"
description: "We have foundation models, vector databases, and agent frameworks. What we don't have is everything in between."
keywords:
  - AI infrastructure 2026
  - AI developer tools
  - agentic AI stack
  - AI tooling landscape
---

We have foundation models. We have vector databases. We have agent frameworks. What we don't have is everything in between.

After two years of building production AI systems, here's my map of the AI infrastructure stack — and the critical gaps that need filling.

## The Stack as It Exists Today

**Layer 1: Models** (Solved)
OpenAI, Anthropic, Google, Meta, Mistral — no shortage of capable models. This layer is commoditizing fast.

**Layer 2: Inference** (Mostly Solved)
Together, Fireworks, Groq, AWS Bedrock — model serving is becoming a utility. Prices drop monthly.

**Layer 3: Frameworks** (Fragmented)
LangChain, CrewAI, AutoGen, Agents SDK, Mastra — too many frameworks, not enough standards. Every framework has its own abstraction for tools, memory, and orchestration. Nothing is portable.

**Layer 4: Data** (Partially Solved)
Vector databases (Pinecone, Weaviate, Qdrant) handle embeddings. But RAG pipelines are still mostly hand-rolled. Document processing, chunking strategies, and retrieval quality are unsolved at the infrastructure level.

**Layer 5: Infrastructure** (Wide Open)
This is where the biggest gaps are.

## The Five Missing Pieces

### 1. Agent Package Management

There's no npm for agents. Skills, tools, and plugins are distributed as loose code with no versioning, dependency resolution, or registry. This is what [agentpack](https://github.com/OlegHQ/agentpack) aims to solve.

### 2. Agent Observability

LangSmith and Langfuse are starting points, but we need the equivalent of Datadog for agents — full distributed tracing, cost attribution, quality scoring, and anomaly detection across multi-agent systems.

### 3. Agent Testing

How do you test a non-deterministic system? We need evaluation frameworks that go beyond "run it 100 times and check the average." Property-based testing, behavioral contracts, and regression detection for LLM-powered components.

### 4. Agent Identity and Access Control

When an agent acts on behalf of a user, what permissions should it have? We need OAuth-like systems for agents — scoped permissions, audit trails, and revocation. MCP is a start, but it's focused on tool connectivity, not governance.

### 5. Agent Deployment and Lifecycle

Deploying agents isn't like deploying a web service. You need to manage model versions, prompt versions, skill versions, and context configurations. Blue-green deployments for agents. Canary releases for prompt changes. Rollback when an agent starts behaving differently after a model update.

## The Opportunity

Every gap listed above is a company waiting to be built. The AI infrastructure stack will be as large as the cloud infrastructure stack — and right now, most of it doesn't exist.

The builders who focus on these infrastructure problems (rather than building yet another chatbot wrapper) will create the platforms that the next generation of AI applications run on.

I'm working on the package management piece with agentpack. If you're tackling any of the other gaps, I want to hear about it.
