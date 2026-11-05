import {StyleSheet, type ViewProps} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
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

const mockTriggerOnFocus = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: jest.fn()}),
}))
jest.mock('#/lib/hooks/useOpenLink', () => ({useOpenLink: () => jest.fn()}))
jest.mock('#/components/Button', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      label,
      tabIndex,
      onFocus,
      testID,
      children,
    }: {
      label: string
      tabIndex?: number
      onFocus?: () => void
      testID?: string
      children: React.ReactNode
    }) => (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        tabIndex={tabIndex as never}
        onFocus={onFocus}>
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
    children: (state: {props: {onFocus: () => void}}) => React.ReactNode
  }) => children({props: {onFocus: mockTriggerOnFocus}}),
  Outer: () => null,
}))
jest.mock('#/components/moderation/ReportDialog', () => ({
  getAssociatedReportSubjects: () => [],
  useCopyForSubject: () => ({title: '', subtitle: ''}),
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

const triggerCards: [
  string,
  (focus?: ExploreGalleryFocusProps) => React.ReactElement,
][] = [
  ['PhotoCard', focus => <PhotoCard photo={photo} galleryFocus={focus} />],
  [
    'LivestreamCard',
    focus => <LivestreamCard livestream={livestream} galleryFocus={focus} />,
  ],
]

const cards: [
  string,
  (focus?: ExploreGalleryFocusProps) => React.ReactElement,
][] = [
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

describe.each(triggerCards)('%s menu trigger', (_name, renderCard) => {
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
    expect(screen.getByTestId('link').props.tabIndex).toBe(0)

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

  it('sits top-right, outside the link and any pointer-disabled ancestor', () => {
    render(renderCard())

    const link = screen.getByTestId('link')
    let wrapperStyle: ViewProps['style']
    let node = getTrigger().parent
    while (node) {
      expect(node).not.toBe(link)
      const style = StyleSheet.flatten((node.props as ViewProps).style)
      expect(style?.pointerEvents).not.toBe('none')
      if (style?.position === 'absolute') wrapperStyle ??= style
      node = node.parent
    }
    expect(wrapperStyle).toMatchObject({position: 'absolute', top: 8, right: 8})
  })
})
