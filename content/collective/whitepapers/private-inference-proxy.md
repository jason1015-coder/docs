---
title: "Private Inference Proxy"
description: "A working whitepaper for an open source proxy that lets users call cloud LLM providers with stronger privacy properties than a direct call. The proposer recommends the project be declined as currently scoped; reasoning is recorded in the Decision section."
sidebar_order: 1
proposer: "Will Lamerton"
proposer_github: "will-lamerton"
status: "In public review"
review_opens: "2026-05-19"
review_closes: "2026-06-18"
---

# Private Inference Proxy

Cloud LLM providers know who you are. When you call OpenAI, Anthropic, or any other hosted provider with your API key, the request carries your identity (the key, linked to your account and billing), your network location (your IP address), and your prompts (which often contain personal or organisational information). The provider can correlate every request you make over time and build a working profile of how you think, what you work on, and who you work for.

For most users today there is no way around this. Local models cover a growing share of workloads, but for frontier capability a cloud call is still often the only option. Privacy ends at the moment that call leaves your machine.

This whitepaper proposes a project to close part of that gap: an open source proxy that sits between users and cloud LLM providers and reduces what the provider, the network, and the proxy itself can learn about who is calling.

The document is published in working form so the collective can argue the shape of it before code lands. Naming, scope, and design decisions below are open.

> **Proposer's recommendation (2026-06-09): decline as currently scoped.** The proposer's reasoning is recorded in the "Decision" section near the end of the document. The whitepaper's frontmatter status is `In public review` because the collective's core team has not yet made a build / decline / iterate decision; the review window closes 2026-06-18. The rest of the whitepaper is preserved unchanged so reviewers can see the full design history.

## Problem

A direct call to a hosted LLM provider exposes the user along several axes at once:

1. **Identity at the billing layer.** Your API key is tied to your account, payment method, and often your legal identity.
2. **Identity at the network layer.** Your IP address rides on every request.
3. **Identity in the prompt itself.** Names, emails, file paths, codebase context, internal jargon. Even a carefully stripped prompt usually carries enough to fingerprint the sender.
4. **Behavioural identity over time.** The provider can correlate requests by key and observe how you ask, what you ask about, when you work, and which tools you use.

These exposures stack. A user who is careful about (3) and (4) still loses to (1) and (2). A user who rotates keys still loses to (2) and (3). There is no single fix. There are layers, and the project needs to be honest about which layers it addresses and which it does not.

## Intended audience

Privacy products only work when they are designed for a specific audience with a specific threat model. This project has two.

**Primary: developers building LLM features into apps that handle sensitive user data.** The person on the hook for the privacy promise in their own product, who needs a network-layer story they can defend in their own docs and to their own users. They will pay, will self-host if their users require it, and will compose with the Prompt Scrubber because they are already thinking in stacks. The pain is concrete: if their provider correlates a user's session, the developer is the one who has to answer for it. v1 is shaped for this audience.

**Secondary: developers who simply care about privacy** and want a purpose-built relay in front of their cloud LLM calls, regardless of whether they are shipping a product with users. The long tail of solo developers, indie hackers, privacy-curious tinkerers, and people building side projects where the privacy angle is a feature rather than a compliance requirement. This audience is broader on paper but the conversion story is softer: most say they value privacy, few will switch off a working direct call without low friction and an obvious win. The installable shape and the default Mode B posture serve this audience without extra design work.

Audiences that the project does not serve in v1, named so the boundary is explicit:

- **Activists, journalists, dissidents.** Need the strongest stack (Mode A with payment privacy, composed with the Prompt Scrubber) and need to trust NC absolutely. The technical guarantees in a non TEE v1 do not justify that trust. Strong fit conceptually, weak fit in v1, parked behind a confidential-compute milestone.
- **Businesses with formal compliance requirements.** Want SOC2 audits, BAAs, written contracts. NC will not supply any of those without becoming a different kind of organisation. Out of scope unless the collective is willing to change its structure.

