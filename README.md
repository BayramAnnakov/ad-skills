# Ad skills for Claude Code

Three skills for small teams and solo founders who make their own paid social ads, extracted from a real campaign
(a cohort course, September 2026) and the reviews that followed it.

| Skill | Use it to | Hands off to |
|---|---|---|
| `newsjack-ads` | Find a news story your audience saw this week, match it to something literally true about your product, and get approved ad spines | `video-ads` |
| `video-ads` | Turn a brief or a spine into upload-ready vertical videos and statics, checked automatically and through a publication gate | `ad-test-loop` |
| `ad-test-loop` | Plan what a test can answer for its budget, launch without silent defaults, read results without fooling yourself | back to the other two |

Each skill works when installed alone (the shared templates and the publication gate ship inside each), and they hand
off to each other when installed together. None of them spends money, publishes, or launches without an explicit yes
for that action.

## Install

```bash
git clone https://github.com/BayramAnnakov/ad-skills ~/ad-skills
mkdir -p ~/.claude/skills
ln -s ~/ad-skills/skills/newsjack-ads ~/.claude/skills/newsjack-ads
ln -s ~/ad-skills/skills/video-ads     ~/.claude/skills/video-ads
ln -s ~/ad-skills/skills/ad-test-loop  ~/.claude/skills/ad-test-loop
```

Then, in the project that owns your ads, copy `skills/video-ads/templates/ADS.md` to the project root and fill in what
you know: product facts, audience, where they read, house rules, what is live, tools. All three skills read it.

## Requirements

- Claude Code (or another agent that reads `SKILL.md` skills), with web search for `newsjack-ads`.
- For `video-ads`: Node 18+, ffmpeg, ffprobe and shasum, network access on the first render. `npm ci` in your copy of
  `skills/video-ads/template/` (npm 11 may warn that esbuild's install script is not allow-listed; rendering works).
- Optional, paid, each behind a per-run approval: an image generator, a footage generator (the helper supports the
  Runway API), an ad account. Optional: independent AI reviewers from other vendors for the publication gate.

## Verify

```bash
scripts/verify-package.sh          # frontmatter, no personal strings, referenced files exist inside each skill, shared copies identical, unit tests
scripts/verify-package.sh --full   # plus a fresh copy of the template: npm ci, typecheck, render and check every example
                                   # (work files in out/verify, or VERIFY_DIR)
```

The template's check was tested against deliberately broken ads (see `skills/video-ads/references/build-and-verify.md`),
and the footage helper against mocked API failures (price above cap, concurrent runs, HTTP 403 and fake downloads,
stuck polling, an over-bill found at resume, invalid ledgers, stale locks). No test calls a paid API. These are the
author's runs: `ISSUES.md` says which claims an outside reviewer re-checked.

## Licensing

- Code in this repository: MIT (`LICENSE`). Prose, templates and references: CC BY 4.0 - use them, adapt them,
  credit the repository.
- Remotion is not MIT: its free license covers individuals, for-profit companies with up to 3 employees, non-profits
  and evaluation; other companies need a company license (`node_modules/remotion/LICENSE.md` after install).
- Sample assets in `skills/video-ads/template/public/sample/` were made for this repository and carry no third-party
  rights.
- Generated images and footage are subject to the generator's terms; your ads are subject to the ad platform's
  policies. The skills' publication gate is an editorial checklist, not legal advice.

## Before publishing this repository (owner's checklist)

- [ ] Choose the licence above.
- [ ] Confirm `skills/newsjack-ads/references/worked-example.md` may be public (it names the course and quotes its
      published ads; no account data, budgets or performance).
- [ ] Confirm the aggregate campaign numbers quoted as evidence may be public: `video-ads/references/generation.md`
      (1,280 comparison credits), `ad-test-loop/references/measurement.md` (33 of 51 sessions, 7 of 9 events, 30 clicks
      vs 15 sessions).
- [ ] Set `<repo-url>` in the install block.
- [ ] `scripts/verify-package.sh --full` passes.
