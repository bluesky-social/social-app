import {findNodeHandle} from 'react-native'

import {getDialogSourceViewTag} from '#/components/Dialog/sourceViewTag'

jest.mock('react-native', () => ({
  findNodeHandle: jest.fn(),
}))

const findNodeHandleMock = jest.mocked(findNodeHandle)

beforeEach(() => {
  findNodeHandleMock.mockReset()
})

describe('getDialogSourceViewTag', () => {
  it('prefers an explicitly configured native source view', () => {
    expect(
      getDialogSourceViewTag({
        popover: true,
        nativeSourceViewTag: 10,
        options: {sourceViewTag: 20},
      }),
    ).toBe(10)
  })

  it('uses the menu trigger source view for a popover', () => {
    expect(
      getDialogSourceViewTag({
        popover: true,
        options: {sourceViewTag: 20},
      }),
    ).toBe(20)
  })

  it('normalizes numeric-string targets for opt-in popover dialogs', () => {
    const event = {
      currentTarget: null,
      target: null,
      nativeEvent: {target: '42'},
    } as never

    expect(getDialogSourceViewTag({popover: true, options: event})).toBe(42)
  })

  it('uses the event host instance instead of a child target', () => {
    const currentTarget = {}
    findNodeHandleMock.mockReturnValue(42)

    expect(
      getDialogSourceViewTag({
        popover: true,
        options: {
          currentTarget,
          nativeEvent: {target: 99},
        } as never,
      }),
    ).toBe(42)
    expect(findNodeHandleMock).toHaveBeenCalledWith(currentTarget)
  })

  it('leaves a programmatic popover unanchored when no source is supplied', () => {
    expect(getDialogSourceViewTag({popover: true})).toBeUndefined()
    expect(findNodeHandleMock).not.toHaveBeenCalled()
  })

  it('honors an explicit source view option for zoom transitions', () => {
    expect(
      getDialogSourceViewTag({
        popover: false,
        options: {sourceViewTag: 42},
      }),
    ).toBe(42)
  })

  it('keeps configured source views for non-popover zoom transitions', () => {
    expect(
      getDialogSourceViewTag({popover: false, nativeSourceViewTag: 10}),
    ).toBe(10)
  })

  it('does not use an event target as a source for a non-popover dialog', () => {
    expect(
      getDialogSourceViewTag({
        popover: false,
        options: {nativeEvent: {target: 20} as never},
      }),
    ).toBeUndefined()
  })
})
