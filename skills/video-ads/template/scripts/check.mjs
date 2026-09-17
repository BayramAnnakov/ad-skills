#!/usr/bin/env node
// Checks an ad the way a reviewer would, so "looks fine in the render log" is never the check.
//   node scripts/check.mjs video <Id> [--beats 0,90,240] [--crop-y 200] [--has-4x5 0|1] [--sound 0|1]
//   node scripts/check.mjs still <Id>
//   node scripts/check.mjs stamp <Id> [--sound 0|1] [--crop-y 200]   (used by package.sh)
// It renders the composition again in copy-only mode (text white on black, visuals hidden; see isCopyOnly in
// src/lib.tsx) and measures where copy is. FAIL = must fix before upload. WARN = look at it. The images it writes still
// have to be looked at: this script cannot tell whether a line is persuasive or whether a caption's action is visible.
import { execFileSync, spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [mode, id, ...rest] = process.argv.slice(2)
const arg = (name, def) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : def }
if (!['video', 'still', 'stamp'].includes(mode) || !id) { console.error('usage: check.mjs video|still|stamp <Id> [--beats 0,90] [--crop-y 200] [--has-4x5 0|1] [--sound 0|1]'); process.exit(2) }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)
const SAFE_TOP = 300, SAFE_BOTTOM = 1250, MARGIN = 40, TH = 70
const CROP_Y = Number(arg('--crop-y', 200))
const SOUND = arg('--sound', '0') === '1'

// Fingerprint of the sources that determine a render (src/, public/) plus the packaging options.
function stamp() {
  const files = []
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else files.push(f) } }
  for (const d of ['src', 'public']) if (fs.existsSync(d)) walk(d)
  const h = crypto.createHash('sha256')
  for (const f of files.sort()) { h.update(f); h.update(fs.readFileSync(f)) }
  h.update(`sound=${SOUND ? 1 : 0} crop=${CROP_Y}`)
  return h.digest('hex').slice(0, 16)
}
if (mode === 'stamp') { console.log(stamp()); process.exit(0) }

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, ...opts })
const results = []
const fail = (m) => results.push(['FAIL', m])
const warn = (m) => results.push(['WARN', m])
const pass = (m) => results.push(['PASS', m])
const probe = (file) => JSON.parse(run('ffprobe', ['-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,nb_read_frames:format=duration,size', '-of', 'json', file]))

// Per-frame max luma of horizontal bands and side margins of a copy-only render. ffmpeg runs inside a temporary folder
// so the metadata file names in the filter are plain names (a ':' in an absolute path would break the filter syntax).
function bands(file, W, H, nine = true) {
  const s = W / 1080
  const r = (v) => Math.round(v * s)
  const regions = nine
    ? { top: [0, 0, W, r(SAFE_TOP)], bottom: [0, r(SAFE_BOTTOM), W, H - r(SAFE_BOTTOM)], middle: [0, r(SAFE_TOP), W, r(SAFE_BOTTOM - SAFE_TOP)] }
    : { top: [0, 0, W, r(MARGIN)], bottom: [0, H - r(MARGIN), W, r(MARGIN)], middle: [0, r(MARGIN), W, H - 2 * r(MARGIN)] }
  regions.left = [0, 0, r(MARGIN), H]
  regions.right = [W - r(MARGIN), 0, r(MARGIN), H]
  const tmp = fs.mkdtempSync(path.join(root, 'out/check/.bands-'))
  try {
    const out = {}
    for (const [n, [x, y, w, h]] of Object.entries(regions)) {
      run('ffmpeg', ['-loglevel', 'error', '-i', path.resolve(file), '-vf', `format=gray,crop=${w}:${h}:${x}:${y},signalstats,metadata=print:key=lavfi.signalstats.YMAX:file=${n}.txt`, '-f', 'null', '-'], { cwd: tmp })
      out[n] = [...fs.readFileSync(path.join(tmp, `${n}.txt`), 'utf8').matchAll(/YMAX=(\d+)/g)].map((m) => Number(m[1]))
    }
    return out
  } finally { fs.rmSync(tmp, { recursive: true, force: true }) }
}
const ranges = (flags, fps) => {
  const out = []; let start = -1
  flags.forEach((f, i) => { if (f && start < 0) start = i; if ((!f || i === flags.length - 1) && start >= 0) { const end = f ? i : i - 1; out.push([start, end]); start = -1 } })
  return out
}
const fmtR = (rs, fps) => rs.map(([a, b]) => `${(a / fps).toFixed(2)}-${(b / fps).toFixed(2)} s`).join(', ')

