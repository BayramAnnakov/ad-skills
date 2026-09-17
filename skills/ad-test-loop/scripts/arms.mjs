#!/usr/bin/env node
// How much can a small ad test tell you? No dependencies.
//
//   node scripts/arms.mjs compare A=<events>/<exposure> B=<events>/<exposure>
//       Exposure = spend, impressions or link clicks, the same unit for both arms. Exact conditional test for two
//       Poisson counts (given the total, arm A's count is binomial) and a 95% interval for the rate ratio A/B.
//   node scripts/arms.mjs plan --budget <per arm> --cost <expected cost per event> [--ratio 2]
//       Expected events per arm, the chance that a true difference of --ratio (either direction) shows up as
//       significant (alpha 0.05, two-sided), and the smallest ratio this budget detects with 80% power.
//
// The arithmetic assumes the two arms saw comparable people: a randomized split test, or one matched pair of ads in
// separate ad sets. It cannot repair adaptive delivery inside a pooled ad set, changed tracking definitions, or one
// buyer counted several times. Below 10 events in either arm the verdict is always "screen only".

const logFact = (() => { const c = [0]; return (n) => { for (let i = c.length; i <= n; i++) c[i] = c[i - 1] + Math.log(i); return c[n] } })()
const binPmf = (k, n, p) => (p <= 0 ? (k === 0 ? 1 : 0) : p >= 1 ? (k === n ? 1 : 0) : Math.exp(logFact(n) - logFact(k) - logFact(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p)))
const binCdf = (k, n, p) => { let s = 0; for (let i = 0; i <= k; i++) s += binPmf(i, n, p); return Math.min(1, s) }

// Two-sided exact binomial p-value (sum of outcomes no more likely than the observed one).
export function binomTwoSided(x, n, p) {
  const px = binPmf(x, n, p)
  let s = 0
  for (let k = 0; k <= n; k++) { const q = binPmf(k, n, p); if (q <= px * (1 + 1e-7)) s += q }
  return Math.min(1, s)
}
// Clopper-Pearson bounds by bisection.
function cp(x, n, alpha = 0.05) {
  const bis = (f) => { let lo = 0, hi = 1; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(m)) hi = m; else lo = m } return (lo + hi) / 2 }
  const lower = x === 0 ? 0 : bis((p) => 1 - binCdf(x - 1, n, p) >= alpha / 2)
  const upper = x === n ? 1 : bis((p) => binCdf(x, n, p) <= alpha / 2)
  return [lower, upper]
}
const okCount = (v) => Number.isInteger(v) && v >= 0
const okPositive = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0
export function compare(xa, ea, xb, eb) {
  if (!okCount(xa) || !okCount(xb)) throw new Error('events must be whole numbers >= 0')
  if (!okPositive(ea) || !okPositive(eb)) throw new Error('exposure must be a finite number > 0 in both arms')
  const n = xa + xb
  const p0 = ea / (ea + eb)
  const p = n === 0 ? 1 : binomTwoSided(xa, n, p0)
  const ratio = xb === 0 ? Infinity : (xa / ea) / (xb / eb)
  const [lo, hi] = n === 0 ? [0, 1] : cp(xa, n)
  const toRatio = (pi) => (pi >= 1 ? Infinity : (pi / (1 - pi)) * (eb / ea))
  const ci = [toRatio(lo), toRatio(hi)]
  const verdict = Math.min(xa, xb) < 10 ? 'screen only' : ci[0] > 1 || ci[1] < 1 ? 'clear difference' : 'inconclusive'
  return { p, ratio, ci, verdict }
}
const poisPmf = (k, l) => Math.exp(-l + k * Math.log(l) - logFact(k))
export function power(lambdaB, ratio, alpha = 0.05) {
  if (!okPositive(lambdaB) || lambdaB > 5000) throw new Error('expected events per arm must be > 0 and at most 5000')
  if (!okPositive(ratio) || ratio === 1) throw new Error('ratio must be a positive number other than 1')
  const la = lambdaB * ratio
  const max = (l) => Math.ceil(l + 8 * Math.sqrt(l) + 10)
  const pvals = new Map()
  let pow = 0
  for (let xa = 0; xa <= max(la); xa++) {
    const pa = poisPmf(xa, la)
    if (pa < 1e-12) continue
    for (let xb = 0; xb <= max(lambdaB); xb++) {
      const pb = poisPmf(xb, lambdaB)
      if (pb < 1e-12) continue
      const key = `${xa},${xb}`
      let pv = pvals.get(key)
      if (pv === undefined) { pv = xa + xb === 0 ? 1 : binomTwoSided(xa, xa + xb, 0.5); pvals.set(key, pv) }
      if (pv < alpha && xa !== xb && (xa > xb) === (ratio > 1)) pow += pa * pb
    }
  }
  return pow
}
export function plan(budget, cost, ratio = 2) {
  const events = budget / cost
  const pw = power(events, ratio)
  let mdr = null
  for (let r = 1.1; r <= 20; r = Math.round((r + 0.1) * 10) / 10) { if (power(events, r) >= 0.8) { mdr = r; break } }
  // A decrease is detected as easily as the matching increase only approximately; both are reported by the CLI.
  return { events, power: pw, minDetectableRatio: mdr }
}

