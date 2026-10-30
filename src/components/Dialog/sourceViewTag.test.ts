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
        popover: 'adaptive',
        nativeSourceViewTag: 10,
        options: {sourceViewTag: 20},
      }),
    ).toBe(10)
  })

  it('uses the menu trigger source view for a popover', () => {
    expect(
      getDialogSourceViewTag({
        popover: 'adaptive',
        options: {sourceViewTag: 20},
      }),
    ).toBe(20)
  })

  it.each(['always', 'adaptive'] as const)(
    'normalizes numeric-string targets for %s popover dialogs',
    popover => {
      const event = {
        currentTarget: null,
        target: null,
        nativeEvent: {target: '42'},
      } as never

      expect(getDialogSourceViewTag({popover, options: event})).toBe(42)
    },
  )

  it.each(['always', 'adaptive'] as const)(
    'uses the event host instance instead of a child target in %s mode',
    popover => {
      const currentTarget = {}
      findNodeHandleMock.mockReturnValue(42)

      expect(
        getDialogSourceViewTag({
          popover,
          options: {
            currentTarget,
            nativeEvent: {target: 99},
          } as never,
        }),
      ).toBe(42)
      expect(findNodeHandleMock).toHaveBeenCalledWith(currentTarget)
    },
  )

  it.each(['always', 'adaptive'] as const)(
    'leaves a programmatic %s popover unanchored when no source is supplied',
    popover => {
      expect(getDialogSourceViewTag({popover})).toBeUndefined()
      expect(findNodeHandleMock).not.toHaveBeenCalled()
    },
  )

  it('honors an explicit source view option for zoom transitions', () => {
    expect(
      getDialogSourceViewTag({
        popover: 'never',
        options: {sourceViewTag: 42},
      }),
    ).toBe(42)
  })

  it('keeps configured source views for non-popover zoom transitions', () => {
    expect(
      getDialogSourceViewTag({popover: 'never', nativeSourceViewTag: 10}),
    ).toBe(10)
  })

  it.each(['never', undefined] as const)(
    'does not use an event target as a source for a %s non-popover dialog',
    popover => {
      expect(
        getDialogSourceViewTag({
          popover,
          options: {nativeEvent: {target: 20} as never},
        }),
      ).toBeUndefined()
    },
  )
})
