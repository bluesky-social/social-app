import {act, renderHook} from '@testing-library/react-native'

import {PROD_FEEDS} from '#/lib/constants'
import {createLexClient} from '#/lib/lexClient'
import {
  buildVideoWatchInteraction,
  type VideoWatchInteraction,
} from '#/lib/media/video/feedFeedback'
import {type FeedSourceInfo} from '#/state/queries/feed'
import {useFeedFeedback} from '../feed-feedback'

// The lex client walks request bodies with the real CID check.
jest.unmock('multiformats/cid')

const mockMetric = jest.fn()
const mockFeatureEnabled = jest.fn()
const mockAnalytics = {
  metric: mockMetric,
  logger: {
    useChild: () => ({debug() {}}),
    Context: {FeedFeedback: 'feed-feedback'},
  },
  features: {
    enabled: mockFeatureEnabled,
    FeedVideoWatchEnable: 'feed:video_watch:enable',
  },
}
jest.mock('#/analytics', () => ({useAnalytics: () => mockAnalytics}))
jest.mock('#/analytics/identifiers', () => ({
  getDeviceId: () => undefined,
  getSessionId: () => undefined,
}))

let mockClient: unknown
/** Mirrors the session provider's live check against its store. */
let mockSignedIn = true
const mockIsCurrentAppviewClient = (client: unknown) =>
  mockSignedIn && client === mockClient
jest.mock('#/state/session', () => ({
  useAppviewClient: () => mockClient,
  useIsCurrentAppviewClient: () => mockIsCurrentAppviewClient,
}))
jest.mock('#/view/com/posts/PostFeed', () => ({getItemsForFeedback: () => []}))
jest.mock('#/state/queries/feed', () => ({
  isFeedSourceFeedInfo: (feed: {type: string}) => feed.type === 'feed',
}))

type Request = {
  path: string
  headers: Headers
  body: {feed?: string; interactions: unknown[]}
}

/** A real lex client whose network is a recording stub. */
function makeClient() {
  const requests: Request[] = []
  const client = createLexClient({
    did: 'did:plc:viewer',
    fetchHandler: (path, init) => {
      requests.push({
        path,
        headers: new Headers(init.headers),
        body: JSON.parse(
          typeof init.body === 'string'
            ? init.body
            : new TextDecoder().decode(init.body as Uint8Array),
        ) as Request['body'],
      })
      return Promise.resolve(
        new Response('{}', {
          status: 200,
          headers: {'content-type': 'application/json'},
        }),
      )
    },
  })
  return {client, requests}
}

function makeFeed(
  feedDescriptor: string,
  did: string,
  acceptsInteractions = false,
): FeedSourceInfo {
  return {
    type: 'feed',
    uri: feedDescriptor.replace('feedgen|', ''),
    feedDescriptor,
    view: {did},
    acceptsInteractions,
  } as unknown as FeedSourceInfo
}

const DISCOVER = makeFeed(PROD_FEEDS[0], 'did:web:discover.example')
const VIDEOS = makeFeed(PROD_FEEDS[1], 'did:web:videos.example')
const THIRD_PARTY = makeFeed(
  'feedgen|at://did:plc:other/app.bsky.feed.generator/cats',
  'did:web:cats.example',
  true,
)

const ITEM = 'at://did:plc:author/app.bsky.feed.post/outer' as const

function watch(
  segmentIndex: number,
  endReason: VideoWatchInteraction['videoWatch']['endReason'] = 'paused',
) {
  return buildVideoWatchInteraction({
    attribution: {item: ITEM, feedContext: 'a|b|c', reqId: 'req-1'},
    segment: {
      playbackSessionId: 'session-1',
      segmentIndex,
      durationMs: 1500,
      endReason,
    },
    context: 'embed',
    videoDurationSeconds: 30,
  })
}

const seen = {
  item: ITEM,
  event: 'app.bsky.feed.defs#interactionSeen',
  feedContext: 'a|b|c',
  reqId: 'req-1',
} as const
const like = {...seen, event: 'app.bsky.feed.defs#interactionLike'} as const

