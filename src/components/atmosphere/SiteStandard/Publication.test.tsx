import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render as baseRender, screen} from '@testing-library/react-native'

import {shareUrl} from '#/lib/sharing'
import {type app} from '#/lexicons'
import {PublicationCard} from './Publication'

let mockIsNative = false
const mockLongPresses: (() => void)[] = []
const mockMenu = jest.fn<void, [{author?: object}]>()

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({atoms: new Proxy({}, {get: () => ({})})}),
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
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => ({}),
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({currentAccount: undefined}),
}))
jest.mock('#/screens/Atmosphere/ActivityTab/moderation', () => ({
  isActorHidden: () => false,
}))
jest.mock('#/components/atmosphere/likes', () => ({
  toSubscribableView: (view: {subscriptionCount?: number}) => ({
    likeCount: view.subscriptionCount,
  }),
  useAtmosphereLikeCount: (view: {likeCount?: number}) => view.likeCount ?? 0,
  useAtmosphereLike: () => ({canLike: false}),
}))
jest.mock('#/components/Link', () => {
  const MockLink = ({
    children,
    onLongPress,
  }: {
    children: React.ReactNode
    onLongPress?: () => void
  }) => {
    if (onLongPress) mockLongPresses.push(onLongPress)
    return children
  }
  return {Link: MockLink, InlineLinkText: MockLink}
})
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/components/AvatarStack', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {AvatarStack: () => <View testID="avatarStack" />}
})
jest.mock('#/components/Button', () => ({
  Button: () => null,
  ButtonIcon: () => null,
  ButtonText: () => null,
}))
jest.mock('#/components/atmosphere/AtmosphereFirstActionWelcomeDialog', () => ({
  AtmosphereFirstActionWelcomeDialog: () => null,
}))
jest.mock('#/components/atmosphere/SiteStandard/PublicationIcon', () => ({
  PublicationIcon: () => null,
}))
jest.mock('#/screens/Atmosphere/ActivityTab/components/ActivityHeader', () => ({
  AppName: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/screens/Atmosphere/components/AtmosphereCardMenu', () => ({
  AtmosphereCardMenu: (props: {author?: object}) => {
    mockMenu(props)
    return null
  },
}))

i18n.loadAndActivate({locale: 'en', messages: {}})
const render = (ui: React.ReactElement) =>
  baseRender(<I18nProvider i18n={i18n}>{ui}</I18nProvider>)

const owner: app.bsky.actor.defs.ProfileViewBasic = {
  did: 'did:plc:owner',
  handle: 'owner.test',
}

const view = {
  uri: 'https://example.com',
  title: 'Field Notes',
  description: '',
} satisfies app.bsky.embed.external.ViewArticlePublication

beforeEach(() => {
  jest.clearAllMocks()
  mockIsNative = false
  mockLongPresses.length = 0
})

describe('subscribers', () => {
  it('shows the total and how many the viewer follows', () => {
    render(
      <PublicationCard
        view={{
          ...view,
          subscriptionCount: 31,
          subscribers: [owner],
          viewer: {knownSubscriberCount: 2},
        }}
      />,
    )

    expect(screen.getByText('31 subscribers · 2 you follow')).toBeTruthy()
    expect(screen.getByTestId('avatarStack')).toBeTruthy()
  })

  it('leaves out how many the viewer follows until the appview sends it', () => {
    render(<PublicationCard view={{...view, subscriptionCount: 1}} />)

    expect(screen.getByText('1 subscriber')).toBeTruthy()
    expect(screen.queryByTestId('avatarStack')).toBeNull()
  })

  it('omits the row without subscribers', () => {
    render(<PublicationCard view={view} />)

    expect(screen.queryByText(/subscriber/)).toBeNull()
    expect(screen.queryByTestId('avatarStack')).toBeNull()
  })
})

it('names the author and app under the title', () => {
  render(
    <PublicationCard
      view={{
        ...view,
        providerId: 'leaflet.pub',
        associatedProfiles: [owner],
        associatedRefs: [
          {
            uri: `at://${owner.did}/site.standard.publication/abc`,
            cid: 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti',
          },
        ],
      }}
    />,
  )

  // sanitizeHandle wraps the handle in bidi isolation marks.
  expect(screen.getByText(/^by \W*@owner\.test\W* on Leaflet$/)).toBeTruthy()
})

it('hides the menu in preview', () => {
  render(<PublicationCard view={view} preview />)

  expect(mockMenu).not.toHaveBeenCalled()
})

it('gives the menu the profile whose repo holds the publication record', () => {
  const other: app.bsky.actor.defs.ProfileViewBasic = {
    did: 'did:plc:other',
    handle: 'other.test',
  }
  render(
    <PublicationCard
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

it.each([true, false])(
  'shares from the icon and title natively, with an optional onShareCallback: %s',
  withCallback => {
    mockIsNative = true
    const onShare = jest.fn()
    const onPress = jest.fn()
    render(
      <PublicationCard
        view={view}
        onShareCallback={withCallback ? onShare : undefined}
        onPressCallback={onPress}
      />,
    )

    expect(mockLongPresses).toHaveLength(2)
    mockLongPresses.forEach(onLongPress => onLongPress())
    expect(shareUrl).toHaveBeenCalledTimes(2)
    expect(shareUrl).toHaveBeenCalledWith(view.uri)
    expect(onShare).toHaveBeenCalledTimes(withCallback ? 2 : 0)
    expect(onPress).not.toHaveBeenCalled()
  },
)
