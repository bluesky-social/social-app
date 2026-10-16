import {renderHook} from '@testing-library/react-native'

import {
  FakeElement,
  installFakeDom,
} from '#/components/Gallery/__tests__/fakeDom'
import {usePointerHandlers} from '#/components/Gallery/usePointerHandlers.web'

jest.mock('#/env', () => ({IS_WEB_SAFARI: false}))

let dom: ReturnType<typeof installFakeDom>
let scroller: FakeElement
let button: FakeElement
let image: FakeElement
let input: FakeElement
let text: FakeElement
let scrollTo: jest.Mock
let onSettle: jest.Mock

beforeEach(() => {
  dom = installFakeDom()
  scroller = new FakeElement()
  scroller.scrollLeft = 100
  button = scroller.append(new FakeElement('BUTTON'))
  image = button.append(new FakeElement('IMG'))
  input = scroller.append(new FakeElement('INPUT'))
  text = scroller.append(new FakeElement('DIV'))
  scrollTo = jest.fn()
  onSettle = jest.fn()
})

afterEach(() => {
  dom.restore()
})

function setup({itemCount = 3} = {}) {
  return renderHook(
    (props: {itemCount: number; resetKey: string}) =>
      usePointerHandlers({
        scrollRef: {current: {getScrollableNode: () => scroller}},
        itemWidthsRef: {
          current: new Map([
            [0, 200],
            [1, 200],
            [2, 200],
          ]),
        },
        currentIndexRef: {current: 0},
        scrollTo,
        onSettle,
        itemCount: props.itemCount,
        resetKey: props.resetKey,
      }),
    {initialProps: {itemCount, resetKey: 'abc'}},
  )
}

function mouseDown(target: FakeElement, extra = {}) {
  return scroller.dispatch('mousedown', {
    target,
    button: 0,
    pageX: 200,
    ...extra,
  })
}

function drag(to: number) {
  dom.window.dispatch('mousemove', {pageX: to, timeStamp: 16})
}

function release() {
  dom.window.dispatch('mouseup', {})
}

