---
name: newsjack-ads
description: |
  Turn a news story the audience saw this week into short ad concepts for a product (a course, a service, a tool) in
  the dry "Foldable since 1843" style: a headline that rides the story without naming it, resting on something
  literally true about the product. Use when the user says "newsjack", "ньюсджек", "ad on today's news", "реклама на
  инфоповоде", "Economist-style ad", "what's in the news we can use for ads", or asks for a regular news-to-ad scan.
  Also scans competitors' live ads in the public ad libraries, so use it for "what are our competitors
  running", "check the ad library", "which of their creatives have been running longest", "конкуренты
  реклама", or any request to read somebody else's live ads for the shapes that survive in a category.
  Produces a verified report with sourced stories, a property bank, approved video spines and a first-test pick.
  Production goes to video-ads and launch to ad-test-loop; this skill does not generate paid assets or launch.
---

# Newsjack Ads

Find what the audience talked about this week, match one story to something literally true about the product, and
write a short ad whose headline carries the joke without naming the news. The ad must still tell a stranger what is
sold and why it matters to them. Ship as soon as the gates allow, with a stop date. **Do not promise 24 to 48
hours**: production, the publication gate, independent review and a cold view take days, and a story picked because
it dies in five days will lose that race. That is why the test pick is the longest-lived idea, not the freshest.

Read `references/worked-example.md` once (a real run, including what went wrong) and
`references/lessons.md`. Before any competitor scan, read `references/ad-libraries.md`.

## Inputs

From the project's `ADS.md` (template: `templates/ADS.md`); ask for what is missing:
- Product facts with sources, the sales window (start, price deadlines with time zone, sales close). No ad's stop date
  may be later than the sales close.
- The audience, the ad language, and **where they read** (outlets, newsletters, channels with exact handles).
- **What is live**: the campaign record and live copy. Stories and properties already carried by a live ad are taken.
- The buyer and the decision they face (the ads must speak to it), the property bank path, where reports are saved
  (default `ads/` in the project), the reviewers available, and the prices of image/footage generation.
- Optional: a reference ad the user liked, a specific story (quick check mode), the number of ideas (default 3).

## Hard rules

- **Nothing goes live from this skill**, and nothing is sent, posted or generated for money. Launch is a separate,
  explicit request in `ad-test-loop`.
- **Every story needs 2+ independent sources you opened.** Syndicated copies of one wire story count once. Record which
  articles were read and which were seen only as headlines; unverifiable stories are dropped.
- **Every joke rests on a product property with a source** (`file:line`, a transcript line, a public page) and a
  stated boundary of truth: what the ad must not imply. Quote the property whole, never narrowed.
- **Excluded topics:** war, tragedies and disasters, anyone's death or resignation as the hook, mocking a named person.
  Politics, elections and regulation fall under platform special-category rules: reject, or flag for authorization.

## Process

### 0. Property bank (first run for a product, then reuse)
Copy `templates/property-bank.md` to the path ADS.md names (default `ads/<product>-property-bank.md`) and fill it
from the product facts and proof material before scanning: each property with its source, its shape, its boundary of
truth, and its status (free / live in <ad> until <date>). Record the path in ADS.md. A run without a bank spends most
of its time rebuilding one.

### 1. Reference check (only if a reference is given)
Find where the inspiration ad came from before copying its mechanism. "Foldable since 1843" turned out to be a spec ad,
never run by its brand: proof of shareability among marketers, not of conversion. Note what the reference can skip
that you cannot (a famous brand needs no offer). Borrow the mechanism, never the execution.

### 2. Scan (quick check mode: skip to step 3 with the given story)
Look back 2-3 weeks to see which stories are still growing or have a second wave, and weight the last 72 hours: the
test pick comes from those (step 6). Cover the topics the audience follows and **the places ADS.md lists**
(read the channels by handle; name search often fails). A spike = several major outlets within a day or two, and
the audience would recognise it from a four-word paraphrase. Keep a table: story, date, sources opened, sources seen
as headline only, which audience outlets carried it.

### 2b. Scan the competitors' live ads

A separate source from the news, and the only free one that shows what somebody else is paying to keep
running. Read `references/ad-libraries.md` first; the routes and their costs come from `ADS.md`.

Cheapest route that answers the question. For Meta, start in the public Ad Library UI: it carries the body text,
the start dates and a **Sort by** control offering "Impressions: high to low", which is the fastest way to see
what an advertiser funds hardest. The official Ad Library API returns body text for all ads and is the route to
script a repeatable scan; an MCP wrapper is convenient but usually exposes less, so say which you used. Google
and LinkedIn have their own free libraries; TikTok's, X's and Snap's are EU-facing only, so outside the EU the
honest line is "no transparency library available", not an empty result. A paid endpoint needs a stated price and
a yes for that run, like any other.

**Group on the ad body text before you say anything about longevity**, then report
`pages · distinct concepts · longest span in days for one concept`. Do not make the headline
(`ad_creative_link_titles`) your primary key: many advertisers reuse one headline across every ad pointing at a
landing page, and grouping on it collapses a varied campaign into one row. Measured on one advertiser on
18 Sep 2026, the headline gave **1** apparent concept and the body gave **20**.

The heuristic that a competitor's longest-running creative is its winner only holds for advertisers who keep
single ads running; one page was measured spawning seven copies of one ad within six seconds. Age is a property
of the ad object, not of the concept.

