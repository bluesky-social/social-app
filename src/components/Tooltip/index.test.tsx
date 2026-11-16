import {Text, View} from 'react-native'
import {withTiming} from 'react-native-reanimated'
import {act, fireEvent, render} from '@testing-library/react-native'

import * as Portal from '#/components/Portal'
import * as Tooltip from '#/components/Tooltip/index'

const mockCompletions: Array<() => void> = []

jest.mock('react-native-reanimated', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const Native =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    __esModule: true,
    default: {View: Native.View},
    cancelAnimation: jest.fn(),
    Easing: {exp: jest.fn(), in: jest.fn(), out: jest.fn()},
    ZoomIn: {easing: jest.fn()},
    useSharedValue: (initial: number) =>
      React.useRef({get: () => initial, set: jest.fn()}).current,
    useAnimatedStyle: () => ({}),
    withTiming: jest.fn(() => 0),
  }
})
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: () => void) => mockCompletions.push(callback),
}))
jest.mock('#/alf', () => ({
  atoms: {rounded_2xs: {borderRadius: 2}},
  useTheme: () => ({atoms: {}}),
}))
jest.mock('#/components/Tooltip/const', () => ({
  ARROW_HALF_SIZE: 6,
  ARROW_SIZE: 12,
  BUBBLE_MAX_WIDTH: 240,
  MIN_EDGE_SPACE: 16,
  getTooltipStyle: () => ({surface: 'white', border: {width: 0}}),
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/hooks/useOnGesture', () => ({useOnGesture: jest.fn()}))
jest.mock('#/lib/hooks/useIsKeyboardVisible', () => ({
  useIsKeyboardVisible: () => false,
}))
jest.mock('#/state/global-gesture-events', () => ({
  GlobalGestureEventsProvider: ({children}: {children: React.ReactNode}) =>
    children,
}))

function Fixture({visible}: {visible: boolean}) {
  return (
    <Portal.Provider>
      <Tooltip.Outer visible={visible} onVisibleChange={() => {}}>
        <Tooltip.Target>
          <Text>Target</Text>
        </Tooltip.Target>
        <Tooltip.Content label="Explanation">
          <Text>Tooltip contents</Text>
        </Tooltip.Content>
      </Tooltip.Outer>
      <Portal.Outlet />
    </Portal.Provider>
  )
}

function setup() {
  const result = render(<Fixture visible={false} />)
  const target = result.UNSAFE_getByType(Tooltip.Target).findByType(View)
  jest
    .spyOn(target.instance as React.ComponentRef<typeof View>, 'measure')
    .mockImplementation(callback => callback(0, 0, 100, 20, 40, 100))
  fireEvent(target, 'layout', {nativeEvent: {layout: {width: 100, height: 20}}})
  result.rerender(<Fixture visible />)
  expect(result.getByLabelText('Explanation')).toBeTruthy()
  return result
}

function finishAnimation() {
  const calls = jest.mocked(withTiming).mock.calls
  const callback = calls[calls.length - 1]?.[2]
  expect(callback).toBeDefined()
  act(() => callback?.(true, 0))
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCompletions.length = 0
})

it('keeps the closing bubble mounted until its animation finishes', () => {
  const result = setup()
  result.rerender(<Fixture visible={false} />)
  expect(
    result.getByLabelText('Explanation', {includeHiddenElements: true}),
  ).toHaveProp('accessibilityElementsHidden', true)
  finishAnimation()
  act(() => mockCompletions.forEach(callback => callback()))
  expect(
    result.queryByText('Tooltip contents', {includeHiddenElements: true}),
  ).toBeNull()
})

it('ignores a queued close completion after reopening', () => {
  const result = setup()
  result.rerender(<Fixture visible={false} />)
  finishAnimation()
  result.rerender(<Fixture visible />)
  act(() => mockCompletions.forEach(callback => callback()))
  expect(result.getByLabelText('Explanation')).toBeTruthy()
})
