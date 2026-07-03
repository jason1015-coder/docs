# Project Pipeline: Working Plan

A working document. Not finalised, not yet shipped to user-facing docs. The goal is to lock the shape of how an idea becomes a Nano Collective project, so the docs, website, and socials can be wired up around it.

Read this end to end before commenting. Open questions are flagged inline and gathered at the bottom.

---

## What we have today

Four things already exist that this plan needs to slot between:

1. **Whitepapers section** at `/collective/whitepapers`. Five working whitepapers live there (private-inference-proxy, prompt-scrubber, nano-os, sentinel, docs-forest). The intro page describes what a whitepaper is and how to add one, but says nothing about what happens after it merges.
2. **Creating a New Project playbook** at `/collective/projects/creating-a-new-project`. This is the conventions guide for a project that has *already* been approved. It assumes the green light has been given.
3. **Governance page** at `/collective/organisation/governance`. Describes decision-making by the founding core team. Mentions RFCs as something that happens, but does not define an RFC process.
4. **Economics Charter** at `/collective/organisation/economics-charter`. Bounties, community fund, no retrospective changes. Sets the terms for paying contributors but does not address how a new *project* gets funded.

The gap is the bridge between (1) and (2). A whitepaper exists. A repo will eventually exist. Between the two is a process nobody has written down. This plan writes it.

A second gap is recruitment posture. Today, all five whitepapers were written by people already inside the collective. The plan needs to work for that case AND for the case where someone outside NC wants to bring a new project under the umbrella. Both should flow through the same pipe.

---

## Why this matters

The collective is reaching the point where "what's coming" is as much a recruitment lever as "what's shipped". A legible pipeline does three things:

1. **Lowers the cost of proposing**. Today, a would-be builder has to guess what NC will say yes to. A documented process tells them.
2. **Surfaces work in flight**. Contributors who want to help shape something before it lands have a way to find it. Without a pipeline view, every whitepaper feels static.
3. **Powers the recruitment pitch**. "Build under the Nano Collective" is a real offer only if the path from idea to project is clear, fair, and worth taking. Brand, mission, audience, infra defaults, and access to the community fund all sit on the other end of the path. We need to be able to point at it.

Partnerships and sponsors land here too. Any partnership the collective signs should have a clear way to translate into something a contributor can pick up. The pipeline is where that happens.

---

## What a whitepaper is

Worth pinning before the stages, because the existing index reads softly on this point and the meaning of "merged" needs to be loud.

**At merge, a whitepaper is the case for building something, not a build spec.** It is an argument that the project deserves to exist, with enough shape sketched that the collective can reason about whether to back it, and with the open questions named honestly. The document then evolves through the public review window, tightening towards something a builder could pick up by the Stage 3 decision.

What needs to be true at merge:

- Problem named clearly, with "why now" landed.
- Principles it must honour (privacy, locality, openness, plus any project-specific ones).
- Proposed approach in shape form: architecture sketch, key trade-offs, failure modes. Not a full design.
- Alternatives considered, with the reasons they lost.
- Open questions listed honestly, not hidden.
- A v1.0 success picture: what would prove the idea.
- Named proposer committed to driving it.

What does NOT need to be true at merge:

- Full architecture or API surface.
- Implementation plan or timeline.
- Resolved answers to every open question.
- A named maintainer pool (that is a Stage 3 requirement, not a Stage 1 one).

**Merge does not mean endorsement to build.** It means the thinking is good enough to publish and invite public review. That is a deliberate departure from how the existing six whitepapers landed (they were merged as endorsement-by-publication). Worth being explicit about the change in framing when the canonical page is written.

The looser alternative is "whitepaper = the full build spec, just before code". Cleaner Stage 3 decision, but a much higher bar to write one, and would have killed most of the existing six at the gate. Rejected.

---

## Proposed pipeline

Five stages. Each has a clear input, a clear output, and a clear gate.

### Stage 0: Spark

Anyone with an idea raises it through one of three channels: an issue on the docs repo, an issue on the `Nano-Collective/organisation` repo, or a message in Discord. The point is a sanity check, not a gate. A maintainer or core team member responds with one of:

- "Yes, write the whitepaper."
- "Yes, but talk to X first, they're already in this space."
- "Probably not, here's why."
- "Too small for a whitepaper, just open the issue / PR on project X."

No bureaucracy. The goal is to save someone a month of writing a whitepaper for an idea that was never going to fly, and to surface anyone already working in the space.

