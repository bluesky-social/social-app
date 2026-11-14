import {getMeasuredDialogContentHeight} from '#/components/Dialog/sheetSizing'

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

  it('reports scroll content and footer height', () => {
    expect(
      getMeasuredDialogContentHeight({
        shouldMeasureContentHeight: true,
        contentHeight: 420,
        footerHeight: 48,
      }),
    ).toBe(468)
  })

  it('does not report a height for dialogs on native sizing', () => {
    expect(
      getMeasuredDialogContentHeight({
        shouldMeasureContentHeight: false,
        contentHeight: 420,
        footerHeight: 48,
      }),
    ).toBeUndefined()
  })
})
