import {type StyleProp, StyleSheet, View, type ViewStyle} from 'react-native'
import {act, fireEvent, render, screen} from '@testing-library/react-native'

import {
  Bleed,
  useGalleryBleed as usePrimitiveGalleryBleed,
} from '#/components/Gallery'
import {
  Gallery,
  GalleryBleed,
  useGalleryBleed,
} from '#/components/images/Gallery'
import {PostEmbedViewContext} from '#/components/Post/Embed/types'

/*
 * These tests cover the image adapter's contract: sizing, lightbox arguments,
 * focus wiring, the screen-reader fallback and the swipe metric. The carousel
 * itself is replaced with a stub; its behavior is covered by its own tests.
 */

const mockEnv = {largeAlt: false, screenReader: false}
const mockBps = {gtPhone: false, gtMobile: false}
const mockMetric = jest.fn<void, [string, Record<string, unknown>]>()
const mockScrollIntoView = jest.fn<void, [number]>()
const mockItemFocus = jest.fn<void, []>()
const mockRoot: {
  props: {
    label: string
    onIndexChange?: (index: number, previous: number) => void
  } | null
} = {props: null}

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (value: {message: string; values?: Record<string, unknown>}) =>
      value.message.replace(/\{(\w+)\}/g, (_, key: string) =>
        String(value.values?.[key]),
      ),
  }),
  Trans: ({
    message,
    values,
  }: {
    message: string
    values?: Record<string, unknown>
  }) =>
    message.replace(/\{(\w+)\}/g, (_, key: string) => String(values?.[key])),
}))
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))
jest.mock('#/state/a11y', () => ({
  useA11y: () => ({screenReaderEnabled: mockEnv.screenReader}),
}))
jest.mock('#/state/preferences/large-alt-badge', () => ({
  useLargeAltBadgeEnabled: () => mockEnv.largeAlt,
}))
jest.mock('#/alf', () => {
  const palette = new Proxy({}, {get: () => '#000'})
  const atoms = new Proxy({}, {get: () => ({})})
  const theme = {name: 'light', palette, atoms}
  return {
    atoms: new Proxy({}, {get: () => ({})}),
    tokens: {borderRadius: {md: 8}},
    useTheme: () => theme,
    useBreakpoints: () => mockBps,
    web: () => undefined,
  }
})
jest.mock('@bsky.app/alf', () => ({utils: {alpha: () => '#000'}}))
jest.mock('react-native-reanimated', () => {
  const {View, Text: RNText} =
    require('react-native') as typeof import('react-native')
  const {useRef} = require('react') as typeof import('react')
  return {
    __esModule: true,
    default: {View, Text: RNText},
    useAnimatedRef: () => useRef(null),
  }
})
jest.mock('expo-image', () => {
  const {createElement} = require('react') as typeof import('react')
  return {
    Image: (props: Record<string, unknown>) => createElement('Image', props),
  }
})
jest.mock('#/components/icons/ArrowsDiagonal', () => {
  const {createElement} = require('react') as typeof import('react')
  return {
    ArrowsDiagonalOut_Stroke2_Corner0_Rounded: (
      props: Record<string, unknown>,
    ) => createElement('CropBadge', props),
  }
})
jest.mock('#/components/MediaInsetBorder', () => {
  const {createElement} = require('react') as typeof import('react')
  return {
    MediaInsetBorder: (props: Record<string, unknown>) =>
      createElement('MediaInsetBorder', props),
  }
})
jest.mock('#/components/Typography', () => ({
  Text: (require('react-native') as typeof import('react-native')).Text,
}))
jest.mock('#/components/Post/Embed/ImageContextMenu', () => {
  const {createElement} = require('react') as typeof import('react')
  return {
    ImageContextMenu: ({
      children,
      ...props
    }: {children: React.ReactNode} & Record<string, unknown>) =>
      createElement('ImageContextMenu', props, children),
  }
})
jest.mock('#/components/images/AutoSizedImage', () => {
  const {createElement} = require('react') as typeof import('react')
  return {
    AutoSizedImage: (props: Record<string, unknown>) =>
      createElement('AutoSizedImage', props),
  }
})
// Pulls in posts and moderation, which the adapter doesn't touch
jest.mock(
  '#/components/images/Gallery/maybeApplyGalleryOffsetStyles',
  () => ({}),
)
jest.mock('#/components/Gallery', () => {
  const {createElement, useImperativeHandle} =
    require('react') as typeof import('react')
  const {View} = require('react-native') as typeof import('react-native')
  return {
    __esModule: true,
    Bleed: ({children}: {children: React.ReactNode}) => children,
    useGalleryBleed: () => ({bleedRef: {current: null}, bleedWidth: 0}),
    Root: ({
      children,
      ref,
      label,
      onIndexChange,
    }: {
      children: React.ReactNode
      ref: React.Ref<unknown>
      label: string
      onIndexChange?: (index: number, previous: number) => void
    }) => {
      mockRoot.props = {label, onIndexChange}
      useImperativeHandle(ref, () => ({scrollIntoView: mockScrollIntoView}))
      return createElement(View, {testID: 'root'}, children)
    },
    Item: ({
      children,
      label,
    }: {
      children: (props: Record<string, unknown>) => React.ReactNode
      label?: string
    }) =>
      createElement(
        View,
        {testID: 'item', 'aria-label': label},
        children({focusRef: jest.fn(), tabIndex: 0, onFocus: mockItemFocus}),
      ),
  }
})