**Say "funded longest and hardest", not "winner".** When the oldest concept is also the most duplicated and top
of the impressions sort, that is not three independent confirmations: age buys delivery and advertisers add
copies to what they keep funding, so it is closer to one fact seen three ways. It is still the best free signal
available, and it is still not evidence of profit.

**If your route returned newest-first with no duration sort, label the span a floor**, because one page of a
thousand-match query always looks like nothing older is running.

Record the scan as a table in the report (`templates/report.md`): page, concept, objects carrying it, earliest
delivery start, span, one snapshot URL, and which route you used.

Two outputs feed the rest of the run: the shapes that survive in this category, which go to step 3, and any
mechanism a live competitor ad already owns, which is taken. Borrow the shape, never the execution.

### 3. Match by structure, not keywords
Name each story's shape first, then find a bank property with the same shape. The shape is about the structure of the
event, so it works for any product. Examples (the first rows come from a systems-thinking course; the others show the
same move for other products):

| Story shape | What kind of product property answers it |
|---|---|
| Rivals publicly agree to restrain themselves | A method for agreements that hold (a negotiation course, a governance tool) |
| A quick fix is reversed after a delay (cut people for AI, then rehire) | A skill or process that avoids the reversal (training, onboarding, a planning method) |
| "The bottleneck is now X" / record demand, sales paused | Finding and managing the real constraint (operations, capacity planning, a scheduling tool) |
| One launch, headlines call it a revolution | Change happens through accumulation over time (a habit app, a fitness or finance course) |
| A platform changes its rules overnight | Owning the audience or the data yourself (an email/newsletter course, an export feature) |
| A famous failure from skipping a step | The step the product teaches or automates (a checklist, a QA tool, a course module) |
| The answer is in, the goal is disputed | Choosing the goal, not just optimizing (strategy, leadership, product management) |

Then list where the story and the property **differ**. A difference in the mechanism that carries the lesson kills or
changes the idea (an ad said an unverifiable agreement is only a wish, over news of an agreement with outside checkers).

### 4. Kill test: one "no" kills the idea
1. Would someone who saw the story get the joke in about 2 seconds, with the news unnamed?
2. Is the property literally true with a source, and is every number sourced?
3. Does it work without mocking a person or a tragedy, and without another company's name, logo or product?
4. Did **this** audience see the story (their outlets carried it)?

Also reject: a story already owned by a viral ad; a joke that needs a claim the product's own site softens; "we do
this too" riding another brand's launch; a story or property already carried by a live ad of this product (a second
wave of that story is a refresh proposal for the live ad, not a new idea; replacing media usually re-enters review).

### 5. Write each surviving idea (templates/report.md)
- The buyer, the decision this ad speaks to, and the cost of getting it wrong (from ADS.md or the brief).
- News hook in one sentence with dated sources; the property with source and boundary; match and differences.
- Headline, 2-6 words, carrying the whole idea; one alternative at most.
- **Video spine (default format; statics only on request)**, ~16-20 s:
  1. News beat on frame 0: the news in one full-size line over a text-free illustration of the scene (or generated
     footage as an A/B candidate). With no image budget: the line alone over a strong plain ground, or a phone photo of
     an everyday object the story is about. Never a screenshot of a news site (brand, rights, and it looks like a
     repost). The line must make it unmistakable that the news is about someone else ("The
     company paused sales of its new model", never a phrasing a viewer could read as this product's own sales).
  2. The same structure happens on the product's own object (the game board, a photographed sheet, the product's
     screen), and by the middle of the ad the viewer knows what is sold and what the buyer will be able to decide
     ("In the course you find the constraint in your own team"), not only a category ("In the course we play this").
     Motion only between lines, or pointing at the line.
  3. Punch, full size.
  4. End card: a lead that bridges the punch to what the buyer gets, then product and dates.
- Sign-off: turns the joke into a claim about the product without explaining it.
- Primary text: the offer in the house sentence limit (count the sentences). It carries what the image cannot.
- Why a scroller gets it in 2 seconds: marked as a judgement until the cold-viewer check.
- Shelf life in days and the latest date, capped at sales close. Single-day events fade in about a week.
- Risks: reads as mocking; special-category classification; trademarks; claims not backed; asset rights.
- Production and cost, priced from the tool prices in ADS.md.

### 6. Be adversarial, then order and pick
- For each idea, the strongest reason it would flop.
- What a test of these ideas can show: several stories in one ad set show which ad won, not why. Hand the question to
  ad-test-loop's test plan.
- **Launch order:** the shortest-lived idea ships first or not at all. A story more than 3 days old at scan time can
  still be a sprint or a reserve, never the test pick.
- **Test pick:** the longest-lived idea, because review and delivery need days and a story that dies in 5 days wastes
  the lesson.

### 7. Report and handoff
Write the report (`templates/report.md`) in the report language from ADS.md to `ads/<product>-newsjack-<YYYY-MM-DD>.md`
(add `-2` for a second scan on the same day), and return a short summary in the user's language: headlines, hooks,
launch order, test pick. Before handing over, run the claims part of `references/publication-gate.md` on the report
(sources, observation vs forecast, match and differences, special categories). The spine approval happens once: mark
`APPROVED <date>` in the spine, and video-ads builds from that file. The rest of the gate (rights, synthetic media,
cold-viewer check, independent review) runs on the final files in video-ads, after production.