Picking the audience unblocks mode scoping, billing posture, and the threat model below. The primary audience is the one v1 is sized for.

## Principles

The same three values that govern every Nano Collective project apply here, with privacy doing the heaviest lifting:

- **Privacy-respecting.** The project exists to protect users from third party providers. It must also protect users from the proxy itself. A privacy tool that quietly logs everything would be worse than the status quo, because it would launder trust.
- **Local-first.** Wherever possible, prefer local inference. This proxy is a bridge to external capability when external capability is genuinely needed. It does not exist to make cloud inference the default path, and self hosting is a first class supported mode.
- **Open for all.** The full source is open, the protocol is documented, the deployment is reproducible. Anyone can run their own instance. The Nano Collective hosted instance is a convenience, not the only path.

## Threat model

Privacy work that does not name its threat model is decoration. The project needs to be explicit about what it defends against and what it does not. A first sketch, to be argued:

**The provider building a profile from your API key and IP.**
Defended partial to strong, depending on mode. See modes below.

**The provider reading prompt content.**
Out of scope for the proxy itself. Addressed by the sibling [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) project, which runs locally and strips identifying content before the provider sees it. The scrubber reduces identity in prompt content but cannot eliminate semantic leakage. Full content protection at the provider would require emerging techniques (attested inference, secure computation) that are not yet practical at scale.

**A passive network observer (ISP, public wifi).**
Defended. TLS to the proxy, TLS from the proxy to the provider.

**The proxy operator reading prompts.**
Depends on deployment. Self hosted: not applicable. Hosted by NC: requires explicit design choices (no retention, confidential compute, or end to end techniques as they become available).

**The proxy operator correlating requests over time.**
Same as above.

**A state level adversary with legal compulsion over the operator.**
Not a goal of v1. Worth naming as out of scope until proven otherwise.

A live threat model document is more useful than a one time write up. As the project evolves, this list evolves with it.

## Proposed approach

Two modes. Both are network side proxies that handle keys and identity at the provider layer. Content layer privacy (scrubbing identifying information out of the prompt itself) is the job of a separate sibling project, the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber), which composes with either mode below.

### Mode A: Collective keyed

The Nano Collective holds API keys with each supported provider. Users authenticate to the proxy with a token issued by NC. The proxy forwards their request using an NC key. The provider sees "Nano Collective" as the caller.

What the provider learns: prompt content, and the fact that some user of NC sent it. The provider cannot link the request to a specific user without help from NC.

What NC learns: who you are (the NC token), what you asked (the prompt), and when. NC becomes the trusted party in this mode. Reducing what NC retains, and how, is a design problem in its own right (see "Reducing what the proxy itself sees" below).

Cost model: prepaid credits with token markup. The user tops up a balance with NC. Each call deducts based on actual provider token usage plus an NC margin. The margin funds the collective and the community fund described in the Economics Charter. Prepaid is preferred over post paid: it removes the risk of users overspending and leaving NC to cover the provider invoice.

**Payment privacy (optional configuration).** The credit top up is the one point in Mode A where NC has a strong link to the user's legal identity. If NC accepts a payment rail that does not bind a top up to a legal identity (cash equivalent crypto, prepaid cards, vouchers), the user becomes a pseudonymous credit holder rather than a known customer. The proxy itself behaves identically. This is the strongest end to end privacy story in the design. It is also the most operationally complex, primarily because of the payment side rather than the proxy side. See the billing infrastructure question below.

### Mode B: Bring your own key (BYOK)

The user supplies their own provider API key. The proxy forwards the request to the provider with that key. The user pays the provider directly.

What the provider learns: who the user is (the key is billing identity), what they asked, and when. The proxy does not anonymise the key. It cannot, because the key is how the provider bills.

What the proxy does protect: the user's IP address, network fingerprint, and (with care) request timing patterns and headers. The provider sees the call coming from the proxy.

What NC learns: the same content exposure as Mode A unless additional measures are taken.

