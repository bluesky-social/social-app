import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

import {DISCOVER_FEED_URI} from '#/lib/constants'
import {type FeedSourceFeedInfo} from '#/state/queries/feed'
import {type FeedPostSliceItem} from '#/state/queries/post-feed'
import {getItemsForFeedback} from '#/view/com/posts/PostFeed'
import {
  FeedFeedbackProvider,
  type FeedFeedbackViewContext,
  type FeedItem,
  FeedItemProvider,
  unspeccedInteraction,
  useFeedFeedback,
  useFeedFeedbackCore,
  useFeedItemFeedback,
} from '#/features/feedFeedback'
import {app} from '#/lexicons'

const mockCall = jest.fn((..._args: unknown[]) => Promise.resolve())
const mockAnalytics = {
  logger: {
    useChild: () => ({debug: () => {}}),
    Context: {FeedFeedback: 'feed-feedback'},
  },
  metric: () => {},
}

jest.mock('#/state/session', () => ({
  useAppviewClient: () => ({
    call: (...args: unknown[]) => mockCall(...args),
  }),
}))
jest.mock('#/analytics', () => ({useAnalytics: () => mockAnalytics}))
// Only used by onItemSeen, and importing it pulls in the whole feed list.
jest.mock('#/view/com/posts/PostFeed', () => ({getItemsForFeedback: jest.fn()}))
// The real module imports Reanimated, which needs its native half.
jest.mock('#/state/queries/feed', () => ({
  isFeedSourceFeedInfo: (feed: {type: string}) => feed.type === 'feed',
}))

const POST_URI = 'at://did:plc:author/app.bsky.feed.post/1'
const THIRD_PARTY_FEED_URI = 'at://did:plc:someone/app.bsky.feed.generator/cats'

const discover = feed(DISCOVER_FEED_URI, 'did:web:discover.test')
const thirdParty = {
  ...feed(THIRD_PARTY_FEED_URI, 'did:web:cats.test'),
  acceptsInteractions: true,
}

function feed(uri: string, did: string) {
  return {
    type: 'feed',
    uri,
    feedDescriptor: `feedgen|${uri}`,
    view: {did},
  } as unknown as FeedSourceFeedInfo
}

beforeEach(() => {
  jest.useFakeTimers()
  mockCall.mockClear()
  jest.mocked(getItemsForFeedback).mockReturnValue([])
})
afterEach(() => {
  jest.useRealTimers()
})

function render(
  viewContext: FeedFeedbackViewContext = 'feed',
  feedInfo: FeedSourceFeedInfo = discover,
) {
  return renderHook(() => useFeedFeedback(feedInfo, true, viewContext)).result
}

/**
 * Waits out the send throttle and returns the interactions that were sent to
 * the feed, or `[]` if nothing was.
 */
function flush(feedInfo: FeedSourceFeedInfo = discover) {
  act(() => {
    jest.advanceTimersByTime(10e3)
  })
  if (mockCall.mock.calls.length === 0) return []
  expect(mockCall).toHaveBeenCalledTimes(1)
  const [method, input, options] = mockCall.mock.calls[0]
  expect(method).toBe(app.bsky.feed.sendInteractions)
  expect(input).toMatchObject({feed: feedInfo.uri})
  expect(options).toEqual({service: `${feedInfo.view?.did}#bsky_fg`})
  return (input as app.bsky.feed.sendInteractions.$InputBody).interactions
}

function save(type: 'save' | 'unsave') {
  return unspeccedInteraction({
    item: POST_URI,
    feedContext: 'context',
    reqId: 'req',
    payload: {type},
  })
}

