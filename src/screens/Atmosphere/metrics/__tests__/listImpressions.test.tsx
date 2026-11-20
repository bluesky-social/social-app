import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, render} from '@testing-library/react-native'

import {AtmosphereActivityListScreen} from '#/screens/Atmosphere/ActivityList'
import {ActivityTab} from '#/screens/Atmosphere/ActivityTab'
import {AtmosphereDiscoverTab} from '#/screens/Atmosphere/DiscoverTab'
import {AtmosphereMetricsScope} from '../context'

const mockMetric = jest.fn()
let mockFocused = true
let mockSetFocused: React.Dispatch<React.SetStateAction<boolean>> | undefined
let mockData: unknown[] = []

jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    metric: mockMetric,
    features: {enabled: () => true, AtmosphereScreenEnable: 'enabled'},
  }),
}))
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => {
    const {useState} = jest.requireActual<typeof import('react')>('react')
    const [isFocused, setFocused] = useState(mockFocused)
    mockSetFocused = setFocused
    return isFocused
  },
}))
jest.mock('#/lib/appState', () => ({useAppState: () => 'active'}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({atoms: new Proxy({}, {get: () => ({})})}),
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/components/Lists', () => ({ListFooter: () => null}))
jest.mock('#/screens/Atmosphere/components/AtmosphereNux', () => ({
  AtmosphereNux: () => null,
}))
jest.mock('#/components/Layout', () => {
  const {View, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Screen: View,
    Header: {
      Outer: View,
      Content: View,
      TitleText: Text,
      BackButton: () => null,
      Slot: () => null,
    },
  }
})
jest.mock('#/view/screens/NotFound', () => ({NotFoundScreen: () => null}))
jest.mock('#/view/com/util/error/ErrorMessage', () => ({
  ErrorMessage: () => null,
}))
jest.mock('#/view/com/util/List', () => ({
  List: jest.requireActual<typeof import('react-native')>('react-native').View,
}))
jest.mock('#/screens/Atmosphere/metrics/useLoadMetrics', () => ({
  useLoadMetrics: () => ({
    logRefresh: () => {},
    logRetry: () => {},
  }),
}))
jest.mock(
  '#/screens/Atmosphere/ActivityTab/components/ActivityContentHider',
  () => ({
    ActivityContentHider: () => null,
  }),
)
jest.mock('#/screens/Atmosphere/ActivityTab/components/ActivityHeader', () => ({
  ActivityHeader: () => null,
}))
jest.mock('#/screens/Atmosphere/ActivityTab/components/ActivityRow', () => ({
  ActivityRow: () => null,
  ActivityContentCard: () => null,
  ActivityWarning: () => null,
}))
jest.mock('#/screens/Atmosphere/ActivityTab/useActivityTimelineQuery', () => ({
  useActivityTimelineQuery: () => ({data: {pages: [mockData]}}),
}))
jest.mock('#/screens/Atmosphere/ActivityList/useActivityListQuery', () => ({
  useActivityListQuery: () => ({data: {pages: [mockData]}}),
}))
jest.mock(
  '#/screens/Atmosphere/DiscoverTab/useAtmosphereRecommendedActivityQuery',
  () => ({
    useAtmosphereRecommendedActivityQuery: () => ({data: {items: mockData}}),
  }),
)

const AUTHOR = 'did:plc:6ayddqghxhciedbaofoxkcbs'
const ARTICLE_URI = `at://${AUTHOR}/site.standard.document/3kdoc`
const content = {
  type: 'article',
  view: {
    uri: 'https://example.com/article',
    associatedRefs: [{uri: ARTICLE_URI}],
  },
}
const identity = {
  uri: ARTICLE_URI,
  collection: 'site.standard.document',
  authorDid: AUTHOR,
}
const normal = {content, moderation: {}}
const blurred = {content, moderation: {blur: true}}

beforeEach(() => {
  i18n.loadAndActivate({locale: 'en', messages: {}})
  mockMetric.mockClear()
  mockFocused = true
  mockSetFocused = undefined
})

it('flushes Discover rows on activation, excluding blurred content', () => {
  mockData = [blurred, normal]
  const tree = (isActive: boolean) => (
    <I18nProvider i18n={i18n}>
      <AtmosphereMetricsScope tab="discover" surface="tab" isActive={isActive}>
        <AtmosphereDiscoverTab />
      </AtmosphereMetricsScope>
    </I18nProvider>
  )
  const screen = render(tree(false))
  const seen = screen.getByTestId('atmosphereDiscoverTab').props.onItemSeen as (
    item: unknown,
    index: number,
  ) => void
  act(() => {
    seen(blurred, 0)
    seen(normal, 1)
    seen(normal, 1)
  })
  expect(mockMetric).not.toHaveBeenCalled()
  screen.rerender(tree(true))
  expect(mockMetric.mock.calls).toEqual([
    [
      'atmosphere:content:impression',
      {
        tab: 'discover',
        surface: 'tab',
        ...identity,
        position: 1,
      },
    ],
  ])
})

it('flushes Following cards on activation without a second List callback', () => {
  const warning = {kind: 'warning', key: 'warning'}
  const hidden = {kind: 'card', key: 'hidden', ...blurred}
  const card = {
    kind: 'card',
    key: 'card',
    ...normal,
    collection: 'site.standard.document',
    grouping: 'single',
  }
  mockData = [warning, hidden, card]
  const tree = (isActive: boolean) => (
    <I18nProvider i18n={i18n}>
      <AtmosphereMetricsScope tab="following" surface="tab" isActive={isActive}>
        <ActivityTab />
      </AtmosphereMetricsScope>
    </I18nProvider>
  )
  const screen = render(tree(false))
  const seen = screen.getByTestId('activityList').props.onItemSeen as (
    item: unknown,
    index: number,
  ) => void
  act(() => {
    seen(warning, 0)
    seen(hidden, 1)
    seen(card, 2)
    seen(card, 2)
  })
  expect(mockMetric).not.toHaveBeenCalled()
  screen.rerender(tree(true))
  expect(mockMetric.mock.calls).toEqual([
    [
      'atmosphere:content:impression',
      {
        tab: 'following',
        surface: 'tab',
        ...identity,
        position: 2,
        activityReferrerCollection: 'site.standard.document',
        activityReferrerGrouping: 'single',
      },
    ],
  ])
})

it('logs activity list cards without a tab, excluding warnings and blur', () => {
  const warning = {uri: 'at://example/warning', content: undefined}
  const hidden = {uri: 'at://example/hidden', ...blurred}
  const card = {uri: 'at://example/card', ...normal}
  mockData = [warning, hidden, card]
  mockFocused = false
  const screen = render(
    <I18nProvider i18n={i18n}>
      <AtmosphereActivityListScreen
        route={{params: {uris: ''}} as never}
        navigation={{} as never}
      />
    </I18nProvider>,
  )
  const seen = screen.getByTestId('atmosphereActivityList').props
    .onItemSeen as (item: unknown, index: number) => void
  act(() => {
    seen(warning, 0)
    seen(hidden, 1)
    seen(card, 2)
    seen(card, 2)
  })
  expect(mockMetric).not.toHaveBeenCalled()
  act(() => mockSetFocused?.(true))
  expect(mockMetric.mock.calls).toEqual([
    [
      'atmosphere:content:impression',
      {
        tab: undefined,
        surface: 'activityList',
        ...identity,
        position: 2,
      },
    ],
  ])
})
