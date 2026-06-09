---
title: "prompt-scrub"
description: "A working whitepaper for a small open source tool that scrubs identifying content from LLM prompts and messages before they leave the user's machine"
sidebar_order: 2
proposer: "Will Lamerton"
proposer_github: "will-lamerton"
status: "In public review"
review_opens: "2026-05-19"
review_closes: "2026-06-18"
---

# prompt-scrub

When you send a prompt to a cloud LLM, the prompt itself often gives you away. Your name in a question. Your email in a pasted snippet. Your home directory in a stack trace. The path to your private repo. A secret your tool helpfully echoed back. None of these are necessary for the model to do its job. All of them are visible to the provider and persisted in their logs.

This whitepaper proposes a small open source tool that scrubs identifying content out of prompts and messages before they hit any LLM, runs entirely on the user's machine, and follows the shape of `get-md`: independent first, with downstream integrations as natural consumers.

It is a companion to the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) whitepaper. The proxy addressed identity at the network and key layers; the scrubber addresses identity at the content layer. The proxy's proposer has recommended declining the project as currently scoped (see its "Decision" section); the core team has not yet made a build / decline / iterate decision, and the review window closes 2026-06-18. This whitepaper reads that recommendation at face value for its own design: if the recommendation holds, the privacy stack the collective ships is the scrubber on its own, and the "scrubber in front of a relay" composition point is a hypothetical rather than a sibling project. If the recommendation is overturned, the proxy-plus-scrubber composition is the strongest stack the collective can offer, with the proxy's own whitepaper arguing the case. Either way, the substantive design here (the "ship as Mode C" rejection, the standalone scrubber API) holds on its merits and is not contingent on the proxy's fate. The two whitepapers are kept together because the scrubber was originally framed as Mode C of the proxy, and the design history is worth preserving in full.

The project's working title, scope, and stack are all resolved (see "Resolved in review" below). The remaining open work is the maintainer commitment, plus anything new raised during the rest of the review window. The document is published in working form so the collective can argue the shape of it before code lands.

## Intended audience

prompt-scrub is shaped as a local utility for any developer whose tools send prompts to a cloud LLM, the same way `get-md` is a local utility for any tool that reads files for an LLM. The audience is wide: a developer running Claude Code or aider from a terminal, a developer wiring prompts into a custom Node script, a developer building an agentic tool and wanting clean prompts by default. The integration shape is the same in every case: the developer's tool of choice routes the request through prompt-scrub before it leaves the machine, then to the provider of choice. The CLI handles the casual case; the library API handles the embedded case; both ship in the same package.

A second path is the Nano Collective ecosystem itself. Nanocoder is the obvious first consumer; any future agent the collective ships becomes one too. The standalone usage and the integrated usage are equally valid and the project is designed to make both feel like first class. There is no separate installable form for "external organisations" the way DocsForest ships: a developer who wants it installs the package and routes through it, the same as any other local utility.

The proxy was named in earlier drafts of this paragraph as a sibling consumer. The [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) whitepaper's proposer has recommended declining the project as currently scoped (see its "Decision" section); the core team has not yet made a build / decline / iterate decision, and the review window closes 2026-06-18. If that recommendation holds, the privacy story the collective ships is the scrubber on its own, and the "scrubber in front of a relay" composition point in "Composition" becomes a hypothetical integration shape for a future community utility rather than a sibling project. If the recommendation is overturned, the proxy becomes a sibling consumer again, with the composition point upgraded from hypothetical to current. The substantive design here (the standalone scrubber API, the "ship as Mode C" rejection) holds on its merits either way.

The v1 user is a developer who is technically literate enough to set an `OPENAI_BASE_URL` or wire a library into their code, and privacy curious enough to want to do something about the identifying content in their prompts. The non user is anyone expecting a one click, set and forget anonymity product; prompt-scrub reduces identity leakage at the content layer, it does not provide anonymity, and the audience is the one that reads that distinction and acts on it.

## Problem

LLM prompts carry identity in ways the user often does not notice and the provider quietly retains. Common leak surfaces:

1. **Direct identifiers in prose.** Names, emails, phone numbers, addresses written into the prompt by the user.
2. **Filesystem and project context.** Absolute paths, home directories, project slugs, branch names, internal URLs.
3. **Secrets accidentally included.** API keys, tokens, credentials pasted alongside code or config.
4. **Tool call results in agentic settings.** `ls`, `git log`, `cat`, `grep`, and similar tools return identifying output that gets fed straight back into the next LLM turn.
5. **Stylistic and contextual fingerprints.** How a user writes, what they care about, what jargon they use, all build a persistent profile over time.

