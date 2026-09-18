# Publication gate

Run it on the final exported files, every variant, after the last edit. A review of the storyboard, a still or an
earlier cut does not cover the final video: in one campaign the review covered static drafts, the videos changed
afterwards, and nobody reviewed what actually ran.

## 1. Claims

For each claim on screen or in the copy, `SOURCES.md` records: the source, its date, the exact meaning it supports,
whether it is an observation or a forecast, and the reading the ad must not allow.

- Judge the impression of words and pictures together, not each line alone. Advertising law in many markets (for
  example US FTC guidance) treats implied claims like stated ones.
- A forecast stays a forecast on screen ("expects", "predicts", with who predicts). Do not combine a forecast with a
  separate anecdote so that the ad implies the forecast already happened.
- Two sources means two independent newsrooms. Syndicated copies of one wire story are one source.
- Quote a product claim whole. Narrowing it ("the step people skip" where the source says "the second and third steps
  people skip") changes it.
- An illustrative number is marked on screen ("for example"), not only in the file.
- When the ad borrows the structure of a news story, list where the story and the product's lesson match AND where
  they differ. A difference in the mechanism that carries the lesson kills or changes the ad. (A reviewed ad said
  "an agreement nobody can check is only a wish" over news of an agreement that included outside checkers.)

## 2. Rights

For each asset, `SOURCES.md` records origin (own photo, own screen, generated with which tool, stock, licensed), the
licence or terms, permitted uses (ad, organic, public repository), consent where a person or their story appears, and
whether it is documentary, illustrative or reconstructed.

- Borrow a reference ad's mechanism, never its execution, typography or brand cues, and never imply affiliation.
- Consent covers every place the material goes: generation services, review services, shared repositories, the ad.

## 3. Synthetic media

- Generated footage or images may be obviously illustrative (metaphor, drawing, clearly staged scene). They must not
  look like documentary evidence of a real event, show a real person's likeness, invent a quotation, or show a real
  brand's product or logo.
- When a realistic reconstruction is unavoidable, label it on screen and use the platform's AI disclosure where it
  offers one. A platform label alone is not an editorial safeguard: it can sit behind a menu.

## 4. Platform classification

- Decide whether the ad falls under the platform's special categories (social issues, elections or politics,
  employment, housing, credit, and so on). If it does, it needs the platform's authorization and disclaimer, or it
  must change. Avoiding certain words in the primary text is not a classification method.

## 5. Expiry and offer

- Every date, price, deadline and "starts on" line has a stop date on or before the day it stops being true, with its
  time zone. A deadline at 23:59 UTC is earlier in the Americas.
- The platform may not be able to stop a single ad on a date: record who pauses it, when, and how that is checked.

## 6. Independent review

- Use reviewers from different model vendors where available (the project's `ADS.md` names them and how to run them).
  Give each the final files, the brief, and acceptance criteria (the rules in this file and in
  story-and-attention.md), not the reasoning that produced the ad. Ask what is wrong, missing, unsupported or
  misleading for a viewer who was not in the project.
- Run reviewers with the narrowest access that works: a copy of the files in a scratch folder, read-only mode where
  the tool has one, no credentials in reach. A brief that says "only this folder" is not isolation: a reviewer with
  file access read project files outside its copy in a real gate. When the material is sensitive, use the tool's
  sandbox, a container, or a separate OS user. Material sent to a reviewer leaves your machine: check consent and client
  confidentiality first.
- Put a countable fact from an image in the brief ("how many boats are in frame 2") and check the answer: a reviewer
  that cannot see the image returns a confident review of nothing.
- Say which reviewers ran. Triage in writing: accepted, rejected with the reason, fixed. Word criteria as narrowly as
  you mean them: reviewers apply loose rules literally.

## 7. Cold-viewer check (not replaceable by reviewers)

Neither a model reviewer nor the author can tell whether a stranger gets the joke in two seconds. Show the final file
at phone size to at least one person from outside the project, with no explanation, and record what they understood
after 1 s, 3 s and at the end.

**If no human is available**, a panel of isolated persona agents shown the final file is a partial stand-in: it
unblocks a screen-level launch and never replaces the human check before scaling. Ask it what is being sold, what is
promised and what category the ad seems to belong to. **Never ask it to rank or to score.** Measured on four
personas over five live creatives: one of four produced the true order on the only fair comparison, while all four
agreed on what was broken and three of those agreements were independently confirmable. The method and its two
failure modes are in the video-ads skill, `references/synthetic-panel.md`.
