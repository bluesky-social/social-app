import {type Client} from '@atproto/lex'
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'

import {MessagesEventBus} from '#/state/messages/events/agent'
import {
  DEFAULT_POLL_INTERVAL,
  LOG_PAGE_SIZE,
  MAX_CATCH_UP_PAGES,
} from '#/state/messages/events/const'
import {type MessagesEventBusEvent} from '#/state/messages/events/types'
import {chat} from '#/lexicons'

type Log = chat.bsky.convo.getLog.$OutputBody['logs'][number]

/** Revs compare as strings, so pad them to keep that in numeric order. */
function rev(n: number) {
  return n.toString().padStart(13, '0')
}

/**
 * A chat service with a log for a single user, paged like the real `getLog`:
 * at most `LOG_PAGE_SIZE` logs after the cursor, or the current position when
 * there's no cursor.
 */
function createFakeChatService() {
  let head = 0
  const calls: {cursor?: string}[] = []
  let pagesUntilFailure = Infinity

  function getLog(method: unknown, params: {cursor?: string}) {
    if (method !== chat.bsky.convo.getLog) {
      throw new Error('unexpected method')
    }
    calls.push(params)
    if (!params.cursor) {
      return {cursor: rev(head), logs: []}
    }
    if (pagesUntilFailure-- <= 0) {
      pagesUntilFailure = Infinity
      throw new Error('poll failed')
    }
    const from = Number(params.cursor) + 1
    const to = Math.min(head, from + LOG_PAGE_SIZE - 1)
    const logs: Log[] = []
    for (let n = from; n <= to; n++) {
      logs.push({
        $type: 'chat.bsky.convo.defs#logReadMessage',
        rev: rev(n),
        convoId: 'convo',
      } as unknown as Log)
    }
    return {cursor: to >= from ? rev(to) : params.cursor, logs}
  }

  const call = jest.fn((method: unknown, params: {cursor?: string}) =>
    Promise.resolve().then(() => getLog(method, params)),
  )

  return {
    client: {call} as unknown as Client,
    calls,
    /** Writes `count` more logs. */
    append(count: number) {
      head += count
    },
    /** Serves `pages` more pages of logs, then fails once. */
    failAfter(pages: number) {
      pagesUntilFailure = pages
    },
  }
}

async function createBus() {
  const service = createFakeChatService()
  const bus = new MessagesEventBus({chatClient: service.client})
  const events: MessagesEventBusEvent[] = []
  bus.on(event => events.push(event), {})
  // let init and the first poll settle
  await jest.advanceTimersByTimeAsync(0)
  events.length = 0
  service.calls.length = 0
  return {bus, service, events}
}

function revsOf(events: MessagesEventBusEvent[]) {
  return events.flatMap(event =>
    event.type === 'logs'
      ? event.logs.map(log => ('rev' in log ? Number(log.rev) : NaN))
      : [],
  )
}

describe(`#/state/messages/events/agent`, () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it(`replays a backlog several pages long in a single poll`, async () => {
    const {service, events} = await createBus()

    const backlog = LOG_PAGE_SIZE * (MAX_CATCH_UP_PAGES - 1) + 50
    service.append(backlog)
    await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)

    expect(events.map(event => event.type)).toEqual(['logs'])
    expect(revsOf(events)).toEqual(
      Array.from({length: backlog}, (_, i) => i + 1),
    )
    expect(service.calls).toHaveLength(MAX_CATCH_UP_PAGES)
  })

  it(`skips ahead and reports a gap when too far behind to replay`, async () => {
    const {service, events} = await createBus()

    service.append(LOG_PAGE_SIZE * MAX_CATCH_UP_PAGES * 10)
    await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)

    expect(events).toEqual([{type: 'gap'}])
    // the full pages, then one call without a cursor for the current position
    expect(service.calls).toHaveLength(MAX_CATCH_UP_PAGES + 1)
    expect(service.calls.at(-1)).toEqual({})

    // picks up from the present afterwards
    events.length = 0
    service.append(5)
    await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)

    const head = LOG_PAGE_SIZE * MAX_CATCH_UP_PAGES * 10
    expect(revsOf(events)).toEqual([
      head + 1,
      head + 2,
      head + 3,
      head + 4,
      head + 5,
    ])
  })

  it(`still emits the pages it got when a later page fails`, async () => {
    const {service, events} = await createBus()

    service.append(LOG_PAGE_SIZE + 10)
    service.failAfter(1)
    await jest.advanceTimersByTimeAsync(DEFAULT_POLL_INTERVAL)

    expect(events.map(event => event.type)).toEqual(['error', 'logs'])
    expect(revsOf(events)).toHaveLength(LOG_PAGE_SIZE)
  })
})
