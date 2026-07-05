---
title: "NanoBench"
description: "A provider-neutral benchmark for evaluating AI coding agents on real-world software engineering tasks."
sidebar_order: 1
proposer: "Ronak Raj"
proposer_github: "RONAK-AI647"
status: "In public review"

---

# NanoBench
> A provider-neutral benchmark for evaluating `AI coding agents` on real-world engineering tasks.

NanoBench is a standalone, provider-neutral evaluation suite for Nanocoder — the open coding agent built by the Nano Collective. It measures whether Nanocoder, running on any supported model or provider, can solve real engineering problems in large, production-grade repositories, and it classifies exactly why it fails when it cannot.

Unlike existing benchmarks (SWE-bench and its variants), NanoBench is not a dataset of single-file bug fixes on isolated repositories. It is a stress-test built from real merged pull requests in high-complexity, multi-language codebases — tasks that require genuine architectural reasoning, not keyword-searchable surface changes. And unlike any benchmark designed for a single-vendor CLI, NanoBench evaluates across every provider Nanocoder supports: Ollama, OpenRouter, Anthropic, Gemini, and local models. The same task, the same scoring, across every model.

This is the benchmark the agent benchmarking space does not have. In May 2026, Artificial Analysis launched the first public Coding Agent Index — the first benchmark measuring full agent stacks (model + harness pairs). NanoBench does the same thing, purpose-built for Nanocoder, with the failure taxonomy depth that no existing public benchmark offers.

The project is proposed as a separate repository under the Nano Collective (`Nano-Collective/nanobench`), with Python as the primary language for the evaluation core, Nanocoder as the first and initially only harness, and a maintainer-owned roadmap that starts with a verifiable proof of concept and scales to a community-governed dataset through an open contribution pipeline.

---

## 2. Introduction

### Why NanoBench?

Nanocoder ships changes regularly — to its prompt builder, tool-calling logic, planning mode, context compression, and provider integrations. Currently, there is no systematic way to answer the question every release implicitly asks: *did this change make the agent better?*

The problem compounds with every new provider Nanocoder adds. When a user switches from Claude Sonnet to a local Qwen model, they have no way to know which one performs better on the class of engineering task they actually care about. And when a maintainer improves the prompt builder, they cannot tell whether the improvement holds across providers or only benefits one.

NanoBench answers both questions with the same infrastructure: a fixed set of expert-curated tasks, a reproducible evaluation pipeline, and a scoring model that tells maintainers not just *what* changed but *why*.

### Background and Motivation

The core motivation stems from a direct empirical observation of how current agent harnesses handle highly complex, enterprise-grade architectures. When evaluating a real-world, multi-file engineering task—such as a strictly functional data flow refactor in a scientific computing repository (e.g., `google-deepmind/torax`)—standard agents frequently exhibit a fundamental breakdown in codebase reasoning:

- `Context Explosion`: Reading dozens of irrelevant files instead of isolating the exact components needed for the fix.

- `Architectural Blindness`: Making surface-level edits that completely break underlying system paradigms (like mutating variables in a strictly functional codebase).

- `API Hallucination`: When faced with complex or unfamiliar abstractions, agents frequently hallucinate non-existent methods rather than successfully navigating the actual class hierarchy.

- `Resource Exhaustion`: This undirected search strategy results in massive token consumption and rate-limit failures long before a meaningful solution is formulated.

When an agent fails a task of this complexity on a standard benchmark, the output is simply a binary FAILED. There is zero diagnostic signal explaining why the agent failed—whether it was a hallucinated API, an exceeded context window, or an abstraction mismatch. Existing benchmarks cannot capture these nuances because their tasks are too simple to expose them

This is the gap NanoBench fills.

---

## 3. The Problem

### Limitations of Existing Benchmarks

The agent benchmarking space is saturated and structurally limited. While current standards have driven rapid progress, they fail to test real-world engineering constraints. Existing benchmarks suffer from five core flaws:

- **Single-language bias**: the majority of SWE-bench tasks are Python-only, with no polyglot engineering tasks.
- **Overly localized fixes**: most tasks require changes to 1-2 files. Real engineering problems span architectural layers.
- **Confounded scaffold-model effects**: SWE-bench scores vary significantly depending on which agent scaffold is used, making it impossible to attribute performance to the model or the harness independently.
- **Contamination**: a significant portion of resolved issues were incorrectly marked as resolved due to weak test cases that did not verify patch correctness. When properly filtered, resolution rates drop from ~42% to ~22% on average.
- **Data contamination**: most tasks predate significant LLM knowledge cutoffs, meaning agents can solve them from memory rather than reasoning.

While newer benchmark variants attempt to patch these individual issues, none of them solve the core problem: there is currently no benchmark designed to evaluate a specific agent harness across multiple model providers.

### The Gap in Real-World Agent Evaluation

The benchmarking community has recently recognized a deeper structural gap. In May 2026, Artificial Analysis launched the Coding Agent Index — the first benchmark evaluating full agent stacks (model + harness pairs) rather than models in isolation. The finding: the same model scores differently in different harnesses, which means the wrapper matters as much as the model.

Nanocoder is a harness. Its prompt builder, tool-calling logic, planning mode, context compression, and AGENTS.md injection all shape how an underlying model performs. None of that is measured by any existing benchmark.

NanoBench closes this gap. It holds the harness constant (Nanocoder) and varies the model — producing a `Provider → Model → Task → Score → Failure taxonomy` matrix that answers the questions existing benchmarks cannot:

1. *Which model performs best through Nanocoder on real engineering tasks?*
2. *Did our last change to Nanocoder's prompt builder actually improve agent performance across providers, or just on one?*
3. *Where exactly does the agent fail — and is that failure caused by the model or the harness?*

---

## 4. Design Principles

### Provider Neutrality

Every design decision in NanoBench must work across all providers Nanocoder supports: Ollama (local), OpenRouter, Anthropic, Gemini, and any OpenAI-compatible API. No task, no scoring mechanism, and no infrastructure component may depend on a specific provider's API, rate limit structure, or authentication method.

The evaluation invocation is:
```bash
nanocoder --provider <provider> --model <model> --mode yolo run "<task_prompt>"
```

This is a first-class Nanocoder CLI invocation. Any provider that Nanocoder supports is automatically supported by NanoBench.

### Reproducibility

Every evaluation task is anchored to a specific, immutable repository state (e.g., a locked commit SHA). The orchestrator resets the environment to this exact state before invoking the agent. This ensures that benchmark results remain perfectly reproducible over time, completely insulated from any upstream codebase changes.

### Real Engineering Tasks

All tasks are sourced from real merged pull requests in real production repositories. No synthetic tasks. No LLM-generated task descriptions. The "Curation Paradox" is a guiding principle: **we cannot rely on an LLM to select the tasks we use to benchmark an LLM.** If an agent already possessed the architectural depth to distinguish a syntax fix from a multi-component reasoning bottleneck, this dataset would already be obsolete. Curation must be expert-led.

### Transparency

Every structural decision—from repository selection to the final scoring rationale—is fully auditable. Instead of black-box curation, a transparent engine scores and ranks repositories based on objective complexity metrics. Furthermore, every evaluation task exposes its complete metadata to the community, including the original issue context, the expert-verified golden patch, and the exact verification commands.

### Extensibility

NanoBench is designed to grow. The task schema, repository registry, and scoring logic are all versioned. Community contributors can submit new tasks through a defined validation pipeline. Future versions can add new harnesses beyond Nanocoder, new failure categories, and new scoring dimensions without breaking existing task definitions.

---

## 5. Project Vision

### What NanoBench Aims to Achieve

NanoBench aims to become the standard evaluation suite for the Nano Collective's agent tooling — the infrastructure layer that tells maintainers, contributors, and users whether changes are making Nanocoder better at actual engineering work, not just at benchmark-shaped tasks.

### Goals