describe('useFeedFeedback', () => {
  it('preserves seen attribution and deduplicates by post identity', () => {
    const item = {uri: POST_URI} as unknown as FeedPostSliceItem
    jest
      .mocked(getItemsForFeedback)
      .mockReturnValue([{item, feedContext: 'context', reqId: 'req'}])
    const result = render()
    act(() => {
      result.current.onItemSeen({})
      result.current.onItemSeen({})
    })

    expect(flush()).toEqual([
      {
        item: POST_URI,
        event: 'app.bsky.feed.defs#interactionSeen',
        feedContext: 'context',
        reqId: 'req',
        viewContext: 'feed',
      },
    ])
  })

  it.each(['feed', 'thread'] as const)(
    'sends where the interaction happened: %s',
    viewContext => {
      const result = render(viewContext)
      act(() => {
        result.current.sendInteraction({
          item: POST_URI,
          event: 'app.bsky.feed.defs#interactionLike',
          feedContext: 'context',
          reqId: 'req',
        })
      })

      expect(flush()).toEqual([
        {
          item: POST_URI,
          event: 'app.bsky.feed.defs#interactionLike',
          feedContext: 'context',
          reqId: 'req',
          viewContext,
        },
      ])
    },
  )

  it('sends unspecced events with their payload', () => {
    const result = render()
    act(() => {
      result.current.sendInteraction(
        unspeccedInteraction({
          item: POST_URI,
          feedContext: undefined,
          reqId: undefined,
          payload: {
            type: 'report',
            reason: 'tools.ozone.report.defs#reasonMisleadingSpam',
          },
        }),
      )
    })

    expect(flush()).toEqual([
      {
        item: POST_URI,
        event: 'app.bsky.feed.defs#interactionUnspecced',
        payload: {
          type: 'report',
          reason: 'tools.ozone.report.defs#reasonMisleadingSpam',
        },
        viewContext: 'feed',
      },
    ])
  })

  it('sends the latest of a toggle last, and each event once', () => {
    const result = render()
    act(() => {
      result.current.sendInteraction(save('save'))
      result.current.sendInteraction(save('unsave'))
      result.current.sendInteraction(save('save'))
    })

    expect(flush().map(interaction => interaction.payload)).toEqual([
      {type: 'unsave'},
      {type: 'save'},
    ])
  })

  it('never sends unspecced events to third-party feeds', () => {
    const result = render('feed', thirdParty)
    act(() => {
      result.current.sendInteraction(save('save'))
      result.current.sendInteraction({
        item: POST_URI,
        event: 'app.bsky.feed.defs#interactionLike',
      })
    })

    expect(flush(thirdParty).map(interaction => interaction.event)).toEqual([
      'app.bsky.feed.defs#interactionLike',
    ])
  })

  it('sends follows to third-party feeds', () => {
    const result = render('thread', thirdParty)
    act(() => {
      result.current.sendInteraction({
        item: POST_URI,
        event: 'app.bsky.feed.defs#interactionFollow',
      })
    })

    expect(flush(thirdParty).map(interaction => interaction.event)).toEqual([
      'app.bsky.feed.defs#interactionFollow',
    ])
  })
})

describe('useFeedFeedbackCore', () => {
  it('sends non-post feedback without feed metadata', () => {
    const {result} = renderHook(() =>
      useFeedFeedbackCore({
        feedUri: DISCOVER_FEED_URI,
        feedDid: 'did:web:discover.test',
        enabled: true,
        viewContext: 'feed',
      }),
    )
    const interaction: app.bsky.feed.defs.Interaction = {
      item: 'at://did:plc:author/site.standard.document/1',
      event: 'app.bsky.feed.defs#requestMore',
      reqId: '9007199254740993123',
    }
    act(() => result.current.sendInteraction(interaction))

    expect(flush()).toEqual([{...interaction, viewContext: 'feed'}])
  })
})

describe('useFeedItemFeedback', () => {
  const item: FeedItem = {
    uri: POST_URI,
    authorDid: 'did:plc:author',
    feedContext: 'context',
    reqId: 'req',
    via: undefined,
  }

  function renderItem(feedItem: FeedItem | undefined) {
    function Wrapper({children}: {children: React.ReactNode}) {
      const feedback = useFeedFeedback(discover, true, 'feed')
      return (
        <FeedFeedbackProvider value={feedback}>
          <FeedItemProvider value={feedItem}>{children}</FeedItemProvider>
        </FeedFeedbackProvider>
      )
    }
    return renderHook(() => useFeedItemFeedback(), {wrapper: Wrapper}).result
  }

  it('sends events about the feed item it is inside', () => {
    const result = renderItem(item)
    act(() => {
      result.current.send('app.bsky.feed.defs#interactionLike')
      result.current.sendUnspecced({type: 'save'})
    })

    expect(flush()).toEqual([
      {
        item: POST_URI,
        event: 'app.bsky.feed.defs#interactionLike',
        feedContext: 'context',
        reqId: 'req',
        viewContext: 'feed',
      },
      {
        item: POST_URI,
        event: 'app.bsky.feed.defs#interactionUnspecced',
        feedContext: 'context',
        reqId: 'req',
        payload: {type: 'save'},
        viewContext: 'feed',
      },
    ])
  })

  it('sends nothing outside a feed item', () => {
    const result = renderItem(undefined)
    act(() => {
      result.current.send('app.bsky.feed.defs#interactionLike')
      result.current.sendUnspecced({type: 'save'})
    })

    expect(result.current.item).toBeUndefined()
    expect(flush()).toEqual([])
  })
})