Items 1 through 4 can be addressed today with disciplined pattern matching. Item 5 is the harder problem and requires model based rewriting, which is a future direction rather than a v1 commitment.

## Principles

- **Privacy-respecting.** The tool exists to keep identifying content on the user's machine. It must not introduce new exposure of its own. No telemetry, no remote rule fetching by default, no opt out logging.
- **Local-first.** The tool runs entirely on the user's hardware. No part of v1 requires network access.
- **Open for all.** Full source open, rule packs published, deployment trivial. Anyone can install, audit, and extend.

## Threat model

prompt-scrub is a content layer tool. The threat model names what it does, what it does partially, and what it does not. The network and key layers are not in scope. Whether they are picked up by another NC project depends on the [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) decision: the proxy's proposer has recommended declining the project as currently scoped (see its "Decision" section), and if that recommendation is upheld by the core team at the end of the review window, the network layer is the user's own choice rather than a collective project. If the recommendation is overturned, the proxy becomes a sibling project at this layer. Either way, prompt-scrub is local, runs no network code, and composes with whatever the user picks.

**In scope. Defended by v1.**

- *Accidental secret leakage in prompts.* Strong defence. The secret detector catches the common API key, token, and credential shapes with high precision. Missing a credential is worse than missing a name, and the detector is tuned accordingly.
- *Accidental identifier leakage in one off prompts.* Strong defence. Email, phone, postal address, path, and URL detectors catch the obvious shapes with conservative defaults. A user who pastes a prompt with their contact details and a path or two gets clean text out, with the original values on disk under the session map for rehydration.

**Partial. Reduced but not eliminated.**

- *Cloud LLM providers reading identifying content in prompts and tool results.* The detectors reduce what is visible. They do not eliminate it: a paragraph that says "my project at /Users/me/work has this weird bug" becomes "my project at Path_1 has this weird bug", which is materially less identifying but not zero.
- *Long term provider profile building from prompt content.* Stable session mappings prevent identifier level correlation across a single session (the same email maps to the same `Email_1` on every turn). They do not address stylistic fingerprinting, and a determined provider can still build a profile across sessions.
- *Tool call results in agentic settings.* The scrubber operates on every message regardless of origin, so `ls`, `git log`, `cat`, and `grep` results are scrubbed before the next LLM turn. Coverage is the path, name, and URL detectors; the host of leaks a clever tool call could produce is not enumerated exhaustively in v1.

**Out of scope. Not defended by v1.**

- *An adversary on the user's machine.* prompt-scrub runs locally; if the local environment is compromised, the prompt is too. The session maps on disk are plaintext JSON in v1, and an attacker with the user's account can read them. Encryption at rest is a v1.1 follow up.
- *Semantic leakage.* A question that is inherently identifying (your private codebase, a niche bug only you have, a number only your accountant knows) cannot be made anonymous by stripping identifiers. Stripping identifiers from "what is wrong with my taxes given I made $X this year" does not anonymise the question.
- *Style fingerprinting.* The v1 brute force approach does not rewrite style. The way you phrase things, the words you choose, the cadence of your questions, all go out unchanged. The phase 2 model based rewriter is the path to address this; in v1, it is a known gap.
- *Harmful content moderation.* Not a prompt-scrub job. The tool is trying to catch identifying content, not harmful content. Providers have their own moderation; the scrubber does not duplicate it.
- *Anything at the network or key layer.* The scrubber does not run on the network and does not see it. A user who needs this protection composes with a network tool of their own choosing (a VPN, Tor, a self-hosted relay, or a future proxy-shaped community utility). The [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) whitepaper proposed a sibling project for this layer; the proposer has recommended declining it as currently scoped (see its "Decision" section), and the core team has not yet decided. If the recommendation holds, the network layer is not a collective project; if it is overturned, the proxy becomes one. The scrubber composes cleanly with whatever the user picks because the integration shape is additive.

**Out of scope, and named because they are easy to mistake for in scope.**

- *Network level identification of the user's traffic to the LLM provider.* The scrubber does not see the network. IP address, network fingerprint, request timing, headers — all of these are the network layer's problem, and the scrubber cannot help with any of them. A user who needs network layer privacy composes the scrubber with whatever network tool fits their threat model: a VPN, Tor, or a future relay-shaped utility. The [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) whitepaper proposed a sibling project for this layer; the proposer has recommended declining it as currently scoped (see its "Decision" section), and the core team has not yet decided. If the recommendation holds, the network layer is the user's own choice rather than a collective project; if it is overturned, the proxy becomes one. The scrubber composes cleanly with any of these because the integration shape is "scrub, send, rehydrate" — a network tool on the request path is additive, not coupled.