- Deliver a reproducible, provider-neutral evaluation pipeline for Nanocoder.
- Curate an expert-verified dataset of 10-20 tasks from 5-10 production repositories in v1.
- Produce a failure taxonomy report that classifies *why* an agent failed, not just whether it passed.
- Enable multi-provider comparison on the same task set, so users can make informed model choices.
- Build CI infrastructure that catches Nanocoder regressions automatically on every PR.

### Non-Goals

- NanoBench is not a general-purpose benchmark for all coding agents. It is purpose-built for Nanocoder as the harness.
- NanoBench is not a fine-tuning dataset. Tasks are for evaluation, not training.
- NanoBench does not aim to replace SWE-bench for the broader research community. It aims to be more useful for Nanocoder's specific needs than SWE-bench is.
- NanoBench does not benchmark model intelligence in isolation — it benchmarks model performance *through Nanocoder*, which is the correct unit of analysis for this project.

---

## 6. Proposed Architecture & Task Lifecycle

```
[ Task Telemetry Trigger ]
            │
            ▼
┌───────────────────────────────────────┐
│     Manifest Ingestion Layer (TS)     │ ──► Parses task constraints & metadata
└───────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│    DevContainer Sandbox Provisioner   │ ──► Native virtual envs (uv/pnpm) for local runs,
└───────────────────────────────────────┘     pre-baked Docker images for CI pipelines
            │
            ▼
┌───────────────────────────────────────┐
│     Headless Execution Loop           │ ──► Invokes Nanocoder via a true --headless flag,
└───────────────────────────────────────┘     bypassing the Ink.js interactive render tree
            │
            ▼
┌───────────────────────────────────────┐
│     Deterministic Telemetry Sink      │ ──► Nanocoder flushes a raw JSON log trace
└───────────────────────────────────────┘     directly to a structured disk file
            │
            ▼
┌───────────────────────────────────────┐
│      Native Verification Harness      │ ──► Runs localized project test suites 
└───────────────────────────────────────┘     directly inside the container
            │
            ▼
┌───────────────────────────────────────┐
│       Diagnostic Scoring Engine       │ ──► Maps the JSON log dump to fractional
└───────────────────────────────────────┘     scores and the failure taxonomy
```

---

## 7. Dataset Design

### Repository Selection Criteria

To ensure rigorous, objective, and consistent curation across all current and future dataset releases, candidate repositories are evaluated against a deterministic scoring matrix. A repository must achieve a minimum score of 12 out of 20 points to be onboarded into the benchmark:

| Axis | Points | Criteria |
|---|---|---|
| Language breadth | 4 | 1pt per distinct language required to solve a typical bug |
| Cross-file dependency depth | 4 | Avg files read to understand one bug, sampled from 5 closed PRs |
| Post-April-2026 activity | 4 | ≥2 merged PRs/month = 4pts; ≥1/month = 2pts; less = 0pts |
| Domain novelty | 4 | 0 if domain already covered; 2 if adjacent; 4 if new domain |
| Context pressure | 4 | >80k tokens = 4pts; 50–80k = 3pts; 20–50k = 2pts; <20k = 0pts |

### Task Extraction Methodology

Tasks are extracted exclusively from real merged pull requests, not from open issues or synthetic generation. The extraction process:

1. **Identification**: Identify a merged PR containing multi-file architectural changes and strong native test coverage.
2. **Patch Isolation**: Surgically extract the golden patch from the PR diff to establish the ground truth.
3. **State Pinning**: Record the immutable `base_commit` (the exact parent commit just before the fix was merged).
4. **Reproducibility Check**: Clone the repository at the `base_commit` and verify the bug natively reproduces in isolation.
5. **Verification Gate**: Confirm the test suite fails at the `base_commit`, and successfully passes only after applying the ground-truth patch.
6.**Contamination Screening**: Apply algorithmic similarity checks against public code indexes to ensure the task description cannot be easily recalled from model training memory.

### Task Schema

Every curated task is compiled into a standardized, machine-readable metadata schema. This schema guarantees that the orchestrator has all the necessary parameters to run the evaluation deterministically. The schema enforces four core metadata categories: Fpr Example :