Cost model: prepaid credits, same shape as Mode A. The user tops up a balance with NC, and each call deducts a per call or per token fee for the proxy service itself. The user continues to pay their provider directly for the inference. No inference cost on the collective. Prepaid keeps the cash flow shape uniform across modes and removes the failed billing risk on the NC side.

The privacy gain in Mode B is narrower than in Mode A. It is real (IP and network layer privacy, normalised fingerprints, protection from a passive observer linking your home IP with your provider account) but it does not unbind the key from the user. This limitation has to be communicated honestly. Anyone marketing Mode B as "anonymous LLM calls" would be lying.

### Composable companion: the Prompt Scrubber

A network side proxy cannot reduce what the provider reads in the prompt itself. That is the job of the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber), a separate sibling project scoped in its own whitepaper. The scrubber runs locally on the user's machine, strips identifying content from prompts and tool results, and feeds the cleaned messages to whatever LLM endpoint the user calls (direct, or through this proxy).

The two projects compose. A user running the scrubber in front of Mode A with payment privacy configured gets the strongest privacy stack the collective is offering. The scrubber can also be used entirely on its own with no NC involvement at all. The proxy and the scrubber ship on independent timelines and version cleanly together where used in combination.

This section of the doc previously described content layer privacy as "Mode C" of the proxy. The scrubber outgrew that framing as its scope firmed up. The proxy is concerned only with Mode A and Mode B from here on.

## Privacy properties by mode

A working profile per mode, sharpened against the direct call baseline. Preserved as the design history; the design itself is not being built out further, so this section is the reference shape, not a moving draft.

### Baseline: direct call (today)

- Provider sees the user's identity via their API key.
- Provider sees the user's IP.
- Provider sees the prompt content.
- User pays the provider directly.
- NC is not in the path, so no trust in NC is required.

### Mode A (NC keyed)

- Provider does **not** see the user's identity via key. The provider sees the NC key.
- Provider does **not** see the user's IP. The provider sees the proxy's IP.
- Provider sees the prompt content.
- NC sees the user's identity (the NC issued token). With payment privacy configured, NC sees only a pseudonymous credit holder rather than a known customer.
- NC sees the prompt content by default. Reducing this is what "no retention" and confidential compute are for.
- NC pays the provider. The user pays NC via prepaid credits.
- User trusts NC.
- Self hostable, in which case the operator (now the user) supplies their own provider key.

### Mode B (BYOK)

- Provider sees the user's identity via key. The key is billing identity. The proxy cannot unbind it.
- Provider does **not** see the user's IP. The provider sees the proxy's IP.
- Provider sees the prompt content.
- NC sees the user's identity (the subscriber).
- NC sees the prompt content by default.
- User pays the provider directly for inference. User pays NC for the proxy service via prepaid credits.
- User trusts NC.
- Self hostable.

### Composing with the Prompt Scrubber

The [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) runs on the user's machine before any network call. When composed with the proxy, the scrubber strips identifying content from the prompt and tool results first; the proxy then handles the network and key layer. The provider receives a scrubbed prompt from a proxy IP under an NC key.

For users who want the strongest stack the collective offers, the composition is: scrubber + Mode A with payment privacy configured. Used together, the provider sees neither the user's identity nor identifying content in the prompt, and NC sees only a pseudonymous credit holder.

## Reducing what the proxy itself sees

The honest version of this project takes "the operator should not be a privacy hole" seriously. Options to argue:

1. **No retention by default.** Log only what is required for rate limiting and abuse detection. No prompt or response retention. Aggregate metrics only. Documented in policy and enforced in code.
2. **Confidential compute.** Run the proxy inside a trusted execution environment (Nitro Enclaves, SEV-SNP, TDX, or equivalent) so that even NC operators cannot read plaintext in memory. Remote attestation lets users verify they are talking to the expected binary. Adds operational cost. Reduces required trust in NC.
3. **End to end techniques to the provider.** Not currently feasible. The provider needs cleartext to run inference. This may shift as providers ship attested inference; if it does, the proxy can become a thin relay rather than a content terminator.
4. **Self hosting.** The default privacy answer for any user who refuses to trust NC: run the proxy on your own infrastructure. Local-first applied to the proxy itself.

