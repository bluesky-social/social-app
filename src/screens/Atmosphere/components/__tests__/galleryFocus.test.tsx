import {fireEvent, render, screen, within} from '@testing-library/react-native'

import {type ItemFocusProps} from '#/components/Gallery'
import {type app} from '#/lexicons'
import {LivestreamCard} from '../LivestreamCard'
import {PhotoCard} from '../PhotoCard'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (value: {message: string}) => value.message,
    i18n: {number: String},
  }),
}))
jest.mock('#/alf', () => {
  const knownAtoms = {
    flex_grow: {flexGrow: 1},
    absolute: {position: 'absolute'},
    z_10: {zIndex: 10},
  }
  const atoms = new Proxy(knownAtoms, {
    get: (target, name) => target[name as keyof typeof target] ?? {},
  })
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
jest.mock('#/view/com/util/numeric/format', () => ({
  formatCount: (_i18n: unknown, count: number) => String(count),
}))
jest.mock('#/components/icons/Heart2', () => ({
  Heart2_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Image', () => ({
  Image_Stroke2_Corner2_Rounded: () => null,
}))
jest.mock('#/components/icons/Eye', () => ({
  Eye_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Play', () => ({
  Play_Filled_Corner2_Rounded: () => null,
}))

const mockTriggerOnFocus = jest.fn()
const mockTriggerOnPress = jest.fn()
const mockOpenLink = jest.fn()
const mockNavigate = jest.fn()
const mockOpenPhotoDialog = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}))
jest.mock('#/lib/hooks/useOpenLink', () => ({useOpenLink: () => mockOpenLink}))
jest.mock('#/lib/hooks/useOpenComposer', () => ({
  useOpenComposer: () => ({openComposer: jest.fn()}),
}))
jest.mock('#/lib/sharing', () => ({shareUrl: jest.fn()}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))
jest.mock('#/state/session', () => ({
  useSession: () => ({hasSession: false}),
  useRequireAuth: () => jest.fn(),
}))
jest.mock('#/ageAssurance', () => ({
  useAgeAssurance: () => ({Access: {Full: 'full'}, state: {access: 'full'}}),
}))
jest.mock('#/components/Dialog', () => ({
  useDialogControl: () => ({open: mockOpenPhotoDialog}),
}))
/* The dialog's own content is covered in PhotoDialog.test.tsx. */
jest.mock('../PhotoDialog', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    PhotoDialog: ({
      photo,
      author,
    }: {
      photo: {title: string}
      author: {handle: string}
    }) => (
      <View
        testID="photoDialogStub"
        accessibilityLabel={`${photo.title} by ${author.handle}`}
        accessibilityHint=""
      />
    ),
  }
})
jest.mock('#/components/dms/dialogs/ShareViaChatDialog', () => ({
  SendViaChatDialog: () => null,
}))
jest.mock('#/components/Button', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      label,
      accessibilityHint,
      ref,
      tabIndex,
      onFocus,
      onBlur,
      onPress,
      onHoverIn,
      onHoverOut,
      testID,
      style,
      children,
    }: {
      label: string
      accessibilityHint?: string
      ref?: React.Ref<unknown>
      tabIndex?: number
      onFocus?: () => void
      onBlur?: () => void
      onPress?: () => void
      onHoverIn?: () => void
      onHoverOut?: () => void
      testID?: string
      style?: React.ComponentProps<typeof Pressable>['style']
      children: React.ReactNode
    }) => (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint ?? ''}
        ref={ref as never}
        tabIndex={tabIndex as never}
        onFocus={onFocus}
        onBlur={onBlur}
        onPress={onPress}
        {...{onHoverIn, onHoverOut}}
        style={style}>
        {children}
      </Pressable>
    ),
    ButtonIcon: () => null,
  }
})
jest.mock('#/components/Menu', () => ({
  Root: ({children}: {children: React.ReactNode}) => children,
  Trigger: ({
    children,
  }: {
    children: (state: {
      props: {onFocus: () => void; onPress: () => void}
    }) => React.ReactNode
  }) =>
    children({
      props: {onFocus: mockTriggerOnFocus, onPress: mockTriggerOnPress},
    }),
  Outer: () => null,
}))
jest.mock('#/components/moderation/ReportDialog', () => ({
  getAssociatedReportSubjects: () => [],
  useGetCopyForSubject: () => () => ({title: '', subtitle: ''}),
  useGlobalReportDialogControl: () => ({open: jest.fn()}),
}))
jest.mock('#/components/icons/DotGrid', () => ({
  DotGrid3x1_Stroke2_Corner0_Rounded: () => null,
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
        onPress={() => mockOpenLink(to)}
        {...{onMouseEnter, onMouseLeave}}
        onFocus={onFocus}
        onBlur={onBlur}
        style={style}>
        {children}
      </Pressable>
    ),
  }
})

