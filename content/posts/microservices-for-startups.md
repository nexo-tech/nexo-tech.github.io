---
date: 2025-05-01T04:14:54-08:00
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

When you are building a startup, the most important thing is an ability to quickly iterate and ship features and value to the end-users. This is where the foundational architecture of your startup plays a big role; additionally, things like your technical stack and choice of programming language also add up to your team’s development velocity. The wrong architecture, especially premature microservices, can substantially hurt productivity and contribute to missed goals in delivering software.

I've had this experience when working on greenfield projects for early-stage startups, where questionable decisions were made in terms of software architecture that led to having half-finished services, over-engineered and broken local setups, and demoralized teams who struggle maintaining unnecessary complexity.

Let's look into why microservices are the wrong move early on, where they "do" make sense, and how to structure your startup's systems for speed and survival.

## Monoliths Are Not the Enemy

If you're building some SaaS product, even a simple SQL database wrapper eventually may bring a lot of internal complexity in the way your business logic works; additionally, you can get to various integrations and background tasks that let transform one set of data to another.

With time, sometimes unnecessary features, it's inevitable that your app may grow messy. What good about monolithic applications is that they still work. While being a single process and single codebase with internal dependencies, your team can still focus on the most critical things:

- **Staying alive**
- **Delivering customer value**

The biggest advantage of monoliths is their simplicity in deployment. Generally, such projects are built around existing frameworks — it could be Django for Python, ASP.Net for C#, Nest.js for Node.js apps, etc. When sticking to monolithic architecture, you get the biggest advantage over fancy microservices — a wide support of the open source community and project maintainers who primarily designed those frameworks to work as a single process, monolithic app.

At one real-estate startup I worked with, a small Laravel app that was initially built as a basic dashboard to manage deals by real-estate agents grew into a large suite of features that handled managing gigabytes of documents, integrating dozens of third-party services while still being a basic PHP-based stack on Apache. The team followed the set of best practices the Laravel community established, and were quite successful in massively expanding the feature set of the application while maintaining the business needs and expectations. The app worked fine without decoupling it into separate services and introducing potentially unnecessary accidental complexity.

People often point out that it's hard to make monoliths scalable, but it's bad modularization _inside_ the monolith that may bring such problems.

## Where Microservices Go Wrong (Especially Early On)

### 1. Arbitrary Service Boundaries

In theory, you often see suggestions on splitting your applications by business logic domain — users service, products service, orders service, and so on.
In practice, you often end up with:

- Shared databases
- Cross-service calls for simple workflows
- Coupling disguised as "separation"

At one project, I watched a team separating user, authentication, and authorization into separate services, which led to deployment complexity and difficulties in service coordination for any API operation they were building.

In reality, business logic doesn't directly map to service boundaries. Premature separation can make the system more fragile and often times difficult to introduce changes quickly.

A good idea would be identifying scaling bottlenecks and focusing resources on separating them — purely on a pragmatic basis, not because it's an "elegant" architectural approach.

### 2. Repository and Infrastructure Sprawl

When working on the application, typically a next set of things is important:

- Code style consistency (linting)
- Testing infrastructure, including integration testing
- Local environment configuration
- Documentation
- CI/CD configuration

When dealing with microservices, you need to multiply those requirements by the number of services. If your project is structured as a monorepo, you can simplify your life by having a central CI/CD configuration (when working with GitHub Actions or GitLab CI). Some teams separate microservices into separate repositories, which makes it way harder to maintain the code consistency and the same set of configurations without extra effort or tools.

For a three-person team, this is brutal. Context switching across repositories and tooling adds up to the development time of every feature that is shipped.

#### Mitigating issues by using monorepos and a single programming language

There are various ways to mitigate this problem. But the biggest important thing is for an early project — keeping your code in a monorepo. This ensures that there's a single version of code that exists on prod, and it's much easier to coordinate code reviews for smaller teams.

Node.js community has nice tooling for dealing with monorepos. E.g. `nx` — provides various scripts and infrastructure to cache Node.js builds and has various utilities that facilitate code consistency in terms of setting up tests with `jest` and linters. Another one, which I've been using lately — `turbopack`, looks simpler than `nx` but provides a fast way to build and run your code in development mode. Of course, there are disadvantages in those, like dealing with a large amount of dependencies that some of your microservices introduce, and sometimes it gets pretty difficult to reason with which version should each version work.

When developing `go`-based microservices, a good idea early in the development is to use a single ` go` workspace with the `replace` directive in `go.mod`. Eventually, as the software scales, it's possible to effortlessly separate ` go` modules into separate repositories.

### 3. Local Development Becomes Painful

If it takes three hours, a custom shell script, and a Docker marathon just to run your app locally, you've already lost velocity.

Early projects often suffer from:

- Missing documentation
- Obsolete dependencies
- OS-specific hacks (hello, Linux-only setups)

