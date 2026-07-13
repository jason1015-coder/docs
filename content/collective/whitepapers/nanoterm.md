---
title: "Nanoterm"
description: "A whitepaper for an open-source, ultra-lightweight terminal companion that translates natural language into safe, executable shell commands."
sidebar_order: 3
proposer: "Sk Akram"
proposer_github: "akramcodez"
status: "Proposed"
review_opens: "2026-07-09"
review_closes: "2026-08-09"
---

# Nanoterm

Most developers rely on the terminal daily, but memorizing arcane shell syntax (like complex `find` combinations, `ffmpeg` one-liners, or `sed` incantations) breaks flow. While powerful AI coding agents like Nanocoder exist, booting up a heavy, context-aware agent just to generate a one-line shell command introduces unnecessary friction.

This whitepaper proposes `Nanoterm`: a tiny, open-source terminal companion that translates natural language requests into shell commands, presents them for review, and executes them locally after explicit human approval. It provides a shell-first experience without the overhead of a full development environment, acting as the perfect lightweight companion to the Nano Collective ecosystem.

## Problem

The agent layer is where the next round of useful work happens, but current AI coding tools are fundamentally misaligned with quick, ephemeral shell tasks:

1. **Overhead.** Booting a full coding agent to ask "how to delete all `node_modules`" takes too long, clutters the interface, and uses unnecessary compute resources.
2. **Context mismatch.** Coding agents optimize for source code editing. They try to explain code, scan workspaces, and provide conversational filler rather than just outputting an executable command.
3. **Safety.** Many command generation tools either refuse to run commands entirely or run them blindly without an intermediate review step. This is incredibly dangerous for destructive actions like `rm` or `chmod`.
4. **Fragmentation.** Existing standalone tools in this specific space (like `whai`, `aichat`, or `gorilla-cli`) are completely disconnected from the Nano Collective ecosystem, missing out on shared prompt architectures, model configurations, and privacy tooling.

## Intended audience

`Nanoterm` is designed for developers, sysadmins, and power users who spend their days in the terminal and want an AI assistant specifically tuned for shell operations. 

The primary user is someone who already knows their way around a terminal but wants to avoid reading man pages or searching online for complex bash syntax. They want a frictionless workflow: invoke the tool, get the command, approve it, and move on. It is not designed to replace deep, stateful, multi-file refactoring (which is Nanocoder's domain).

## Principles

The design philosophy of `Nanoterm` is its most critical aspect. It must feel like a native UNIX utility, not a bolted-on conversational AI.

- **Shell-first.** The terminal is the product. There is no chat UI, no lengthy explanations of why a command was chosen unless explicitly requested, and no conversational filler. The output is strictly a command ready to be run.
- **Ultra-lightweight.** Instant startup is a hard requirement. There is no indexing of the local filesystem, no scanning of the workspace, and no persistent background agent maintaining state between unrelated sessions.
- **Human approval.** Safety is paramount. `Nanoterm` will *never* execute commands automatically. It will always present the generated command to the user for review. The user must be able to explicitly approve the execution or edit the command inline if the AI hallucinated or missed a nuance.
- **Ephemeral.** A `Nanoterm` session exists only while solving one specific task. Once the command is executed, the session is discarded. There is no long-term memory to pollute future interactions.

## Scope (v1)

A tightly focused utility that does one thing exceptionally well.

**In scope:**
- Natural language to shell command translation via a simple CLI invocation (e.g., `nano "find all empty directories"`).
- An interactive `[y/N/edit]` approval flow before execution, ensuring users always have the final say.
- Capturing `stdout` and `stderr` to feed back into the ephemeral session, allowing the user to chain immediate follow-up commands (e.g., "now delete the ones you found").
- Multi-provider support (OpenAI, Anthropic, Gemini) matching Nanocoder's existing configuration.

**Out of scope:**
- Editing source code files or performing codebase refactoring.
- Indexing workspaces or managing project state.
- Persistent chat history across terminal tabs or reboots.
- Replacing full terminal emulators like Warp or iTerm.

## Proposed approach

`Nanoterm` will be built as a standalone NPM package (e.g., `@nano-collective/nanoterm`), keeping it completely decoupled from the main `nanocoder` repository. This ensures it remains an ultra-lightweight utility.

### Provider architecture

To resolve the tension between remaining completely decoupled and utilizing Nano Collective's provider connections, **my preferred direction for v1** is sharing the configuration format while keeping provider implementations independent. 

Nanoterm could reuse the existing `agents.config.json` format so users only configure providers once. The exact config lookup strategy (shared location, fallback, or dedicated Nanoterm config) is still open for discussion. However, Nanoterm will implement its own provider calls against the Vercel AI SDK independently—it will not import or depend on any Nanocoder source code. The coupling is strictly at the config-file format level.

Similarly, "shared prompt techniques" refers to adopting the Nano Collective ecosystem's system prompt conventions (e.g., command-only output, no filler) rather than sharing literal prompt code.

### The pipeline

1. **Invocation.** The user runs the CLI with a query: `nano "free up disk space"`.
2. **Context Gathering.** The tool briefly samples the environment (OS type, current shell, Present Working Directory) to ground the generation and ensure compatibility.
3. **Generation.** The LLM generates the exact shell command(s) needed, omitting conversational filler.
4. **Approval Workflow.** The user is presented with the command and prompted for action:
   ```bash
   $ nano "find all node_modules larger than 1GB"

   Proposed command:
   > find . -name "node_modules" -type d -prune -size +1G

   Execute? [y/N/edit]: 
   ```
5. **Execution & Feedback.** Upon execution (if `y` is selected), the output is printed to the terminal normally. It is also temporarily buffered, allowing the user to immediately chain a follow-up request like `nano "delete the largest one"` without losing context. If `edit` is selected, the user is dropped into an prompt to manually tweak the command before execution.

## Relationship with Nanocoder

A common question is why this isn't simply a feature within Nanocoder. 

Nanocoder is designed for long-running, stateful coding sessions. It requires project understanding, uses complex agent orchestration, and coordinates multiple tools to read, write, and test code. 

`Nanoterm` is the opposite: it uses minimal context, prioritizes fast startup, and handles single, ephemeral operations. They are highly complementary. A developer might use `Nanoterm` to quickly figure out the exact `git` incantation to untangle a messy rebase, and then switch to Nanocoder to implement a complex feature across five different files in that newly cleaned repository.

Despite sharing the same provider configuration format, Nanoterm has zero runtime or build-time dependencies on the Nanocoder codebase. This is a deliberate design choice: extracting a shared provider library would gate Nanoterm's development on upstream Nanocoder releases and introduce unnecessary coordination overhead. A shared library remains a future possibility once both tools have stabilized, but v1 prioritizes shipping speed and independence.

## Future ideas

While v1 is kept intentionally minimal to validate the core loop, future iterations could explore:
- **Local models by default.** Making local, quantized models (via Ollama or Llama.cpp) the default to guarantee zero latency and absolute privacy.
- **Shell completions.** Native tab completions for the `nano` binary itself.
- **Integration with `prompt-scrub`.** Seamlessly routing prompts through the Nano Collective's `prompt-scrub` tool to remove PII (Paths, IP addresses, emails) before hitting a cloud provider.
- **Command history injection.** Providing the last 5 executed commands as context to the model to better understand the user's current goal.
