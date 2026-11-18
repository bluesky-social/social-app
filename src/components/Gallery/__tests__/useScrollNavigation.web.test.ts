import {renderHook} from '@testing-library/react-native'

import {
  FakeElement,
  installFakeDom,
} from '#/components/Gallery/__tests__/fakeDom'
import {useScrollNavigation} from '#/components/Gallery/useScrollNavigation.web'

let mockSafari = false

jest.mock('#/env', () => ({
  get IS_WEB_SAFARI() {
    return mockSafari
  },
}))

let dom: ReturnType<typeof installFakeDom>
let scroller: FakeElement
let onNavigate: jest.Mock

/* Three 200px items, 208px apart: the leading item changes at 104 and 312. */
function setup() {
  const currentIndexRef = {current: 0}
  // Like the gallery, only reports changes and remembers the index
  onNavigate = jest.fn((index: number) => {
    currentIndexRef.current = index
  })
  renderHook(() =>
    useScrollNavigation({
      scrollRef: {current: {getScrollableNode: () => scroller}},
      itemWidthsRef: {
        current: new Map([
          [0, 200],
          [1, 200],
          [2, 200],
        ]),
      },
      currentIndexRef,
      itemCount: 3,
      resetKey: 'abc',
      onNavigate,
    }),
  )
  return {currentIndexRef}
}

function scrollTo(offset: number) {
  scroller.scrollLeft = offset
  scroller.dispatch('scroll')
}

beforeEach(() => {
  jest.useFakeTimers()
  mockSafari = false
  dom = installFakeDom()
  scroller = new FakeElement()
})

afterEach(() => {
  dom.restore()
  jest.useRealTimers()
})

describe('useScrollNavigation (web)', () => {
  it('reports each item a touch scrolls to, including its momentum', () => {
    setup()
    scroller.dispatch('touchstart')
    scrollTo(50)
    scrollTo(150)
    scrollTo(200)
    scroller.dispatch('touchend')
    scrollTo(350)
    expect(onNavigate.mock.calls).toEqual([[1], [2]])
  })

  it("doesn't report scrolls without touch or wheel input", () => {
    setup()
    // Mount, resizes, scrollIntoView, focus, and the other handlers' tweens
    scrollTo(150)
    scrollTo(350)
    expect(onNavigate).not.toHaveBeenCalled()

    scroller.dispatch('touchstart')
    scroller.dispatch('touchend')
    jest.advanceTimersByTime(150)
    scrollTo(150)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it("doesn't report a tap's focus scrolling the tapped item into view", () => {
    setup()
    scroller.dispatch('touchstart')
    scroller.dispatch('touchend')
    scrollTo(150)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('keeps reporting while a finger is down, however long it pauses', () => {
    setup()
    scroller.dispatch('touchstart')
    jest.advanceTimersByTime(1000)
    scrollTo(150)
    expect(onNavigate.mock.calls).toEqual([[1]])
  })

  it('reports Chrome/Firefox wheel scrolling until it goes idle', () => {
    setup()
    scroller.dispatch('wheel', {deltaX: 50, deltaY: 0})
    scrollTo(150)
    jest.advanceTimersByTime(149)
    scrollTo(350)
    jest.advanceTimersByTime(150)
    scrollTo(150)
    expect(onNavigate.mock.calls).toEqual([[1], [2]])
  })

  it.each([
    ['wheel', 'keydown'],
    ['wheel', 'mousedown'],
    ['touch', 'keydown'],
    ['touch', 'mousedown'],
  ])('hands %s scrolling over to %s navigation', (input, event) => {
    const {currentIndexRef} = setup()
    if (input === 'wheel') {
      scroller.dispatch('wheel', {deltaX: 50, deltaY: 0})
    } else {
      scroller.dispatch('touchstart')
    }
    scrollTo(150)
    if (input === 'touch') scroller.dispatch('touchend')
    expect(onNavigate.mock.calls).toEqual([[1]])
    onNavigate.mockClear()

    jest.advanceTimersByTime(30)
    scroller.dispatch(event, {key: 'ArrowRight', button: 0})
    // The other handler's animation must not report intermediate items.
    scrollTo(350)
    currentIndexRef.current = 2
    // A clamped final offset must not undo that handler's settled index.
    scrollTo(300)
    expect(onNavigate).not.toHaveBeenCalled()
    expect(currentIndexRef.current).toBe(2)

    // A fresh wheel still takes over and reports navigation normally.
    scroller.dispatch('wheel', {deltaX: -50, deltaY: 0})
    scrollTo(150)
    expect(onNavigate.mock.calls).toEqual([[1]])
  })

  it("doesn't count a vertical wheel, unless Shift turns it sideways", () => {
    setup()
    scroller.dispatch('wheel', {deltaX: 0, deltaY: 50})
    scrollTo(150)
    expect(onNavigate).not.toHaveBeenCalled()

    scroller.dispatch('wheel', {deltaX: 0, deltaY: 50, shiftKey: true})
    scrollTo(350)
    expect(onNavigate.mock.calls).toEqual([[2]])
  })

  it('keeps reporting Shift+wheel while Shift is held', () => {
    setup()
    scroller.dispatch('wheel', {deltaX: 0, deltaY: 50, shiftKey: true})
    scrollTo(50)
    scroller.dispatch('keydown', {key: 'Shift', repeat: true})
    scrollTo(150)
    expect(onNavigate.mock.calls).toEqual([[1]])
  })

  it("leaves Safari's wheel to its own handler", () => {
    mockSafari = true
    setup()
    scroller.dispatch('wheel', {deltaX: 50, deltaY: 0})
    scrollTo(150)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it("doesn't repeat an item another handler already reported", () => {
    const {currentIndexRef} = setup()
    // e.g. an arrow key settled on the second item
    currentIndexRef.current = 1
    scroller.dispatch('touchstart')
    scrollTo(150)
    scrollTo(160)
    expect(onNavigate).not.toHaveBeenCalled()
    scrollTo(0)
    expect(onNavigate.mock.calls).toEqual([[0]])
  })
})
