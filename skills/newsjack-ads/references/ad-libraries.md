# Reading competitors' live ads

The only free source that shows what somebody else is paying to keep running. Use it for two things: to find
the shapes that survive in your category, and to avoid shipping a mechanism a competitor already owns.

## Three routes, cheapest first

**1. The public Meta Ad Library, `facebook.com/ads/library`.** No account, no key, works in a browser.
Filter by country and by date. This is the route to hand a participant or a colleague, because it needs
nothing installed. It is also the only route that lets you filter to ads that started before a given month,
which matters for the reason in the next section.

**2. Meta's Ad Library search, if your agent has the Meta Ads MCP.** Free, and it needs no scraping credits.
Keyword plus country plus active status. Each result carries the advertiser's page name, the creative's link
title, a creation time, a delivery start time, a snapshot URL, and an estimated total for the query. It is
gated on the caller having at least one active ad account, not on the account being enabled for ad
management, so it often works when the management tools refuse.

**3. Paid ad-transparency endpoints, for the libraries Meta's route cannot reach.** AnySite covers Facebook
(`/facebook/ads`, `/facebook/ads/search`, `/facebook/advertisers`), Google (`/google/ads`,
`/google/advertisers`), LinkedIn (`/linkedin/ad_library`), Snapchat (`/snapchat/ads`,
`/snapchat/ads/search`), TikTok (`/tiktok/creative_center/ads`) and Twitter (`/twitter/ads`). Priced per
request, so it falls under the same rule as any paid call: say the cost, get a yes for that run, and record
the key location and the price in `ADS.md`. Apify publishes Ad Library actors that return a
days-running field per ad and bill per thousand results; either is fine. Reach for these when the category
you care about does not advertise on Meta.

## The rule that makes the heuristic work

The common advice is that a competitor's longest-running creative is its winner, because the losers get
switched off. That is true of an advertiser who keeps single ads running. Plenty do not.

Measured in one category in September 2026: one page was running 25 near-identical ads of the same course,
and another had spawned seven copies of one ad **within six seconds of each other**. An advertiser who
does that has no long-running creative to find, and the age of any one ad object tells you nothing about
the concept behind it.

**So group before you conclude.** Group the results by page and by creative title, then take the span of the
group, not of a single ad. Report three numbers:

```
pages · distinct concepts · longest span in days for one concept
```

The third number is the one worth having. **If nobody in the category has kept a concept running for more
than a week, the category has no survivorship signal to copy**, and that is an answer: you are on your own,
and you should say so rather than invent a pattern.

## What these endpoints cannot tell you

**They return newest first and offer no duration sort.** So the first page of results is a statement about
the ordering, not about the market. A query whose estimated total runs into the thousands will hand you
twenty rows from the last few days every time, and it is easy to read that as "nothing older is running".
It is not. Any longest-span number you compute from one page of results is a **floor**, and it should be
labelled as one. To make a real claim about longevity, either page through the results or use the public UI
filtered to ads that started before last month.

Two more limits worth stating in the report:

- Spend and impression ranges are published only for political and issue ads. For a commercial ad you get
  no performance data at all, which is why survivorship is the only signal available.
- A creative still running is evidence somebody is still paying for it. It is not evidence it is profitable,
  and an advertiser can leave a loser running out of neglect.

## What to record

A table, in the report, with: the page, the creative concept, how many ad objects carry it, the earliest
delivery start you saw, the span, and the snapshot URL for one example. Then one line on whether the
category churns or holds, and which route you used, because the route determines what the span means.

## The line you do not cross

A competitor's live ad is a source for **shapes**: what kind of claim the category makes, what the offer
looks like, how long a concept survives. Borrow the mechanism, never the execution. Copying a live ad's
wording, art direction or joke is both a legal risk and, in practice, a worse ad, because it arrives second
into an audience that has already seen it.
