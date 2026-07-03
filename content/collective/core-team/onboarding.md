---
title: "Onboarding"
description: "The working playbook for bringing a new Nano Collective core team member on board: setup, first weeks, ways of working, and mutual expectations"
sidebar_order: 1
---

# Core team onboarding

This is the playbook for bringing someone onto the Nano Collective core team. It covers what we set up before they start, what their first few weeks look like, how we work together day to day, and what each side can reasonably expect of the other.

It is written to be useful, not exhaustive. The collective runs on trust and judgement rather than rules, and this page is meant to keep that intact while making sure a new member, especially one joining remotely, is never guessing about how things work. If a step here ever feels like bureaucracy for its own sake, that is a bug. Flag it.

A note on who this is for. Most people build with the collective as contributors and maintainers, with no onboarding needed beyond a project's `CONTRIBUTING.md`. This page is for the narrower case of someone joining the core team itself, often as a paid contributor working across projects. See [Core Team](/collective/core-team) for what that distinction means.

## The spirit of this

The founding team knows each other in person and meets in person two to three times a week. A lot of context lives in those conversations. The single most important thing we do when someone joins, especially someone in another timezone whom we have not met in person, is move that context into writing and into shared channels. If a decision happens in a room, it gets summarised where the new member can read it. If knowledge lives in one person's head, we get it written down.

That is not a courtesy. It is what makes a distributed team fair. Treat "would a remote member know this?" as the default test for whether something needs to be written or shared.

## Before day one

The goal is that someone's first day is about people and the work, not chasing logins. The point of contact handles this before the start date.

