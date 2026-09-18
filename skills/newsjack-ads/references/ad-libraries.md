# Reading competitors' live ads

The only free source that shows what somebody else is paying to keep running. Use it for two things: to find
the shapes that survive in your category, and to avoid shipping a mechanism a competitor already owns.

## Routes

**1. The public Meta Ad Library, `facebook.com/ads/library`.** No account, no key, works in a browser. Open an
advertiser's page and you get the body text of every live ad, the creative, the start date on each one, a country
filter, a start-date filter, and a **Sort by** control offering "Impressions: high to low".

That sort is the most useful control in any of these routes, and it is the reason to start here. Note what it is
and is not: Meta publishes impression and spend numbers only for political and issue ads, so for a commercial ad
you see the **ordering** and never the numbers behind it. Meta does not document whether it ranks on lifetime or
recent delivery, so treat it as "most funded, by Meta's own reckoning" and not as a performance metric.

**2. The official Meta Ad Library API** (`/ads_archive`, Graph API). Free, needs a Meta developer app and, for
some categories, identity confirmation. Per the field reference it returns, **for all ads**,
`ad_creative_bodies` ("the text which displays in each unique ad card"), `ad_creative_link_titles` and
`ad_delivery_start_time`. `eu_total_reach` comes back for EU-delivered ads. `impressions` and `spend` are
political and issue ads only. This is the route to script a repeatable scan.

**3. An MCP wrapper, if your agent has one.** Convenient, and free of scraping credits, but wrappers expose a
subset. The Meta Ads MCP's library search returns page name, link title, creation and delivery-start times, a
snapshot URL and an estimated total, and **no body text and no impressions sort**. Those are limits of that
wrapper, not of the Ad Library. If a wrapper is all you have, say so in the report, because it changes what your
grouping can mean (see below).

**4. The other platforms' transparency products.** Free where they exist, and their coverage is narrower than
people assume:

- **Google Ads Transparency Center**: public, searchable by advertiser, broad coverage.
- **LinkedIn Ad Library**: public, searchable by advertiser.
- **TikTok Commercial Content Library**: the actual transparency product, **EEA, Switzerland and UK only**. The
  TikTok Creative Center is a different thing: an opt-in showcase of top-performing ads, not searchable by
  advertiser, and not a transparency library.
- **X and Snap** publish EU-facing repositories under the same regulation, so outside the EU expect nothing.

Outside the EU, for TikTok, X and Snap, the honest report line is **"no transparency library available for this
platform in this market"**, not an empty result presented as an absence of advertising.

**5. Paid endpoints**, which automate what the free routes already show (AnySite, Apify and similar). Priced per
request, so the usual rule applies: say the cost, get a yes for that run, and record the key location and the
price in `ADS.md`.

## The grouping rule

The common advice is that a competitor's longest-running creative is its winner, because the losers get switched
off. That is true of an advertiser who keeps single ads running. Plenty do not: one page was measured spawning
seven copies of one ad **within six seconds of each other**.

**Group on the ad body text.** Then take the span and the object count of the group, not of a single ad object.

**Why not the headline.** `ad_creative_link_titles` is the advertiser's own headline ("titles which appear in the
call to action section for each unique ad card"). Many advertisers reuse one headline, or leave it to default,
across every ad pointing at one landing page. When they do, grouping on it collapses a varied campaign into one
row. Measured on one advertiser on 18 September 2026: the headline gave **1** apparent concept and the body text
gave **20**. For an advertiser who writes a headline per ad it is a reasonable secondary key. It is never a safe
primary one.

⚠️ **Two earlier versions of this file were wrong here, in the same direction.** The first said to group by
creative title, which produced the 1-concept reading above. The second explained the rule by asserting that the
link title "is the landing page's `<title>` tag". It is not; that was one advertiser's habit generalised into a
field definition, which is the same mistake one layer down. Check a field's documented meaning before you build a
rule on what you observed it doing once.

Report three numbers:

```
pages · distinct concepts · longest span in days for one concept
```

## What survivorship can and cannot tell you

**Oldest, most duplicated and top of the impressions sort are not three independent signals.** They are
mechanically coupled: an older ad has had longer to accumulate delivery, and advertisers add duplicates to
concepts they keep funding. When all three agree you have found the concept the advertiser has **funded longest
and hardest**. Call it that. Do not call it the winner, and do not treat the agreement as three-fold
confirmation, because it is closer to one fact seen from three angles.

A creative still running is evidence somebody is still paying for it. It is not evidence it is profitable, and an
advertiser can leave a loser running out of neglect.

**Duplication does not defeat longevity.** Seven copies of one ad made in six seconds usually means one creative
pushed into seven ad sets, and each of those can run for months. The measured example above has the **most**
duplicated concept also running the **longest**. What duplication defeats is reading the age of a single ad
object as the age of the concept behind it.

**If you only used route 3, label the span a floor.** Wrapper endpoints tend to return newest first with no
duration sort, so one page of results from a query with thousands of matches always looks like nothing older is
running.

## What to record

A table with: the page, the creative concept, how many ad objects carry it, the earliest delivery start you saw,
the span, and a snapshot URL for one example. Then one line on whether the category churns or holds, and **which
route you used**, because the route determines what the span and the grouping can mean.

If nobody in the category has kept a concept running for more than a few weeks, say so plainly: the category has
no survivorship signal to copy, and you are on your own. That is an answer, not a gap to fill with a pattern.

## The line you do not cross

A competitor's live ad is a source for **shapes**: what kind of claim the category makes, what the offer looks
like, how long a concept survives. Borrow the mechanism, never the execution. Copying a live ad's wording, art
direction or joke is both a legal risk and, in practice, a worse ad, because it arrives second into an audience
that has already seen it.