## Scope

A deliberately narrow scope, shipped well.

- One input: a prompt string or a message (system, user, assistant, tool result, etc.).
- One primary output: the scrubbed version, semantically equivalent for LLM consumption.
- One auxiliary output: a reverse mapping from placeholder to original, so responses can be rehydrated where needed.
- Pluggable detectors. A default set ships in the box; users and rule packs can extend with project specific rules.
- Both a CLI and a library API in the same package, mirroring the rest of the Nano Collective utility shaped projects.

## Proposed approach

The v1 design is the smallest surface that does the four jobs identified in the Problem section: identify obvious identifiers, map them stably across a session, hand the cleaned message to a downstream LLM call, and rehydrate the response. The shape is a local library with a CLI wrapper, no network calls, no model in the critical path, and one well-trodden integration point per downstream consumer.

### The pipeline

A single `scrub()` call, in order:

1. **Accept the message.** A message is a `{ role, content }` object in the OpenAI chat completions shape, which is the de facto interchange format every provider accepts. The library does not parse provider specific formats; the caller normalises.
2. **Stabilise the session map.** If a session id is provided, the map is loaded from disk (or the in-process cache). New identifiers seen this turn are appended; existing identifiers are reused.
3. **Run the detector pipeline.** Detectors run in a fixed, documented order, each producing a list of `Finding { category, span, replacement }` items. Findings are deterministic for a given input and a given session map, so a re run produces the same scrubbed text. Each finding is tagged with a category (email, phone, path, secret, url, name, code-tell) but not with a confidence band; the v1 model is "strip by default, inspect for everything."
4. **Resolve collisions.** If two detectors claim overlapping spans, the more specific detector wins, with a documented precedence order. This is rare in practice but cheap to make explicit.
5. **Apply the transformations.** Spans are replaced with stable placeholders (`Email_1`, `Secret_1`, `Path_1`, etc., namespaced by category so rehydration is unambiguous). The updated session map and the scrubbed message are returned to the caller.

The whole pipeline is a pure function from `(message, session_id_or_new) -> (scrubbed_message, session_map)`. There is no I/O, no telemetry, no remote rule fetch. The only I/O the library does is read and write the session map file, and that is local to the user's config dir.

### Detectors

The default detector set ships in the box. Every detector is on by default, with one exception: the name detector is off by default, because proper noun detection is where false positives hurt most and the cost of turning it on is one config flag.

- **Email.** RFC 5322 shaped addresses. The workhorse detector. Stable placeholders, no information loss in the placeholder name.
- **Phone.** International and US shaped phone numbers. Loose on purpose; the false negative cost is higher than the false positive cost for this category.
- **Postal address.** Street shaped lines. Conservative; only fires on patterns that look unambiguous (number + word + street/road/ave).
- **Path.** Absolute paths (`/Users/...`, `/home/...`, `C:\...`, `~/...`), the home directory token expanded or not, and project slugs when configured.
- **Secret.** API key shapes (high entropy, provider specific prefixes where known), tokens, common credential patterns. High precision, low recall is the right trade here; missing a credential is worse than missing a name.
- **URL.** Full URLs, with extra attention to private hostnames and internal TLDs. Hosts in a project specific allowlist are passed through.
- **Name.** Proper noun detection. Off by default. Opt in enables a sensible proper noun strip; a stricter opt in mode runs an allowlist of common first names and a small set of obviously non identifying proper nouns (countries, languages, widely used product names) as never strip.
- **Code tell.** Opt in. Detects private class names and internal variable conventions the user enumerates in config. Not on by default because the false positive cost on code is high.

Every detector is a small function `(text, session) -> Finding[]`. Users can disable a detector with a flag, and rule packs ship as separate packages that add or replace detectors, in the same shape Sentinel uses for rule packs.

### Session mapping

A session is identified by an opaque session id (a UUID the caller provides or the library generates). The session map is a dictionary from placeholder to original value, namespaced by category. It is persisted to disk under the user's config dir:

- macOS: `~/Library/Application Support/prompt-scrub/sessions/<id>.json`
- Linux: `${XDG_CONFIG_HOME:-~/.config}/prompt-scrub/sessions/<id>.json`
- Windows: `%APPDATA%\prompt-scrub\sessions\<id>.json`