In my experience, when I received projects from past development teams, they were often developed for a single operating system. Some devs preferred building on macOS and never bothered supporting their shell scripts on Windows. In my past teams, I had engineers working on Windows machines, and often it required rewriting shell scripts or fully understanding and reverse engineering the process of getting the local environment running. While frustrating in many ways, it teaches a valuable lesson on how important it is to get the damn code running on the laptop.

Other time, I received a microservice-based project fully developed by a single guy who adopted the workflow of running Docker containers mounted to a local file system. Of course, you pay a little price for running processes as containers when your computer runs Linux. But it brought a lot of pain in onboarding a front-end developer using an old Windows laptop, who had to run 10 Docker containers to see the UI. This was disgusting. As a quick hack, I had to build a custom Node.js-based proxy that acted as an Nginx simply to emulate a Docker-based setup with no containers (except databases).

**Tip:** Ideally, aim for `git clone <repo> && make up` to have the project running locally. If it's not possible, then maintaining an up-to-date README file with instructions for Windows/macOS/Linux is a must. Nowadays, there are some programming languages and toolchains that don't work well on Windows (like OCaml), but the modern widely popular stack runs just fine on every widely used operating system; there's no excuse for limiting your local setup to a single operating system, except for your laziness.

### 4. Technology Mismatch

Not every language shines in a microservice architecture.

- **Node.js and Python:** Great for rapid iteration, but managing build artifacts, dependency versions, and runtime consistency across services gets painful fast.
- **Go:** Compiles to static binaries, fast build times, and low operational overhead. More natural fit when splitting is truly needed.
- **Common Lisp** (adding here just for fun): is pretty uncommon even for building Unix-like binaries.

It's very important to pick the right technical stack early on. If you look for performance, maybe look for the JVM and its ecosystem and ability to deploy artifacts at scale and run them in microservice-based architectures. If you do very fast iterations and prototype stuff more without worrying about scaling the thing your code/deployment infrastructure — you're good with something like Python.

