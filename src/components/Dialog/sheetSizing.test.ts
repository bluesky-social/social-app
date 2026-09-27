import {
  getMeasuredDialogContentHeight,
  shouldMeasureDialogContentHeight,
} from '#/components/Dialog/sheetSizing'

describe('shouldMeasureDialogContentHeight', () => {
  it('measures content for iOS popovers, including compact-width adaptations', () => {
    expect(
      shouldMeasureDialogContentHeight({
        isIOS: true,
        isIPad: false,
        popover: true,
      }),
    ).toBe(true)
  })

  it('leaves ordinary compact iPhone dialogs on native sizing', () => {
    expect(
      shouldMeasureDialogContentHeight({
        isIOS: true,
        isIPad: false,
        popover: false,
      }),
    ).toBe(false)
  })

  it('continues measuring iPad dialogs that are not popovers', () => {
    expect(
      shouldMeasureDialogContentHeight({
        isIOS: true,
        isIPad: true,
        popover: false,
      }),
    ).toBe(true)
  })

  it('does not enable iOS popover measurement on Android', () => {
    expect(
      shouldMeasureDialogContentHeight({
        isIOS: false,
        isIPad: false,
        popover: true,
      }),
    ).toBe(false)
  })
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

  it('reports scroll content and footer height for compact iOS popovers', () => {
    const shouldMeasureContentHeight = shouldMeasureDialogContentHeight({
      isIOS: true,
      isIPad: false,
      popover: true,
    })

    expect(
      getMeasuredDialogContentHeight({
        shouldMeasureContentHeight,
        contentHeight: 420,
        footerHeight: 48,
      }),
    ).toBe(468)
  })

  it('does not opt ordinary compact iPhone dialogs into JS measurement', () => {
    const shouldMeasureContentHeight = shouldMeasureDialogContentHeight({
      isIOS: true,
      isIPad: false,
      popover: false,
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
