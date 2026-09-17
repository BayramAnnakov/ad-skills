import { test } from 'node:test'
import assert from 'node:assert/strict'
import { binomTwoSided, compare, plan, power } from '../arms.mjs'

// Reference values computed independently with Python's math.comb (see the command in the package ISSUES.md).
test('two-sided binomial p matches an independent computation', () => {
  assert.ok(Math.abs(binomTwoSided(20, 30, 0.5) - 0.098737) < 1e-5)
  assert.ok(Math.abs(binomTwoSided(3, 20, 0.5) - 0.002577) < 1e-5)
})
test('20 vs 10 events at equal spend is inconclusive; 40 vs 10 is a clear difference', () => {
  assert.equal(compare(20, 100, 10, 100).verdict, 'inconclusive')
  assert.equal(compare(40, 100, 10, 100).verdict, 'clear difference')
})
test('tiny counts are a screen only', () => {
  assert.equal(compare(4, 50, 1, 50).verdict, 'screen only')
})
test('unequal exposure is accounted for', () => {
  const r = compare(20, 200, 10, 100)
  assert.ok(Math.abs(r.ratio - 1) < 1e-9)
  assert.ok(r.p > 0.9)
})
test('planner: 10 expected events per arm cannot reliably detect a 2x difference', () => {
  const r = plan(40, 4, 2)
  assert.ok(r.power < 0.5, `power ${r.power}`)
  assert.ok(r.minDetectableRatio > 2.5)
})

test('impossible inputs are rejected instead of producing a verdict', () => {
  assert.throws(() => compare(1, 0, 0, 10), /exposure/)
  assert.throws(() => compare(1.5, 10, 0, 10), /whole numbers/)
  assert.throws(() => compare(1, NaN, 0, 10), /exposure/)
  assert.throws(() => power(Infinity, 2), /expected events/)
  assert.throws(() => power(10, 1), /ratio/)
})
test('10 vs 0 events is a screen, never a winner', () => {
  assert.equal(compare(10, 100, 0, 100).verdict, 'screen only')
})
test('a decrease is detected like the same comparison with the arms swapped', () => {
  // A at half of B's 30 expected events is the same experiment as A at twice B's 15.
  const down = power(30, 0.5), swapped = power(15, 2)
  assert.ok(down > 0.4, `decrease power ${down}`)
  assert.ok(Math.abs(down - swapped) < 0.01, `down ${down} swapped ${swapped}`)
})
