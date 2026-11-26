import {act, type PropsWithChildren} from 'react'
import {JSDOM} from 'jsdom'

jest.mock('#/state/a11y', () => ({
  useA11y: () => ({reduceMotionEnabled: true}),
}))

jest.mock('#/alf', () => ({
  atoms: {},
  useTheme: () => ({name: 'light', atoms: {}}),
}))

jest.mock('#/components/Portal', () => ({}))
jest.mock('#/components/Typography', () => ({}))
jest.mock('react-native', () => ({
  View: ({children}: PropsWithChildren) => <div>{children}</div>,
}))

// The native Jest preset defines its own window, so install the DOM after setup.
const dom = new JSDOM('', {pretendToBeVisual: true})
const domGlobals = {
  window: dom.window,
  document: dom.window.document,
  getComputedStyle: dom.window.getComputedStyle,
  CustomEvent: dom.window.CustomEvent,
  Node: dom.window.Node,
  NodeFilter: dom.window.NodeFilter,
  MutationObserver: dom.window.MutationObserver,
  Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
}
const originalGlobals = Object.keys(domGlobals).map(
  key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
)

beforeAll(() => {
  for (const [key, value] of Object.entries(domGlobals)) {
    Object.defineProperty(globalThis, key, {value, configurable: true})
  }
})

afterAll(() => {
  for (const [key, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else Reflect.deleteProperty(globalThis, key)
  }
  dom.window.close()
})

test('Enter only activates the menu when an item has focus', async () => {
  const DropdownMenu = await import('@radix-ui/react-dropdown-menu')
  const {createRoot} = await import('react-dom/client')
  const {Outer} = await import('#/components/Menu/index.web')
  const onPostKeyDown = jest.fn()
  const onSelect = jest.fn()
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)

  try {
    act(() => {
      root.render(
        <div onKeyDown={onPostKeyDown}>
          <DropdownMenu.Root open>
            <DropdownMenu.Trigger aria-label="Post options" />
            <Outer>
              <DropdownMenu.Item aria-label="Copy link" onSelect={onSelect} />
            </Outer>
          </DropdownMenu.Root>
        </div>,
      )
    })

    const menu = document.querySelector('[role="menu"]')
    expect(document.activeElement).toBe(menu)
    expect(container.contains(menu)).toBe(false)

    function press(key: string) {
      const event = new dom.window.KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
      })
      act(() => {
        document.activeElement!.dispatchEvent(event)
      })
      return event
    }

    const enter = press('Enter')
    expect(onPostKeyDown).not.toHaveBeenCalled()
    expect(enter.defaultPrevented).toBe(true)
    expect(onSelect).not.toHaveBeenCalled()

    press('ArrowDown')
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem')
    press('Enter')
    expect(onSelect).toHaveBeenCalledTimes(1)
  } finally {
    act(() => root.unmount())
    // Radix restores focus on a timer when the menu unmounts.
    await new Promise<void>(resolve => setTimeout(resolve, 0))
    container.remove()
  }
})
