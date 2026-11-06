import {Children} from 'react'
import {View} from 'react-native'
import {render, screen} from '@testing-library/react-native'

import {PublicationCard} from '#/components/atmosphere/SiteStandard/Publication'
import {type app} from '#/lexicons'
import {FeaturedPublications} from '../FeaturedPublications'

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
jest.mock('#/screens/Atmosphere/components/AtmosphereCardMenu', () => ({
  AtmosphereCardMenu: () => null,
}))

/*
 * A stand-in for Link that keeps the props under test on a single host
 * element and renders the card's render-prop children.
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
      children: (state: {pressed: boolean}) => React.ReactNode
      label: string
      to: string
    }) => (
      <HostPressable
        testID="link"
        accessibilityRole="link"
        accessibilityLabel={label}
        accessibilityHint=""
        accessibilityValue={{text: to}}>
        {children({pressed: false})}
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

describe('FeaturedPublications', () => {
  it('hands the original lexicon view to the card and links it to the publication', () => {
    render(<FeaturedPublications publications={[publication]} />)

    expect(screen.UNSAFE_getByType(PublicationCard).props.view).toBe(
      publication,
    )
    expect(screen.getByRole('link').props.accessibilityValue).toEqual({
      text: 'https://example.com/pub',
    })
    expect(screen.getByTestId('logo').props.children).toBe(
      'https://example.com/logo.png',
    )
    expect(screen.getByText('A description')).toBeTruthy()
  })

  it('does not render a raw text node for an empty description', () => {
    render(
      <FeaturedPublications
        publications={[{...publication, description: ''}]}
      />,
    )

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
    render(
      <FeaturedPublications
        publications={[{...publication, logo: undefined, theme: undefined}]}
      />,
    )

    expect(screen.queryByTestId('logo')).toBeNull()
    expect(screen.getByText('T')).toBeTruthy()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
