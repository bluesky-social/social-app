import {i18n} from '@lingui/core'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {PhotoDialog} from '#/screens/Atmosphere/components/PhotoDialog'
import {type app} from '#/lexicons'

const mockClose = jest.fn((_afterClose?: () => void) => {})
const mockOpenLink = jest.fn()
let mockIsNative = true

jest.mock('#/env', () =>
  Object.defineProperty(
    {...jest.requireActual<typeof import('#/env')>('#/env')},
    'IS_NATIVE',
    {get: () => mockIsNative},
  ),
)
jest.mock('#/lib/hooks/useOpenLink', () => ({useOpenLink: () => mockOpenLink}))

jest.mock('@lingui/react', () => {
  const fill = (message: string, values: Record<string, unknown> = {}) =>
    message.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]))
  return {
    useLingui: () => ({
      i18n: {},
      /* Real formatting, so that plurals resolve. */
      _: (value: Parameters<typeof i18n._>[0]) =>
        jest
          .requireActual<typeof import('@lingui/core')>('@lingui/core')
          .i18n._(value),
    }),
    Trans: ({
      message,
      values,
    }: {
      message: string
      values?: Record<string, unknown>
    }) => fill(message, values).replace(/<\/?\d+>/g, ''),
  }
})
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  tokens: {borderRadius: {md: 8}},
  web: () => undefined,
  useTheme: () => ({
    atoms: new Proxy({}, {get: () => ({})}),
    palette: new Proxy({}, {get: () => '#000'}),
  }),
}))
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/components/Link', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    InlineLinkText: ({
      to,
      onPress,
      children,
    }: {
      to: string
      onPress?: React.ComponentProps<typeof Text>['onPress']
      children: React.ReactNode
    }) => (
      <Text
        accessibilityRole="link"
        accessibilityLabel={to}
        accessibilityHint=""
        onPress={onPress}>
        {children}
      </Text>
    ),
  }
})
jest.mock('#/components/RichTextTag', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    RichTextTag: ({display, tag}: {display: string; tag: string}) => (
      <Text
        accessibilityRole="link"
        accessibilityLabel={`#${tag}`}
        accessibilityHint="">
        {display}
      </Text>
    ),
  }
})
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => ({}),
}))
jest.mock('#/view/com/util/numeric/format', () => ({
  formatCount: (_i18n: unknown, n: number) => String(n),
}))
jest.mock('#/components/ProfileCard', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  const passthrough = ({children}: {children?: React.ReactNode}) => children
  return {
    Link: ({
      onPress,
      children,
    }: {
      onPress?: React.ComponentProps<typeof Text>['onPress']
      children: React.ReactNode
    }) => (
      <Text
        accessibilityRole="link"
        accessibilityLabel="Author profile"
        accessibilityHint=""
        onPress={onPress}>
        {children}
      </Text>
    ),
    Header: passthrough,
    Avatar: () => null,
    NameAndHandle: ({
      profile,
    }: {
      profile: {displayName: string; handle: string}
    }) => <Text>{`${profile.displayName} @${profile.handle}`}</Text>,
  }
})
jest.mock('#/lib/hooks/useTimeAgo', () => ({
  formatTimeAgo: () => '4d ago',
}))
jest.mock('#/view/com/util/TimeElapsed', () => ({
  TimeElapsed: ({
    timestamp,
    timeToString,
    children,
  }: {
    timestamp: string
    timeToString: (i18n: unknown, timestamp: string) => string
    children: (state: {timeElapsed: string}) => React.ReactNode
  }) => children({timeElapsed: timeToString({}, timestamp)}),
}))
jest.mock(
  '#/screens/Atmosphere/components/PhotoDialog/PhotoDialogGallery',
  () => {
    const {View} =
      jest.requireActual<typeof import('react-native')>('react-native')
    return {
      PhotoDialogGallery: ({photo}: {photo: {uri: string}}) => (
        <View testID="photoGallery" accessibilityValue={{text: photo.uri}} />
      ),
    }
  },
)
jest.mock('#/components/icons/Clock', () => ({
  Clock_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/community/Grain', () => ({
  GrainFull: () => null,
  GrainMark: () => null,
}))
jest.mock('#/components/icons/Square', () => ({
  SquareArrowTopRight_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Heart2', () => ({
  Heart2_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/icons/Image', () => ({
  Image_Stroke2_Corner2_Rounded: () => null,
}))
jest.mock('#/components/Button', () => {
  const {Pressable} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      testID,
      label,
      onPress,
      children,
    }: {
      testID?: string
      label: string
      onPress: () => void
      children: React.ReactNode
    }) => (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint=""
        onPress={onPress}>
        {children}
      </Pressable>
    ),
    ButtonText: ({children}: {children: React.ReactNode}) => children,
    ButtonIcon: () => null,
  }
})
jest.mock('#/components/Dialog', () => ({
  Outer: ({children}: {children: React.ReactNode}) => children,
  Handle: () => null,
  Close: () => null,
  ScrollableInner: ({children}: {children: React.ReactNode}) => children,
}))

const author: app.bsky.actor.defs.ProfileViewBasic = {
  did: 'did:plc:6ayddqghxhciedbaofoxkcbs',
  handle: 'Author.Test',
  displayName: 'Author',
}