const authorProfile: app.bsky.actor.defs.ProfileViewBasic = {
  did: 'did:plc:6ayddqghxhciedbaofoxkcbs',
  handle: 'author.test',
  displayName: 'Author',
}

const livestream: app.bsky.embed.external.ViewLivestream = {
  uri: 'https://example.com/livestream',
  description: '',
  title: 'A livestream',
  active: false,
  associatedProfiles: [authorProfile],
}
const photo: app.bsky.embed.external.ViewGallery = {
  uri: 'https://example.com/photo',
  description: '',
  title: 'A photo',
  items: [
    {
      $type: 'app.bsky.embed.external#viewGalleryImage',
      thumbnail: 'https://example.com/photo.jpg',
      fullsize: 'https://example.com/photo-fullsize.jpg',
    },
  ],
  likeCount: 0,
  associatedProfiles: [authorProfile],
}

type CardCase = [
  name: string,
  renderCard: (focus?: ItemFocusProps) => React.ReactElement,
  /** testID of the card's primary control, which owns the gallery focus. */
  primaryTestID: string,
  labelPattern: RegExp,
  /** The spy the card's primary control is expected to trigger. */
  primaryEffect: jest.Mock,
]

/* LivestreamCard's primary control is still a Link, PhotoCard's is a Button. */
const cards: CardCase[] = [
  [
    'LivestreamCard',
    focus => <LivestreamCard livestream={livestream} galleryFocus={focus} />,
    'link',
    /^Open/,
    mockOpenLink,
  ],
  [
    'PhotoCard',
    focus => <PhotoCard photo={photo} galleryFocus={focus} />,
    'atmospherePhotoCard',
    /^View photos in/,
    mockOpenPhotoDialog,
  ],
]

beforeEach(() => {
  jest.clearAllMocks()
})

describe.each(cards)(
  '%s gallery focus',
  (_name, renderCard, primary, label) => {
    it('attaches the focus props to its single primary control', () => {
      const galleryFocus = {
        focusRef: jest.fn(),
        tabIndex: 0 as const,
        onFocus: jest.fn(),
      }
      render(renderCard(galleryFocus))

      const link = screen.getByTestId(primary)
      expect(galleryFocus.focusRef).toHaveBeenCalledWith(expect.anything())
      expect(link.props.tabIndex).toBe(0)

      fireEvent(link, 'focus')
      expect(galleryFocus.onFocus).toHaveBeenCalledTimes(1)
    })

    it('passes a roving tabIndex of -1 through', () => {
      render(
        renderCard({focusRef: jest.fn(), tabIndex: -1, onFocus: jest.fn()}),
      )

      expect(screen.getByTestId(primary).props.tabIndex).toBe(-1)
    })

    it('renders as before without gallery focus props', () => {
      render(renderCard())

      const link = screen.getByTestId(primary)
      expect(link.props.tabIndex).toBeUndefined()
      expect(() => fireEvent(link, 'focus')).not.toThrow()
      expect(link.props.accessibilityLabel).toMatch(label)
    })
  },
)

