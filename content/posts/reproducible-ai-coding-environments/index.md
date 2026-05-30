---
date: 2026-05-30T12:00:00.000Z
draft: true
params:
  author: Oleg Pustovit
title: "I Wanted Reproducible AI Coding Environments, So I Built agentpack"
weight: 10
tags:
  - ai-agents
  - claude-code
  - codex
  - cursor
  - mcp
  - cli
  - developer-tools
  - agentpack
  - nix
---

> Modern agents like Claude Code, Codex, Cursor and OpenCode need skills, hooks and MCPs, but they load them differently. I made a tool that creates an ephemeral staging configuration that loads into coding agents without polluting the global user or project configuration. [GitHub Link](https://github.com/OlegHQ/agentpack)

I've been using AI agents for building commercial software—it’s incredibly useful for creating quick prototypes and iterating on products for early-stage startups. Data analysis, triaging production issues, even undoing decisions that previously would take tremendous effort—like changing the programming language your project is written in—became essentially cheap. Before, writing CLIs/scripts custom to your needs required days of work; now they can be built in minutes, and that allows you to focus on problems that are meaningful to you.

## The harness is the new bottleneck

Of course, autonomous coding workflows are still a long way from being perfect. These systems cannot reliably produce high-quality code—even frontier models fail at making custom abstractions and generating maintainable code unless you prompt them correctly. What makes the situation worse is that there's no single tool that is excellent at every software engineering problem; instead we have a number of competing agent harnesses that implement essentially the same agent loop: Claude Code, OpenCode, Codex, Copilot, Cursor, etc., where you often find yourself restricted to a set of specific models and lacking the features to configure the agent flexibly. On top of that, those CLI agents manage context differently, which often results in different coding performance for the same models. Configuration is still not standardized: skills are more or less standard, but hooks and custom rules are each implemented in their own way. Claude Code and Cursor also have plugin systems, but they are not fully interchangeable. When working with teams on startups, I often see a repository fully optimized for Claude Code, while using it with Codex requires hacking with symlinks or committing my own harness-specific configs to the team’s repository.

### Every agent needs its own configuration

To this day, I’m using Claude Code as my daily driver. I know the flaws of the Opus model—it makes average code, may miss important things, gaslights itself, and ultimately makes wrong decisions, which makes it infeasible to run on autopilot. Nevertheless, it’s a good enough model for me. For speed, I use Cursor Agent with the Composer model through the `agent` CLI. It gets the job done for quick refactors, solving merge conflicts, and other light work. At the same time, I would never trust even the latest Composer to build anything serious; it’s simply not there. Anything complex I throw at Codex (GPT 5.5) with Playwright MCP connected, and magically it can figure out even the most complex issues. Gemini 3.5 Flash recently arrived with the Antigravity CLI; the harness is very rough and lacking, but the model seems very smart on a small set of non-trivial issues. So I end up with a problem of having 3-4 CLI agents working on the same codebase, and I would like to share a set of skills and slash commands across all of them. Harnesses like Claude Code have their own marketplace with toggleable plugins, but those are specific to Claude and don’t work well with immutable configs like Nix Home-Manager, so the overall agentic AI tooling feels brittle. 

## agentpack: an ephemeral configuration layer for agents

### The basic idea

[insert ASCII video doing it]

To keep myself sane with complicated agent configs and new agentic harnesses that are constantly coming out, I’ve built a prototype package manager/virtual environment tool that allows me to quickly compose a new configuration from any skill I find on GitHub or quickly create a new plugin that contains a domain-specific set of skills that could be turned on or off on demand. 

I know there are quite a few package managers for agents, but for me they lack 2 things: simplicity and isolation. Some package managers are Claude Code specific and rely on marketplace registries, others are doing symlinking into the project directory. Honestly, I find a folder with markdown files being called a package to be an overstatement. While I’m aware of GitHub’s problem with uptime, I still find loading those skill files from GitHub simple and easy (similar to how we add packages in Go):

[insert example of inserting Go-like package]

### Using GitHub as the registry

Other times, I would not be bothered with checking README.md but can navigate some directory of skills. So you can just copy a GitHub URL with a skill and the CLI will load it properly into the staging directory. Simple:

[Simple example of loading the config]

### Design constraints

A design decision that was critical for me: portability, reusability of configuration. The `agentpack` idea is to never copy assets to the project directory or the global user configuration in folders like `~/.cursor` or `~/.claude`. 

The solution was to create an ephemeral staging directory and pass it to the launch arguments of the agentic harness, or use environment variables to do so. Unfortunately, this has been very challenging to fully support. I had to use agents to reverse engineer bundled JavaScript code to understand how to get around the limitations of certain harnesses. E.g. rules are only supported by Cursor, so I had to generate a fallback skill that would load into harnesses like Codex or Claude Code. The Cursor CLI has undocumented bugs that were only possible to find by reversing what it is doing: for some reason, it only loads sub-agents from the project-local `.cursor/agents` directory and ignores the global `$HOME/.cursor/agents` dir (which may already be fixed, hopefully). So in the current state of things, I’ve made the best possible approximation of the ideal “package manager” for agent CLIs, with the hope that things will either get standardized or at least that the major CLIs will agree on additive loading of extra configs. 

#### A shared manifest file and lockfile

To keep track of the loaded projects, I store two files that are typically committed to source control:

* agentpack.toml — this lists dependencies, configuration, and modes (I’ll come back to this later)
* pack.lock — writes down commit hashes of all loaded repositories with the appropriate dependencies.

#### Workspaces for client repositories as a workaround

In my consulting work, of course, I don’t want to commit obscure manifest files of some unknown tool to teams’ repositories, so I create a parent `<project-name>-workspace/<project-repo>` directory structure, where I init the `agentpack` config in the workspace directory. Running `agentpack sync` will reload all the dependencies and fetch the necessary repositories from GitHub. Fetched repositories are cached in the user-wide home directory and pulled from there on repeated reads of `owner/repo/path/commit` to eliminate the need to fetch the same repository multiple times.

### Modes: switching the agent’s working context

Having a fully dynamic configurator allows me to define modes (a list of toggles for whether certain skills are available in a given mode). In a full-stack Python & React.js monorepo, I want to toggle Python-specific skills off for a front-end-heavy refactoring job and maybe add additional granular frontend-specific rules and guidance for that. With a dedicated TUI and pre-configured modes in the `agentpack.toml` manifest, it becomes easy to do.

#### Why modes matter in real projects

On one project that required heavy math calculations, frontend UX work, and database exploration in the same repository, this was very useful to have. 

### Hooks as an intermediate representation

#### Claude Code’s hooks.json as the canonical hook model

For hooks emulation, I chose to base the configuration on Claude Code’s lifecycle events (PreToolUse, PostToolUse, UserPromptSubmit, Stop, etc.) and tool matches (for Edit and Grep). Other CLIs support fewer events and handler types. 

Claude’s model is treated as the canonical intermediate representation that gets mapped to each agent harness format. Features that are not natively supported by the target CLI get emulated through subcommand `agentpack hook-exec`.

This gives a lot of advantages when running setups where you redirect agents from standard tools to a custom MCP server (e.g. jCodeMunch MCP for better retrieval). 

[show diagram]

### Compatibility matrix

As of this date, I created the following compatibility matrix. Harnesses like Codex, OpenCode, and Claude Code were the most important to me, so I focused more on them. 

[compat matrix table here]

### Try it

```bash
agentpack init                      # stub agentpack.toml + v2 pack.lock
agentpack add github.com/anthropics/skills/skills/canvas-design
agentpack claude 
```

`agentpack` is a quick, vibe-coded prototype and serves more as a pitch for an idea. I don’t think we need complex package managers with dedicated registries just to download a couple of Markdown files from public sources. I built it for my own needs: it lets me pull in my commonly used skills and MCPs without polluting the original repo, while keeping agent configurations organized. It’s been essential to my workflow for the last two months, and I thought it would be a good idea to contribute it to the community of anyone who uses agents heavily in their work.


 


