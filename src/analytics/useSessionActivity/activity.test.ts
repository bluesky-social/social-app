import uuid from 'react-native-uuid'

import {onAppStateChange} from '#/lib/appState'
import {getSessionId, readSessionRecord} from '#/analytics/identifiers/session'
import {recordSessionActivity} from '#/analytics/useSessionActivity/activity'
import {device} from '#/storage'

let mockRaw: string | undefined
jest.mock('#/env', () => ({IS_NATIVE: false, IS_DEV: true}))
jest.mock('#/lib/appState', () => ({onAppStateChange: jest.fn()}))
jest.mock('react-native-uuid', () => ({
  __esModule: true,
  default: {v4: jest.fn()},
}))
jest.mock('#/storage', () => ({
  device: {
    getRaw: jest.fn(() => mockRaw),
    set: jest.fn((_key, data) => {
      mockRaw = JSON.stringify({data})
    }),
  },
}))
jest.mock('#/analytics/identifiers/sessionStorage', () =>
  jest.requireActual('#/analytics/identifiers/sessionStorage/index.web'),
)

const NOW = new Date('2026-09-22T12:00:00Z').getTime()
const TTL = 30 * 60 * 1e3

function store(data: unknown) {
  mockRaw = JSON.stringify({data})
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(NOW)
  jest.clearAllMocks()
  mockRaw = undefined
  ;(uuid.v4 as jest.Mock).mockReturnValue('new-session-12345678')
  jest.spyOn(console, 'debug').mockImplementation(() => {})
})
afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

it('does not boot or subscribe to web AppState, and passive recovery has no activity time', () => {
  expect(onAppStateChange).not.toHaveBeenCalled()
  expect(device.set).not.toHaveBeenCalled()
  expect(getSessionId()).toBe('new-session-12345678')
  expect(readSessionRecord()).toEqual({id: 'new-session-12345678'})
  jest.setSystemTime(NOW + TTL * 2)
  for (let i = 0; i < 100; i++) getSessionId()
  expect(device.set).toHaveBeenCalledTimes(1)
  expect(readSessionRecord()).toEqual({id: 'new-session-12345678'})
})

it('reads shared raw storage every time but only parses and validates changed records', () => {
  store({id: 'a', lastEventAt: NOW})
  getSessionId()
  const parse = jest.spyOn(JSON, 'parse')
  jest.mocked(device.getRaw).mockClear()
  for (let i = 0; i < 100; i++) getSessionId()
  expect(device.getRaw).toHaveBeenCalledTimes(100)
  expect(parse).not.toHaveBeenCalled()
  store({id: 'a', lastEventAt: NOW - TTL})
  recordSessionActivity('pointerdown')
  expect(parse).toHaveBeenCalledTimes(1)
  expect(getSessionId()).not.toBe('a')
  store({id: 'other-tab', lastEventAt: NOW})
  expect(getSessionId()).toBe('other-tab')
})

it.each([TTL - 1, TTL, TTL + 1])(
  'checks expiry before renewing at %d ms',
  elapsed => {
    store({id: 'a', lastEventAt: NOW})
    jest.setSystemTime(NOW + elapsed)
    expect(getSessionId()).toBe('a')
    recordSessionActivity('keydown')
    expect(getSessionId()).toBe(elapsed < TTL ? 'a' : 'new-session-12345678')
    expect(readSessionRecord()?.lastEventAt).toBe(NOW + elapsed)
  },
)

it('uses existing records without migration or passive writes', () => {
  store({id: 'existing', lastEventAt: NOW - TTL + 1})
  expect(getSessionId()).toBe('existing')
  expect(device.set).not.toHaveBeenCalled()
  recordSessionActivity('return')
  expect(device.set).toHaveBeenCalledWith(['analyticsSession'], {
    id: 'existing',
    lastEventAt: NOW,
  })
})

it.each([undefined, null, '123', NaN, Infinity, -Infinity])(
  'retains the ID with an unknown timestamp (%s) until first activity establishes its clock',
  lastEventAt => {
    store({id: 'a', lastEventAt})
    expect(getSessionId()).toBe('a')
    expect(device.set).not.toHaveBeenCalled()
    recordSessionActivity('mount')
    expect(readSessionRecord()).toEqual({id: 'a', lastEventAt: NOW})
  },
)

it.each([0, -1])('expires old finite timestamps (%s)', lastEventAt => {
  store({id: 'a', lastEventAt})
  recordSessionActivity('return')
  expect(getSessionId()).not.toBe('a')
})