describe('PhotoCard counts', () => {
  it.each([
    [42, '42'],
    [undefined, '1'],
    [0, '0'],
  ] as const)('shows photo count %s beside likes', (photoCount, expected) => {
    render(<PhotoCard photo={{...photo, likeCount: 7, photoCount}} />)

    expect(screen.getByTestId('atmospherePhotoCardLikes')).toHaveTextContent(
      /^7$/,
    )
    expect(screen.getByTestId('atmospherePhotoCardPhotos')).toHaveTextContent(
      new RegExp(`^${expected}$`),
    )
  })
})

describe('PhotoCard activation', () => {
  it('opens the photo dialog instead of the external url', () => {
    render(<PhotoCard photo={photo} />)

    expect(screen.queryAllByRole('link')).toHaveLength(0)
    fireEvent.press(screen.getByTestId('atmospherePhotoCard'))

    expect(mockOpenPhotoDialog).toHaveBeenCalledTimes(1)
    expect(mockOpenLink).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getByLabelText('A photo by author.test')).toBeTruthy()
  })
})

const interactions = [
  ['hover', 'hoverIn', 'hoverOut'],
  ['focus', 'focus', 'blur'],
]

it.each(interactions)(
  'dims the photo image on %s without intercepting interactions',
  (_name, enter, leave) => {
    render(<PhotoCard photo={photo} />)
    const link = screen.getByTestId('atmospherePhotoCard')

    expect(screen.queryByTestId('atmospherePhotoHoverOverlay')).toBeNull()
    fireEvent(link, enter)
    const overlay = screen.getByTestId('atmospherePhotoHoverOverlay')
    expect(overlay.props.pointerEvents).toBe('none')
    expect(overlay.props.accessible).toBe(false)
    expect(screen.getByText(photo.title)).toBeTruthy()

    fireEvent(link, leave)
    expect(screen.queryByTestId('atmospherePhotoHoverOverlay')).toBeNull()
  },
)

describe.each(cards)(
  '%s menu trigger',
  (_name, renderCard, primary, _label, primaryEffect) => {
    const getTrigger = () => screen.getByTestId('atmosphereCardMenuTrigger')

    it('mirrors the roving tabIndex but not the focus ref', () => {
      const galleryFocus = {
        focusRef: jest.fn(),
        tabIndex: 0 as const,
        onFocus: jest.fn(),
      }
      const {rerender} = render(renderCard(galleryFocus))

      expect(getTrigger().props.tabIndex).toBe(0)
      expect(galleryFocus.focusRef).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId(primary).props.tabIndex).toBe(0)

      rerender(renderCard({...galleryFocus, tabIndex: -1}))
      expect(getTrigger().props.tabIndex).toBe(-1)

      rerender(renderCard())
      expect(getTrigger().props.tabIndex).toBeUndefined()
    })

    it('calls both the menu and gallery focus callbacks', () => {
      mockTriggerOnFocus.mockClear()
      const galleryFocus = {
        focusRef: jest.fn(),
        tabIndex: 0 as const,
        onFocus: jest.fn(),
      }
      render(renderCard(galleryFocus))

      fireEvent(getTrigger(), 'focus')
      expect(mockTriggerOnFocus).toHaveBeenCalledTimes(1)
      expect(galleryFocus.onFocus).toHaveBeenCalledTimes(1)
    })

    it('does not throw on focus without gallery focus props', () => {
      render(renderCard())
      expect(() => fireEvent(getTrigger(), 'focus')).not.toThrow()
    })

    it('activates independently of the primary control', () => {
      render(renderCard())

      expect(
        within(screen.getByTestId(primary)).queryByTestId(
          'atmosphereCardMenuTrigger',
        ),
      ).toBeNull()

      fireEvent.press(getTrigger())
      expect(mockTriggerOnPress).toHaveBeenCalledTimes(1)
      expect(mockOpenPhotoDialog).not.toHaveBeenCalled()
      expect(mockOpenLink).not.toHaveBeenCalled()

      fireEvent.press(screen.getByTestId(primary))
      expect(primaryEffect).toHaveBeenCalledTimes(1)
      expect(mockTriggerOnPress).toHaveBeenCalledTimes(1)
    })
  },
)
