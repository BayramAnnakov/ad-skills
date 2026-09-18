# Issue register: review of 12 Sep 2026

Sources, round 1: **C** = external creative-director review (Codex), **M** = external open-source maintainer review
(Codex), **A** = a stranger's run of both skills (36 friction entries: 31 issues, 5 positive notes), **N** = a second
newsjack run by a first-day editor (21 entries), **O** = the author's own install-and-run test. Round 2 (bottom of this
file): **G** = package gate by Codex and Gemini, **R** = the stranger's re-run of the rewritten package.

"Verified by" names the author's own runs unless it says otherwise. The round-2 gate re-read every row against the
files; rows it found overstated were corrected below and in the round-2 table.

## Portability and packaging

| ID | Issue | Resolution | Verified by |
|---|---|---|---|
| M3, A1-3, A17, A19, A23, A32-35, O1 | Skills pointed to docs, reports, data files and repos that exist only on the author's machine | Lessons moved into each skill's `references/`; examples and templates shipped; every project-specific input comes from `ADS.md`; the publication gate ships inside each skill that needs it | `verify-package.sh` resolves references from SKILL.md, references/ and templates/ inside each skill (mutation: a planted missing reference fails); the re-run hit 0 missing paths (was 11) |
| M4 | Account ids, budgets, visitor data, participant stories and private instructions in the material | Removed from the package; the worked example keeps only published ad copy (owner confirmed public, 2026-09-17) | verifier greps for home paths, names, account-id patterns (mutation-tested with a planted id) |
| M12, A22, N11 | Overlapping descriptions; newsjack scoped to one site and one person; launch forbidden but handed off; approval asked twice | Three skills with separate boundaries (research, production, launch/read); descriptions rewritten; "a handoff never extends an authorization"; the spine is approved once and travels | Claude Code lists all three with the new descriptions after symlinking |
| M13, A12, A24, A26, A29, N2, N5 | Russian language, one course schema, one audience, one set of copy rules hardcoded | `templates/ADS.md` (identical in all skills) carries product, audience, language, where they read, house rules, live state, tools; font subsets documented | verifier checks the three copies are identical |
| A4-5 | The author's name and examples inside the rules | Rewritten as general rules with neutral examples | verifier grep |
| M7 | No licence, asset-rights record, or Remotion licence note; reference-ad borrowing unbounded | README licensing section (MIT for code, CC BY 4.0 for prose, chosen 2026-09-17); Remotion eligibility quoted from its LICENSE; `SOURCES.md` asset table; "borrow the mechanism, never the execution" | read |
| M15, O | No lockfile, engines, prerequisite check | `package-lock.json`, `engines`, `package.sh` checks node/npx/ffmpeg/ffprobe | `--full`: `npm ci` in a fresh copy under a path with spaces |

## Template and scripts

