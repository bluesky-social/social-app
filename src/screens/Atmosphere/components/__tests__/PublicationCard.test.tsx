import {fireEvent, render, screen} from '@testing-library/react-native'

import {type AtmospherePublicationCardData} from '#/screens/Atmosphere/data/exploreData'
import {PublicationCard} from '../PublicationCard'

const mockBreakpoints = {gtPhone: true}

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/alf', () => {
  const atoms = new Proxy({}, {get: () => ({})})
  return {
    atoms,
    web: () => undefined,
    utils: jest.requireActual<typeof import('#/alf/util/colorGeneration')>(
      '#/alf/util/colorGeneration',
    ),
    useBreakpoints: () => mockBreakpoints,
    useTheme: () => ({
      atoms: new Proxy(
        {},
        {get: (_, name) => ({color: `theme-${String(name)}`})},
      ),
    }),
  }
})
jest.mock('#/env', () => ({IS_NATIVE: false}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({metric: jest.fn()})}))
jest.mock('#/lib/haptics', () => ({
  useHaptics: () => ({tap: jest.fn(), longPress: jest.fn()}),
}))
jest.mock('#/lib/sharing', () => ({shareUrl: jest.fn()}))
jest.mock('#/view/com/util/UserAvatar', () => ({
  UserAvatar: ({avatar}: {avatar?: string}) => {
    const {Text} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <Text testID="logo">{avatar}</Text>
  },
}))
jest.mock('#/components/MediaInsetBorder', () => ({
  MediaInsetBorder: () => null,
}))
jest.mock('#/components/Divider', () => ({Divider: () => null}))
jest.mock('#/components/Button', () => ({
  ButtonIcon: () => null,
  ButtonText: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/components/icons/Arrow', () => ({
  ArrowTopRight_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Clock', () => ({
  Clock_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/community/StandardSite', () => ({
  StandardSite: () => null,
}))
jest.mock(
  '#/components/Post/Embed/StandardSiteEmbed/StandardSiteMetaRow',
  () => ({StandardSiteMetaRow: () => null}),
)
jest.mock(
  '#/components/Post/Embed/StandardSiteEmbed/StandardSiteThemeProvider',
  () => ({
    StandardSiteThemeProvider: ({children}: {children: React.ReactNode}) =>
      children,
  }),
)

/*
 * A stand-in for Link that keeps the props under test on a single host
 * element. The shared card and its subscribe button render through it.
 */
jest.mock('#/components/Link', () => {
  const {Pressable: HostPressable} =
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
      onFocus?: (e: unknown) => void
    }) => (
      <HostPressable
        testID={`link:${label}`}
        accessibilityRole="link"
        accessibilityLabel={label}
        accessibilityHint=""
        accessibilityValue={{text: to}}
        ref={ref as never}
        tabIndex={tabIndex as never}
        onFocus={onFocus}>
        {typeof children === 'function' ? null : children}
      </HostPressable>
    ),
  }
})

const publication: AtmospherePublicationCardData = {
  id: 'https://example.com/pub',
  title: 'Test publication',
  view: {
    uri: 'https://example.com/pub',
    title: 'Test publication',
    description: 'A description',
    source: {
      uri: 'https://example.com/pub',
      title: 'Test publication',
      icon: 'https://example.com/logo.png',
      theme: {
        accentRGB: {r: 18, g: 52, b: 86},
        accentForegroundRGB: {r: 255, g: 255, b: 255},
      },
    },
  },
}

function links() {
  return screen.getAllByRole('link')
}

function focusProps(tabIndex: 0 | -1 | undefined) {
  return {focusRef: jest.fn(), tabIndex, onFocus: jest.fn()}
}

beforeEach(() => {
  mockBreakpoints.gtPhone = true
})

describe.each([true, false])('PublicationCard (gtPhone: %s)', gtPhone => {
  beforeEach(() => {
    mockBreakpoints.gtPhone = gtPhone
  })

  it('renders the primary link and the call to action', () => {
    render(<PublicationCard publication={publication} width={320} />)

    expect(links()).toHaveLength(2)
    for (const link of links()) {
      expect(link.props.accessibilityValue).toEqual({
        text: 'https://example.com/pub',
      })
    }
    expect(screen.getByTestId('logo').props.children).toBe(
      'https://example.com/logo.png',
    )
    expect(screen.getByText('A description')).toBeTruthy()
  })

  it.each([0, -1, undefined] as const)(
    'gives both links tabIndex %s and only the primary link the ref',
    tabIndex => {
      const focus = focusProps(tabIndex)
      render(<PublicationCard publication={publication} galleryFocus={focus} />)

      for (const link of links()) {
        expect(link.props.tabIndex).toBe(tabIndex)
      }
      expect(focus.focusRef).toHaveBeenCalledTimes(1)
      expect(focus.focusRef).toHaveBeenCalledWith(expect.anything())
    },
  )

  it('composes focus on both links with the gallery callback', () => {
    const focus = focusProps(-1)
    render(<PublicationCard publication={publication} galleryFocus={focus} />)

    for (const link of links()) fireEvent(link, 'focus')

    expect(focus.onFocus).toHaveBeenCalledTimes(2)
  })

  it('renders without gallery focus props', () => {
    render(<PublicationCard publication={publication} />)

    for (const link of links()) {
      expect(link.props.tabIndex).toBeUndefined()
      expect(() => fireEvent(link, 'focus')).not.toThrow()
    }
  })

  it('falls back to an initial when there is no logo or theme', () => {
    const {source, ...view} = publication.view
    render(
      <PublicationCard
        publication={{
          ...publication,
          view: {
            ...view,
            source: {...source!, icon: undefined, theme: undefined},
          },
        }}
      />,
    )

    expect(screen.queryByTestId('logo')).toBeNull()
    expect(screen.getByText('T')).toBeTruthy()
    expect(links()).toHaveLength(2)
  })
})