The disk format is plain JSON, so a user can inspect or hand edit a session map if they need to. Sessions are not encrypted at rest in v1; the contents are identifiers the user already typed into the prompt, and the threat model assumes the local machine is trusted. A v1.1 follow up can add at rest encryption if the maintainers decide it is worth the cost.

The library owns the lifecycle. `scrub()` with a session id reads or creates the file, mutates the in-memory map, writes it back. `rehydrate()` reads the same file. The CLI exposes a `prompt-scrub sessions list` and `prompt-scrub sessions show <id>` for inspection, and `prompt-scrub sessions rm <id>` to drop a session explicitly. There is no automatic expiry in v1; the user is in charge of when a session map is deleted, and the disk cost of a session is trivial.

For the one-shot CLI case (`echo "..." | prompt-scrub scrub`), the CLI generates a session id, prints the session id alongside the scrubbed output, and writes the map to disk. The user passes the same id to `prompt-scrub rehydrate` after the model call to get the original values back.

### Cache-aware scrubbing

Provider prompt caching is the part that is easy to get wrong. Anthropic, OpenAI, and Google all cache long fixed prefixes (system prompt, tool definitions) for cheaper repeated calls, keyed on the exact bytes of the prefix. If the scrubber regenerates the placeholder for the same identifier on every turn, the cache key changes and the cache hit is destroyed. If the scrubber is given the same session map and the same input text, the output is byte-identical, so the cache hit is preserved.

The contract v1 promises is simple: for a given session id and a given input text, `scrub()` is deterministic. Callers who send a long fixed prefix once and want it cached call `scrub()` on the prefix, capture the output, and reuse that output as the prefix on every subsequent turn. The library does not need a "cache this prefix" mode; determinism is the only contract required, and it is free given the rest of the design.

The inspect subcommand prints the hash of the scrubbed output, so a caller can verify the prefix is byte stable across calls. That is enough for the v1 to be cache aware without inventing any new API surface.

### Rehydration

The reverse path is the simplest part. `rehydrate(response_text, session_id)` looks up the session map, swaps placeholders back to original values, and returns the response. If a placeholder is in the response that is not in the map, the library passes it through unchanged and emits a warning to stderr (the model has invented a placeholder; the caller may want to inspect).

The CLI exposes rehydration as a separate subcommand so the one-shot flow is pipeable:

```bash
SCRUBBED=$(echo "..." | prompt-scrub scrub --session-id my-session)
RESPONSE=$(curl -s https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "$(jq -n --arg prompt "$SCRUBBED" '{model: "gpt-4o", messages: [{role: "user", content: $prompt}]}')")
echo "$RESPONSE" | prompt-scrub rehydrate --session-id my-session
```

The library case is two function calls in the same process; the session map is held in memory and never touches disk unless the caller persists it. The integration in Nanocoder or any other agentic tool is the same shape: scrub the message, send, rehydrate the response, hand the original values back to the tool result handler.

### CLI surface

Subcommands:

- `prompt-scrub scrub` — read a message from stdin, print the scrubbed message to stdout, the session id to stderr. `--session-id <id>` to reuse a session, `--inspect` to print what would change without committing the transformation.
- `prompt-scrub rehydrate` — read a response from stdin, print the rehydrated response to stdout. `--session-id <id>` required.
- `prompt-scrub inspect` — read a message from stdin, print a human readable diff of what the scrubber would change. Useful for tuning rule sets and for the "what does this actually do" question.
- `prompt-scrub sessions list` — list known session ids and their sizes.
- `prompt-scrub sessions show <id>` — print the session map for inspection or hand editing.
- `prompt-scrub sessions rm <id>` — delete a session map.
- `prompt-scrub rules list` — list the active detector set, including rule pack detectors.
- `prompt-scrub --version` / `--help` — the usual.

The CLI is a thin wrapper over the library. The library is the API a downstream tool integrates against; the CLI exists for the casual case and for sanity checking. This is the same shape as `get-md` and `json-up`.

## A worked example

A developer is debugging a deploy. They paste a stack trace and a question into their AI SDK based tool, which is wired to call prompt-scrub on the way out. The original prompt, on their machine, is:

```
Hey, I'm Will. My team is hitting a deploy failure on
the staging environment for https://staging.acme-internal.io.
The error from the GitHub Actions run is:

  Error: secret not found: ANTHROPIC_API_KEY=sk-ant-abc123...
  at /Users/will/work/acme/.github/workflows/deploy.yml:42

Can you take a look?
```

The developer invokes their tool. The tool calls `scrub(messages, "session-2026-05-19-will")`. On disk, the library writes the session map:

```json
{
  "Name_1": "Will",
  "URL_1": "https://staging.acme-internal.io",
  "Path_1": "/Users/will/work/acme/.github/workflows/deploy.yml",
  "Secret_1": "ANTHROPIC_API_KEY=sk-ant-abc123..."
}
```

The scrubbed message that goes out to the model is:

```
Hey, I'm Name_1. My team is hitting a deploy failure on
the staging environment for URL_1.
The error from the GitHub Actions run is:

  Error: secret not found: Secret_1
  at Path_1

Can you take a look?
```

The model does not know the developer's name, the company, the internal hostname, the home directory, or the API key. It has enough context to answer the question (it can talk about the `secret not found` error and the deploy workflow without knowing any of the identifiers).

The model responds (illustrative):

```
The error means the workflow is trying to read ANTHROPIC_API_KEY
from the environment and the value isn't set. Check that the
secret is configured in the repository settings under
Settings > Secrets and variables > Actions, and that the workflow
file references it correctly. The Path_1 line in the workflow
should be the spot where it's being read.
```

The tool calls `rehydrate(response, "session-2026-05-19-will")`. The placeholders swap back. The developer reads:

```
The error means the workflow is trying to read ANTHROPIC_API_KEY
from the environment and the value isn't set. Check that the
secret is configured in the repository settings under
Settings > Secrets and variables > Actions, and that the workflow
file references it correctly. The /Users/will/work/acme/.github/workflows/deploy.yml
line in the workflow should be the spot where it's being read.
```

Two things to notice. First, the secret is now in the model response as `ANTHROPIC_API_KEY` (the model guessed the variable name) and the scrubber did not strip it because there is no `Secret_2` mapping — the placeholder was in the response but not in the map, so the library passed the word through unchanged and warned to stderr. The developer sees the warning, knows the model invented a placeholder, and is on notice. Second, the rehydrated path is back in plain text, on the developer's machine, exactly as it would have been without the scrubber in the loop. The only difference is the bytes that hit the provider.

What slipped through: the developer's writing style ("Hey, I'm Will. My team is hitting..."), the fact that they have a team, the fact that they are working on a deploy, the cadence of their question. Style fingerprinting is the explicit v1 gap, listed in the threat model and in Open risks. The brute force approach gets the obvious identifiers; the phase 2 model based rewriter is what addresses the rest.

The `inspect` subcommand would have shown the developer the diff before they sent the prompt:

```
  [Name]    Will              -> Name_1
  [URL]     https://staging.acme-internal.io
                              -> URL_1
  [Path]    /Users/will/work/acme/.github/workflows/deploy.yml
                              -> Path_1
  [Secret]  ANTHROPIC_API_KEY=sk-ant-abc123...
                              -> Secret_1
```

Reading the diff, the developer confirms the scrubber caught what they cared about. They send.

## Alternatives considered

- **Server-side redaction by the LLM provider.** Some providers are starting to offer redaction or content filtering as a side feature. Even where it exists, it puts the provider in the trust boundary the user is trying to step out of. The whole point of prompt-scrub is that the user does the redaction before the prompt leaves the machine, with full visibility into the rules. A provider-side equivalent is at best a complement to a local tool, never a substitute.
- **A model-only v1.** A small local paraphrasing model is the strong technical answer to stylistic fingerprinting. It is also a multi week project to evaluate, integrate, and ship, and the v1 honest answer to "does this stop my name and email going out" is regex, not a model. Pulling the model into v1 slows the first release for the sake of a category (style) the v1 is explicit about not addressing. Parked as phase 2 with a clean path to integration, not parked because it is unimportant.
- **Doing nothing and trusting the provider.** The status quo. The thesis of this whitepaper is that the status quo leaks more than the user realises, that the leaks are systematic, and that the cost of doing something is low for a developer who already has a Node toolchain. A user who is comfortable with the status quo is not the audience; the audience is the user who has noticed and wants to act.
- **Ship as Mode C of the Private Inference Proxy.** The project started there, with the scrubber as one of three modes in the proxy design. The scrubber outgrew the framing regardless of the proxy's eventual fate: it has a different deployment shape (local library, no network), a different threat model (content layer, not network and key), no commercial layer or provider relationships to manage, and many more potential callers than the proxy alone. Folding it back in would couple its release cadence to the proxy's, force the proxy to ship a content layer feature alongside its core, and lock the scrubber's API into a network service's contract. Sibling projects with shared shape is the cleaner posture. The proxy's proposer has recommended declining the project as currently scoped (see its "Decision" section); the core team has not yet decided, and the review window closes 2026-06-18. If that recommendation holds, the privacy stack the collective ships is the scrubber on its own, not a mode of something that did not ship. If the recommendation is overturned, the same argument above still holds and the scrubber stays a sibling project. Either way, the rejection of "ship as Mode C" is on the merits, not on the proxy's fate.
- **Ship as a Sentinel rule pack.** Sentinel already ships detector-shaped code for security patterns. Adding a prompt scrubber as a rule pack is tempting, but rule packs ship inside Sentinel's job (security findings on a schedule), not as a general purpose prompt transformation tool. The scrubber's consumers (Nanocoder, a CLI user pasting a prompt into a terminal) are not Sentinel's consumers, and the v1 scrubber has no business filing security issues; it has business transforming messages. Different project, different surface.