| ID | Issue | Resolution | Verified by |
|---|---|---|---|
| M11, O2, A10, A21, A30 | Template example was text on black; the components the approved ads used were missing; `Compare` failed with 404; no zero-budget object (A30 also: no zero-budget news beat) | `Picture`, `Footage` (bar crop, start offset), `TextPanel`, `Surface` + `Word`/`Arrow`/`Loop`, `MockCard`, `EndCard` themes; examples `Example`, `ExampleNews`, `ExampleNewsFootage`, stills; rights-free sample assets | `--full`: every example renders and passes the check; contact sheets looked at |
| M10, O | Renders carried an audio track; contact sheet had an empty row (6.06 s container); no dimension or crop validation | `--muted` and `-an`; cells from frame count; dimension and crop checks | check run on examples; mutation: added audio track -> FAIL |
| A14-15, M15, C4 | No command for beat stills, 4:5 frames, or safe-zone measurement; SAFE_BOTTOM not enforced; blank frame between fades | `scripts/check.mjs` (copy-only render: safe zone per frame, side overflow, frame 0, crop, fades that meet, sheet, beat stills). Covers text drawn by the lib components only (round 1 missed `MockCard` text: fixed in round 2) | mutation tests listed in build-and-verify.md, each -> FAIL, exit 1 |
| C4, M15 | Static badge 34 px and details 29 px read at ~11 px on a phone; no minimum text size; sign-off could not wrap | `MIN_TEXT` 44 / `MIN_SECONDARY` 32; the check fails on smaller `Lines`; stills 44/36 px; sign-off wraps | mutation: 30 px text -> FAIL; stills rendered and checked |
| C4 | Feed file always a crop | `<Id>-4x5` composition is rendered instead when it exists, and its margins are checked | mutation: dedicated 4:5 rendered at 1080x1350; copy 4 px from its edge -> FAIL |
| A7, A11, A18 | Where new compositions go; three names for the sources file; file naming disagreed with the script | build-and-verify.md; one `SOURCES.md` template; ids named `<project>-<creative>` so script output = upload name | read; package.sh output names |
| M1, C6 | "Hard cap" passable: 10/s default for a model billed 20/s, NaN price, Infinity cap, no per-run approval | Per-model conservative prices; env price can only raise; finite positive validation; `--approved` per run | `runway/test`: 4 tests |
| M2 | Ledger raced across processes; crash after a paid POST left no record; unreadable balance counted as zero | Reservation under a lock before the POST; held credits = max(estimate, measured); lock released on every exit | tests: concurrency (caught a lock-leak bug, fixed), unreadable balance, over-bill stop |
| M8, O | Paths resolved from the helper folder; `%20` paths; duration header mismatch; unchecked schemas; `.neg` path bug | Paths from the working directory; `fileURLToPath`; per-model durations, ratios, audio and negativePrompt fields | tests: path with spaces, i2v frames, schema refusals |
| M9 | Polling could hang forever; an HTTP 403 body was saved as `.mp4`; no recovery | Timeout with resume hint; download validated (status, type, size, `ftyp`); `resume` and `status` commands | tests: 403, stuck polling, resume without a new task |

## Creative method

| ID | Issue | Resolution | Verified by |
|---|---|---|---|
| C1 | Ads made viewers decode an analogy; product and stake arrived at the end card | Buyer-first brief (decision, cost of error, mechanism, action); three approaches; "what is sold and why it matters by the middle"; newsjack beat 2 names what is sold | read |
| C4 | Silence and "motion never overlaps text" stated as universal | Works sound-off, sound is a tested variant; pointing motion allowed, unrelated motion not | read |
| N20, C1 | The two-second read was an unverifiable judgement | Cold-viewer check (1 s / 3 s / end) required before launch | read |
| A9, A31 | No definition of approval for a solo operator | `APPROVED <date>` in the spine; alone: wait a night or show one person | read |
| C6 | Model comparisons spent credits without a hypothesis | Exploration budget before comparing; Compare labelled as a defect/look tool, not a sales test | read |

## Truth, rights and review

| ID | Issue | Resolution | Verified by |
|---|---|---|---|
| C5, M6 | Sourced story + sourced property did not check the argument; forecast vs event; syndicated copies as "two sources" | publication-gate.md: claims table with observation/forecast and must-not-imply; match AND differences; independent newsrooms; quote properties whole | read |
| M6 | Generated footage could depict a news event realistically; illustrative numbers qualified only in a file | Synthetic-media rules; on-screen "for example" | read |
| M6 | "Keep words out of the primary text" as a platform classification method | Decide special categories explicitly; authorization or change | read |
| C5, M14 | Review covered statics; final videos never reviewed | Gate runs on final exported files; triage required | read |
| M5, N7, N17, A17 | Reviewer tools assumed, one disabling permissions; no fallback | Reviewers optional and named in ADS.md; isolated copy, narrowest access, consent before sending; image canary | read |
| N18 | Copy defects both reviewers caught: news line readable as our own news; narrowed quote; sentence count | Explicit rules in newsjack step 5, publication gate, launch package | read |

## Newsjack process

| ID | Issue | Resolution |
|---|---|---|
| N1, A28, O4 | The property bank did not exist and had no template | Step 0 builds `templates/property-bank.md` with status |
| N4, N10, N21 | No rule excluding stories already carried by live ads; live record not in the reading list | "What is live" is a required input; taken properties and stories rejected; second wave = refresh proposal |
| N14 | Kill test missed "did this audience see it" | Question 4 |
| N9, A26 | Audience channels unnamed | ADS.md "where they read" with exact handles; read by handle |
| N12, N19 | Shelf-life vs pick rules needed derivation; two different "firsts" | "Launch order" vs "Test pick"; >3-day-old story = sprint or reserve |
| N6, N13 | Course-specific shape table with no sources | Generic shapes in the skill; sourced shapes live in the bank |
| N3, N16, A23 | Worked example superseded and unlisted; report naming | `references/worked-example.md` with what changed and what went wrong; `templates/report.md` |
| A25, N8 | Firecrawl assumed; blocked sites unlisted | Web search/fetch; blocked-site note; record opened vs headline |
| A27 | Reference check with no reference | "Only if a reference is given" |
| N15 | Second wave of a live story | Refresh proposal; media swap re-enters review |

