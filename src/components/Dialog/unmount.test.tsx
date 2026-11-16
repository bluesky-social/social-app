import {act, render} from '@testing-library/react-native'

import {Outer} from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog/types'

const mockSetDialogIsOpen = jest.fn()
const mockSetFullyExpandedCount = jest.fn<void, [(count: number) => number]>()
type MockSheetProps = {
  onSnapPointChange?: (event: {nativeEvent: {snapPoint: number}}) => void
  onStateChange?: (event: {nativeEvent: {state: string}}) => void
}
let mockSheetProps: MockSheetProps = {}

jest.mock('#/state/dialogs', () => ({
  useDialogStateControlContext: () => ({
    setDialogIsOpen: mockSetDialogIsOpen,
    setFullyExpandedCount: mockSetFullyExpandedCount,
  }),
}))
jest.mock('react-native-reanimated', () => {
  const {View} = require('react-native') as typeof import('react-native')
  return {
    __esModule: true,
    default: {View, ScrollView: View, FlatList: View},
    useAnimatedStyle: () => ({}),
  }
})
jest.mock('react-native-worklets', () => ({scheduleOnRN: () => {}}))
jest.mock('react-native-keyboard-controller', () => ({
  useReanimatedKeyboardAnimation: () => ({height: {get: () => 0}}),
}))
jest.mock('#/view/com/util/List', () => ({List: () => null}))
jest.mock('@bsky.app/bottom-sheet', () => {
  const {forwardRef, useImperativeHandle} =
    jest.requireActual<typeof import('react')>('react')
  return {
    BottomSheetSnapPoint: {Hidden: 0, Partial: 1, Full: 2},
    BottomSheet: forwardRef(
      (props: MockSheetProps, ref: React.Ref<unknown>) => {
        mockSheetProps = props
        useImperativeHandle(ref, () => ({present: () => {}, dismiss: () => {}}))
        return null
      },
    ),
  }
})

function renderOuter() {
  const control = {
    id: 'test-dialog',
    ref: {current: null},
  } as unknown as DialogControlProps
  const utils = render(<Outer control={control}>{null}</Outer>)
  return {control, ...utils}
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSheetProps = {}
})

describe('Dialog.Outer unmount', () => {
  it('releases the open dialog state if it unmounts while open', () => {
    const {control, unmount} = renderOuter()
    act(() => control.ref.current?.open())
    expect(mockSetDialogIsOpen).toHaveBeenLastCalledWith('test-dialog', true)

    unmount()

    expect(mockSetDialogIsOpen).toHaveBeenLastCalledWith('test-dialog', false)
    expect(mockSetFullyExpandedCount).not.toHaveBeenCalled()
  })

  it('decrements the fully expanded count if it unmounts while full', () => {
    const {control, unmount} = renderOuter()
    act(() => control.ref.current?.open())
    act(() => mockSheetProps.onSnapPointChange?.({nativeEvent: {snapPoint: 2}}))
    expect(mockSetFullyExpandedCount).toHaveBeenCalledTimes(1)

    unmount()

    expect(mockSetFullyExpandedCount).toHaveBeenCalledTimes(2)
    const decrement = mockSetFullyExpandedCount.mock.calls[1][0]
    expect(decrement(1)).toBe(0)
  })

  it('does nothing on unmount after the sheet already closed', () => {
    const {control, unmount} = renderOuter()
    act(() => control.ref.current?.open())
    act(() => mockSheetProps.onStateChange?.({nativeEvent: {state: 'closed'}}))
    mockSetDialogIsOpen.mockClear()

    unmount()

    expect(mockSetDialogIsOpen).not.toHaveBeenCalled()
  })
})
