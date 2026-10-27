import {renderHook} from '@testing-library/react-native'

import {
  FakeElement,
  installFakeDom,
} from '#/components/Gallery/__tests__/fakeDom'
import {useKeyboardHandlers} from '#/components/Gallery/useKeyboardHandlers.web'

jest.mock('#/env', () => ({IS_WEB_SAFARI: false}))

let dom: ReturnType<typeof installFakeDom>
let scroller: FakeElement
let button: FakeElement
let input: FakeElement
let outside: FakeElement
let scrollTo: jest.Mock
let onSettle: jest.Mock

beforeEach(() => {
  dom = installFakeDom()
  scroller = new FakeElement()
  button = scroller.append(new FakeElement('BUTTON'))
  input = scroller.append(new FakeElement('INPUT'))
  outside = new FakeElement('BUTTON')
  scrollTo = jest.fn()
  onSettle = jest.fn()
})

afterEach(() => {
  dom.restore()
})

function setup({itemCount = 3, current = 0} = {}) {
  const currentIndexRef = {current}
  const hook = renderHook(
    (props: {itemCount: number; resetKey: string}) =>
      useKeyboardHandlers({
        scrollRef: {current: {getScrollableNode: () => scroller}},
        itemWidthsRef: {
          current: new Map([
            [0, 200],
            [1, 200],
            [2, 200],
          ]),
        },
        currentIndexRef,
        scrollTo,
        onSettle,
        itemCount: props.itemCount,
        resetKey: props.resetKey,
      }),
    {initialProps: {itemCount, resetKey: 'abc'}},
  )
  return {...hook, currentIndexRef}
}

function press(key: string, target: FakeElement, extra = {}) {
  dom.document.activeElement = target
  return dom.window.dispatch('keydown', {key, target, ...extra})
}

describe('useKeyboardHandlers (web)', () => {
  it('moves between items with the arrow keys', () => {
    setup()
    const e = press('ArrowRight', button)
    expect(e.preventDefault).toHaveBeenCalled()
    expect(dom.frames).toHaveLength(1)
  })

  it('stops at either end', () => {
    setup({current: 0})
    expect(press('ArrowLeft', button).preventDefault).not.toHaveBeenCalled()
    dom.window.listeners.clear()
    setup({current: 2})
    expect(press('ArrowRight', button).preventDefault).not.toHaveBeenCalled()
  })

  it('does nothing for a single item', () => {
    setup({itemCount: 1})
    expect(dom.window.listenerCount('keydown')).toBe(0)
  })

  it('ignores keys when focus is outside the gallery', () => {
    setup()
    expect(press('ArrowRight', outside).preventDefault).not.toHaveBeenCalled()
  })

  it('leaves arrow keys to text fields inside an item', () => {
    setup()
    const e = press('ArrowRight', input)
    expect(e.preventDefault).not.toHaveBeenCalled()
    expect(dom.frames).toHaveLength(0)
  })

  it.each([
    ['TEXTAREA', {}],
    ['SELECT', {}],
    ['DIV', {isContentEditable: true}],
    ['DIV', {attributes: {role: 'slider'}}],
    ['DIV', {attributes: {role: 'textbox'}}],
  ])('leaves arrow keys to %s %j', (tag, props) => {
    setup()
    const el = scroller.append(Object.assign(new FakeElement(tag), props))
    expect(press('ArrowLeft', el).preventDefault).not.toHaveBeenCalled()
    expect(press('ArrowRight', el).preventDefault).not.toHaveBeenCalled()
  })

  it('leaves arrow keys to text fields nested in a control', () => {
    setup()
    const wrapper = scroller.append(new FakeElement('DIV'))
    wrapper.attributes.role = 'textbox'
    const inner = wrapper.append(new FakeElement('SPAN'))
    expect(press('ArrowRight', inner).preventDefault).not.toHaveBeenCalled()
  })

  it('ignores events something else already handled', () => {
    setup()
    const e = press('ArrowRight', button, {defaultPrevented: true})
    expect(e.preventDefault).not.toHaveBeenCalled()
  })

  it.each(['metaKey', 'ctrlKey', 'altKey', 'shiftKey'])(
    'ignores %s combinations',
    modifier => {
      setup()
      const e = press('ArrowRight', button, {[modifier]: true})
      expect(e.preventDefault).not.toHaveBeenCalled()
    },
  )

  it('stops listening on unmount', () => {
    const {unmount} = setup()
    expect(dom.window.listenerCount('keydown')).toBe(1)
    unmount()
    expect(dom.window.listenerCount('keydown')).toBe(0)
  })

  it('stops listening when items drop to one', () => {
    const {rerender} = setup()
    rerender({itemCount: 1, resetKey: 'abc'})
    expect(dom.window.listenerCount('keydown')).toBe(0)
  })

  it('settles on the new item', () => {
    setup()
    press('ArrowRight', button)
    dom.flushFrames()
    expect(onSettle).toHaveBeenCalledWith(1)
  })

  it('drops an in-flight move when the items change at the same count', () => {
    const {rerender} = setup()
    press('ArrowRight', button)
    expect(dom.frames.length).toBeGreaterThan(0)
    // replaced or reordered, but still three items
    rerender({itemCount: 3, resetKey: 'reordered'})
    dom.flushFrames()
    expect(onSettle).not.toHaveBeenCalled()
  })
})
