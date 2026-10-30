import {type RefreshControlProps} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {exploreResponseFixture} from '#/screens/Atmosphere/__tests__/fixtures/exploreResponse'
import {livestreamPreviewFixture} from '#/screens/Atmosphere/__tests__/fixtures/livestreamPreview'
import {type AtmosphereData} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {AtmosphereExploreTab} from '#/screens/Atmosphere/ExploreTab'
import {app} from '#/lexicons'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (message: {message?: string} | string) =>
      typeof message === 'string' ? message : (message.message ?? ''),
  }),
}))

jest.mock('#/screens/Atmosphere/data/useAtmosphereExploreQuery', () => ({
  useAtmosphereExploreQuery: jest.fn(),
}))

jest.mock('#/components/Layout', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Content: View}
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

jest.mock('#/screens/Atmosphere/components/AtmosphereNux', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {AtmosphereNux: () => <Text>nux</Text>}
})

jest.mock('#/screens/Atmosphere/components/AnnouncementBanner', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    AnnouncementBanner: ({banner}: {banner: {title: string}}) => (
      <Text>{`banner:${banner.title}`}</Text>
    ),
  }
})

function mockSection(name: string, prop: string) {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return ({[prop]: items}: Record<string, {title: string}[]>) =>
    items.length ? (
      <Text>{`${name}:${items.map(item => item.title).join(',')}`}</Text>
    ) : null
}

jest.mock('#/screens/Atmosphere/components/FeaturedArticles', () => ({
  FeaturedArticles: mockSection('articles', 'articles'),
}))
jest.mock('#/screens/Atmosphere/components/FeaturedPublications', () => ({
  FeaturedPublications: mockSection('publications', 'publications'),
}))
jest.mock('#/screens/Atmosphere/components/FeaturedApps', () => ({
  FeaturedApps: mockSection('apps', 'apps'),
}))
jest.mock('#/screens/Atmosphere/components/FeaturedLivestreams', () => ({
  FeaturedLivestreams: mockSection('livestreams', 'livestreams'),
}))
jest.mock('#/screens/Atmosphere/components/FeaturedPhotos', () => ({
  FeaturedPhotos: mockSection('photos', 'photos'),
}))

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

