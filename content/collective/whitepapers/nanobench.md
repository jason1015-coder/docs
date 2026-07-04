---
title: "NanoBench"
description: "A provider-neutral benchmark for evaluating AI coding agents on real-world software engineering tasks."
sidebar_order: 1
proposer: "Ronak Raj"
proposer_github: "RONAK-AI647"
status: "Draft"
---

# NanoBench
> A provider-neutral benchmark for evaluating `AI coding agents` on real-world engineering tasks.

NanoBench is a standalone, provider-neutral evaluation suite for Nanocoder — the open coding agent built by the Nano Collective. It measures whether Nanocoder, running on any supported model or provider, can solve real engineering problems in large, production-grade repositories, and it classifies exactly why it fails when it cannot.

Unlike existing benchmarks (SWE-bench and its variants), NanoBench is not a dataset of single-file bug fixes on isolated repositories. It is a stress-test built from real merged pull requests in high-complexity, multi-language codebases — tasks that require genuine architectural reasoning, not keyword-searchable surface changes. And unlike any benchmark designed for a single-vendor CLI, NanoBench evaluates across every provider Nanocoder supports: Ollama, OpenRouter, Anthropic, Gemini, and local models. The same task, the same scoring, across every model.

This is the benchmark the agent benchmarking space does not have. In May 2026, Artificial Analysis launched the first public Coding Agent Index — the first benchmark measuring full agent stacks (model + harness pairs). NanoBench does the same thing, purpose-built for Nanocoder, with the failure taxonomy depth that no existing public benchmark offers.

The project is proposed as a separate repository under the Nano Collective (`Nano-Collective/nanobench`), with Python as the primary language for the evaluation core, Nanocoder as the first and initially only harness, and a maintainer-owned roadmap that starts with a verifiable 3-task proof of concept and scales to a community-governed dataset of 20+ repositories.

---

## 2. Introduction

### Why NanoBench?

Nanocoder ships changes regularly — to its prompt builder, tool-calling logic, planning mode, context compression, and provider integrations. Currently, there is no systematic way to answer the question every release implicitly asks: *did this change make the agent better?*

The problem compounds with every new provider Nanocoder adds. When a user switches from Claude Sonnet to a local Qwen model, they have no way to know which one performs better on the class of engineering task they actually care about. And when a maintainer improves the prompt builder, they cannot tell whether the improvement holds across providers or only benefits one.

NanoBench answers both questions with the same infrastructure: a fixed set of expert-curated tasks, a reproducible evaluation pipeline, and a scoring model that tells maintainers not just *what* changed but *why*.

### Background and Motivation

