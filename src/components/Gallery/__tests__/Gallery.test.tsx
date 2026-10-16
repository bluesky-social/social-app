import {createRef, Fragment, useState} from 'react'
import {
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import {act, fireEvent, render, screen} from '@testing-library/react-native'

import * as Gallery from '#/components/Gallery'

const mockEnv = {IS_WEB: false, IS_ANDROID: false}
const mockA11y = {screenReaderEnabled: false}

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('#/env', () => ({
  get IS_WEB() {
    return mockEnv.IS_WEB
  },
  get IS_ANDROID() {
    return mockEnv.IS_ANDROID
  },
  IS_NATIVE: true,
  IS_WEB_SAFARI: false,
}))
jest.mock('#/state/a11y', () => ({useA11y: () => mockA11y}))
jest.mock('#/view/shell/BlockDrawerGesture', () => ({
  BlockDrawerGesture: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  web: () => undefined,
}))

const scrollTo = (ScrollView.prototype as unknown as {scrollTo: jest.Mock})
  .scrollTo

beforeEach(() => {
  mockEnv.IS_WEB = false
  mockEnv.IS_ANDROID = false
  mockA11y.screenReaderEnabled = false
  scrollTo.mockClear()
})

type MeasureLayoutOnSuccess = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void

function flat(style: StyleProp<ViewStyle>): ViewStyle {
  return StyleSheet.flatten(style) ?? {}
}

function layout(testID: string, width: number, height: number) {
  fireEvent(screen.getByTestId(testID), 'layout', {
    nativeEvent: {layout: {x: 0, y: 0, width, height}},
  })
}

function rootHeight(testID = 'gallery') {
  return flat(screen.getByTestId(testID).props.style as StyleProp<ViewStyle>)
    .height
}

function card(id: string, width: number, height: number) {
  return (
    <Gallery.Item key={id} testID={id} label={id}>
      <View style={{width, height}} />
    </Gallery.Item>
  )
}

function scrollView() {
  return screen.UNSAFE_getByType(ScrollView)
}

function scrollEvent(offset: number) {
  return {
    nativeEvent: {
      contentOffset: {x: offset, y: 0},
      contentSize: {width: 624, height: 100},
      layoutMeasurement: {width: 300, height: 100},
    },
  }
}

function scrollBy(offset: number) {
  fireEvent.scroll(scrollView(), scrollEvent(offset))
}

/** A drag that stops dead, with no momentum phase */
function userScroll(offset: number) {
  fireEvent(scrollView(), 'scrollBeginDrag', scrollEvent(0))
  scrollBy(offset)
  fireEvent(scrollView(), 'scrollEndDrag', {
    nativeEvent: {...scrollEvent(offset).nativeEvent, velocity: {x: 0, y: 0}},
  })
}

/**
 * Three 200px items, in a 300px viewport. Item slots are 208px apart, so the
 * active index changes at offsets 104 and 312.
 */
function threeCards({
  onIndexChange,
  ref,
}: {
  onIndexChange?: (index: number, previous: number) => void
  ref?: React.Ref<Gallery.GalleryRef>
} = {}) {
  const result = render(
    <Gallery.Root
      ref={ref}
      testID="gallery"
      label="Cards"
      onIndexChange={onIndexChange}>
      {card('a', 200, 100)}
      {card('b', 200, 100)}
      {card('c', 200, 100)}
    </Gallery.Root>,
  )
  layout('gallery', 300, 100)
  layout('a', 200, 100)
  layout('b', 200, 100)
  layout('c', 200, 100)
  return result
}

describe('Gallery sizing', () => {
  it('renders non-image children at their own sizes', () => {
    render(
      <Gallery.Root testID="gallery" label="Mixed">
        {card('small', 100, 80)}
        {card('medium', 220, 160)}
        {card('tall', 140, 240)}
      </Gallery.Root>,
    )
    expect(screen.getByTestId('small')).toBeTruthy()
    expect(screen.getByTestId('medium')).toBeTruthy()
    expect(screen.getByTestId('tall')).toBeTruthy()
    // Items are never given a width or height by the gallery
    for (const id of ['small', 'medium', 'tall']) {
      const style = flat(screen.getByTestId(id).props.style)
      expect(style.width).toBeUndefined()
      expect(style.height).toBeUndefined()
    }
  })

  it('has no explicit height before anything is measured', () => {
    render(
      <Gallery.Root testID="gallery" label="Mixed">
        {card('a', 100, 80)}
      </Gallery.Root>,
    )
    expect(rootHeight()).toBeUndefined()
  })

  it('fits the tallest child once measured, whatever the order', () => {
    render(
      <Gallery.Root testID="gallery" label="Mixed">
        {card('small', 100, 80)}
        {card('tall', 140, 240)}
        {card('medium', 220, 160)}
      </Gallery.Root>,
    )
    layout('small', 100, 80)
    expect(rootHeight()).toBe(80)
    layout('tall', 140, 240)
    layout('medium', 220, 160)
    expect(rootHeight()).toBe(240)
  })

  it('does not clamp or crop a child wider than the viewport', () => {
    render(
      <Gallery.Root testID="gallery" label="Wide">
        {card('wide', 900, 100)}
      </Gallery.Root>,
    )
    layout('gallery', 300, 100)
    layout('wide', 900, 100)
    expect(rootHeight()).toBe(100)
    const style = flat(screen.getByTestId('wide').props.style)
    expect(style.width).toBeUndefined()
  })

  it('follows a child growing and shrinking', () => {
    render(
      <Gallery.Root testID="gallery" label="Dynamic">
        {card('a', 100, 80)}
        {card('b', 100, 120)}
      </Gallery.Root>,
    )
    layout('a', 100, 80)
    layout('b', 100, 120)
    expect(rootHeight()).toBe(120)
    layout('a', 100, 300)
    expect(rootHeight()).toBe(300)
    layout('a', 100, 50)
    expect(rootHeight()).toBe(120)
  })

  it('follows a child being removed', () => {
    const {rerender} = render(
      <Gallery.Root testID="gallery" label="Dynamic">
        {card('a', 100, 80)}
        {card('b', 100, 300)}
      </Gallery.Root>,
    )
    layout('a', 100, 80)
    layout('b', 100, 300)
    expect(rootHeight()).toBe(300)
    rerender(
      <Gallery.Root testID="gallery" label="Dynamic">
        {card('a', 100, 80)}
      </Gallery.Root>,
    )
    expect(rootHeight()).toBe(80)
  })

  it('forgets measurements of removed keys', () => {
    const {rerender} = render(
      <Gallery.Root testID="gallery" label="Dynamic">
        {card('a', 100, 80)}
      </Gallery.Root>,
    )
    layout('a', 100, 80)
    expect(rootHeight()).toBe(80)
    rerender(<Gallery.Root testID="gallery" label="Dynamic" />)
    rerender(
      <Gallery.Root testID="gallery" label="Dynamic">
        {card('a', 100, 80)}
      </Gallery.Root>,
    )
    // measured again from scratch, not from a stale entry
    expect(rootHeight()).toBeUndefined()
  })

  it('has no height for an empty gallery', () => {
    render(<Gallery.Root testID="gallery" label="Empty" />)
    expect(rootHeight()).toBeUndefined()
    expect(screen.queryByTestId('a')).toBeNull()
  })

  it('renders a single item', () => {
    render(
      <Gallery.Root testID="gallery" label="One">
        {card('only', 120, 90)}
      </Gallery.Root>,
    )
    layout('only', 120, 90)
    expect(screen.getByTestId('only')).toBeTruthy()
    expect(rootHeight()).toBe(90)
  })

  it('flattens fragments, arrays and conditional nulls', () => {
    const show = false
    render(
      <Gallery.Root testID="gallery" label="Flatten">
        {card('a', 100, 50)}
        {show ? card('hidden', 100, 50) : null}
        <>
          {card('b', 100, 60)}
          <Fragment>{card('c', 100, 70)}</Fragment>
        </>
        {[card('d', 100, 80), card('e', 100, 90)]}
        {false}
        {undefined}
      </Gallery.Root>,
    )
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      expect(screen.getByTestId(id)).toBeTruthy()
    }
    expect(screen.queryByTestId('hidden')).toBeNull()
  })
})

