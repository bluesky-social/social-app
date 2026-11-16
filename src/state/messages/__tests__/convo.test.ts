import {type Client} from '@atproto/lex'
import {afterEach, describe, expect, it, jest} from '@jest/globals'

import {Convo} from '#/state/messages/convo/agent'
import {HISTORY_PAGE_SIZE} from '#/state/messages/convo/const'
import {ConvoStatus} from '#/state/messages/convo/types'
import {type MessagesEventBus} from '#/state/messages/events/agent'
import {type MessagesEventBusEvent} from '#/state/messages/events/types'
import {chat} from '#/lexicons'

/*
 * The real modules pull in most of the app (Reanimated, GrowthBook, every
 * query), none of which these tests touch.
 */
jest.mock('#/state/cache/profile-shadow', () => ({
  isProfileShadowApplied: () => false,
  listenProfileShadowUpdate: () => () => {},
  mergeShadow: (a: object, b: object) => ({...a, ...b}),
}))
jest.mock('#/alf', () => ({platform: () => undefined}))

const SELF = 'did:plc:self'
const OTHER = 'did:plc:other'
const CONVO_ID = 'convo'

/** Revs compare as strings, so pad them to keep that in numeric order. */
function rev(n: number) {
  return n.toString().padStart(13, '0')
}

function message(n: number) {
  return {
    $type: 'chat.bsky.convo.defs#messageView',
    id: `m${n}`,
    rev: rev(n),
    text: `message ${n}`,
    sender: {did: n % 2 ? OTHER : SELF},
    sentAt: new Date(n * 1000).toISOString(),
  } as chat.bsky.convo.defs.MessageView
}

/** `["m{from}", ..., "m{to}"]` */
function ids(from: number, to: number) {
  return Array.from({length: to - from + 1}, (_, i) => `m${from + i}`)
}

/**
 * A chat service with one direct convo holding messages 1 to `latest`, paged
 * newest first like the real `getMessages`.
 */
function createFakeChatService({latest}: {latest: number}) {
  const convoView = {
    id: CONVO_ID,
    rev: rev(0),
    members: [
      {did: SELF, handle: 'self.test'},
      {did: OTHER, handle: 'other.test'},
    ],
    kind: {$type: 'chat.bsky.convo.defs#directConvo'},
    muted: false,
    unreadCount: 0,
    status: 'accepted',
  }
  const state = {latest, historyHeld: false}
  const heldPages: (() => void)[] = []

  const call = jest.fn(
    async (method: unknown, params: {cursor?: string; limit?: number}) => {
      if (method === chat.bsky.convo.getConvo) return {convo: convoView}
      if (method === chat.bsky.convo.getConvoMembers) {
        return {members: convoView.members}
      }
      if (method === chat.bsky.convo.getMessages) {
        const newest = params.cursor ? Number(params.cursor) - 1 : state.latest
        const oldest = Math.max(1, newest - params.limit! + 1)
        const messages = []
        for (let n = newest; n >= oldest; n--) messages.push(message(n))
        if (params.cursor && state.historyHeld) {
          await new Promise<void>(resolve => heldPages.push(resolve))
        }
        return {messages, cursor: oldest > 1 ? rev(oldest) : undefined}
      }
      throw new Error('unexpected method')
    },
  )

  return {
    client: {call, assertDid: SELF} as unknown as Client,
    state,
    getMessagesCalls() {
      return call.mock.calls.filter(
        ([method]) => method === chat.bsky.convo.getMessages,
      )
    },
    releaseHistory() {
      state.historyHeld = false
      for (const release of heldPages.splice(0)) release()
    },
  }
}

function createFakeEventBus() {
  const handlers = new Set<(event: MessagesEventBusEvent) => void>()
  return {
    bus: {
      on(handler: (event: MessagesEventBusEvent) => void) {
        handlers.add(handler)
        return () => {
          handlers.delete(handler)
        }
      },
      requestPollInterval: () => () => {},
      getLatestRev: () => undefined,
    } as unknown as MessagesEventBus,
    emit(event: MessagesEventBusEvent) {
      for (const handler of handlers) handler(event)
    },
  }
}

