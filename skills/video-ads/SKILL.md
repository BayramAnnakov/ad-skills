---
name: video-ads
description: |
  Produce paid social ad creatives - short vertical videos and static images for Reels, Stories, Feed and similar
  placements - from a brief to upload-ready files with copy, UTMs and a sources-and-rights record. Use when the user
  asks for a video ad, a Reels/Stories ad, an ad creative, a static ad image, a paid product-demo ad, "ролик для
  рекламы", "креатив для таргета", or wants an existing ad creative fixed or re-cut. Also the production step after
  newsjack-ads approves a spine. Covers the buyer-first brief, story rules that stop a scroll, generated images and
  footage behind cost gates, a tested Remotion template with an automated check, and a publication gate.
  Not for launching or reading campaign results (ad-test-loop), and not for non-ad explainers or product videos that
  will not run as paid ads.
---

# Video Ads

A paid creative has about two seconds to make a stranger stop, one idea to land, and a reason to buy that arrives
before the viewer leaves. Everything below serves that. The rules come from real reviews and real spend; the reasons
and the failures behind them are in `references/`.

## Start here

1. Read `ADS.md` in the project (or ask for its path). If there is none, copy `templates/ADS.md` into the project and
   fill what the user can answer; the brief below needs only the Product and Audience sections.
2. If the ad will run as a test, write `ad-test-loop`'s test plan before paying for any asset: it may show the budget
   cannot answer the question, which changes what is worth producing.
3. Read `references/story-and-attention.md` before writing a beat, `references/generation.md` before generating any
   image or footage, `references/build-and-verify.md` before building, `references/publication-gate.md` before
   handing files over.

## Hard gates

- **Paid generation needs a price and a yes for that run.** Say the credits or dollars and the worst case with
  retries. `template/runway/rw.mjs` refuses without `--approved <credits>` for the run and a folder cap.
- **Nothing is uploaded, published or activated from this skill.** Launch belongs to `ad-test-loop`, and only on the
  user's explicit request. A handoff never extends an authorization.
- **Every on-screen claim has a source** in `SOURCES.md` (template: `templates/sources-and-rights.md`), and a number
  that is only illustrative is visibly marked as an example on screen, not only in the file.
- **A real person's story needs written consent before it is sent to any generation or review service, committed to
  a shared repository, or launched.** Read its load-bearing fact back to its author before building: a transcript can
  contain both versions of a story.
- Apply the house copy rules from `ADS.md`.

## What to produce

1. **Brief** (`templates/brief.md`). The buyer and the decision they face, the cost of getting it wrong, the one
   mechanism the product demonstrably gives them, the action the ad asks for, the offer, the destination, the
   conversion event, formats. Then **three different approaches** in one line each (for example: news-led,
   buyer-problem, product demonstration) and the one chosen, with why.
2. **Story spine, approved before building** (`templates/spine.md`). A table: seconds | on screen | motion | source.
   It passes the rules in `references/story-and-attention.md`, above all:
   - frame 0 explains the setup and shows an object, with no small labels;
   - by the middle of the ad the viewer knows what is being sold and why it matters to them; the end card confirms,
     it does not introduce;
   - every line that carries meaning is full size; a pivot line gets its own beat;
   - it works with the sound off; motion that points at the line being read helps, unrelated motion competes with it.
   Approval = the decision owner writes `APPROVED <date>` in the spine file. **The agent never writes that string,
   under any circumstance, including when working alone or when the user says to go ahead in chat: the whole point
   of the marker is that a human typed it.** If it is absent, stop and ask. Working alone, the decision owner should
   wait a night or show one person before marking it. One approval round on the spine replaces several re-renders.
3. **Assets, cheapest that carries the beat** (`references/generation.md`): the product's own material (screens,
   photos, footage, a photographed drawing) > a JSX mock of the product (`MockCard`) or a phone photo > a generated
   text-free illustration > generated footage where motion matters. When the user must choose between assets or
   models, render `Compare` and let them watch; a comparison shows defects and look, never which ad will sell.
   Record every asset's origin and rights in `SOURCES.md`.
4. **Build** from `template/` (copy it into the project, `npm ci`). Register each ad in `src/Root.tsx` as
   `<project>-<creative>`; add `<project>-<creative>-4x5` only when the feed version needs its own layout. Compose
   from `src/lib.tsx` components: the check sees their text and ignores their pictures. Anything custom must use
   `Lines`/`Say`/`Word` for words and `Visual` for pictures, or the check cannot see it.
