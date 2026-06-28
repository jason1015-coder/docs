---
title: "NanoOS"
description: "A whitepaper for an open source agent orchestration CLI that lets a user compose an oracle agent, specialist sub-agents, skill packs, and custom tools into a personal operating system of agents"
sidebar_order: 3
proposer: "Will Lamerton"
proposer_github: "will-lamerton"
status: "In public review"
review_opens: "2026-05-20"
review_closes: "2026-07-01"
---

# NanoOS

Most people who work with AI today still treat it as a single chat window. One model, one context, one conversation at a time. The interesting work is happening one layer up, where multiple agents coordinate, delegate, and call tools on a user's behalf. That layer is real, it is moving fast, and it is currently owned by a small number of closed platforms and bespoke frameworks.

This whitepaper proposes a project to build that layer in the open: a local-first CLI that lets a user stand up an oracle agent, attach specialist sub-agents and custom tools to it, and grow that arrangement, over time, into something that runs across their personal and working life.

The "OS" framing is deliberate. The point is not to write a literal operating system. The point is to give a user the same kind of compositional substrate for agents that an operating system gives for processes: a place to run them, a way to address them, a permission model, a shared notion of memory, and a contract for how new ones plug in.

The document is published in working form so the collective can argue the shape of it before code lands. Naming, scope, and the design decisions below were open when the whitepaper merged and have been settled during the public review window (recorded under "Resolved in review" near the bottom of this page).

## Problem

The agent layer is where the next round of useful work happens, and it is currently shaped by tools whose incentives are not the user's.

A user who wants more than a single chat today has a small set of options:

1. **Closed platforms with proprietary agent layers.** Custom GPTs, Claude Projects, vendor specific agent runners. The platform owns the orchestration, the memory, the tool layer, and the data. The user is a tenant.
2. **Heavyweight frameworks aimed at developers.** LangGraph, CrewAI, AutoGen, and similar. Powerful, but the audience is people building agent products for other people, not people running agents for themselves. The setup cost is high and the abstractions assume a developer's mental model.
3. **Per project agent scripts.** Glue code, shell pipelines, hand rolled prompts. Works for one task, does not compose, does not survive a refactor.

None of these gives an individual a stable, composable place to live their agent workflows in. There is no shared substrate where a user can say "here is my oracle, here are the specialists it can call, here are the tools each of them is allowed to use, and here is what I want them to remember across all of it." That gap is what this project exists to close.

The need is sharper for the kind of users the Nano Collective already builds for. Someone running a local coding agent, a handful of utilities for cleaning and shaping content, and a local model via Ollama or LM Studio already has the components of an agent stack on their machine. What they are missing is the substrate that ties those components together without locking them into someone else's platform.

## Intended audience

The audience question, as in the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) whitepaper, comes before scope.

Candidates, with honest assessment of each:

- **Power users who want personal automation.** People who already use AI heavily and want it to compose: an email triage agent that hands off to a calendar agent that hands off to a drafting agent. Realistic primary audience. Existing tools serve them badly because the tools are built for app developers, not for them.
- **Developers building multi agent products.** Already served by LangGraph and similar. NanoOS would have to win on local-first, openness, and ergonomics, not on capability ceiling. Possible secondary audience, not the right primary.
- **Teams running shared internal automations.** Wants role based access, audit trails, deployment to shared infrastructure. Out of scope for v1 by a wide margin, but a plausible direction if the single user shape lands first.
- **Researchers building agent topologies for evaluation.** A clean, scriptable substrate has real value here. Small audience, but technically aligned with the project's shape. Likely a downstream consumer rather than a target.

Picking the audience changes the v1 surface area. A power user runner needs ergonomic install, clear defaults, and a few specialist sub-agents that work out of the box. A developer framework needs a wider API and a less opinionated default set. v1 cannot do both well.

## Principles

The three values that govern every Nano Collective project apply, with two carrying particular weight for this project:

- **Privacy-respecting.** The oracle and its sub-agents see whatever the user routes through them: messages, files, tool results, intermediate state. That data must stay on the user's machine by default, and the project must be honest about every point at which a sub-agent or tool sends anything outward.
- **Local-first.** Agent orchestration is one of the workloads where the temptation to reach for a cloud model is strongest, because the orchestrator often does the most "reasoning" of any component. The project must make local models a first class path, not a degraded fallback. Cloud calls are allowed where capability requires, and should compose with the sibling privacy projects when used.
- **Open for all.** Full source open. The orchestration protocol, the sub-agent contract, the tool contract, all documented. Anyone can write a sub-agent or a tool that plugs in. Anyone can replace the oracle with their own.

A fourth principle, specific to this project, is worth naming:

