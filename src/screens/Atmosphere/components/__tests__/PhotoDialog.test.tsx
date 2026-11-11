import {i18n} from '@lingui/core'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {PhotoDialog} from '../PhotoDialog'

const mockClose = jest.fn()

jest.mock('@lingui/react', () => {
  const fill = (message: string, values: Record<string, unknown> = {}) =>
    message.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]))
  return {
    useLingui: () => ({
      i18n: {},
      _: (value: {message: string; values?: Record<string, unknown>}) =>
        fill(value.message, value.values),
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
    Link: passthrough,
    Header: passthrough,
    Avatar: () => null,
    NameAndHandle: ({
      profile,
    }: {
      profile: {displayName: string; handle: string}
    }) => <Text>{`${profile.displayName} @${profile.handle}`}</Text>,
  }
})
jest.mock('#/view/com/util/TimeElapsed', () => ({
  TimeElapsed: ({
    children,
  }: {
    children: (state: {timeElapsed: string}) => React.ReactNode
  }) => children({timeElapsed: '4d'}),
}))
jest.mock('../PhotoGallery', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    PhotoGallery: ({photo}: {photo: {uri: string}}) => (
      <View testID="photoGallery" accessibilityValue={{text: photo.uri}} />
    ),
  }
})
jest.mock('#/components/icons/Clock', () => ({
  Clock_Stroke2_Corner0_Rounded: () => null,
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

  it('omits a missing description', () => {
    renderDialog(gallery({description: '  '}))

    expect(screen.queryByText('A visit to the jetty.')).toBeNull()
  })

  it.each([
    ['https://grain.social/gallery/1', 'Powered by grain'],
    ['https://alice.grain.social/gallery/1', 'Powered by grain'],
    ['https://example.com/gallery/1', 'Powered by example.com'],
    ['https://notgrain.social/gallery/1', 'Powered by notgrain.social'],
  ])('attributes %s', (uri, text) => {
    renderDialog(gallery({uri: uri as never}))

    expect(screen.getByTestId('atmospherePhotoDialogSource')).toHaveTextContent(
      text,
    )
  })
})

describe('stats', () => {
  const stat = (name: 'Likes' | 'Photos' | 'Time') =>
    screen.queryByTestId(`atmospherePhotoDialog${name}`)

  it('shows likes, hydrated photo count and relative date', () => {
    renderDialog()

    expect(stat('Likes')).toHaveTextContent(/^12 likes$/)
    expect(stat('Photos')).toHaveTextContent(/^3 photos$/)
    expect(stat('Time')).toHaveTextContent(/^4d$/)
  })

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

it('closes from the Close button', () => {
  renderDialog()

  fireEvent.press(screen.getByTestId('atmospherePhotoDialogClose'))
  expect(mockClose).toHaveBeenCalledTimes(1)
})
