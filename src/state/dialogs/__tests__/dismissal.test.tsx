import {act, renderHook} from '@testing-library/react-native'

import {
  Provider,
  useDialogStateContext,
  useDialogStateControlContext,
} from '../index'

jest.mock('#/lib/hotkeys', () => ({
  useHotkeysContext: () => ({
    disableScope: jest.fn(),
    enableScope: jest.fn(),
  }),
}))
jest.mock('#/components/dialogs/Context', () => ({
  Provider: ({children}: {children: unknown}) => children,
}))
jest.mock('#/env', () => ({IS_WEB: true}))
jest.mock('../../../../modules/bottom-sheet', () => ({
  BottomSheetNativeComponent: {dismissAll: jest.fn()},
}))

describe('dialog dismissal', () => {
  it('resolves when dialogs open at dismissal time have closed', async () => {
    const {result} = renderHook(
      () => ({
        state: useDialogStateContext(),
        controls: useDialogStateControlContext(),
      }),
      {wrapper: Provider},
    )
    const close = jest.fn()
    result.current.state.activeDialogs.current.set('first', {
      current: {open: jest.fn(), close},
    })
    act(() => result.current.controls.setDialogIsOpen('first', true))

    let didResolve = false
    let dismissal!: Promise<void>
    act(() => {
      dismissal = result.current.controls.closeAllDialogsAndWait()
      void dismissal.then(() => {
        didResolve = true
      })
    })

    expect(close).toHaveBeenCalledTimes(1)
    await act(async () => Promise.resolve())
    expect(didResolve).toBe(false)

    // Dialogs opened after dismissal began are not part of this wait.
    act(() => result.current.controls.setDialogIsOpen('second', true))
    act(() => result.current.controls.setDialogIsOpen('first', false))
    await act(async () => dismissal)

    expect(didResolve).toBe(true)
    expect(result.current.state.openDialogs.current.has('second')).toBe(true)
  })
})
