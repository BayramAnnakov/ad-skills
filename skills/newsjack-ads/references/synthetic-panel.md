# Synthetic panel: a cold reader when there is no human

The cold-viewer check needs a person who is not you. A solo operator on a deadline often has none, and the
package's answer until this file was "record it as not done and launch only as a screen". This is the other half
of that answer: a panel of isolated persona agents, which unblocks a screen-level launch and **does not replace
the human check before you scale**.

## The one rule

> **Use a cold reader to find defects. Use the market to rank. Do not swap them round.**

## What the evidence is, stated honestly

One run, September 2026: four personas, five live creatives from one account.

**Ranking: the run produced nothing, and could not have.** On the only comparison that was fair (three creatives
inside one ad set) **one of four** personas produced the true order. That is what guessing looks like. A random
ordering of three items is right one time in six, so across four personas the chance of at least one hit is
**52%**, and the expected number of hits is **0.67**. The observed result is the modal outcome of the null.

It is worse than uninformative, because the "true order" was itself weak: it came from the 3-second play rates of
three ads **pooled in one ad set**. Ads pooled in one ad set do not see comparable audiences, because delivery
concentrates on whichever creative gets early engagement, so that design yields counts and no verdict. And at n = 3 no ordering can reach significance at all: the best two-sided p
available is 0.33.

**So this file does not claim panels cannot rank.** Nothing here could show that. It claims something narrower
and sufficient: **a ranking question returns numbers that look like findings and are not**, and you will not be
able to tell the difference from the output. Do not ask one.

**Defects: four personas, high agreement, and most of it checked out.**

| Finding | Agreement | Confirmed against another instrument? |
|---|---|---|
| Cannot tell what is being sold within 3 s | 4 of 4 | **Partly.** A separate final-cut review had reached this independently for two of the creatives. For a third it rests on the panel alone |
| Two of these are one message in two skins | 3 of 4, unprompted | Yes, true by construction: they were the two arms of one A/B |
| The frame at second three is empty | 4 of 4 | Yes, measured on the delivered file with ffprobe `signalstats` |
| This one reads as an ad for a mobile strategy game | 3 of 4 | Yes. Opening the stimulus showed its own first frame carried a game label over cinematic key art |

That last row is the argument for running a panel at all: three cold readers caught a category error in the first
frame that nobody who had watched the finished video had noticed.

**Caveat that applies to all four rows.** The run used a first frame plus a three-frame strip, not playback. So
the defect findings are findings about **what a still communicates**, which is most of what a scroller sees, and
none of them is evidence about pacing, timing or cuts.

## How to run it

1. **Build the stimulus, and know what it is.** An agent cannot watch an mp4. Extract an ordered frame sequence
   at a stated rate and hand that over with timestamps:

   ```bash
   ffmpeg -i out/final/<Id>-9x16.mp4 -vf fps=2 out/panel/<Id>-%03d.png
   ```

   Two frames a second is enough to catch a beat and cheap enough to read. Tell each persona, in the prompt, that
   these are ordered frames from a silent vertical video at N per second, and that they cannot judge timing.
   **Never present frames as if they were playback**, and never score a panel against a metric that motion
   produces (a 3-second play rate is produced by motion, pacing and cuts that a still cannot carry). Every
   persona in the run above raised this unprompted.
2. **Rename the stimuli on a seeded shuffle** (A, B, C...) before any persona runs, so a persona cannot look up a
   creative's real numbers even if it ignores the no-files rule.
3. **One agent per persona, no shared context.** In every prompt, explicitly: do not search the web, do not read
   any file other than the stimuli, and **do not spawn further agents**. Sub-agents spawn sub-agents unless
   banned.
4. **Write the personas from `ADS.md` and the property bank**, ideally before the creatives exist. Three to five.
5. **Ask defect questions only.**

## The questions to ask

- What is being sold? Answer at the first frame, at the three-second mark, and at the end.
- What is promised, in your own words?
- What here is confusing, or would make you scroll past?
- **What category of thing do you think this ad is for?** This is the question that caught the game label.
- Who is this for, and is it you?

Never: rank these, which is best, score these out of ten.

## Reading the output

- **Agreement is the signal.** Treat a finding raised by all personas as a defect to verify; treat one raised by
  most as worth verifying; treat a lone voice as noise. Then go and check it against the artifact itself, which
  is what turned the game-label row from an opinion into a fact.
- **Disagreement is not a tie to break.** If the panel splits, you have learned that the creative reads
  differently to different people, which is information about the creative and not a vote to count.
- A complaint that every persona raises about a *different* creative is a statement about your stimulus or your
  prompt, not about the ads.
- Quote personas verbatim in the record. A summary of a cold read is no longer a cold read.

## Two traps, both paid for

1. **Circularity.** A persona written from a known buyer's stated problem, then asked whether the ads address
   that problem, answers what the prompt already determined. Ours replied that honestly none of the five spoke to
   it. That is worth one sentence and is never a second instrument agreeing with your sales data.
2. **The panel will confirm what you already fear.** If you write the personas after seeing the creatives, you
   will write the objection you already suspect. Write them first where you can, and say in the record when you
   could not.

## What to record

In the launch package, against the cold-viewer line: **"synthetic panel only, human check not done"**. Plus the
verbatim answers, the agreement count per finding, the frame rate you used, and which findings you confirmed
against another instrument and how.

## What it does not do

- **It does not gate scaling.** Run the human check before you raise budget.
- **It does not rank, and it does not pick a winner.** The market does that.
- **It cannot judge timing, pacing or a cut.** It reads frames.
- **It is not an audience test.** It models how a reader parses a creative. It says nothing about whether a
  market wants the product.
