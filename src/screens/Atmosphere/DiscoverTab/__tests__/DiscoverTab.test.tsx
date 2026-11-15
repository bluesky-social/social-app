import {Text} from 'react-native'
import {createDeferrable} from '@atproto/common-web'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, fireEvent, render} from '@testing-library/react-native'

import {
  article,
  debbie,
  gallery,
} from '#/screens/Atmosphere/ActivityTab/__tests__/fixtures'
import {type ActivityContent} from '#/screens/Atmosphere/ActivityTab/rows'
import {AtmosphereDiscoverTab} from '../index'
import {useAtmosphereRecommendedActivityQuery} from '../useAtmosphereRecommendedActivityQuery'

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
  const {Text} = jest.requireActual('react-native')
  return {
    ActivityContentCard: ({content}: {content: {view: {title: string}}}) => (
      <Text>{content.view.title}</Text>
    ),
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

function renderTab() {
  return render(
    <I18nProvider i18n={i18n}>
      <AtmosphereDiscoverTab />
    </I18nProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  i18n.loadAndActivate({locale: 'en', messages: {}})
})

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
  expect(screen.getByText(article().title)).toBeTruthy()
  fireEvent.press(screen.getByText(errorMessage))
  expect(refetch).toHaveBeenCalledTimes(1)
})