describe('usePointerHandlers (web)', () => {
  it('does not prevent default on mousedown, so focus and selection work', () => {
    setup()
    const e = mouseDown(text)
    expect(e.preventDefault).not.toHaveBeenCalled()
  })

  it('scrolls with a drag, in the opposite direction', () => {
    setup()
    mouseDown(text)
    drag(150) // 50px left
    expect(scrollTo).toHaveBeenLastCalledWith(150)
    expect(scroller.style.cursor).toBe('grabbing')
    expect(dom.selection.removeAllRanges).toHaveBeenCalled()
  })

  it('does not start a drag below the threshold', () => {
    setup()
    mouseDown(button)
    drag(198)
    expect(scrollTo).not.toHaveBeenCalled()
    release()
    expect(scroller.style.cursor).toBe('grab')
  })

  it('lets a button be clicked without a drag', () => {
    setup()
    mouseDown(button)
    release()
    expect(scroller.listenerCount('click')).toBe(0)
  })

  it('lets an image button be dragged', () => {
    setup()
    mouseDown(image)
    drag(100)
    expect(scrollTo).toHaveBeenCalled()
  })

  it('suppresses the click that follows a drag, once', () => {
    setup()
    mouseDown(button)
    drag(100)
    release()
    const click = scroller.dispatch('click', {target: button})
    expect(click.stopPropagation).toHaveBeenCalled()
    expect(click.preventDefault).toHaveBeenCalled()
    const next = scroller.dispatch('click', {target: button})
    expect(next.stopPropagation).not.toHaveBeenCalled()
    expect(next.preventDefault).not.toHaveBeenCalled()
  })

  it('stops a dragged link from navigating', () => {
    setup()
    const anchor = scroller.append(new FakeElement('A'))
    const label = anchor.append(new FakeElement('SPAN'))
    mouseDown(label)
    drag(100)
    release()
    const click = scroller.dispatch('click', {target: label})
    expect(click.preventDefault).toHaveBeenCalled()
    expect(click.stopPropagation).toHaveBeenCalled()
  })

  it('lets a plain click on a link through', () => {
    setup()
    const anchor = scroller.append(new FakeElement('A'))
    mouseDown(anchor)
    release()
    const click = scroller.dispatch('click', {target: anchor})
    expect(click.preventDefault).not.toHaveBeenCalled()
    expect(click.stopPropagation).not.toHaveBeenCalled()
  })

  it('lets a click below the drag threshold through', () => {
    setup()
    mouseDown(button)
    drag(198)
    release()
    const click = scroller.dispatch('click', {target: button})
    expect(click.preventDefault).not.toHaveBeenCalled()
    expect(click.stopPropagation).not.toHaveBeenCalled()
  })

  it('does not swallow a later click if none followed the drag', async () => {
    setup()
    mouseDown(button)
    drag(100)
    release()
    await new Promise(resolve => setTimeout(resolve, 0))
    const click = scroller.dispatch('click', {target: button})
    expect(click.stopPropagation).not.toHaveBeenCalled()
    expect(click.preventDefault).not.toHaveBeenCalled()
  })

  it('leaves text fields alone', () => {
    setup()
    mouseDown(input)
    drag(100)
    expect(scrollTo).not.toHaveBeenCalled()
    expect(scroller.style.cursor).toBe('grab')
  })

  it('ignores non-primary buttons', () => {
    setup()
    mouseDown(text, {button: 2})
    drag(100)
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('prevents the native drag of images and links only', () => {
    setup()
    expect(
      scroller.dispatch('dragstart', {target: image}).preventDefault,
    ).toHaveBeenCalled()
    const anchor = scroller.append(new FakeElement('A'))
    expect(
      scroller.dispatch('dragstart', {target: anchor}).preventDefault,
    ).toHaveBeenCalled()
    expect(
      scroller.dispatch('dragstart', {target: text}).preventDefault,
    ).not.toHaveBeenCalled()
  })

  it('does nothing for a single item', () => {
    setup({itemCount: 1})
    expect(scroller.listenerCount('mousedown')).toBe(0)
  })

  it('cleans up on unmount', () => {
    const {unmount} = setup()
    expect(scroller.listenerCount('mousedown')).toBe(1)
    expect(dom.window.listenerCount('mousemove')).toBe(1)
    mouseDown(text)
    drag(100)
    unmount()
    expect(scroller.listenerCount('mousedown')).toBe(0)
    expect(scroller.listenerCount('dragstart')).toBe(0)
    expect(scroller.listenerCount('wheel')).toBe(0)
    expect(dom.window.listenerCount('mousemove')).toBe(0)
    expect(dom.window.listenerCount('mouseup')).toBe(0)
    expect(scroller.style.cursor).toBe('')
  })

  it('settles within the scrollable range', () => {
    setup()
    // Content only scrolls 100px, though the last item starts at 416
    scroller.scrollWidth = 400
    scroller.scrollLeft = 0
    mouseDown(text)
    drag(-5000)
    release()
    // The overscroll bounce runs first, then nothing else scrolls past the end
    dom.flushFrames()
    expect(onSettle).toHaveBeenCalledWith(2)
    for (const [offset] of scrollTo.mock.calls) {
      expect(offset).toBeLessThanOrEqual(100)
    }
  })

  it('drops an in-flight settle when the items change at the same count', () => {
    const {rerender} = setup()
    mouseDown(text)
    drag(150)
    release()
    expect(dom.frames.length).toBeGreaterThan(0)
    rerender({itemCount: 3, resetKey: 'replaced'})
    dom.flushFrames()
    expect(onSettle).not.toHaveBeenCalled()
  })

  it('settles normally when the items stay the same', () => {
    setup()
    mouseDown(text)
    drag(150)
    release()
    dom.flushFrames()
    expect(onSettle).toHaveBeenCalledTimes(1)
  })
})
