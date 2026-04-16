import {beforeEach, describe, expect, test} from '@jest/globals'

import {
  __resetAllForTests,
  resetAutoRetry,
  tryAutoRetry,
} from '#/features/activityAndRecap/queries/retryBudget'

beforeEach(() => {
  __resetAllForTests()
})

describe('retry budget (AC-B8)', () => {
  test('allows 2 retries per hour, rejects 3rd', () => {
    const t0 = 1_700_000_000_000
    expect(tryAutoRetry('2026-W15', t0)).toBe(true)
    expect(tryAutoRetry('2026-W15', t0 + 100)).toBe(true)
    expect(tryAutoRetry('2026-W15', t0 + 200)).toBe(false)
  })

  test('hour rollover resets the budget', () => {
    const t0 = 1_700_000_000_000
    expect(tryAutoRetry('2026-W15', t0)).toBe(true)
    expect(tryAutoRetry('2026-W15', t0 + 100)).toBe(true)
    expect(tryAutoRetry('2026-W15', t0 + 200)).toBe(false)
    // +1h
    expect(tryAutoRetry('2026-W15', t0 + 60 * 60 * 1000 + 1)).toBe(true)
  })

  test('buckets are per-weekIso', () => {
    const t0 = 1_700_000_000_000
    expect(tryAutoRetry('2026-W15', t0)).toBe(true)
    expect(tryAutoRetry('2026-W15', t0)).toBe(true)
    // W14 has its own bucket
    expect(tryAutoRetry('2026-W14', t0)).toBe(true)
    expect(tryAutoRetry('2026-W14', t0)).toBe(true)
  })

  test('resetAutoRetry clears a specific bucket', () => {
    const t0 = 1_700_000_000_000
    tryAutoRetry('2026-W15', t0)
    tryAutoRetry('2026-W15', t0)
    expect(tryAutoRetry('2026-W15', t0)).toBe(false)
    resetAutoRetry('2026-W15')
    expect(tryAutoRetry('2026-W15', t0)).toBe(true)
  })
})
