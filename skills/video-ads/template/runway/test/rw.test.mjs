// node --test runway/test/  (no network, no credits: fetch is mocked)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const RW = path.resolve(here, '..', 'rw.mjs')
const MOCK = path.resolve(here, 'mock-fetch.mjs')
const SAMPLE_JPG = path.resolve(here, '..', '..', 'public', 'sample', 'paper-sheet.jpg')

function project() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw test ')) // a space in the path on purpose
  fs.writeFileSync(path.join(dir, 'prompt.txt'), 'a calm harbour at dawn')
  return dir
}
function rw(dir, args, { env = {}, mock = {} } = {}) {
  const logFile = path.join(dir, `calls-${Math.random()}.log`)
  fs.writeFileSync(logFile, '')
  return new Promise((resolve) => {
    const p = spawn(process.execPath, ['--import', MOCK, RW, ...args], {
      cwd: dir,
      env: { PATH: process.env.PATH, RUNWAY_API_KEY: 'test', RUNWAY_POLL_S: '0.01', RW_MOCK: JSON.stringify(mock), RW_MOCK_LOG: logFile, ...env },
    })
    let out = ''
    p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d))
    p.on('close', (code) => {
      const calls = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
      resolve({ code, out, calls, posts: calls.filter((c) => c.method === 'POST').length })
    })
  })
}
const ledger = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'runway', 'ledger.json'), 'utf8'))

test('refuses a veo3.1 clip whose measured price exceeds the cap, before any request', async () => {
  const d = project()
  const r = await rw(d, ['t2v', 'a', '8', 'prompt.txt', '--approved', '200'], { env: { RUNWAY_MODEL: 'veo3.1', RUNWAY_CAP: '100' } })
  assert.equal(r.code, 2); assert.match(r.out, /CAP: 0 credits .* \+ 160 > RUNWAY_CAP 100/); assert.equal(r.posts, 0)
})

test('requires a per-run approval that covers the estimate', async () => {
  const d = project()
  const none = await rw(d, ['t2v', 'a', '8', 'prompt.txt'], { env: { RUNWAY_CAP: '1000' } })
  assert.equal(none.code, 2); assert.match(none.out, /--approved <credits> is required.*Estimate: 80/)
  const low = await rw(d, ['t2v', 'a', '8', 'prompt.txt', '--approved', '50'], { env: { RUNWAY_CAP: '1000' } })
  assert.equal(low.code, 2); assert.match(low.out, /estimate 80 credits exceeds --approved 50/)
  assert.equal(none.posts + low.posts, 0)
})

test('rejects non-numeric, infinite and zero limits and prices', async () => {
  const d = project()
  for (const env of [{ RUNWAY_CAP: 'Infinity' }, { RUNWAY_CAP: '0' }, { RUNWAY_CAP: '1000', RUNWAY_PRICE_PER_S: 'oops' }]) {
    const r = await rw(d, ['t2v', 'a', '8', 'prompt.txt', '--approved', '100'], { env })
    assert.equal(r.code, 2, JSON.stringify(env)); assert.match(r.out, /must be a finite positive number/); assert.equal(r.posts, 0)
  }
})

test('a lower RUNWAY_PRICE_PER_S cannot lower the estimate', async () => {
  const d = project()
  const r = await rw(d, ['t2v', 'a', '8', 'prompt.txt', '--approved', '100'], { env: { RUNWAY_MODEL: 'veo3.1', RUNWAY_CAP: '1000', RUNWAY_PRICE_PER_S: '1' } })
  assert.equal(r.code, 2); assert.match(r.out, /estimate 160 credits exceeds --approved 100/)
})

test('unknown model, bad duration, bad ratio and negativePrompt on a model without it are refused', async () => {
  const d = project()
  const base = { RUNWAY_CAP: '1000' }
  assert.match((await rw(d, ['t2v', 'a', '8', 'prompt.txt', '--approved', '999'], { env: { ...base, RUNWAY_MODEL: 'gen9' } })).out, /unknown model/)
  assert.match((await rw(d, ['t2v', 'a', '5', 'prompt.txt', '--approved', '999'], { env: base })).out, /duration must be one of 4, 6, 8/)
  assert.match((await rw(d, ['t2v', 'a', '8', 'prompt.txt', '--approved', '999'], { env: { ...base, RUNWAY_RATIO: '1:1' } })).out, /ratio must be one of/)
  fs.writeFileSync(path.join(d, 'prompt.neg.txt'), 'no text')
  assert.match((await rw(d, ['t2v', 'a', '8', 'prompt.txt', '--approved', '999'], { env: { ...base, RUNWAY_MODEL: 'wan3' } })).out, /has no negativePrompt field/)
})