It's quite often for teams to realise that there are big issues with their choice of technology that wasn't apparent initially, and they had to pay the price of rebuilding the back-end in a different programming language (like [those guys](https://blog.khanacademy.org/go-services-one-goliath-project/?utm_source=blog.quastor.org&utm_medium=referral&utm_campaign=khan-academy-s-migration-from-python-to-go) were forced to do something about Python 2 codebase and eventually went with Go).

But on the contrary, if you really need to, you can bridge multiple programming languages with protocols like gRPC or async message communication. And it's often the way to go about things. When you get to the point that you want to enrich your feature set with Machine Learning functionality or ETL-based jobs, you would just separately build your ML-based infrastructure in Python, due to its rich ecosystem of domain-specific libraries, that naturally any other programming language lacks. But such decisions should be made when there's enough head count to justify this venture; otherwise, the small team will be eternally drawn into the endless complexity of bridging multiple software stacks together.

### 5. Hidden Complexity: Communication and Monitoring

Microservices introduce an invisible web of needs:

- Service discovery
- API versioning
- Retries, circuit breakers, fallbacks
- Distributed tracing
- Centralized logging and alerting

In a monolith, a bug might be a simple stack trace. In a distributed system, it's "why does service A fail when B’s deployment lags C by 30 seconds?"
You would have to thoroughly invest in your observability stack. To do it "properly", it requires instrumenting your applications in specific ways, e.g. integrating OpenTelemetry to support tracing, or relying on your cloud provider's tools like AWS XRay if you go with a complex serverless system. But at this point, you have to completely shift your focus from application code towards building complex monitoring infrastructure that would track whether your microservice architecture **actually works** in production.

Of course, some of the observability instrumentation is needed to be performed on monolith apps, but it's way simpler than doing that in terms of the number of services in a consistent way.

**Tip:** Understand that distributed systems _aren't free._ They're a commitment to a whole new class of engineering challenges.

## When Microservices _Do_ Make Sense

Despite the mentioned difficulties with microservices, there are times where service-level decoupling actually is very beneficial. There are cases where it definitely helps:

- **Workload Isolation**: a common example for that would be in AWS best practices on using S3 event notifications — when an image gets loaded to S3, trigger an image resizing/OCR process, etc. Why it is useful: we can decouple obscure data processing libraries in a self-isolated service and make it API focus solely on image processing and data output based on the input. Your upstream clients that upload data to S3 aren't coupled with this service, and there's less overhead in instrumenting such a service because of its relative simplicity.
- **Divergent Scalability Needs**

  There _are_ cases where microservices genuinely help:

- **Workload Isolation:** e.g., an S3-triggered image resizing service, fully self-contained.
- **Divergent Scalability Needs:** — Imagine you are building an AI product. One part of the system (**web API**) that triggers ML workloads and shows past results isn't resource intensive, it's lightweight, because it interacts mostly with the database. On the contrary, ML model runs on GPUs is actually heavy to run and requires special machines with GPU support with additional configuration. By splitting these parts of the application into separate services running on different machines, you can scale them independently.
- **Different Runtime Requirements:** — Let’s say you've got some legacy part of code written in C++. You have 2 choices — magically convert it to your core programming language or find ways to integrate it with a codebase. Depending on the complexity of that legacy app, you would have to write glue code, implementing additional networking/protocols to establish interactions with that service, but the bottom line is — you will likely have to separate this app as a separate service due to runtime incompatibilities. I would say even more, you could write your main app in C++ as well, but because of different compiler configurations and library dependencies, you wouldn't be able to easily compile things together as a single binary.

At one project, that also happens to be a real-estate one, we had code from a previous team that runs Python-based analytics workloads that loads data into MS-SQL db, we found that it would be a waste to build on top of it a Django app. The code had different runtime dependencies and was pretty self-isolated, so we just kept it as a separate thing and came back to it when something broke. This worked for us even for a small team, because this analytics generation service was a part that required rare changes or maintenance.

**Tip:** Services should be split based on **operational boundaries**, not just code organization.

## Practical Guidance for Startups

If you're shipping your first product, here's the playbook I'd recommend:

- **Start monolithic.** Pick a common framework and focus on getting the features done. All known frameworks are more than good enough to build some API or website and serve the users. Don't follow the hype, stick to the boring way of doing things; you can thank yourself later.
- **Single repo.** Don't bother splitting your code into multiple repositories. I had cases when developers separated some code into a repository that acted as a library for a core project. But there wasn’t an apparent reason for doing so; there was only one piece of code that consumed that library, but that added to operational complexity in the codebase.
- **Dead-simple local setup.** Make `make up` work. If it takes more, be very specific on the steps, record a video/Loom, and add screenshots. If your code is going to be run by an intern or junior dev, they'll likely hit a roadblock, and you would have to spend time explaining how to troubleshoot an issue. I found that documenting every possible issue for every operating system eliminates time spent clarifying why certain things in a local setup didn't work.
- **Invest early in CI/CD.** Even if it's a simple HTML that you could just copy onto your FTP server, you could automate this and rely on source control with CI/CD to do it. When the setup is properly automated, you just forget about your continuous integration infrastructure and focus on features. I've seen many teams and founders when working with outsourced teams often be cheap on CI/CD, and that results in the team being demoralized and annoyed by manual deployment processes.
- **Split surgically.** Only split when you can _prove_ it solves a real, painful scaling problem. Use your energy on improving modularity and testability of your codebase, rather than solving unnecessary complicated problems.

And above all: **optimize for developer velocity.**

Velocity is your startup’s oxygen. Premature microservices leak that oxygen slowly — until one day, you can't breathe.

## If you go with a microservice-based approach

I had micro-service-based projects created earlier than they should have been done, and here are the next recommendations that I could give on that:

- Evaluate your technical stack that powers your micro-service-based architecture. Invest in developer experience tooling. When you have service-based separation, you now need to think about automating your microservice stack, automatic configuration in production deployment, and locally. In certain projects, I had to build a separate CLI that does administrative tasks on the monorepository. One project I had contained 15-20 microservice deployments, and for the local environment, I had to create a code generator for `docker compose` files to achieve seamless one-command start-up for the regular developer.
- Focus on reliable communication protocols around service communication. If it's async messaging, make sure your message schemas are consistent and standardized. If it's REST, focus on OpenAPI documentation. Inter-service communication clients must implement many things that don't come out-of-the-box: retries with exponential backoff, timeouts. A typical bare-bones gRPC client requires you to manually factor those additional things to make sure you don't suffer from transient errors.
- Ensure that your unit, integration testing, and end-to-end testing setup is stable and scales with the amount of service-level separations you introduce into your codebase.
- On smaller projects that use micro-service-based workloads, you would likely default to a shared library with common helpers for instrumenting your observability, communication code in a consistent way. An important consideration here — keep your shared library as small as possible. Any substantial change inside it would require you to recompile each and every service that depends on that shared library.
- Look into observability earlier on. Add structured-JSON logs and create various correlation IDs for debugging things once your app is deployed. Even basic helpers that output rich logging information (until you instrumented your app with proper logging/tracing facilities) often save time figuring out flaky user flows.

To summarize: if you're still going for microservices, you should beforehand understand the tax you're going to pay in terms of additional development time and maintenance to make the setup workable for every engineer in your team.

# Conclusion

Premature microservices are a tax your startup can’t afford. Stay simple. Stay pragmatic. Stay alive. When you _truly_ outgrow your monolith, you’ll be able to split services with confidence — because you’ll be solving real problems, not imaginary ones.

**Before reaching for microservices, ask yourself: _What's the simplest system that could work today?_**