## Test design and measurement (new skill: ad-test-loop)

| ID | Issue | Resolution | Verified by |
|---|---|---|---|
| C2, M14 | A/B with 3 stories per ad set confounds treatment and story; equal budgets are not randomization; budget unrelated to precision | test-design.md (allocation vs effect, matched pairs, platform split test); `templates/test-plan.md`; `scripts/arms.mjs plan` | `arms.test.mjs` (p-values checked against an independent Python computation) |
| C2 | Learning phase treated as a significance threshold | Stated as a delivery state | read |
| C3 | Kill rule "$45 AND 0 conversions AND CTR < 0.5%" never stops a good-CTR, no-buyer ad | Loss limit per creative from economics; CTR explains, never rescues | read |
| C3, M14 | Crawler cities dropped as a universal filter; `isTrusted` overclaimed; proxy events not validated | measurement.md: suspicion signals reported with and without; guard limits stated; reconcile proxies with backend | read |
| O3, C3, M14 | Skills stopped at launch; no results read or write-back; expiry without an owner | Steps 3-5, `templates/results-read.md`, campaign record with tracking-change timestamps and stop owners; `arms.mjs compare` verdicts including "inconclusive" | tests |
| A8 | No guidance on the optimization event for a new account | brief.md and test-plan.md prompts | read |
| M13 | Machine-specific browser coordinate factor, account payer name | Replaced by a generic "measure the factor once" note; account specifics stay private | verifier grep |

## Open for the owner

- Choose a licence (README).
- Confirm the worked example may be public.
- Routing between the three descriptions was checked by reading and by the skill list Claude Code shows, not by a
  battery of live requests.

## Round 2: package gate (Codex, Gemini) and the stranger's re-run

