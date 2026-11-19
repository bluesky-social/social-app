import {Text} from 'react-native'
import {createDeferrable} from '@atproto/common-web'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, fireEvent, render} from '@testing-library/react-native'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {
  article,
  debbie,
  gallery,
} from '#/screens/Atmosphere/ActivityTab/__tests__/fixtures'
import {type ActivityContent} from '#/screens/Atmosphere/ActivityTab/rows'
import {DISCOVER_FEEDBACK} from '#/screens/Atmosphere/const'
import {AtmosphereMetricsScope} from '#/screens/Atmosphere/metrics/context'
import {app} from '#/lexicons'
import {AtmosphereDiscoverTab} from '../index'
import {
  type DiscoverItem,
  useAtmosphereRecommendedActivityQuery,
} from '../useAtmosphereRecommendedActivityQuery'

const FEED_URI = PROD_DEFAULT_FEED('atmosphere-activity')
const defaultFeedUri = DISCOVER_FEEDBACK.feedUri
const mockCall = jest.fn((..._args: unknown[]) => Promise.resolve())
const mockClient = {call: mockCall}
const mockLogger = {debug: jest.fn()}
const mockMetric = jest.fn()
let mockHasSession = true

jest.mock('#/state/session', () => ({
  useSession: () => ({hasSession: mockHasSession}),
  useAppviewClient: () => mockClient,
}))
jest.mock('#/view/com/posts/PostFeed', () => ({getItemsForFeedback: () => []}))
jest.mock('#/state/queries/feed', () => ({isFeedSourceFeedInfo: () => false}))
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    metric: mockMetric,
    logger: {useChild: () => mockLogger, Context: {FeedFeedback: 'feedback'}},
  }),
}))
jest.mock('../useAtmosphereRecommendedActivityQuery', () => ({
  useAtmosphereRecommendedActivityQuery: jest.fn(),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({
    atoms: {text_contrast_medium: {color: '#667788'}, border_contrast_low: {}},
    palette: {primary_500: '#006aff'},
  }),
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/screens/Atmosphere/components/AtmosphereNux', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {AtmosphereNux: () => <Text>nux</Text>}
})
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => undefined,
}))
jest.mock('#/view/com/util/TimeElapsed', () => ({
  TimeElapsed: ({
    timestamp,
    children,
  }: {
    timestamp: string
    children: (props: {timeElapsed: string}) => React.ReactNode
  }) => {
    mockTimestamp(timestamp)
    return children({timeElapsed: '1h'})
  },
}))
jest.mock('#/view/com/util/UserAvatar', () => ({
  PreviewableUserAvatar: () => null,
}))
jest.mock('#/components/Link', () => ({
  InlineLinkText:
    jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/icons/community/Grain', () => ({GrainMark: () => null}))
jest.mock('#/view/com/util/List', () => ({
  List: jest.requireActual<typeof import('react-native')>('react-native')
    .FlatList,
}))
jest.mock('#/view/com/util/error/ErrorMessage', () => {
  const {Button} = jest.requireActual('react-native')
  return {
    ErrorMessage: ({
      message,
      onPressTryAgain,
    }: {
      message: string
      onPressTryAgain: () => void
    }) => <Button title={message} onPress={onPressTryAgain} />,
  }
})
jest.mock(
  '#/screens/Atmosphere/ActivityTab/components/ActivityContentHider',
  () => ({
    ActivityContentHider: ({children}: {children: React.ReactNode}) => children,
  }),
)
jest.mock('#/screens/Atmosphere/ActivityTab/components/LivestreamCard', () => ({
  isLive: () => false,
}))
jest.mock('#/screens/Atmosphere/ActivityTab/components/ActivityRow', () => {
  const {Pressable, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  const {useAtmosphereFeedback} = jest.requireActual<
    typeof import('#/screens/Atmosphere/feedback')
  >('#/screens/Atmosphere/feedback')
  return {
    ActivityContentCard: ({content}: {content: {view: {title: string}}}) => {
      const sendFeedback = useAtmosphereFeedback()
      return (
        <Pressable
          accessibilityLabel={content.view.title}
          accessibilityState={{disabled: !sendFeedback}}
          testID="discoverFeedbackCard"
          accessibilityHint=""
          onPress={() => sendFeedback?.('app.bsky.feed.defs#clickthroughItem')}>
          <Text>{content.view.title}</Text>
        </Pressable>
      )
    },
  }
})

const mockTimestamp = jest.fn()
const refetch = jest.fn()
const mockQuery = jest.mocked(useAtmosphereRecommendedActivityQuery)
const errorMessage = 'Could not load recommendations. Please try again.'

function setQuery(
  result: Partial<ReturnType<typeof useAtmosphereRecommendedActivityQuery>>,
) {
  mockQuery.mockReturnValue({
    data: undefined,
    isError: false,
    refetch,
    ...result,
  } as never)
}

function tab(isActive = true) {
  return (
    <I18nProvider i18n={i18n}>
      <AtmosphereMetricsScope tab="discover" surface="tab" isActive={isActive}>
        <AtmosphereDiscoverTab />
      </AtmosphereMetricsScope>
    </I18nProvider>
  )
}

function renderTab(isActive = true) {
  return render(tab(isActive))
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  mockHasSession = true
  DISCOVER_FEEDBACK.feedUri = defaultFeedUri
  i18n.loadAndActivate({locale: 'en', messages: {}})
})

afterEach(() => jest.useRealTimers())

it('renders cards in order, with refresh but no load-more handler', async () => {
  setQuery({
    data: {
      items: [
        {content: {type: 'gallery', view: gallery()}, moderation: {}},
        {content: {type: 'article', view: article()}, moderation: {}},
      ],
      recIdStr: '123',
    } as never,
  })
  const refresh = createDeferrable()
  refetch.mockReturnValueOnce(refresh.complete)
  const screen = renderTab()
  const list = () => screen.getByTestId('atmosphereDiscoverTab')

  expect(screen.getByText('nux')).toBeTruthy()
  expect(screen.getAllByTestId('atmosphereDiscoverCard')).toHaveLength(2)
  expect(
    screen
      .getAllByTestId('atmosphereDiscoverCard')
      .map(card => card.findByType(Text).props.children as string),
  ).toEqual([gallery().title, article().title])
  expect(list().props.onEndReached).toBeUndefined()

  fireEvent(list(), 'refresh')
  expect(refetch).toHaveBeenCalledTimes(1)
  expect(list().props.refreshing).toBe(true)
  await act(async () => {
    refresh.resolve()
    await refresh.complete
  })
  expect(list().props.refreshing).toBe(false)
})

it.each([
  {
    content: {
      type: 'article',
      view: article(undefined, {
        associatedProfiles: [debbie],
        createdAt: '2026-11-13T12:00:00Z',
      }),
    } satisfies ActivityContent,
    sentence: 'Debbie Ridpath Ohi published an article',
    app: 'Leaflet',
  },
  {
    content: {
      type: 'gallery',
      view: {...gallery(), createdAt: '2026-11-13T12:00:00Z'},
    } satisfies ActivityContent,
    sentence: 'Manton Reece posted a gallery',
    app: 'Grain',
  },
])('infers a creation header: $sentence', ({content, sentence, app}) => {
  setQuery({
    data: {items: [{content, moderation: {}}], recIdStr: '123'} as never,
  })
  const screen = renderTab()

  expect(screen.getByText(sentence)).toBeTruthy()
  expect(screen.getByText('1h on')).toBeTruthy()
  expect(screen.getByText(app)).toBeTruthy()
  expect(mockTimestamp).toHaveBeenCalledWith(content.view.createdAt)
  expect(screen.getByText(content.view.title)).toBeTruthy()
})

it.each([
  {
    type: 'article',
    view: article(undefined, {createdAt: '2026-11-13T12:00:00Z'}),
  },
  {type: 'article', view: article(undefined, {associatedProfiles: [debbie]})},
  {type: 'gallery', view: gallery()},
] satisfies ActivityContent[])(
  'keeps a $type card without a header when the author or creation date is missing',
  content => {
    setQuery({
      data: {items: [{content, moderation: {}}], recIdStr: '123'} as never,
    })
    const screen = renderTab()

    expect(screen.getByText(content.view.title)).toBeTruthy()
    expect(mockTimestamp).not.toHaveBeenCalled()
    expect(
      screen.queryByText(/published an article|posted a gallery/),
    ).toBeNull()
  },
)

it('shows loading, retryable errors, and an empty state', () => {
  setQuery({})
  const screen = renderTab()
  expect(screen.getByLabelText('Loading recommendations')).toBeTruthy()

  setQuery({isError: true})
  screen.rerender(
    <I18nProvider i18n={i18n}>
      <AtmosphereDiscoverTab />
    </I18nProvider>,
  )
  fireEvent.press(screen.getByText(errorMessage))
  expect(refetch).toHaveBeenCalledTimes(1)
  expect(screen.queryByTestId('atmosphereDiscoverEmpty')).toBeNull()

  setQuery({data: {items: [], recIdStr: '123'}})
  screen.rerender(
    <I18nProvider i18n={i18n}>
      <AtmosphereDiscoverTab />
    </I18nProvider>,
  )
  expect(screen.getByText('nux')).toBeTruthy()
  expect(screen.getByTestId('atmosphereDiscoverEmpty')).toBeTruthy()
  expect(screen.queryByLabelText('Loading recommendations')).toBeNull()
})

it('keeps cached cards visible with a retry when refresh fails', () => {
  setQuery({
    isError: true,
    data: {
      items: [{content: {type: 'article', view: article()}, moderation: {}}],
      recIdStr: '123',
    } as never,
  })
  const screen = renderTab()
  expect(screen.getByText('nux')).toBeTruthy()
  expect(screen.getByText(article().title)).toBeTruthy()
  fireEvent.press(screen.getByText(errorMessage))
  expect(refetch).toHaveBeenCalledTimes(1)
})

const REQUEST_ID = '18446744073709551615'
const DOCUMENT_REF = {
  uri: 'at://did:web:writer.test/site.standard.document/1' as const,
  cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
}

function recommended(reqId = REQUEST_ID): DiscoverItem {
  return {
    reqId,
    content: {
      type: 'article',
      view: article(undefined, {associatedRefs: [DOCUMENT_REF]}),
    },
    moderation: {} as DiscoverItem['moderation'],
  }
}

function setBatch(item: DiscoverItem) {
  setQuery({data: {items: [item], recIdStr: item.reqId}})
}

function seen(screen: ReturnType<typeof renderTab>, item: DiscoverItem) {
  const onItemSeen = screen.getByTestId('atmosphereDiscoverTab').props
    .onItemSeen as (item: DiscoverItem, position: number) => void
  act(() => onItemSeen(item, 0))
}

function flushFeedback() {
  act(() => jest.advanceTimersByTime(10e3))
}

it('batches attributed record impressions through Discover without changing content analytics', () => {
  const item = recommended()
  setBatch(item)
  const screen = renderTab()
  seen(screen, item)
  seen(screen, item)
  fireEvent.press(screen.getByText(item.content.view.title))
  expect(mockCall).not.toHaveBeenCalled()
  flushFeedback()

  expect(mockCall).toHaveBeenCalledTimes(1)
  expect(mockCall).toHaveBeenCalledWith(
    app.bsky.feed.sendInteractions,
    {
      feed: FEED_URI,
      interactions: [
        {
          item: DOCUMENT_REF.uri,
          reqId: REQUEST_ID,
          event: 'app.bsky.feed.defs#interactionSeen',
          viewContext: 'feed',
        },
        {
          item: DOCUMENT_REF.uri,
          reqId: REQUEST_ID,
          event: 'app.bsky.feed.defs#clickthroughItem',
          viewContext: 'feed',
        },
      ],
    },
    {service: 'did:web:discover.bsky.app#bsky_fg'},
  )
  expect(
    mockMetric.mock.calls.filter(
      ([event]) => event === 'atmosphere:content:impression',
    ),
  ).toHaveLength(1)
})

it('disables item feedback and impressions when the Discover feed URI is undefined', () => {
  DISCOVER_FEEDBACK.feedUri = undefined
  const item = recommended()
  setBatch(item)
  const screen = renderTab()
  expect(
    screen.getByTestId('discoverFeedbackCard').props.accessibilityState,
  ).toEqual({disabled: true})
  seen(screen, item)
  fireEvent.press(screen.getByText(item.content.view.title))
  flushFeedback()
  expect(mockCall).not.toHaveBeenCalled()
})

it('allows a new impression after refresh and ignores stale row callbacks', () => {
  const first = recommended()
  setBatch(first)
  const screen = renderTab()
  seen(screen, first)
  flushFeedback()
  mockCall.mockClear()

  const next = recommended('18446744073709551616')
  setBatch(next)
  screen.rerender(tab())
  seen(screen, first)
  flushFeedback()
  expect(mockCall).not.toHaveBeenCalled()
  seen(screen, next)
  flushFeedback()
  expect(mockCall).toHaveBeenCalledWith(
    app.bsky.feed.sendInteractions,
    expect.objectContaining({
      interactions: [expect.objectContaining({reqId: next.reqId})],
    }),
    expect.anything(),
  )
})

it('defers inactive impressions until activation, retaining only current eligible rows', () => {
  const first = recommended()
  setBatch(first)
  const screen = renderTab(false)
  seen(screen, first)
  flushFeedback()
  expect(mockCall).not.toHaveBeenCalled()

  const next = {
    ...recommended(),
    moderation: {blur: true} as DiscoverItem['moderation'],
  }
  setBatch(next)
  screen.rerender(tab())
  flushFeedback()
  expect(mockCall).not.toHaveBeenCalled()
  setBatch(first)
  screen.rerender(tab(false))
  seen(screen, first)
  screen.rerender(tab())
  flushFeedback()
  expect(mockCall).toHaveBeenCalledTimes(1)
})

it.each(['signed out', 'missing request', 'missing record', 'blurred'])(
  'does not send impressions for %s content',
  condition => {
    const item = recommended(condition === 'missing request' ? '' : REQUEST_ID)
    if (condition === 'signed out') mockHasSession = false
    if (condition === 'missing record') item.content.view.associatedRefs = []
    if (condition === 'blurred')
      item.moderation = {blur: true} as DiscoverItem['moderation']
    setBatch(item)
    const screen = renderTab()
    seen(screen, item)
    flushFeedback()
    expect(mockCall).not.toHaveBeenCalled()
  },
)

it('targets the gallery record rather than its photos or external URL', () => {
  const galleryUri = 'at://did:web:writer.test/social.grain.gallery/1'
  const item: DiscoverItem = {
    ...recommended(),
    content: {
      type: 'gallery',
      view: {
        ...gallery(),
        associatedRefs: [
          {
            ...DOCUMENT_REF,
            uri: 'at://did:web:writer.test/social.grain.photo/1',
          },
          {...DOCUMENT_REF, uri: galleryUri},
        ],
      },
    },
  }
  setBatch(item)
  const screen = renderTab()
  seen(screen, item)
  flushFeedback()
  expect(mockCall).toHaveBeenCalledWith(
    app.bsky.feed.sendInteractions,
    expect.objectContaining({
      interactions: [expect.objectContaining({item: galleryUri})],
    }),
    expect.anything(),
  )
})