type OnPress = NonNullable<React.ComponentProps<typeof Gallery>['onPress']>

function mockOnPress() {
  return jest.fn<void, Parameters<OnPress>>()
}

/** Calls a callback prop on a rendered element */
function callProp(
  element: {props: Record<string, unknown>},
  name: string,
  ...args: unknown[]
) {
  ;(element.props[name] as (...args: unknown[]) => void)(...args)
}

type ViewImage = React.ComponentProps<typeof Gallery>['images'][number]

function image(i: number, overrides: Partial<ViewImage> = {}): ViewImage {
  return {
    thumb: `https://cdn.test/thumb-${i}.jpg`,
    fullsize: `https://cdn.test/full-${i}.jpg`,
    alt: '',
    aspectRatio: {width: 100, height: 100},
    ...overrides,
  }
}

const three = [image(0), image(1), image(2)]

beforeEach(() => {
  mockEnv.largeAlt = false
  mockEnv.screenReader = false
  mockBps.gtPhone = false
  mockBps.gtMobile = false
  mockRoot.props = null
  jest.clearAllMocks()
})

function thumbs() {
  return screen.UNSAFE_getAllByType('Image' as never)
}

function thumbWidth(i: number) {
  const style = thumbs()[i].props.style as {width: number}[]
  return style[0].width
}

function loadThumb(i: number, width: number, height: number) {
  act(() => {
    callProp(thumbs()[i], 'onLoad', {source: {width, height}})
  })
}