5. **Verify.** `scripts/package.sh <Id> [--beats ...] [--sound]` renders the 9:16 and 4:5 files, writes their SHA-256
   hashes, and runs `scripts/check.mjs`: files match the current source, dimensions, silence (or real sound for a
   `--sound` variant), copy inside the safe zone in every frame, frame 0 shows copy, the 4:5 crop or layout, text below
   the phone minimum, fades that meet at an empty frame, a contact sheet and full-size stills. A FAIL blocks handover. Then look at the stills at phone
   size and ask of each beat: does the action the line names happen in this frame?
6. **Cold-viewer check.** Show the final file to someone outside the project, without explanation, at phone size.
   Write down what they understood after 1 s, after 3 s, and at the end: the problem, why it matters to them, what is
   sold, what to do next. A gap is a defect to fix, not a note. If nobody outside the project is available, run a
   **synthetic panel** (`references/synthetic-panel.md`): isolated persona agents, shown the final file, asked what
   is being sold and what confuses them, never asked to rank. Agreement across personas is the signal, and a lone
   voice is noise. Record "cold-viewer check:
   synthetic panel only, human check not done", launch only as a screen (ad-test-loop), and run the human check
   before scaling.
7. **Publication gate** (`references/publication-gate.md`) on the **final exported files**: claims, rights, synthetic
   media, platform classification, expiry, and an independent review where reviewers are available. Write the triage.
8. **Launch package** (`templates/launch-package.md`): per creative the two files, primary text (as many sentences as
   the house rules allow and no more), headline, description, CTA, destination with full UTM (`utm_content` unique per
   creative and ad set), stop date, the file hashes, and the completed publication checklist. Hand it to
   `ad-test-loop`.
9. **Close the loop.** A new trap goes into `references/` (or the project's own notes) the same day.

## Template (`template/`)

| Path | What it gives you |
|---|---|
| `src/lib.tsx` | Fonts (Latin + Cyrillic; change for other scripts), themes, safe-zone and minimum text constants, `timeline` (cross-faded beats), `Say`, `Lines`, `EndCard`; visuals `Ground`, `Picture` (feathered illustration), `Footage` (bar crop, start offset, muted), `TextPanel`, `Surface` + `Word`/`Arrow`/`Loop` (drawing on a photo in image coordinates), `MockCard`; copy-only mode for the check |
| `src/Example.tsx` | `Example` (zero-budget evergreen ad), `ExampleNews` / `ExampleNewsFootage` (the newsjack structure with an illustration or footage), `ExampleStill` |
| `src/Stills.tsx`, `src/Compare.tsx` | Static ad in 4:5 and 9:16 layouts; side-by-side comparison video |
| `public/sample/` | Rights-free placeholder illustration, paper surface and clips so every example renders |
| `scripts/package.sh`, `scripts/check.mjs` | Render for upload (silent, or `--sound`), hash, and check (exit 1 on FAIL) |
| `runway/rw.mjs` (+ `runway/test/`) | Footage generation with per-run approval, a locked reservation ledger, resume and reconcile, and mocked tests (`npm run test:runway`) |

Requirements: Node 18+, ffmpeg, ffprobe and shasum, network access on the first render (Chrome Headless Shell and
Google Fonts download; `npm ci` may warn that esbuild's install script is not allow-listed, which does not stop
rendering). Remotion's free license covers individuals, for-profit companies with up to 3 employees, non-profits
and evaluation; other companies need a Remotion company license. The full terms ship with the dependency, so they appear
after `npm ci`, at `node_modules/remotion/LICENSE.md` inside your copy of the template.

## Done means

- [ ] Brief with three approaches; spine marked APPROVED before the build.
- [ ] `package.sh` exits 0; beat stills looked at; frame 0 carries the hook without a label.
- [ ] The offer and the buyer's stake are clear before the end card; the cold-viewer check is written down.
- [ ] Every claim and asset is in `SOURCES.md`; paid spend is in a ledger against an approved amount.
- [ ] Publication gate ran on the final files (reviewers named, or their absence stated) and its triage is written.
- [ ] Launch package exists; nothing was published from this skill.
