#!/usr/bin/env node
// Runway generated footage behind a spending boundary. PAID: every generate call bills credits.
//
//   node runway/rw.mjs t2v <name> <seconds> <prompt.txt> --approved <credits>
//   node runway/rw.mjs i2v <name> <seconds> <prompt.txt> <first-frame.png|jpg|webp> --approved <credits>
//   node runway/rw.mjs resume <name> <taskId> [--estimate <credits>]   (download an existing task; never creates one)
//   node runway/rw.mjs reconcile <taskId|entryId> <credits>           (record the billed amount from the dashboard)
//   node runway/rw.mjs status                                          (the ledger and what counts against the cap)
//
// Environment:
//   RUNWAY_API_KEY (or RUNWAY_ENV_FILE=<file with RUNWAY_API_KEY=...>)
//   RUNWAY_CAP       total credits the user approved for this project folder (required for t2v/i2v)
//   RUNWAY_MODEL     one of the models in MODELS below (default veo3.1_fast)
//   RUNWAY_AUDIO=1   request audio where the model has an audio field (costs more; ads are silent by default)
//   RUNWAY_PRICE_PER_S  only raises the estimate (for a model whose billed price you measured higher)
//   RUNWAY_OUT       folder for clips and ledger.json (default ./runway, relative to the working directory)
//   RUNWAY_POLL_S / RUNWAY_TIMEOUT_S  poll interval (8) and give-up time (1200) for one task
//
// What the boundary is, exactly: --approved is the user's yes for THIS run, in credits, and the run refuses when the
// ESTIMATE exceeds it or when the estimate plus everything already held in the ledger exceeds RUNWAY_CAP. Estimates use
// conservative per-model prices, but a provider can still bill more than any estimate: the first bill above its
// estimate stops the batch (exit 4) and nothing new starts until the price is raised. A task is reserved in the ledger
// under a lock BEFORE the paid request, so concurrent runs cannot spend the same budget and a crash leaves a record.
// A task whose cost is not yet known (timed out, crashed, failed, download failed) blocks new generation until it is
// resumed or reconciled. The measured cost is the account balance change, which other jobs or a top-up can distort.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// Credits per second, conservative, measured on real bills (12 Sep 2026) where noted. Prices change: when a bill is
// higher than the estimate, the run stops the batch (see the end of generate()). Durations and ratios accepted here
// are the ones used successfully; extend them only from the Runway API reference.
const MODELS = {
  'veo3.1_fast': { perS: 10, perSAudio: 15, durations: [4, 6, 8], ratios: ['720:1280', '1280:720'], audioField: true, negativePrompt: true }, // measured 10/s silent
  'veo3.1': { perS: 20, perSAudio: 40, durations: [4, 6, 8], ratios: ['720:1280', '1280:720'], audioField: true, negativePrompt: true }, // billed 20/s silent although listed at 10; audio price not measured, assumed 2x
  wan3: { perS: 20, perSAudio: 20, durations: [4, 6, 8], ratios: ['1080:1920', '1920:1080'], audioField: true, negativePrompt: false }, // measured 20/s
  gemini_omni_flash: { perS: 10, perSAudio: 10, durations: [4, 6, 8], ratios: ['720:1280', '1280:720'], audioField: false, negativePrompt: false }, // measured 10/s; returns an audio track anyway: render muted
}
const API = process.env.RUNWAY_API_BASE || 'https://api.dev.runwayml.com/v1'
const VERSION = '2024-11-06'

let lockHeld = null // the ledger lock while this process holds it: released on normal exit and die(). A killed process
// leaves the file behind; the next run removes it once that pid is gone.
process.on('exit', () => { if (lockHeld) fs.rmSync(lockHeld, { force: true }) })
const alive = (pid) => { try { process.kill(Number(pid), 0); return true } catch (e) { return e.code === 'EPERM' } }
const die = (msg, code = 2) => { console.error(msg); process.exit(code) }
const positive = (name, v) => { const n = Number(v); if (!Number.isFinite(n) || n <= 0) die(`${name} must be a finite positive number, got "${v}"`); return n }