- **Composable, not monolithic.** NanoOS is a substrate, not an everything app. Sub-agents are independent projects. Skills are independent capability packs. Tools are independent projects. NanoOS earns its place by orchestrating well, not by absorbing the rest of the stack. Contributed pieces meet at the substrate's contracts (sub-agent, skill, tool) and compose without per project coordination.

## Threat model

An agent substrate is a privacy surface in its own right. The threat model names what NanoOS does and does not defend against in v1:

**The user's data leaking to cloud models via sub-agents.**
Out of scope for the substrate itself. Mitigated by routing relevant sub-agents through the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) and the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber). NanoOS does not duplicate their work; it makes their use clean.

**A malicious or buggy sub-agent reading more than it should.**
In scope. The permission model has to be real, not advisory. A sub-agent that needs filesystem access should declare it; the oracle should mediate it; the user should see what was read. See "Permissions and capabilities" below.

**A malicious or buggy tool exfiltrating data.**
In scope. Tools run with declared scopes (network, filesystem, secrets, model access). A tool that asks for more than its declared scope cannot run.

**A compromised oracle.**
Partial. If the oracle process is itself compromised, everything downstream is too. The same caveat applies to any OS kernel. Hardening the oracle process and keeping its surface small is the answer; we do not pretend the substrate can defend against arbitrary local malware.

**A network observer reading agent traffic.**
Out of scope for the substrate. The proxy already handles this for the cloud leg. Intra agent traffic stays on the user's machine in v1.

**A state level adversary with legal compulsion over a sub-agent author.**
Not a goal of v1. Worth naming as out of scope until proven otherwise.

The threat model lives alongside the project once it ships and evolves as the design firms up.

## Proposed approach

Four primitives. Everything else composes out of them.

### The oracle

The oracle is the top level agent in a NanoOS arrangement. The user speaks to it. It holds the conversation, the working memory, and the routing logic. When a request comes in, the oracle decides: do I answer this directly, or do I hand it off to a sub-agent that is better placed to do so?

The oracle is configurable in four places:

- **Model.** Multi-provider by design, on the same shape the collective's existing tools already ship. Any chat completion compatible model the user can reach: local runtimes (Ollama, LM Studio, llama.cpp, MLX) and cloud providers (OpenAI, Anthropic, OpenRouter, others) sit behind a pluggable adapter. Local is the default, but the project is under no illusion that local quality on common consumer hardware is sufficient for every oracle workflow today. Cloud is a first class path, not a hidden one, and users should expect to reach for it where the work genuinely demands it. The proxy and scrubber compose cleanly on the cloud path.
- **Sub-agents.** A declared list of specialist agents the oracle is allowed to call, with a description of what each does. The description is what the oracle reads when deciding whether to delegate.
- **Skills.** A declared list of skills the oracle has access to. Each skill is a capability pack (see below) that adds a group of tools to the oracle's toolkit in one line, instead of the oracle having to name every tool individually. Skills are the unit of capability reuse across an arrangement.
- **Tools.** A declared list of bare tools the oracle can call directly, separately from any skill or sub-agent. Used for short, local, single step actions that do not warrant invoking a whole sub-agent and are not naturally grouped with anything else.

The oracle is intentionally thin. It is a router, a conversation owner, and a memory holder, not a do everything agent. The interesting capability lives in the sub-agents, the skills, and the tools, not in the oracle's prompt.

### Sub-agents

A sub-agent is anything that satisfies the sub-agent contract: it accepts a structured request, it does work, it returns a structured response, and it declares what skills, tools, and resources it needs to do its job. The skills and tools fields work the same way they do for the oracle. A sub-agent that lists `skills: [k8s, observability]` and `tools: [some_one_off]` runs with the union of those skills' tool sets plus the named tool.

A sub-agent can be:

