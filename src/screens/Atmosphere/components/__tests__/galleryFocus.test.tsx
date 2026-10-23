import {StyleSheet} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {
  type AtmosphereArticleCardData,
  type AtmosphereLivestreamCardData,
  type AtmospherePhotoCardData,
} from '#/screens/Atmosphere/data/exploreData'
import {ArticleCard} from '../ArticleCard'
import {type ExploreGalleryFocusProps} from '../ExploreGallery'
import {LivestreamCard} from '../LivestreamCard'
import {PhotoCard} from '../PhotoCard'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (value: {message: string}) => value.message,
    i18n: {number: String},
  }),
}))
jest.mock('#/alf', () => {
  const atoms = new Proxy(
    {},
    {get: (_, name) => (name === 'flex_grow' ? {flexGrow: 1} : {})},
  )
  const themeAtoms = new Proxy(
    {
      bg: {backgroundColor: '#ffffff'},
      bg_contrast_25: {backgroundColor: '#f8f8f8'},
      border_contrast_low: {borderColor: '#dddddd'},
      border_contrast_high: {borderColor: '#555555'},
    },
    {get: (target, name) => target[name as keyof typeof target] ?? {}},
  )
  return {
    atoms,
    web: (props: Record<string, unknown>) => props,
    useTheme: () => ({
      atoms: themeAtoms,
      palette: new Proxy({}, {get: () => ''}),
    }),
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('expo-image', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Image: View}
})
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => undefined,
}))
jest.mock('#/view/com/util/UserAvatar', () => ({UserAvatar: () => null}))
jest.mock('#/view/com/util/numeric/format', () => ({formatCount: String}))
jest.mock('#/components/icons/Heart2', () => ({
  Heart2_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Eye', () => ({
  Eye_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Play', () => ({
  Play_Filled_Corner2_Rounded: () => null,
}))

/*
 * The real Link is the only interactive element in each card. This stand-in
 * keeps the props the cards give it and renders them on a single host element.
 */
jest.mock('#/components/Link', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Link: ({
      children,
      label,
      to,
      ref,
      tabIndex,
      onFocus,
      onBlur,
      onMouseEnter,
      onMouseLeave,
      style,
    }: {
      children: React.ReactNode
      label: string
      to: string
      ref?: React.Ref<unknown>
      tabIndex?: number
      onFocus?: () => void
      onBlur?: () => void
      onMouseEnter?: () => void
      onMouseLeave?: () => void
      style?: React.ComponentProps<typeof Pressable>['style']
    }) => (
      <Pressable
        testID="link"
        accessibilityRole="link"
        accessibilityLabel={label}
        accessibilityHint=""
        accessibilityValue={{text: to}}
        ref={ref as never}
        tabIndex={tabIndex as never}
        {...{onMouseEnter, onMouseLeave}}
        onFocus={onFocus}
        onBlur={onBlur}
        style={style}>
        {children}
      </Pressable>
    ),
  }
})

const authorProfile = {
  did: 'did:plc:author',
  handle: 'author.test',
  displayName: 'Author',
} as AtmospherePhotoCardData['authorProfile']

const article: AtmosphereArticleCardData = {
  id: 'article',
  href: '/article',
  title: 'An article',
}
const livestream: AtmosphereLivestreamCardData = {
  id: 'livestream',
  href: '/livestream',
  title: 'A livestream',
  active: false,
  authorProfile,
}
const photo: AtmospherePhotoCardData = {
  id: 'photo',
  href: '/photo',
  title: 'A photo',
  image: 'https://example.com/photo.jpg',
  likeCount: 0,
  authorProfile,
}

const cards: [
  string,
  (focus?: ExploreGalleryFocusProps) => React.ReactElement,
][] = [
  [
    'ArticleCard',
    focus => <ArticleCard article={article} galleryFocus={focus} />,
  ],
  [
    'LivestreamCard',
    focus => <LivestreamCard livestream={livestream} galleryFocus={focus} />,
  ],
  ['PhotoCard', focus => <PhotoCard photo={photo} galleryFocus={focus} />],
]

describe.each(cards)('%s gallery focus', (_name, renderCard) => {
  it('lets the card root fill a stretched slide', () => {
    render(renderCard())
    expect(StyleSheet.flatten(screen.root.props.style)).toMatchObject({
      flexGrow: 1,
    })
  })

  it('attaches the focus props to its single Link', () => {
    const galleryFocus = {
      focusRef: jest.fn(),
      tabIndex: 0 as const,
      onFocus: jest.fn(),
    }
    render(renderCard(galleryFocus))

    const link = screen.getByTestId('link')
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(galleryFocus.focusRef).toHaveBeenCalledWith(expect.anything())
    expect(link.props.tabIndex).toBe(0)

    fireEvent(link, 'focus')
    expect(galleryFocus.onFocus).toHaveBeenCalledTimes(1)
  })

  it('passes a roving tabIndex of -1 through', () => {
    render(renderCard({focusRef: jest.fn(), tabIndex: -1, onFocus: jest.fn()}))

    expect(screen.getByTestId('link').props.tabIndex).toBe(-1)
  })

  it('renders as before without gallery focus props', () => {
    render(renderCard())

    const link = screen.getByTestId('link')
    expect(link.props.tabIndex).toBeUndefined()
    expect(() => fireEvent(link, 'focus')).not.toThrow()
    expect(link.props.accessibilityLabel).toMatch(/^Open/)
  })
})

const interactions = [
  ['hover', 'mouseEnter', 'mouseLeave'],
  ['focus', 'focus', 'blur'],
]

it.each(interactions)(
  'highlights the article background and border on %s',
  (_name, enter, leave) => {
    render(<ArticleCard article={article} />)
    const link = screen.getByTestId('link')
    const card = screen.root

    expect(card).toHaveStyle({
      backgroundColor: '#ffffff',
      borderColor: '#dddddd',
    })
    fireEvent(link, enter)
    expect(card).toHaveStyle({
      backgroundColor: '#f8f8f8',
      borderColor: '#555555',
    })
    fireEvent(link, leave)
    expect(card).toHaveStyle({
      backgroundColor: '#ffffff',
      borderColor: '#dddddd',
    })
  },
)

it.each(interactions)(
  'dims the photo image on %s without intercepting interactions',
  (_name, enter, leave) => {
    render(<PhotoCard photo={photo} />)
    const link = screen.getByTestId('link')

    expect(screen.queryByTestId('atmospherePhotoHoverOverlay')).toBeNull()
    fireEvent(link, enter)
    const overlay = screen.getByTestId('atmospherePhotoHoverOverlay')
    expect(overlay).toHaveStyle({backgroundColor: 'rgba(0, 0, 0, 0.1)'})
    expect(overlay.props.pointerEvents).toBe('none')
    expect(overlay.props.accessible).toBe(false)
    expect(screen.getByText(photo.title)).toBeTruthy()

    fireEvent(link, leave)
    expect(screen.queryByTestId('atmospherePhotoHoverOverlay')).toBeNull()
  },
)