test('success: reserves, submits, downloads a real mp4 and records the measured cost', async () => {
  const d = project()
  const r = await rw(d, ['t2v', 'clip1', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200' }, mock: { balance: [1000, 920] } })
  assert.equal(r.code, 0, r.out); assert.equal(r.posts, 1)
  const [e] = ledger(d)
  assert.equal(e.status, 'succeeded'); assert.equal(e.measured, 80); assert.equal(e.taskId, 'task-1')
  assert.ok(fs.statSync(path.join(d, 'runway', 'clip1.mp4')).size > 10000)
})

test('an HTTP 403 download saves nothing and points to resume', async () => {
  const d = project()
  const r = await rw(d, ['t2v', 'clip1', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200' }, mock: { download: { status: 403 } } })
  assert.equal(r.code, 3); assert.match(r.out, /download failed or not a playable video \(HTTP 403.*resume clip1 task-1/)
  assert.equal(fs.existsSync(path.join(d, 'runway', 'clip1.mp4')), false)
  assert.equal(ledger(d)[0].status, 'download_failed')
})

test('polling HTTP errors do not loop forever: timeout keeps the reservation', async () => {
  const d = project()
  const r = await rw(d, ['t2v', 'clip1', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200', RUNWAY_TIMEOUT_S: '0.3' }, mock: { polls: [{ status: 500, body: { error: 'x' } }] } })
  assert.equal(r.code, 3); assert.match(r.out, /still not finished.*resume clip1 task-1/)
  const [e] = ledger(d); assert.equal(e.status, 'timeout')
  const again = await rw(d, ['t2v', 'clip2', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '1000' } })
  assert.match(again.out, /cost not known for clip1 \(timeout, task task-1\)/); assert.equal(again.posts, 0)
})

test('resume downloads an existing task without creating a new one', async () => {
  const d = project()
  await rw(d, ['t2v', 'clip1', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200' }, mock: { download: { status: 403 } } })
  const r = await rw(d, ['resume', 'clip1', 'task-1'], { mock: { balance: [920] } })
  assert.equal(r.code, 0, r.out); assert.equal(r.posts, 0); assert.match(r.out, /no new task created/)
  assert.equal(ledger(d).length, 1); assert.equal(ledger(d)[0].status, 'succeeded')
})

test('two concurrent runs cannot both spend the same remaining budget', async () => {
  const d = project()
  const opts = { env: { RUNWAY_CAP: '100' }, mock: { createDelayMs: 400 } }
  const [a, b] = await Promise.all([rw(d, ['t2v', 'x', '8', 'prompt.txt', '--approved', '80'], opts), rw(d, ['t2v', 'y', '8', 'prompt.txt', '--approved', '80'], opts)])
  assert.equal(a.posts + b.posts, 1, a.out + b.out)
  assert.equal([a.code, b.code].sort().join(','), '0,2')
  assert.equal(ledger(d).length, 1)
})

test('an unreadable balance keeps the estimate as the held amount', async () => {
  const d = project()
  const r = await rw(d, ['t2v', 'clip1', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200' }, mock: { balance: ['oops'] } })
  assert.equal(r.code, 0, r.out)
  const s = await rw(d, ['status'])
  assert.match(s.out, /total held against the cap: 80 credits/)
})

test('a 4xx create is recorded as refused and holds nothing; a bill above the estimate stops the batch', async () => {
  const d = project()
  const bad = await rw(d, ['t2v', 'c', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200' }, mock: { create: { status: 400, body: { error: 'bad field' } } } })
  assert.equal(bad.code, 1); assert.equal(ledger(d)[0].status, 'refused')
  const over = await rw(d, ['t2v', 'c2', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200' }, mock: { balance: [1000, 840] } })
  assert.equal(over.code, 4); assert.match(over.out, /billed 160 > estimated 80/)
  const s = await rw(d, ['status']); assert.match(s.out, /total held against the cap: 160 credits/)
})

test('paths resolve from the working directory (project root), including i2v frames', async () => {
  const d = project()
  fs.mkdirSync(path.join(d, 'prompts')); fs.writeFileSync(path.join(d, 'prompts', 'p.txt'), 'x')
  const missing = await rw(d, ['i2v', 'a', '8', 'prompts/p.txt', 'frames/none.png', '--approved', '80'], { env: { RUNWAY_CAP: '200' } })
  assert.match(missing.out, /first frame not found: .*frames\/none.png/)
  fs.mkdirSync(path.join(d, 'frames')); fs.writeFileSync(path.join(d, 'frames', 'fake.png'), 'png')
  const fake = await rw(d, ['i2v', 'a', '8', 'prompts/p.txt', 'frames/fake.png', '--approved', '80'], { env: { RUNWAY_CAP: '200' } })
  assert.match(fake.out, /not a PNG, JPEG or WebP image/); assert.equal(fake.posts, 0)
  fs.copyFileSync(SAMPLE_JPG, path.join(d, 'frames', 'f.jpg'))
  const ok = await rw(d, ['i2v', 'a', '8', 'prompts/p.txt', 'frames/f.jpg', '--approved', '80'], { env: { RUNWAY_CAP: '200' } })
  assert.equal(ok.code, 0, ok.out)
})

test('resume reconciles the real bill: an over-bill found at resume stops the batch and holds the measured amount', async () => {
  const d = project()
  await rw(d, ['t2v', 'clip1', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200', RUNWAY_TIMEOUT_S: '0.2' }, mock: { balance: [1000], polls: [{ status: 200, body: { status: 'RUNNING' } }] } })
  const r = await rw(d, ['resume', 'clip1', 'task-1'], { mock: { balance: [840] } })
  assert.equal(r.code, 4); assert.match(r.out, /billed 160 > estimated 80/)
  const next = await rw(d, ['t2v', 'clip2', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200' } })
  assert.match(next.out, /CAP: 160 credits already reserved or spent \+ 80 > RUNWAY_CAP 200/); assert.equal(next.posts, 0)
})

test('resume refuses path traversal, a task under another name, and an unknown task without an estimate', async () => {
  const d = project()
  assert.match((await rw(d, ['resume', '../../escaped', 'task-9'])).out, /name: letters/)
  assert.match((await rw(d, ['resume', 'x', 'task-9'])).out, /not in this ledger: add --estimate/)
  await rw(d, ['t2v', 'clip1', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200' }, mock: { download: { status: 403 } } })
  assert.match((await rw(d, ['resume', 'other', 'task-1'])).out, /belongs to "clip1"/)
  const unknown = await rw(d, ['resume', 'y', 'task-7', '--estimate', '40'], { mock: { balance: [1000] } })
  assert.equal(unknown.posts, 0); assert.ok(ledger(d).some((e) => e.taskId === 'task-7' && e.estimate === 40))
})

test('a ledger entry without a valid amount stops spending; an old-format credits field still counts', async () => {
  const d = project()
  fs.mkdirSync(path.join(d, 'runway'))
  fs.writeFileSync(path.join(d, 'runway', 'ledger.json'), JSON.stringify([{ id: 'x', name: 'old', status: 'succeeded', estimate: 'oops' }]))
  const bad = await rw(d, ['t2v', 'a', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '80' } })
  assert.match(bad.out, /has no valid amount/); assert.equal(bad.posts, 0)
  fs.writeFileSync(path.join(d, 'runway', 'ledger.json'), JSON.stringify([{ name: 'legacy', id: 'task-old', credits: 160, at: '2026-09-12T00:00:00Z', status: 'succeeded' }]))
  const legacy = await rw(d, ['t2v', 'a', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '200' } })
  assert.match(legacy.out, /CAP: 160 credits/); assert.equal(legacy.posts, 0)
})

test('a stale lock from a killed run is removed; a header-only fake video is rejected; an existing clip is not overwritten', async () => {
  const d = project()
  fs.mkdirSync(path.join(d, 'runway'))
  fs.writeFileSync(path.join(d, 'runway', 'ledger.lock'), '999999')
  const ok = await rw(d, ['t2v', 'clip1', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '400' } })
  assert.equal(ok.code, 0, ok.out)
  const again = await rw(d, ['t2v', 'clip1', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '400' } })
  assert.match(again.out, /already exists/); assert.equal(again.posts, 0)
  const fake = await rw(d, ['t2v', 'clip2', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '400' }, mock: { download: { status: 200, type: 'video/mp4', bytes: 'fake' } } })
  assert.equal(fake.code, 3); assert.match(fake.out, /not a playable video/)
  assert.equal(fs.existsSync(path.join(d, 'runway', 'clip2.mp4')), false)
})

test('reconcile records a billed amount and unblocks new work', async () => {
  const d = project()
  await rw(d, ['t2v', 'clip1', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '400' }, mock: { create: { status: 502, body: { error: 'gateway' } } } })
  const blocked = await rw(d, ['t2v', 'clip2', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '400' } })
  assert.match(blocked.out, /cost not known for clip1 \(uncertain/)
  const id = ledger(d)[0].id
  assert.equal((await rw(d, ['reconcile', id, '0'])).code, 0)
  const ok = await rw(d, ['t2v', 'clip2', '8', 'prompt.txt', '--approved', '80'], { env: { RUNWAY_CAP: '400' } })
  assert.equal(ok.code, 0, ok.out)
})