```json
{
  "task_id": "torax-001",
  "repo": "google-deepmind/torax",
  "repo_url": "https://github.com/google-deepmind/torax",
  "issue_url": "https://github.com/google-deepmind/torax/issues/547",
  "pr_url": "https://github.com/google-deepmind/torax/pull/1895",
  "base_commit": "<sha>",
  "languages": ["python", "jax"],
  "domain": "scientific computing",
  "difficulty": "very-hard",
  "task_type": "feature",
  "reasoning_category": "functional_flow_integrity",
  "token_estimate": 52000,
  "problem_statement": "...",
  "required_files": [
    "torax/_src/transport_model/qlknn_transport_model.py",
    "..."
  ],
  "ground_truth_patch": "...",
  "test_command": "pytest torax/tests/transport_model_test.py -x -q -k 'qlknn'",
  "contributor": "RONAK-AI647",
  "merged_at": "2026-01-15T00:00:00Z"
}
```

### Ground Truth

The ground truth for every task is the actual merged PR diff. This enables strict pass/fail grading via the native test suite, but also unlocks fractional scoring for pathfinding. Because the orchestrator knows exactly which files need to be edited, agents receive partial credit for successfully navigating to the correct components, even if their final code fix falls short.

It cuts the fluff but keeps the two most important points: the PR diff is the standard, and we give credit for good navigation.

### Dataset Versioning

The dataset is versioned via Git tags (`v0.1`, `v1.0`, etc.). Every `base_commit` SHA is immutable. A task added in v0.1 will produce identical evaluation conditions in v2.0.

---

## 8. Evaluation Methodology

### Execution Pipeline

NanoBench invokes Nanocoder in non-interactive run mode — the same mode Nanocoder v1.19.0 explicitly designed for CI/CD pipelines and automation scripts:

```bash
nanocoder \
  --provider <provider> \
  --model <model> \
  --mode yolo \
  --trust \
  run "<problem_statement>\n\nKey files to focus on:\n<required_files>"
```

- `--mode yolo`: auto-accepts all tool calls, including bash execution, without prompting.
- `--trust`: skips the first-run directory trust prompt (ephemeral, does not modify `trustedDirectories`).
- `--provider` / `--model`: fully specify the agent stack being evaluated. The same command with different provider/model flags produces a directly comparable result on the same task.

Nanocoder's `--plain` flag (introduced in v1.26.0) can optionally be used for cleaner stdout capture in CI pipelines.


### Scoring Strategy

| Score | Label | Condition |
|---|---|---|
| 1.0 | Complete Resolution | All tests in `test_command` exit 0 and no pre-existing passing tests are broken. This is the only score that counts as a solved task. |
| 0.5 | Partial Resolution | ≥50% of target tests pass AND the agent modified ≥1 file within `required_files`. Distinguishes correct-but-incomplete logic from hallucinated fixes. |
| 0.1 | Pathfinding Credit | Tests fail (or fail to compile), but the agent successfully navigated to and modified ≥1 file within `required_files`. Rewards architectural localization even if the implemented logic is flawed. |
| 0.0 | Zero Signal | Tests fail AND zero target files were touched. The agent hallucinated a fix in irrelevant files, or execution halted prematurely (e.g., token exhaustion, API timeout) before an edit was made. |

### Partial Credit

The 50% threshold for partial pass is intentional. A task with 10 test cases should not score 0.0 simply because one edge case was missed — that conflates "wrong direction" with "nearly right." The threshold requires both directional correctness (touched the right files) and substantive correctness (at least half the tests pass).

### Benchmark Outputs

Each evaluation run deterministically produces three primary artifacts:

- **Raw Telemetry Output**: A structured data payload (JSON) containing per-task execution metrics, including the tiered score, failure classification, model/provider metadata, total tokens consumed, tool-call frequency, and execution time.

- **Aggregated Baseline Report**: A human-readable synthesis document breaking down aggregated scores across multiple dimensions: provider, model, reasoning category, language, domain, and token density.