| ID | Finding | Resolution | Verified by |
|---|---|---|---|
| G, R (N11) | `MockCard` text hidden from the check: a real edge-to-edge button label passed in the re-run | Card words render as copy in copy-only mode; the card body is hidden | mutation: card text under the UI -> FAIL |
| G | `Word` and `StaticAd` text had no size enforcement; `MockCard` subtitle 30 px | `checkTextSize()` in every text component with the effective size (surface scale for `Word`); subtitle 32 px | mutation: 26 px effective handwritten label -> FAIL |
| G | A dedicated 4:5 layout could be empty and pass | Frame-0 copy, any copy, and matching frame count required | mutation: empty feed layout -> FAIL |
| G | The check could certify stale exports | `package.sh` writes a source fingerprint; the check fails when `src/`/`public/` changed | mutation: source edit after export -> FAIL |
| G | Beat stills unchecked; defaults every 2 s; 4:5 stills scaled | Frames validated and each extraction checked; one full-size still per second by default | mutation: frame 9999 -> FAIL |
| G | A video id containing "Still" was packaged as a still | Type read from the composition list's type column | `StillVideo` packaged as video |
| G | Sound variants were impossible (always muted, audio always FAIL) | `--sound`: keeps audio, and fails a track that is only silence | tone composition -> PASS; silent composition with --sound -> FAIL |
| G | `timeline` fade and `Say` fades could disagree and leave a hole; a hole was only a warning | `timeline` rejects fade < 1; `Say fade`; a copy gap under 0.5 s between beats FAILS | mutation: 5-frame hole -> FAIL |
| G | `Footage` assumed 1080x1920 inside a 4:5 layout | Uses the composition's size | typecheck; ExampleNewsFootage renders and passes |
| G | ffmpeg metadata path with ':' breaks; temp folders left behind | ffmpeg runs inside the temp folder with plain file names; cleanup in `finally` | full run |
| G (blocker) | `resume` did not reconcile the bill: an over-bill found late left the cap understated | Resume measures the balance change since the task's creation when attributable, stops the batch on an over-bill, and records "cost unknown" otherwise; any task with unknown cost blocks new generation until `resume` or `reconcile` | test: 80 estimated, 160 billed at resume -> exit 4, next run refused at the cap |
| G | Invalid ledger amounts counted as zero; legacy `credits` field ignored | An entry without a valid amount stops spending; `credits` counts | tests |
| G | Resume path traversal and overwrites; unknown tasks resumed at 0 credits | Name validation; refuses existing files and a task under another name; unknown tasks need `--estimate` | tests |
| G | "Lock released on every exit" overstated | Wording corrected; a stale lock whose pid is gone is removed | test with a dead pid |
| G | Fake media accepted (header-only mp4, text as png) | Downloads checked with ffprobe (header check if ffprobe is missing); first frames checked by magic bytes; tests use real sample media | tests |
| G | "Hard spending boundary" overstated | Header states exactly what the boundary is: estimates before the call, a stop after the first over-bill | read |
| G | `arms.mjs`: zero or malformed exposure produced "clear difference"; infinite budget hung; ratio < 1 reported ~0 power; 10 vs 0 called a winner | Input validation (exit 2); bounded events; direction-aware power; under 10 events in an arm is always "screen only"; eligibility printed with every verdict | tests: invalid inputs, 10 vs 0, decrease equals swapped arms |
| G | The helper's verdict was compulsory even for pooled ad sets | ad-test-loop: verdicts only for randomized splits or one matched pair; pooled or re-tracked arms get counts | read |
| G, R (N23) | No first-campaign route: "clone a proven setup" | `meta-ads-manager.md` "No proven setup": pixel and CAPI check, objective, optimization event against the ~50 events/7 days learning threshold, pilot | read |
| G, R (N20, N22) | No cost-per-event method for a new account; loss limit larger than the budget | Plan with a cost range and a pilot; the budget is the limit and the test is a screen | read |
| G | Total experiment cost and currency missing | test-plan and ADS.md fields | read |
| G | No asset hashes in the handoff | `package.sh` writes SHA-256; launch package and campaign record carry them | full run |
| G | Production could start before the test plan | video-ads "Start here" step 2: test plan before paying for assets | read |
| G | newsjack required a final-file gate before its own research handoff | newsjack runs the claims part on the report; rights, synthetic media, cold viewer and review run on final files in video-ads | read |
| G | newsjack report did not require the buyer's decision; beat 2 named only a category | Buyer decision and stake fields in step 5 and the report template | read |
| G | Story-shape table was one course's syllabus | Shapes rewritten for any product, with the course rows kept as examples | read |
| G | Property bank edited in place; report path and same-day collision unspecified | Copy to `ads/<product>-property-bank.md`; reports to `ads/<product>-newsjack-<date>[-2].md` | read |
| G, R (A30) | No zero-budget news beat | The line over a plain ground or a phone photo; never a news-site screenshot | read |
| G | Blocked-site list incomplete | Sites and syndication mirrors from both runs, dated | read |
| G | Examples themselves delayed the product to the end card | Example copy names the product and the buyer's stake by the middle | render |
| G | newsjack-ads and ad-test-loop depended on video-ads' gate while README said "works on its own" | Gate copied into each skill; verifier checks the copies are identical | verifier |
| G | Verifier scanned only SKILL.md and wrote to /tmp | Scans references/ and templates/; work files in `out/verify` | mutation: planted missing reference -> FAIL |
| G | README install lacked `mkdir` and a repo URL; allow-scripts warning unmentioned | Added; `<repo-url>` is an owner checklist item | read |
| R (N9, N12) | `Say` had no colour; `MockCard` button text fixed white | `Say color`, `MockCard buttonTextColor` | typecheck |
| R (N7), G | Same-day solo run cannot satisfy the cold-viewer check | Record "not done", launch only as a screen, run it before scaling | read |
| M15 (omitted in round 1) | No offline fonts | Documented how to self-host fonts; not implemented (the first render needs network for the headless browser anyway) | read |
| M14 (omitted in round 1) | Review validator accepted only `.ts:`/`.js:` citations; two canary strings; model id authority | The runbook is the author's private file and is not shipped; fixed there (any file:line, one canary, banner is the authority) | tested on four sample review outputs |
| O5 (omitted in round 1) | No spend guard for image generation | Won't fix in code: image tools differ (chat, MCP, API). generation.md: count images and ask for the total; spend table in SOURCES.md | read |
| A16, A18 (partly omitted) | Empty opening frame and a 38 px button; no UTM scheme | Object on frame 0 rule and 46 px `MockCard` button; UTM pattern in `launch-package.md` | re-run |