const argv = process.argv.slice(2)
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v }
const approvedArg = flag('--approved')
const approvedEstimate = flag('--estimate')
const [mode, ...pos] = argv
const OUT = path.resolve(process.env.RUNWAY_OUT || 'runway')
const LEDGER = path.join(OUT, 'ledger.json')
const LOCK = path.join(OUT, 'ledger.lock')
const POLL_MS = positive('RUNWAY_POLL_S', process.env.RUNWAY_POLL_S || 8) * 1000
const TIMEOUT_MS = positive('RUNWAY_TIMEOUT_S', process.env.RUNWAY_TIMEOUT_S || 1200) * 1000

const readLedger = () => (fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : [])
const writeLedger = (l) => { fs.writeFileSync(`${LEDGER}.tmp`, JSON.stringify(l, null, 2)); fs.renameSync(`${LEDGER}.tmp`, LEDGER) }
// Credits an entry holds against the cap. Only a request the API refused with a 4xx holds nothing. An entry without a
// valid amount stops everything: unknown spending must never turn into available budget. Ledgers from the older helper
// carry only `credits`.
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null)
const held = (e) => {
  if (e.status === 'refused') return 0
  const amounts = [num(e.estimate), num(e.measured), num(e.credits)].filter((v) => v !== null)
  if (!amounts.length) die(`ledger entry ${e.id ?? e.name ?? '?'} has no valid amount. Fix ${LEDGER} (or run reconcile) before spending more.`)
  return Math.max(...amounts)
}
const OPEN = ['reserved', 'submitted']
const UNRECONCILED = ['timeout', 'uncertain', 'failed', 'download_failed', 'download_ok_cost_unknown']
const needsReconcile = (e) => (UNRECONCILED.includes(e.status) && num(e.measured) === null) || (OPEN.includes(e.status) && !(e.pid && alive(e.pid)))

async function withLock(fn) {
  fs.mkdirSync(OUT, { recursive: true })
  for (let i = 0; ; i++) {
    try { fs.writeFileSync(LOCK, String(process.pid), { flag: 'wx' }); lockHeld = LOCK; break } catch {
      const owner = fs.existsSync(LOCK) ? fs.readFileSync(LOCK, 'utf8').trim() : ''
      if (owner && !alive(owner)) { fs.rmSync(LOCK, { force: true }); continue } // stale lock from a killed run
      if (i > 150) die(`ledger is locked by ${LOCK} (pid ${owner}) for 30 s.`)
      await new Promise((r) => setTimeout(r, 200))
    }
  }
  try { return await fn() } finally { fs.rmSync(LOCK, { force: true }); lockHeld = null }
}
const update = (id, patch) => withLock(async () => { const l = readLedger(); Object.assign(l.find((e) => e.id === id), patch); writeLedger(l) })

function apiKey() {
  let key = process.env.RUNWAY_API_KEY
  if (!key && process.env.RUNWAY_ENV_FILE) key = fs.readFileSync(path.resolve(process.env.RUNWAY_ENV_FILE), 'utf8').match(/^RUNWAY_API_KEY="?([^"\n]+)/m)?.[1]
  if (!key) die('No RUNWAY_API_KEY (set it, or RUNWAY_ENV_FILE)')
  return key
}
const headers = (key) => ({ Authorization: `Bearer ${key}`, 'X-Runway-Version': VERSION, 'Content-Type': 'application/json' })
async function getJson(url, key) {
  const r = await fetch(url, { headers: headers(key), signal: AbortSignal.timeout(30000) })
  const text = await r.text()
  let body; try { body = JSON.parse(text) } catch { body = { raw: text.slice(0, 200) } }
  return { ok: r.ok, status: r.status, body }
}
async function balance(key) {
  try { const r = await getJson(`${API}/organization`, key); const b = Number(r.body?.creditBalance); return r.ok && Number.isFinite(b) ? b : null } catch { return null }
}