describe('Gallery accessibility', () => {
  it('labels the carousel and its slides', () => {
    render(
      <Gallery.Root testID="gallery" label="Featured items">
        {card('a', 100, 50)}
      </Gallery.Root>,
    )
    expect(scrollView().props['aria-label']).toBe('Featured items')
    expect(scrollView().props['aria-roledescription']).toBe('carousel')
    const slide = screen.getByTestId('a')
    expect(slide.props['aria-label']).toBe('a')
    expect(slide.props['aria-roledescription']).toBe('slide')
  })
})

describe('Gallery.Item', () => {
  it('throws outside of a Root', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <Gallery.Item>
          <View />
        </Gallery.Item>,
      ),
    ).toThrow('Gallery.Item must be rendered inside Gallery.Root')
    spy.mockRestore()
  })

  it('passes focus props to a render function', () => {
    mockEnv.IS_WEB = true
    const received: Gallery.ItemFocusProps[] = []
    render(
      <Gallery.Root testID="gallery" label="Interactive">
        {[0, 1].map(i => (
          <Gallery.Item key={i} testID={`item-${i}`}>
            {focusProps => {
              received[i] = focusProps
              return (
                <Pressable
                  testID={`button-${i}`}
                  accessibilityRole="button"
                  accessibilityLabel="Button"
                  accessibilityHint=""
                  ref={focusProps.focusRef}
                  tabIndex={focusProps.tabIndex}
                  onFocus={focusProps.onFocus}
                />
              )
            }}
          </Gallery.Item>
        ))}
      </Gallery.Root>,
    )
    expect(received[0].tabIndex).toBe(0)
    expect(received[1].tabIndex).toBe(-1)
    // The slide itself is not a second tab stop
    expect(screen.getByTestId('item-0').props.tabIndex).toBeUndefined()
    expect(screen.getByTestId('button-0').props.tabIndex).toBe(0)
  })

  it('uses the slide as the focus target for plain children', () => {
    mockEnv.IS_WEB = true
    render(
      <Gallery.Root testID="gallery" label="Plain">
        {card('a', 100, 50)}
        {card('b', 100, 50)}
      </Gallery.Root>,
    )
    expect(screen.getByTestId('a').props.tabIndex).toBe(0)
    expect(screen.getByTestId('b').props.tabIndex).toBe(-1)
  })

  it('moves the roving tab stop on focus, without reporting navigation', () => {
    mockEnv.IS_WEB = true
    const onIndexChange = jest.fn()
    render(
      <Gallery.Root
        testID="gallery"
        label="Plain"
        onIndexChange={onIndexChange}>
        {card('a', 100, 50)}
        {card('b', 100, 50)}
      </Gallery.Root>,
    )
    fireEvent(screen.getByTestId('b'), 'focus')
    expect(screen.getByTestId('a').props.tabIndex).toBe(-1)
    expect(screen.getByTestId('b').props.tabIndex).toBe(0)
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('does not report navigation when a render-function target is focused', () => {
    mockEnv.IS_WEB = true
    const onIndexChange = jest.fn()
    render(
      <Gallery.Root
        testID="gallery"
        label="Images"
        onIndexChange={onIndexChange}>
        {[0, 1].map(i => (
          <Gallery.Item key={i}>
            {({focusRef, tabIndex, onFocus}) => (
              <Pressable
                testID={`button-${i}`}
                accessibilityRole="button"
                accessibilityLabel="Button"
                accessibilityHint=""
                ref={focusRef}
                tabIndex={tabIndex}
                onFocus={onFocus}
              />
            )}
          </Gallery.Item>
        ))}
      </Gallery.Root>,
    )
    fireEvent(screen.getByTestId('button-1'), 'focus')
    expect(screen.getByTestId('button-1').props.tabIndex).toBe(0)
    expect(screen.getByTestId('button-0').props.tabIndex).toBe(-1)
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('imposes no roving tab stops with a screen reader', () => {
    mockEnv.IS_WEB = true
    mockA11y.screenReaderEnabled = true
    render(
      <Gallery.Root testID="gallery" label="Plain">
        {card('a', 100, 50)}
        {card('b', 100, 50)}
      </Gallery.Root>,
    )
    expect(screen.getByTestId('a').props.tabIndex).toBeUndefined()
    expect(screen.getByTestId('b').props.tabIndex).toBeUndefined()
  })

  it('does not set tab stops on native', () => {
    render(
      <Gallery.Root testID="gallery" label="Plain">
        {card('a', 100, 50)}
        {card('b', 100, 50)}
      </Gallery.Root>,
    )
    expect(screen.getByTestId('a').props.tabIndex).toBeUndefined()
    expect(screen.getByTestId('b').props.tabIndex).toBeUndefined()
  })
})

describe('Gallery navigation callback', () => {
  it('is not called on mount or initial layout', () => {
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('reports a user swipe with the previous index', () => {
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    userScroll(120)
    expect(onIndexChange).toHaveBeenCalledTimes(1)
    expect(onIndexChange).toHaveBeenLastCalledWith(1, 0)
    userScroll(330)
    expect(onIndexChange).toHaveBeenLastCalledWith(2, 1)
    userScroll(0)
    expect(onIndexChange).toHaveBeenLastCalledWith(0, 2)
  })

  it('reports swiping across the gap boundaries', () => {
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    userScroll(103)
    expect(onIndexChange).not.toHaveBeenCalled()
    userScroll(104)
    expect(onIndexChange).toHaveBeenCalledWith(1, 0)
  })

  it('reports scrolling during momentum', () => {
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    fireEvent(scrollView(), 'scrollBeginDrag', scrollEvent(0))
    fireEvent(scrollView(), 'scrollEndDrag', {
      nativeEvent: {...scrollEvent(0).nativeEvent, velocity: {x: 2, y: 0}},
    })
    fireEvent(scrollView(), 'momentumScrollBegin', scrollEvent(0))
    scrollBy(120)
    fireEvent(scrollView(), 'momentumScrollEnd', scrollEvent(120))
    expect(onIndexChange).toHaveBeenCalledWith(1, 0)
  })

  it('reports momentum after a drag that reports no velocity', () => {
    // Android can omit velocity but still coast
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    fireEvent(scrollView(), 'scrollBeginDrag', scrollEvent(0))
    fireEvent(scrollView(), 'scrollEndDrag', scrollEvent(0))
    fireEvent(scrollView(), 'momentumScrollBegin', scrollEvent(0))
    scrollBy(120)
    scrollBy(330)
    fireEvent(scrollView(), 'momentumScrollEnd', scrollEvent(330))
    expect(onIndexChange).toHaveBeenNthCalledWith(1, 1, 0)
    expect(onIndexChange).toHaveBeenNthCalledWith(2, 2, 1)
  })

  it('counts the final offset of a drag that ends elsewhere', () => {
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    fireEvent(scrollView(), 'scrollBeginDrag', scrollEvent(0))
    // no scroll event got there first
    fireEvent(scrollView(), 'scrollEndDrag', scrollEvent(120))
    expect(onIndexChange).toHaveBeenCalledWith(1, 0)
  })

  it('counts the final offset of momentum', () => {
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    fireEvent(scrollView(), 'scrollBeginDrag', scrollEvent(0))
    fireEvent(scrollView(), 'scrollEndDrag', scrollEvent(0))
    fireEvent(scrollView(), 'momentumScrollBegin', scrollEvent(0))
    fireEvent(scrollView(), 'momentumScrollEnd', scrollEvent(330))
    expect(onIndexChange).toHaveBeenCalledWith(2, 0)
  })

  it('goes quiet after a drag with no velocity and no momentum', () => {
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    fireEvent(scrollView(), 'scrollBeginDrag', scrollEvent(0))
    fireEvent(scrollView(), 'scrollEndDrag', scrollEvent(0))
    // a later clamp after a layout change is not a swipe
    scrollBy(330)
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('goes quiet once momentum ends', () => {
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    fireEvent(scrollView(), 'scrollBeginDrag', scrollEvent(0))
    fireEvent(scrollView(), 'scrollEndDrag', scrollEvent(0))
    fireEvent(scrollView(), 'momentumScrollBegin', scrollEvent(0))
    fireEvent(scrollView(), 'momentumScrollEnd', scrollEvent(0))
    scrollBy(330)
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('does not report scrolls the user did not make', () => {
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    // e.g. the platform clamping the offset after a layout change
    scrollBy(330)
    expect(onIndexChange).not.toHaveBeenCalled()
    userScroll(0)
    // the silent scroll still moved the active index
    expect(onIndexChange).toHaveBeenCalledWith(0, 2)
  })

  it('stops reporting after a user scroll ends', () => {
    const onIndexChange = jest.fn()
    threeCards({onIndexChange})
    userScroll(120)
    onIndexChange.mockClear()
    scrollBy(330)
    expect(onIndexChange).not.toHaveBeenCalled()
  })
})

describe('Gallery ref', () => {
  it('scrolls the minimum distance to reveal an item', () => {
    const ref = createRef<Gallery.GalleryRef>()
    threeCards({ref})
    act(() => ref.current?.scrollIntoView(1))
    // item b spans 208-408 and the viewport is 300 wide
    expect(scrollTo).toHaveBeenLastCalledWith({x: 108, animated: false})
  })

  it('reveals the last item flush with the end', () => {
    const ref = createRef<Gallery.GalleryRef>()
    threeCards({ref})
    act(() => ref.current?.scrollIntoView(2))
    expect(scrollTo).toHaveBeenLastCalledWith({x: 316, animated: false})
  })

  it('does not scroll to an item already in view', () => {
    const ref = createRef<Gallery.GalleryRef>()
    threeCards({ref})
    act(() => ref.current?.scrollIntoView(0))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('does not report navigation', () => {
    const onIndexChange = jest.fn()
    const ref = createRef<Gallery.GalleryRef>()
    threeCards({ref, onIndexChange})
    act(() => ref.current?.scrollIntoView(2))
    // the resulting scroll event is not the user either
    scrollBy(324)
    expect(onIndexChange).not.toHaveBeenCalled()
    // but the active index did move
    userScroll(0)
    expect(onIndexChange).toHaveBeenCalledWith(0, 2)
  })

  it('ignores invalid indices', () => {
    const ref = createRef<Gallery.GalleryRef>()
    threeCards({ref})
    act(() => {
      ref.current?.scrollIntoView(-1)
      ref.current?.scrollIntoView(3)
      ref.current?.scrollIntoView(0.5)
      ref.current?.scrollIntoView(NaN)
    })
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('is safe on an empty gallery', () => {
    const ref = createRef<Gallery.GalleryRef>()
    render(<Gallery.Root ref={ref} testID="gallery" label="Empty" />)
    act(() => ref.current?.scrollIntoView(0))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('uses the viewport as it is now, after a resize', () => {
    const ref = createRef<Gallery.GalleryRef>()
    threeCards({ref})
    const reveal = ref.current?.scrollIntoView
    layout('gallery', 600, 100)
    // the same function from before the resize sees the new width
    act(() => reveal?.(1))
    expect(scrollTo).not.toHaveBeenCalled()
    layout('gallery', 300, 100)
    act(() => reveal?.(1))
    expect(scrollTo).toHaveBeenLastCalledWith({x: 108, animated: false})
  })

  it('reveals using measurements that arrived late', () => {
    const ref = createRef<Gallery.GalleryRef>()
    render(
      <Gallery.Root ref={ref} testID="gallery" label="Late">
        {card('a', 200, 100)}
        {card('b', 200, 100)}
      </Gallery.Root>,
    )
    layout('gallery', 300, 100)
    act(() => ref.current?.scrollIntoView(1))
    // nothing known about widths yet, so there's nowhere further to scroll
    expect(scrollTo).not.toHaveBeenCalled()
    layout('a', 200, 100)
    layout('b', 200, 100)
    act(() => ref.current?.scrollIntoView(1))
    expect(scrollTo).toHaveBeenLastCalledWith({x: 108, animated: false})
  })

  it('aligns the leading edge of an item wider than the viewport', () => {
    const ref = createRef<Gallery.GalleryRef>()
    render(
      <Gallery.Root ref={ref} testID="gallery" label="Wide">
        {card('a', 100, 100)}
        {card('wide', 900, 100)}
      </Gallery.Root>,
    )
    layout('gallery', 300, 100)
    layout('a', 100, 100)
    layout('wide', 900, 100)
    act(() => ref.current?.scrollIntoView(1))
    expect(scrollTo).toHaveBeenLastCalledWith({x: 108, animated: false})
  })

  it('is cleared on unmount', () => {
    const ref = createRef<Gallery.GalleryRef>()
    const {unmount} = threeCards({ref})
    expect(ref.current).not.toBeNull()
    unmount()
    expect(ref.current).toBeNull()
  })

  it('supports callback refs', () => {
    const calls: (Gallery.GalleryRef | null)[] = []
    const {unmount} = threeCards({ref: node => void calls.push(node)})
    expect(calls[0]).toEqual({scrollIntoView: expect.any(Function)})
    unmount()
    expect(calls[calls.length - 1]).toBeNull()
  })
})

describe('Gallery reconciliation', () => {
  function Harness({
    ids,
    onIndexChange,
  }: {
    ids: string[]
    onIndexChange: (index: number, previous: number) => void
  }) {
    return (
      <Gallery.Root
        testID="gallery"
        label="Cards"
        onIndexChange={onIndexChange}>
        {ids.map(id => card(id, 200, 100))}
      </Gallery.Root>
    )
  }

  function setup(ids: string[]) {
    const onIndexChange = jest.fn()
    const result = render(<Harness ids={ids} onIndexChange={onIndexChange} />)
    layout('gallery', 300, 100)
    for (const id of ids) layout(id, 200, 100)
    return {...result, onIndexChange}
  }

  it('keeps the active item through a reorder', () => {
    const {rerender, onIndexChange} = setup(['a', 'b', 'c'])
    userScroll(330) // on c
    onIndexChange.mockClear()
    rerender(<Harness ids={['c', 'a', 'b']} onIndexChange={onIndexChange} />)
    expect(onIndexChange).not.toHaveBeenCalled()
    // c is now first, so it's where we're coming from
    userScroll(120)
    expect(onIndexChange).toHaveBeenCalledWith(1, 0)
  })

  it('stays in range when the active item is removed', () => {
    const {rerender, onIndexChange} = setup(['a', 'b', 'c'])
    userScroll(330) // on c
    onIndexChange.mockClear()
    rerender(<Harness ids={['a', 'b']} onIndexChange={onIndexChange} />)
    expect(onIndexChange).not.toHaveBeenCalled()
    userScroll(0)
    expect(onIndexChange).toHaveBeenCalledWith(0, 1)
  })

  it('is silent when items are added', () => {
    const {rerender, onIndexChange} = setup(['a', 'b'])
    rerender(
      <Harness ids={['x', 'a', 'b', 'y']} onIndexChange={onIndexChange} />,
    )
    layout('x', 200, 100)
    layout('y', 200, 100)
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('is silent when everything is removed', () => {
    const {rerender, onIndexChange} = setup(['a', 'b'])
    userScroll(120)
    onIndexChange.mockClear()
    rerender(<Harness ids={[]} onIndexChange={onIndexChange} />)
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('moves the roving tab stop with a reordered active item', () => {
    mockEnv.IS_WEB = true
    function Reorderable() {
      const [ids, setIds] = useState(['a', 'b'])
      return (
        <>
          <Pressable
            testID="reverse"
            accessibilityRole="button"
            accessibilityLabel="Reverse"
            accessibilityHint=""
            onPress={() => setIds(['b', 'a'])}
          />
          <Gallery.Root testID="gallery" label="Cards">
            {ids.map(id => (
              <Gallery.Item key={id} testID={id}>
                <Text>{id}</Text>
              </Gallery.Item>
            ))}
          </Gallery.Root>
        </>
      )
    }
    render(<Reorderable />)
    fireEvent(screen.getByTestId('b'), 'focus')
    expect(screen.getByTestId('b').props.tabIndex).toBe(0)
    fireEvent.press(screen.getByTestId('reverse'))
    // b is still the target, now in first position
    expect(screen.getByTestId('b').props.tabIndex).toBe(0)
    expect(screen.getByTestId('a').props.tabIndex).toBe(-1)
  })
})

describe('Gallery.Bleed', () => {
  it('requires a single element', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Gallery.Bleed>{null}</Gallery.Bleed>)).toThrow(
      'Gallery.Bleed children must be a single React element',
    )
    spy.mockRestore()
  })

  it('shares one context with useGalleryBleed', () => {
    let seen = 0
    function Probe() {
      seen = Gallery.useGalleryBleed().bleedWidth
      return null
    }
    render(
      <Gallery.Bleed>
        <View testID="bleed">
          <Probe />
        </View>
      </Gallery.Bleed>,
    )
    expect(seen).toBe(0)
    fireEvent(screen.getByTestId('bleed'), 'layout', {
      nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 50}},
    })
    expect(seen).toBe(400)
  })

  it('clips the bleed container and keeps its own onLayout', () => {
    const onLayout = jest.fn()
    render(
      <Gallery.Bleed>
        <View testID="bleed" onLayout={onLayout} />
      </Gallery.Bleed>,
    )
    fireEvent(screen.getByTestId('bleed'), 'layout', {
      nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 50}},
    })
    expect(onLayout).toHaveBeenCalledTimes(1)
  })

  it('extends the scroll view to the container, with matching insets', () => {
    const viewProto = View.prototype as unknown as {
      measureLayout: (
        relativeTo: unknown,
        onSuccess: MeasureLayoutOnSuccess,
      ) => void
    }
    const measureLayout = jest
      .spyOn(viewProto, 'measureLayout')
      .mockImplementation((_relativeTo, onSuccess) => {
        onSuccess(16, 0, 368, 100)
      })
    render(
      <Gallery.Bleed>
        <View testID="bleed">
          <Gallery.Root testID="gallery" label="Bleeding">
            {card('a', 200, 100)}
          </Gallery.Root>
        </View>
      </Gallery.Bleed>,
    )
    fireEvent(screen.getByTestId('bleed'), 'layout', {
      nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 100}},
    })
    layout('gallery', 368, 100)
    const style = flat(scrollView().props.style)
    expect(style.width).toBe(400)
    expect(style.marginLeft).toBe(-16)
    const content = flat(scrollView().props.contentContainerStyle)
    expect(content.paddingLeft).toBe(16)
    expect(content.paddingRight).toBe(400 - 16 - 368)
    measureLayout.mockRestore()
  })

  it('measures its own viewport without a bleed', () => {
    render(
      <Gallery.Root testID="gallery" label="Local">
        {card('a', 200, 100)}
      </Gallery.Root>,
    )
    layout('gallery', 250, 100)
    const style = flat(scrollView().props.style)
    expect(style.width).toBeUndefined()
    expect(style.marginLeft).toBeUndefined()
    const content = flat(scrollView().props.contentContainerStyle)
    expect(content.paddingLeft).toBe(0)
    expect(content.paddingRight).toBe(0)
  })
})

describe('Gallery scroll view', () => {
  it('does not stretch to fill constrained ancestors', () => {
    render(
      <Gallery.Root testID="gallery" label="Cards">
        {card('a', 100, 100)}
      </Gallery.Root>,
    )
    expect(flat(scrollView().props.style).flexGrow).toBe(0)
  })

  it('snaps back to the start on Android', () => {
    mockEnv.IS_ANDROID = true
    render(
      <Gallery.Root testID="gallery" label="Cards">
        {card('a', 100, 100)}
      </Gallery.Root>,
    )
    expect(scrollView().props.snapToOffsets).toEqual([0])
  })
})