async function settle(ms = 0) {
  await act(async () => {
    jest.advanceTimersByTime(ms)
    await Promise.resolve()
    await Promise.resolve()
  })
}

function render(feed: FeedSourceInfo, hasSession = true) {
  return renderHook(
    (props: {feed: FeedSourceInfo; hasSession: boolean}) =>
      useFeedFeedback(props.feed, props.hasSession),
    {initialProps: {feed, hasSession}},
  )
}

beforeEach(() => {
  mockSignedIn = true
  jest.useFakeTimers()
  mockMetric.mockReset()
  mockFeatureEnabled.mockReset().mockReturnValue(true)
})

afterEach(() => {
  jest.useRealTimers()
})

it('sends the watch payload intact through the lex client, batched and deduped', async () => {
  const {client, requests} = makeClient()
  mockClient = client
  const {result} = render(DISCOVER)

  act(() => {
    result.current.sendInteraction({...seen})
    result.current.sendInteraction({...like})
    result.current.sendInteraction({...like}) // legacy dedup on four fields
    result.current.sendVideoWatch(watch(0))
    result.current.sendVideoWatch(watch(0)) // same segment again
    result.current.sendVideoWatch(watch(1))
  })
  await settle()
  expect(requests).toHaveLength(0) // throttled
  await settle(10e3)

  expect(requests).toHaveLength(1)
  const [request] = requests
  expect(request.path).toContain('app.bsky.feed.sendInteractions')
  expect(request.headers.get('atproto-proxy')).toBe(
    'did:web:discover.example#bsky_fg',
  )
  expect(request.body).toEqual({
    feed: DISCOVER.uri,
    interactions: [seen, like, watch(0), watch(1)],
  })
  expect(
    (request.body.interactions[2] as VideoWatchInteraction).videoWatch,
  ).toEqual({
    durationMs: 1500,
    videoDurationMs: 30000,
    playbackSessionId: 'session-1',
    segmentIndex: 0,
    context: 'embed',
    endReason: 'paused',
  })

  // Watch time is not counted as engagement.
  expect(mockMetric).toHaveBeenCalledWith('feed:seen', {
    count: 1,
    feed: DISCOVER.feedDescriptor,
  })
  expect(mockMetric).toHaveBeenCalledWith('feed:engaged', {
    count: 1,
    feed: DISCOVER.feedDescriptor,
  })
  expect(mockMetric).toHaveBeenCalledTimes(2)
})

it('drops watch feedback when the flag is off', async () => {
  const {client, requests} = makeClient()
  mockClient = client
  mockFeatureEnabled.mockReturnValue(false)
  const {result} = render(DISCOVER)

  act(() => {
    result.current.sendInteraction({...seen})
    result.current.sendVideoWatch(watch(0, 'unmounted'))
  })
  await settle(10e3)

  expect(requests.map(r => r.body.interactions)).toEqual([[seen]])
})

it('never sends watch feedback to third-party feeds', async () => {
  const {client, requests} = makeClient()
  mockClient = client
  const {result} = render(THIRD_PARTY)

  act(() => {
    result.current.sendInteraction({...seen})
    result.current.sendInteraction({...like})
    result.current.sendVideoWatch(watch(0))
  })
  await settle(10e3)

  expect(requests.map(r => r.body.interactions)).toEqual([[seen, like]])
  // Not even evaluated, so no exposure is logged for third-party feeds.
  expect(mockFeatureEnabled).not.toHaveBeenCalled()
})

it('sends nothing when logged out', async () => {
  const {client, requests} = makeClient()
  mockClient = client
  const {result} = render(DISCOVER, false)

  act(() => {
    result.current.sendInteraction({...seen})
    result.current.sendVideoWatch(watch(0, 'unmounted'))
  })
  await settle(10e3)

  expect(requests).toHaveLength(0)
})

it('flushes background segments immediately with anything pending', async () => {
  const {client, requests} = makeClient()
  mockClient = client
  const {result} = render(DISCOVER)

  act(() => {
    result.current.sendInteraction({...seen})
    result.current.sendVideoWatch(watch(0, 'backgrounded'))
  })
  await settle()

  expect(requests.map(r => r.body.interactions)).toEqual([
    [seen, watch(0, 'backgrounded')],
  ])
})

