import {render, screen} from '@testing-library/react-native'

import {type ItemFocusProps} from '#/components/Gallery'
import {type app} from '#/lexicons'
import {FeaturedArticles} from '../FeaturedArticles'
import {FeaturedLivestreams} from '../FeaturedLivestreams'
import {FeaturedPhotos} from '../FeaturedPhotos'
import {FeaturedPublications} from '../FeaturedPublications'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/env', () => ({
  IS_WEB: true,
  IS_ANDROID: false,
  IS_NATIVE: true,
  IS_WEB_SAFARI: false,
}))
jest.mock('#/state/a11y', () => ({
  useA11y: () => ({screenReaderEnabled: false}),
}))
jest.mock('#/view/shell/BlockDrawerGesture', () => ({
  BlockDrawerGesture: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  tokens: {space: {lg: 16}},
  web: () => undefined,
}))

jest.mock('../ExploreSectionHeader', () => {
  const {Text: MockText} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ExploreSectionHeader: ({title}: {title: string}) => (
      <MockText accessibilityRole="header">{title}</MockText>
    ),
  }
})

/*
 * The cards expose the props the sections hand them, and a focus target that
 * is wired up the way the real cards wire their Link.
 */
function mockCard(prefix: string, prop: string) {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return ({
    galleryFocus,
    ...rest
  }: Record<string, unknown> & {
    galleryFocus?: ItemFocusProps
  }) => {
    const item = rest[prop] as {uri: string; title: string}
    return (
      <Pressable
        testID={`${prefix}-${item.uri.split('/').at(-1)}`}
        accessibilityRole="link"
        accessibilityLabel={item.title}
        accessibilityHint=""
        ref={galleryFocus?.focusRef}
        tabIndex={galleryFocus?.tabIndex}
        onFocus={galleryFocus?.onFocus}
      />
    )
  }
}
jest.mock('#/components/atmosphere/SiteStandard/DocumentCompact', () => ({
  DocumentCompact: mockCard('article', 'view'),
}))
jest.mock('#/components/Divider', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Divider: () => <View testID="articleDivider" />,
  }
})
jest.mock('../LivestreamCard', () => ({
  LivestreamCard: mockCard('livestream', 'livestream'),
}))
jest.mock('#/components/atmosphere/SiteStandard/Publication', () => ({
  PublicationCard: mockCard('publication', 'view'),
}))
jest.mock('../PhotoCard', () => ({PhotoCard: mockCard('photo', 'photo')}))

const articles: app.bsky.embed.external.ViewArticle[] = [
  {uri: 'https://example.com/a1', title: 'First article', description: ''},
  {uri: 'https://example.com/a2', title: 'Second article', description: ''},
]
const livestreams: app.bsky.embed.external.ViewLivestream[] = [
  {
    uri: 'https://example.com/l1',
    title: 'First stream',
    description: '',
    active: true,
  },
  {
    uri: 'https://example.com/l2',
    title: 'Second stream',
    description: '',
    active: false,
  },
]
const photos: app.bsky.embed.external.ViewGallery[] = [
  {
    uri: 'https://example.com/p1',
    title: 'First photo',
    description: '',
    items: [],
  },
  {
    uri: 'https://example.com/p2',
    title: 'Second photo',
    description: '',
    items: [],
  },
]

const publications: app.bsky.embed.external.ViewArticlePublication[] = [
  {uri: 'https://example.com/u1', title: 'First publication', description: ''},
  {uri: 'https://example.com/u2', title: 'Second publication', description: ''},
]

function slides() {
  return screen.UNSAFE_root.findAll(
    node =>
      typeof node.type === 'string' &&
      node.props['aria-roledescription'] === 'slide',
  )
}

