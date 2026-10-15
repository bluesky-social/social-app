import {useKeyboardAnimation} from 'react-native-keyboard-controller/src/components/KeyboardAvoidingView/hooks'
import {useKeyboardHandler} from 'react-native-keyboard-controller/src/hooks'
import {renderHook} from '@testing-library/react-native'

const mockKeyboardContext = {
  reanimated: {
    height: {value: 0},
    progress: {value: 0},
  },
}

jest.mock('react-native-keyboard-controller/src/context', () => ({
  useKeyboardContext: () => mockKeyboardContext,
}))
jest.mock('react-native-keyboard-controller/src/hooks', () => ({
  useKeyboardHandler: jest.fn(),
}))
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (value: unknown) => ({value}),
}))

const OPEN = {height: 336, progress: 1, duration: 250, target: 1}
const CLOSED = {...OPEN, height: 0, progress: 0}

beforeEach(() => {
  jest.clearAllMocks()
  mockKeyboardContext.reanimated.height.value = 0
  mockKeyboardContext.reanimated.progress.value = 0
})

it('recovers the opened height when mounting misses the opening start event', () => {
  const {result} = renderHook(useKeyboardAnimation)
  const handlers = jest.mocked(useKeyboardHandler).mock.calls[0][0]

  handlers.onMove?.({...OPEN, height: 168, progress: 0.5})
  expect(result.current.heightWhenOpened.value).toBeCloseTo(0)

  handlers.onEnd?.(OPEN)
  expect(result.current.heightWhenOpened.value).toBe(336)
  expect(result.current.height.value).toBe(336)
  expect(result.current.progress.value).toBe(1)
  expect(result.current.isClosed.value).toBe(false)
})

it('recovers when stale mount initialization overwrites the opening start', () => {
  const {result} = renderHook(useKeyboardAnimation)
  const handlers = jest.mocked(useKeyboardHandler).mock.calls[0][0]

  handlers.onStart?.(OPEN)
  expect(result.current.heightWhenOpened.value).toBe(336)

  // Simulate a stale initialization write, not native scheduling itself.
  result.current.heightWhenOpened.value = 0
  expect(result.current.heightWhenOpened.value).toBe(0)

  handlers.onMove?.({...OPEN, height: 168, progress: 0.5})
  handlers.onEnd?.(OPEN)

  expect(result.current.heightWhenOpened.value).toBe(336)
  expect(result.current.height.value).toBe(336)
  expect(result.current.progress.value).toBe(1)
  expect(result.current.isClosed.value).toBe(false)
})

it('preserves the opened height throughout dismissal', () => {
  const {result} = renderHook(useKeyboardAnimation)
  const handlers = jest.mocked(useKeyboardHandler).mock.calls[0][0]

  handlers.onStart?.(OPEN)
  handlers.onEnd?.(OPEN)
  handlers.onStart?.(CLOSED)
  handlers.onMove?.({...OPEN, height: 168, progress: 0.5})
  expect(result.current.heightWhenOpened.value).toBe(336)

  handlers.onEnd?.(CLOSED)
  expect(result.current.heightWhenOpened.value).toBe(336)
  expect(result.current.height.value).toBe(0)
  expect(result.current.progress.value).toBe(0)
  expect(result.current.isClosed.value).toBe(true)
})

it('repairs a stale opened height after the keyboard changes size', () => {
  const {result} = renderHook(useKeyboardAnimation)
  const handlers = jest.mocked(useKeyboardHandler).mock.calls[0][0]

  handlers.onStart?.(OPEN)
  handlers.onEnd?.(OPEN)
  handlers.onEnd?.({...OPEN, height: 432})

  expect(result.current.heightWhenOpened.value).toBe(432)
  expect(result.current.height.value).toBe(432)
})

it('initializes correctly when mounted with an already-open keyboard', () => {
  mockKeyboardContext.reanimated.height.value = -336
  mockKeyboardContext.reanimated.progress.value = 1
  const {result} = renderHook(useKeyboardAnimation)

  expect(result.current.heightWhenOpened.value).toBe(336)
  expect(result.current.height.value).toBe(336)
  expect(result.current.progress.value).toBe(1)
  expect(result.current.isClosed.value).toBe(false)
})
