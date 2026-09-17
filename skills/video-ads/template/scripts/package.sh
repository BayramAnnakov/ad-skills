#!/usr/bin/env bash
# Render an ad for upload and check it.
#   scripts/package.sh <Id> [--beats 0,90,240] [--crop-y 200] [--sound]
# Video <Id> (1080x1920): out/final/<Id>-9x16.mp4, out/final/<Id>-4x5.mp4 (from composition "<Id>-4x5" if it exists,
# else a crop of the master at --crop-y), SHA-256 hashes of both files, then scripts/check.mjs.
# Still <Id>: out/final/<Id>.png and the same copy checks.
# --sound keeps the audio track, for a deliberate sound variant; without it the files are silent.
# Name compositions "<project>-<creative>" so the files are upload-ready as named.
# Exit code 1 = a check failed: read out/check/<Id>-check.md.
set -euo pipefail
cd "$(dirname "$0")/.."
for tool in node npx ffmpeg ffprobe shasum; do command -v "$tool" >/dev/null || { echo "missing prerequisite: $tool" >&2; exit 2; }; done
[ $# -ge 1 ] || { echo "usage: scripts/package.sh <CompositionId> [--beats 0,90,240] [--crop-y 200] [--sound]" >&2; exit 2; }
ID="$1"; shift
BEATS=""; CROP_Y=200; SOUND=0
while [ $# -gt 0 ]; do
  case "$1" in
    --beats) BEATS="$2"; shift 2 ;;
    --crop-y) CROP_Y="$2"; shift 2 ;;
    --sound) SOUND=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
mkdir -p out/final out/check
LIST=$(npx remotion compositions src/index.ts 2>/dev/null | grep -E "[0-9]+x[0-9]+")
row() { echo "$LIST" | awk -v id="$1" '$1==id'; }
LINE=$(row "$ID")
[ -n "$LINE" ] || { echo "no composition \"$ID\". Available:" >&2; echo "$LIST" >&2; exit 2; }
# Row shapes: "<Id>  <WxH>  Still" or "<Id>  <fps>  <WxH>  <frames> (<sec> sec)". Decide by the type column, not by a
# substring of the id.
TYPE=$(echo "$LINE" | awk '{print ($NF=="Still") ? "still" : "video"}')
DIMS=$(echo "$LINE" | grep -oE "[0-9]+x[0-9]+" | head -1)
# Fingerprint of everything that determines the render, so the check can refuse to certify stale exports.
STAMP=$(node scripts/check.mjs stamp "$ID" --sound "$SOUND" --crop-y "$CROP_Y")

if [ "$TYPE" = still ]; then
  npx remotion still src/index.ts "$ID" "out/final/$ID.png" --log=error
  (cd out/final && shasum -a 256 "$ID.png" > "$ID.sha256")
  echo "$STAMP" > "out/final/$ID.stamp"
  exec node scripts/check.mjs still "$ID" --stamp "$STAMP"
fi

[ "$DIMS" = "1080x1920" ] || { echo "\"$ID\" is $DIMS. Ad masters are 1080x1920; register the feed layout as \"$ID-4x5\"." >&2; exit 2; }
MUTE=(--muted); AUDIO=(-an)
[ "$SOUND" = 1 ] && { MUTE=(); AUDIO=(-c:a aac -b:a 128k); }
npx remotion render src/index.ts "$ID" "out/final/$ID-9x16.mp4" --codec=h264 --crf=18 ${MUTE[@]+"${MUTE[@]}"} --log=error
HAS45=0
FEED=$(row "$ID-4x5")
if [ -n "$FEED" ]; then
  HAS45=1
  echo "$FEED" | grep -q "1080x1350" || { echo "\"$ID-4x5\" must be 1080x1350" >&2; exit 2; }
  npx remotion render src/index.ts "$ID-4x5" "out/final/$ID-4x5.mp4" --codec=h264 --crf=18 ${MUTE[@]+"${MUTE[@]}"} --log=error
else
  ffmpeg -loglevel error -y -i "out/final/$ID-9x16.mp4" -vf "crop=1080:1350:0:$CROP_Y" ${AUDIO[@]+"${AUDIO[@]}"} -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart "out/final/$ID-4x5.mp4"
fi
(cd out/final && shasum -a 256 "$ID-9x16.mp4" "$ID-4x5.mp4" > "$ID.sha256")
echo "$STAMP" > "out/final/$ID.stamp"
node scripts/check.mjs video "$ID" --crop-y "$CROP_Y" --has-4x5 "$HAS45" --sound "$SOUND" --stamp "$STAMP" ${BEATS:+--beats "$BEATS"}
