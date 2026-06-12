import {type AtpAgent, type ChatBskyConvoGetLog} from '@atproto/api'
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'

import {MessagesEventBus} from '#/state/messages/events/agent'
import {
  BACKGROUND_POLL_INTERVAL,
  DEFAULT_POLL_INTERVAL,
} from '#/state/messages/events/const'
import {
  MessagesEventBusErrorCode,
  type MessagesEventBusEvent,
} from '#/state/messages/events/types'

/*
 * Tests for MessagesEventBus, the poll-based DM firehose. These focus on the
 * lifecycle/state-machine and the two recent fixes on this branch:
 *   1. error-state recovery that re-inits when no cursor was ever seeded, and
 *      resumes cursor-aware when a poll failed mid-session
 *   2. log emission moved outside poll()'s try/catch so a throwing subscriber
 *      is not misreported as a poll failure
 *
 * We drive the async poll loop with fake timers. init() and poll() are async,
 * so after advancing timers we flush microtasks. networkRetry(2, fn) means 2
 * total attempts, so a failing call must reject twice in a row, and the
 * rejection must classify as a network error (string includes "Network request
 * failed") so the bus does not log an unexpected error.
 */

type GetLogFn = jest.MockedFunction<
  (
    params?: {cursor?: string},
    opts?: unknown,
  ) => Promise<{data: ChatBskyConvoGetLog.OutputSchema}>
>

/*
 * A network error per isNetworkError() in #/lib/strings/errors - matched
 * substring is "Network request failed".
 */
function networkError() {
  return new Error('Network request failed')
}

/*
 * Minimal log fixture. The bus only checks `'rev' in ev` and reads ev.rev /
 * ev.convoId, so we keep these tiny. Revs are zero-padded so lexical compare
 * matches numeric order.
 */
function logEvent(rev: string, convoId = 'abc') {
  return {
    $type: 'chat.bsky.convo.defs#logCreateMessage',
    rev,
    convoId,
  } as unknown as ChatBskyConvoGetLog.OutputSchema['logs'][number]
}

function getLogResponse(
  cursor: string | undefined,
  logs: ChatBskyConvoGetLog.OutputSchema['logs'] = [],
) {
  return {data: {cursor, logs}}
}

/*
 * The constructor synchronously calls init(), which invokes getLog() before we
 * get a chance to configure per-call mocks. So callers pass the desired init
 * behavior up front: either a resolved getLog response, or `'fail'` to reject
 * twice (networkRetry attempts) and force InitFailed.
 */
function createBus(
  init: {data: ChatBskyConvoGetLog.OutputSchema} | 'fail' = getLogResponse(
    '0000005',
    [],
  ),
) {
  const getLog = jest.fn() as GetLogFn
  if (init === 'fail') {
    getLog.mockRejectedValueOnce(networkError())
    getLog.mockRejectedValueOnce(networkError())
  } else {
    // init response, then a benign persistent default so the immediate
    // post-init poll (from resetPoll -> startPoll) does not fail. Tests queue
    // mockResolvedValueOnce for specific poll responses before advancing time.
    getLog.mockResolvedValueOnce(init)
    getLog.mockResolvedValue(getLogResponse(init.data.cursor, []))
  }

  const agent = {
    chat: {
      bsky: {
        convo: {
          getLog,
        },
      },
    },
  } as unknown as AtpAgent

  const bus = new MessagesEventBus({agent})
  const events: MessagesEventBusEvent[] = []
  const unsub = bus.on(e => events.push(e), {convoId: undefined})

  return {bus, getLog, events, unsub}
}

/*
 * Flush queued microtasks. init()/poll() chain a few awaits (networkRetry, then
 * response handling), so flush a handful of times to settle them.
 */
async function flushMicrotasks(times = 10) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve()
  }
}

/*
 * The constructor synchronously kicks off init(); settle it (and its first
 * synchronous poll, which happens inside resetPoll -> startPoll) before
 * assertions.
 */
async function settle() {
  await flushMicrotasks()
}

function lastCursorArg(getLog: GetLogFn): string | undefined {
  const call = getLog.mock.calls.at(-1)
  return call?.[0]?.cursor
}

function eventTypes(events: MessagesEventBusEvent[]) {
  return events.map(e => e.type)
}

function errorEvents(events: MessagesEventBusEvent[]) {
  return events.filter(
    (e): e is Extract<MessagesEventBusEvent, {type: 'error'}> =>
      e.type === 'error',
  )
}

