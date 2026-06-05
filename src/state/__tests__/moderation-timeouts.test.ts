import {beforeEach, describe, expect, it, jest} from '@jest/globals'

// Local test-only types. We avoid importing these from #/storage because this
// test intentionally mocks that module.
type TestModerationTimeoutRecord = {
  expiresAt: string
  uri?: string
}

type TestModerationTimeouts = {
  blocks: Record<string, TestModerationTimeoutRecord>
  mutes: Record<string, Omit<TestModerationTimeoutRecord, 'uri'>>
}

// Mock the account-scoped storage used by moderation-timeouts.ts.
// The feature stores only local expiration metadata here; the actual
// mute/block records remain managed by the Bluesky API.
const mockStore: Record<string, unknown> = {}

jest.mock('#/storage', () => ({
  account: {
    get: jest.fn((key: string[]) => mockStore[key.join('::')]),
    set: jest.fn((key: string[], value: unknown) => {
      mockStore[key.join('::')] = value
    }),
  },

  // Some transitive imports from the app read device storage at module load
  // time. Keep this mock narrow but compatible with the app test setup.
  device: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
}))

jest.mock('#/state/queries/my-blocked-accounts', () => ({
  RQKEY: () => ['my-blocked-accounts'],
}))

jest.mock('#/state/queries/my-muted-accounts', () => ({
  RQKEY: () => ['my-muted-accounts'],
}))

jest.mock('#/state/queries/profile', () => ({
  RQKEY: (did: string) => ['profile', did],
}))

jest.mock('#/state/session', () => ({
  useAgent: jest.fn(),
  useSession: jest.fn(),
}))

jest.mock('#/state/shell', () => ({
  useTickEveryMinute: jest.fn(() => 0),
}))

