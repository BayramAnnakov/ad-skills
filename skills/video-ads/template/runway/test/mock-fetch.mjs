// Replaces global fetch for rw.mjs tests. Scenario comes from RW_MOCK (JSON); every call is appended to RW_MOCK_LOG.
import fs from 'node:fs'
const sc = JSON.parse(process.env.RW_MOCK || '{}')
const log = (x) => fs.appendFileSync(process.env.RW_MOCK_LOG, JSON.stringify(x) + '\n')
let bal = 0, poll = 0
const res = (status, body, type = 'application/json') => new Response(typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body), { status, headers: { 'content-type': type } })
// A real, playable clip from the template's sample assets (the fake header-only buffer the first version used passed the
// helper's check but not ffprobe).
const REAL_MP4 = fs.readFileSync(new URL('../../public/sample/clip-plain.mp4', import.meta.url))
const mp4 = (n) => (n === 'fake' ? (() => { const b = new Uint8Array(20000); b.set(Buffer.from('\0\0\0\x18ftypmp42', 'latin1'), 0); return b })() : REAL_MP4)
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url); const method = opts.method || 'GET'
  log({ method, url: u })
  if (u.endsWith('/organization')) { const seq = sc.balance ?? [1000, 1000]; const v = seq[Math.min(bal++, seq.length - 1)]; return res(200, { creditBalance: v }) }
  if (method === 'POST') { if (sc.createDelayMs) await new Promise((r) => setTimeout(r, sc.createDelayMs)); const c = sc.create ?? { status: 200, body: { id: 'task-1' } }; return res(c.status, c.body) }
  if (u.includes('/tasks/')) { const seq = sc.polls ?? [{ status: 200, body: { status: 'SUCCEEDED', output: ['https://cdn.example/out.mp4'] } }]; const p = seq[Math.min(poll++, seq.length - 1)]; return res(p.status, p.body) }
  if (u.startsWith('https://cdn.example/')) { const d = sc.download ?? { status: 200, type: 'video/mp4' }; return d.status === 200 ? res(200, mp4(d.bytes), d.type) : res(d.status, '<Error>AccessDenied</Error>', 'application/xml') }
  return res(404, { error: 'unmocked ' + u })
}
