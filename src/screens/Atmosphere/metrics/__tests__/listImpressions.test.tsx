import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, render} from '@testing-library/react-native'

import {AtmosphereActivityListScreen} from '#/screens/Atmosphere/ActivityList'
import {ActivityTab} from '#/screens/Atmosphere/ActivityTab'
import {AtmosphereDiscoverTab} from '#/screens/Atmosphere/DiscoverTab'
import {AtmosphereMetricsScope, createVisit} from '../context'

const mockMetric = jest.fn()
let mockFocused = true
let mockData: unknown[] = []

jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    metric: mockMetric,
    features: {enabled: () => true, AtmosphereScreenEnable: 'enabled'},
  }),
}))
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: () => {},
  useIsFocused: () => mockFocused,
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
    logPageLoaded: () => {},
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

const content = {type: 'article', view: {uri: 'https://example.com/article'}}
const normal = {content, moderation: {}}
const blurred = {content, moderation: {blur: true}}

beforeEach(() => {
  i18n.loadAndActivate({locale: 'en', messages: {}})
  mockMetric.mockClear()
  mockFocused = true
})

it('logs Discover rows, excluding blurred content', () => {
  mockData = [blurred, normal]
  const screen = render(
    <I18nProvider i18n={i18n}>
      <AtmosphereMetricsScope
        tab="discover"
        surface="tab"
        isActive
        visit={createVisit()}>
        <AtmosphereDiscoverTab />
      </AtmosphereMetricsScope>
    </I18nProvider>,
  )
  const seen = screen.getByTestId('atmosphereDiscoverTab').props.onItemSeen as (
    item: unknown,
  ) => void
  act(() => {
    seen(blurred)
    seen(normal)
    seen(normal)
  })
  expect(mockMetric.mock.calls).toEqual([
    [
      'atmosphere:content:impression',
      {
        tab: 'discover',
        surface: 'tab',
        contentType: 'article',
        contentId: content.view.uri,
        position: 1,
      },
    ],
  ])
})

it('logs Following cards with activity metadata, excluding warnings and blur', () => {
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
  const screen = render(
    <I18nProvider i18n={i18n}>
      <AtmosphereMetricsScope
        tab="following"
        surface="tab"
        isActive
        visit={createVisit()}>
        <ActivityTab />
      </AtmosphereMetricsScope>
    </I18nProvider>,
  )
  const seen = screen.getByTestId('activityList').props.onItemSeen as (
    item: unknown,
  ) => void
  act(() => {
    seen(warning)
    seen(hidden)
    seen(card)
    seen(card)
  })
  expect(mockMetric.mock.calls).toEqual([
    [
      'atmosphere:content:impression',
      {
        tab: 'following',
        surface: 'tab',
        contentType: 'article',
        contentId: content.view.uri,
        position: 2,
        collection: 'site.standard.document',
        grouping: 'single',
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
  const tree = () => (
    <I18nProvider i18n={i18n}>
      <AtmosphereActivityListScreen
        route={{params: {uris: ''}} as never}
        navigation={{focus: mockFocused} as never}
      />
    </I18nProvider>
  )
  const inactive = render(tree())
  const inactiveSeen = inactive.getByTestId('atmosphereActivityList').props
    .onItemSeen as (item: unknown) => void
  act(() => {
    inactiveSeen(card)
  })
  expect(mockMetric).not.toHaveBeenCalled()
  inactive.unmount()
  mockFocused = true
  const screen = render(tree())
  const seen = screen.getByTestId('atmosphereActivityList').props
    .onItemSeen as (item: unknown) => void
  act(() => {
    seen(warning)
    seen(hidden)
    seen(card)
    seen(card)
  })
  expect(mockMetric.mock.calls).toEqual([
    [
      'atmosphere:content:impression',
      {
        tab: undefined,
        surface: 'activityList',
        contentType: 'article',
        contentId: content.view.uri,
        position: 2,
      },
    ],
  ])
})
