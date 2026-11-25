import {render} from '@testing-library/react-native'

import {shareUrl} from '#/lib/sharing'
import {type app} from '#/lexicons'
import {Document} from './Document'

let mockIsNative = false
const mockLongPresses: (() => void)[] = []

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
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
jest.mock('expo-image', () => ({Image: () => null}))
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
jest.mock('#/components/Typography', () => ({Text: () => null}))
jest.mock('#/components/atmosphere/LikeButton', () => ({
  LikeButton: () => null,
}))
jest.mock('#/components/atmosphere/KnownLikers', () => ({
  KnownLikers: () => null,
}))
jest.mock('#/components/atmosphere/SiteStandard/PublicationIcon', () => ({
  PublicationIcon: () => null,
}))
jest.mock(
  '#/components/atmosphere/SiteStandard/StandardSiteThemeProvider',
  () => ({
    StandardSiteThemeProvider: ({children}: {children: React.ReactNode}) =>
      children,
    useHasPublicationTheme: () => false,
  }),
)
jest.mock('#/components/atmosphere/MetaLine', () => ({MetaLine: () => null}))
jest.mock('#/components/MediaInsetBorder', () => ({
  MediaInsetBorder: () => null,
}))
jest.mock('#/screens/Atmosphere/components/AtmosphereCardMenu', () => ({
  AtmosphereCardMenu: () => null,
}))

const view = {
  uri: 'https://example.com/post',
  title: 'Title',
  description: '',
  image: 'https://example.com/image.png',
} as unknown as app.bsky.embed.external.ViewArticle

beforeEach(() => {
  jest.clearAllMocks()
  mockIsNative = false
  mockLongPresses.length = 0
})

describe.each(['default', 'compact'] as const)(
  'native sharing (%s)',
  variant => {
    it.each([true, false])(
      'shares from the image and title, with an optional onShareCallback: %s',
      withCallback => {
        mockIsNative = true
        const onShare = jest.fn()
        const onPress = jest.fn()
        render(
          <Document
            variant={variant}
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
  },
)

it('does not share on long press on web', () => {
  render(<Document view={view} />)

  expect(mockLongPresses).toHaveLength(0)
})