## Composition

prompt-scrub stands alone, and it composes. The integration shape is the same in every case: the consumer calls `scrub()` on the outgoing messages, sends the cleaned text through whatever channel it normally uses, and calls `rehydrate()` on the response before handing it back to the user. Two function calls in the message handling code. There is no provider abstraction to swap, no middleware framework to wire up, and no opinion about how the consumer talks to the model.

- **In front of a direct LLM call.** The user runs prompt-scrub locally, sends the cleaned prompt to OpenAI, Anthropic, or anyone else, and rehydrates the response. NC is not in the path at all. The one shot CLI flow is the example: scrub via stdin, send via curl, rehydrate via stdin. Same shape in any scripting language that can read stdin and POST JSON.
- **In front of a future relay-shaped utility (the proxy-shaped composition point).** The proxy whitepaper proposed a sibling project for the network and key layer; the proposer's recommendation in that document is that the project be declined as currently scoped (see its "Decision" section), and the core team has not yet decided, with the review window closing 2026-06-18. If that recommendation holds, this composition point is hypothetical: the proxy is not a sibling project, and the entry below describes a shape for a future community utility rather than a current one. If the recommendation is overturned, the proxy becomes a sibling project again, and the entry below becomes the documented proxy-plus-scrubber integration rather than a hypothetical. In either case the integration shape is the same: prompt-scrub runs first, the relay sits on the network, prompt-scrub rehydrates the response. A future Mode B shaped community utility — a small relay that the user runs to normalise provider call fingerprints without the trust posture of a hosted proxy — would slot into this composition point the same way. The integration is additive either way; the scrubber is not coupled to any particular network tool.
- **As a library inside [Nanocoder](https://github.com/Nano-Collective/nanocoder) or any other tool that talks to LLMs.** The integration is two function calls in the message handling code: `scrub(messages, sessionId)` on the way out, `rehydrate(text, sessionId)` on the way back. Nanocoder's AI SDK shape makes this a one PR change in the request/response handler, not a framework refactor. The scrubbingProvider wrapper is **not** the integration shape; it would add an abstraction layer the AI SDK does not need. Two function calls is the design goal: minimal, explicit, easy to remove.
- **In front of any HTTP based LLM API.** The library does not care what provider the consumer is talking to. The integration is the same: take the outgoing message list, call `scrub()`, post to the provider with the cleaned messages, call `rehydrate()` on the response text. The session id is whatever the consumer chooses to key it on (a Nanocoder session, an HTTP request id, a per user id, whatever).

## Open risks

These are the concerns that could materially hurt the project's value, force it into a different shape, or cause direct harm if not addressed in the design and the docs.

1. **False positives and false negatives on the obvious leaks.** This is the v1's whole reason to exist. The defaults need to be tuned against a realistic prompt corpus before the first release, not in response to user complaints after it. Aggressive detectors that strip too much make prompts useless to the model; permissive detectors miss real leaks. The mitigation is the `inspect` subcommand and the rule pack distribution shape (separate packages, easy to swap, easy to ship fixes), not a confidence band system the v1 deliberately does not have.
2. **Performance on long agentic contexts.** Untested. A naive regex pass over a 100k token history on every turn is the obvious failure mode. If the v1 architecture cannot stay inside the latency budget agentic tools need, the design has to evolve to incremental scanning or per-turn diffing rather than full re-scan. The risk is real but designable: the v1 ships a single pass, measures, and the architecture is documented to allow an incremental mode later without breaking the API contract.
3. **The "70% not 100%" framing causes harm if mishandled.** A user who reads about the tool and assumes it makes them anonymous is worse off than a user who never heard of it: they trust the tool, stop reading the prompts, and the things the detectors miss go out with confidence. The threat model section is explicit that this is partial defence, not anonymity, and the docs and any marketing have to land that distinction clearly. The mitigation is the threat model in the README, the "what it is not" section in the docs, and an inspect-first onboarding that shows the user what the tool actually did to a real prompt.
4. **The v1 sells false safety to users who skip the inspect step.** Distinct from #3: this is the operational version of the same risk, not the framing version. A user who installs prompt-scrub, never runs `inspect`, and assumes the defaults are tuned is exposed to whatever the defaults miss. The mitigation is conservative defaults (every detector on, secrets prioritised, names off until opted in), a clear `inspect` first run in the README, and a rule pack ecosystem that surfaces false positive reports as issues against the right detector, not against the project as a whole.
5. **Phase 2 (the model based rewriter) may not have a fit for purpose off the shelf model.** The strong form of the tool depends on a small local model that can paraphrase while preserving intent. The risk is not that this is years of work; it is that the survey of candidates (paraphrase tuned T5 variants, small Llama or Phi variants, dedicated anonymisation models) produces nothing good enough and the project has to fine tune one. Manageable, not existential, and the v1 ships with a clean answer ("we don't solve style in v1") so the project is not blocked on it.

## Open questions

All questions raised during the review window have been resolved and recorded above. None remain open at the time of writing. The one exception is the phase 2 model selection, which is deliberately not a graduation gate: it is build time work, scoped and decided when the project is built, the same posture DocsForest takes for its audit prompt.

New concerns can still be raised as issues against the docs repo during the review window (it closes 2026-06-18); if a fundamental one surfaces, it gets added to "Resolved in review" and argued there.

## Next steps

For this whitepaper to graduate into docs:

- [x] Resolve the naming question. Settled: prompt-scrub.
- [x] Pick the stack. Settled: TypeScript, matching get-md, json-up, and the rest of the collective.
- [x] Lock the v1 scope. Settled: detector set, opt-in categories (name, code tell), strip-by-default with inspect as the tuning surface, see "Proposed approach".
- [x] Sketch the API shape. Settled: library with `scrub()` and `rehydrate()`, CLI as a thin wrapper, two function call integration for downstream consumers, see "Proposed approach" and "Composition".
- [x] Decide whether this ships before, alongside, or after the proxy. Settled: the proxy's proposer has recommended declining the project as currently scoped (see its "Decision" section); the core team has not yet decided, and the review window closes 2026-06-18. On the merits, the scrubber ships standalone either way (see "Relationship to the Private Inference Proxy" for the full argument). If the recommendation is upheld, the proxy-shaped composition point in "Composition" is a hypothetical for a future community utility. If the recommendation is overturned, the proxy becomes a sibling project and the same composition point becomes a current integration.
- [x] Decide the default rule set. Settled: the eight detectors listed in "Proposed approach", with name and code tell off by default.
- [x] Decide the rule pack distribution shape. Settled: separate npm packages, same shape Sentinel uses.
- [x] Decide the rehydration UX. Settled: disk under the user's config dir, library owns the lifecycle, --session-id flag on the CLI.
- [x] Decide the detector confidence model. Settled: no confidence band in v1, strip by default, inspect for nuance.
- [x] Decide the relationship to the proxy. Settled: the scrubber ships standalone on the merits, regardless of the proxy's fate. The proxy's proposer has recommended declining the project as currently scoped (see its "Decision" section); the core team has not yet decided, and the review window closes 2026-06-18. If that recommendation is upheld, the proxy is not shipping as a project, and the "scrubber in front of a relay" composition point in "Composition" is a hypothetical for a future community utility. If the recommendation is overturned, the proxy becomes a sibling project and the same composition point becomes a current integration. The "ship as Mode C" alternative is rejected in full under "Alternatives considered" either way.
- [ ] Confirm at least one committed maintainer.

The phase 2 model based rewriter is deliberately not a graduation gate: it is build time work, scoped and decided when the project is built, the same posture DocsForest takes for its audit prompt.

With the graduation checklist settled, this document is ready to become the foundation of the project's README and design notes. The remaining open question above is a second order administrative item that does not block the build. On a yes decision, the repository is created under [`Nano-Collective`](https://github.com/Nano-Collective), and the [Creating a New Project](/collective/projects/creating-a-new-project) playbook takes over.

This page stays in place after the project ships, as the historical record of how the design was argued.

## Resolved in review

These questions were open when the whitepaper was published and were settled during the public review window. They are recorded here as the design history.

1. **Naming.** Settled: **prompt-scrub**. The verb-first shape of `get-md` and `json-up` reads as a tool, the name is self-describing, and the npm package shape (`@nanocollective/prompt-scrub`) follows the existing collective convention without invention. The working title was the right answer once the hedging was dropped.
2. **Language and stack.** Settled: **TypeScript**, matching `get-md`, `json-up`, and the rest of the collective. The case for Rust or Go is a phase 2 trigger ("performance becomes a real constraint"), not a v1 trigger. The v1 ships in TypeScript and the architecture is documented to allow a Rust detector backend behind the same JS API if the performance budget demands it.
3. **Default detector set.** Settled: the eight detectors listed in "Proposed approach" ship in the box, with two of them off by default (name, code tell) for false positive reasons. Every other detector is on by default. The `inspect` subcommand is the load bearing escape hatch for tuning.
4. **Rule pack distribution.** Settled: **separate packages**, in the same shape Sentinel uses for rule packs. A rule pack is a normal npm package that exports detectors conforming to the `Finding[]` interface. Community rule packs are installed, configured, and listed via `prompt-scrub rules list` like any other dependency.
5. **Rehydration UX.** Settled: disk under the user's config dir, library owns the lifecycle, `--session-id` flag on the CLI for the one shot case. See "Proposed approach > Session mapping" for the full shape. The disk format is plain JSON, hand editable, no automatic expiry in v1.
6. **Detector confidence levels.** Settled: **no confidence band in v1**. Detectors return a `Finding { category, span, replacement }`, the library strips by default, and `inspect` is the surface for nuance. The complexity lives in the rule pack, not in the API.
7. **Relationship to the proxy.** Settled: **scrubber ships standalone on the merits, regardless of the proxy's fate**. The original framing was "sibling projects, not a mode of the proxy," which the project still rejects on the merits. The proxy's proposer has recommended declining the project as currently scoped (see its "Decision" section); the core team has not yet decided, and the review window closes 2026-06-18. If that recommendation is upheld, the proxy is not shipping as a project, the privacy stack the collective ships is the scrubber on its own, and the "scrubber in front of a relay" composition point in "Composition" is a hypothetical for a future Mode B shaped community utility rather than a current sibling. If the recommendation is overturned, the proxy becomes a sibling project and the same composition point becomes a current integration. The "ship as Mode C" alternative is rejected in full under "Alternatives considered" in either case.
8. **Phase 2: model based rewriting.** Open by design. The model selection is build time work, not a graduation gate, the same posture DocsForest takes for its audit prompt. The v1 ships with a clean answer ("we don't solve style in v1") so the project is not blocked on it.

## Relationship to the Private Inference Proxy

The [Private Inference Proxy](/collective/whitepapers/private-inference-proxy) whitepaper proposed a network and key layer project; the proposer's recommendation in that document is that the project be declined as currently scoped, on three grounds: Mode A's provider TOS constraints and the collective's lack of a legal entity to negotiate provider relationships, Mode B on its own not earning a standalone project, and the privacy value the proxy was designed to host living at the content layer (the scrubber) rather than the network layer. The core team has not yet made a build / decline / iterate decision, and the review window closes 2026-06-18. The "Decision" section in that whitepaper is the substantive record; this one notes the consequence for prompt-scrub.

If the proposer's recommendation holds, the consequence is: the privacy stack the collective ships is the scrubber on its own, not "scrubber in front of proxy." The "ship as Mode C" alternative — folding the scrubber into the proxy as a third mode — is rejected on the merits regardless of the proxy's fate, and is recorded in full under "Alternatives considered" above. The "scrubber in front of a relay" composition point is preserved in "Composition" as a hypothetical integration shape, in case a future Mode B shaped community utility lands and a real user wants the scrubber-plus-relay composition. It is not a v1 commitment, and under this scenario it is not a sibling project.

If the recommendation is overturned, the consequence is: the proxy becomes a sibling project, the strongest stack the collective can offer is "scrubber in front of proxy," and the same "scrubber in front of a relay" composition point in "Composition" becomes a current integration rather than a hypothetical. The "ship as Mode C" rejection still holds on the merits (the scrubber and the proxy have different deployment shapes, different threat models, and different release cadences), and the "ship as Mode C" alternative is still rejected in full under "Alternatives considered."

Either way, the substantive design here (the standalone scrubber API, the rejection of "ship as Mode C," the additive composition shape) is on its own merits and not contingent on the proxy's fate. The proxy's review window is the only thing that decides whether the composition point is hypothetical or current, the proxy is a sibling or not, and the privacy story the collective ships includes one project or two.