it('rebases a future timestamp on activity after clock rollback without changing the ID', () => {
  store({id: 'a', lastEventAt: NOW + TTL})
  recordSessionActivity('keydown')
  expect(readSessionRecord()).toEqual({id: 'a', lastEventAt: NOW})
  jest.setSystemTime(NOW + TTL)
  recordSessionActivity('keydown')
  expect(getSessionId()).not.toBe('a')
})

it.each([undefined, '{', 'null', '{}', '{"data":{"id":""}}'])(
  'recovers invalid raw storage %s',
  raw => {
    mockRaw = raw
    recordSessionActivity('pointerdown')
    expect(readSessionRecord()).toEqual({
      id: 'new-session-12345678',
      lastEventAt: NOW,
    })
  },
)

it.each([
  'keydown',
  'pointerdown',
  'click',
  'beforeinput',
  'input',
  'scroll',
] as const)(
  'continuous %s activity preserves a session beyond 30 minutes',
  source => {
    store({id: 'a', lastEventAt: NOW})
    for (let i = 1; i <= 40; i++) {
      jest.setSystemTime(NOW + i * 60_000)
      recordSessionActivity(source)
    }
    expect(getSessionId()).toBe('a')
    expect(readSessionRecord()?.lastEventAt).toBe(NOW + 40 * 60_000)
    expect(console.debug).not.toHaveBeenCalled()
  },
)

it('reads and writes immediately when called, leaving throttling to the hook', () => {
  store({id: 'a', lastEventAt: NOW})
  recordSessionActivity('scroll')
  expect(device.getRaw).toHaveBeenCalledTimes(1)
  expect(device.set).toHaveBeenCalledWith(['analyticsSession'], {
    id: 'a',
    lastEventAt: NOW,
  })
  expect(jest.getTimerCount()).toBe(0)
})

it('uses persisted event time at the boundary without needing timers to run', () => {
  store({id: 'a', lastEventAt: NOW})
  jest.setSystemTime(NOW + 5_000)
  recordSessionActivity('keydown')
  expect(readSessionRecord()?.lastEventAt).toBe(NOW + 5_000)
  jest.setSystemTime(NOW + TTL)
  recordSessionActivity('return')
  expect(getSessionId()).toBe('a')
  jest.setSystemTime(NOW + TTL * 2)
  recordSessionActivity('return')
  expect(getSessionId()).not.toBe('a')
})

it("uses another tab's recent activity and adopts its rotated ID", () => {
  store({id: 'a', lastEventAt: NOW})
  jest.setSystemTime(NOW + TTL)
  // Another tab was active just before this one returned.
  store({id: 'a', lastEventAt: Date.now() - 1})
  recordSessionActivity('return')
  expect(getSessionId()).toBe('a')
  jest.setSystemTime(NOW + TTL * 2)
  store({id: 'other-tab', lastEventAt: Date.now() - 1})
  expect(getSessionId()).toBe('other-tab')
  recordSessionActivity('keydown')
  expect(readSessionRecord()).toEqual({
    id: 'other-tab',
    lastEventAt: Date.now(),
  })
})

it('does not revive a removed ID on the next activity', () => {
  store({id: 'a', lastEventAt: NOW})
  recordSessionActivity('keydown')
  mockRaw = undefined
  recordSessionActivity('keydown')
  expect(getSessionId()).not.toBe('a')
})

it('does not mutate the cached validation result when writing activity', () => {
  store({id: 'a', lastEventAt: NOW})
  const previous = readSessionRecord()
  jest.setSystemTime(NOW + 5_000)
  recordSessionActivity('keydown')
  expect(previous).toEqual({id: 'a', lastEventAt: NOW})
  expect(readSessionRecord()).toEqual({id: 'a', lastEventAt: NOW + 5_000})
})

it.each(['click', 'beforeinput', 'input'] as const)(
  'logs only bounded source/timing diagnostics for %s',
  source => {
    store({id: 'old-session', lastEventAt: NOW - TTL})
    recordSessionActivity(source)
    expect(console.debug).toHaveBeenCalledWith('12345678 analytics session', {
      source,
      action: 'rotated',
      elapsedMs: TTL,
    })
    for (let i = 0; i < 100; i++) recordSessionActivity(source)
    expect(console.debug).toHaveBeenCalledTimes(1)
  },
)

it('prefixes bounded diagnostics with only the last eight ID characters', () => {
  recordSessionActivity('mount')
  expect(console.debug).toHaveBeenCalledWith('12345678 analytics session', {
    source: 'mount',
    action: 'created',
    elapsedMs: undefined,
  })
  for (let i = 0; i < 100; i++) recordSessionActivity('keydown')
  expect(console.debug).toHaveBeenCalledTimes(1)
})