async function pollAndDownload(key, entry) {
  const started = Date.now()
  for (;;) {
    if (Date.now() - started > TIMEOUT_MS) {
      await update(entry.id, { status: 'timeout' })
      die(`task ${entry.taskId} still not finished after ${TIMEOUT_MS / 1000} s. Credits stay reserved. Later: node runway/rw.mjs resume ${entry.name} ${entry.taskId}`, 3)
    }
    await new Promise((r) => setTimeout(r, POLL_MS))
    let t
    try { t = await getJson(`${API}/tasks/${entry.taskId}`, key) } catch (e) { console.error(`poll error (will retry): ${e.message}`); continue }
    if (!t.ok) { console.error(`poll HTTP ${t.status} (will retry)`); continue }
    const s = t.body.status
    if (s === 'SUCCEEDED') {
      const url = t.body.output?.[0]
      if (!url) { await update(entry.id, { status: 'download_failed' }); die(`task ${entry.taskId} succeeded without an output URL. Resume: node runway/rw.mjs resume ${entry.name} ${entry.taskId}`, 3) }
      const v = await fetch(url, { signal: AbortSignal.timeout(120000) }).catch((e) => ({ ok: false, status: e.message }))
      const type = v.ok ? v.headers.get('content-type') || '' : ''
      const buf = v.ok ? Buffer.from(await v.arrayBuffer()) : Buffer.alloc(0)
      const file = path.join(OUT, `${entry.name}.mp4`)
      const tmp = `${file}.part`
      let playable = /video|octet-stream/.test(type) && buf.length > 1000 && buf.subarray(4, 8).toString('latin1') === 'ftyp'
      if (playable) {
        fs.writeFileSync(tmp, buf)
        const pr = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', tmp], { encoding: 'utf8' })
        if (pr.error?.code !== 'ENOENT') playable = pr.status === 0 && /\d+,\d+/.test(pr.stdout) // without ffprobe, the header check stands
      }
      if (!playable) {
        fs.rmSync(tmp, { force: true })
        await update(entry.id, { status: 'download_failed' })
        die(`download failed or not a playable video (HTTP ${v.status}, ${type || 'no type'}, ${buf.length} bytes): nothing saved. Output URLs expire; resume soon: node runway/rw.mjs resume ${entry.name} ${entry.taskId}`, 3)
      }
      fs.renameSync(tmp, file)
      return file
    }
    if (s === 'FAILED' || s === 'CANCELLED') {
      await update(entry.id, { status: 'failed', failure: t.body.failure ?? t.body.failureCode ?? s })
      die(`task ${s}: ${t.body.failure ?? ''} ${t.body.failureCode ?? ''}. Credits stay counted until you confirm on the Runway dashboard whether it billed.`, 1)
    }
  }
}

