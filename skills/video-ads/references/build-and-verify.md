# Build and verify

## Setup

- Copy `template/` into the project and run `npm ci` (the lockfile pins Remotion 4.0.277). Requirements: Node 18+,
  ffmpeg and ffprobe on PATH. The first render downloads Chrome Headless Shell (~85 MB); fonts load from Google Fonts at
  render time, so rendering needs network access. To render offline, put the font files in `public/fonts/` and load
  them with the browser `FontFace` API (or `@remotion/fonts`) instead of `@remotion/google-fonts`.
- `npx remotion studio src/index.ts` previews; `scripts/package.sh <Id>` renders and checks.

## Building an ad

- Start from `src/Example.tsx`: copy the closest example into a new file, register it in `src/Root.tsx` as
  `<project>-<creative>` (1080x1920, 30 fps). Output files come out as `<project>-<creative>-9x16.mp4` and `-4x5.mp4`.
- Lay beats out with `timeline([durations], fade)`: adjacent beats cross-fade, so two fades never meet at an empty frame.
- Use the lib components. The check renders the ad in copy-only mode, where copy components draw white on black and
  visual components disappear. A custom visual must be wrapped in `Visual` (or it will be measured as copy); custom
  text must use `Lines`, `Say` or `Word`.
- Draw on a photographed surface in the image's own pixel coordinates (`Surface`): measure the writable area in the file
  once, and keep drawings clear of props on it (a marker lying on the sheet).
- `timeline(durations, fade)` and `Say fade={...}` must use the same fade, or the check fails the hole between beats.
- The 4:5 feed file is the master cropped at y=200 (y=285 left headlines touching the top edge). If the feed version
  needs a different composition, register `<Id>-4x5` at 1080x1350 and `package.sh` renders it instead.
- Statics are two layouts (`StaticAd` 4:5 and 9:16), not a crop. Build them with `<Still>`; view them at phone size.
- Fonts: the families in `lib.tsx` cover Latin and Cyrillic. `loadFont('italic')` returns the same family name as the
  upright face; the CSS still needs `fontStyle: 'italic'`.

## What the check does (scripts/check.mjs)

| Check | FAIL when |
|---|---|
| Freshness | the exported files were rendered from a different `src/` or `public/` than the current one (run package.sh, not check.mjs alone) |
| Dimensions | master is not 1080x1920, feed file not 1080x1350 or a different frame count, a still is neither |
| Silence / sound | a silent ad has an audio stream; a `--sound` variant has no audio or only a silent track |
| Safe zone | any copy pixel above y=300 or below y=1250 in any frame (Reels/Stories UI covers those) |
| Side edges | copy within 40 px of a side (overflowing line) |
| Frame 0 | no copy on the first frame |
| 4:5 crop | the crop window does not contain the safe zone |
| Text size | any text from `Lines`, `Say`, `EndCard`, `MockCard`, `StaticAd` below 44 px, a secondary line below 32 px, or a `Word` whose size times the surface scale is below 44 px |
| 4:5 layout | with a dedicated `<Id>-4x5` composition: copy within 40 px of its edges, no copy on frame 0, or no copy at all |
| Beat stills | a `--beats` frame outside the video, or a still that could not be extracted |
| Fades | FAIL: copy disappears for under 0.5 s between beats (two fades meet); WARN: a longer stretch with no copy |

It also writes a contact sheet (one cell per second, counted from frames) and full-size beat stills with 4:5 versions.
It was verified against a deliberately broken composition (late hook, copy under the UI, an overflowing line, a bad
crop, an added audio track, 30 px text, copy at the edge of a dedicated 4:5 layout, product-card text under the UI, a
26 px handwritten label, a 5-frame hole between beats, an empty feed layout, a silent track passed off as a sound
variant, an out-of-range beat, and a source edit after export): each defect produced a FAIL. A composition id that
contains "Still" is still packaged as a video.

Its limits: it sees only text drawn by the lib components; a 1 fps sheet and stills can miss motion that competes with
reading; the crop check is geometric (copy inside the safe zone cannot be cut by a crop that contains it).

What it cannot check, so look: the hook reads without a label; each caption's action is visible in its frame; no
caption covers its subject; the offer is clear before the end card; text size on a phone.

## Remotion traps hit

- `interpolate` input ranges must be strictly increasing: a 0-frame fade crashes (`FadeScene` handles it).
- Stills of a composition miss transition bugs (empty caption boxes, blank frames, UI flashes): check the rendered
  video, not the studio.
- `ffmpeg` builds differ: some lack `drawtext`; `hstack` needs at least 2 inputs.
