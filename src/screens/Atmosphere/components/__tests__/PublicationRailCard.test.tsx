import {Children} from 'react'
import {View} from 'react-native'
import {render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {PublicationRailCard} from '../PublicationRailCard'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/alf', () => {
  const atoms = new Proxy({}, {get: () => ({})})
  return {
    atoms,
    web: () => undefined,
    extractPadding:
      jest.requireActual<typeof import('#/alf/util/flatten')>(
        '#/alf/util/flatten',
      ).extractPadding,
    utils: {alpha: (color: string) => color},
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
jest.mock('#/components/AvatarStack', () => ({AvatarStack: () => null}))
jest.mock('#/components/MediaInsetBorder', () => ({
  MediaInsetBorder: () => null,
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/components/atmosphere/SiteStandard/StandardSiteMetaRow', () => ({
  StandardSiteMetaRow: () => null,
}))
jest.mock('../AtmosphereCardMenu', () => ({
  AtmosphereCardMenu: () => null,
}))
jest.mock('#/components/Button', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ButtonText: ({children}: {children: React.ReactNode}) => (
      <Text>{children}</Text>
    ),
  }
})
jest.mock('#/components/icons/Arrow', () => ({
  ArrowTopRight_Stroke2_Corner0_Rounded: () => null,
}))

/*
 * A stand-in for Link that keeps the props under test on a single host
 * element, and renders its children whether they're nodes or a render prop.
 */
jest.mock('#/components/Link', () => {
  const {Pressable: HostPressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Link: ({
      children,
      label,
      to,
    }: {
      children:
        React.ReactNode | ((state: {pressed: boolean}) => React.ReactNode)
      label: string
      to: string
    }) => (
      <HostPressable
        testID="link"
        accessibilityRole="link"
        accessibilityLabel={label}
        accessibilityHint=""
        accessibilityValue={{text: to}}>
        {typeof children === 'function' ? children({pressed: false}) : children}
      </HostPressable>
    ),
  }
})

const publication: app.bsky.embed.external.ViewArticlePublication = {
  uri: 'https://example.com/pub',
  title: 'Test publication',
  description: 'A description',
  logo: 'https://example.com/logo.png',
  theme: {
    accent: '#123456',
    accentForeground: '#ffffff',
  },
}

function renderCard(view = publication) {
  return render(<PublicationRailCard publication={view} width={220} />)
}

describe('PublicationRailCard', () => {
  it('links its name and its button to the publication', () => {
    renderCard()

    expect(
      screen.getAllByRole('link').map(link => link.props.accessibilityValue),
    ).toEqual([
      {text: 'https://example.com/pub'},
      {text: 'https://example.com/pub'},
    ])
    expect(screen.getByTestId('logo').props.children).toBe(
      'https://example.com/logo.png',
    )
    expect(screen.getByText('Test publication')).toBeTruthy()
    expect(screen.getByText('A description')).toBeTruthy()
  })

  it('names the app it is published with on the button, when known', () => {
    renderCard({...publication, providerId: 'leaflet.pub'})
    // The translation mock leaves placeholders as is
    expect(screen.getByText(/^View on /)).toBeTruthy()
  })

  it('falls back to a generic button label for an unknown app', () => {
    renderCard()
    expect(screen.getByText('View publication')).toBeTruthy()
  })

  it('does not render a raw text node for an empty description', () => {
    renderCard({...publication, description: ''})

    /*
     * Inspect the supplied children: the native test renderer can drop empty
     * strings from its output, while React Native Web checks props directly.
     */
    const rawTextNodes = screen
      .UNSAFE_getAllByType(View)
      .flatMap(view => Children.toArray(view.props.children))
      .filter(child => typeof child === 'string' || typeof child === 'number')
    expect(rawTextNodes).toEqual([])
  })

  it('falls back to an initial when there is no logo or theme', () => {
    renderCard({...publication, logo: undefined, theme: undefined})

    expect(screen.queryByTestId('logo')).toBeNull()
    expect(screen.getByText('T')).toBeTruthy()
  })
})
