import {fireEvent, render, screen} from '@testing-library/react-native'

import {
  type AtmosphereArticleCardData,
  type AtmosphereLivestreamCardData,
  type AtmospherePhotoCardData,
} from '../../exploreData'
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
  const atoms = new Proxy({}, {get: () => ({})})
  return {
    atoms,
    useTheme: () => ({atoms, palette: new Proxy({}, {get: () => ''})}),
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
    }: {
      children: React.ReactNode
      label: string
      to: string
      ref?: React.Ref<unknown>
      tabIndex?: number
      onFocus?: () => void
    }) => (
      <Pressable
        testID="link"
        accessibilityRole="link"
        accessibilityLabel={label}
        accessibilityHint=""
        accessibilityValue={{text: to}}
        ref={ref as never}
        tabIndex={tabIndex as never}
        onFocus={onFocus}>
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