**Output:** a green light to write, or a redirect.

### Stage 1: Whitepaper draft

The proposer writes the whitepaper following the existing structure at `/collective/whitepapers`. They open a PR against the docs repo.

PR review checks for:

- **Fit with the collective.** Aligned with privacy-respecting, local-first, open for all. If not, it goes elsewhere.
- **Genuine novelty.** Not a duplicate of an existing project or another whitepaper in flight.
- **Coherent argument.** Problem clear, approach plausible, open questions named honestly.
- **A named proposer.** Someone willing to drive the work forward, not anonymous.

Merge of the PR does NOT mean "build this". It means the thinking is good enough to publish and invite public review. That distinction needs to be loud, because right now a merge into the whitepapers section reads as endorsement.

**Output:** whitepaper merged, marked with status `In public review`, public review window opens.

### Stage 2: Public review window

The whitepaper is live on the docs site. A status banner says it's in public review and shows the date the window closes. Default window length: **30 days**.

#### How the document evolves

The proposer iterates by opening PRs against their own merged whitepaper. Two flavours:

- **Substantive PRs** from the proposer. Responding to a concern, sharpening the argument, expanding a section, adding the build spec detail that was deferred at merge. These need a maintainer review, but the bar is light: does it still hold together, does it stay on brand. Most should merge fast.
- **Editorial PRs** from anyone. Typos, broken links, formatting, small clarifications. Same review bar as any docs PR. The proposer does not have a monopoly on the document for these.

Substantive scope changes that come from people other than the proposer should be raised as an issue first, not opened as a PR cold. The proposer drives the direction; collaborators surface concerns.

The git history of the whitepaper file is the audit trail of how the thinking evolved. The state on `main` is always the canonical version.

#### Feedback channels

- **GitHub issues** opened against the docs repo with a `whitepaper:<slug>` label. The whitepaper page pulls these in live so anyone reading can see the open concerns. Open, closed, and resolved-with-PR are all visible.
- **Discord** for lightweight discussion. Anything that turns into a real concern should be re-raised as an issue so it is recorded.
- **PR comments** on the substantive and editorial PRs themselves.

#### Window resets

Not every revision restarts the clock. The rule:

- **Sharpening, clarifying, filling out, responding to a concern** → no reset. Document keeps tightening towards Stage 3.
- **Fundamental pivot in what is being proposed** (different problem, different shape of solution, different audience) → review window restarts. The community is now reviewing a meaningfully different proposal.

The proposer flags pivots openly when they happen. A maintainer makes the call on whether a change crosses the line.

#### What the proposer is doing during the window

- Responding to issues within a reasonable window (aim for a week).
- Iterating the document in response to substantive feedback.
- Converting prose into tightening build-spec detail. By end of window, the whitepaper should read like something a builder could pick up, not just an argument for why it should exist.
- Identifying other contributors interested in maintaining or co-building the project.

**Output:** sharpened whitepaper, recorded community feedback, named maintainer commitment.

### Stage 3: Build approval

At the end of the review window, the core team makes a yes / no / iterate decision. Today this is the founding core team. Over time this widens (see governance page).

The decision is documented on the whitepaper page itself as a short note. Rationale is mandatory, even for a yes. A no is not a death sentence. It usually means "not yet" or "not in this shape". The whitepaper stays in place with the decision attached.

Criteria for a yes:

- **Whitepaper has held up.** Concerns raised in review have either been addressed in the document or acknowledged as known trade-offs.
- **Maintainer commitment is real.** At least one named maintainer ready to drive the project for an initial period. Co-maintainers welcome.
- **Scope is buildable.** Av1.0 that proves the core idea is realistic within a reasonable window.
- **Fit with the collective remains true.** Nothing surfaced in review that conflicts with the principles.

If the decision is iterate, a clear list of what needs to change is recorded. The proposer comes back with another review window when ready.

**Output:** a green light, a redirect, or a documented reason for no.

### Stage 4: Build and ship

On a yes, the project enters the existing `Creating a New Project` playbook. A repo is created under `Nano-Collective`. The whitepaper stays in `/collective/whitepapers` as the historical record, with a banner pointing to the live project.

Project then follows the existing conventions: MIT licence, README + CONTRIBUTING + LICENCE, CI workflows, docs folder, launch checklist. The pipeline ends here. From this point onward, the project is just a project.

**Output:** a working Nano Collective repository.