A defensible v1 stance: no retention by default, honest documentation of what is and is not protected, full self hosting parity. Confidential compute as a phase 2 milestone if demand and operator capacity warrant it.

## Economics

Three questions to settle: how each mode is billed, what NC's cost exposure looks like, and how a collective that does not currently have its own legal entity actually takes money.

### Billing model

Both network side modes use the same billing mechanic: **prepaid credits**. Users top up a balance with NC. Each call deducts from the balance. What the credits cover differs between modes.

**Mode A: credits cover provider tokens plus an NC margin.** NC pays the provider; the margin funds collective operations and the ring fenced community fund. Payment privacy, where configured, changes which rails the top up uses, not the underlying mechanic.

**Mode B: credits cover a per call or per token proxy fee only.** NC charges for the proxy service itself; the user continues to pay their provider directly for inference. No inference cost on the collective.

Prepaid is the right shape across both for two reasons: users cannot accidentally overspend into a debt position, and NC is not left holding the bag if a post paid invoice fails. A single credit wallet that funds either mode is the natural shape; whether the project ships it that way is a design decision.

The Prompt Scrubber, scoped in its own whitepaper, generates no direct revenue for the proxy and is not part of the proxy's economic model.

All of the above are compatible with the [Economics Charter](/collective/organisation/economics-charter). The charter's principles (transparency, ring fenced community fund, no retrospective changes) apply.

### NC's cost exposure

Mode A carries real cost on the collective: NC pays the provider for every token routed, and the markup has to cover infrastructure, headroom, and the community fund without pricing out the users for whom the privacy story is the point. Mode B carries effectively no inference cost.

If the modes ship together, Mode B revenue can offset some of the infrastructure cost that Mode A would otherwise absorb on its own. This is worth designing for rather than discovering later.

### The billing infrastructure problem (honest)

The Nano Collective does not have its own registered legal entity. It is fiscally hosted by the [Open Source Collective](https://opencollective.com/nano-collective), which is set up well for donations, grants, and reimbursing contributors, but is not a SaaS billing platform. Running a paid API of any kind through that arrangement is not solved out of the box.

Open issues, all to be argued:

- How payments are actually taken (card processor, prepaid rails, crypto) and which legal entity accepts them.
- Tax and VAT handling across jurisdictions.
- Whether commercial activity at the scale this project implies requires NC to form a legal entity, and what that would mean for the collective's structure and values.
- Whether a third party billing partner could handle the commercial layer while the rest of NC stays under OSC, and what trust assumptions that would introduce.
- How any of this affects Mode A's payment privacy configuration. The privacy preserving rails the project wants for top ups have their own legal posture, separate from standard rails.

None of these block whitepaper work. All of them block shipping. Anyone proposing a launch timeline has to engage with this directly.

## Architecture sketch

At the depth of a napkin:

- **Auth layer.** Issues NC tokens and manages user accounts. Tracks prepaid credit balances for Mode A.
- **Provider adapters.** One per supported provider. Normalises request and response shapes. Handles streaming.
- **Request scrubber.** Strips identifying headers, normalises user agent strings, optionally fuzzes timing on the response leg.
- **Rate limiter and abuse detection.** Operates on minimal signals (token usage, request counts) without persistent prompt logging.
- **Audit and metrics.** Aggregate counters only. No per request content retention by default.
- **Self host bundle.** Container image, helm chart, single binary, all viable. Same code path as the hosted instance.

The proxy is, deliberately, not a model router or a prompt rewriter. Routing across providers and prompt engineering are separate concerns. Mixing them into a privacy proxy expands attack surface and the trust requirement. A future router can sit in front of this proxy if needed.

## Alternatives considered

- **Local inference only.** Strongest privacy answer. Insufficient capability for the frontier today. This project complements local-first work, it does not replace it.
- **VPN or Tor in front of the provider call.** Addresses IP, not the key, not behavioural correlation. Many providers throttle or block known exit nodes. This project is closer to a purpose built relay than a generic anonymiser.
- **Trusting the provider's privacy policy.** Discounted on principle. The point of this project is to make that trust unnecessary.

(A standalone client side scrubber was on the original "alternatives" list, then promoted to Mode C of the proxy, then extracted into its own sibling project. See the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) whitepaper.)