function image(n: number, alt?: string) {
  return {
    $type: 'app.bsky.embed.external#viewGalleryImage' as const,
    thumbnail: `https://example.com/thumb-${n}.jpg`,
    fullsize: `https://example.com/full-${n}.jpg`,
    ...(alt ? {alt} : {}),
  }
}

function gallery(
  overrides: Partial<app.bsky.embed.external.ViewGallery> = {},
): app.bsky.embed.external.ViewGallery {
  return {
    uri: 'https://grain.social/gallery/1',
    title: 'Spiral Jetty',
    description: 'A visit to the jetty.',
    likeCount: 12,
    createdAt: '2026-11-07T12:00:00.000Z',
    items: [image(1, 'First alt'), image(2), image(3)],
    ...overrides,
  } as app.bsky.embed.external.ViewGallery
}

function renderDialog(photo = gallery()) {
  render(
    <PhotoDialog
      control={{close: mockClose} as never}
      photo={photo}
      author={author}
    />,
  )
}

beforeAll(() => {
  i18n.loadAndActivate({locale: 'en', messages: {}})
})

beforeEach(() => {
  jest.clearAllMocks()
  mockIsNative = true
})

it('renders the photo gallery for the photo', () => {
  renderDialog()

  const {accessibilityValue} = screen.getByTestId('photoGallery').props as {
    accessibilityValue: {text: string}
  }
  expect(accessibilityValue.text).toBe('https://grain.social/gallery/1')
})

describe('metadata', () => {
  it('shows the author, title and description', () => {
    renderDialog()

    expect(screen.getByText('Author @Author.Test')).toBeTruthy()
    expect(screen.getByText('Spiral Jetty')).toBeTruthy()
    expect(screen.getByText('A visit to the jetty.')).toBeTruthy()
  })

  it('links URLs and mentions but leaves hashtags as plain text', () => {
    renderDialog(
      gallery({
        description:
          '📷 See https://example.com/photos by @author.test #landscape',
      }),
    )

    expect(
      screen.getByRole('link', {name: 'https://example.com/photos'}),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', {name: '/profile/author.test'}),
    ).toHaveTextContent('@author.test')
    expect(screen.getByText(/#landscape/)).toBeTruthy()
    expect(screen.queryByRole('link', {name: '#landscape'})).toBeNull()
  })

  it.each([
    'Author profile',
    'https://example.com/photos',
    '/profile/author.test',
  ])('dismisses the dialog when pressing %s', name => {
    renderDialog(
      gallery({
        description: 'See https://example.com/photos by @author.test',
      }),
    )

    fireEvent.press(screen.getByRole('link', {name}))

    expect(mockClose).toHaveBeenCalledTimes(1)
  })
})

describe('stats', () => {
  const stat = (name: 'Likes' | 'Photos' | 'Time') =>
    screen.queryByTestId(`atmospherePhotoDialog${name}`)

  it('shows likes, hydrated photo count and relative date', () => {
    renderDialog()

    expect(stat('Likes')).toHaveTextContent(/^12 likes$/)
    expect(stat('Photos')).toHaveTextContent(/^3 photos$/)
    expect(stat('Time')).toHaveTextContent(/^4d ago$/)
  })

  it.each([
    [42, '42 photos'],
    [1, '1 photo'],
    [0, '0 photos'],
  ] as const)(
    'uses the total photo count %s when provided',
    (photoCount, label) => {
      renderDialog(gallery({photoCount}))

      expect(stat('Photos')).toHaveTextContent(label)
    },
  )

  it('uses singular forms', () => {
    renderDialog(gallery({likeCount: 1, items: [image(1)] as never}))

    expect(stat('Likes')).toHaveTextContent(/^1 like$/)
    expect(stat('Photos')).toHaveTextContent(/^1 photo$/)
  })

  it('omits likes when there are none', () => {
    renderDialog(gallery({likeCount: undefined}))

    expect(stat('Likes')).toBeNull()
    expect(stat('Photos')).toBeTruthy()
  })

  it('omits a missing or invalid date', () => {
    renderDialog(gallery({createdAt: 'not a date' as never}))

    expect(stat('Time')).toBeNull()
  })
})

it('dismisses from the native Close button without opening the gallery link', () => {
  renderDialog()

  fireEvent.press(screen.getByRole('button', {name: 'Close'}))

  expect(mockClose).toHaveBeenCalledTimes(1)
  expect(mockClose).toHaveBeenCalledWith()
  expect(mockOpenLink).not.toHaveBeenCalled()
})

it('omits the native Close button on web', () => {
  mockIsNative = false
  renderDialog()

  expect(screen.queryByRole('button', {name: 'Close'})).toBeNull()
  expect(screen.getByRole('button', {name: 'View on Grain'})).toBeTruthy()
})

it('opens the gallery link only after the dialog has closed', () => {
  renderDialog(gallery({uri: 'https://grain.social/gallery/42'}))

  fireEvent.press(screen.getByRole('button', {name: 'View on Grain'}))
  expect(mockClose).toHaveBeenCalledTimes(1)
  expect(mockClose).toHaveBeenCalledWith(expect.any(Function))
  expect(mockOpenLink).not.toHaveBeenCalled()

  mockClose.mock.calls[0][0]?.()
  expect(mockOpenLink).toHaveBeenCalledTimes(1)
  expect(mockOpenLink).toHaveBeenCalledWith('https://grain.social/gallery/42')
})