async function flush() {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

async function createConvo({latest = 10}: {latest?: number} = {}) {
  const service = createFakeChatService({latest})
  const events = createFakeEventBus()
  const convo = new Convo({
    convoId: CONVO_ID,
    chatClient: service.client,
    events: events.bus,
  })
  const statuses: ConvoStatus[] = []
  convo.subscribe(() => statuses.push(convo.getSnapshot().status))
  await flush()
  return {convo, service, events, statuses}
}

function messageIds(convo: Convo) {
  const state = convo.getSnapshot()
  if (!('items' in state)) return []
  return state.items.flatMap(item =>
    item.type === 'message' ? [item.message.id] : [],
  )
}

describe(`#/state/messages/convo`, () => {
  describe(`init`, () => {
    it.todo(`fails if sender and recipients aren't found`)
    it.todo(`cannot re-initialize from a non-unintialized state`)
    it.todo(`can re-initialize from a failed state`)
  })

  describe(`resume`, () => {
    it.todo(`restores previous state if resume fails`)
  })

  describe(`suspend`, () => {
    it.todo(`cannot be interacted with when suspended`)
    it.todo(`polling is stopped when suspended`)
  })

  describe(`read states`, () => {
    it.todo(`should mark messages as read as they come in`)
  })

  describe(`history fetching`, () => {
    it.todo(`fetches initial chat history`)
    it.todo(`fetches additional chat history`)
    it.todo(`handles history fetch failure`)
    it.todo(`does not insert deleted messages`)
  })

  describe(`sending messages`, () => {
    it.todo(`optimistically adds sending messages`)
    it.todo(`sends messages in order`)
    it.todo(`failed message send fails all sending messages`)
    it.todo(`can retry all failed messages via retry ConvoItem`)
    it.todo(
      `successfully sent messages are re-ordered, if needed, by events received from server`,
    )
    it.todo(`pending messages are cleaned up from state after firehose event`)
  })

  describe(`deleting messages`, () => {
    it.todo(`messages are optimistically deleted from the chat`)
    it.todo(`messages are confirmed deleted via events from the server`)
    it.todo(`deleted messages are cleaned up from state after firehose event`)
  })

  describe(`log handling`, () => {
    it.todo(`updates rev to latest message received`)
    it.todo(`only handles log events for this convoId`)
    it.todo(`does not insert deleted messages`)
  })

  describe(`item ordering`, () => {
    it.todo(`pending items are first, and in order`)
    it.todo(`new message items are next, and in order`)
    it.todo(`past message items are next, and in order`)
  })

  describe(`resuming`, () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it(`keeps its messages however long it was in the background`, async () => {
      const {convo, service, statuses} = await createConvo()
      expect(messageIds(convo)).toEqual(ids(1, 10))

      convo.background()
      const aDayLater = Date.now() + 24 * 60 * 60e3
      jest.spyOn(Date, 'now').mockReturnValue(aDayLater)
      statuses.length = 0
      convo.resume()
      await flush()

      expect(statuses).not.toContain(ConvoStatus.Initializing)
      expect(convo.getSnapshot().status).toBe(ConvoStatus.Ready)
      expect(messageIds(convo)).toEqual(ids(1, 10))
      expect(service.getMessagesCalls()).toHaveLength(1)
    })
  })

  describe(`gaps in the log`, () => {
    it(`swaps in the newest messages without unloading the list`, async () => {
      const {convo, service, events, statuses} = await createConvo()

      // a message that arrived live, before the gap
      service.state.latest = 11
      events.emit({
        type: 'logs',
        logs: [
          {
            $type: 'chat.bsky.convo.defs#logCreateMessage',
            rev: rev(11),
            convoId: CONVO_ID,
            message: message(11),
          } as unknown as chat.bsky.convo.getLog.$OutputBody['logs'][number],
        ],
      })
      expect(messageIds(convo)).toEqual(ids(1, 11))

      // then the bus fell too far behind to replay the log
      const latest = 11 + HISTORY_PAGE_SIZE * 3
      service.state.latest = latest
      statuses.length = 0
      events.emit({type: 'gap'})
      await flush()

      expect(statuses.length).toBeGreaterThan(0)
      expect(new Set(statuses)).toEqual(new Set([ConvoStatus.Ready]))
      expect(messageIds(convo)).toEqual(
        ids(latest - HISTORY_PAGE_SIZE + 1, latest),
      )

      // and pages back from the new messages
      await convo.fetchMessageHistory()
      expect(messageIds(convo)).toEqual(
        ids(latest - HISTORY_PAGE_SIZE * 2 + 1, latest),
      )
    })

    it(`drops a page of history that was in flight during the gap`, async () => {
      const {convo, service, events} = await createConvo({latest: 100})
      expect(messageIds(convo)).toEqual(ids(100 - HISTORY_PAGE_SIZE + 1, 100))

      service.state.historyHeld = true
      const staleFetch = convo.fetchMessageHistory()
      await flush()

      service.state.latest = 1000
      events.emit({type: 'gap'})
      await flush()
      const newest = ids(1000 - HISTORY_PAGE_SIZE + 1, 1000)
      expect(messageIds(convo)).toEqual(newest)

      service.releaseHistory()
      await staleFetch
      expect(messageIds(convo)).toEqual(newest)

      // the stale fetch doesn't block paging back from the new messages
      await convo.fetchMessageHistory()
      expect(messageIds(convo)).toEqual(
        ids(1000 - HISTORY_PAGE_SIZE * 2 + 1, 1000),
      )
    })
  })
})