// Copy-only render. Verbose logging is the only level at which Remotion forwards the components' console warnings, so
// the text-size warnings from src/lib.tsx are collected here.
const smallText = new Set()
const copyRender = (kind, outFile, compId = id, scale = 0.5) => {
  const props = JSON.stringify({ copyOnly: true })
  const args = kind === 'still'
    ? ['remotion', 'still', 'src/index.ts', compId, outFile, `--scale=${scale}`, `--props=${props}`, '--log=verbose']
    : ['remotion', 'render', 'src/index.ts', compId, outFile, `--scale=${scale}`, '--muted', '--codec=h264', '--crf=12', `--props=${props}`, '--log=verbose']
  const r = spawnSync('npx', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  if (r.status !== 0) { console.error((r.stderr || '').slice(-2000)); throw new Error(`copy-only render of ${compId} failed`) }
  for (const m of ((r.stdout || '') + (r.stderr || '')).matchAll(/\[video-ads\] ([^\n]+)/g)) smallText.add(m[1].trim())
}
const reportSmallText = () => { if (smallText.size) fail(`text below the phone-legible minimum: ${[...smallText].join('; ')}`); else pass('no text below the minimum size (Lines, Say, EndCard, MockCard, Word, StaticAd)') }

fs.mkdirSync('out/check', { recursive: true })
const stampFile = `out/final/${id}.stamp`
if (!fs.existsSync(stampFile)) fail(`no ${stampFile}: build with scripts/package.sh, not by hand, so the check can tie the files to the source`)
else if (fs.readFileSync(stampFile, 'utf8').trim() !== stamp()) fail('the exported files are stale: src/ or public/ changed after they were rendered. Run scripts/package.sh again')
else pass('exported files match the current source')

if (mode === 'still') {
  const file = `out/final/${id}.png`
  if (!fs.existsSync(file)) { console.error(`missing ${file}: run scripts/package.sh ${id}`); process.exit(2) }
  const p = probe(file).streams[0]
  const nine = p.height === 1920
  if (p.width === 1080 && (p.height === 1920 || p.height === 1350)) pass(`size ${p.width}x${p.height}`); else fail(`size ${p.width}x${p.height}: statics are 1080x1350 (4:5) or 1080x1920 (9:16)`)
  const copyFile = `out/check/${id}-copy.png`
  const scale = nine ? 0.5 : 0.4
  copyRender('still', copyFile, id, scale)
  const b = bands(copyFile, 1080 * scale, p.height * scale, nine)
  const where = nine ? `y ${SAFE_TOP}..${SAFE_BOTTOM}` : `${MARGIN} px margins`
  if (b.top[0] > TH || b.bottom[0] > TH) fail(`copy outside ${where}; see ${copyFile}`); else pass(`copy inside ${where}`)
  if (b.left[0] > TH || b.right[0] > TH) fail(`copy within ${MARGIN} px of a side edge (overflow?); see ${copyFile}`); else pass('no copy at the side edges')
  if (b.middle[0] <= TH) fail('no copy found at all'); else pass('copy present')
  reportSmallText()
} else {
  const master = `out/final/${id}-9x16.mp4`, feed = `out/final/${id}-4x5.mp4`
  for (const f of [master, feed]) if (!fs.existsSync(f)) { console.error(`missing ${f}: run scripts/package.sh ${id}`); process.exit(2) }
  const m = probe(master), fd = probe(feed)
  const mv = m.streams.find((s) => s.codec_type === 'video'), fv = fd.streams.find((s) => s.codec_type === 'video')
  const [num, den] = mv.r_frame_rate.split('/').map(Number); const fps = num / den
  const frames = Number(mv.nb_read_frames)
  if (mv.width === 1080 && mv.height === 1920) pass('9:16 master 1080x1920'); else fail(`9:16 master is ${mv.width}x${mv.height}`)
  if (fv.width === 1080 && fv.height === 1350) pass('4:5 file 1080x1350'); else fail(`4:5 file is ${fv.width}x${fv.height}`)
  if (Math.abs(Number(fv.nb_read_frames) - frames) > 1) fail(`4:5 file has ${fv.nb_read_frames} frames, the master ${frames}`)
  for (const [name, p] of [['9:16', m], ['4:5', fd]]) {
    const hasAudio = p.streams.some((s) => s.codec_type === 'audio')
    if (SOUND) {
      if (!hasAudio) { fail(`${name} file has no audio stream although --sound was requested`); continue }
      const vol = spawnSync('ffmpeg', ['-hide_banner', '-i', name === '9:16' ? master : feed, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr.match(/max_volume: (-?[\d.]+|-inf) dB/)
      const maxDb = vol ? (vol[1] === '-inf' ? -Infinity : Number(vol[1])) : -Infinity
      if (maxDb <= -60) fail(`${name} file has an audio track but it is silent (max ${maxDb} dB): the composition has no sound`)
      else pass(`${name} file carries sound (max ${maxDb} dB, --sound variant): it must still work with the sound off`)
    }
    else if (hasAudio) fail(`${name} file has an audio stream: package without --sound for a silent ad`)
    else pass(`${name} file has no audio stream`)
  }
  pass(`length ${frames} frames = ${(frames / fps).toFixed(2)} s at ${fps} fps; master ${(Number(m.format.size) / 1e6).toFixed(1)} MB`)
  if (frames / fps < 6 || frames / fps > 60) warn(`length ${(frames / fps).toFixed(1)} s is outside 6-60 s`)

  const copyFile = `out/check/${id}-copy.mp4`
  copyRender('video', copyFile)
  const b = bands(copyFile, 540, 960)
  const over = (arr) => arr.map((v) => v > TH)
  const topR = ranges(over(b.top), fps), botR = ranges(over(b.bottom), fps)
  if (topR.length || botR.length) fail(`copy outside the Reels safe zone y ${SAFE_TOP}..${SAFE_BOTTOM}: ${[...topR.map((r) => `top ${fmtR([r], fps)}`), ...botR.map((r) => `bottom ${fmtR([r], fps)}`)].join(', ')}`)
  else pass(`copy stays inside y ${SAFE_TOP}..${SAFE_BOTTOM} in all ${b.middle.length} frames`)
  const sideR = ranges(b.left.map((v, i) => v > TH || b.right[i] > TH), fps)
  if (sideR.length) fail(`copy within ${MARGIN} px of a side edge (overflow?): ${fmtR(sideR, fps)}`); else pass('no copy at the side edges')
  if (b.middle[0] > TH) pass('frame 0 (the autoplay thumbnail) shows copy'); else fail('frame 0 shows no copy: start the first beat with a negative delay (useIn) and no fade-in')
  // With the copy inside y 300..1250 in every frame, a crop window that contains that band cannot cut copy.
  if (arg('--has-4x5', '0') !== '1') {
    if (CROP_Y > SAFE_TOP || CROP_Y + 1350 < SAFE_BOTTOM) fail(`the 4:5 crop (y ${CROP_Y}..${CROP_Y + 1350}) cuts into the safe zone: copy may be cut`)
    else pass(`4:5 crop y ${CROP_Y}..${CROP_Y + 1350} contains the safe zone, so it cuts no copy`)
  } else {
    const feedCopy = `out/check/${id}-4x5-copy.mp4`
    copyRender('video', feedCopy, `${id}-4x5`, 0.4) // 432x540: H264 needs even dimensions
    const f = bands(feedCopy, 432, 540, false)
    const edge = ranges(f.top.map((v, i) => v > TH || f.bottom[i] > TH || f.left[i] > TH || f.right[i] > TH), fps)
    if (edge.length) fail(`4:5 layout: copy within ${MARGIN} px of an edge at ${fmtR(edge, fps)}`); else pass(`4:5 layout: copy inside ${MARGIN} px margins`)
    if (f.middle[0] > TH) pass('4:5 layout: frame 0 shows copy'); else fail('4:5 layout: frame 0 shows no copy')
    if (!f.middle.some((v) => v > TH)) fail('4:5 layout: no copy at all')
  }
  reportSmallText()
  // A short gap with no copy between two beats is two fades meeting; a long one may be a picture-only beat.
  const blank = b.middle.map((v, i) => v <= TH && b.top[i] <= TH && b.bottom[i] <= TH)
  const gaps = ranges(blank, fps)
  const short = gaps.filter(([a, z]) => a > 0 && z < blank.length - 1 && z - a + 1 <= Math.round(fps / 2))
  const long = gaps.filter((g) => !short.includes(g) && !(g[1] === blank.length - 1 && g[1] - g[0] + 1 <= Math.round(fps / 2))) // ignore the final fade-out
  if (short.length) fail(`copy disappears for under 0.5 s between beats at ${fmtR(short, fps)}: fades meet at an empty frame (use timeline() and the same fade in Say)`)
  if (long.length) warn(`no copy on screen at ${fmtR(long, fps)}: fine for a picture-only beat, check it`)

  // Contact sheet: one cell per started second, from the frame count (a container duration of 6.06 s is still 6 cells).
  const cells = Math.ceil(frames / fps), cols = 6, rows = Math.ceil(cells / cols)
  run('ffmpeg', ['-loglevel', 'error', '-y', '-i', master, '-vf', `select='not(mod(n\\,${Math.round(fps)}))',scale=270:-1,tile=${cols}x${rows}`, '-frames:v', '1', '-fps_mode', 'passthrough', `out/check/${id}-sheet.png`])
  const beatArg = arg('--beats')
  const at = beatArg ? beatArg.split(',').map((x) => Number(x)) : Array.from({ length: cells }, (_, i) => Math.round(i * fps))
  const badBeats = at.filter((f) => !Number.isInteger(f) || f < 0 || f >= frames)
  if (badBeats.length) fail(`--beats outside 0..${frames - 1}: ${badBeats.join(', ')}`)
  let written = 0
  for (const f of at.filter((x) => !badBeats.includes(x))) {
    const tag = String(f).padStart(4, '0')
    for (const [src, name] of [[master, `${id}-f${tag}.png`], [feed, `${id}-4x5-f${tag}.png`]]) {
      const outPng = `out/check/${name}`
      fs.rmSync(outPng, { force: true })
      run('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-vf', `select='eq(n\\,${f})'`, '-frames:v', '1', '-fps_mode', 'passthrough', outPng])
      if (fs.existsSync(outPng) && fs.statSync(outPng).size > 0) written++; else fail(`could not extract frame ${f} from ${src}`)
    }
  }
  pass(`wrote out/check/${id}-sheet.png (${cells} cells) and ${written} full-size stills (9:16 and 4:5${beatArg ? ', at --beats' : ', one per second'}): look at them`)
}

const report = [`# Check: ${id} (${mode})`, '', ...results.map(([s, m]) => `- **${s}** ${m}`), '',
  'Still to do by eye: frame 0 carries the hook without a label; each caption\'s action is visible in its frame; no caption covers its subject; what is sold and why it matters is clear by the middle; view the stills at phone size. Custom elements that do not use the src/lib.tsx components are invisible to this check.'].join('\n')
fs.writeFileSync(`out/check/${id}-check.md`, report + '\n')
console.log(report)
process.exit(results.some(([s]) => s === 'FAIL') ? 1 : 0)
