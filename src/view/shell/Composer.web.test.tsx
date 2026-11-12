import {render, waitFor} from '@testing-library/react-native'

import {Composer} from './Composer.web'

const mockCancel = jest.fn()

jest.mock('react-remove-scroll-bar', () => ({
  RemoveScrollBar: () => null,
}))
jest.mock('@radix-ui/react-focus-guards', () => ({
  useFocusGuards: () => {},
}))
jest.mock('@radix-ui/react-focus-scope', () => ({
  FocusScope: ({children}: React.PropsWithChildren) => children,
}))
jest.mock('@radix-ui/react-dismissable-layer', () => ({
  DismissableLayer: ({children}: React.PropsWithChildren) => children,
}))
jest.mock('#/state/a11y', () => ({
  useA11y: () => ({reduceMotionEnabled: true}),
}))
jest.mock('#/state/shell/composer', () => ({
  useComposerState: () => ({}),
}))
jest.mock('#/view/com/composer/Composer', () => ({
  ComposePost: () => null,
  useComposerCancelRef: () => ({current: {onPressCancel: mockCancel}}),
}))
jest.mock('#/alf', () => ({
  atoms: {},
  flatten: (style: unknown) => style,
  useBreakpoints: () => ({gtMobile: true}),
  useTheme: () => ({atoms: {}}),
}))

/*
 * Minimal stand-in for the browser's history stack, since the React Native
 * jest preset doesn't run in a DOM environment. Like a browser, `back()`
 * fires `popstate` asynchronously.
 */
function createMockHistory() {
  let entries: unknown[] = [null]
  let index = 0
  const popStateListeners = new Set<() => void>()
  return {
    history: {
      get state() {
        return entries[index]
      },
      pushState(state: unknown) {
        entries = [...entries.slice(0, index + 1), state]
        index++
      },
      replaceState(state: unknown) {
        entries[index] = state
      },
      back() {
        if (index === 0) return
        index--
        setTimeout(() => popStateListeners.forEach(listener => listener()))
      },
    },
    addEventListener(type: string, listener: () => void) {
      if (type === 'popstate') popStateListeners.add(listener)
    },
    removeEventListener(type: string, listener: () => void) {
      if (type === 'popstate') popStateListeners.delete(listener)
    },
  }
}

beforeEach(() => {
  const {history, addEventListener, removeEventListener} = createMockHistory()
  Object.assign(globalThis, {history, addEventListener, removeEventListener})
  history.replaceState({id: 'nav-entry'})
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
})

it('pushes a history entry that keeps the current navigation state', () => {
  render(<Composer />)

  expect(history.state).toEqual({id: 'nav-entry', composer: true})
})

it('asks to cancel and stays put on browser back', async () => {
  render(<Composer />)
  history.back()

  await waitFor(() => expect(mockCancel).toHaveBeenCalledTimes(1))
  expect(history.state).toEqual({id: 'nav-entry', composer: true})
})

it('pops its history entry when closed', () => {
  const back = jest.spyOn(history, 'back')
  const result = render(<Composer />)
  result.unmount()

  expect(back).toHaveBeenCalledTimes(1)
})

it('leaves history alone when closed after navigating', () => {
  const back = jest.spyOn(history, 'back')
  const result = render(<Composer />)
  history.pushState({id: 'next-entry'}, '')
  result.unmount()

  expect(back).not.toHaveBeenCalled()
})
