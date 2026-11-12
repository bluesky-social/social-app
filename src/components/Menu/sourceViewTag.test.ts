import {findNodeHandle, type GestureResponderEvent} from 'react-native'

import {getMenuSourceViewTag} from '#/components/Menu/sourceViewTag'

jest.mock('react-native', () => ({
  findNodeHandle: jest.fn(),
}))

const findNodeHandleMock = jest.mocked(findNodeHandle)

beforeEach(() => {
  findNodeHandleMock.mockReset()
})

describe('getMenuSourceViewTag', () => {
  it('uses the trigger ref when opening without a press event', () => {
    const trigger = {}
    findNodeHandleMock.mockReturnValue(42)

    expect(getMenuSourceViewTag(trigger as never)).toBe(42)
    expect(findNodeHandleMock).toHaveBeenCalledWith(trigger)
  })

  it('prefers the trigger ref over the event target', () => {
    const trigger = {}
    findNodeHandleMock.mockReturnValue(42)

    expect(
      getMenuSourceViewTag(
        trigger as never,
        {
          currentTarget: 77,
          nativeEvent: {target: 99},
        } as unknown as GestureResponderEvent,
      ),
    ).toBe(42)
    expect(findNodeHandleMock).toHaveBeenCalledTimes(1)
  })

  it('prefers the host currentTarget over a child hit target', () => {
    const currentTarget = {}
    const childTarget = {}
    findNodeHandleMock.mockImplementation(target =>
      target === currentTarget ? 42 : target === childTarget ? 99 : undefined,
    )
    const event = {
      currentTarget,
      target: childTarget,
      nativeEvent: {target: '101'},
    } as unknown as GestureResponderEvent

    expect(getMenuSourceViewTag(null, event)).toBe(42)
    expect(findNodeHandleMock).toHaveBeenCalledTimes(1)
  })

  it('accepts the numeric native event target used by the native view manager', () => {
    const event = {
      currentTarget: null,
      target: null,
      nativeEvent: {target: 42},
    } as unknown as GestureResponderEvent

    expect(getMenuSourceViewTag(null, event)).toBe(42)
  })

  it('normalizes numeric-string native event targets', () => {
    const event = {
      currentTarget: null,
      target: null,
      nativeEvent: {target: '42'},
    } as unknown as GestureResponderEvent

    expect(getMenuSourceViewTag(null, event)).toBe(42)
  })

  it('falls back to the event when the ref no longer resolves to a host view', () => {
    findNodeHandleMock.mockReturnValue(undefined)
    const event = {currentTarget: 42} as unknown as GestureResponderEvent

    expect(getMenuSourceViewTag({} as never, event)).toBe(42)
  })

  it('falls back when a custom trigger exposes an unsupported ref', () => {
    findNodeHandleMock.mockImplementation(() => {
      throw new Error('not a native host view')
    })
    const event = {currentTarget: 42} as unknown as GestureResponderEvent

    expect(getMenuSourceViewTag({} as never, event)).toBe(42)
  })

  it('leaves missing targets unanchored', () => {
    expect(getMenuSourceViewTag(null)).toBeUndefined()
    expect(findNodeHandleMock).not.toHaveBeenCalled()
  })
})
