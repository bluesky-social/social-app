import {render, screen} from '@testing-library/react-native'

import {PhotoDialogGallery} from '#/screens/Atmosphere/components/PhotoDialog/PhotoDialogGallery'
import {type app} from '#/lexicons'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (value: {message: string; values?: Record<string, unknown>}) =>
      value.message.replace(/\{(\w+)\}/g, (_, key: string) =>
        String(value.values?.[key]),
      ),
  }),
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useBreakpoints: () => ({gtPhone: false, gtMobile: false}),
  useTheme: () => ({atoms: new Proxy({}, {get: () => ({})})}),
}))
jest.mock('#/components/Gallery', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Root: ({
      children,
      footer,
    }: {
      children: React.ReactNode
      footer: React.ReactNode
    }) => (
      <View testID="carousel">
        {children}
        {footer}
      </View>
    ),
    PageDots: () => <View testID="pageDots" />,
    Item: ({
      children,
    }: {
      children: (props: {
        focusRef: undefined
        tabIndex: undefined
        onFocus: () => void
      }) => React.ReactNode
    }) =>
      children({focusRef: undefined, tabIndex: undefined, onFocus: () => {}}),
  }
})
jest.mock('#/components/images/AutoSizedImage', () => {
  const {Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ConstrainedImage: ({
      aspectRatio,
      children,
    }: {
      aspectRatio: number
      children: React.ReactNode
    }) => (
      <View testID="constrained">
        <Text testID="constrainedRatio">{aspectRatio}</Text>
        {children}
      </View>
    ),
  }
})
jest.mock('#/components/Link', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Link: ({
      to,
      label,
      children,
    }: {
      to: string
      label: string
      children: React.ReactNode
    }) => (
      <View
        testID="link"
        accessibilityLabel={label}
        accessibilityHint=""
        accessibilityValue={{text: to}}>
        {children}
      </View>
    ),
  }
})
jest.mock('expo-image', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Image: ({
      source,
      style,
    }: {
      source: string
      style: Record<string, number>
    }) => (
      <View testID="image" accessibilityValue={{text: source}} style={style} />
    ),
  }
})

const URI = 'https://grain.social/gallery/1'

function image(
  n: number,
  aspectRatio?: {width: number; height: number},
  alt?: string,
) {
  return {
    $type: 'app.bsky.embed.external#viewGalleryImage' as const,
    thumbnail: `https://example.com/thumb-${n}.jpg`,
    fullsize: `https://example.com/full-${n}.jpg`,
    ...(aspectRatio ? {aspectRatio} : {}),
    ...(alt ? {alt} : {}),
  }
}

function renderGallery(items: unknown[]) {
  render(
    <PhotoDialogGallery
      photo={
        {
          uri: URI,
          title: 'Spiral Jetty',
          description: '',
          items,
        } as unknown as app.bsky.embed.external.ViewGallery
      }
    />,
  )
}

describe('a single image', () => {
  it('is shown whole as a link to the gallery, not a carousel', () => {
    renderGallery([image(1, {width: 4, height: 3}, 'Alt text')])

    expect(screen.queryByTestId('carousel')).toBeNull()
    expect(screen.queryByTestId('pageDots')).toBeNull()
    const link = screen.getByTestId('link')
    expect(link.props.accessibilityLabel).toBe('Alt text')
    expect((link.props.accessibilityValue as {text: string}).text).toBe(URI)
    expect(
      (screen.getByTestId('image').props.accessibilityValue as {text: string})
        .text,
    ).toBe('https://example.com/thumb-1.jpg')
    expect(
      Number(screen.getByTestId('constrainedRatio').props.children),
    ).toBeCloseTo(4 / 3)
  })

  it('bounds very tall images like the feed does', () => {
    renderGallery([image(1, {width: 1, height: 10})])

    expect(Number(screen.getByTestId('constrainedRatio').props.children)).toBe(
      0.5,
    )
  })
})

describe('several images', () => {
  it('links every image to the gallery, in order, with a positional label fallback', () => {
    renderGallery([image(1, undefined, 'First'), image(2), image(3)])

    expect(screen.getByTestId('carousel')).toBeTruthy()
    expect(screen.getByTestId('pageDots')).toBeTruthy()
    const links = screen.getAllByTestId('link')
    expect(links.map(l => l.props.accessibilityLabel)).toEqual([
      'First',
      'Photo 2 of 3',
      'Photo 3 of 3',
    ])
    for (const link of links) {
      expect((link.props.accessibilityValue as {text: string}).text).toBe(URI)
    }
    expect(
      screen
        .getAllByTestId('image')
        .map(i => (i.props.accessibilityValue as {text: string}).text),
    ).toEqual([
      'https://example.com/thumb-1.jpg',
      'https://example.com/thumb-2.jpg',
      'https://example.com/thumb-3.jpg',
    ])
  })
})

it('skips invalid images', () => {
  renderGallery([
    {$type: 'app.test#unknown'},
    {...image(1), fullsize: 'invalid'},
    image(2),
  ])

  expect(screen.queryByTestId('carousel')).toBeNull()
  expect(screen.getAllByTestId('image')).toHaveLength(1)
})

it('renders nothing without any usable image', () => {
  renderGallery([])

  expect(screen.queryByTestId('link')).toBeNull()
})