---

## Status taxonomy

Every whitepaper carries one of these statuses, shown as a badge on its page. Terminal statuses (`Shipped`, `Paused`, `Declined`, `Superseded`) carry an archive timeline so the whitepapers section doesn't accumulate clutter over time:

| Status | Meaning | Archive timeline |
| --- | --- | --- |
| `Draft` | PR open, not yet merged. Visible on docs only if the PR has been merged to a draft branch (probably not surfaced). | n/a |
| `In public review` | Merged. Inside the 30-day review window. Issues actively invited. | n/a |
| `Build approved` | Review complete, approved to build. Maintainer named. Repo creation imminent or done. | n/a |
| `Building` | Repo live, project under active build. Whitepaper now sits as historical record. Banner links to the live project. | n/a |
| `Shipped` | Project has reachedv1.0+ and is in the projects list. Whitepaper becomes purely archival. | 90 days afterv1.0 ships, then archived. |
| `Paused` | Approved or in-progress work that has stalled. Honest label, not a hiding place. Includes the reason. | 90 days after entering `Paused`, then archived. Reactivating bumps it back into the main listing. |
| `Declined` | Reviewed, decided against. Whitepaper stays in place with the rationale attached. | 30 days after the decline, then archived. |
| `Superseded` | Replaced by a newer whitepaper or folded into another project. Links to the successor. | Archived immediately; successor is the canonical home. |

The status surface needs to be honest. A whitepaper that sat at "in public review" for 18 months without resolution is a worse signal than a "declined" or a "paused". Stale statuses should be cleaned up regularly.

### What "archived" means

Archived whitepapers do not disappear. Three things happen:

- An `archived_on: <date>` frontmatter field is added.
- The page drops out of the main whitepapers sidebar and index listing, but remains accessible at its existing URL (so external links and citations do not break).
- A dedicated `/collective/whitepapers/archive` index lists every archived whitepaper, grouped by terminal status, so the historical record is browsable.

Implementation note: the docs site already supports `hidden: true` for keeping a page URL-routable but out of the sidebar. The `archived_on` mechanism layers on top: it sets `hidden` automatically and adds the page to the archive index.

Archiving is a documentation move, not a deletion. Git history is preserved. The `proposer` and `status` frontmatter stay intact.

---

## Open versus private repos at build time

A choice worth flagging. Your rough sketch said "create the private repo and begin building". The existing collective ethos is open from day one (Brand Guidelines, Creating a New Project, Economics Charter all reinforce this).

The two options:

- **Public from day one with a `pre-v0.1` label.** On brand. Anyone can watch, comment, contribute as it forms. Risk: half-formed work is visible.
- **Private untilv1.0, then flip to public.** Lower exposure during the messy phase. Risk: contradicts the "open from day one" promise and creates a closed period that needs explaining.

**Recommendation:** public from day one. The collective's brand is built on "shape this with us, not after". A private build phase undercuts that. Mitigate the messiness with a clear README that says "this is pre-v0.1, do not expect stability". Nanocoder, Nanotune et al. were built this way.

---

## What the proposer is signing up for

A whitepaper-to-project journey is a real time commitment. Setting expectations up front:

- **30 days of active review iteration.** Responding to issues, sharpening the doc.
- **A maintainer commitment** for the initial build phase. Aim for at least 3 months of active maintainership afterv1.0.
- **Following the conventions.** Repo structure, CI, docs, brand. The playbook exists.
- **Not flying solo if you don't want to.** The collective will help find co-maintainers or contributors where it can. Solo maintenance is allowed but discouraged.

What they get, honestly framed for where the collective actually is today (2026-05-27):

- **Brand and audience.** The collective's reach, organisational identity, and existing community sit behind the project from day one. A solo project starting at zero stars and zero distribution starts under NC at a meaningfully higher floor.
- **Distribution rails.** The `@nanocollective` npm scope, the docs site, the website's project surface, the release pipeline. Built once, available to every project.
- **Infrastructure defaults.** CI workflows, docs site integration, badges, release pipelines all built to a known standard. Less to set up, more to inherit.
- **Governance commitments.** Open from day one, no retrospective term changes, no sponsor influence over the roadmap or over which contributors get bounties (per the existing Economics Charter and sponsor page).
- **A defined process for funding work.** The community fund mechanism exists (via Open Source Collective). Designated donations exist. Bespoke partnerships exist as a category. **What does not currently exist is funded balance or live partnership deals — NC is pre-sponsor, pre-partnership, pre-bounty-pool.** Honesty over flattery.
- **A path to becoming fundable.** A credible, well-argued project under NC is itself the artefact that helps unlock sponsor and partnership conversations. Builders are not just consumers of the fund; they are part of the case being made to the people who will fill it.

