# Generated images and footage

## Before any paid call

- State the cost and get a yes for that run, reruns included. Price = units x rate; say the worst case with retries.
- A complete request with a junk prompt bills. A schema probe is free only if it is structurally invalid; read the API
  reference instead of probing.
- Keep a ledger per project (footage: `runway/ledger.json` via `rw.mjs`; images: the spend table in `SOURCES.md` with
  tool, prompt file, price, date). There is no helper for images: generators differ too much (chat tools, MCP servers,
  APIs). Count the images before generating and ask for the total.
- Set an exploration budget before comparing models. One campaign spent 1,280 footage credits on model comparisons for
  three 16 s ads: useful for catching defects, but a comparison of raw clips cannot tell which finished ad sells.
  Decide in the market with a matched pair (ad-test-loop), not by aesthetics alone.

## Choosing what to generate

1. The product's own material (screens, photos, recordings, a photographed drawing). Free, true, and usually better.
2. A JSX mock of the product (`MockCard`) or a phone photo. Free.
3. A text-free editorial illustration for a scene that does not exist (the news beat). Cents per image.
4. Generated footage, only where motion carries the beat.

## Illustrations

- Lock one style in every prompt ("ink linework, flat muted colours, plain cream paper, no text") and a negative prompt
  that bans text, letters and logos. With that, 5 of 5 prompts were usable on the first try. Keep every word in the
  video, never in the image.
- On a cream page, feather the image edges with a CSS mask (`Picture`); `mix-blend-mode: multiply` tinted it into a
  darker box.
- No real person's likeness, no brand logo or recognisable product, nothing that could pass for a photo of a real
  event (see publication-gate.md).

## Footage models (Runway API, measured Sep 2026: re-check, prices and rankings move)

- Pick the model from a current leaderboard and the models on the account, then generate ONE clip, inspect it, and
  price it from the measured balance change before paying for the next.
- The pricing page is not the bill: `veo3.1` without audio was listed at 10 credits/s and billed 20. `veo3.1_fast`
  silent really was 10/s; `wan3` 20/s and `gemini_omni_flash` 10/s billed as listed. `rw.mjs` carries these as
  conservative defaults and stops a batch when a bill exceeds the estimate.
- Audio is on by default where the schema has the field and costs more (15 vs 10 credits/s on veo3.1_fast). Ads are
  silent: `rw.mjs` sends `audio: false` unless `RUNWAY_AUDIO=1`.
- Schemas differ: `wan3` and `gemini_omni_flash` have no `negativePrompt` (put exclusions into the prompt);
  `gemini_omni_flash` has no audio field yet returns an audio track, so render muted.
- Check every clip for orientation (a `veo3.1` 720:1280 clip came back as a landscape scene turned 90 degrees) and
  black bars (84 px top and bottom inside 720x1280 on another). `Footage` crops measured bars.
- Start the clip at the second where the action happens (`startFrom`), not at 0.
- On identical prompts, one model was sharpest, another was the only one that staged "boats from several harbours
  converge on one point", and none showed three fleets on one sea. Story-specific staging is where owned or drawn
  assets beat generation.

## What generated footage gets wrong, and what worked

| Failure seen | Workaround |
|---|---|
| A hand "turns" a knob but nothing rotates; a lever spins or snaps back at ~2 s | Unambiguous geometry (long lever on a round plate); keep the good seconds and regenerate only the failing beat from the last good frame (image-to-video); cut before the snap-back |
| Water came out of the knob (a cylinder read as a spout) | Say where water comes from and exclude the spout in the negative prompt |
| "Nothing happens for two seconds, then steam" is compressed | Enforce the delay in the edit: slow-motion hold on the calm window |
| Steam renders as a weak haze on white tiles | Draw it in Remotion (blurred rising blobs) with a slight dim under it |
| A caption promises ice, the frame shows none | Prompt the payoff explicitly and check that exact frame |

- Continuity: start each shot from the previous shot's last good frame; hands and objects still drift, so keep cuts
  short.
- Review each clip as a 4-6 fps contact sheet and ask: does the action the caption names happen on screen?