- **A bundled NanoOS sub-agent.** Default specialists shipped with the project (an email drafter, a calendar manager, a file organiser; the list in v1 is empty by design, see the [resolved review note on bundled sub-agents](#resolved-in-review)).
- **An existing agent the user already runs.** Any standalone agent (a coding agent, a writing assistant, anything that satisfies the contract) can be wrapped as a sub-agent and delegated to from the oracle.
- **A third party agent.** Anything that conforms to the contract. The contract is small enough that wrapping an existing agent is a thin shim, not a port.
- **Another NanoOS instance.** A sub-agent can itself be an oracle with its own sub-agents under it. Recursive composition is a first class shape, not an accident. A user might run a "work" oracle and a "personal" oracle and have a top level oracle delegate to either.

Recursion is the part of the design that earns the "OS" framing. A user does not have to flatten their mental model of their work into a single agent's prompt. They can mirror the structure of their life: an oracle for personal admin, sub-agents under it for finance, calendar, household; an oracle for work, sub-agents under it for coding, comms, research; a top level oracle that knows which side of life a request belongs to. Each layer is a NanoOS arrangement. The substrate is the same all the way down.

The depth has to be bounded in practice. Cost and latency both compound with recursion. Sensible defaults (warnings past a depth, hard caps configurable per arrangement) are part of the v1 surface, not a polish item.

### Tools

A tool is a single purpose action with a declared input shape, output shape, and capability scope. Tools are the leaves of the call tree.

Tools are intentionally not agents. A tool does not have a model. A tool runs a function. Examples of the shape tools take (none ship in the v1 box — see the [resolved review note on bundled tools](#resolved-in-review)):

- File read and write within a declared root.
- HTTP fetch through the privacy stack where configured.
- Shell command execution with an allowlist.
- Calendar, email, and similar OS level integrations (where the user opts in).
- Calls to other Nano Collective utilities (get-md, json-up) where they fit the tool shape.

The tool contract is small enough that any user can write one. Tool authors declare what their tool needs (network, filesystem paths, environment variables); the user grants or denies; the oracle and sub-agents see only the tools the user has granted to them.

### Skills

A skill is a reusable capability pack: a set of tools grouped together by purpose, behind one manifest. A skill has no identity of its own. It is not an agent. It is a unit of capability that an oracle or a sub-agent attaches to itself in one line.

Concretely, a skill bundles:

- A set of tools that belong together. A `k8s` skill might ship `k8s_pods`, `k8s_logs`, and `k8s_describe`. A `content-tools` skill might ship a drafting tool, a content calendar tool, and a posting tool.
- A short description so an agent knows what the skill is for.
- Optionally, a slash command or two that compose with the tools.
- Optionally, an event subscription that lets a tool in the skill respond to runtime events directly without an agent in the loop.

An oracle or a sub-agent declares the skills it has access to by name (`skills: [k8s, observability, incident-response]`). At execution time, the agent's effective tool list is the union of every tool from every skill it lists, plus any bare tools it has named individually. The same skill attaches to many agents. One agent composes many skills. That orthogonality is what makes the arrangement scale.

The reason this matters is that a single user agent in a real arrangement can need fifteen or twenty tools across three or four logical groups. Listing each tool by name on the agent flattens that structure into a wall of names. Listing skills preserves it. The coding sub-agent says `skills: [code-review, test-runner, git]`, not a list of every lint, format, and test tool it depends on.

Why not collapse skills into sub-agents? Because a sub-agent is an identity (a system prompt, a model, a job) and a skill is a capability (a set of tools). Different sub-agents reuse the same skill. One skill should not be welded to one sub-agent's identity. Keeping them orthogonal is what lets the coding sub-agent and the research sub-agent both attach the same `git` skill without each redefining what is inside it.

A skill is also the natural unit for sharing. The bundle is a directory plus a manifest; "install a skill" is a `cp -r` into the user's config and a manifest validation, nothing more. A community catalogue, when one exists, is a packaging problem on top of an existing format.

### The execution model

A request flows like this:

1. The user sends a message to the oracle.
2. The oracle reasons over its sub-agent list and its tool list. It either answers directly, calls a tool, or invokes a sub-agent with a structured request.
3. A sub-agent, once invoked, runs its own loop: its own model, its own tool list, its own sub-agents if recursion is in play. It returns a structured response to the oracle.
4. The oracle integrates the response into the conversation and either replies to the user or continues delegating.

This is not novel. The novel parts are the locality, the openness, and the composability. The substrate is the same whether the oracle and all sub-agents are local Llama variants, or a mix of local and cloud, or a recursive tree where some branches are local only and others reach out through the proxy.

### Memory and state

A NanoOS arrangement needs memory in several shapes:

- **Conversation memory.** The oracle holds the current conversation. Per arrangement, persisted locally between runs.
- **Per agent memory.** A sub-agent that runs repeatedly across sessions (a coding agent, an email triager) needs its own memory for the things it learns about the user's preferences, projects, contacts. This is the shape Claude Code's `CLAUDE.md` and similar files already hint at; NanoOS should make it first class.
- **Shared memory, scoped.** Some facts (the user's name, time zone, preferred language) are useful across the whole arrangement. A shared memory layer that the oracle owns and sub-agents read from, with explicit scope, is the natural shape. Writes from sub-agents should be mediated and reviewable.

Memory lives on disk in plain, inspectable files. The user can read it, edit it, delete it, version control it. A privacy substrate that hides what it remembers about its user would be a contradiction.

### Permissions and capabilities

Sub-agents and tools declare what they need; the user grants what they get. The grant is scoped to an arrangement, persisted, and revocable. Two patterns ship together in v1:

- **Declared capabilities at registration time.** A sub-agent declares "I need filesystem read on `~/Documents/work` and network access through the proxy." The user accepts on first registration and the grant is remembered.
- **Just in time prompts for sensitive actions.** Anything that touches secrets, modifies state outside a sandbox, or sends data outward triggers a prompt unless explicitly pre-approved by the user.

The unit of grant in v1 is the **skill**: attaching a skill grants all of its tools at once. Dangerous tools inside a skill (network calls, shell execution, file writes outside the working root) still trigger per-use prompts regardless of the grant, so the user gets the ergonomics of "I attached the k8s skill" without losing the safety net on the actions that actually matter. See the [resolved review note on the permissions UX](#resolved-in-review) for the rationale.

## A worked example: an indie developer's daily driver

The shape of the design lands better against a concrete arrangement than against the abstract primitives alone. The example below is the arrangement an indie developer ends up with after a few weeks of using NanoOS as the front door to their working day. It is a small arrangement on purpose; the design is supposed to stay legible as it grows, and the growth story is easier to follow from a small one.

### The arrangement

The user runs a single top level oracle from their terminal. Through conversation with the oracle, they describe what they tend to do in a day (read something on the web, work in a few repos, keep notes), and the oracle helps them install the sub-agents and skills that fit. After a few weeks the arrangement looks roughly like this:

- **Oracle.** The user's entry point. A local model, on a machine that has Ollama running. Holds shared memory: the user's name, the time zone, the list of repos they currently care about, the small conventions they prefer (commit message shape, branch naming, the kind of notes they keep). Skills attached: `personal-admin` (calendar, file read on the notes folder, file organiser tools).
- **Coding sub-agent.** A specialist for the work in repositories. Wraps an existing coding agent the user already runs, registered against the projects folder. Skills attached: `code-review`, `test-runner`, `git`. The user talks to the oracle in plain language; the oracle delegates anything that reads as "work on the code" to the coding sub-agent.
- **Research sub-agent.** A specialist for reading the web. Fetches a page, summarises it, extracts the points the user is likely to care about, and returns a short brief. Skills attached: `web-research` (fetch, read, summarise, quote). Used when the user asks "what does this library's changelog say" or "summarise this issue thread" or "pull the relevant section from this RFC."
- **File organiser skill.** A pure skill, not a sub-agent. Bundles a handful of tools for moving, renaming, tagging, and dating files in the user's notes folder. Attached to the oracle directly. When the user says "tidy today's notes," the oracle runs the skill's tools without delegating to anything.
- **A growing library of installed skills.** `k8s`, `deploy`, `screenshot`, `transcribe`, others, all installed but only attached to whichever agent needs them. The user runs a `nanos skills list` to see what's available and attaches with a one-line edit to the relevant agent's manifest.

Each agent has its own memory. The oracle remembers who the user is. The coding sub-agent remembers conventions for each repo it has worked on (test command, lint command, deploy command). The research sub-agent remembers what the user has been reading recently, so it can reference it. Shared facts (the user's name, the time zone, the notes folder path) sit with the top level oracle and are read by any sub-agent the user has granted access to.

Each agent has its own skills, and skills are not memory. The coding sub-agent does not "learn" its skills; they are declared once and changed only when the user attaches or removes one. That separation, capability via skills, history via memory, is what keeps the arrangement legible as it grows.

### A request flowing through it

It is Tuesday morning. The user types into the oracle: "What's new in the React 19 RC, and update the project notes for the dashboard repo with anything I should know about before I start work."

1. The oracle reads the request. The first half is a research task; the second half is a notes task. The oracle delegates the first half to the **research sub-agent** and runs the second half itself (it owns the file organiser skill and the notes folder).
2. The research sub-agent fetches the React 19 RC release notes, scans the relevant RFCs, and returns a short brief: the breaking changes that affect the dashboard repo, the new APIs that look relevant, and a link to the migration guide section for the hooks patterns the dashboard uses.
3. The oracle integrates the brief, opens the dashboard repo's notes file, and uses the file organiser skill to append a dated section summarising the brief, tagged with the repos it affects and the migration steps the user has previously taken in similar updates.
4. The oracle replies to the user with the brief inline, a one line summary of what it wrote to the notes file, and an offer to dig deeper on any single item.

The user wrote one sentence. Two agents (oracle and research sub-agent) and two skills (file organiser and web-research) did the work. The coding sub-agent was not involved this time; tomorrow it will be. The user can inspect any layer of the call tree, read the memory each agent wrote, revoke a tool, swap a model, or detach a sub-agent without rewriting the rest of the arrangement.

### Why this shape is the point

A flat agent with a huge prompt could be coached to do most of this. A bespoke script could automate the specific morning briefing. Neither survives contact with the next request. The research sub-agent that summarises the React 19 RC today is the same one that summarises the next RFC, the next issue thread, the next blog post. The coding sub-agent that updates the dashboard tomorrow is the same one that updates every other repo. The arrangement is a thing the user maintains, not a script they rewrite per task.

This is the part of the design that earns the OS framing. The user is not chaining prompts. They are populating a small set of agents that they can think about the way they think about the tools they already use, that they own, that runs on their machine, and that grows the way their work grows.

The arrangement is also a test of the project's principles. Every model call can be local. Every tool runs under a declared scope. Every memory file is on disk and readable. The cloud only enters the picture for the calls that genuinely need cloud capability, and when it does it goes through the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) with the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) in front of it. The indie developer example works at every privacy posture the user wants to take, from "everything local" to "selectively cloud, scrubbed and proxied."

## v1 scope

A deliberately narrow v1, shipped well.

- **A CLI.** Single binary install. Run `nanos`; land in an oracle session. No GUI, no daemon, no server in v1.
- **One oracle, configurable.** Local model by default. Cloud models supported with explicit configuration. Any chat-completion compatible endpoint works; NanoOS does not curate a recommended list.
- **No bundled sub-agents.** v1 ships the substrate only. The user installs sub-agents separately, including wrapping the coding agent or any other agent they already run. The empty-out-of-the-box first run is the deliberate cost of keeping the substrate clean; activation happens through the install-and-attach flow, not through magic defaults.
- **No bundled tools.** Same posture as sub-agents. The user installs tools separately, and a tool the user already has can be wrapped to the NanoOS contract with a thin shim. There is no default filesystem tool or default shell tool shipped in the box; what counts as "in the box" is the contract and the loader, not a curated set of implementations.
- **Skills as a first class primitive.** A skill is a directory plus a manifest. The oracle and sub-agents attach skills by name. Installing a skill is a `cp -r` into the user's config plus a manifest validation; the same skill attaches to many agents.
- **Plain file based memory.** Conversation history on disk in a `.nano-os/memory/` directory. Per agent memory in declared paths. Markdown files, no schema, human editable. The user can read it, edit it, delete it, version control it.
- **The sub-agent, skill, and tool contracts published as a stable v1.** Third parties can build against them from day one. Tools use the MCP wire format under a NanoOS-owned authoring layer. Sub-agents use a NanoOS-defined manifest plus interface contract. Skills bundle tools with a manifest, a description, optional commands, and optional event subscriptions.

What v1 ships is "a substrate, a stable set of contracts, an arrangement format, a permissions model, an import/export lifecycle, and a clear path for users to install and attach the sub-agents, skills, and tools they want." Not a complete agent OS. Not a curated toolkit. The starting point that grows.

## What it is not (in v1)

- **Not a hosted service.** No NanoOS cloud, no remote oracle. If the project ever has a hosted component, it is later and explicit.
- **Not a literal operating system.** No kernel, no scheduler in the OS sense, no process model below the agent abstraction. The "OS" word is a metaphor for compositional substrate, not a promise of a kernel.
- **Not a chat UI.** A CLI is the v1 surface. UIs may come later or may be downstream consumers of the substrate.
- **Not a multi user platform.** Single user, single machine. Team workflows are out of scope until single user lands well.
- **Not a model.** NanoOS uses whichever models the user configures. It is not training, fine tuning, or shipping a model of its own.
- **Not a replacement for any existing agent.** Existing agents (coding agents, writing tools, anything else the user already runs) become sub-agents under NanoOS, not absorbed into it. They ship independently.
- **Not a moderation, safety, or alignment layer.** Out of scope. The substrate is neutral about what the user wants their agents to do; the permissions model is about preventing accidental harm, not about policing intent.

## Composition with other collective projects

Most collective projects compose with this substrate through the generic contracts (sub-agent, skill, tool). A few have a more specific integration shape worth naming:

- **The [Prompt Scrubber](/collective/whitepapers/prompt-scrubber)** runs as middleware on any sub-agent that talks to a model. Scrubbed prompts go out; rehydrated responses come back. The oracle does not have to know.
- **The [Private Inference Proxy](/collective/whitepapers/private-inference-proxy)** is the configured network path for cloud model calls. A sub-agent that uses a cloud model talks to the proxy, not directly to the provider.
- **Nanotune** is upstream of the model layer rather than a runtime component. Models fine tuned through Nanotune are first class oracles or sub-agent backbones.

This is the long picture from the collective's introduction page expressed as a product: local-first models at the core, specialist sub-agents and tools any contributor can build, and privacy preserving paths to external capability when the task genuinely requires it. NanoOS is the layer that makes the rest of the stack feel like one stack.

## Alternatives considered

- **A library, not a CLI.** A library only release moves the integration cost onto the user. The CLI is the demonstration that the substrate is real, the entry point for non developer users, and a forcing function for ergonomic defaults. A library API is part of the project; a library only release is not.
- **A web app or desktop GUI as the v1 surface.** Bigger surface area, slower iteration, harder to keep local-first honest. CLI first is the right shape for the audience and for the collective's existing posture. A GUI is a plausible downstream project.
- **Absorbing sub-agents into a single agent runtime.** Smaller bundle, simpler install. Loses everything that makes the project interesting. Independent sub-agents with a contract is the whole point.
- **Building on top of an existing framework (LangGraph, CrewAI, AutoGen, MCP runners).** Each is worth a serious look during scoping, especially the [Model Context Protocol](https://modelcontextprotocol.io/) for the tool layer; reusing a well designed contract there beats reinventing one. The substrate as a whole, however, is shaped by privacy and locality concerns those frameworks do not prioritise. The default answer is to compose with what fits and write the rest, not to bend the project to an existing runtime.
- **Skip the recursive composition.** Flat oracle plus sub-agents is simpler. Drops the part of the design that earns the OS framing and the part that lets users mirror the structure of their own life into the system. Settled: v1 is flat; recursion is a phase 2 milestone. The v1 manifest format leaves the door open so the phase 2 work is non-breaking.

## Open risks

These are the concerns that could kill the project or force it into a different shape.

1. **Latency and cost compound with depth.** A recursive arrangement with cloud models at multiple layers can produce a single user turn that fans out to dozens of model calls. Local models help on cost; they do not help on latency at depth. If the design does not produce useful work at usable speeds for the audience's hardware, the recursive shape is decoration. v1 has to measure this honestly on representative hardware, not assert it works.

2. **The default sub-agents are a make or break for the install experience.** A user who installs NanoOS and finds an empty oracle has nothing. The default sub-agent set has to demonstrate real value on first run. Picking the wrong defaults, or shipping them at the wrong level of polish, is the most likely path to the project landing flat.

3. **The permissions model is a real product surface, not a feature.** Get it too loose, and a buggy sub-agent reads things it should not. Get it too strict, and the user clicks through every prompt until they stop reading them. Get it confusing, and the user opts out of the model and the project's privacy story collapses. This is design work, not implementation work.

4. **Substrate projects are hard to land.** A tool that does one thing well is easy to evaluate. A substrate that "lets you build anything" is easy to dismiss as vague. The project must ship with concrete, complete user journeys (one oracle, three sub-agents, five tools, a clear story for each) or it reads as a framework looking for a user.

5. **The OS metaphor can mislead.** Some readers will hear "OS" and expect a kernel, a process scheduler, or a Linux replacement. The naming has to either lean into the metaphor with enough explanation that confusion is rare, or pick a different name. Either path is fine; ambiguity is not.

6. **Sub-agent interoperability could fracture quickly.** If every NanoOS user writes their own sub-agent contract variations, the ecosystem fragments and the substrate value disappears. The contract has to be small, stable, well documented, and defended against drift in the first year.

7. **Provider terms and tool side effects.** Sub-agents that drive third party services (email, calendar, payments) have terms of service of their own. The project does not control whether a user's email provider permits agentic access; it does control whether the documentation is honest about that. If it is not, users will find out the hard way.

## Resolved in review

These questions were open when the whitepaper was published and were settled during the public review window. They are recorded here as the design history.

1. **Naming.** Settled: **NanoOS**. The working title becomes the name. The collective leans into the OS metaphor deliberately, and the whitepaper's "What it is not" and Threat model sections spell out that it is a compositional substrate, not a kernel. Dropped "(working title)" from the frontmatter and the H1. The package shape follows the lowercase utility family for distribution where it lands in the collective's monorepo.
2. **Audience for v1.** Settled: **power users running personal automations**. This is the audience the v1 ergonomics, permissions model, and install story are built around. The other three candidates (developers building multi agent products, teams on shared internal automations, researchers) are explicitly named as out of v1 scope: the developer audience is already served by LangGraph and similar; the team audience wants RBAC and shared infra that the single-user shape does not provide; the researcher audience is small and is a downstream consumer. See the "Intended audience" and "What it is not" sections above.
3. **Tool contract.** Settled: **compose — MCP at the wire, a NanoOS-owned authoring layer on top**. The wire format is MCP, so authored tools interoperate with any MCP-aware client and NanoOS does not invent a transport. The authoring experience is NanoOS-owned: a clean, opinionated manifest plus a directory of typed functions, written in TypeScript. The runtime wraps those user-authored tools in MCP and serves them through the substrate. This gives free interop without inheriting MCP's authoring conventions and without forcing the user to author in MCP's format directly.
4. **Sub-agent contract.** Settled: **NanoOS-defined manifest plus interface contract**. A sub-agent is a manifest describing its identity (system prompt, model, job) and the skills and tools it needs. Stability of the contract is the priority; the contract is small, well documented, and the substrate ships the bindings. Tools inside a sub-agent use the MCP wire format from the previous decision, so the sub-agent's effective tool list is the union of its skill tools plus its bare tools. The NanoOS contract is the sub-agent-level contract; MCP is the tool-level wire format. The two compose.
5. **Skill contract.** Settled: **manifest + directory of tools + optional commands + optional event subscriptions**. A skill is a directory containing a manifest file and a set of tools. The manifest declares the skill's name, description, version, the tools inside, any commands the skill exposes, and any event subscriptions a tool in the skill registers. Event subscriptions are the part the v1 surface has to defend: they are powerful, so the manifest format documents them clearly and the runtime scopes each subscription to the skill's declared capabilities. No cross project alignment is required for v1; the contract is NanoOS's, and it can be revisited if a sibling project converges on a different shape worth composing with.
6. **Skill scoping and sharing.** Settled: **a skill installed once lives in the user's `.nano-os/skills/` directory and is attachable to any agent**. The install flow is a `cp -r` (or a thin `nanos skill install <path>` command) plus manifest validation. No per-arrangement scoping in v1: one skill, one install, attached to any agent that names it. A community catalogue is parked as a phase 2 packaging problem on top of an existing format, not a v1 surface.
7. **Recursion in v1.** Settled: **flat v1, recursion in phase 2**. v1 ships the oracle plus a flat list of sub-agents. The contract does not foreclose a sub-agent being a NanoOS instance — the v1 manifest format leaves the door open — but the v1 CLI does not exercise it, the docs do not document it, and the example arrangement is flat. The recursive shape is the design's centre of gravity and the natural phase 2 milestone once the flat shape lands and the boundary cases start showing up. See open risk 1 for the related latency and cost concern, which is also a phase 2 measurement rather than a v1 gate.
8. **Memory model.** Settled: **plain markdown files in `.nano-os/memory/`, no schema**. The directory is on disk, human editable, version-control friendly. The oracle reads from it freely; sub-agents read what they have been granted access to. Per-agent memory lives in declared sub-paths under the same root. Shared facts (the user's name, time zone, the notes folder path) live at the top level. Scoping is the agent's responsibility: it just doesn't read files outside its own scope, and the runtime enforces that at the file level. See the "Memory and state" section above.
9. **Permissions UX.** Settled: **unit of grant is the skill; dangerous tools still prompt per use**. Attaching a skill grants all of its tools in one declaration, so the user does not have to grant twenty individual tool scopes to use a `k8s` skill. The safety net lives at the runtime level: any tool that touches the network, runs shell, writes outside a declared root, or accesses secrets triggers a per-use prompt regardless of the skill-level grant. The result is the ergonomics of "I attached the k8s skill" without the user opting out of the privacy story by clicking through prompts on every action. The unit of grant is the skill; the unit of per-use prompting is the dangerous tool inside it.
10. **Configuration shape.** Settled: **single arrangement per machine in v1**. One `.nano-os/` directory, one arrangement manifest, one config file. The format is plain files, so adding multi-arrangement support later (named arrangements, switchable) is a non-breaking addition. v1 does not ship the switcher; it ships the format that does not foreclose one.
11. **State portability.** Settled: **arrangements are portable by construction, with `nanos init` and `nanos apply` in v1**. Plain files on disk means an arrangement is portable in principle. v1 ships the explicit lifecycle: `nanos init` writes a portable directory for a new arrangement; `nanos apply <dir>` reads one. The indie developer worked example becomes the kind of arrangement a user could publish, fork, or share, with shared memory seeds as part of the portable artifact. See the "v1 scope" section.
12. **Cloud model defaults.** Settled: **no shipped recommendation; supports whatever the user wants**. NanoOS does not curate a recommended local model floor or a recommended cloud fallback. The model is whatever the user configures: any chat-completion compatible endpoint, local or cloud. The local-first principle still sets the default posture, and the Private Inference Proxy is the privacy-respecting path for cloud calls. The substrate takes no position on which specific model an operator should run; the docs document the model adapter and let the user choose. Same posture as Nanocoder.
13. **Headless and scheduled use.** Settled: **interactive only in v1**. The CLI is the v1 surface. A user who wants an email triage agent on a cron does not have a v1 path that runs without a CLI session; that use case is documented as a phase 2 thing, and the v1 design avoids making it harder later (the contracts and the on-disk format are clean enough that a phase 2 `nanos run <agent>` headless mode is straightforward to add).
14. **Observability and debugging.** Settled: **stdout in v1, no replay**. The terminal shows what the agents are doing: which agent ran, which tool it called, what it returned. A structured log file per session is a phase 2 thing. v1's debugging story leans on the user being able to read the memory files and inspect the on-disk state; richer observability is a real user-experience surface but not a v1 gate.
15. **Bundled sub-agents.** Settled: **none in v1**. v1 ships the substrate only. The user installs sub-agents separately, including wrapping the coding agent or any other agent they already run. The empty-out-of-the-box first run is the deliberate cost of keeping the substrate clean; activation happens through the install-and-attach flow, not through magic defaults. The contract for sub-agents is published, so writing one against the v1 surface is well documented, and the indie developer worked example shows the shape.
16. **Bundled tools.** Settled: **none in v1**. Same posture as sub-agents. The user installs tools separately, and a tool the user already has can be wrapped to the NanoOS contract with a thin shim. There is no default filesystem tool or default shell tool shipped in the box; what counts as "in the box" is the contract and the loader, not a curated set of implementations. The MCP wire format decision makes wrapping an existing tool a small, well-understood operation.
17. **Stack.** Settled: **TypeScript**, matching the rest of the collective. The case for Rust or Go is a phase 2 trigger (a real performance constraint at the substrate's hot path), not a v1 design choice. The architecture is documented to allow a Rust detection core behind the same JS API if the budget ever demands it.
18. **Maintainer commitment.** Settled: **Will Lamerton as both designer and maintainer**, in the same posture as the other Nano Collective projects. A separate "design partner" is not required for a single-maintainer substrate project; the v1 design partner is the public review itself, which is recorded above. The next maintainer beyond Will is a phase 2 problem, not a v1 gate.
19. **Arrangements as packageable artifacts.** Settled: **yes, `nanos init` and `nanos apply` ship in v1**. A whole arrangement (oracle config plus its sub-agent set plus its skill set plus any shared memory seeds) is a portable directory. The indie developer worked example is the kind of arrangement a user could publish, fork, or share. v1 ships the format and the two commands; a community catalogue of published arrangements is a phase 2 surface that the format already supports.

## Open questions

All questions raised during the review window have been resolved and recorded above. None remain open at the time of writing. New concerns can still be raised as issues against the docs repo during the review window (it closes 2026-06-19); if a fundamental one surfaces, it gets added here and argued.

## Next steps

For this whitepaper to graduate into docs:

- [x] Pick the intended audience for v1. Settled: power users running personal automations. See resolved item 2.
- [x] Resolve the naming question. Settled: NanoOS. See resolved item 1.
- [x] Evaluate MCP for the tool contract. Settled: compose — MCP at the wire, NanoOS-owned authoring layer on top. See resolved item 3.
- [x] Pick the sub-agent contract approach. Settled: NanoOS-defined manifest plus interface contract; the contract document is the next build task inside the shape this whitepaper argues. See resolved item 4.
- [x] Lock the skill manifest format. Settled: manifest + directory of tools + optional commands + optional event subscriptions. The schema is the next build task. See resolved item 5.
- [x] Decide on recursion in v1. Settled: flat v1, recursion in phase 2. See resolved item 7.
- [x] Lock the permissions UX. Settled: unit of grant is the skill; dangerous tools still prompt per use. See resolved item 9.
- [x] Lock the memory model. Settled: plain markdown files in `.nano-os/memory/`, no schema. See resolved item 8.
- [x] Lock the configuration shape. Settled: single arrangement per machine in v1, plain files, multi-arrangement is a non-breaking future addition. See resolved item 10.
- [x] Decide the arrangement lifecycle. Settled: `nanos init` and `nanos apply` ship in v1, plain files as the portable artifact. See resolved items 11 and 19.
- [x] Decide whether sub-agents and tools ship bundled. Settled: neither ships in v1; the substrate only. See resolved items 15 and 16.
- [x] Lock the stack. Settled: TypeScript. See resolved item 17.

The latency and cost measurement that was originally on the graduation checklist (item 10 in the prior version) is deliberately not a graduation gate. It is a phase 2 measurement, run against real arrangements on real hardware, that informs the recursion-in-phase-2 design rather than blocking v1 from shipping. See resolved item 7 and open risk 1.

The "design partner from the collective" requirement was dropped from the checklist as overcautious for a single-maintainer substrate project; the v1 design partner is the public review itself, recorded in the "Resolved in review" section. See resolved item 18.

The remaining build-time work inside the shape this whitepaper argues — the contract documents (sub-agent, skill, tool, arrangement), the CLI surface, the indie developer example arrangement as a runnable repo, the docs site pages — is the v1 build. None of it is a graduation gate; all of it is the natural first task inside the settled design.

With the graduation checklist settled, this document is ready to become the foundation of the project's README and design notes. The repository is created under [`Nano-Collective`](https://github.com/Nano-Collective), and the [Creating a New Project](/collective/projects/creating-a-new-project) playbook takes over.

This page stays in place after the project ships, as the historical record of how the design was argued.
