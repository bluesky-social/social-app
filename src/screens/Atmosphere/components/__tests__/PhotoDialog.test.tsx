import {fireEvent, render, screen} from '@testing-library/react-native'

import {type app} from '#/lexicons'
import {PhotoDialog} from '../PhotoDialog'

const mockClose = jest.fn()

jest.mock('@lingui/react', () => {
  const fill = (message: string, values: Record<string, unknown> = {}) =>
    message.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]))
  return {
    useLingui: () => ({
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
  useModerationOpts: () => undefined,
}))
jest.mock('#/view/com/util/UserAvatar', () => ({UserAvatar: () => null}))
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
  it('shows the author, relative date, title and description', () => {
    renderDialog()

    expect(screen.getByText('Author')).toBeTruthy()
    expect(screen.getByText(/@author\.test/)).toBeTruthy()
    expect(screen.getByText(' · 4d')).toBeTruthy()
    expect(screen.getByText('Spiral Jetty')).toBeTruthy()
    expect(screen.getByText('A visit to the jetty.')).toBeTruthy()
  })

  it('omits a missing description and date', () => {
    renderDialog(gallery({description: '  ', createdAt: undefined}))

    expect(screen.queryByText(/ · /)).toBeNull()
    expect(screen.queryByText('A visit to the jetty.')).toBeNull()
  })

  it('omits an invalid date', () => {
    renderDialog(gallery({createdAt: 'not a date' as never}))

    expect(screen.queryByText(/ · /)).toBeNull()
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

it('closes from the Close button', () => {
  renderDialog()

  fireEvent.press(screen.getByTestId('atmospherePhotoDialogClose'))
  expect(mockClose).toHaveBeenCalledTimes(1)
})