jest.mock('#/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

import {
  calculateExpiresAt,
  clearModerationTimeout,
  getModerationTimeoutRecord,
  getModerationTimeouts,
  isExpired,
  type ModerationTimeoutDuration,
  setModerationTimeout,
  shouldKeepModerationEntry,
} from '#/state/moderation-timeouts'

const ACCOUNT_DID = 'did:plc:account'
const OTHER_ACCOUNT_DID = 'did:plc:other-account'
const TARGET_DID = 'did:plc:target'
const OTHER_TARGET_DID = 'did:plc:other-target'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

// Fixed timestamp used to make expiration calculation tests deterministic.
const NOW = Date.parse('2026-05-28T12:00:00.000Z')

function storageKey(accountDid: string) {
  return `${accountDid}::moderationTimeouts`
}

function getStoredTimeouts(accountDid: string) {
  return mockStore[storageKey(accountDid)] as TestModerationTimeouts | undefined
}

function setStoredTimeouts(accountDid: string, value: TestModerationTimeouts) {
  mockStore[storageKey(accountDid)] = value
}

function futureDate(ms: number) {
  return new Date(Date.now() + ms).toISOString()
}

function pastDate(ms: number) {
  return new Date(Date.now() - ms).toISOString()
}

beforeEach(() => {
  for (const key of Object.keys(mockStore)) {
    delete mockStore[key]
  }

  jest.clearAllMocks()
})

describe('calculateExpiresAt', () => {
  it('returns undefined for permanent moderation actions', () => {
    expect(calculateExpiresAt('forever', NOW)).toBeUndefined()
  })

  it('calculates the expiration time for 24 hours', () => {
    expect(calculateExpiresAt('24_hours', NOW)).toBe('2026-05-29T12:00:00.000Z')
  })

  it('calculates the expiration time for 7 days', () => {
    expect(calculateExpiresAt('7_days', NOW)).toBe('2026-06-04T12:00:00.000Z')
  })

  it('calculates the expiration time for 30 days', () => {
    expect(calculateExpiresAt('30_days', NOW)).toBe('2026-06-27T12:00:00.000Z')
  })

  it('returns future timestamps for every temporary duration', () => {
    const durations: ModerationTimeoutDuration[] = [
      '24_hours',
      '7_days',
      '30_days',
    ]

    for (const duration of durations) {
      const expiresAt = calculateExpiresAt(duration)
      expect(expiresAt).toBeDefined()
      expect(Date.parse(expiresAt!)).toBeGreaterThan(Date.now())
    }
  })
})

describe('isExpired', () => {
  it('returns false when no expiration date exists', () => {
    expect(isExpired(undefined)).toBe(false)
  })

  it('returns false for a future expiration date', () => {
    expect(isExpired(futureDate(DAY_MS))).toBe(false)
  })

  it('returns true for a past expiration date', () => {
    expect(isExpired(pastDate(DAY_MS))).toBe(true)
  })

  it('returns true when the expiration date is exactly now or earlier', () => {
    expect(isExpired(new Date(Date.now()).toISOString())).toBe(true)
  })

  it('returns false for an invalid expiration date', () => {
    expect(isExpired('not-a-date')).toBe(false)
  })
})

describe('getModerationTimeouts', () => {
  it('returns an empty timeout structure when the account has no stored data', () => {
    expect(getModerationTimeouts(ACCOUNT_DID)).toEqual({
      blocks: {},
      mutes: {},
    })
  })

  it('returns the stored timeout data for an account', () => {
    const stored: TestModerationTimeouts = {
      blocks: {
        [TARGET_DID]: {
          expiresAt: futureDate(DAY_MS),
          uri: 'at://did:plc:account/app.bsky.graph.block/abc',
        },
      },
      mutes: {},
    }

    setStoredTimeouts(ACCOUNT_DID, stored)

    expect(getModerationTimeouts(ACCOUNT_DID)).toEqual(stored)
  })

  it('does not read timeout data from another account', () => {
    setStoredTimeouts(OTHER_ACCOUNT_DID, {
      blocks: {
        [TARGET_DID]: {
          expiresAt: futureDate(DAY_MS),
          uri: 'at://did:plc:other-account/app.bsky.graph.block/abc',
        },
      },
      mutes: {},
    })

    expect(getModerationTimeouts(ACCOUNT_DID)).toEqual({
      blocks: {},
      mutes: {},
    })
  })
})

describe('getModerationTimeoutRecord', () => {
  it('returns undefined when no record exists', () => {
    expect(
      getModerationTimeoutRecord(ACCOUNT_DID, 'block', TARGET_DID),
    ).toBeUndefined()
  })

  it('returns a stored block timeout record', () => {
    const record = {
      expiresAt: futureDate(DAY_MS),
      uri: 'at://did:plc:account/app.bsky.graph.block/abc',
    }

    setStoredTimeouts(ACCOUNT_DID, {
      blocks: {
        [TARGET_DID]: record,
      },
      mutes: {},
    })

    expect(
      getModerationTimeoutRecord(ACCOUNT_DID, 'block', TARGET_DID),
    ).toEqual(record)
  })

  it('returns a stored mute timeout record', () => {
    const record = {
      expiresAt: futureDate(7 * DAY_MS),
    }

    setStoredTimeouts(ACCOUNT_DID, {
      blocks: {},
      mutes: {
        [TARGET_DID]: record,
      },
    })

    expect(getModerationTimeoutRecord(ACCOUNT_DID, 'mute', TARGET_DID)).toEqual(
      record,
    )
  })

  it('does not return records from another account', () => {
    setStoredTimeouts(OTHER_ACCOUNT_DID, {
      blocks: {
        [TARGET_DID]: {
          expiresAt: futureDate(DAY_MS),
          uri: 'at://did:plc:other-account/app.bsky.graph.block/abc',
        },
      },
      mutes: {},
    })

    expect(
      getModerationTimeoutRecord(ACCOUNT_DID, 'block', TARGET_DID),
    ).toBeUndefined()
  })
})

describe('shouldKeepModerationEntry', () => {
  it('keeps entries with no local timeout metadata', () => {
    expect(shouldKeepModerationEntry(ACCOUNT_DID, 'block', TARGET_DID)).toBe(
      true,
    )
  })

  it('keeps entries with a future expiration date', () => {
    setStoredTimeouts(ACCOUNT_DID, {
      blocks: {
        [TARGET_DID]: {
          expiresAt: futureDate(DAY_MS),
          uri: 'at://did:plc:account/app.bsky.graph.block/abc',
        },
      },
      mutes: {},
    })

    expect(shouldKeepModerationEntry(ACCOUNT_DID, 'block', TARGET_DID)).toBe(
      true,
    )
  })

  it('does not keep entries with a past expiration date', () => {
    setStoredTimeouts(ACCOUNT_DID, {
      blocks: {
        [TARGET_DID]: {
          expiresAt: pastDate(DAY_MS),
          uri: 'at://did:plc:account/app.bsky.graph.block/abc',
        },
      },
      mutes: {},
    })

    expect(shouldKeepModerationEntry(ACCOUNT_DID, 'block', TARGET_DID)).toBe(
      false,
    )
  })

  it('works for mute timeout records', () => {
    setStoredTimeouts(ACCOUNT_DID, {
      blocks: {},
      mutes: {
        [TARGET_DID]: {
          expiresAt: pastDate(DAY_MS),
        },
      },
    })

    expect(shouldKeepModerationEntry(ACCOUNT_DID, 'mute', TARGET_DID)).toBe(
      false,
    )
  })

  it('checks timeout metadata only for the requested account', () => {
    setStoredTimeouts(OTHER_ACCOUNT_DID, {
      blocks: {
        [TARGET_DID]: {
          expiresAt: pastDate(DAY_MS),
          uri: 'at://did:plc:other-account/app.bsky.graph.block/abc',
        },
      },
      mutes: {},
    })

    expect(shouldKeepModerationEntry(ACCOUNT_DID, 'block', TARGET_DID)).toBe(
      true,
    )
  })
})

describe('setModerationTimeout', () => {
  it('stores a block timeout record', () => {
    const record = {
      expiresAt: futureDate(DAY_MS),
      uri: 'at://did:plc:account/app.bsky.graph.block/abc',
    }

    setModerationTimeout(ACCOUNT_DID, 'block', TARGET_DID, record)

    expect(getStoredTimeouts(ACCOUNT_DID)?.blocks[TARGET_DID]).toEqual(record)
  })

  it('stores a mute timeout record', () => {
    const record = {
      expiresAt: futureDate(7 * DAY_MS),
    }

    setModerationTimeout(ACCOUNT_DID, 'mute', TARGET_DID, record)

    expect(getStoredTimeouts(ACCOUNT_DID)?.mutes[TARGET_DID]).toEqual(record)
  })

  it('overwrites an existing timeout for the same target', () => {
    const first = {
      expiresAt: futureDate(DAY_MS),
    }
    const second = {
      expiresAt: futureDate(7 * DAY_MS),
    }

    setModerationTimeout(ACCOUNT_DID, 'mute', TARGET_DID, first)
    setModerationTimeout(ACCOUNT_DID, 'mute', TARGET_DID, second)

    expect(getStoredTimeouts(ACCOUNT_DID)?.mutes[TARGET_DID]).toEqual(second)
  })

  it('does not remove timeout records for other targets', () => {
    setModerationTimeout(ACCOUNT_DID, 'mute', TARGET_DID, {
      expiresAt: futureDate(DAY_MS),
    })
    setModerationTimeout(ACCOUNT_DID, 'mute', OTHER_TARGET_DID, {
      expiresAt: futureDate(7 * DAY_MS),
    })

    setModerationTimeout(ACCOUNT_DID, 'mute', TARGET_DID, undefined)

    expect(getStoredTimeouts(ACCOUNT_DID)?.mutes[TARGET_DID]).toBeUndefined()
    expect(
      getStoredTimeouts(ACCOUNT_DID)?.mutes[OTHER_TARGET_DID],
    ).toBeDefined()
  })

  it('keeps timeout records isolated between accounts', () => {
    const accountRecord = {
      expiresAt: futureDate(DAY_MS),
      uri: 'at://did:plc:account/app.bsky.graph.block/abc',
    }
    const otherAccountRecord = {
      expiresAt: futureDate(7 * DAY_MS),
      uri: 'at://did:plc:other-account/app.bsky.graph.block/def',
    }

    setModerationTimeout(ACCOUNT_DID, 'block', TARGET_DID, accountRecord)
    setModerationTimeout(
      OTHER_ACCOUNT_DID,
      'block',
      TARGET_DID,
      otherAccountRecord,
    )

    expect(getStoredTimeouts(ACCOUNT_DID)?.blocks[TARGET_DID]).toEqual(
      accountRecord,
    )
    expect(getStoredTimeouts(OTHER_ACCOUNT_DID)?.blocks[TARGET_DID]).toEqual(
      otherAccountRecord,
    )
  })
})

describe('clearModerationTimeout', () => {
  it('clears a block timeout record', () => {
    setModerationTimeout(ACCOUNT_DID, 'block', TARGET_DID, {
      expiresAt: futureDate(DAY_MS),
      uri: 'at://did:plc:account/app.bsky.graph.block/abc',
    })

    clearModerationTimeout(ACCOUNT_DID, 'block', TARGET_DID)

    expect(getStoredTimeouts(ACCOUNT_DID)?.blocks[TARGET_DID]).toBeUndefined()
  })

  it('clears a mute timeout record', () => {
    setModerationTimeout(ACCOUNT_DID, 'mute', TARGET_DID, {
      expiresAt: futureDate(DAY_MS),
    })

    clearModerationTimeout(ACCOUNT_DID, 'mute', TARGET_DID)

    expect(getStoredTimeouts(ACCOUNT_DID)?.mutes[TARGET_DID]).toBeUndefined()
  })

  it('does not throw when clearing a missing timeout record', () => {
    expect(() => {
      clearModerationTimeout(ACCOUNT_DID, 'block', TARGET_DID)
    }).not.toThrow()
  })

  it('does not clear timeout records from another account', () => {
    setModerationTimeout(ACCOUNT_DID, 'block', TARGET_DID, {
      expiresAt: futureDate(DAY_MS),
      uri: 'at://did:plc:account/app.bsky.graph.block/abc',
    })
    setModerationTimeout(OTHER_ACCOUNT_DID, 'block', TARGET_DID, {
      expiresAt: futureDate(DAY_MS),
      uri: 'at://did:plc:other-account/app.bsky.graph.block/def',
    })

    clearModerationTimeout(ACCOUNT_DID, 'block', TARGET_DID)

    expect(getStoredTimeouts(ACCOUNT_DID)?.blocks[TARGET_DID]).toBeUndefined()
    expect(
      getStoredTimeouts(OTHER_ACCOUNT_DID)?.blocks[TARGET_DID],
    ).toBeDefined()
  })
})

describe('temporary moderation flow', () => {
  it('stores a temporary block and hides it after expiration', () => {
    setModerationTimeout(ACCOUNT_DID, 'block', TARGET_DID, {
      expiresAt: pastDate(1),
      uri: 'at://did:plc:account/app.bsky.graph.block/abc',
    })

    expect(shouldKeepModerationEntry(ACCOUNT_DID, 'block', TARGET_DID)).toBe(
      false,
    )
  })

  it('stores a temporary mute and keeps it before expiration', () => {
    setModerationTimeout(ACCOUNT_DID, 'mute', TARGET_DID, {
      expiresAt: futureDate(DAY_MS),
    })

    expect(shouldKeepModerationEntry(ACCOUNT_DID, 'mute', TARGET_DID)).toBe(
      true,
    )
  })

  it('keeps each account independent during the same target moderation flow', () => {
    setModerationTimeout(ACCOUNT_DID, 'block', TARGET_DID, {
      expiresAt: pastDate(DAY_MS),
      uri: 'at://did:plc:account/app.bsky.graph.block/abc',
    })
    setModerationTimeout(OTHER_ACCOUNT_DID, 'block', TARGET_DID, {
      expiresAt: futureDate(DAY_MS),
      uri: 'at://did:plc:other-account/app.bsky.graph.block/def',
    })

    expect(shouldKeepModerationEntry(ACCOUNT_DID, 'block', TARGET_DID)).toBe(
      false,
    )
    expect(
      shouldKeepModerationEntry(OTHER_ACCOUNT_DID, 'block', TARGET_DID),
    ).toBe(true)
  })
})
