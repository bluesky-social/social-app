import {render, screen} from '@testing-library/react-native'

import {shareUrl} from '#/lib/sharing'
import {type app} from '#/lexicons'
import {Publication, PublicationCard} from './Publication'

let mockIsNative = false
let mockOnLongPress: (() => void) | undefined

const mockMenu = jest.fn<
  void,
  [{author?: object; offsetY?: number; offsetX?: number}]
>()

jest.mock('@lingui/react', () => {
  const {i18n} =
    jest.requireActual<typeof import('@lingui/core')>('@lingui/core')
  i18n.loadAndActivate({locale: 'en', messages: {}})
  return {useLingui: () => ({_: i18n._.bind(i18n), i18n})}
})
jest.mock('#/alf', () => ({
  atoms: new Proxy(
    {},
    {
      // Real card padding so caller overrides conflict with the default.
      get: (_, name) => (name === 'p_md' ? {padding: 12} : {}),
    },
  ),
  extractPadding:
    jest.requireActual<typeof import('#/alf/util/flatten')>(
      '#/alf/util/flatten',
    ).extractPadding,
  useTheme: () => ({atoms: new Proxy({}, {get: () => ({})})}),
  web: () => undefined,
}))
jest.mock('#/env', () => ({
  get IS_NATIVE() {
    return mockIsNative
  },
}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({metric: jest.fn()})}))
jest.mock('#/lib/haptics', () => ({
  useHaptics: () => ({tap: jest.fn(), longPress: jest.fn()}),
}))
jest.mock('#/lib/sharing', () => ({shareUrl: jest.fn()}))
jest.mock('#/components/Link', () => ({
  Link: ({
    children,
    onLongPress,
  }: {
    children: (state: {pressed: boolean}) => React.ReactNode
    onLongPress?: () => void
  }) => {
    mockOnLongPress = onLongPress
    const {View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <View testID="link">{children({pressed: false})}</View>
  },
}))
jest.mock('#/components/AvatarStack', () => ({
  AvatarStack: () => {
    const {View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <View testID="avatarStack" />
  },
}))
jest.mock('#/components/Typography', () => ({
  Text: ({children}: {children?: React.ReactNode}) => {
    const {Text: HostText} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return <HostText>{children}</HostText>
  },
}))
jest.mock('#/components/atmosphere/SiteStandard/PublicationIcon', () => ({
  PublicationIcon: () => null,
}))
jest.mock('#/components/atmosphere/SiteStandard/StandardSiteMetaRow', () => ({
  StandardSiteMetaRow: () => null,
}))
jest.mock('#/screens/Atmosphere/components/AtmosphereCardMenu', () => ({
  AtmosphereCardMenu: (props: {author?: object; offsetY?: number}) => {
    mockMenu(props)
    return null
  },
}))

const owner: app.bsky.actor.defs.ProfileViewBasic = {
  did: 'did:plc:ewvi7nxzyoun6zhxrhs64oiz',
  handle: 'owner.test',
}
const view = {
  uri: 'https://example.com',
  title: 'Title',
  description: 'Description',
} satisfies app.bsky.embed.external.ViewArticlePublication

const menuOffsets = () => {
  const {offsetY, offsetX} = mockMenu.mock.calls[0][0]
  return {offsetY, offsetX}
}

beforeEach(() => {
  jest.clearAllMocks()
  mockIsNative = false
  mockOnLongPress = undefined
})

describe('Publication', () => {
  it.each([Publication, PublicationCard])(
    'aligns the menu with the container padding (%p)',
    Component => {
      render(
        <Component
          view={view}
          containerStyle={{paddingTop: 8, paddingRight: 20, paddingLeft: 4}}
        />,
      )

      expect(menuOffsets()).toEqual({offsetY: 8, offsetX: 20})
    },
  )

  it('shows the subscriber avatars only when there are subscribers', () => {
    const {rerender} = render(<Publication view={view} />)
    expect(screen.queryByTestId('avatarStack')).toBeNull()

    rerender(<Publication view={{...view, subscribers: [owner]}} />)
    expect(screen.getByTestId('avatarStack')).toBeTruthy()
  })

  it.each([
    [1, '1 subscriber'],
    [2, '2 subscribers'],
    [12345, '12.3K subscribers'],
  ])('pluralizes the subscription count (%s)', (subscriptionCount, text) => {
    render(<Publication view={{...view, subscriptionCount}} />)

    expect(screen.getByText(text)).toBeTruthy()
  })

  it('omits the subscriber row when there are no subscriptions', () => {
    render(<Publication view={view} />)

    expect(screen.queryByText(/subscriber/)).toBeNull()
    expect(screen.queryByTestId('avatarStack')).toBeNull()
  })

  it('names the app the appview attributes the publication to', () => {
    render(<Publication view={{...view, providerId: 'leaflet.pub'}} />)

    expect(screen.getByText('Powered by Leaflet')).toBeTruthy()
  })

  it('names no app for an unknown provider', () => {
    render(<Publication view={{...view, providerId: 'example.app'}} />)

    expect(screen.queryByText(/Powered by/)).toBeNull()
  })

  it('hides the menu in preview', () => {
    render(<Publication view={view} preview />)

    expect(mockMenu).not.toHaveBeenCalled()
  })

  it('gives the menu the profile whose repo holds the publication record', () => {
    const other: app.bsky.actor.defs.ProfileViewBasic = {
      did: 'did:plc:other',
      handle: 'other.test',
    }
    render(
      <Publication
        view={{
          ...view,
          associatedProfiles: [other, owner],
          associatedRefs: [
            {
              uri: `at://${owner.did}/site.standard.publication/abc`,
              cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
            },
          ],
        }}
      />,
    )

    expect(mockMenu.mock.calls[0][0].author).toBe(owner)
  })
})

describe.each([Publication, PublicationCard])(
  'native sharing (%p)',
  Component => {
    it.each([true, false])(
      'supports an optional onShareCallback: %s',
      withCallback => {
        mockIsNative = true
        const onShare = jest.fn()
        const onPress = jest.fn()
        render(
          <Component
            view={view}
            onShareCallback={withCallback ? onShare : undefined}
            onPressCallback={onPress}
          />,
        )

        expect(mockOnLongPress).toEqual(expect.any(Function))
        mockOnLongPress?.()
        expect(shareUrl).toHaveBeenCalledWith(view.uri)
        expect(onShare).toHaveBeenCalledTimes(withCallback ? 1 : 0)
        expect(onPress).not.toHaveBeenCalled()
      },
    )
  },
)

describe('PublicationCard', () => {
  it('aligns the menu with its default padding', () => {
    render(<PublicationCard view={view} />)

    expect(menuOffsets()).toEqual({offsetY: 12, offsetX: 12})
  })

  it('aligns the menu with a caller padding override', () => {
    render(<PublicationCard view={view} containerStyle={{padding: 2}} />)

    expect(menuOffsets()).toEqual({offsetY: 2, offsetX: 2})
  })
})
