import {act, renderHook} from '@testing-library/react-native'

import {useMenuControl} from '#/components/Menu/index.web'

jest.mock('#/alf', () => ({atoms: {}}))
jest.mock('#/state/a11y', () => ({useA11y: () => ({})}))
jest.mock('#/components/Portal', () => ({Portal: () => null}))
jest.mock('#/components/Typography', () => ({Text: () => null}))

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('web menu control', () => {
  it('runs the close callback after the caller finishes', () => {
    const {result} = renderHook(() => useMenuControl())
    const calls: string[] = []

    act(() => {
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      calls.push('before')
      result.current.close(() => calls.push('callback'))
      calls.push('after')
    })
    expect(result.current.isOpen).toBe(false)
    expect(calls).toEqual(['before', 'after'])

    act(() => {
      jest.runAllTimers()
    })
    expect(calls).toEqual(['before', 'after', 'callback'])
  })
})