describe('image gallery adapter', () => {
  it('exports the generic gallery bleed, so there is only one context', () => {
    expect(GalleryBleed).toBe(Bleed)
    expect(useGalleryBleed).toBe(usePrimitiveGalleryBleed)
  })

  it('describes the carousel and its slides', () => {
    render(
      <Gallery
        images={[image(0, {alt: 'A cat'}), image(1)]}
        onPress={jest.fn()}
      />,
    )
    expect(mockRoot.props?.label).toBe('Image gallery, 2 images')
    const slides = screen.getAllByTestId('item')
    expect(slides[0].props['aria-label']).toBe('A cat')
    expect(slides[1].props['aria-label']).toBe('Image 2 of 2')
  })

  it('renders one thumbnail per image', () => {
    render(<Gallery images={three} />)
    expect(thumbs().map(t => (t.props.source as {uri: string}).uri)).toEqual(
      three.map(i => i.thumb),
    )
  })

  it('loads the first image eagerly and the others lazily', () => {
    render(<Gallery images={three} />)
    expect(thumbs().map(t => t.props.loading)).toEqual([
      'eager',
      'lazy',
      'lazy',
    ])
  })

  describe('sizing', () => {
    it('uses the ordinary height, and lets the carousel measure the result', () => {
      mockBps.gtMobile = true
      mockBps.gtPhone = true
      render(<Gallery images={[image(0), image(1)]} />)
      const style = thumbs()[0].props.style as {width: number; height: number}[]
      expect(style[0].height).toBe(300)
      expect(style[0].width).toBe(300)
    })

    it('uses the chat height in chat', () => {
      render(
        <Gallery
          images={[image(0), image(1)]}
          viewContext={PostEmbedViewContext.ChatMessage}
        />,
      )
      expect((thumbs()[0].props.style as {height: number}[])[0].height).toBe(
        120,
      )
    })

    it('uses the quote height in quotes', () => {
      render(<Gallery images={[image(0), image(1)]} isWithinQuote />)
      expect((thumbs()[0].props.style as {height: number}[])[0].height).toBe(
        150,
      )
    })

    it('sizes each image by its own ratio, clamped', () => {
      render(
        <Gallery
          images={[
            image(0, {aspectRatio: {width: 100, height: 200}}),
            image(1, {aspectRatio: {width: 400, height: 100}}),
            image(2, {aspectRatio: {width: 5, height: 4}}),
          ]}
        />,
      )
      // height 200: portrait clamps to 2/3, landscape to 3/2
      expect([0, 1, 2].map(thumbWidth)).toEqual([133, 300, 250])
    })

    it('defaults to square without a ratio, then learns it from the thumbnail', () => {
      render(
        <Gallery images={[image(0, {aspectRatio: undefined}), image(1)]} />,
      )
      expect(thumbWidth(0)).toBe(200)
      loadThumb(0, 300, 200)
      expect(thumbWidth(0)).toBe(300)
    })

    it('does not resize an image whose record has a ratio', () => {
      render(<Gallery images={[image(0), image(1)]} />)
      expect(thumbWidth(0)).toBe(200)
      // the CDN reports a slightly different ratio
      loadThumb(0, 301, 200)
      expect(thumbWidth(0)).toBe(200)
    })
  })

  describe('badges', () => {
    it('shows the position only with more than one image', () => {
      const {rerender} = render(<Gallery images={three} />)
      expect(screen.getByText('1/3')).toBeTruthy()
      expect(screen.getByText('3/3')).toBeTruthy()
      rerender(<Gallery images={[image(0)]} />)
      expect(screen.queryByText('1/1')).toBeNull()
    })

    it('shows ALT only for images with alt text', () => {
      render(<Gallery images={[image(0, {alt: 'A cat'}), image(1)]} />)
      expect(screen.getAllByText('ALT')).toHaveLength(1)
    })

    it('shows a crop badge only when the image is cropped', () => {
      render(
        <Gallery
          images={[image(0, {aspectRatio: {width: 10, height: 1}}), image(1)]}
        />,
      )
      expect(screen.UNSAFE_queryAllByType('CropBadge' as never)).toHaveLength(1)
    })

    it('makes badges larger with the large ALT preference', () => {
      const paddedViews = () =>
        screen
          .UNSAFE_getAllByType(View)
          .filter(
            v =>
              (StyleSheet.flatten(v.props.style as StyleProp<ViewStyle>) ?? {})
                .padding === 6,
          )
      const {unmount} = render(
        <Gallery images={[image(0, {alt: 'A cat'}), image(1)]} />,
      )
      expect(paddedViews()).toHaveLength(0)
      unmount()
      mockEnv.largeAlt = true
      render(<Gallery images={[image(0, {alt: 'A cat'}), image(1)]} />)
      // two position badges, and one ALT badge
      expect(paddedViews()).toHaveLength(3)
    })
  })

  describe('lightbox', () => {
    function pressImage(i: number) {
      fireEvent.press(screen.getAllByRole('button')[i])
    }

    it('opens at the pressed index with refs and dims for every image', () => {
      const onPress = mockOnPress()
      render(<Gallery images={three} onPress={onPress} />)
      loadThumb(1, 640, 480)
      pressImage(1)
      expect(onPress).toHaveBeenCalledTimes(1)
      const [index, refs, dims, onIndexChange] = onPress.mock.calls[0]
      expect(index).toBe(1)
      expect(refs).toHaveLength(3)
      expect(refs.every(ref => ref != null)).toBe(true)
      expect(dims).toEqual([null, {width: 640, height: 480}, null])
      expect(typeof onIndexChange).toBe('function')
    })

    it('keeps the thumbnail in view when the lightbox changes index', () => {
      const onPress = mockOnPress()
      render(<Gallery images={three} onPress={onPress} />)
      pressImage(0)
      const scrollIntoView = onPress.mock.calls[0][3]
      scrollIntoView?.(2)
      expect(mockScrollIntoView).toHaveBeenCalledWith(2)
      // and not as a swipe
      expect(mockMetric).not.toHaveBeenCalled()
    })

    it('hands over the same scroll function on every press', () => {
      const onPress = mockOnPress()
      render(<Gallery images={three} onPress={onPress} />)
      pressImage(0)
      pressImage(1)
      expect(onPress.mock.calls[0][3]).toBe(onPress.mock.calls[1][3])
    })

    it('passes a scroll function that survives re-renders', () => {
      const onPress = mockOnPress()
      const {rerender} = render(<Gallery images={three} onPress={onPress} />)
      pressImage(0)
      const scrollIntoView = onPress.mock.calls[0][3]
      rerender(<Gallery images={three} onPress={onPress} />)
      scrollIntoView?.(1)
      expect(mockScrollIntoView).toHaveBeenCalledWith(1)
    })

    it('opens from the context menu preview too', () => {
      const onPress = mockOnPress()
      render(<Gallery images={three} onPress={onPress} />)
      const menus = screen.UNSAFE_getAllByType('ImageContextMenu' as never)
      act(() => callProp(menus[2], 'onPreviewPress'))
      expect(onPress.mock.calls[0][0]).toBe(2)
    })

    it('passes the image to the context menu', () => {
      render(<Gallery images={[image(0), image(1)]} onPress={jest.fn()} />)
      const menu = screen.UNSAFE_getAllByType('ImageContextMenu' as never)[0]
      expect(menu.props.fullsizeUri).toBe('https://cdn.test/full-0.jpg')
      expect(menu.props.thumbUri).toBe('https://cdn.test/thumb-0.jpg')
      expect(menu.props.aspectRatio).toBe(1)
    })

    it('has nothing to open without a handler', () => {
      render(<Gallery images={three} />)
      expect(() => pressImage(0)).not.toThrow()
    })

    it('reports presses starting', () => {
      const onPressIn = jest.fn()
      render(<Gallery images={three} onPressIn={onPressIn} />)
      fireEvent(screen.getAllByRole('button')[2], 'pressIn')
      expect(onPressIn).toHaveBeenCalledWith(2)
    })

    it('forgets images that went away', () => {
      const onPress = mockOnPress()
      const {rerender} = render(<Gallery images={three} onPress={onPress} />)
      rerender(<Gallery images={three.slice(0, 2)} onPress={onPress} />)
      pressImage(1)
      const [, refs, dims] = onPress.mock.calls[0]
      expect(refs).toHaveLength(2)
      expect(dims).toHaveLength(2)
    })

    it('forgets the dims of replaced images', () => {
      const onPress = mockOnPress()
      const {rerender} = render(
        <Gallery images={[image(0), image(1)]} onPress={onPress} />,
      )
      loadThumb(0, 640, 480)
      rerender(<Gallery images={[image(5), image(6)]} onPress={onPress} />)
      pressImage(0)
      expect(onPress.mock.calls[0][2]).toEqual([null, null])
    })
  })

  describe('focus', () => {
    it('attaches the carousel focus props to the image button', () => {
      render(<Gallery images={three} onPress={jest.fn()} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
      expect(buttons[0].props.tabIndex).toBe(0)
    })

    it('tells the carousel when the image button is focused, and shows focus', () => {
      render(<Gallery images={three} onPress={jest.fn()} />)
      const borders = () =>
        screen.UNSAFE_getAllByType('MediaInsetBorder' as never)
      expect(borders()[1].props.style).toBeFalsy()
      fireEvent(screen.getAllByRole('button')[1], 'focus')
      expect(mockItemFocus).toHaveBeenCalledTimes(1)
      expect(borders()[1].props.style).toEqual({borderWidth: 2})
      fireEvent(screen.getAllByRole('button')[1], 'blur')
      expect(borders()[1].props.style).toBeFalsy()
    })

    it('does not nest a second button around the image', () => {
      render(<Gallery images={three} onPress={jest.fn()} />)
      expect(screen.getAllByRole('button')).toHaveLength(3)
    })
  })

  describe('screen readers', () => {
    beforeEach(() => {
      mockEnv.screenReader = true
    })

    it('shows a vertical list of images instead of the carousel', () => {
      render(<Gallery images={three} />)
      expect(screen.queryByTestId('root')).toBeNull()
      expect(
        screen.UNSAFE_getAllByType('AutoSizedImage' as never),
      ).toHaveLength(3)
    })

    it.each([
      [undefined, false, 'constrained'],
      [PostEmbedViewContext.Feed, false, 'constrained'],
      [PostEmbedViewContext.ThreadHighlighted, false, 'none'],
      [undefined, true, 'square'],
      // highlighted threads win over quotes
      [PostEmbedViewContext.ThreadHighlighted, true, 'none'],
    ])('crops %s (quote: %s) as %s', (viewContext, isWithinQuote, crop) => {
      render(
        <Gallery
          images={three}
          viewContext={viewContext}
          isWithinQuote={isWithinQuote}
        />,
      )
      for (const el of screen.UNSAFE_getAllByType('AutoSizedImage' as never)) {
        expect(el.props.crop).toBe(crop)
      }
    })

    it('opens the lightbox from a single image, with no scroll function', () => {
      const onPress = mockOnPress()
      render(<Gallery images={three} onPress={onPress} />)
      const ref = {}
      const dims = {width: 1, height: 2}
      act(() => {
        callProp(
          screen.UNSAFE_getAllByType('AutoSizedImage' as never)[1],
          'onPress',
          ref,
          dims,
        )
      })
      expect(onPress).toHaveBeenCalledWith(1, [ref], [dims])
    })

    it('reports presses starting', () => {
      const onPressIn = jest.fn()
      render(<Gallery images={three} onPressIn={onPressIn} />)
      act(() => {
        callProp(
          screen.UNSAFE_getAllByType('AutoSizedImage' as never)[2],
          'onPressIn',
        )
      })
      expect(onPressIn).toHaveBeenCalledWith(2)
    })
  })

  describe('swipe metric', () => {
    const post = {
      postUri: 'at://did:plc:abc/app.bsky.feed.post/1',
      postAuthorDid: 'did:plc:abc',
      feedDescriptor: 'following',
    }

    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    function swipe(index: number, previous: number) {
      act(() => mockRoot.props?.onIndexChange?.(index, previous))
    }

    it('is not sent on first render', () => {
      render(<Gallery images={three} metricsPostContext={post} />)
      act(() => jest.advanceTimersByTime(1000))
      expect(mockMetric).not.toHaveBeenCalled()
    })

    it('is sent after the debounce, one-based, with the post', () => {
      render(<Gallery images={three} metricsPostContext={post} />)
      swipe(1, 0)
      act(() => jest.advanceTimersByTime(199))
      expect(mockMetric).not.toHaveBeenCalled()
      act(() => jest.advanceTimersByTime(1))
      expect(mockMetric).toHaveBeenCalledTimes(1)
      expect(mockMetric).toHaveBeenCalledWith('post:photoEmbed:carouselSwipe', {
        fromImage: 1,
        toImage: 2,
        totalImages: 3,
        postUri: post.postUri,
        postAuthorDid: post.postAuthorDid,
        feedDescriptor: 'following',
      })
    })

    it('leaves the feed out when there is none', () => {
      render(
        <Gallery
          images={three}
          metricsPostContext={{
            postUri: post.postUri,
            postAuthorDid: post.postAuthorDid,
          }}
        />,
      )
      swipe(2, 1)
      act(() => jest.advanceTimersByTime(200))
      expect(mockMetric.mock.calls[0][1]?.feedDescriptor).toBeUndefined()
    })

    it('sends one event for a quick run of swipes', () => {
      render(<Gallery images={three} metricsPostContext={post} />)
      swipe(1, 0)
      act(() => jest.advanceTimersByTime(100))
      swipe(2, 1)
      act(() => jest.advanceTimersByTime(200))
      expect(mockMetric).toHaveBeenCalledTimes(1)
      expect(mockMetric.mock.calls[0]?.[1]).toEqual(
        expect.objectContaining({fromImage: 2, toImage: 3}),
      )
    })

    it('is never sent without post context', () => {
      render(<Gallery images={three} />)
      swipe(1, 0)
      act(() => jest.advanceTimersByTime(1000))
      expect(mockMetric).not.toHaveBeenCalled()
    })

    it('survives a re-render with an equal context', () => {
      const {rerender} = render(
        <Gallery images={three} metricsPostContext={{...post}} />,
      )
      swipe(1, 0)
      rerender(<Gallery images={three} metricsPostContext={{...post}} />)
      act(() => jest.advanceTimersByTime(200))
      expect(mockMetric).toHaveBeenCalledTimes(1)
    })

    it('is dropped on unmount', () => {
      const {unmount} = render(
        <Gallery images={three} metricsPostContext={post} />,
      )
      swipe(1, 0)
      unmount()
      act(() => jest.advanceTimersByTime(1000))
      expect(mockMetric).not.toHaveBeenCalled()
    })

    it('is dropped when the component moves to a different post', () => {
      const {rerender} = render(
        <Gallery images={three} metricsPostContext={post} />,
      )
      swipe(1, 0)
      rerender(
        <Gallery
          images={three}
          metricsPostContext={{...post, postUri: 'at://other/post/2'}}
        />,
      )
      act(() => jest.advanceTimersByTime(1000))
      expect(mockMetric).not.toHaveBeenCalled()
    })

    it('is dropped when the images are replaced at the same count', () => {
      const {rerender} = render(
        <Gallery images={three} metricsPostContext={post} />,
      )
      swipe(1, 0)
      rerender(
        <Gallery
          images={[image(7), image(8), image(9)]}
          metricsPostContext={post}
        />,
      )
      act(() => jest.advanceTimersByTime(1000))
      expect(mockMetric).not.toHaveBeenCalled()
    })

    it('is dropped when the images are reordered', () => {
      const {rerender} = render(
        <Gallery images={three} metricsPostContext={post} />,
      )
      swipe(1, 0)
      rerender(
        <Gallery
          images={[three[2], three[0], three[1]]}
          metricsPostContext={post}
        />,
      )
      act(() => jest.advanceTimersByTime(1000))
      expect(mockMetric).not.toHaveBeenCalled()
    })

    it('is dropped when the images change in number', () => {
      const {rerender} = render(
        <Gallery images={three} metricsPostContext={post} />,
      )
      swipe(1, 0)
      rerender(<Gallery images={three.slice(0, 2)} metricsPostContext={post} />)
      act(() => jest.advanceTimersByTime(1000))
      expect(mockMetric).not.toHaveBeenCalled()
    })

    it.each([
      ['author', {postAuthorDid: 'did:plc:other'}],
      ['feed', {feedDescriptor: 'discover'}],
      ['post', {postUri: 'at://other/post/2'}],
    ])('is dropped when the %s changes', (_name, change) => {
      const {rerender} = render(
        <Gallery images={three} metricsPostContext={post} />,
      )
      swipe(1, 0)
      act(() => jest.advanceTimersByTime(100))
      rerender(
        <Gallery images={three} metricsPostContext={{...post, ...change}} />,
      )
      act(() => jest.advanceTimersByTime(1000))
      expect(mockMetric).not.toHaveBeenCalled()
    })

    it('reports a swipe made after the context changed', () => {
      const {rerender} = render(
        <Gallery images={three} metricsPostContext={post} />,
      )
      rerender(
        <Gallery
          images={three}
          metricsPostContext={{...post, feedDescriptor: 'discover'}}
        />,
      )
      swipe(1, 0)
      act(() => jest.advanceTimersByTime(200))
      expect(mockMetric.mock.calls[0][1]?.feedDescriptor).toBe('discover')
    })

    it('is not sent for lightbox scrolling', () => {
      const onPress = mockOnPress()
      render(
        <Gallery images={three} onPress={onPress} metricsPostContext={post} />,
      )
      fireEvent.press(screen.getAllByRole('button')[0])
      onPress.mock.calls[0][3]?.(2)
      act(() => jest.advanceTimersByTime(1000))
      expect(mockMetric).not.toHaveBeenCalled()
    })
  })
})