const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : 'inf')
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('arms.mjs')) {
  const [cmd, ...rest] = process.argv.slice(2)
  if (cmd === 'compare') {
    const parse = (s) => { const m = /^([AB])=(\d+)\/(\d+(?:\.\d+)?)$/.exec(s || ''); if (!m || !(Number(m[3]) > 0)) { console.error('usage: compare A=<events>/<exposure> B=<events>/<exposure> (events a whole number, exposure > 0)'); process.exit(2) } return [Number(m[2]), Number(m[3])] }
    const [xa, ea] = parse(rest.find((s) => s.startsWith('A='))), [xb, eb] = parse(rest.find((s) => s.startsWith('B=')))
    const r = compare(xa, ea, xb, eb)
    console.log(`A ${xa} events / ${ea}  vs  B ${xb} / ${eb}`)
    console.log(`rate ratio A/B ${fmt(r.ratio)}  95% interval ${fmt(r.ci[0])} .. ${fmt(r.ci[1])}  p=${fmt(r.p, 3)}`)
    console.log(`verdict: ${r.verdict}${r.verdict === 'screen only' ? ' (fewer than 10 events in an arm: a gross failure can show, a winner cannot)' : ''}`)
    console.log('valid only if the arms saw comparable people (randomized split or one matched pair); not for ads pooled in one ad set')
  } else if (cmd === 'plan') {
    const get = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? Number(rest[i + 1]) : d }
    const budget = get('--budget'), cost = get('--cost'), ratio = get('--ratio', 2)
    if (!okPositive(budget) || !okPositive(cost) || !okPositive(ratio) || ratio === 1 || budget / cost > 5000) { console.error('usage: plan --budget <per arm> --cost <cost per event> [--ratio 2] (finite, > 0, ratio != 1, at most 5000 expected events)'); process.exit(2) }
    const r = plan(budget, cost, ratio)
    const up = ratio > 1 ? ratio : 1 / ratio
    console.log(`expected events per arm: ${fmt(r.events, 1)}`)
    console.log(`chance a true ${ratio}x difference shows as significant: ${fmt(r.power * 100, 0)}% (a ${fmt(up)}x increase: ${fmt(power(r.events, up) * 100, 0)}%, the matching decrease: ${fmt(power(r.events, 1 / up) * 100, 0)}%)`)
    console.log(`smallest ratio detected with 80% power: ${r.minDetectableRatio ? r.minDetectableRatio + 'x' : 'more than 20x: this budget cannot pick a winner'}`)
    if (r.events < 10) console.log('fewer than 10 expected events per arm: plan it as a screen for gross failures, not a winner-picker')
  } else { console.error('usage: arms.mjs compare|plan (see header)'); process.exit(2) }
}
