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

In theory, you often times see suggestions on splitting the your applications by business logic domain — users service, products service, orders service and so on.
In practice you often end-up with:

- Shared databases
- Cross-service calls for simple workflows
- Coupling disguised as "separation"

At one project, I watched a team separating user, authentication and authorization into separate services which led to deployment complexity and difficulties in service coordination for any API operation they were building. 

In reality, business logic doesn't directly map to service boundaries. Premature separation can make the system more fragile and often times difficult to introduce changes quickly.

A good idea would be identifying scaling bottlenecks and focusing resources on separating them — purely on pragmatic basis, not because it's an "elegant" architectural approach.

### 2. Repository and Infrastructure Sprawl

When working on the application, typically a next set of things is important:

- Code style consisitency (linting)
- testing infrastructure, including integration testing
- local environment configuration
- Documentation
- CI/CD configuration

When dealing with microservices, you need to multiply those requirements by the number of services. If your project is structured as a monorepo, you can simplify your life with having a central CI/CD configuration (when working with GitHub Actions or GitLab CI). Some teams separate microservices into separate repositories which makes way harder to maintain the code consistency and the same set of configurations without extra effort or tools.

For a three-person team, this is brutal. Context switching across repositories and tooling adds up to the development time of every feature that is shipped. 

#### Mitigating issues by using monorepos and single programming language

There are various ways to mitigate this problem. But the biggest important thing is for early project — keeping your code in monorepo. This ensures that there's a single version of code that exists on prod and it's much easier to coordinate code reviews for smaller teams. 

Node.js community has nice tooling for dealing with monorepos. E.g. `nx` — provides various scripts and infrastructure to cache node.js builds and have various utilities that fascilitate code consistency in terms of setting up tests with `jest` and linters. Other one, which I've been using lately — `turbopack`, looks simpler than `nx` but provides a fast way to build and run your code in development mode. Of course, there are disadvantages in those like dealing with large amount of dependencies that some of your microservices introduce and sometimes it gets pretty difficult to reason with which version should each version work.

When developing `go`-based microservices, a good idea early in the development to use a single go workspace with `replace` directive in `go.mod`. Eventually, as the software scales, it's possible to effortlessly separate go modules into separate repositories. 

### 3. Local Development Becomes Painful

If it takes three hours, a custom shell script, and a Docker marathon just to run your app locally, you've already lost velocity.

Early projects often suffer from:

- Missing documentation
- Obsolete dependencies
- OS-specific hacks (hello, Linux-only setups)

In my experience, when I received projects from past development teams, they were often times developed for single operating system. Some devs preferred building on macOS and never bothered supporting their shell scripts on Windows. In my past teams, I had engineers working on windows machines and often times it required rewriting shell scripts or fully understand and reverse engineer the process of getting local environent running. While frustrating in may sound, it teaches a valuable lesson on how important it is to get the damn code running on the laptop.

Other time, I received a microservice-based project fully developed by a single guy who adopted workflow of running docker containers mounted to local file system. Of course, you pay little price for running processes as containers when your computer runs linux. But it brought, a lot of pain in onboarding a front-end developer using an old Windows laptop, who had to run 10 Docker containers to see the UI. This was disgusting. As a quick hack, I had to build a custom node.js based proxy that acted as nginx simply to emulate Docker-based setup with no containers (except databases).

**Tip:** ideally, aim for `git clone <repo> && make up` to have the project running locally. If it's not possible, then maintaining an up-to-date README file with instructions for windows/macOS/linux is a must. Nowadays, there are some programming languages and toolchains that don't work well on Windows (like Ocaml), but modern widely popular stack runs just fine on every widely used operating system, there's no excuse of limiting your local setup to a single operating system, except your laziness.

### 4. Technology Mismatch

Not every language shines in a microservice architecture.

- **Node.js and Python:** Great for rapid iteration, but managing build artifacts, dependency versions, and runtime consistency across services gets painful fast.
- **Go:** Compiles to static binaries, fast build times, low operational overhead. More natural fit when splitting is truly needed.
- **Common Lisp** (adding here just for fun): is pretty uncommon even for building unix-like binaries

It's very important to pick the right technical stack early on. If you look for performance, maybe look for JVM and it's ecosystem and ability to deploy artifacts at scale and run them in microservice-based architectures. If you do very fast iterations and prototype stuff more without worrying about scaling the thing your code/deployment infrastructure — you're good with something like Python.

It's quite often for teams to realise that there are big issues with their choice of technology that wasn't apparent initialy, and they had to pay the price of rebuilding the back-end in a different programming language (like [those guys](https://blog.khanacademy.org/go-services-one-goliath-project/?utm_source=blog.quastor.org&utm_medium=referral&utm_campaign=khan-academy-s-migration-from-python-to-go) were forced to do something about Python 2 codebase and eventually went with Go).

But on contrary, if you really need you can bridge multiple programming languages with protocols like gRPC or async message communication. And it's often the way to go about things. When you get to the point that you want to enrich your feature set with Machine Learning functionality or ETL-based jobs, you would just separately build your ML-based infrastructure in Python, due to its rich ecosystem of domain-specific libraries, that naturally any other programming language lacks. But such decisions should be done when there's enough head count to justify this venture, otherwise the small team will be eternally drawn in endless complexity of bridging multiple software stacks together.

### 5. Hidden Complexity: Communication and Monitoring

Microservices introduce an invisible web of needs:

- Service discovery
- API versioning
- Retries, circuit breakers, fallbacks
- Distributed tracing
- Centralized logging and alerting

In a monolith, a bug might be a simple stack trace. In a distributed system, it's "why does service A fail when B’s deployment lags C by 30 seconds?" 
You would have to thoughroughly invest into your observability stack. To do it "properly", it requires instrumenting your applications in specific ways, e.g. integrating OpenTelemetry to support tracing, or rely on your cloud provider's tools like AWS XRay if you go with complex serverless system. But at this point, you have to completely shift your focus from application code towards building complex monitoring infrastructure that would track whether your microservice architecture **actually works** on production.

Of course some of the observability instrumentation is needed to be performed on monolith apps, but it's way simpler than doing that in terms of number of services in a consistent way.

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