This last bullet matters. The collective is in the active outreach phase for both sponsors and partnerships. A proposer signing up today is signing up to a process where the funding rails exist but the volume does not yet, and where their own project's credibility is part of what changes that. The framing has to be straight about this, not aspirational.

The contributor-benefit angle is what makes the pipeline a recruitment tool. As partnerships and sponsorships land, each one flows into one or more of these bullets in a way a would-be builder can read.

---

## Migrating the existing five whitepapers

The five whitepapers currently in `/collective/whitepapers` were written before this process existed. Options:

- **(a) Grandfather them in at "in public review" from a chosen date.** A single dated note at the top of each, "in public review until 2026-06-30" or similar. Aligns them with the new process going forward.
- **(b) Treat them as drafts and start applying the process only to new whitepapers.** Cleaner, but means the existing five sit in limbo with no clear next step.
- **(c) Assess each individually.** Some may already be ready for build approval. Others may still need review. Decide per whitepaper.

**Recommendation:** (c). Each whitepaper is at a different point. NanoOS reads as much more speculative than Sentinel or DocsForest. A single batch decision over-collapses them.

---

## Where this lives in the docs

Two changes to the docs structure:

### 1. New page: How a Project Comes to Life

Lives at `/collective/projects/how-a-project-comes-to-life` (sidebar between the projects intro and "Creating a New Project"). This is the canonical description of the pipeline. Stages, gates, status taxonomy, expectations.

The current `creating-a-new-project.md` stays where it is and becomes Stage 4 of the pipeline (when the build green light has been given).

### 2. Whitepapers index gets a process header

The current `/collective/whitepapers/index.md` describes what a whitepaper is and how to add one, but says nothing about what happens after. Add a section that links to the new "How a Project Comes to Life" page and explains that merging a whitepaper opens a public review window.

Each individual whitepaper page also gets:

- A **status badge** at the top.
- A **live community feedback** section that pulls open issues with the `whitepaper:<slug>` label.
- A **decision log** at the bottom: dates, outcomes, links to the relevant issues or PRs.

---

## Where this lives on the website

Two changes:

### 1. Homepage: a "Building Next" section

A new section between `WhatsNextSection` and `SupportedBySection` (or replacing parts of `WhatsNextSection`). Shows whitepapers currently in `In public review` or `Build approved` status. Each card:

- Title and one-liner.
- Status badge.
- Days remaining in review window (if applicable).
- Number of open issues / community comments.
- Link to the whitepaper.

This is the recruitment surface. A reader scanning the homepage sees "the collective has things in flight, here is how I can join one".

### 2. Dedicated pipeline page: `/projects` or `/pipeline`

A full page showing every whitepaper, every status, every project. Visual pipeline (left to right: Whitepaper → Review → Building → Shipped). Same data, fuller treatment. Includes:

- A "Propose a project" CTA at the top, linking to the docs page and the GitHub Discussion template.
- Filters by status.
- A short FAQ on what NC offers to project proposers (brand, audience, infra, fund, partnerships).

---

## Where this lives on socials

A cadence per pipeline event:

- **New whitepaper merged → in public review.** Post: "We just published a whitepaper for [project]. Read it here. We're inviting public review for the next 30 days. Comments via GitHub issues."
- **Public review closing soon.** Post 5 days before window closes: "Last week to comment on [project]. Here's the link."
- **Build approved.** Post: "We're building [project]. Here's why we said yes and what we're aiming at."
- **v0.1 shipped.** Post: standard release announcement, with a link back to the original whitepaper.
- **Declined or paused.** Post (optional): honest treatment. "We considered [project] and decided not to build it now, here's why." Honesty here is a brand asset.

The decline / pause posts are the ones most collectives skip. Doing them is a differentiator.

Each post template should include the contributor-benefit angle where relevant: "if you want to build something under the collective, here's how the process works".

---

## Implementation order

