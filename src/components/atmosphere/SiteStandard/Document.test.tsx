import {fireEvent, render} from '@testing-library/react-native'

import {shareUrl} from '#/lib/sharing'
import {type app} from '#/lexicons'
import {Document} from './Document'

let mockIsNative = false
let mockIsWeb = false
let mockKnownLikers: {did: string; handle: string}[] = []
const mockLongPresses: (() => void)[] = []

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({atoms: new Proxy({}, {get: () => ({})})}),
  utils: {alpha: (color: string) => color},
}))
jest.mock('#/env', () => ({
  get IS_NATIVE() {
    return mockIsNative
  },
  get IS_WEB() {
    return mockIsWeb
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
  useKnownLikers: () => mockKnownLikers,
}))
jest.mock('#/components/AvatarStack', () => ({AvatarStack: () => null}))
jest.mock('#/components/icons/Arrow', () => ({
  ArrowShareRight_Stroke2_Corner2_Rounded: () => null,
  ArrowTopRight_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Button', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      children,
      label,
      testID,
      onPress,
    }: {
      children?:
        React.ReactNode | ((state: Record<string, boolean>) => React.ReactNode)
      label: string
      testID?: string
      onPress?: () => void
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        testID={testID}
        onPress={onPress}>
        {typeof children === 'function' ? children({}) : children}
      </Pressable>
    ),
    ButtonIcon: () => null,
    ButtonText: () => null,
  }
})
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
  mockKnownLikers = []
  mockIsWeb = false
})

describe.each(['default', 'compact'] as const)(
  'native sharing (%s)',
  variant => {
    it.each([true, false])(
      'shares from the image, title and read button, with an optional onShareCallback: %s',
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

        expect(mockLongPresses).toHaveLength(3)
        mockLongPresses.forEach(onLongPress => onLongPress())
        expect(shareUrl).toHaveBeenCalledTimes(3)
        expect(shareUrl).toHaveBeenCalledWith(view.uri)
        expect(onShare).toHaveBeenCalledTimes(withCallback ? 3 : 0)
        expect(onPress).not.toHaveBeenCalled()
      },
    )
  },
)

it('does not share on long press on web', () => {
  render(<Document view={view} />)

  expect(mockLongPresses).toHaveLength(0)
})

it('shares from the share button', () => {
  const onShare = jest.fn()
  const screen = render(<Document view={view} onShareCallback={onShare} />)

  fireEvent.press(screen.getByTestId('documentShare'))
  expect(shareUrl).toHaveBeenCalledWith(view.uri)
  expect(onShare).toHaveBeenCalledTimes(1)
})

it('shows who recommended it only when the viewer follows someone who did', () => {
  const screen = render(<Document view={view} />)
  expect(screen.queryByTestId('documentRecommendedBy')).toBeNull()
  screen.unmount()

  mockKnownLikers = [{did: 'did:plc:alice', handle: 'alice.test'}]
  const withProof = render(<Document view={view} />)
  expect(withProof.getByTestId('documentRecommendedBy')).toBeTruthy()
})

it('opens the browser share sheet on web, where there is one', () => {
  mockIsWeb = true
  const share = jest.fn(() => Promise.resolve())
  Object.defineProperty(global.navigator, 'share', {
    value: share,
    configurable: true,
  })
  try {
    const screen = render(<Document view={view} />)
    fireEvent.press(screen.getByTestId('documentShare'))
    expect(share).toHaveBeenCalledWith({url: view.uri})
    expect(shareUrl).not.toHaveBeenCalled()
  } finally {
    // @ts-expect-error - only defined for this test
    delete global.navigator.share
  }
})
