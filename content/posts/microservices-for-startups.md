---
date: 2025-04-16T04:14:54-08:00
draft: true
params:
  author: Oleg Pustovit
title: "Microservices Are a Tax Your Startup Probably Can’t Afford"
weight: 10
tags:
  - hugo
  - github-pages
  - static-site-generator
  - dev-blog
  - git-workflow
  - caddy
  - reverse-proxy
  - technical-writing
  - theme-customization
---

> Why splitting your codebase too early can quietly destroy your team’s velocity — and what to do instead.

When you are building a startup, the most important thing is an ability to quickly iterate and ship features and value to the end-users. This is where foundational architecture of your startup plays a big role, additionally things like your techincal stack, choice of programming language also adds up to your teams' development velocity. The wrong architecture, especially premature microservices, can substantially hurt the productivity and contribute to missed goals in delivering software.

I've had this experience when working on greenfield projects for early-stage startups, where questionable decisions were made in terms of software architecture that led to having half-finished services, over-engineered and broken local setups, and demoralized teams who struggle maintaining unnecessary complexity.

Let's look into why microservices are the wrong move early on, where they "do" make sense, and how to structure your startup's systems for speed and survival.

## Monoliths Are Not the Enemy

If you're building some SaaS product, even a simple SQL database wrapper eventually may bring a lot of internal complexity in the way your business logic works, additionally you can get to various integrations and background tasks that let transform one set data to another.

With time, sometimes unnecessary features, it's inevitable that your app my grow messy. What good about monolithic application is, they still work. While being a single process, single codebase with internal dependencies, your team can still focus on the most critical things:

- **Staying alive**
- **Delivering customer value**

The biggest advantage of monoliths are their simplicity in the deployment. Generally, such projects are built around existing frameworks — it could be Django for Python, ASP.Net for C#, Nest.js for Node.js apps, etc. When sticking to monolithic architecture, you get the biggest advantage to fancy microservices — a wide support of the open source community and project maintainers who primarily designed those frameworks to work as a single process, monolithic app.

At one real-estate startup I worked with, a small Laravel app that was initially built as a basic dashboard to manage deals by real-estate agents grown into large suite of features that handled managing gigabytes of documents, integrating dozens of third party services while still being a basic PHP-based stack on Apache. The team followed set of best practices Laravel community established, and were quite successful in massively expanding the feature set of application while maintaining the business needs and expectations. The app worked fine without decoupling it into separate services and introducing potentially unnecessary accedental complexity.

People often times point out that it's hard to make monoliths scalable, but it's bad modularization _inside_ the monolith that may bring such problems.

## Where Microservices Go Wrong (Especially Early On)

### 1. Arbitrary Service Boundaries

In theory, you often times see suggestions on splitting the 

In theory, it sounds clean: split your app into "User Service," "Billing Service," "Notifications Service," and so on.

In practice, you often end up with:

- Shared databases
- Cross-service calls for simple workflows
- Coupling disguised as "separation"

At one startup, I watched a team split authentication and user profile management into separate services... then burn months stitching them back together when latency, outages, and coordination costs ballooned.

**Reality:** Business logic doesn't always map neatly to service boundaries. Premature separation creates more fragility than safety.

**Tip:** Wait until operational _or scaling pain_ forces a split — not "architectural elegance."

### 2. Repository and Infrastructure Sprawl

Every new service brings:

- A new repository
- A new CI/CD pipeline
- Separate linting, testing, monitoring setups

For a three-person engineering team, this is brutal. Context switching across repos and tooling becomes a silent tax on every feature you ship.

At one project I advised, keeping all services in a single monorepo with shared utilities, linters, and deploy tooling saved _months_ of friction. The team could focus on shipping, not yak-shaving infra.

**Tip:** Default to a single repo. Delay repo splits until team scaling (not code scaling) demands it.

### 3. Local Development Becomes Painful

If it takes three hours, a custom shell script, and a Docker marathon just to run your app locally, you've already lost velocity.

Early projects often suffer from:

- Missing documentation
- Obsolete dependencies
- OS-specific hacks (hello, Linux-only setups)

I've seen greenfield projects where new engineers spent _days_ wrestling local setups. In some cases, onboarding became "install WSL2," "fix broken Makefiles," "debug weird container sharing bugs."

**Tip:** Make it easy. `git clone && make run` should get you 90% of the way.

### 4. Technology Mismatch

Not every language shines in a microservice architecture.

- **Node.js and Python:** Great for rapid iteration, but managing build artifacts, dependency versions, and runtime consistency across services gets painful fast.
- **Go:** Compiles to static binaries, fast build times, low operational overhead. More natural fit when splitting is truly needed.

At an early-stage SaaS company, switching critical backend services from Python to Go dramatically simplified our CI/CD pipelines and reduced cold start times.

**Tip:** Choose tools that fit your operational reality, not just your team's initial comfort.

### 5. Hidden Complexity: Communication and Monitoring

Microservices introduce an invisible web of needs:

- Service discovery
- API versioning
- Retries, circuit breakers, fallbacks
- Distributed tracing
- Centralized logging and alerting

In a monolith, a bug might be a simple stack trace. In a distributed system, it's "why does service A fail when B’s deployment lags C by 30 seconds?"

**Tip:** Understand that distributed systems _aren't free._ They're a commitment to a whole new class of engineering challenges.

## When Microservices _Do_ Make Sense

There _are_ cases where microservices genuinely help:

- **Workload Isolation:** e.g., an S3-triggered image resizing service, fully self-contained.
- **Divergent Scalability Needs:** e.g., GPU-heavy inference server separate from lightweight web APIs.
- **Different Runtime Requirements:** e.g., a Python-based ML service alongside a Go-based main app.

When the operational realities diverge significantly, it can be cleaner and safer to split.

At one company, we separated heavy data processing cron jobs from the main API server to avoid memory contention and unexpected crashes. It worked because we had a _clear operational boundary_, not because it "looked cleaner."

**Tip:** Services should be split based on **operational boundaries**, not just code organization.

## Practical Guidance for Startups

If you're shipping your first product, here's the playbook I'd recommend:

- **Start monolithic.** Make clean internal separations, but deploy as one unit.
- **Single repo.** Simplifies CI, dependency management, onboarding.
- **Dead-simple local setup.** Make `make run` work. If it takes more, document it.
- **Invest early in CI/CD.** Tests and automation are cheaper early than trying to retrofit stability later.
- **Split surgically.** Only split when you can _prove_ it solves a real, painful scaling problem.

And above all: **optimize for developer velocity.**

Velocity is your startup’s oxygen. Premature microservices leak that oxygen slowly — until one day, you can't breathe.

# Conclusion

Premature microservices are a tax your startup can’t afford. Stay simple. Stay pragmatic. Stay alive.

When you _truly_ outgrow your monolith, you’ll be able to split services with confidence — because you’ll be solving real problems, not imaginary ones.

**Before reaching for microservices, ask yourself: _What's the simplest system that could work today?_**