Already shipped (kept here as a reminder of what's now in the codebase):

- ✓ `proposer` / `proposer_github` / `status` / `review_opens` / `review_closes` frontmatter fields on all six whitepapers.
- ✓ `ProposerBadge`, `StatusBadge`, `WhitepaperMeta` components in the docs repo. H1 override that injects the meta block below the page title.
- ✓ Existing six whitepapers seeded with `In public review` plus first-commit dates as `review_opens` and +30 days as `review_closes`.
- ✓ Economics Charter "Where the fund is today" tightened to reflect actual state (mechanism exists, balance is essentially zero, no signed sponsors or partnerships).

Still to land, roughly in dependency order:

1. **Canonical pipeline page** at `/collective/projects/how-a-project-comes-to-life`. Single source of truth. Stages, gates, status taxonomy, expectations, decline framing, core team self-proposal rule.
2. **Whitepapers index update** — link to the canonical page, document the new frontmatter fields (`proposer`, `proposer_github`, `status`, `review_opens`, `review_closes`), explain what merge means and what happens after.
3. **Creating a New Project cross-link** — add a note that for non-trivial new projects, the path starts with a whitepaper, and link to the canonical page.
4. **Contributor Resources page** at `/collective/organisation/contributor-resources`. Two-part structure (Available today / Building toward). Honours the sponsor page's "no roadmap influence" constraints.
5. **Contact email rollout** — add `hello@nanocollective.org` consistently across docs (Economics Charter "Questions and contact", Community page, Governance amendments, Sponsor onboarding, docs footer) and website (footer, sponsor page CTAs alongside Discord, GetInvolvedSection).
6. **Nextra issue button + label convention** — confirm the existing "Questions? Raise an issue" link is enabled on whitepaper pages, and configure it (if possible) to pre-fill a `whitepaper:<slug>` label. This is the chosen feedback channel per Q9.
7. **Archive plumbing** — `archived_on` frontmatter field handler that hides the page from the main sidebar but keeps the URL routable, plus a `/collective/whitepapers/archive` index that lists archived whitepapers grouped by terminal status.
8. **Website "Building Next" section** on the homepage. Cards for whitepapers in `In public review` or `Build approved`. Pulls from the docs frontmatter (or a generated manifest).
9. **Website `/projects` or `/pipeline` page** — full pipeline view, "Propose a project" CTA, filters by status.
10. **Website sponsor page cross-link** — small "what your support enables" link to the Contributor Resources page once that exists.
11. **Social cadence templates** — saved in `contentforest` (or a `socials/` folder), one template per pipeline event (whitepaper merged, review closing, build approved,v1.0 shipped, declined / paused).
12. **Governance page update** describing how the Stage 3 decision gets made today (founding core team, public rationale on the whitepaper page).
13. **Economics Charter formal amendment** for the Q8 expansion (multi-channel support, broader eligibility, designated-donation flow). Posted as a PR with the 30-day notice per the existing amendment policy.

Item 1 is the keystone. 2 and 3 follow immediately because they cross-link to it. 4 and 5 are independent and can land alongside 1. The rest can be sequenced as time allows.

---

## Settled positions

The original open questions, resolved 2026-05-27. Recorded here so the canonical page can be written without re-litigating.

1. **Review window length.** 30 days default. Extensions or shortenings allowed when the shape of the proposal warrants it. Any change is recorded on the whitepaper page with a reason, so the schedule stays transparent.
2. **Stage 3 decision-maker.** Founding core team, for now. Widens as the collective grows (consistent with the existing governance page).
3. **What the collective will accept.** No exclusionary "what we'd say no to" list. Positive criteria instead. The collective is interested in:
   - AI tooling that helps users keep their data private.
   - Tools that make local AI useful (running on the user's own hardware).
   - AI agents and agent workflows.
   - Open-source variants of existing proprietary software.
   - Anything that lands on the three principles: privacy-respecting, local-first, open for all.
4. **Who can propose.** Anyone. No prerequisite contribution history. Quality of the whitepaper is the filter.
5. **Build spec versus whitepaper.** One document. The whitepaper sharpens into a build spec through the review window.
6. **Public versus private repo at build time.** Public from day one.
7. **If the proposer disappears.** Any other contributor can pick the whitepaper up. After 60 days of the original proposer going dark with no successor, the whitepaper moves to `Paused`.
8. **Funding and resources for new projects (and large contributions).** Case by case, across multiple channels:
   - The community fund (existing, bounty-style).
   - Sponsor-provided resources where available (free credits, API access, compute, model access).
   - Bounties for substantial contributions to *existing* projects, not only new ones.

   A contributor or proposer asks for what they need. The core team responds with what is available. **The Economics Charter needs an explicit update to reflect this broader scope** (see "What's left to design" below).
9. **How community feedback influences the Stage 3 decision.** Two surfaces:
   - The Nextra "Questions? Raise an issue" link, which already ships on every page. Anyone can use it.
   - A `whitepaper:<slug>` label on issues raised from a whitepaper page, so they remain findable and groupable (and so a live-issues widget can be added later without changing convention).

   The core team reads everything and weighs in on threads. Decline / approve rationale at Stage 3 references the substantive issues raised.
10. **Decline criteria.** Not enumerated as a separate list. Decline = "the Stage 3 positive criteria were not met". The specific reason is written on the whitepaper page when the decision lands.
11. **Partnership-to-contributor plumbing.** Needs a dedicated surface (see "What's left to design" below). Touches the existing sponsorship pages on both the docs and the website.
12. **Concept stage between Spark and Whitepaper.** No.
13. **Core team writing whitepapers.** Allowed. The same process applies. Core-team-authored whitepapers are not auto-approved; they go through public review like anyone else's. The credibility of the process depends on this.

---

## What's left to design

The settled positions above unblock the canonical page. Two further pieces of design work remain in flight:

### Economics Charter update (from Q8)

The Charter today covers project-level bounties. The decisions above broaden it to:

- Multiple funding and resource channels (community fund, sponsor credits, partnership-provided resources).
- Eligibility extends beyond new-project proposers — large contributions to existing projects can be eligible for support too.
- A "how to ask for support" flow, since the resources are case-by-case rather than auto-allocated.

The Charter's current "what is coming" section is the right place to fold this in, with a 30-day notice per the existing amendment policy.

### Contributor Resources surface (from Q11)

A new contributor-facing page that catalogues what is actually available to contributors and project proposers. Sits alongside (not replacing) the existing sponsor-facing surfaces:

- **`nanocollective.org/sponsor`** is sponsor-facing. Tiers, what sponsorship does and does not include, how to fund.
- **`/collective/sponsors/`** in docs is operational. How a sponsor gets onboarded / offboarded.
- **Contributor Resources** (new) is contributor-facing. What a builder or contributor can actually access, and the process for asking.

Concrete proposal:

- **Location**: `/collective/organisation/contributor-resources`.
- **Cross-linked from**: pipeline page, the Charter, Creating a New Project.
- **Tone**: matches the existing sponsor page and Charter. Honest about state. No flattery. Same posture as the sponsor page's "newly launched, every spot below is open".
- **Two-part structure**:
  - **Available today**: brand, distribution rails, infra defaults, governance commitments, the *process* for funding (community fund mechanism, designated donations, bespoke partnerships).
  - **Building toward**: funded community fund balance, live sponsor and partnership deals, credit and resource pass-through. Each item gains a real entry as it lands, replacing the "building toward" placeholder.
- **Honours the existing constraints** from the sponsor page: no sponsor-directed bounty targeting, no roadmap influence purchasable, no exclusivity at any tier.

This page is what closes the loop on "Build under the Nano Collective, and here is exactly what you get and what you don't get yet". The honesty is the asset.

---

## Surfaces in motion across repos

For reference, this initiative touches three repositories:

- **`docs`** — canonical pipeline page, whitepapers index update, status / archive plumbing, Contributor Resources page, Charter amendment, Creating a New Project cross-link, archive index, status badge documentation.
- **`website`** — homepage "Building Next" section, dedicated `/projects` or `/pipeline` page. The existing `/sponsor` page is already substantial and does not need rebuilding; it may benefit from a small "for contributors and project builders" cross-link to the new Contributor Resources page once that exists, so a sponsor can see exactly what their support reaches.
- **`contentforest`** (or wherever socials live) — cadence templates for whitepaper merged, review closing, build approved,v1.0 shipped, declined / paused.

NC is currently in active outreach for both sponsors and partnerships. None are signed yet. The pipeline plan and the Contributor Resources page are part of the outreach materials: they describe the structure into which any sponsor or partner support will flow. `outreach-targets.md` and `partnerships-log.md` (currently untracked in the docs repo root) are the working artefacts for that effort.

---

## What unblocks the canonical page

Everything needed to write `/collective/projects/how-a-project-comes-to-life` is now decided. The canonical page can be drafted next, with the Charter update and Contributor Resources page following in sequence (they reference back to the canonical page).
