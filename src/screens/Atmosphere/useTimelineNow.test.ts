import {AppState, type AppStateStatus} from 'react-native'
import {act, renderHook} from '@testing-library/react-native'

import {useTimelineNow} from '#/screens/Atmosphere/useTimelineNow'

let mockTick = 0
jest.mock('#/state/shell', () => ({useTickEveryMinute: () => mockTick}))

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-09-11T12:00:00Z'))
  mockTick = 0
})
afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

it('reads the current clock initially and on shared minute ticks, including clock rollback', () => {
  const {result, rerender} = renderHook(useTimelineNow)
  expect(result.current.getTime()).toBe(Date.now())
  jest.setSystemTime(new Date('2026-09-11T12:01:00Z'))
  mockTick = Date.now()
  rerender({})
  expect(result.current.getTime()).toBe(Date.now())
  jest.setSystemTime(new Date('2026-09-11T11:00:00Z'))
  mockTick = Date.now()
  rerender({})
  expect(result.current.getTime()).toBe(Date.now())
})

it('refreshes after resuming and removes its listener on unmount', () => {
  let onChange: ((state: AppStateStatus) => void) | undefined
  const remove = jest.fn()
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
    onChange = listener
    return {remove}
  })
  const {result, unmount} = renderHook(useTimelineNow)
  const before = result.current.getTime()
  jest.setSystemTime(new Date('2026-09-12T01:00:00Z'))
  act(() => onChange?.('background'))
  expect(result.current.getTime()).toBe(before)
  act(() => onChange?.('active'))
  expect(result.current.getTime()).toBe(Date.now())
  unmount()
  expect(remove).toHaveBeenCalledTimes(1)
})