- **Provider Matrix**: A comparative matrix mapping Provider → Model → Task → Score → Failure Mode, allowing maintainers to instantly identify which LLMs suffer from specific architectural blind spots (e.g., hallucination vs. context exhaustion).

---

## 9. Failure Taxonomy

The failure taxonomy is the primary diagnostic payload generated by the benchmark. Binary score improvements (e.g., shifting from 52% to 55%) provide zero actionable signal to model developers or framework maintainers. Conversely, observing that `insufficient_context_read` failures dropped from 62% to 21% after an update to a prompt builder provides exact, targeted telemetry

NanoBench maps terminal states to six strict diagnostic categories:

### Hallucinated APIs (`hallucinated_api`)

The agent calls a method or accesses an attribute that does not exist in the historical state of the codebase. This is highly common in repositories with complex, evolving SDKs or strict functional paradigms that prohibit imperative mutations.

*Diagnostic signal: test fails with `AttributeError` or `NameError` on a symbol that doesn't exist in `required_files`.*

### Insufficient Context Reading (`insufficient_context_read`)

The agent failed to read enough of the repository to map the architectural dependencies before executing changes. This manifests as surface-level logic edits that miss the underlying data flow. Agents may read dozens of files, but fail to locate the actual architectural bottleneck.

*Diagnostic signal: `files_read` is high but `required_files` overlap with `files_edited` is low.*

### Wrong Abstraction Layer (`wrong_abstraction_layer`)

The agent injected its logic at the incorrect level of the architecture—for example, editing a high-level interface contract when the fix was actually required in the underlying implementation driver. This is heavily prevalent in deep, plugin-based frameworks.

*Diagnostic signal: agent touched files from `required_files` but tests still fail with an interface mismatch error.*

### Missing Cross-Component Changes (`missing_cross_language_change`)

The agent successfully fixed one localized component but missed a parallel architectural change required in another language or package. This routinely occurs in polyglot, full-stack environments (e.g., updating a backend schema but ignoring the frontend state manager).