### Rejected in round 2, with the reason

- **The em-dash rule is a personal preference imposed on users** (Codex). It lints this package's own text; users' ad copy
  rules come from their ADS.md.
- **Data-centre town names are the author's private data** (Gemini). They are the public locations of Meta data centres
  and they are what identifies the crawlers; the aggregate counts are on the owner's publication checklist.
- **The 4:5 crop check is only arithmetic** (Gemini). Copy is verified inside y 300..1250 in every frame; a crop window
  that contains that band cannot cut copy.
- **Ship executable reviewer commands** (Gemini). Reviewer CLIs, models and flags change monthly; ADS.md names the ones a
  project uses, and the gate says how to isolate them.
- **"Scan 2-3 weeks" contradicts "test pick within 3 days"** (Gemini). Different purposes (second waves, reserves vs the
  pick); the wording now says so.
- **Rehire and Gartner** findings from the final-cut gate belong to the live campaign, not the package.

### Still open

- Owner: licence, permission for the worked example and the quoted campaign numbers, `<repo-url>`.
- No complete new-account run through a live launch and a results read exists yet: the re-run went through production
  and a test plan with an assumed cost range, then stopped (no ad account, no spend).
- The two-second read and "a better ad" remain judgements until a cold-viewer check and a live screen run.

## Round 3: stranger test against the PUBLISHED repository, 2026-09-17

One failure that every earlier run missed, because every earlier run had `node_modules` on disk.

| ID | Issue | Resolution | Verified by |
|---|---|---|---|
| S1 | `video-ads/SKILL.md` pointed the reader at `template/node_modules/remotion/LICENSE.md` for the Remotion terms. That path does not exist in a fresh clone: `node_modules` is correctly gitignored, so the file only appears after `npm ci`. The local verifier passed because the author's working copy had the dependency installed | Reworded to say the terms ship with the dependency and appear after `npm ci`, without presenting an in-package path that is not in the package | `git clone` of the public repo into a temp directory, then `scripts/verify-package.sh` - failed before the change, passes after. The check itself was left strict on purpose: a future `template/node_modules/...` reference should still fail |

**The lesson, and it is the reason this section exists:** a package verifier run in the directory where the
package was built cannot see what is missing from the package. Run it against a fresh clone of the
published artifact.

## Round 4: a gap found after publishing, 2026-09-17

| ID | Issue | Resolution | Verified by |
|---|---|---|---|
| P1 | **The package shipped with no way to read a competitor's live ads.** The only occurrence of the word "competitor" in the three skills was a copy-policy line in `ADS.md` about not bashing them. `newsjack-ads` scanned the news and the audience's own channels, and treated "what is live" as the owner's own campaign record. So the one free source that shows what somebody else is paying to keep running was absent, and it is a stage-1 source: it tells you which shapes survive in a category and which mechanisms a live competitor already owns | New `newsjack-ads/references/ad-libraries.md` with three routes cheapest first (the public Meta Ad Library needs no account; the Meta Ads MCP library search is free; paid transparency endpoints cover the Google, LinkedIn, Snapchat, TikTok and Twitter libraries), plus the grouping rule and the ordering limit. New step 2b in `newsjack-ads/SKILL.md`, no existing step renumbered. Routes, key location and price per request come from `ADS.md`, which also now carries a "competitors to watch" line | `verify-package.sh`, plus a fresh clone of the published repo |

**The substance of the fix, not just its location.** The heuristic people arrive with is "a competitor's
longest-running creative is its winner". It only holds for advertisers who keep single ads running.
Measured in one category: one page was running 25 near-identical ads of the same product, another had
spawned seven copies of one ad within six seconds. So the skill now requires grouping by page and by
creative concept before any claim about longevity, and reporting the span of the group. It also requires
labelling that span a **floor** unless the results were paged through, because these endpoints return
newest first with no duration sort, so one page of a thousand-match query always looks like nothing older
is running.