## Competitive landscape

The whitepaper has not yet engaged with what already exists in adjacent space. A non exhaustive list to research properly before scoping v1:

- **OpenRouter and similar aggregators.** Route across providers behind a single key. Not primarily a privacy product. The privacy gain over direct calls is incidental and shallow. NC's differentiator over these would be the explicit privacy posture and the open source, non profit framing.
- **Generic VPNs.** Cover IP and network fingerprint for any traffic, not LLM specific. Cheap, well understood, available everywhere. Mode B competes directly with this on "purpose built for LLM traffic, with a trust story attached."
- **Project specific privacy proxies.** A handful of small projects exist in this space at varying levels of maturity, transparency, and trust. What they do well and badly should inform NC's design, and a clean comparison should appear in the project README at launch.

The question this section needs to answer: what does NC do that nothing else does, and why is the collective's posture (open source, community led, no profit motive) a defensible edge rather than just a marketing line? If the honest answer is "nothing technical, only the trust posture," that is allowed, but it has to be argued explicitly.

## Open risks

These are the concerns that were identified during the public review window. They are the entry point for the "Decision" section near the end of the document, which records how they collectively argued the project out of a shippable v1 shape. Reading these in order is the cleanest way to follow how the proposal reached its current state.

1. **Provider terms of service may forbid Mode A.** Several major providers' terms explicitly prohibit sharing API keys across users. Pooling keys to deliver Mode A may not be possible for the providers users actually want without explicit business relationships, which the collective does not currently have. If this turns out to be the case, Mode A as designed is not shippable, and the proxy project shrinks to Mode B alone. *The review-time research pass on Anthropic's Commercial Terms (D.4) and the equivalent posture at other frontier providers confirmed this risk. A "curated provider set" alternative was considered and recorded in the "Decision" section.*

2. **Mode A's privacy story in v1 is weaker than it sounds.** Without TEE (parked in phase 2), "no retention by default" is policy, not proof. v1 Mode A asks users to swap one trust relationship (with their provider) for another (with NC). Whether that swap is materially better depends on belief in NC's values, not on technical guarantees. This is a real product, but it is a narrower one than the modes section implies. *Confirmed during review; recorded in the "Decision" section as part of the reasoning for declining.*

3. **The legal entity question is structural, not operational.** Taking commercial payments at the scale this project implies almost certainly requires the collective to form a legal entity, or to partner with one. Forming an entity changes what the Nano Collective is. This is not a billing decision, it is a question about the future shape of the collective. It needs to be answered as such, not handled as an operational task. *Recorded in the "Decision" section as one of the conditions under which a future proposal could revisit the proxy at this shape.*

4. **Mode B's market is unclear.** The privacy gain over a generic VPN is "purpose built for LLM traffic and run by an organisation you might trust more." That is a marketing differentiator, not a technical one. Whether users will pay for it at the volume the project needs to sustain itself is genuinely uncertain. *Confirmed during review and recorded in the "Decision" section as the central reason Mode B alone does not earn a standalone project.*

5. **The strongest composite privacy claim depends on the scrubber landing.** Without the scrubber, the proxy on its own does not address identity in the prompt content itself. That gap is real but not a proxy problem; it is tracked in the [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) whitepaper. The risk for this project is that messaging the proxy alone as "private LLM access" without the scrubber overstates what the proxy delivers. *Recorded in the "Decision" section as the argument for shipping the scrubber standalone rather than as part of a proxy project.*

