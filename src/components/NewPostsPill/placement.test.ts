import {
  homeHeaderBottom,
  pagerHeaderBottom,
} from '#/components/NewPostsPill/placement'

describe('homeHeaderBottom', () => {
  it('is the whole header while it is expanded', () => {
    expect(
      homeHeaderBottom({mode: 0, headerHeight: 120, pinnedHeight: 0}),
    ).toBe(120)
  })

  it('moves up with the header as it collapses', () => {
    expect(
      homeHeaderBottom({mode: 0.25, headerHeight: 120, pinnedHeight: 0}),
    ).toBe(90)
  })

  it('reaches the top of the screen content once collapsed', () => {
    expect(
      homeHeaderBottom({mode: 1, headerHeight: 120, pinnedHeight: 0}),
    ).toBeCloseTo(0)
  })

  /*
   * Under liquid glass the header draws its own top inset and stops with that
   * strip still on screen, so the pill has to rest below it rather than at the
   * top of the screen, under the Dynamic Island.
   */
  it('rests under the pinned status bar strip under liquid glass', () => {
    expect(
      homeHeaderBottom({mode: 0, headerHeight: 170, pinnedHeight: 62}),
    ).toBe(170)
    expect(
      homeHeaderBottom({mode: 0.5, headerHeight: 170, pinnedHeight: 62}),
    ).toBe(116)
    expect(
      homeHeaderBottom({mode: 1, headerHeight: 170, pinnedHeight: 62}),
    ).toBe(62)
  })

  it('stays at the pinned strip before the header has been measured', () => {
    expect(homeHeaderBottom({mode: 1, headerHeight: 0, pinnedHeight: 62})).toBe(
      62,
    )
  })
})

describe('pagerHeaderBottom', () => {
  const header = {headerHeight: 244, headerOnlyHeight: 200}

  it('is the header and tab bar with the list at the top', () => {
    expect(
      pagerHeaderBottom({...header, scrollY: 0, minimumHeaderHeight: 0}),
    ).toBe(244)
  })

  it('moves up with the header as the list scrolls', () => {
    expect(
      pagerHeaderBottom({...header, scrollY: 150, minimumHeaderHeight: 0}),
    ).toBe(94)
  })

  it('comes to rest under the tab bar once the header has gone', () => {
    expect(
      pagerHeaderBottom({...header, scrollY: 5000, minimumHeaderHeight: 0}),
    ).toBe(44)
  })

  it('comes to rest under a pinned minimal header and the tab bar', () => {
    expect(
      pagerHeaderBottom({...header, scrollY: 5000, minimumHeaderHeight: 100}),
    ).toBe(144)
  })

  it('ignores an over-scroll unless the header follows it', () => {
    expect(
      pagerHeaderBottom({...header, scrollY: -60, minimumHeaderHeight: 0}),
    ).toBe(244)
    expect(
      pagerHeaderBottom({
        ...header,
        scrollY: -60,
        minimumHeaderHeight: 0,
        allowHeaderOverScroll: true,
      }),
    ).toBe(304)
  })
})
