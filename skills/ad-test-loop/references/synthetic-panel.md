# Synthetic panel: a cold reader when there is no human

The cold-viewer check needs a person who is not you. A solo operator on a deadline often has none, and the
package's answer until now was "record it as not done and launch only as a screen". This is the other half of
that answer: a panel of isolated persona agents, which unblocks a screen-level launch and **does not replace the
human check before you scale**.

## The one rule

> **Use a cold reader to find defects. Use the market to rank. Do not swap them round.**

Measured on four personas against five live creatives, September 2026:

**At ranking it gave nothing usable.** On the only fair comparison available (three creatives inside one ad set,
same budget, same destination) **one of four** personas produced the true order. Four personas written from one
brief produced four different orders, and nothing in their output indicated which to believe.

**At finding defects all four agreed, and the agreements survived checking:**

| Finding | Agreement | Verified against another instrument? |
|---|---|---|
| Cannot tell what is being sold within 3 s | 4 of 4 | Yes. A separate final-cut review had reached the same conclusion independently |
| Two of these are one message in two skins | 3 of 4, unprompted | Yes, true by construction: they were the two arms of one A/B |
| The frame at second three is empty | 4 of 4 | Yes, measured on the delivered file with ffprobe `signalstats` |
| This one reads as an ad for a mobile strategy game | 3 of 4 | Yes. Opening the stimulus showed its own first frame carried a game label over cinematic key art |

That last row is the argument for running a panel at all. Three cold readers caught a category error in the first
frame that nobody who had watched the finished video had noticed.

⚠️ **This does not establish that panels cannot rank, and do not cite it that way.** At n = 5, by exhaustive
permutation over all 120 orderings, the only rank correlation reaching p < 0.05 is a perfect +1.00. The honest
claim is narrower: on a ranking question that run produced four contradictory answers and no way to choose
between them, while on a defect question the agreement was near total and checkable.

## How to run it

1. **Stimulus is the final exported file**, at phone width, not a still and not a storyboard. Our run used a first
   frame plus a three-frame strip and then scored the personas against a 3-second video-play rate, which motion
   and cutting produce and a still cannot carry. Every persona objected to this unprompted. Testing on stills and
   concluding about video is an artefact of the stimulus, not a finding.
2. **Rename the stimuli on a seeded shuffle** (A, B, C...) before any persona runs, so that a persona cannot look
   up a creative's real numbers even if it ignores the no-file rule.
3. **One agent per persona, no shared context.** In every prompt, explicitly: do not search the web, do not read
   any file other than the stimuli, and **do not spawn further agents**. Sub-agents spawn sub-agents unless
   banned.
4. **Write the personas from `ADS.md` and the property bank**, ideally before the creatives exist. Three to five.
5. **Ask defect questions only.** A ranking question wastes the instrument and produces a number you will be
   tempted to believe.

## The questions to ask

- What is being sold? Answer after 1 second, after 3 seconds, and at the end.
- What is promised, in your own words?
- What here is confusing, or would make you scroll past?
- **What category of thing do you think this ad is for?** This is the question that caught the game label.
- Who is this for, and is it you?

Never: rank these, which is best, score these out of ten.

## Reading the output

- **Unanimity is the signal. Disagreement is noise, not a tie to break.** Take anything three or more personas
  raise as a defect worth verifying, then go and verify it against the artifact itself.
- A complaint that every persona raises about a *different* creative is a statement about your stimulus or your
  prompt, not about the ads.
- Quote personas verbatim in the record. A summary of a cold read is no longer a cold read.

## Two traps, both paid for

1. **Circularity.** A persona written from a known buyer's stated problem, then asked whether the ads address
   that problem, answers what the prompt already determined. Ours answered that honestly not one of the five spoke
   to it, and that is worth
   one sentence, never a second instrument that appears to agree with your sales data.
2. **The panel will confirm what you already fear.** If you write the personas after seeing the creatives, you
   will write the objection you already suspect. Write them first where you can, and say in the record when you
   could not.

## What to record

In the launch package, against the cold-viewer line: **"synthetic panel only, human check not done"**. Plus the
verbatim answers, the agreement count per finding, and which findings you confirmed against another instrument
and how.

## What it does not do

- **It does not gate scaling.** Run the human check before you raise budget.
- **It does not rank, and it does not pick a winner.** The market does that.
- **It is not an audience test.** It models how a reader parses a creative. It says nothing about whether a market
  wants the product.