const data: AtmosphereData = {
  announcementBanner: {title: 'Launch', url: 'https://example.com/launch'},
  articles: {
    items: [
      {
        featured: true,
        view: {
          uri: 'https://example.com/article',
          title: 'Live article',
          description: '',
        },
      },
    ],
  },
  publications: {items: []},
  photos: {items: []},
  livestreams: {items: []},
  apps: [{id: 'app', title: 'Live app', url: 'https://example.com/app'}],
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AtmosphereExploreTab', () => {
  it('shows an accessible loader while the first request is pending', () => {
    setQuery({isPending: true})
    render(<AtmosphereExploreTab />)

    expect(screen.getByTestId('atmosphereExploreTab')).toBeTruthy()
    expect(screen.getByTestId('loader')).toBeTruthy()
    expect(screen.getByLabelText('Loading Atmosphere content')).toBeTruthy()
    expect(screen.queryByText('nux')).toBeNull()
  })

  it('shows a retryable error without raw error details on first load failure', () => {
    setQuery({isError: true, error: new Error('socket hang up')})
    render(<AtmosphereExploreTab />)

    expect(
      screen.getByText('Could not load Atmosphere content. Please try again.'),
    ).toBeTruthy()
    expect(screen.queryByText(/socket hang up/)).toBeNull()
    expect(screen.queryByTestId('loader')).toBeNull()

    fireEvent.press(screen.getByTestId('retry'))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders live content and hides empty sections without preview fallbacks', () => {
    setQuery({data})
    render(<AtmosphereExploreTab />)

    expect(screen.getByText('nux')).toBeTruthy()
    expect(screen.getByText('banner:Launch')).toBeTruthy()
    expect(screen.getByText('articles:Live article')).toBeTruthy()
    expect(screen.getByText('apps:Live app')).toBeTruthy()
    expect(screen.queryByText(/^livestreams:/)).toBeNull()
    expect(screen.queryByText(/^photos:/)).toBeNull()
    expect(
      screen.queryByText(livestreamPreviewFixture[0].view.title, {
        exact: false,
      }),
    ).toBeNull()
    expect(screen.queryByTestId('retry')).toBeNull()
  })

  it('renders nonfeatured recommendations in server order', () => {
    setQuery({
      data: {
        ...data,
        articles: {
          recIdStr: '18446744073709551615',
          items: ['Second', 'First'].map(title => ({
            featured: false,
            view: {uri: `https://example.com/${title}`, title, description: ''},
          })),
        },
      },
    })
    render(<AtmosphereExploreTab />)

    expect(screen.getByText('articles:Second,First')).toBeTruthy()
  })

  it('hides only articles when recommendations are empty', () => {
    const populated =
      app.bsky.unspecced.getAtmosphereExploreTab.$output.schema.parse({
        ...exploreResponseFixture,
        articles: {items: [], recIdStr: '18446744073709551615'},
        livestreams: {items: livestreamPreviewFixture},
      })
    setQuery({data: populated})
    render(<AtmosphereExploreTab />)

    expect(screen.queryByText(/^articles:/)).toBeNull()
    expect(screen.getByText(/^photos:/)).toBeTruthy()
    expect(screen.getByText(/^livestreams:/)).toBeTruthy()
    expect(screen.getByText(/^apps:/)).toBeTruthy()
    expect(screen.getByText(/^banner:/)).toBeTruthy()
  })

  it('renders publications from the response, even when articles are empty', () => {
    setQuery({
      data: {
        ...exploreResponseFixture,
        articles: {items: []},
        photos: {items: []},
        apps: [],
      },
    })
    render(<AtmosphereExploreTab />)

    expect(
      screen.getByText(
        `publications:${exploreResponseFixture.publications.items[0].view.title}`,
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/^articles:/)).toBeNull()
  })

  it('renders a publication-only response and hides empty publications', () => {
    setQuery({data: {...exploreResponseFixture, publications: {items: []}}})
    render(<AtmosphereExploreTab />)

    expect(screen.queryByText(/^publications:/)).toBeNull()
    expect(screen.getByText(/^articles:/)).toBeTruthy()
  })

  it('renders the NUX only for an empty response without a banner', () => {
    setQuery({
      data: {
        articles: {items: []},
        publications: {items: []},
        photos: {items: []},
        livestreams: {items: []},
        apps: [],
      },
    })
    render(<AtmosphereExploreTab />)

    expect(screen.getByText('nux')).toBeTruthy()
    expect(screen.queryByText(/^banner:/)).toBeNull()
    expect(
      screen.queryByText(/^(articles|publications|apps|photos|livestreams):/),
    ).toBeNull()
  })

  it('keeps cached content and offers retry when a background refetch fails', () => {
    setQuery({data, isError: true})
    render(<AtmosphereExploreTab />)

    expect(screen.getByText('articles:Live article')).toBeTruthy()
    expect(
      screen.getByText('Could not load Atmosphere content. Please try again.'),
    ).toBeTruthy()
    fireEvent.press(screen.getByTestId('retry'))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['loading', {isPending: true}],
    ['error', {isError: true}],
    ['loaded', {data}],
  ])('wires pull-to-refresh to the query while %s', (_name, result) => {
    setQuery({...result, isRefetching: true})
    render(<AtmosphereExploreTab />)

    const {refreshControl} = screen.getByTestId('atmosphereExploreTab')
      .props as {refreshControl: React.ReactElement<RefreshControlProps>}
    expect(refreshControl.props.refreshing).toBe(true)
    void refreshControl.props.onRefresh?.()
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