6. **No engagement with the competitive landscape yet.** See the section above. The whitepaper does not currently say what NC's defensible differentiator is beyond stated values. That answer has to exist before v1. *Surfaced during review as a contributing reason Mode A in a curated-provider shape was not pursued: the market (OpenRouter, LiteLLM, Portkey, others) is already served by better-resourced projects.*

7. **Audience is not yet picked.** Resolved: primary audience is developers building LLM features into apps that handle sensitive user data, with a secondary audience of privacy-valuing developers in general. See the "Intended audience" section. The risk that a project shaped for everyone lands well for no one is mitigated by sizing v1 for the primary audience and letting the installable shape and Mode B posture serve the secondary without extra design work. *Resolved. The audience selection was retained in the whitepaper because it is the part of the design history the rest of the decision depends on, even though the project the audience was sized for is being declined.*

## Open questions

These are the questions the whitepaper listed at publication. The reviewer-time reasoning that answered them — or surfaced that they could not be answered in a way that kept the project viable — is recorded in the "Decision" section near the end of the document. They are preserved here so reviewers can see what was open and how each line of argument was closed out.

1. **Naming.** "Private Inference Proxy" is descriptive but heavy. The collective's naming conventions allow either a "Nano" prefixed name or a lowercase hyphenated utility name. Which fits the shape of this project? *Closed: not pursued. The working title served its purpose for the whitepaper; the project is proposed as not viable, so a final name is not needed.*

2. **Modes in v1.** Both A and B, or B first and A later? B is the lightest lift but the weakest claim. A is the stronger network privacy story, especially with payment privacy configured. The provider TOS question (see Open Risks) may force the answer. *Closed: see "Decision" section. The review-time research on provider TOS confirmed that Mode A as designed is not shippable without a legal entity and provider relationships the collective does not have, and that a curated-provider Mode A would compete in a market already served by better-resourced projects. Mode B on its own does not earn a standalone project. Neither mode ships.*

3. **Sequencing relative to the scrubber.** The [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) ships on a different timeline (probably first, since it has none of the legal entity or commercial layer blockers). Decide whether the proxy waits for the scrubber, ships alongside, or ships independently and integrates later. *Closed: not applicable. The scrubber continues independently as its own project. The composition point is recorded in the "Decision" section as something a future, smaller Mode B-shaped proposal could revisit if a real use case surfaced, without needing a full proxy project.*

4. **Threat model bounds.** Where does the proxy explicitly stop? Legal compulsion, traffic analysis at the upstream proxy, side channels in shared infrastructure. Each should be named in scope or out of scope rather than left implicit. *Closed: not applicable. The threat model section above is preserved as the design history; a future proposal would need to land a concrete threat model document as part of its own graduation checklist.*

5. **Retention policy.** "No retention" is easy to claim and hard to verify. What is the minimum we must retain (abuse detection, rate limiting, billing in Mode A)? How do we prove we are not retaining more? Public dashboards, third party audits, reproducible deployment? *Closed: not applicable. The no-retention default and the verification posture (public policy, reproducible deployment, third-party audit deferred to phase 2) were the design's working answer; a future proposal carries them forward only if a project actually exists to enforce them in code.*

6. **Confidential compute in v1 or phase 2?** TEE based deployment raises the bar significantly against insider risk but it is operationally expensive and would slow down the first release. Phased, with a clear gate? *Closed: not applicable. Confidential compute was the only credible path to making Mode A's trust story not a "trust us" posture, and is recorded in the "Decision" section as one of the conditions under which a future proposal could revisit Mode A.*

7. **Billing infrastructure and legal entity.** NC has no registered entity of its own and is fiscally hosted by the Open Source Collective, which is not a SaaS billing platform. Running paid modes requires resolving: who legally accepts the money, which payment processor is used, how tax and VAT are handled, and whether the collective forms an entity or leans on a partner. This is the single biggest non technical risk to the project. *Closed: not applicable. Recorded in the "Decision" section as a structural question the collective would have to answer as a precondition for any future Mode A.*

