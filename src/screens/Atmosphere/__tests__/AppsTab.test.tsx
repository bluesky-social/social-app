import {type RefreshControlProps} from 'react-native'
import {createDeferrable} from '@atproto/common-web'
import {act, fireEvent, render, screen} from '@testing-library/react-native'

import {AtmosphereAppsTab} from '#/screens/Atmosphere/AppsTab'
import {type AtmosphereAppsData} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereAppsQuery} from '#/screens/Atmosphere/data/useAtmosphereAppsQuery'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (message: {message?: string} | string) =>
      typeof message === 'string' ? message : (message.message ?? ''),
  }),
}))

/* The most recent shared value, so tests can read it after effects run. */
const mockProgress: {get: () => number} = {get: () => 0}

jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: number) => {
    const {useState} = require('react') as typeof import('react')
    return useState(() => {
      let value = initial
      const sharedValue = {
        get: () => value,
        set: (next: number) => (value = next),
      }
      mockProgress.get = sharedValue.get
      return sharedValue
    })[0]
  },
  withTiming: (value: number) => value,
}))

jest.mock('#/screens/Atmosphere/data/useAtmosphereAppsQuery', () => ({
  useAtmosphereAppsQuery: jest.fn(),
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
      onSelectTab,
    }: {
      tabs: {key: string; label: string}[]
      selectedTab: string
      onSelectTab: (key: string) => void
    }) => (
      <View>
        <Text testID="selectedTab">{selectedTab}</Text>
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

const mockQuery = jest.mocked(useAtmosphereAppsQuery)
const refetch = jest.fn()

function getRefreshControlProps() {
  const {refreshControl} = screen.getByTestId('atmosphereAppsTab').props as {
    refreshControl: React.ReactElement<RefreshControlProps>
  }
  return refreshControl.props
}

function setQuery(result: Partial<ReturnType<typeof useAtmosphereAppsQuery>>) {
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
const data: AtmosphereAppsData = {
  apps: [
    {id: 'blog', title: 'Blog app', url, category: 'writing'},
    {id: 'photo', title: 'Photo app', url, category: 'photography'},
    {id: 'game', title: 'Game app', url, category: 'games'},
    {id: 'social', title: 'Social app', url, category: 'social'},
    {id: 'dev', title: 'Dev app', url, category: 'dev'},
    {id: 'audio', title: 'Audio app', url, category: 'audio'},
    {id: 'event', title: 'Event app', url, category: 'events'},
    {id: 'util', title: 'Util app', url, category: 'utils'},
    {id: 'unknown', title: 'Unknown app', url, category: 'new'},
    {id: 'missing', title: 'Missing app', url},
    /* Invalid cards never render, so they must not create a pill. */
    {id: 'invalid', title: '', url, category: 'video'},
    {id: 'invalid-feed', title: 'No URL', category: 'feeds'},
  ],
}

const populatedKeys = [
  'all',
  'writing',
  'photography',
  'games',
  'social',
  'dev',
  'audio',
  'events',
  'utils',
]

function pillKeys() {
  return screen
    .getAllByTestId(/^pill-/)
    .map(pill => (pill.props as {testID: string}).testID.slice('pill-'.length))
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
      'Social app',
      'Dev app',
      'Audio app',
      'Event app',
      'Util app',
      'Unknown app',
      'Missing app',
    ]) {
      expect(screen.getByText(title)).toBeTruthy()
    }
    expect(screen.queryByText('No apps in this category yet.')).toBeNull()
    expect(screen.queryByTestId('retry')).toBeNull()
  })

  it.each([
    ['writing', 'Blog app'],
    ['photography', 'Photo app'],
    ['games', 'Game app'],
    ['social', 'Social app'],
    ['dev', 'Dev app'],
    ['audio', 'Audio app'],
    ['events', 'Event app'],
    ['utils', 'Util app'],
  ])('filters %s locally without refetching', (key, title) => {
    setQuery({data})
    render(<AtmosphereAppsTab />)

    fireEvent.press(screen.getByTestId(`pill-${key}`))

    expect(screen.getByTestId('selectedTab').props.children).toBe(key)
    expect(mockProgress.get()).toBe(populatedKeys.indexOf(key))
    expect(screen.getByText(title)).toBeTruthy()
    expect(screen.queryByText('Unknown app')).toBeNull()
    expect(screen.queryByText('Missing app')).toBeNull()
    expect(screen.getAllByText(/ app$/)).toHaveLength(1)
    expect(refetch).not.toHaveBeenCalled()
  })

  it('shows only All and populated categories, in order', () => {
    setQuery({data})
    render(<AtmosphereAppsTab />)

    expect(pillKeys()).toEqual(populatedKeys)
    for (const label of ['Social', 'Dev', 'Audio', 'Events', 'Utils']) {
      expect(screen.getByText(label)).toBeTruthy()
    }
    /* Video has only an invalid app and Feeds none that render. */
    expect(screen.queryByText('Video')).toBeNull()
    expect(screen.queryByText('Feeds')).toBeNull()
  })

  it('keeps All and the empty message for an empty response', () => {
    setQuery({data: {apps: []}})
    render(<AtmosphereAppsTab />)

    expect(pillKeys()).toEqual(['all'])
    expect(screen.getByText('No apps in this category yet.')).toBeTruthy()
  })

  it('returns to All when a refresh removes the selected category', () => {
    setQuery({data})
    const {rerender} = render(<AtmosphereAppsTab />)
    fireEvent.press(screen.getByTestId('pill-dev'))
    expect(screen.getByTestId('selectedTab').props.children).toBe('dev')

    setQuery({data: {apps: data.apps.filter(app => app.category !== 'dev')}})
    rerender(<AtmosphereAppsTab />)

    expect(screen.getByTestId('selectedTab').props.children).toBe('all')
    expect(mockProgress.get()).toBe(0)
    expect(screen.getByText('Blog app')).toBeTruthy()
    expect(screen.getByText('Unknown app')).toBeTruthy()
    expect(screen.queryByTestId('pill-dev')).toBeNull()
  })

  it('moves the indicator when a refresh removes a category before the selected one', () => {
    setQuery({data})
    const {rerender} = render(<AtmosphereAppsTab />)
    fireEvent.press(screen.getByTestId('pill-dev'))
    expect(mockProgress.get()).toBe(5)

    setQuery({
      data: {apps: data.apps.filter(app => app.category !== 'photography')},
    })
    rerender(<AtmosphereAppsTab />)

    expect(screen.getByTestId('selectedTab').props.children).toBe('dev')
    expect(mockProgress.get()).toBe(4)
    expect(screen.getByText('Dev app')).toBeTruthy()
    expect(refetch).not.toHaveBeenCalled()
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
  ])('shows the spinner only for a pull while %s', async (_name, result) => {
    const refresh = createDeferrable()
    refetch.mockReturnValueOnce(refresh.complete)
    setQuery({...result, isRefetching: true})
    render(<AtmosphereAppsTab />)

    expect(getRefreshControlProps().refreshing).toBe(false)
    act(() => {
      void getRefreshControlProps().onRefresh?.()
    })
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(getRefreshControlProps().refreshing).toBe(true)

    await act(async () => {
      refresh.resolve()
      await refresh.complete
    })
    expect(getRefreshControlProps().refreshing).toBe(false)
  })
})
