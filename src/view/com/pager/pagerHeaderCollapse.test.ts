import {pagerHeaderCollapseTranslateY} from '#/view/com/pager/pagerHeaderCollapse'

/*
 * The formula negates a distance, so a translate of nothing can come out as
 * -0. That is harmless as a transform, and `toBeCloseTo` accepts either zero.
 */
describe('pagerHeaderCollapseTranslateY', () => {
  it('rests in place with the list at the top', () => {
    expect(
      pagerHeaderCollapseTranslateY({
        scrollY: 0,
        headerOnlyHeight: 100,
        minimumHeaderHeight: 0,
      }),
    ).toBeCloseTo(0)
  })

  it('follows the scroll up as the header collapses', () => {
    expect(
      pagerHeaderCollapseTranslateY({
        scrollY: 40,
        headerOnlyHeight: 100,
        minimumHeaderHeight: 0,
      }),
    ).toBe(-40)
  })

  it('stops once the whole header above the tab bar has left', () => {
    expect(
      pagerHeaderCollapseTranslateY({
        scrollY: 500,
        headerOnlyHeight: 100,
        minimumHeaderHeight: 0,
      }),
    ).toBe(-100)
  })

  it('keeps back the minimum height the header asked for', () => {
    expect(
      pagerHeaderCollapseTranslateY({
        scrollY: 500,
        headerOnlyHeight: 100,
        minimumHeaderHeight: 30,
      }),
    ).toBe(-70)
    expect(
      pagerHeaderCollapseTranslateY({
        scrollY: 500,
        headerOnlyHeight: 100,
        minimumHeaderHeight: 120,
      }),
    ).toBeCloseTo(0)
  })

  it('ignores an over-scroll by default', () => {
    expect(
      pagerHeaderCollapseTranslateY({
        scrollY: -80,
        headerOnlyHeight: 100,
        minimumHeaderHeight: 0,
      }),
    ).toBeCloseTo(0)
  })

  it('follows an over-scroll down where the header is allowed to', () => {
    expect(
      pagerHeaderCollapseTranslateY({
        scrollY: -80,
        headerOnlyHeight: 100,
        minimumHeaderHeight: 0,
        allowHeaderOverScroll: true,
      }),
    ).toBe(80)
  })
})
