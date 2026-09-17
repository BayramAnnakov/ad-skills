# Test design for small ad budgets

## Two different questions

- **Allocation:** "which of these complete ads should get the money?" Put the ads in one ad set and let delivery
  optimize, or give each its own ad set. The answer is about those ads as a whole, not about any single element.
- **Effect:** "does this change (illustration vs footage, headline A vs B, sound vs silent) make a difference?" Hold
  everything else equal: one story, one audience, one destination, the change as the only difference. Use the
  platform's randomized split test (Meta: A/B test in Experiments) when you need non-overlapping audiences; separate ad
  sets with equal budgets do not randomize who sees what.

## The confound that bit a real test

A campaign put three stories into each of two ad sets that differed only in the news beat (illustration vs generated
footage), with equal budgets. Inside each ad set, delivery shifts spend towards the ad it predicts will win within
hours. Arm A could spend mostly on story 1 and arm B mostly on story 2, and "footage beat illustration" would then mix
the story, the delivery and the treatment. Reading it per story pair helps, but each pair still had different
delivery and possibly different audiences: report such a test as counts and a screen. For an effect question, design
one matched pair per question in a split test.

## Budget, events and what can be concluded

- Expected events per arm = budget per arm / conservative cost per event. `scripts/arms.mjs plan` turns that into the
  chance of seeing a true difference and the smallest difference the budget can detect.
- Worked numbers (alpha 0.05): 5 expected events per arm detects a 2x difference 18% of the time and needs about a
  3.9x difference for 80% power. 75 events per arm detects about 1.6x. Below ~10 events per arm, a test is a screen for
  gross failures, not a winner-picker.
- The learning phase is a delivery state, not a statistical threshold. A short promotion can be commercially useful
  without exiting it, and exiting it proves nothing about a winner.
- Three stories x two variants at a small daily budget spreads a few dollars per ad per day: decide up front which
  question the budget answers, and pay for that one.

## Loss limits instead of "CTR" kill rules

A rule like "stop at $45 with zero conversions AND CTR under 0.5%" never stops an ad with a good CTR and no buyers.
Set a loss limit per creative from the economics: for example, the spend at which zero qualified actions would already
be unlikely if the ad were as good as the control (about 3x the control's cost per qualified action). A first campaign
has no control: use the pessimistic end of the planned cost range. If the limit exceeds the arm's budget, the budget
is the limit and the test is a screen. Clicks and CTR explain a result; they do not rescue one.

## Expiry

Date-bound ads (a news story, a price deadline, "starts on") need a stop that happens. If the platform cannot stop a
single ad on a date, give the ad its own ad set with an end date, or record an owner and a reminder, and check that
the pause happened.
