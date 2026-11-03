import {type StyleProp, StyleSheet, type ViewStyle} from 'react-native'
import {render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {type ExploreGalleryFocusProps} from '../ExploreGallery'
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
    width,
    galleryFocus,
    ...rest
  }: Record<string, unknown> & {
    width?: number
    galleryFocus?: ExploreGalleryFocusProps
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
        style={width ? {width} : undefined}
      />
    )
  }
}
jest.mock('../ArticleCard', () => ({
  ArticleCard: mockCard('article', 'article'),
}))
jest.mock('../LivestreamCard', () => ({
  LivestreamCard: mockCard('livestream', 'livestream'),
}))
jest.mock('../PublicationCard', () => ({
  PublicationCard: mockCard('publication', 'publication'),
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

function flat(style: unknown): ViewStyle {
  return StyleSheet.flatten(style as StyleProp<ViewStyle>) ?? {}
}

function width(testID: string) {
  return flat(screen.getByTestId(testID).props.style).width
}

describe('FeaturedArticles', () => {
  it('renders the header and one slide per article in a labelled gallery', () => {
    render(<FeaturedArticles articles={articles} />)

    expect(screen.getByText('Featured articles')).toBeTruthy()
    expect(screen.getByTestId('atmosphereArticlesGallery')).toBeTruthy()
    expect(slides().map(slide => slide.props['aria-label'])).toEqual([
      'First article',
      'Second article',
    ])
    expect(width('article-a1')).toBe(250)
    expect(width('article-a2')).toBe(250)
  })

  it('wires the gallery focus target to each card', () => {
    render(<FeaturedArticles articles={articles} />)

    expect(screen.getByTestId('article-a1').props.tabIndex).toBe(0)
    expect(screen.getByTestId('article-a2').props.tabIndex).toBe(-1)
    for (const slide of slides()) {
      expect(slide.props.tabIndex).toBeUndefined()
    }
  })

  it('renders nothing, including the header, without articles', () => {
    render(<FeaturedArticles articles={[]} />)

    expect(screen.queryByText('Featured articles')).toBeNull()
    expect(screen.queryByTestId('atmosphereArticlesGallery')).toBeNull()
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
    expect(width('livestream-l1')).toBe(214)
    expect(width('livestream-l2')).toBe(214)
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

  it('keeps the card inside a 225px wrapper', () => {
    render(<FeaturedPhotos photos={photos} />)

    for (const id of ['p1', 'p2']) {
      // The card itself is unsized; the nearest sized ancestor is the wrapper
      let node = screen.getByTestId(`photo-${id}`).parent
      while (node && flat(node.props.style).width == null) {
        node = node.parent
      }
      expect(flat(node?.props.style).width).toBe(225)
    }
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
  it('renders publications in a column without fixed card widths or gallery focus', () => {
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
      expect(width(testID)).toBeUndefined()
      expect(screen.getByTestId(testID).props.tabIndex).toBeUndefined()
    }
  })

  it('renders nothing, including the header, without publications', () => {
    render(<FeaturedPublications publications={[]} />)

    expect(screen.queryByText('Featured publications')).toBeNull()
    expect(screen.queryByTestId('atmospherePublicationsGallery')).toBeNull()
  })
})
