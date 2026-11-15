import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

import {useWindowScrollPerPage} from '#/screens/Notifications/components/PagerView/Content.web'

let mockIsFocused = true
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => mockIsFocused,
}))
// The pager's own needs, which the hook doesn't use and can't load here
jest.mock('#/alf', () => ({atoms: {}}))
jest.mock('react-native-reanimated', () => ({}))

/*
 * jest-expo's environment uses the global object as the window, without its
 * scrolling or events, so these stand in for them.
 */
const scroller = new EventTarget()
let scrollY = 0
const scrollTo = jest.fn((options: ScrollToOptions) => {
  scrollY = options.top ?? 0
})

beforeAll(() => {
  Object.assign(window, {
    addEventListener: scroller.addEventListener.bind(scroller),
    removeEventListener: scroller.removeEventListener.bind(scroller),
    scrollTo,
  })
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    get: () => scrollY,
  })
})

afterAll(() => {
  for (const key of [
    'addEventListener',
    'removeEventListener',
    'scrollTo',
    'scrollY',
  ]) {
    Reflect.deleteProperty(window, key)
  }
})

beforeEach(() => {
  mockIsFocused = true
  scrollY = 0
  scrollTo.mockClear()
})

/**
 * Scrolls the window to `y`, as the user would.
 */
function scroll(y: number) {
  scrollY = y
  scroller.dispatchEvent(new Event('scroll'))
}

function renderPager() {
  return renderHook(({page}: {page: number}) => useWindowScrollPerPage(page), {
    initialProps: {page: 0},
  })
}

describe('useWindowScrollPerPage', () => {
  it('leaves the window alone on mount', () => {
    renderPager()
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('opens a page for the first time at the top', () => {
    const {rerender} = renderPager()
    scroll(500)
    rerender({page: 1})
    expect(scrollTo).toHaveBeenLastCalledWith({top: 0, behavior: 'instant'})
  })

  it('puts each page back where it was left', () => {
    const {rerender} = renderPager()
    scroll(500)
    rerender({page: 1})
    scroll(200)
    rerender({page: 0})
    expect(scrollTo).toHaveBeenLastCalledWith({top: 500, behavior: 'instant'})
    rerender({page: 1})
    expect(scrollTo).toHaveBeenLastCalledWith({top: 200, behavior: 'instant'})
  })

  it('keeps the scroll that follows a switch for the page now shown', () => {
    const {rerender} = renderPager()
    scroll(500)
    rerender({page: 1})
    // The browser reports the switch's own scroll afterwards
    scroll(scrollY)
    rerender({page: 0})
    expect(scrollTo).toHaveBeenLastCalledWith({top: 500, behavior: 'instant'})
  })

  it('ignores the window scrolling while the screen is out of focus', () => {
    const {rerender} = renderPager()
    scroll(500)
    mockIsFocused = false
    rerender({page: 0})
    // Another screen, scrolling the same window
    scroll(1500)
    mockIsFocused = true
    rerender({page: 0})
    rerender({page: 1})
    rerender({page: 0})
    expect(scrollTo).toHaveBeenLastCalledWith({top: 500, behavior: 'instant'})
  })
})