it('keeps old feed traffic and stats on the old binding after a route change', async () => {
  const {client, requests} = makeClient()
  mockClient = client
  const {result, rerender, unmount} = render(DISCOVER)
  const oldSendVideoWatch = result.current.sendVideoWatch
  const sentTo = () =>
    requests.map(r => [
      r.headers.get('atproto-proxy'),
      r.body.feed,
      r.body.interactions,
    ])

  act(() => {
    result.current.sendInteraction({...seen})
  })
  rerender({feed: VIDEOS, hasSession: true})
  await settle()

  // Pending items were flushed through the old feed, with stats labeled so.
  expect(sentTo()).toEqual([
    ['did:web:discover.example#bsky_fg', DISCOVER.uri, [seen]],
  ])
  expect(mockMetric).toHaveBeenCalledWith('feed:seen', {
    count: 1,
    feed: DISCOVER.feedDescriptor,
  })

  // A child's late cleanup, still holding the old sender, goes out right away
  // through the old feed rather than the new one.
  act(() => {
    oldSendVideoWatch(watch(2, 'deactivated'))
  })
  await settle()
  expect(sentTo()[1]).toEqual([
    'did:web:discover.example#bsky_fg',
    DISCOVER.uri,
    [watch(2, 'deactivated')],
  ])

  act(() => {
    result.current.sendInteraction({...like})
  })
  unmount()
  await settle()
  expect(sentTo()[2]).toEqual([
    'did:web:videos.example#bsky_fg',
    VIDEOS.uri,
    [like],
  ])
  expect(mockMetric).toHaveBeenCalledWith('feed:engaged', {
    count: 1,
    feed: VIDEOS.feedDescriptor,
  })
  expect(mockMetric).not.toHaveBeenCalledWith('feed:seen', {
    count: 1,
    feed: VIDEOS.feedDescriptor,
  })

  // The provider's cleanup ran first; the old child's final segment still
  // flushes through the old feed.
  act(() => {
    oldSendVideoWatch(watch(3, 'unmounted'))
  })
  await settle()
  expect(sentTo()).toHaveLength(4)
  expect(sentTo()[3][1]).toBe(DISCOVER.uri)
})

describe.each([
  ['re-rendered', false],
  // App.tsx keys the tree by DID, so logout usually removes the provider.
  ['removed without re-rendering', true],
])('when the provider is %s', (_, removed) => {
  it('drops queued and late watch feedback after logout', async () => {
    const {client, requests} = makeClient()
    mockClient = client
    const {result, rerender, unmount} = render(DISCOVER)
    const oldSendVideoWatch = result.current.sendVideoWatch

    act(() => {
      result.current.sendInteraction({...seen})
      oldSendVideoWatch(watch(0))
    })
    mockSignedIn = false
    if (removed) {
      unmount()
    } else {
      rerender({feed: DISCOVER, hasSession: false})
    }
    act(() => {
      oldSendVideoWatch(watch(1, 'unmounted'))
    })
    await settle(10e3)

    // Existing feedback keeps its old flush; private watch time does not.
    expect(requests.map(r => r.body.interactions)).toEqual([[seen]])
  })

  it('drops queued and late watch feedback after a client switch', async () => {
    const a = makeClient()
    const b = makeClient()
    mockClient = a.client
    const {result, rerender, unmount} = render(DISCOVER)
    const oldSendVideoWatch = result.current.sendVideoWatch

    act(() => {
      result.current.sendInteraction({...seen})
      oldSendVideoWatch(watch(0))
    })
    mockClient = b.client
    if (removed) {
      unmount()
    } else {
      rerender({feed: DISCOVER, hasSession: true})
    }
    act(() => {
      oldSendVideoWatch(watch(1, 'unmounted'))
    })
    await settle(10e3)

    expect(a.requests.map(r => r.body.interactions)).toEqual([[seen]])
    expect(b.requests).toHaveLength(0)
  })
})
