---
date: 2026-04-09T09:00:00-07:00
draft: false
params:
  author: Oleg Pustovit
title: "Building Agentic Workflows at Scale"
weight: 10
tags:
  - agentic-workflows
  - ai-agents
  - multi-agent-systems
  - orchestration
  - production-ai
  - distributed-systems
description: "Everyone's building AI agents. Almost nobody is running them in production. Here are five lessons from shipping agentic systems that actually work."
keywords:
  - agentic workflows
  - AI agent orchestration
  - multi-agent systems
  - production AI agents
---

Everyone's building AI agents. Almost nobody is running them in production.

The gap between a demo agent and a production agentic workflow is the same gap that exists between a hello-world Express app and a microservices architecture handling 10,000 requests per second. The concepts are similar. The engineering is completely different.

I've shipped agentic systems that coordinate multiple LLM-powered agents across planning, execution, and review stages. Here's what I've learned about making them actually work.

## Lesson 1: Agents Need Contracts, Not Just Prompts

The first instinct is to wire agents together with natural language. Agent A tells Agent B what to do in English. This works in demos. In production, it's a reliability nightmare.

What you actually need are **typed interfaces between agents**. Each agent declares:
- What inputs it accepts (with schemas)
- What outputs it produces (with schemas)
- What side effects it may cause
- What failure modes it has

This is the same principle behind API contracts in microservices, just applied to LLM-powered components. The agent can still use natural language internally — but its boundaries must be machine-readable.

```typescript
interface CodeReviewAgent {
  input: {
    diff: string;
    context: FileContext[];
    rules: LintRule[];
  };
  output: {
    approved: boolean;
    comments: ReviewComment[];
    suggestedFixes: CodeFix[];
  };
  sideEffects: ['github.comment', 'github.approve'];
  failureModes: ['llm_timeout', 'context_overflow', 'ambiguous_diff'];
}
```

## Lesson 2: The Orchestrator Is the Product

Individual agents are commodities. GPT-4, Claude, Gemini — they all write decent code, summarize well, and can follow instructions. The value isn't in any single agent. It's in **how you orchestrate them**.

A good orchestrator handles:
- **Task decomposition** — breaking complex goals into agent-sized work units
- **Dependency resolution** — knowing which tasks must complete before others can start
- **Parallel execution** — running independent tasks concurrently
- **Error recovery** — retrying, falling back, or escalating when agents fail
- **Budget management** — tracking token costs and cutting off runaway agents

This is, fundamentally, a distributed systems problem. The same patterns from Kubernetes, Airflow, and workflow engines apply — but adapted for non-deterministic, language-powered compute.

## Lesson 3: Observability Is Non-Negotiable

When a pipeline of 5 agents produces wrong output, you need to know which agent broke and why. This means:

- **Structured logging** for every agent invocation (input, output, latency, token count)
- **Trace IDs** that follow a request through the entire agent chain
- **Cost attribution** per agent, per task, per user
- **Replay capability** — being able to re-run any agent with the exact same inputs

Without observability, debugging agentic workflows is like debugging microservices without distributed tracing. You'll spend more time figuring out what happened than building features.

## Lesson 4: Human-in-the-Loop Is a Feature, Not a Crutch

The best agentic systems aren't fully autonomous. They're **autonomous with guardrails**. Certain decisions should always require human approval:

- Spending above a threshold
- Modifying production infrastructure
- Communicating externally (emails, PRs, messages)
- Irreversible actions (deleting data, publishing content)

Design your orchestrator with first-class support for approval gates. The agent does the work, presents the result, and waits for a human thumbs-up before executing. This isn't a limitation — it's what makes agentic systems trustworthy enough for enterprise adoption.

## Lesson 5: Start With Two Agents, Not Twenty

The temptation is to build a sophisticated multi-agent system from day one. Don't. Start with:

1. **A planner agent** that breaks down tasks
2. **An executor agent** that carries them out

Get this two-agent loop working reliably. Add review agents, specialist agents, and parallel execution only when you have concrete evidence that the two-agent system can't handle your workload. Premature agent proliferation is the agentic equivalent of premature microservice decomposition.

## The Path Forward

Agentic AI isn't a fad — it's the natural evolution of how we build software with LLMs. But getting from toy demos to production systems requires the same engineering discipline we've developed over decades for distributed systems. The teams that bring this discipline to agent orchestration will build the next generation of software infrastructure.
