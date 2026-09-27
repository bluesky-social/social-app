import {type GestureResponderEvent} from 'react-native'
import {renderHook} from '@testing-library/react-native'

import {useDialogControl} from '#/components/Dialog/context'
import {type DialogControlRefProps} from '#/components/Dialog/types'

const mockActiveDialogs = {
  current: new Map<string, React.RefObject<DialogControlRefProps | null>>(),
}

jest.mock('#/state/dialogs', () => ({
  useDialogStateContext: () => ({activeDialogs: mockActiveDialogs}),
}))
jest.mock('#/env', () => ({IS_DEV: true}))

afterEach(() => {
  mockActiveDialogs.current.clear()
})

describe('dialog control', () => {
  it('forwards the press event so an iOS popover can anchor to its trigger', () => {
    const {result} = renderHook(useDialogControl)
    const open = jest.fn()
    result.current.ref.current = {open, close: jest.fn()}
    const event = {nativeEvent: {target: 42}} as GestureResponderEvent

    result.current.open(event)

    expect(open).toHaveBeenCalledWith(event)
  })

  it('preserves programmatic opens and existing open options', () => {
    const {result} = renderHook(useDialogControl)
    const open = jest.fn()
    result.current.ref.current = {open, close: jest.fn()}

    result.current.open()
    result.current.open({index: 1})

    expect(open).toHaveBeenNthCalledWith(1, undefined)
    expect(open).toHaveBeenNthCalledWith(2, {index: 1})
  })

  it('forwards the source view tag used to anchor native presentations', () => {
    const {result} = renderHook(useDialogControl)
    const open = jest.fn()
    result.current.ref.current = {open, close: jest.fn()}

    result.current.open({sourceViewTag: 42})

    expect(open).toHaveBeenCalledWith({sourceViewTag: 42})
  })

  it('leaves post-close callbacks to the presentation to run after dismissal', () => {
    const {result} = renderHook(useDialogControl)
    const close = jest.fn()
    const onClosed = jest.fn()
    result.current.ref.current = {open: jest.fn(), close}

    result.current.close(onClosed)

    expect(close).toHaveBeenCalledWith(onClosed)
    expect(onClosed).not.toHaveBeenCalled()
  })

  it('registers the same control until it unmounts', () => {
    const {result, rerender, unmount} = renderHook(useDialogControl)
    const control = result.current

    expect(mockActiveDialogs.current.get(control.id)).toBe(control.ref)
    rerender({})
    expect(result.current).toBe(control)

    unmount()
    expect(mockActiveDialogs.current.has(control.id)).toBe(false)
  })
})
