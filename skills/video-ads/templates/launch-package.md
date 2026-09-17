# Launch package: <project>

Hand this to ad-test-loop. Nothing in it is live until someone launches it on an explicit request.

## Per creative

### <project>-<creative>
- Files: `out/final/<project>-<creative>-9x16.mp4`, `-4x5.mp4` (package.sh exit 0 on <date>)
- SHA-256 (from `out/final/<project>-<creative>.sha256`), to confirm the uploaded bytes are the reviewed ones:
- Primary text (within the house sentence limit; count them):
- Headline:
- Description:
- CTA:
- Destination (full URL with UTM): `https://...?utm_source=<platform>&utm_medium=paid_social&utm_campaign=<campaign>&utm_content=<adset>_<creative>`
- Stop date and time zone; who pauses it:
- AI disclosure needed: yes / no (why)

## Publication checklist (references/publication-gate.md), on the final files
- [ ] Claims: every line in SOURCES.md; forecasts stay forecasts; the news-to-product differences are listed
- [ ] Rights and consent recorded for every asset
- [ ] Synthetic media is obviously illustrative, or labelled
- [ ] Platform special categories considered: <result>
- [ ] Every date and price line has a stop date
- [ ] Cold-viewer check: <who, what they understood at 1 s / 3 s / end>
- [ ] Independent review: <which reviewers ran, or why none>; triage file: <path>