async function generate() {
  const i2v = mode === 'i2v'
  const [name, secondsArg, promptArg, frameArg] = pos
  if (!name || !secondsArg || !promptArg || (i2v && !frameArg)) die('usage: see the header of runway/rw.mjs')
  if (!/^[\w-][\w.-]*$/.test(name)) die('name: letters, digits, dot, dash, underscore only')
  if (fs.existsSync(path.join(OUT, `${name}.mp4`))) die(`${path.join(OUT, name)}.mp4 already exists: choose another name`)
  const modelName = process.env.RUNWAY_MODEL || 'veo3.1_fast'
  const model = MODELS[modelName]
  if (!model) die(`unknown model "${modelName}". Add it to MODELS with its measured price, durations and schema first.`)
  const seconds = Number(secondsArg)
  if (!model.durations.includes(seconds)) die(`${modelName} duration must be one of ${model.durations.join(', ')} s`)
  const ratio = process.env.RUNWAY_RATIO || model.ratios[0]
  if (!model.ratios.includes(ratio)) die(`${modelName} ratio must be one of ${model.ratios.join(', ')}`)
  const audio = process.env.RUNWAY_AUDIO === '1'
  if (audio && !model.audioField) die(`${modelName} has no audio field`)
  let perS = audio ? model.perSAudio : model.perS
  if (process.env.RUNWAY_PRICE_PER_S !== undefined) perS = Math.max(perS, positive('RUNWAY_PRICE_PER_S', process.env.RUNWAY_PRICE_PER_S))
  const estimate = seconds * perS
  const cap = positive('RUNWAY_CAP', process.env.RUNWAY_CAP)
  if (approvedArg === undefined) die(`--approved <credits> is required: the user's yes for this run. Estimate: ${estimate} credits (${seconds} s x ${perS}).`)
  const approved = positive('--approved', approvedArg)
  if (estimate > approved) die(`estimate ${estimate} credits exceeds --approved ${approved}. Ask again with the new number.`)

  const promptFile = path.resolve(promptArg)
  if (!fs.existsSync(promptFile)) die(`prompt file not found: ${promptFile}`)
  const body = { model: modelName, promptText: fs.readFileSync(promptFile, 'utf8').trim(), ratio, duration: seconds }
  if (!body.promptText) die('prompt file is empty')
  if (model.audioField) body.audio = audio
  const negFile = /\.txt$/.test(promptFile) ? promptFile.replace(/\.txt$/, '.neg.txt') : null
  if (negFile && fs.existsSync(negFile)) {
    if (!model.negativePrompt) die(`${modelName} has no negativePrompt field: put the exclusions into the prompt and remove ${negFile}`)
    body.negativePrompt = fs.readFileSync(negFile, 'utf8').trim()
  }
  let url = `${API}/text_to_video`
  if (i2v) {
    const frame = path.resolve(frameArg)
    if (!fs.existsSync(frame)) die(`first frame not found: ${frame}`)
    const head = fs.readFileSync(frame).subarray(0, 12)
    const mime = head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'image/png'
      : head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff ? 'image/jpeg'
      : head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP' ? 'image/webp' : null
    if (!mime) die(`first frame is not a PNG, JPEG or WebP image (checked its bytes): ${frame}`)
    url = `${API}/image_to_video`
    body.promptImage = `data:${mime};base64,${fs.readFileSync(frame).toString('base64')}`
  }
  const key = apiKey()

  // Reserve under the lock, before any paid request.
  const entry = await withLock(async () => {
    const l = readLedger()
    const spent = l.reduce((a, e) => a + held(e), 0)
    const open = l.filter(needsReconcile)
    if (open.length) die(`cost not known for ${open.map((e) => `${e.name} (${e.status}${e.taskId ? ', task ' + e.taskId : ''})`).join(', ')}. Resume or reconcile first:\n  node runway/rw.mjs resume <name> <taskId>\n  node runway/rw.mjs reconcile <taskId> <credits from the dashboard>`)
    if (spent + estimate > cap) die(`CAP: ${spent} credits already reserved or spent + ${estimate} > RUNWAY_CAP ${cap}`)
    const e = { id: `${Date.now()}-${process.pid}`, pid: process.pid, name, model: modelName, seconds, estimate, approved, status: 'reserved', at: new Date().toISOString() }
    l.push(e); writeLedger(l)
    return e
  })
  entry.balanceBefore = await balance(key)
  let r
  try {
    r = await fetch(url, { method: 'POST', headers: headers(key), body: JSON.stringify(body), signal: AbortSignal.timeout(60000) })
  } catch (err) {
    await update(entry.id, { status: 'uncertain', error: err.message, balanceBefore: entry.balanceBefore })
    die(`create request failed (${err.message}); it may or may not have been accepted. Credits stay reserved; check the Runway dashboard before retrying.`, 1)
  }
  const text = await r.text(); let j; try { j = JSON.parse(text) } catch { j = { raw: text.slice(0, 200) } }
  if (!r.ok || !j.id) {
    const refused = r.status >= 400 && r.status < 500
    await update(entry.id, { status: refused ? 'refused' : 'uncertain', error: `HTTP ${r.status} ${JSON.stringify(j).slice(0, 300)}`, balanceBefore: entry.balanceBefore })
    die(`create failed: HTTP ${r.status} ${JSON.stringify(j).slice(0, 300)}${refused ? '' : ' (credits stay reserved until checked)'}`, 1)
  }
  entry.taskId = j.id
  await update(entry.id, { status: 'submitted', taskId: j.id, balanceBefore: entry.balanceBefore })
  console.log(`task ${j.id} submitted: ${modelName} ${seconds} s, estimate ${estimate} credits`)
  const file = await pollAndDownload(key, entry)
  const after = await balance(key)
  const measured = entry.balanceBefore !== null && after !== null ? entry.balanceBefore - after : null
  await update(entry.id, { status: 'succeeded', file: path.relative(process.cwd(), file), balanceAfter: after, measured })
  console.log(`saved ${file}; measured ${measured ?? 'unknown (balance unreadable)'} credits, estimate ${estimate}`)
  if (measured !== null && measured > estimate) die(`WARNING: billed ${measured} > estimated ${estimate}. Raise the price in MODELS (or RUNWAY_PRICE_PER_S) and re-ask before the next task.`, 4)
}

