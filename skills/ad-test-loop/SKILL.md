---
name: ad-test-loop
description: |
  Plan, launch and read paid social ad tests so the spend buys a decision: a test plan before production, a safe
  launch in the ad platform (Meta Ads Manager recipe included), day-0 instrumentation checks that account for platform
  crawlers, a results read on a fixed date reconciled with real leads and payments, and the write-back of what was
  learned. Use when the user asks to launch, publish or set up ad sets or an A/B test, to check whether tracking works,
  to read campaign or creative performance, to decide what to pause, keep or scale, or asks "how are the ads doing".
  Launching or editing anything live requires the user's explicit yes on the final setup, every time.
---

# Ad Test Loop

Creative production only pays when downstream evidence changes the next spending decision. This skill owns the three
moments where that goes wrong: deciding what a test can answer before paying for it, launching without silent
defaults, and reading results without fooling yourself.

Read the project's `ADS.md` first (template: `templates/ADS.md`): accounts, analytics, backend tables, the campaign
record, the house rules.

## Hard gates

- **Nothing delivers an impression without the user's explicit yes on the final setup** (every ad set and ad,
  destination, budget, schedule, audience). Through a UI that means drafts. **Through an API or MCP, building is
  creating, so every object is created with `status: PAUSED` and stays paused until that yes**; an unpaused create
  is a launch, whatever it was called. Activation, budget increases and edits to a live ad each need their own yes.
  Pausing and stopping never do: if a claim expires, a stop date passes or a loss limit is hit, pause first and
  report it. A launch package from video-ads is an input, not a
  permission. The platform's "publish" button may publish every draft in the account: read the list first.
- **The launch package has a completed publication checklist** (`references/publication-gate.md`): claims,
  rights, synthetic media, special-category classification, stop dates, cold-viewer check. Missing items block launch.
  A cold-viewer line reading "synthetic panel only, human check not done" clears a **screen** and blocks a
  **scale**: raising budget on a creative no human outside the project has ever watched is not a decision the
  package supports.
- **Never exclude a country, city or audience on site-traffic data alone.** Short sessions from a place say nothing
  about the buyers who live there; a country with past purchases stays until ad-level results say otherwise.
- **No verdict without a denominator.** Every claim about a winner states events, exposure and the arms.mjs verdict.

## 1. Test plan, before production (`templates/test-plan.md`)

- The decision the test must inform, and the possible answers including **inconclusive**.
- The kind of question: **allocation** (which complete ads to keep spending on) or **effect** (does this one change
  cause a difference). They need different designs (`references/test-design.md`).
- Treatment, control (an evergreen ad, or the current best), what differs (one thing for an effect question), the
  optimization event, destination, attribution window.
- The judging metric: a qualified action close to money (lead, checkout start, payment), with the proxy the platform
  optimizes for named separately, and how the two relate.
- Budget per arm, in one currency, and a conservative cost per event: `node scripts/arms.mjs plan --budget <per arm>
  --cost <cost>`. A new account has no cost history: plan with a range (for example the pessimistic and the optimistic
  end of what similar offers report) and treat the first days as a pilot that measures it. If the budget cannot detect
  the difference that matters before the ads expire, shrink the question (a screen for gross failures), merge arms, or
  do not run it.
- The total cost of the answer: media budget plus generation and production spend. If the answer is not worth that,
  change the plan before producing anything.
- Judge date (not before the conversion lag), stop dates, the loss limit per creative, and who pauses what when. When
  the loss limit is larger than the arm's whole budget, the budget itself is the limit: say so in the plan, and do
  not call any result a winner.

## 2. Launch (`references/meta-ads-manager.md` for Meta)

Clone a proven setup when one exists (a first campaign: follow "No proven setup" in the reference); turn off every
default that changes what the viewer sees or
how conversions count; one variant per ad set when variants must be compared; show the user the final setup and wait
for the yes; after publishing, read back every ad (destination, `utm_content`, both media, AI disclosure, optimization
event, budget, status). Write the campaign record (`templates/campaign-record.md`) the same day: IDs, UTMs, event
definitions, what was deliberately not launched and why, stop dates with owners.

## 3. Day 0: does the measurement work? (`references/measurement.md`)

Within hours of publishing: events arrive in the platform, sessions with the right `utm_content` arrive in analytics,
a test lead reaches the backend. Expect the platform's own review systems to open every new or edited ad URL: mark
those sessions and events as suspected automation, report numbers with and without them, and never judge an ad on
day 0. Record every tracking change with its timestamp: numbers before and after it are different quantities.

## 4. Read on the judge date (`templates/results-read.md`)

- Per arm and per creative: spend, impressions, link clicks, landing sessions (suspected automation separated),
  engaged sessions, qualified actions from the backend, payments. Reconcile platform conversions with backend rows.
- For a randomized split or one matched pair: `node scripts/arms.mjs compare A=<events>/<spend> B=<events>/<spend>`,
  and report its verdict. "inconclusive", "screen only" and "gross failure shown" are all results: the last means
  too few events to crown a winner but an interval that excludes parity, so the losing arm is established as bad. Ads pooled in one ad set, or arms whose tracking
  changed mid-test, get counts and no verdict: the helper cannot repair unequal delivery.
- Apply the loss limit: a creative that spent its limit with zero qualified actions stops, whatever its CTR.
- End with one decision per creative: revise the opening, clarify the offer, fix the landing page, keep collecting,
  stop, or scale. Write the observation separately from the explanation you propose. **"Scale" additionally requires
  a human cold-viewer check on file** and a verdict better than "screen only"; without both, the honest decision is
  "keep collecting".

## 5. Write back

Update the campaign record (what ran, what it cost, the verdicts), the newsjack property bank status (taken until /
free), and the creative lessons (which openings and offers worked, with their denominators). A lesson without a
denominator is a hypothesis, recorded as one.
