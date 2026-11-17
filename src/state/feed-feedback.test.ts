import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

import {DISCOVER_FEED_URI} from '#/lib/constants'
import {type FeedSourceFeedInfo} from '#/state/queries/feed'
import {app} from '#/lexicons'
import {type FeedFeedbackViewContext, useFeedFeedback} from './feed-feedback'

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
jest.mock('#/view/com/posts/PostFeed', () => ({getItemsForFeedback: () => []}))
// The real module imports Reanimated, which needs its native half.
jest.mock('#/state/queries/feed', () => ({
  isFeedSourceFeedInfo: (feed: {type: string}) => feed.type === 'feed',
}))

const FEEDGEN_DID = 'did:web:discover.test'
const POST_URI = 'at://did:plc:author/app.bsky.feed.post/1'

const discover = {
  type: 'feed',
  uri: DISCOVER_FEED_URI,
  feedDescriptor: `feedgen|${DISCOVER_FEED_URI}`,
  view: {did: FEEDGEN_DID},
} as unknown as FeedSourceFeedInfo

beforeEach(() => {
  jest.useFakeTimers()
  mockCall.mockClear()
})
afterEach(() => {
  jest.useRealTimers()
})

function render(viewContext: FeedFeedbackViewContext) {
  return renderHook(() => useFeedFeedback(discover, true, viewContext)).result
}

/** Waits out the send throttle and returns the interactions that were sent. */
function flush() {
  act(() => {
    jest.advanceTimersByTime(10e3)
  })
  expect(mockCall).toHaveBeenCalledTimes(1)
  const [method, input, options] = mockCall.mock.calls[0]
  expect(method).toBe(app.bsky.feed.sendInteractions)
  expect(options).toEqual({service: `${FEEDGEN_DID}#bsky_fg`})
  return (input as app.bsky.feed.sendInteractions.$InputBody).interactions
}

describe('useFeedFeedback', () => {
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
})