*Diagnostic signal: partial tests pass (one language's tests) but the other language's tests fail.*

### Context Window Exhaustion (`context_window_exceeded`)

The agent exhausted its context window or API token budget before outputting a viable patch. High-complexity architectural tasks frequently exceed standard context limits, proving that current agents struggle to navigate large-scale repositories without highly optimized retrieval.

*Diagnostic signal: Nanocoder exits with a context-size error or rate-limit error before `test_command` is reached.*

### Partial Fixes (`partial_fix_only`)

The agent successfully implemented correct logic for a subset of the task but failed to catch all required edge cases. This triggers fractional scoring (0.5) because the agent demonstrated strict directional and partial functional correctness.

*Diagnostic signal: some target tests pass, agent touched files from `required_files`, but full test suite fails.*

### Future Categories

As the dataset grows, additional failure categories will be introduced through the task contribution process:
- `test_not_updated` — agent fixed the implementation but forgot to update/add tests
- `correct_file_wrong_function` — agent read the right file but edited the wrong function
- `environment_agency_failure` —The agent failed to correctly parse or iterate upon complex terminal tracebacks (e.g., deeply nested compiler errors or strict type-checker outputs) preventing it from self-correcting a failing fix.
---

## 10. Execution Infrastructure & Isolation

### Deterministic Workspace Provisioning

To guarantee absolute reproducibility and prevent cross-run state contamination, the orchestrator enforces strict isolation protocols for every evaluation cycle. The evaluation pipeline executes the following lifecycle for every task:

1. `Ephemeral Sandbox Creation`: A pristine, isolated workspace is provisioned exclusively for the current task.
2. `State Hydration`: The target repository is retrieved via a high-speed shallow clone and immediately hard-reset to the exact, immutable base_commit SHA, ensuring the agent inherits the precise historical state of the codebase.
3. `Subprocess Injection`: The agent (e.g., Nanocoder) is invoked headlessly with its working directory strictly bound to the isolated sandbox, physically preventing it from accessing external system states or caching layers.
4. `Ephemeral Teardown`: Upon completion of the verification suite and telemetry extraction, the sandbox is aggressively purged.

This prevents cross-task contamination and ensures every run starts from a clean state.

### Containerization & Dependency Isolation

Because advanced codebases often rely on complex, system-level dependency chains, native multi-language runtimes, or hardware-specific acceleration, the execution pipeline utilizes an adaptive environment management layer.

The infrastructure handles workspace environments across two distinct strategies:

- **Runtime-Insulated Tasks**: For single-language or interpreted environments (e.g., pure Python ecosystems), the runtime context is isolated via virtual environments or lightweight configuration specs mapped directly to the ephemeral workspace. This guarantees version pinning for specialized mathematical or runtime packages without incurring the container layer's overhead.

- **Containerized Archetypes**: For polyglot codebases or systems with deep native compilation requirements (e.g., Go binaries, compiled C/C++ components, Node/React builds), each task definition bundles a standardized container specification (such as a Dockerfile or development container definition). The orchestrator dynamically spins up a containerized sandbox to execute the agent and run the verification test suite.


### CI Integration

NanoBench ships a continuous integration workflow that:
- Validates every incoming task against schema, reproducibility, and verification requirements before it enters the dataset.
- Optionally runs a configurable subset of tasks against a specified provider and model on demand.
- Posts a score summary and failure taxonomy breakdown as a review comment.

This workflow can be wired directly to Nanocoder releases to catch agent regressions before they ship.

---

## 11. Why NanoBench is Different

### Comparison with SWE-bench

| Dimension | SWE-bench | NanoBench |
|---|---|---|
| Task source | GitHub issues (automated scrape) | Real merged PRs (expert-curated) |
| Task complexity | Mostly single-file, single-language | Multi-file, multi-language, architectural |
| Contamination control | Weak (most tasks predate model cutoffs) | Strong (post-Jan-2026, Jaccard similarity check) |
| Failure analysis | Pass/fail only | Granular diagnostic taxonomy (hallucination, abstraction mismatch, context exhaustion) |
| Provider comparison | Not supported | First-class: same task, all providers |
| Harness specificity | Generic (model-level) | Nanocoder-specific (full stack: model + harness) |
| Scoring | Binary | Graded (1.0 / 0.5 / 0.1 / 0.0) |

### Comparison with Existing Evaluation Suites

Nanocoder's own benchmarking (documented in the repo's `benchmarks/` directory) measures performance metrics like response speed and token throughput — not agent task-solving accuracy. NanoBench is complementary infrastructure: where the existing benchmarks measure *how fast* Nanocoder runs, NanoBench measures *how well* it solves real problems.

### Why Provider-Neutral Evaluation Matters

The harness matters as much as the model. The same model scores differently through different agent harnesses — a finding confirmed by the Coding Agent Index (Artificial Analysis, May 2026). For Nanocoder specifically, this means:

- A user choosing between Claude Sonnet and a local Qwen model needs Nanocoder-specific performance data, not raw SWE-bench scores evaluated through a different harness.
- A maintainer improving Nanocoder's prompt builder needs to know whether the improvement holds across all providers or creates a regression on one.

NanoBench is the only infrastructure that can answer either question for Nanocoder, because it is the only benchmark that treats Nanocoder itself as the fixed variable.

---

## 12. Risks and Challenges

### Dataset Contamination
**Risk:** An agent solves a task using training memory rather than active reasoning, artificially inflating its score.

**Mitigation:** Every task is post-dated beyond relevant model knowledge cutoffs and subjected to automated similarity screening against public code indexes before inclusion. The pinned commit SHA and merge timestamp are stored in every task, making contamination claims auditable and falsifiable.

### Environment & Dependency Drift
**Risk:** Conflicting system dependencies or runtime mismatches cause evaluation failures unrelated to the agent's actual performance.

**Mitigation:** Single-language environments are isolated via lightweight
configuration. Polyglot environments run inside fully containerized sandboxes, ensuring dependency conflicts never affect evaluation results.

### Evaluation Cost
**Risk:** Multi-provider evaluations at scale incur high API costs and hit rate limits.

