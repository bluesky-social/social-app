import {
  getMeasuredDialogContentHeight,
  shouldMeasureDialogContentHeight,
} from '#/components/Dialog/sheetSizing'

describe('shouldMeasureDialogContentHeight', () => {
  it.each(['always', 'adaptive'] as const)(
    'measures iPhone popover content in %s mode, including compact-width adaptations',
    popover => {
      expect(
        shouldMeasureDialogContentHeight({
          isIOS: true,
          isIPad: false,
          popover,
        }),
      ).toBe(true)
    },
  )

  it.each(['never', undefined] as const)(
    'leaves ordinary compact iPhone dialogs on native sizing in %s mode',
    popover => {
      expect(
        shouldMeasureDialogContentHeight({
          isIOS: true,
          isIPad: false,
          popover,
        }),
      ).toBe(false)
    },
  )

  it('continues measuring iPad dialogs that are not popovers', () => {
    expect(
      shouldMeasureDialogContentHeight({
        isIOS: true,
        isIPad: true,
        popover: 'never',
      }),
    ).toBe(true)
  })

  it.each(['always', 'adaptive', 'never', undefined] as const)(
    'does not enable iOS popover measurement on Android in %s mode',
    popover => {
      expect(
        shouldMeasureDialogContentHeight({
          isIOS: false,
          isIPad: false,
          popover,
        }),
      ).toBe(false)
    },
  )
})

describe('getMeasuredDialogContentHeight', () => {
  it('waits for a nonempty content measurement before overriding native sizing', () => {
    expect(
      getMeasuredDialogContentHeight({
        shouldMeasureContentHeight: true,
        contentHeight: 0,
        footerHeight: 48,
      }),
    ).toBeUndefined()
  })

  it.each(['always', 'adaptive'] as const)(
    'reports scroll content and footer height for compact iOS popovers in %s mode',
    popover => {
      const shouldMeasureContentHeight = shouldMeasureDialogContentHeight({
        isIOS: true,
        isIPad: false,
        popover,
      })

      expect(
        getMeasuredDialogContentHeight({
          shouldMeasureContentHeight,
          contentHeight: 420,
          footerHeight: 48,
        }),
      ).toBe(468)
    },
  )

  it('does not opt ordinary compact iPhone dialogs into JS measurement', () => {
    const shouldMeasureContentHeight = shouldMeasureDialogContentHeight({
      isIOS: true,
      isIPad: false,
      popover: 'never',
    })

    expect(
      getMeasuredDialogContentHeight({
        shouldMeasureContentHeight,
        contentHeight: 420,
        footerHeight: 48,
      }),
    ).toBeUndefined()
  })
})