The core motivation comes from a direct empirical observation. Using a real merged pull request from `google-deepmind/torax` (PR #1895) as a benchmark task, and running it through `mini-swe-agent`, the following happened:

- The task required changes to 6-8 files. The agent read **34 files** before exhausting its API quota.
- The agent edited only **2 files** — both surface-level changes — without understanding that its edits broke the JAX functional data flow.
- The agent hallucinated a `.get_contributions()` method that does not exist in the QLKNN class, failing to understand that JAX functional programming requires explicit value threading rather than imperative attribute mutation.
- The run produced a `RateLimitError` on its 32nd API call, consuming 215,400 tokens on a task that needed targeted, architecture-aware edits.

The result was `test_status: FAILED`. The failure was not a scoring edge case — it was a fundamental breakdown in codebase reasoning that existing benchmarks cannot capture because their tasks are too simple to expose it.

This is the gap NanoBench fills.

---

## 3. The Problem

### Limitations of Existing Benchmarks

The agent benchmarking space has a saturation problem. SWE-bench, which became the de facto evaluation standard for coding agents, has driven rapid progress — but that progress has exposed its structural limitations:

- **Single-language bias**: the majority of SWE-bench tasks are Python-only, with no polyglot engineering tasks.
- **Overly localized fixes**: most tasks require changes to 1-2 files. Real engineering problems span architectural layers.
- **Confounded scaffold-model effects**: SWE-bench scores vary significantly depending on which agent scaffold is used, making it impossible to attribute performance to the model or the harness independently.
- **Contamination**: a significant portion of resolved issues were incorrectly marked as resolved due to weak test cases that did not verify patch correctness. When properly filtered, resolution rates drop from ~42% to ~22% on average.
- **Data contamination**: most tasks predate significant LLM knowledge cutoffs, meaning agents can solve them from memory rather than reasoning.

Newer variants (SWE-bench Pro, SWE-bench Verified, Multi-SWE-bench) address subsets of these concerns, but none address all of them, and none are designed to evaluate a specific agent harness across multiple model providers.

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

Every task is pinned to a specific `base_commit` SHA. The evaluation runner checks out that exact commit before invoking Nanocoder. Results from a run in July 2026 must be exactly reproducible in December 2026, regardless of upstream repository changes. This is a hard requirement, not a preference.

### Real Engineering Tasks

All tasks are sourced from real merged pull requests in real production repositories. No synthetic tasks. No LLM-generated task descriptions. The "Curation Paradox" is a guiding principle: **we cannot rely on an LLM to select the tasks we use to benchmark an LLM.** If an agent already possessed the architectural depth to distinguish a syntax fix from a multi-component reasoning bottleneck, this dataset would already be obsolete. Curation must be expert-led.

### Transparency

Every inclusion decision — repository selection, task extraction, scoring rationale — is auditable. `repo_inventory.py` scores repositories on five axes and outputs a ranked `repo_list.json` that any maintainer or contributor can inspect. Task JSON files contain the issue link, PR link, ground-truth patch, required files, and test command. Nothing is opaque.

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

## 6. Proposed Architecture

### High-Level Architecture

```
Nano-Collective/nanobench/
│
├── schema/
│   └── task_schema.json          ← JSON format definition (versioned)
│
├── tasks/
│   ├── torax/
│   │   └── torax-001.json        ← task: problem, required_files, ground_truth, test_command
│   ├── ianvs/
│   │   └── ianvs-001.json
│   ├── langchain-google/
│   │   └── langchain-google-001.json
│   └── ... (5-10 repos in v1)
│
├── repos/
│   └── repo_list.json            ← scored repository registry
│
├── scripts/
│   ├── eval_runner.py            ← main evaluation orchestrator
│   ├── repo_inventory.py         ← scores and indexes repositories
│   ├── patch_extractor.py        ← isolates ground-truth patches from merged PRs
│   ├── token_counter.py          ← context-window density modeling
│   └── validate_tasks.py         ← CI integrity gate for task quality
│
├── results/
│   └── run_<timestamp>.json      ← scored results with failure taxonomy
│
├── reports/
│   └── baseline_report.md        ← human-readable benchmark analysis
│
├── CONTRIBUTING.md
└── README.md
```

### System Components

**Task Layer** — JSON files defining each evaluation unit. Each task contains:
- `repo`, `issue_url`, `pr_url`, `base_commit` (SHA)
- `problem_statement` — the engineering problem description
- `required_files` — the files an agent must touch to solve the task
- `ground_truth_patch` — the diff from the original merged PR
- `test_command` — the command that verifies correctness (`pytest`, `go test`, `yarn test`)
- `reasoning_category` — one of the taxonomy categories (cross-component dependency, functional flow integrity, etc.)
- `token_estimate`, `difficulty`, `languages`, `domain`

**Runner Layer** (`eval_runner.py`) — the evaluation orchestrator:
1. Reads task JSON
2. Clones the target repo at `base_commit` with `git clone --depth=1` then `git checkout <sha>`
3. Builds an instruction-rich prompt from `problem_statement` + `required_files` context
4. Invokes Nanocoder non-interactively:
```bash
   nanocoder --provider <provider> --model <model> --mode yolo run "<prompt>" --trust
```
5. Runs `test_command` against the modified repository
6. Scores the result (1.0 / 0.5 / 0.1 / 0.0)
7. Classifies failure mode from Nanocoder's output
8. Writes results JSON with full metadata

**Inventory Layer** (`repo_inventory.py`) — scores candidate repositories on five axes (see Dataset Design) and produces `repo_list.json`.

**Validation Layer** (`validate_tasks.py`) — a CI gate that verifies every task for reproducibility, isolation, and evaluation readiness before it enters the dataset.

### Evaluation Workflow

```
eval_runner.py starts
│
▼
Load task JSON
(tasks/<repo>/<task-id>.json)
│
▼
Clone repo at base_commit
(git clone --depth=1, git checkout <sha>)
│
▼
Build prompt
(problem_statement + required_files list)
│
▼
Invoke Nanocoder
(nanocoder --provider <p> --model <m> --mode yolo run "<prompt>" --trust)
│
▼
Parse Nanocoder output
(files touched, tool calls made, tokens consumed)
│
▼
Run test_command
(pytest / go test / yarn test / make test)
│
▼
Score + classify failure
(1.0 / 0.5 / 0.1 / 0.0 + failure_mode[])
│
▼
Write results JSON
(score, failure_mode, provider, model, tokens, time, tool_calls)
```

---

## 7. Dataset Design

### Repository Selection Criteria

Repositories are scored on five axes using `repo_inventory.py`. Only repositories scoring ≥12/20 are onboarded:

| Axis | Points | Criteria |
|---|---|---|
| Language breadth | 4 | 1pt per distinct language required to solve a typical bug |
| Cross-file dependency depth | 4 | Avg files read to understand one bug, sampled from 5 closed PRs |
| Post-Jan-2026 activity | 4 | ≥2 merged PRs/month = 4pts; ≥1/month = 2pts; less = 0pts |
| Domain novelty | 4 | 0 if domain already covered; 2 if adjacent; 4 if new domain |
| Context pressure | 4 | >80k tokens = 4pts; 50–80k = 3pts; 20–50k = 2pts; <20k = 0pts |

### Initial Repository Set (v1 — 5 repos, 10-15 tasks)

These repositories are selected from ones the proposer has personally contributed to and understands at an architectural level:

| Repository | Languages | Domain | Why Selected |
|---|---|---|---|
| `google-deepmind/torax` | Python, JAX | Scientific computing / plasma physics | JAX functional programming forces explicit value threading — agents cannot imperatively set attributes. Only scientific computing repo in dataset. PR #1895 already validated as a stress-test task. |
| `kubeedge/ianvs` | Python | Edge AI benchmarking | Deep knowledge of plugin architecture (scenario→testenv→algorithm→dataset→metrics). Proposer is LFX mentee with 3500+ line contributions. |
| `langchain-ai/langchain-google` | Python | LLM tooling / Google AI | Tasks span two packages simultaneously (genai + vertexai). `hallucinated_api` is the guaranteed failure mode — SDK class names differ completely between old and new Google AI SDKs. |
| `meshery/meshery` | Go, JavaScript, React, GraphQL | Cloud native infrastructure | Only Go+React+GraphQL repo. Three-language fix required. GraphQL subscription pattern not present in any other task. |
| `learningequality/kolibri` | Python, Vue.js, JavaScript | Offline educational platform | Only full-stack cross-language repo. Bugs spanning Django + Morango sync engine + Vue.js frontend require reading Python and JavaScript simultaneously. |

### Task Extraction Methodology

Tasks are extracted exclusively from real merged pull requests, not from open issues or synthetic generation. The extraction process:

1. Identify a merged PR with clear test coverage and multi-file architectural changes.
2. Use `patch_extractor.py` to isolate the golden patch from the PR diff.
3. Record the `base_commit` (the parent commit before the fix was merged).
4. Clone the repo at `base_commit` and verify the bug reproduces.
5. Confirm the `test_command` fails at `base_commit` and passes after applying the ground-truth patch.
6. Verify the Jaccard similarity of the task description against top GitHub code search results is below 0.85 to detect contamination.

### Task Schema

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

Every task's ground truth is the actual merged PR diff, surgically extracted by `patch_extractor.py`. The evaluator knows what a correct solution looks like. Partial credit is awarded when the agent navigates to the right files but implements an incomplete fix.

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

### Task Lifecycle

1. `eval_runner.py` reads the task JSON.
2. Clones the repository at `base_commit` into an isolated temp directory.
3. Builds the prompt with the problem statement and `required_files` hint.
4. Invokes Nanocoder as a subprocess with `cwd` set to the cloned repo. Since Nanocoder sets its working directory from `process.cwd()` at startup, controlling `cwd` in `subprocess.run()` makes the agent operate directly on real repository code — reading actual source files, writing actual changes.
5. After Nanocoder exits, runs `test_command` as a separate subprocess against the now-modified repository.
6. Scores the result.
7. Writes a results JSON with full metadata (score, failure mode, provider, model, tokens consumed, tool calls made, time elapsed).

### Scoring Strategy

| Score | Label | Condition |
|---|---|---|
| 1.0 | Full pass | All tests in `test_command` exit 0 and no pre-existing passing tests are broken. This is the only score that counts as a solved task. |
| 0.5 | Partial pass | At least 50% of target tests pass AND the agent modified at least one file from `required_files`. Distinguishes correct-but-incomplete from hallucinated. |
| 0.1 | Wrong approach | Tests fail, but the agent touched at least one file from `required_files`. Logic is incorrect but the agent navigated to the right part of the codebase. |
| 0.0 | Complete failure | No target tests passed AND the agent touched no required files, touched entirely wrong files, or exited with an error. Includes context-explosion failures where the token budget was exhausted before any edit. |

### Partial Credit

The 50% threshold for partial pass is intentional. A task with 10 test cases should not score 0.0 simply because one edge case was missed — that conflates "wrong direction" with "nearly right." The threshold requires both directional correctness (touched the right files) and substantive correctness (at least half the tests pass).

### Benchmark Outputs

Each run produces:
- A `run_<timestamp>.json` with per-task results (score, failure mode, provider, model, tokens, tool calls, time)
- A `baseline_report.md` with aggregated scores broken down by: provider, model, reasoning category, language, domain, and token density
- A provider comparison table showing `Provider → Model → Task → Score → Failure taxonomy` for every evaluated model

---

## 9. Failure Taxonomy

The failure taxonomy is the most important output NanoBench produces. It is the thing that distinguishes NanoBench from every existing benchmark. A score change from 52% to 55% tells you nothing. Knowing that `insufficient_context_read` failures dropped from 62% to 21% after a prompt builder improvement tells you exactly what changed and why.

### Hallucinated APIs (`hallucinated_api`)

The agent calls a method or accesses an attribute that does not exist in the codebase. Common in repos with complex SDKs (e.g., `langchain-google` where the genai and vertexai packages have completely different class hierarchies) or functional paradigms (e.g., torax where JAX prohibits imperative attribute mutation).

*Diagnostic signal: test fails with `AttributeError` or `NameError` on a symbol that doesn't exist in `required_files`.*

### Insufficient Context Reading (`insufficient_context_read`)

The agent did not read enough of the codebase to understand the architectural dependencies before making changes. Manifests as surface-level edits that miss the underlying data flow. The torax dry-run showed this clearly: the agent read 34 files but never read the files that mattered.

*Diagnostic signal: `files_read` is high but `required_files` overlap with `files_edited` is low.*

### Wrong Abstraction Layer (`wrong_abstraction_layer`)

The agent made changes at the wrong level of the architecture — editing a high-level interface when the fix needed to go into the underlying implementation, or vice versa. Common in plugin-based frameworks like Ianvs.

*Diagnostic signal: agent touched files from `required_files` but tests still fail with an interface mismatch error.*

### Missing Cross-Component Changes (`missing_cross_language_change`)

The agent fixed one component but missed a parallel change required in another language or package. Common in full-stack repos (kolibri: Python backend + Vue.js frontend) or multi-package repos (langchain-google: genai + vertexai).

*Diagnostic signal: partial tests pass (one language's tests) but the other language's tests fail.*

### Context Window Exhaustion (`context_window_exceeded`)

The agent exhausted its context window or token budget before completing the task. In the torax dry-run, a single task consuming ~52,000 tokens exhausted the Gemini free tier's daily quota on the first run. This failure mode proves that current agents cannot navigate 100k+ LOC repos without expert-verified context guidance.

*Diagnostic signal: Nanocoder exits with a context-size error or rate-limit error before `test_command` is reached.*

### Partial Fixes (`partial_fix_only`)

The agent implemented a correct fix for part of the task but missed additional required changes. Scores 0.5 (partial pass) rather than 0.0 because the agent demonstrated directional correctness.

*Diagnostic signal: some target tests pass, agent touched files from `required_files`, but full test suite fails.*

### Future Categories

As the dataset grows, additional failure categories will be introduced through the task contribution process:
- `test_not_updated` — agent fixed the implementation but forgot to update/add tests
- `correct_file_wrong_function` — agent read the right file but edited the wrong function
- `environment_agency_failure` — agent could not interpret a complex terminal traceback (e.g., JAX JIT compilation error) to iterate on a fix

---

## 10. Benchmark Infrastructure

### Repository Isolation

Every task runs in an isolated temporary directory. The evaluation runner:
1. Creates a fresh temp directory for each task.
2. Clones the repository at `base_commit` with `--depth=1` for speed, then checks out the exact SHA.
3. Runs Nanocoder with `cwd` set to the cloned directory.
4. Tears down the temp directory after the task completes.

This prevents cross-task contamination and ensures every run starts from a clean state.

### Docker & Environment Management

Repositories with complex dependency chains (C++/CUDA for vllm, Go for meshery) include a `devcontainer.json` or lightweight `Dockerfile` in their task definition. For v1 (Python-only repos: torax, ianvs, langchain-google), Docker is optional. For v2 (polyglot repos), Docker isolation is required.

### Reproducibility

- Every task is pinned to a `base_commit` SHA. SHA-pinned tasks are immutable.
- `patch_extractor.py` computes a token-level Jaccard similarity score between the task description and GitHub code search results. Tasks scoring above 0.85 similarity are flagged as potentially contaminated and require manual review before inclusion.
- All tasks require a `merged_at` timestamp from the GitHub API to verify they post-date the relevant model knowledge cutoffs.

### CI Integration

NanoBench will provide a GitHub Actions workflow that:
- Runs `validate_tasks.py` on every PR to the nanobench repo (verifies task schema, reproducibility, and test command validity).
- Optionally runs a subset of tasks (configurable) against a specified provider/model combination.
- Posts a summary comment with scores and failure taxonomy to the PR.

Maintainers can wire this workflow to run against Nanocoder PRs to catch agent regressions before they ship.

### Reporting

Each benchmark run produces:
- A machine-readable `run_<timestamp>.json` (full per-task metadata).
- A human-readable `baseline_report.md` with tables and failure breakdowns.
- A provider comparison table (for multi-provider runs).

---

## 11. Why NanoBench is Different

### Comparison with SWE-bench

| Dimension | SWE-bench | NanoBench |
|---|---|---|
| Task source | GitHub issues (automated scrape) | Real merged PRs (expert-curated) |
| Task complexity | Mostly single-file, single-language | Multi-file, multi-language, architectural |
| Contamination control | Weak (most tasks predate model cutoffs) | Strong (post-Jan-2026, Jaccard similarity check) |
| Failure analysis | Pass/fail only | 8-category failure taxonomy |
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

**Risk:** An agent solves a task from training memory rather than reasoning, producing an inflated score.

**Mitigation:** Every task is anchored to a commit merged after January 1, 2026. `patch_extractor.py` computes token-level Jaccard similarity between the task description and top GitHub code search results. Any task scoring above 0.85 similarity is flagged and replaced. The `base_commit` SHA and `merged_at` timestamp are stored in every task JSON, making contamination claims auditable and falsifiable.

### Repository Maintenance

**Risk:** A target repository undergoes major restructuring, making existing task file paths invalid.

**Mitigation:** Every task is pinned to a specific `base_commit` SHA. Structural changes to the upstream repository do not affect existing tasks. `validate_tasks.py` runs in CI and will flag any task whose file paths cannot be resolved at the pinned commit.

### Environment Drift

**Risk:** Diverse repositories (Python/JAX, Go, JavaScript) have conflicting system dependencies that cause evaluation failures unrelated to agent performance.

**Mitigation:** v1 limits the dataset to Python-only repositories where dependency management is straightforward. Polyglot repos (meshery: Go+React, kolibri: Python+Vue.js) are introduced in v2 with Docker-isolated task environments.

### Evaluation Cost

**Risk:** Running multi-provider evaluations at scale is expensive, and API rate limits make full benchmark runs slow.

**Mitigation:** v1 starts with 10-15 tasks and 2-3 provider comparisons. Expert-metadata injection (providing `required_files` hints in the prompt) reduces unnecessary file exploration by approximately 70%, cutting both cost and run time. A `--dry-run` mode validates the pipeline without invoking the agent. Local Ollama models can run cost-free for baseline comparisons.

### Benchmark Bias

**Risk:** Tasks curated by one person reflect that person's domain expertise and may not represent the full range of engineering challenges.

**Mitigation:** v1 is explicitly framed as a curated baseline, not a comprehensive dataset. The `repo_inventory.py` scoring matrix is transparent and auditable. A community contribution pipeline (introduced in v2) allows other contributors to add tasks with validation requirements that must be met before inclusion.

---

## 13. Alternatives Considered

### Synthetic Benchmarks

Synthetic tasks (generated by LLMs from codebase analysis) are scalable but untestable for quality. We cannot verify whether a synthetically generated task actually requires architectural reasoning or can be solved by a simple keyword search. Rejected on principle: an LLM cannot be trusted to select the tasks used to benchmark LLMs.

### Single-Repository Benchmarks

Benchmarking Nanocoder exclusively on the Nanocoder repository itself would produce a conflict of interest and contamination (training data likely includes the Nanocoder codebase). Rejected.

### Model-Specific Evaluation

Building NanoBench around Gemini's Live API or Anthropic's specific streaming format would violate the provider-neutrality principle that is central to Nano Collective's mission. This was the original design constraint that made the GSoC Gemini CLI version a weaker fit than the Nanocoder version. Rejected.

### Why These Were Not Chosen

All alternatives either compromise the quality of the benchmark (synthetic tasks), narrow the audience (model-specific evaluation), or conflict with Nano Collective's core principles (provider lock-in). The design described in this whitepaper is the only approach that is simultaneously rigorous, provider-neutral, reproducible, and aligned with the collective's stated values.

---

## 14. Open Questions

### Python vs TypeScript

The evaluation core (`eval_runner.py`, `repo_inventory.py`, `patch_extractor.py`, `validate_tasks.py`) is proposed in Python. Python's subprocess ecosystem, test-runner parsing (pytest, go test, yarn test output formats), and data processing libraries are a natural fit for orchestration code that runs multiple languages' test suites. Since `nanobench` is a separate repository from `nanocoder`, it does not need to share a build or lint toolchain with the main TypeScript codebase. This is confirmed by will-lamerton (Nano Collective member) in issue #621.

### Automatic vs Human Evaluation

The current scoring model (1.0/0.5/0.1/0.0) is fully automatic, based on test exit codes and file-touch analysis. A small number of tasks (those scoring 0.5) may benefit from human review to distinguish "correct-but-incomplete" from "plausible-but-wrong." v1 uses automated scoring exclusively. Human review as an optional layer is a v2 consideration.

### Community Task Contributions

Community-contributed tasks introduce quality risks (poorly specified problems, weak test coverage, or contaminated task descriptions). v2 will introduce a contribution pipeline with required validation steps: the contributor must demonstrate that (a) the bug reproduces at `base_commit`, (b) the ground-truth patch makes the tests pass, and (c) the Jaccard similarity score is below 0.85. Tasks that fail any of these checks are not accepted.

### Long-Term Dataset Governance

As NanoBench grows, governance questions arise: who decides which repos are onboarded, how are outdated tasks retired, and how are disputes about scoring resolved? These questions are not answered in this whitepaper and are intentionally deferred to the collective's governance process after v1 establishes a baseline.

---

## 15. Roadmap

### MVP (Proof of Concept — current state)

- ✅ 6 task JSON files across 6 repositories (torax, ianvs, langchain-google, meshery, kolibri, vllm)
- ✅ Working `eval_runner.py` with dry-run mode validated
- ✅ Failure taxonomy classification operational
- ✅ Scoring rubric (1.0/0.5/0.1/0.0) implemented
- ✅ Real empirical evidence of pipeline working end-to-end (torax dry-run, 6 days of testing)

### Version 0.1 (First Nano Collective release — immediate next steps)

- Repo scaffold: `Nano-Collective/nanobench` created with schema, tasks, scripts, and CONTRIBUTING.md
- 3 expert-curated tasks with full validation (torax-001, ianvs-001, langchain-google-001)
- `eval_runner.py` adapted to invoke Nanocoder's non-interactive run mode (`nanocoder --provider <p> --model <m> --mode yolo run "<prompt>" --trust`)
- First dry-run report shared with will-lamerton showing Nanocoder performance on all 3 tasks across at least 2 providers
- `validate_tasks.py` running in CI

### Version 1.0

- 5-10 repositories, 10-20 expert-curated tasks
- Multi-provider comparison: at least Claude (Anthropic), Gemini (OpenRouter), and one local Ollama model evaluated on the same task set
- Provider comparison table published as `baseline_report.md`
- Failure taxonomy report with breakdown by category, language, and token density
- CI workflow for Nanocoder PRs that runs a configurable subset of NanoBench tasks

### Future Directions

- v2: polyglot repositories (meshery Go+React+GraphQL, kolibri Python+Vue.js), Docker-isolated task environments
- v3: community task contributions with automated validation pipeline
- v3+: harness contribution score — measure the delta between raw API performance and Nanocoder-harness performance on the same task, isolating Nanocoder's contribution from the underlying model
- Long-term: NanoBench as the standard evaluation layer for all Nano Collective agent tooling, not just Nanocoder

---

## 16. Success Criteria

### Technical Success

- The evaluation pipeline runs end-to-end for all tasks without manual intervention.
- Results are reproducible: the same task, provider, and model produce the same score on separate runs (controlling for model non-determinism with fixed temperature where supported).
- At least two providers are compared on the same task set with meaningful score differences visible in the report.
- The failure taxonomy correctly classifies the type of failure for every non-full-pass result.

### Community Success

- The whitepaper is accepted through the Nano Collective's five-stage pipeline.
- `Nano-Collective/nanobench` is created with the proposer as maintainer and product owner.
- At least one other Nano Collective contributor submits a task that passes the validation pipeline by the end of v1.
- The baseline report is cited by at least one Nanocoder release note as evidence that a change improved agent performance.

### Research Success

- NanoBench produces at least one finding that is not available from SWE-bench or any existing benchmark: a result that is specific to Nanocoder as a harness and that changes how a maintainer thinks about a design decision.
- The failure taxonomy surfaces a failure pattern that leads to a concrete Nanocoder improvement (a prompt builder change, a context injection strategy, or a tool-calling modification).

---

## 17. Conclusion

NanoBench is the evaluation infrastructure Nanocoder needs and the benchmark the broader agent evaluation space is missing. It is built on a simple observation: the harness matters as much as the model. Nanocoder is a harness. Without a benchmark that holds Nanocoder constant and varies the model, neither maintainers nor users can make informed decisions about what actually makes the agent better.

The pipeline works. The empirical evidence is real — 6 days of testing, a confirmed end-to-end run, real failure modes surfaced on real production code. The design is sound — provider-neutral, reproducible, expert-curated, and transparent. And the fit with Nano Collective's principles is exact: privacy-respecting (all evaluation runs locally or against user-supplied credentials), local-first (Ollama support is first-class), and open for all (the task schema, scoring logic, and failure taxonomy are fully public and contributable).

The next step is moving through the Nano Collective's whitepaper pipeline, creating `Nano-Collective/nanobench`, and shipping a 3-task proof of concept that demonstrates real Nanocoder performance across two providers. Everything after that builds on a foundation that already works.

---

## 18. References

- Nano Collective / nanocoder: https://github.com/Nano-Collective/nanocoder
- Nanocoder non-interactive run mode: https://github.com/Nano-Collective/nanocoder/blob/main/docs/features/commands.md
- Nanocoder v1.26.0 release (--plain flag for CI): https://github.com/Nano-Collective/organisation/discussions/43
- NanoBench issue#621: https://github.com/Nano-Collective/nanocoder/issues/621
- Proposer's eval dataset repository (Gemini CLI version, validated pipeline): https://github.com/RONAK-AI647/gemini-cli-eval-dataset
- Torax PR#1895 (ground-truth task source): https://github.com/google-deepmind/torax/pull/1895
- KubeEdge/Ianvs PR#292 (proposer's LFX mentorship contribution): https://github.com/kubeedge/ianvs/pull/292
- Artificial Analysis Coding Agent Index (May 2026): https://artificialanalysis.ai/coding-agents
- SWE-MERA: https://arxiv.org/pdf/2507.11059
- SWE-bench+: https://arxiv.org/pdf/2410.06992
- Coding Agent Harness Comparison 2026: https://techstackups.com/comparisons/coding-agent-harness-comparison-2026/
- FeatureBench: https://arxiv.org/pdf/2602.10975
- Nano Collective project pipeline: https://docs.nanocollective.org/collective/projects/how-a-project-comes-to-life