**Mitigation:** Expert-metadata injection reduces unnecessary file exploration significantly, cutting both cost and run time. Local open-weight models provide a cost-free baseline for comparison.

### Benchmark Bias
**Risk:** Tasks curated by one person reflect a narrow domain slice.

**Mitigation:** The repository scoring matrix is fully transparent and auditable. A community contribution pipeline with strict validation gates opens curation to the broader collective over time.

---

## 13. Alternatives Considered

### Synthetic Benchmarks

Synthetic tasks (generated by LLMs from codebase analysis) are scalable but untestable for quality. We cannot verify whether a synthetically generated task actually requires architectural reasoning or can be solved by a simple keyword search. Rejected on principle: an LLM cannot be trusted to select the tasks used to benchmark LLMs.

### Single-Repository Benchmarks

Benchmarking Nanocoder exclusively on the Nanocoder repository itself would produce a conflict of interest and contamination (training data likely includes the Nanocoder codebase). Rejected.

### Model-Specific Evaluation

Building the evaluation harness around a proprietary API (e.g., Gemini's Live API or Anthropic's streaming format).
Violates the core provider-neutrality principle of the Nano Collective. Enforcing vendor lock-in completely undermines the goal of universally comparing multi-model performance across a standardized agent harness. Rejected.

### Why These Were Not Chosen

All alternatives inherently compromise evaluation quality, narrow the diagnostic audience, or enforce vendor lock-in. The architecture proposed in this whitepaper is the only solution that is simultaneously rigorous, reproducible, and aligned with the Nano Collective's mandate for provider-neutral open-source tooling.

---

## 14. Open Questions

### Orchestration Language
Should the evaluation core remain in Python for its subprocess and data
processing strengths, or be rewritten to share a native build toolchain
with Nanocoder? This affects long-term maintainability and contributor
onboarding friction.

### Automated vs. Human Evaluation
Scoring is fully automated via native test suites. Should an optional
human-in-the-loop review layer be introduced for partial-resolution tasks,
to distinguish correct-but-incomplete logic from plausible hallucinations?

### Community Contribution Gates
What programmatic validation requirements must a community-submitted task
satisfy before entering the dataset? The bar needs to be high enough to
protect dataset integrity without being so high it discourages contribution.

### Long-Term Dataset Governance
As the dataset scales, what is the formal process for onboarding new
architectural domains, retiring outdated tasks, and resolving scoring
disputes? This is a collective-level decision, not a technical one.
---

## 15. Roadmap [ v1 scope ]

### Version 1.0 Deliverables

- Curated Diagnostic Dataset: A foundational matrix of 6 high-complexity, multi-file tasks spanning diverse, polyglot architectural environments, with all states strictly pinned and validated.

- Automated Orchestration Engine: A headless, fully automated evaluation pipeline that dynamically injects boundaries, triggers Nanocoder in non-interactive mode, and extracts fractional scores via native test suites.

- Provider Performance Matrix: A comprehensive, multi-model execution baseline evaluating the identical task dataset across leading commercial APIs and local open-weight models to isolate harness efficiency from raw model capability.

- Actionable Telemetry & CI Integration: Automated generation of the granular failure taxonomy matrix, bundled with a plug-and-play continuous integration workflow designed to block regression in future Nanocoder updates.

### Future Directions

- v2: **Polyglot Architectural Integration**: Expand the evaluation matrix to encompass complex, multi-language repositories, supported by dynamic, containerized execution sandboxes to handle native compilation and deep dependency chains.
- v3: **Decentralized Task Curation**: Transition from a closed-loop curated baseline to a community-driven contribution pipeline, enforced by strict programmatic validation checks to prevent task contamination and maintain dataset integrity.
- v3+: **Harness Efficiency Telemetry**: Introduce advanced differential scoring to measure the precise delta between a raw model's native API performance and its capability when routed through the execution harness, mathematically quantifying the value-add of the orchestration layer.
- Long-term: NanoBench as the standard evaluation layer for all Nano Collective agent tooling, not just Nanocoder

---
