import {type RefreshControlProps} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {AtmosphereAppsTab} from '#/screens/Atmosphere/AppsTab'
import {type AtmosphereData} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (message: {message?: string} | string) =>
      typeof message === 'string' ? message : (message.message ?? ''),
  }),
}))

jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: number) => {
    const {useState} = require('react') as typeof import('react')
    return useState(() => {
      let value = initial
      return {get: () => value, set: (next: number) => (value = next)}
    })[0]
  },
  withTiming: (value: number) => value,
}))

jest.mock('#/screens/Atmosphere/data/useAtmosphereExploreQuery', () => ({
  useAtmosphereExploreQuery: jest.fn(),
}))

jest.mock('#/components/Layout', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Content: View}
})

jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})

jest.mock('#/components/Loader', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Loader: () => <View testID="loader" />}
})

jest.mock('#/view/com/util/error/ErrorMessage', () => {
  const {Pressable, Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ErrorMessage: ({
      message,
      onPressTryAgain,
    }: {
      message: string
      onPressTryAgain: () => void
    }) => (
      <View>
        <Text>{message}</Text>
        <Pressable
          testID="retry"
          accessibilityRole="button"
          onPress={onPressTryAgain}
        />
      </View>
    ),
  }
})

jest.mock('#/screens/Atmosphere/components/AppCard', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {AppCard: ({app}: {app: {title: string}}) => <Text>{app.title}</Text>}
})

jest.mock('#/screens/Notifications/components/TabPills', () => {
  const {Pressable, Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    TabPills: ({
      tabs,
      selectedTab,
      dragProgress,
      onSelectTab,
    }: {
      tabs: {key: string; label: string}[]
      selectedTab: string
      dragProgress: {get: () => number}
      onSelectTab: (key: string) => void
    }) => (
      <View>
        <Text testID="selectedTab">{selectedTab}</Text>
        <Text testID="progress">{String(dragProgress.get())}</Text>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            testID={`pill-${tab.key}`}
            accessibilityRole="tab"
            onPress={() => onSelectTab(tab.key)}>
            <Text>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    ),
  }
})

const mockQuery = jest.mocked(useAtmosphereExploreQuery)
const refetch = jest.fn()

function setQuery(
  result: Partial<ReturnType<typeof useAtmosphereExploreQuery>>,
) {
  mockQuery.mockReturnValue({
    data: undefined,
    isError: false,
    isPending: false,
    isRefetching: false,
    refetch,
    ...result,
  } as never)
}

const url = 'https://example.com/app'
const data: AtmosphereData = {
  articles: {items: []},
  publications: {items: []},
  photos: {items: []},
  livestreams: {items: []},
  apps: [
    {id: 'blog', title: 'Blog app', url, category: 'writing'},
    {id: 'photo', title: 'Photo app', url, category: 'photography'},
    {id: 'game', title: 'Game app', url, category: 'games'},
    {id: 'unknown', title: 'Unknown app', url, category: 'new'},
    {id: 'missing', title: 'Missing app', url},
    {id: 'invalid', title: '', url, category: 'writing'},
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AtmosphereAppsTab', () => {
  it('shows an accessible loader while the first request is pending', () => {
    setQuery({isPending: true})
    render(<AtmosphereAppsTab />)

    expect(screen.getByTestId('atmosphereAppsTab')).toBeTruthy()
    expect(screen.getByTestId('atmosphereAppsTabLoading')).toBeTruthy()
    expect(screen.getByLabelText('Loading Atmosphere content')).toBeTruthy()
    expect(screen.queryByTestId('selectedTab')).toBeNull()
  })

  it('offers retry when the first request fails', () => {
    setQuery({isError: true})
    render(<AtmosphereAppsTab />)

    expect(
      screen.getByText('Could not load Atmosphere content. Please try again.'),
    ).toBeTruthy()
    fireEvent.press(screen.getByTestId('retry'))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows every valid app under All, including uncategorized ones', () => {
    setQuery({data})
    render(<AtmosphereAppsTab />)

    expect(screen.getByTestId('selectedTab').props.children).toBe('all')
    for (const title of [
      'Blog app',
      'Photo app',
      'Game app',
      'Unknown app',
      'Missing app',
    ]) {
      expect(screen.getByText(title)).toBeTruthy()
    }
    expect(screen.queryByTestId('retry')).toBeNull()
  })

  it.each([
    ['writing', 'Blog app'],
    ['photography', 'Photo app'],
    ['games', 'Game app'],
  ])('filters %s locally without refetching', (key, title) => {
    setQuery({data})
    render(<AtmosphereAppsTab />)

    fireEvent.press(screen.getByTestId(`pill-${key}`))

    expect(screen.getByTestId('selectedTab').props.children).toBe(key)
    expect(screen.getByTestId('progress').props.children).toBe(
      String(
        ['all', 'writing', 'photography', 'video', 'games', 'feeds'].indexOf(
          key,
        ),
      ),
    )
    expect(screen.getByText(title)).toBeTruthy()
    expect(screen.queryByText('Unknown app')).toBeNull()
    expect(screen.queryByText('Missing app')).toBeNull()
    expect(screen.getAllByText(/ app$/)).toHaveLength(1)
    expect(refetch).not.toHaveBeenCalled()
  })

  it('keeps every category pill and shows an empty message for an empty category', () => {
    setQuery({data})
    render(<AtmosphereAppsTab />)

    for (const label of [
      'All',
      'Blogging',
      'Photo',
      'Video',
      'Games',
      'Feeds',
    ]) {
      expect(screen.getByText(label)).toBeTruthy()
    }

    fireEvent.press(screen.getByTestId('pill-video'))

    expect(screen.getByText('No apps in this category yet.')).toBeTruthy()
    expect(screen.queryByText(/ app$/)).toBeNull()
    expect(screen.getByTestId('pill-all')).toBeTruthy()
  })

  it('keeps cached apps and offers retry when a refetch fails', () => {
    setQuery({data, isError: true})
    render(<AtmosphereAppsTab />)

    expect(screen.getByText('Blog app')).toBeTruthy()
    fireEvent.press(screen.getByTestId('retry'))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['loading', {isPending: true}],
    ['error', {isError: true}],
    ['loaded', {data}],
  ])('wires pull-to-refresh to the query while %s', (_name, result) => {
    setQuery({...result, isRefetching: true})
    render(<AtmosphereAppsTab />)

    const {refreshControl} = screen.getByTestId('atmosphereAppsTab').props as {
      refreshControl: React.ReactElement<RefreshControlProps>
    }
    expect(refreshControl.props.refreshing).toBe(true)
    void refreshControl.props.onRefresh?.()
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