8. **Payment privacy rails for Mode A.** On top of the broader billing question above, Mode A's payment privacy configuration needs at least one rail where a credit top up does not bind to a legal identity. Crypto is the obvious answer. The harder questions are which specific rails, what residual leakage remains at the payment step, and what compliance posture the collective takes (KYC thresholds, jurisdictions, treasury policy). *Closed: not applicable. Recorded in the "Decision" section as part of the conditions for any future Mode A.*

9. **Pricing levels.** Given prepaid credits are the preferred shape across modes: what is the Mode A margin on provider tokens, and what is the Mode B per call (or per token) proxy fee? What sustains the project without pricing out the users for whom privacy is the point or skewing incentives away from local-first? And: a single credit wallet that funds either mode, or two separate balances? *Closed: not applicable. The pricing mechanics were design-time sketching; they did not need to be settled because the project they were sketched for is being declined.*

10. **Provider terms of service.** Several providers have opinions about proxying and shared keys in their terms. We need a clean reading per provider and a position for cases where the proxy might violate TOS. We do not ship a project the collective cannot defend in the open. *Closed by the review-time research pass on Anthropic's Commercial Terms (D.4) and the equivalent posture at other frontier providers. Recorded in the "Decision" section.*

11. **Abuse handling under no retention.** Aggregated keys are abuse magnets. How do we detect and stop abuse without becoming a surveillance layer? Possible answers: hard rate limits, automated classification with no human review, opt in moderation that the user controls. None of these are perfect. *Closed: not applicable.*

12. **Self host parity.** Is the hosted instance functionally identical to the self host bundle, or do some features (shared key pools) only make sense hosted? The closer to identical, the stronger the openness claim. *Closed: not applicable.*

13. **Interaction with other collective projects.** Does Nanocoder route cloud calls through this proxy by default? The proxy is most valuable when the rest of the collective's tooling can opt in cleanly. *Closed: not applicable. If a future smaller proposal exists, the answer is "opt in, not default, until the proxy is stable" — recorded in the design history above.*

14. **Failure mode honesty.** If the proxy goes down, what is the user's path? A degraded direct call with their key (Mode B style) is a privacy regression. Documenting the failure modes is part of the contract. *Closed: not applicable. The failure mode question is the kind of thing a future proposal of any proxy-shaped project should land in its own graduation checklist.*

## Resolved in review

These questions were open when the whitepaper was published and were settled during the public review window. They are recorded here as the design history.

1. **Intended audience.** Settled: primary audience is **developers building LLM features into apps that handle sensitive user data**; secondary audience is **developers who simply care about privacy** and want a purpose-built relay in front of cloud LLM calls. The two-audience shape keeps v1 sized for the primary user (a real pain, a willing-to-pay posture, a self-host case when their own users require it) while letting the installable shape and default Mode B posture serve the secondary without extra design work. Audiences the project does not serve in v1 (activists/journalists/dissidents behind a confidential-compute milestone, formal compliance customers who would require NC to restructure) are named explicitly in the section. See "Intended audience" above.

## Decision: proposed as not viable

This whitepaper is published with the proposer's recommendation that the collective decline the project as currently scoped. The reasoning is recorded here so the work is preserved as a design history and so the conditions under which a future proposal could revisit the same ground are explicit on the page. The recommendation is a proposal to the collective, not a decision; reviewers are expected to weigh in before the review window closes.

The recommendation was reached inside the 30-day public review window, in response to feedback that pushed on three structural points the whitepaper had not honestly resolved.

**Mode A as designed is not shippable under current provider terms and the collective's legal posture.** Mode A holds provider keys at the collective and routes many users through them. Anthropic's Commercial Terms (D.4) require explicit approval to resell the Services, and the equivalent posture holds at other frontier providers. A deal is not technically impossible — OpenRouter has it — but it is a commercial-relationship problem rather than a technical one, and the collective has no legal entity, no provider relationships, and no realistic path to securing them in a v1 timeframe. A "curated provider set" alternative (LiteLLM-shaped: Mode A on top of redistribution-friendly providers only) was considered and is technically possible, but it narrows the value proposition to roughly "OpenRouter with an NC badge," in a market already served by better-resourced projects (OpenRouter, LiteLLM, Portkey, others). That is not a v1 commitment the collective should take on.