async function resume() {
  const [name, taskId] = pos
  if (!name || !taskId) die('usage: node runway/rw.mjs resume <name> <taskId> [--estimate <credits>]')
  if (!/^[\w-][\w.-]*$/.test(name)) die('name: letters, digits, dot, dash, underscore only')
  const key = apiKey()
  const l = readLedger()
  let entry = l.find((e) => e.taskId === taskId)
  if (entry && entry.name !== name) die(`task ${taskId} belongs to "${entry.name}" in the ledger: resume it with that name`)
  if (!entry) {
    if (approvedEstimate === undefined) die(`task ${taskId} is not in this ledger: add --estimate <credits> (what it was expected to cost) so it counts against the cap`)
    entry = { id: `${Date.now()}-${process.pid}`, pid: process.pid, name, taskId, estimate: positive('--estimate', approvedEstimate), status: 'submitted', note: 'resumed a task not in this ledger', at: new Date().toISOString() }
    await withLock(async () => { const l2 = readLedger(); l2.push(entry); writeLedger(l2) })
  }
  if (fs.existsSync(path.join(OUT, `${name}.mp4`))) die(`${path.join(OUT, name)}.mp4 already exists`)
  const file = await pollAndDownload(key, entry)
  // The charge happened when the task was created. The balance change since then is attributable to this task only if
  // no other task was created after it.
  const after = await balance(key)
  const later = readLedger().filter((e) => e.id !== entry.id && e.at > entry.at && e.status !== 'refused')
  const measured = num(entry.balanceBefore) !== null && after !== null && !later.length ? entry.balanceBefore - after : null
  await update(entry.id, { status: measured === null ? 'download_ok_cost_unknown' : 'succeeded', file: path.relative(process.cwd(), file), balanceAfter: after, measured })
  console.log(`saved ${file} (no new task created); measured ${measured ?? 'unknown'} credits, estimate ${entry.estimate}`)
  if (measured === null) die(`cost not attributable (another task ran since, or no balance recorded). Record it: node runway/rw.mjs reconcile ${taskId} <credits>`, 4)
  if (measured > entry.estimate) die(`WARNING: billed ${measured} > estimated ${entry.estimate}. Raise the price in MODELS (or RUNWAY_PRICE_PER_S) and re-ask before the next task.`, 4)
}

async function reconcile() {
  const [ref, creditsArg] = pos
  if (!ref || creditsArg === undefined) die('usage: node runway/rw.mjs reconcile <taskId|entryId> <credits>')
  const credits = Number(creditsArg)
  if (!Number.isFinite(credits) || credits < 0) die('credits must be a finite number >= 0')
  await withLock(async () => {
    const l = readLedger()
    const e = l.find((x) => x.taskId === ref || x.id === ref)
    if (!e) die(`no ledger entry for ${ref}`)
    Object.assign(e, { measured: credits, status: e.status === 'download_ok_cost_unknown' ? 'succeeded' : `${e.status}+reconciled`, reconciledAt: new Date().toISOString() })
    writeLedger(l)
  })
  console.log(`recorded ${credits} credits for ${ref}`)
}

function status() {
  const l = readLedger()
  for (const e of l) console.log(`${e.at}  ${String(e.name).padEnd(20)} ${String(e.model ?? '').padEnd(18)} ${e.status.padEnd(15)} estimate ${e.estimate}  measured ${e.measured ?? '-'}  holds ${held(e)}`)
  console.log(`total held against the cap: ${l.reduce((a, e) => a + held(e), 0)} credits`)
}

if (mode === 't2v' || mode === 'i2v') await generate()
else if (mode === 'resume') await resume()
else if (mode === 'reconcile') await reconcile()
else if (mode === 'status') status()
else die('usage: see the header of runway/rw.mjs')