describe('FeaturedArticles', () => {
  it('renders compact documents in response order with dividers only between rows', () => {
    render(<FeaturedArticles articles={articles} />)

    expect(screen.getByText('Featured articles')).toBeTruthy()
    expect(screen.getByTestId('atmosphereArticlesList')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereArticlesGallery')).toBeNull()
    expect(slides()).toHaveLength(0)
    expect(
      screen
        .getAllByTestId(/^(article-|articleDivider$)/)
        .map(row => row.props.testID),
    ).toEqual(['article-a1', 'articleDivider', 'article-a2'])
    expect(screen.getByTestId('article-a1').props.tabIndex).toBeUndefined()
  })

  it('renders nothing, including the header, without articles', () => {
    render(<FeaturedArticles articles={[]} />)

    expect(screen.queryByText('Featured articles')).toBeNull()
    expect(screen.queryByTestId('atmosphereArticlesList')).toBeNull()
    expect(screen.queryByTestId('articleDivider')).toBeNull()
  })
})

describe('FeaturedLivestreams', () => {
  it('renders the header and one slide per livestream in a labelled gallery', () => {
    render(<FeaturedLivestreams livestreams={livestreams} />)

    expect(screen.getByText('Featured livestreams')).toBeTruthy()
    expect(screen.getByTestId('atmosphereLivestreamsGallery')).toBeTruthy()
    expect(slides().map(slide => slide.props['aria-label'])).toEqual([
      'First stream',
      'Second stream',
    ])
  })

  it('wires the gallery focus target to each card', () => {
    render(<FeaturedLivestreams livestreams={livestreams} />)

    expect(screen.getByTestId('livestream-l1').props.tabIndex).toBe(0)
    expect(screen.getByTestId('livestream-l2').props.tabIndex).toBe(-1)
  })

  it('renders nothing, including the header, without livestreams', () => {
    render(<FeaturedLivestreams livestreams={[]} />)

    expect(screen.queryByText('Featured livestreams')).toBeNull()
    expect(screen.queryByTestId('atmosphereLivestreamsGallery')).toBeNull()
  })
})

describe('FeaturedPhotos', () => {
  it('renders the header and one slide per photo in a labelled gallery', () => {
    render(<FeaturedPhotos photos={photos} />)

    expect(screen.getByText('Featured photos')).toBeTruthy()
    expect(screen.getByTestId('atmospherePhotosGallery')).toBeTruthy()
    expect(slides().map(slide => slide.props['aria-label'])).toEqual([
      'First photo',
      'Second photo',
    ])
  })

  it('wires the gallery focus target to each card', () => {
    render(<FeaturedPhotos photos={photos} />)

    expect(screen.getByTestId('photo-p1').props.tabIndex).toBe(0)
    expect(screen.getByTestId('photo-p2').props.tabIndex).toBe(-1)
  })

  it('renders nothing, including the header, without photos', () => {
    render(<FeaturedPhotos photos={[]} />)

    expect(screen.queryByText('Featured photos')).toBeNull()
    expect(screen.queryByTestId('atmospherePhotosGallery')).toBeNull()
  })
})

describe('FeaturedPublications', () => {
  it('renders publications as links without gallery focus', () => {
    render(<FeaturedPublications publications={publications} />)

    expect(screen.getByText('Featured publications')).toBeTruthy()
    expect(screen.queryByTestId('atmospherePublicationsGallery')).toBeNull()
    expect(slides()).toHaveLength(0)
    expect(screen.getAllByRole('link').map(link => link.props.testID)).toEqual([
      'publication-u1',
      'publication-u2',
    ])
    for (const publication of publications) {
      const testID = `publication-${publication.uri.split('/').at(-1)}`
      expect(screen.getByTestId(testID).props.tabIndex).toBeUndefined()
    }
  })

  it('renders nothing, including the header, without publications', () => {
    render(<FeaturedPublications publications={[]} />)

    expect(screen.queryByText('Featured publications')).toBeNull()
    expect(screen.queryByTestId('atmospherePublicationsGallery')).toBeNull()
  })
})