**Mode B on its own does not earn a standalone project.** Once Mode A is set aside, the v1 product reduces to Mode B. Mode B hides the user's IP, normalises the request fingerprint, isolates the provider key from the user's own environment, and provides the natural insertion point for the Prompt Scrubber. A VPN in front of a direct call covers most of the IP and fingerprint surface. The remaining Mode B advantages (purpose-built provider routing, scrubber composition point, no-retention default, open-source auditability) are real but small, and the cost of running a hosted proxy for a feature set most users can replicate with a VPN subscription is hard to justify. The "why not a VPN" question is hardest to answer for the secondary audience ("developers who just care about privacy") and the proxy does not have a strong answer for them.

**The privacy story that justifies a project lives at the scrubber, not the proxy.** The strongest stack the proxy was designed to host was always "scrubber plus proxy, composed." On inspection, the scrubber is the load-bearing piece: it addresses identity in the prompt content itself, which a network-layer proxy structurally cannot. Shipping the scrubber as a standalone project delivers most of the privacy value the proxy was meant to add, at a fraction of the operational cost, without the trust posture, the TOS exposure, or the legal-entity question that a network-side proxy carries. The proxy-shaped composition point can still be useful, but as a small relay for users who specifically want it, not as a standalone NC project.

**Where the project would have to land to be viable.** A project at this shape becomes viable when, together: a frontier-lab relationship the collective can win, or a curated set of redistribution-friendly providers worth building a Mode A aggregator on top of; a confidential-compute path that changes Mode A's trust story from "trust us" to "verify the binary"; and a clear answer to the legal-entity question that the proxy's billing posture requires. None of these are within v1 reach today. Any one of them landing would justify a new whitepaper that revisits this ground on its merits rather than as a stale phase-2 promise.

**What is happening instead.** The [Prompt Scrubber](/collective/whitepapers/prompt-scrubber) whitepaper continues separately. The scrubber is the part of the privacy stack this whitepaper reached for, and the part that earns its keep on its own. If a future need surfaces for a relay sitting in front of provider calls — say, a use case where the scrubber-plus-proxy composition is load-bearing for a real user — the smaller, honest shape of Mode B plus scrubber composition is a viable starting point; it would not need this whitepaper's scope to build, and it does not need to be a collective project rather than a community utility.

## Review path

For this proposal to be resolved at the end of the public review window:

- [x] Pick the intended audience. Settled: primary audience is developers building LLM features into apps that handle sensitive user data; secondary is privacy-valuing developers in general. See "Intended audience" and resolved item 1.
- [x] Reach a recommendation on the project's viability. Proposer's recommendation: **decline as currently scoped**. Reasoning recorded in the "Decision" section above. This is a proposal to the collective, not a final decision; reviewers may push back, in which case the recommendation is revisited.
- [ ] Reviewers weigh in before the review window closes (2026-06-18). Issues raised against the docs repo during the window are the right place to argue the recommendation.
- [ ] The core team makes a build / decline / iterate decision at the end of the window, recorded on this page.

If the core team's decision is **decline**, this page stays in place as the historical record of how the design was argued, the frontmatter status moves to `Declined` with a `status_changed_on` date, and the daily archive workflow removes the file from the docs repo after the archive window elapses (git history is the archive).

If the core team's decision is **iterate**, the whitepaper returns to public review with the resolved points applied and the open points re-scoped.

If the core team's decision is **build**, the whitepaper's open questions and graduation checklist are addressed as a precondition, the frontmatter status moves to `Build approved`, and the [Creating a New Project](/collective/projects/creating-a-new-project) playbook takes over.