**Set up access.** Work through the [Access and tools](#access-and-tools) checklist below so every account and invite is ready on or before day one.

**Assign a point of contact.** Every new member has one named person on the core team who is their first port of call for anything: a stupid question, a blocker, a "who owns this?", a "how do we usually do this?". This is not a manager relationship. It is a guide so the new member never has to broadcast a small question to the whole team and wait. Who fills the role can shift from one person, or one hire, to the next.

**Fill in the onboarding sheet and send it.** Before day one, the point of contact copies the [onboarding template](/collective/core-team/onboarding-template), fills in the specifics for the person joining (who is on the core team and what each person tends to own, the channels to be in from day one, the agreed working hours overlap, what access is set up, and what the first week looks like), and sends it to them privately along with a link to this playbook. The template is the friendly welcome and the practical detail in one place. Removing the "what am I supposed to do now?" feeling on the first morning is most of the job.

**Agree a working-hours overlap.** With members in different timezones, settle on a window of hours that reliably overlaps so there is a predictable time for real-time back and forth, whether that is a call or live messaging. It does not need to be long. It needs to exist and be written down so everyone can rely on it.

## The first week

The first week is for orientation and a first real contribution, not for output. Nobody is expected to be productive in week one.

**Read the collective.** The new member reads the docs that explain how NC thinks and operates, in roughly this order:

- [Introduction](/collective) for what the collective is and why.
- [Brand Guidelines](/collective/organisation/brand) for voice, naming, and how we talk about the work. This matters early because it shapes everything written, including code comments and PR descriptions.
- [Governance](/collective/organisation/governance) for how decisions get made and how contribution and maintainership work.
- [Economics Charter](/collective/organisation/economics-charter) for the financial model and the commitments that apply to anyone doing paid work.
- [Creating a New Project](/collective/projects/creating-a-new-project) and [Stack Suggestions](/collective/projects/stack-suggestions) for the shared engineering conventions every NC repo follows.

**Meet the team.** A real-time session early in the week, by call or live chat, whichever the people involved prefer, to get to know each other, walk through what everyone owns, and answer questions. Keep it human. For someone joining a team that already knows each other, the social side is not optional.

**Get the environment running.** Clone the projects in scope, follow each repo's `CONTRIBUTING.md`, and get a local build and the tests passing. If setup instructions are unclear or wrong, fixing them is a genuinely useful first contribution and exactly the kind of thing a fresh pair of eyes catches.

**Ship one small thing.** Pick a task that is small, well scoped, and low risk, and take it all the way to a merged PR: a `good first issue`, a docs fix, a clear bug. The point is to run the full loop once (branch, PR, review, merge) so the mechanics and the review culture are familiar before anything larger.

## The first month

By the end of the first month the aim is for the new member to be working with normal independence: picking up scoped work, opening PRs without hand-holding, and knowing who to ask when stuck.

**Ramp into real work.** Move from the first small task into substantial pieces of work across the projects in scope. For anything larger than a self-contained change, follow the norm of proposing first set out in [Governance](/collective/organisation/governance#how-contribution-works): a quick issue or message before starting, so effort goes where it is wanted.

**A standing one to one.** A short recurring check-in between the new member and their point of contact, weekly to start. A call or a written thread both work; use whatever the two people find easiest. It is for blockers, feedback in both directions, and anything that needs more than a passing message. Keep it as long as it is useful and let it taper as things settle.

**A check-in at four weeks.** Near the end of the first month, a deliberate conversation in both directions: how is it going from their side, how is it going from ours, what is unclear, what should change. This is the moment to surface anything that is not working while it is still easy to adjust.

## How we work together

This is how the core team coordinates day to day. It is the part most worth getting right for a distributed team.

**Async by default, real-time when it helps.** Because we are not all in the same timezone, the default is asynchronous: written, in a shared channel, readable later. We go real-time for the things that genuinely benefit from it, such as kicking off something ambiguous, working through disagreement, or just keeping the team human. Real-time can mean a call or a live messaging thread; people differ in what they are comfortable with, and writing is a perfectly good substitute for talking. What matters is that real-time conversation is not the only place decisions happen.

**Decisions get written down.** A decision that lives only in someone's memory or in a call the whole team did not attend is not really shared. Anything that affects more than one person or project gets captured where everyone can find it: the relevant GitHub issue or PR, a Discussion, or the docs. This is doubly true for anything decided in one of the in-person syncs. If you were in the room, you own writing up what was decided.

**Where things live.**

- **GitHub** is the source of truth for all work: issues, pull requests, and Discussions. If it is about the code or the roadmap, it belongs here.
- **Discord** is for real-time chat, quick questions, and coordination. The core team has its own channel for this.
- **Real-time conversation** is for the things that are easier worked out live, whether by call or by a focused messaging thread in the agreed overlap window. Not everything needs it, and a call is never mandatory. What matters is that at least one of the regular core team syncs includes remote members, so they are part of the standing rhythm rather than catching up after the fact.

**Communication norms.**

- Default to over-communicating early. A short "here is what I am working on and where I am stuck" is always welcome and never annoying.
- Make blockers loud. If you are stuck, say so the same day rather than burning a day quietly. Asking early is a sign the system is working, not a failure.
- Respect async. Nobody is expected to reply instantly outside the agreed overlap hours. Do not expect others to either.
- Write so a future reader understands. The person reading your message may be doing so hours later in another timezone with none of the context you have right now.

## What we expect of each other

Kept deliberately as a two-way list, because that is what it is.

**What the collective expects of a core team member:**

- **Follow-through.** Do what you said you would, and if something changes, say so early. Reliability matters more than speed.
- **Communication.** Be reachable during the agreed overlap hours, keep work visible, and raise blockers promptly.
- **Judgement that fits the collective.** Learn the voice, the values, and the quality bar, and let them guide the work. The [Brand Guidelines](/collective/organisation/brand) and the project conventions are the reference.
- **Care for the whole, not just the task.** Core team membership carries a responsibility for the collective's health, not only the ticket in front of you.

**What a core team member can expect of the collective:**

- **Context and access.** The information, accounts, and people you need to do the work, without having to extract them one at a time.
- **A real point of contact.** Someone whose job is to unblock you and answer the small questions.
- **Honest, timely feedback.** You will hear how it is going, in both directions, while there is still time to act on it. No surprises at a review.
- **The commitments in writing.** The financial and procedural terms in the [Economics Charter](/collective/organisation/economics-charter) and [Governance](/collective/organisation/governance) apply to you, including the rule that terms in force when you start work keep applying to that work.

## Access and tools

The accounts and invites a new core team member typically needs. Trim or extend per role; not every member needs every item. The point of contact owns getting these set up before day one.

- **GitHub.** Membership of the [@Nano-Collective](https://github.com/Nano-Collective) organisation, with access to the project repositories in scope and the appropriate team or role.
- **Discord.** An invite to the [server](https://discord.gg/ktPDV6rekE) and the core team channel, with the right role.
- **Email.** An `@nanocollective.org` address, if the role calls for one.
- **Credentials.** Shared credentials are granted in isolated scopes, as and when a piece of work actually needs them, rather than broad access to everything up front.
- **Internal coordination.** Access to any internal planning or coordination space the core team uses beyond GitHub and Discord.
- **Paid contributor setup.** For paid contributors, the agreed terms (scope, rate, cadence, invoicing) written down and the expense or payment flow set up. Specifics are handled privately and are not recorded in these public docs.

## Questions

If anything here is unclear, out of date, or does not match how the core team actually works, that is worth fixing. Raise it with your point of contact, in the core team channel on [Discord](https://discord.gg/ktPDV6rekE), or by opening an issue or PR on the [docs repository](https://github.com/Nano-Collective/docs). Email [hello@nanocollective.org](mailto:hello@nanocollective.org) for anything you would rather keep off the public channels.

This page is versioned in the docs repository like the rest of the site. It is an early version written for a small team and is expected to change as the collective grows.
