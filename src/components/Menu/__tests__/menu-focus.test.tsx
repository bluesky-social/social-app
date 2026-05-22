import {afterEach, describe, expect, jest, test} from '@jest/globals'

jest.mock('#/alf', () => ({
  atoms: {},
  flatten: (value: unknown) => value,
  useTheme: () => ({
    name: 'light',
    atoms: {},
    palette: {},
  }),
  web: (value: unknown) => value,
}))

const {handleMenuContentFocusCapture} = require('#/components/Menu/index.web')

describe('handleMenuContentFocusCapture', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('restores focus to the trigger when content itself receives focus', () => {
    const focus = jest.fn()
    const triggerRef = {
      current: {focus} as unknown as HTMLElement,
    } as React.RefObject<HTMLElement | null>

    jest.spyOn(global, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0)
      return 0
    })

    handleMenuContentFocusCapture(
      {
        target: 'content',
        currentTarget: 'content',
      } as unknown as React.FocusEvent,
      triggerRef,
    )

    expect(focus).toHaveBeenCalledTimes(1)
  })

  test('does not restore focus when a child element receives focus', () => {
    const focus = jest.fn()
    const triggerRef = {
      current: {focus} as unknown as HTMLElement,
    } as React.RefObject<HTMLElement | null>

    const requestAnimationFrameSpy = jest.spyOn(global, 'requestAnimationFrame')

    handleMenuContentFocusCapture(
      {
        target: 'child',
        currentTarget: 'content',
      } as unknown as React.FocusEvent,
      triggerRef,
    )

    expect(requestAnimationFrameSpy).not.toHaveBeenCalled()
    expect(focus).not.toHaveBeenCalled()
  })
})