function logsEvents(events: MessagesEventBusEvent[]) {
  return events.filter(
    (e): e is Extract<MessagesEventBusEvent, {type: 'logs'}> =>
      e.type === 'logs',
  )
}

describe(`#/state/messages/events`, () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  describe(`regression: error recovery`, () => {
    it(`zombie firehose - failed init re-inits (without cursor) on resume, then polls with seeded cursor`, async () => {
      // init() runs networkRetry(2): reject twice -> InitFailed
      const {bus, getLog, events} = createBus('fail')
      await settle()

      const errs = errorEvents(events)
      expect(errs).toHaveLength(1)
      expect(errs[0].error.code).toBe(MessagesEventBusErrorCode.InitFailed)

      const callsAfterFailedInit = getLog.mock.calls.length

      // Recovery: latestRev is still undefined, so resume() must re-run init()
      // WITHOUT a cursor (the old bug went straight to Ready and polled with an
      // undefined cursor forever).
      getLog.mockResolvedValueOnce(getLogResponse('0000005', []))
      bus.resume()
      await settle()

      const reinitCall = getLog.mock.calls[callsAfterFailedInit]
      expect(reinitCall).toBeDefined()
      // re-init is cursor-less
      expect((reinitCall[0] as {cursor?: string}).cursor).toBeUndefined()

      // success path dispatches Ready -> emits connect
      expect(eventTypes(events)).toContain('connect')

      // subsequent poll uses the seeded cursor
      getLog.mockResolvedValueOnce(getLogResponse('0000005', []))
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
      await flushMicrotasks()
      expect(lastCursorArg(getLog)).toBe('0000005')
    })

    it(`cursor preserved on poll-failure recovery via resume()`, async () => {
      // init seeds latestRev '0000005' (default createBus response)
      const {bus, getLog, events} = createBus()
      await settle()
      expect(eventTypes(events)).toContain('connect')

      // next poll fails (reject twice) -> PollFailed
      getLog.mockRejectedValueOnce(networkError())
      getLog.mockRejectedValueOnce(networkError())
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
      await flushMicrotasks()

      const errs = errorEvents(events)
      expect(errs).toHaveLength(1)
      expect(errs[0].error.code).toBe(MessagesEventBusErrorCode.PollFailed)

      const callsBeforeRecovery = getLog.mock.calls.length

      // resume() should resume from the existing cursor, NOT re-init cursor-less
      getLog.mockResolvedValueOnce(getLogResponse('0000005', []))
      bus.resume()
      await flushMicrotasks()

      const recoveryCall = getLog.mock.calls[callsBeforeRecovery]
      expect(recoveryCall).toBeDefined()
      expect((recoveryCall[0] as {cursor?: string}).cursor).toBe('0000005')
    })

    it(`cursor preserved on poll-failure recovery via requestPollInterval() (UpdatePoll arm)`, async () => {
      const {bus, getLog, events} = createBus()
      await settle()

      // poll fails -> PollFailed, bus enters Error state
      getLog.mockRejectedValueOnce(networkError())
      getLog.mockRejectedValueOnce(networkError())
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
      await flushMicrotasks()

      expect(
        events.filter(
          e =>
            e.type === 'error' &&
            e.error.code === MessagesEventBusErrorCode.PollFailed,
        ),
      ).toHaveLength(1)

      const callsBeforeRecovery = getLog.mock.calls.length

      // requestPollInterval dispatches UpdatePoll. In Error state that now
      // routes to recoverFromError() which, with a cursor present, resumes
      // cursor-aware. The OLD bug wiped latestRev and re-init'd cursor-less.
      getLog.mockResolvedValueOnce(getLogResponse('0000005', []))
      bus.requestPollInterval(1000)
      await flushMicrotasks()

      const recoveryCall = getLog.mock.calls[callsBeforeRecovery]
      expect(recoveryCall).toBeDefined()
      expect((recoveryCall[0] as {cursor?: string}).cursor).toBe('0000005')
    })
  })

  describe(`regression: throwing subscriber`, () => {
    it(`a throwing 'logs' subscriber does not emit error / fake PollFailed, and polling continues with advanced cursor`, async () => {
      const getLog = jest.fn() as GetLogFn
      // init seeds '0000001' (configure before construction - init() calls
      // getLog synchronously), then a benign persistent default for the
      // immediate post-init poll.
      getLog.mockResolvedValueOnce(getLogResponse('0000001', []))
      getLog.mockResolvedValue(getLogResponse('0000001', []))
      const agent = {
        chat: {bsky: {convo: {getLog}}},
      } as unknown as AtpAgent

      const bus = new MessagesEventBus({agent})

      // Subscriber A throws on 'logs'. Subscriber B records all events.
      const aReceived: MessagesEventBusEvent[] = []
      const bReceived: MessagesEventBusEvent[] = []
      bus.on(
        e => {
          aReceived.push(e)
          if (e.type === 'logs') {
            throw new Error('subscriber A boom')
          }
        },
        {convoId: undefined},
      )
      bus.on(e => bReceived.push(e), {convoId: undefined})

      await settle()

      // poll delivers a log with a higher rev -> needsEmit, emit throws via A
      getLog.mockResolvedValueOnce(
        getLogResponse('0000003', [logEvent('0000003')]),
      )
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
      await flushMicrotasks()

      // No error event (no fake PollFailed) from the throwing subscriber.
      expect(bReceived.filter(e => e.type === 'error')).toHaveLength(0)
      expect(aReceived.filter(e => e.type === 'error')).toHaveLength(0)

      // A received the logs event (and threw on it).
      expect(aReceived.filter(e => e.type === 'logs')).toHaveLength(1)

      // NOTE: eventemitter3 invokes handlers in registration order, and the
      // bus wraps the WHOLE emit() in one try/catch. So A's throw aborts the
      // emit before B is invoked - B does NOT receive that 'logs' event. This
      // pins current behavior (not necessarily desirable).
      expect(bReceived.filter(e => e.type === 'logs')).toHaveLength(0)

      // The rev was consumed despite the throw, so the next poll uses the
      // advanced cursor and the isPolling flag did not wedge.
      getLog.mockResolvedValueOnce(getLogResponse('0000003', []))
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
      await flushMicrotasks()
      expect(lastCursorArg(getLog)).toBe('0000003')
    })
  })

  describe(`core: polling behavior`, () => {
    it(`happy path - seeds rev from cursor, emits only newer revs, advances to max, passes it next poll`, async () => {
      // init seeds latestRev = '0000002'
      const {getLog, events} = createBus(getLogResponse('0000002', []))
      await settle()
      expect(eventTypes(events)).toContain('connect')

      // poll returns a stale (==), a stale (<), and two newer revs
      getLog.mockResolvedValueOnce(
        getLogResponse('0000004', [
          logEvent('0000001'), // < latestRev, filtered
          logEvent('0000002'), // == latestRev, filtered
          logEvent('0000003'), // > latestRev, emitted
          logEvent('0000004'), // > latestRev, emitted
        ]),
      )
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
      await flushMicrotasks()

      const logEvents = logsEvents(events)
      expect(logEvents).toHaveLength(1)
      expect(logEvents[0].logs.map(l => (l as {rev: string}).rev)).toEqual([
        '0000003',
        '0000004',
      ])

      // latestRev advanced to the max emitted rev -> next poll uses it
      getLog.mockResolvedValueOnce(getLogResponse('0000004', []))
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
      await flushMicrotasks()
      expect(lastCursorArg(getLog)).toBe('0000004')
    })

    it(`no 'logs' event when all logs are stale (rev <= latestRev)`, async () => {
      // init seeds latestRev = '0000005' (default)
      const {getLog, events} = createBus()
      await settle()

      getLog.mockResolvedValueOnce(
        getLogResponse('0000005', [logEvent('0000003'), logEvent('0000005')]),
      )
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
      await flushMicrotasks()

      expect(events.filter(e => e.type === 'logs')).toHaveLength(0)
    })

    it(`logs without a rev field are skipped`, async () => {
      // init seeds latestRev = '0000002'
      const {getLog, events} = createBus(getLogResponse('0000002', []))
      await settle()

      const noRev = {
        $type: 'chat.bsky.convo.defs#logBeginConvo',
        convoId: 'abc',
      } as unknown as ChatBskyConvoGetLog.OutputSchema['logs'][number]

      getLog.mockResolvedValueOnce(
        getLogResponse('0000003', [noRev, logEvent('0000003')]),
      )
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
      await flushMicrotasks()

      const logEvents = logsEvents(events)
      expect(logEvents).toHaveLength(1)
      // only the rev-bearing log survives
      expect(logEvents[0].logs).toHaveLength(1)
      expect((logEvents[0].logs[0] as {rev: string}).rev).toBe('0000003')
    })
  })

  describe(`core: lifecycle transitions`, () => {
    it(`background()/resume() do not drop the cursor`, async () => {
      const {bus, getLog} = createBus()
      getLog.mockResolvedValue(getLogResponse('0000005', []))
      await settle()

      // background uses the longer interval; poll still happens with cursor
      bus.background()
      await flushMicrotasks()
      expect(lastCursorArg(getLog)).toBe('0000005')

      // resume keeps the cursor
      bus.resume()
      await flushMicrotasks()
      expect(lastCursorArg(getLog)).toBe('0000005')
    })

    it(`suspend() stops polling; resume() restarts it`, async () => {
      const {bus, getLog} = createBus()

      getLog.mockResolvedValue(getLogResponse('0000005', []))
      await settle()

      bus.suspend()
      const callsAfterSuspend = getLog.mock.calls.length

      // advance well past several intervals - no further polls
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL * 3)
      await flushMicrotasks()
      expect(getLog.mock.calls.length).toBe(callsAfterSuspend)

      // resume restarts polling (resetPoll -> immediate poll)
      bus.resume()
      await flushMicrotasks()
      expect(getLog.mock.calls.length).toBeGreaterThan(callsAfterSuspend)
    })

    it(`background() polls at the background cadence`, async () => {
      const {bus, getLog} = createBus()

      getLog.mockResolvedValue(getLogResponse('0000005', []))
      await settle()

      bus.background()
      await flushMicrotasks()
      const callsAfterBackground = getLog.mock.calls.length

      // advancing by the default interval should NOT trigger another poll,
      // because background cadence is longer
      await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)
      await flushMicrotasks()
      expect(getLog.mock.calls.length).toBe(callsAfterBackground)

      // advancing to the background interval triggers a poll
      await jest.advanceTimersByTimeAsync(
        BACKGROUND_POLL_INTERVAL - DEFAULT_POLL_INTERVAL,
      )
      await flushMicrotasks()
      expect(getLog.mock.calls.length).toBeGreaterThan(callsAfterBackground)
    })
  })

  describe(`core: requestPollInterval`, () => {
    it(`lowers cadence while requested, returns a cleanup that restores default`, async () => {
      const {bus, getLog} = createBus()

      getLog.mockResolvedValue(getLogResponse('0000005', []))
      await settle()

      const LOW = 1000

      // Request a lower interval. resetPoll runs an immediate poll, so count
      // from after the request settles.
      const cleanup = bus.requestPollInterval(LOW)
      await flushMicrotasks()
      const callsAfterRequest = getLog.mock.calls.length

      // At the low cadence, several polls happen within one default interval.
      await jest.advanceTimersByTimeAsync(LOW * 5)
      await flushMicrotasks()
      const lowCadenceCalls = getLog.mock.calls.length - callsAfterRequest
      expect(lowCadenceCalls).toBeGreaterThanOrEqual(4)

      // Cleanup restores the default interval (resetPoll -> immediate poll).
      cleanup()
      await flushMicrotasks()
      const callsAfterCleanup = getLog.mock.calls.length

      // Advancing by the low interval should no longer produce many polls;
      // within one default interval there should be at most the single
      // resetPoll-immediate poll already counted.
      await jest.advanceTimersByTimeAsync(LOW * 5)
      await flushMicrotasks()
      expect(getLog.mock.calls.length - callsAfterCleanup).toBe(0)
    })
  })

  describe(`core: connect / retry`, () => {
    it(`emits 'connect' on initial Ready`, async () => {
      const {events} = createBus()
      await settle()

      expect(events.filter(e => e.type === 'connect')).toHaveLength(1)
    })

    it(`error payload retry() triggers recovery and re-emits 'connect'`, async () => {
      // init fails -> InitFailed with a retry callback
      const {getLog, events} = createBus('fail')
      await settle()

      const errs = errorEvents(events)
      expect(errs).toHaveLength(1)

      // invoking the payload's retry() (which dispatches Resume) recovers
      getLog.mockResolvedValueOnce(getLogResponse('0000005', []))
      errs[0].error.retry()
      await settle()

      expect(events.filter(e => e.type === 'connect')).toHaveLength(1)
    })
  })
})
