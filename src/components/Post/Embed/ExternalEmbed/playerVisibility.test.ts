import {getPlayerVisibility} from './playerVisibility'

/*
 * Geometry in these tests is taken from a real capture on an SM-A346E
 * (411x891dp portrait), so the expected results describe a device rather than
 * a re-derivation of the formula under test.
 */
const INSETS = {top: 0, bottom: 48}
const PORTRAIT = {width: 411, height: 891}

describe('getPlayerVisibility', () => {
  it('reports a player in the middle of the viewport as visible', () => {
    expect(
      getPlayerVisibility({
        player: {top: 433, height: 183, width: 326},
        window: PORTRAIT,
        insets: INSETS,
      }),
    ).toBe('visible')
  })

  it('reports a player scrolled below the fold as hidden', () => {
    expect(
      getPlayerVisibility({
        player: {top: 1200, height: 183, width: 326},
        window: PORTRAIT,
        insets: INSETS,
      }),
    ).toBe('hidden')
  })

  it('reports a player scrolled above the fold as hidden', () => {
    expect(
      getPlayerVisibility({
        player: {top: -400, height: 183, width: 326},
        window: PORTRAIT,
        insets: {top: 24, bottom: 48},
      }),
    ).toBe('hidden')
  })

  it('counts a player straddling the bottom edge as visible', () => {
    expect(
      getPlayerVisibility({
        player: {top: 800, height: 183, width: 326},
        window: PORTRAIT,
        insets: INSETS,
      }),
    ).toBe('visible')
  })

  /*
   * The case this module exists for. Mid-rotation the native view tree has
   * already re-laid out for landscape (width 806, and a pageY thousands of dp
   * down because every feed item changed height) while useWindowDimensions()
   * still reports portrait. Comparing the two produces "off screen" for a
   * player that is in fact front and centre.
   */
  it('reports indeterminate when the player is wider than the window', () => {
    expect(
      getPlayerVisibility({
        player: {top: 4429, height: 453, width: 806},
        window: PORTRAIT,
        insets: {top: 0, bottom: 0},
      }),
    ).toBe('indeterminate')
  })

  it('tolerates a full-bleed player exactly as wide as the window', () => {
    expect(
      getPlayerVisibility({
        player: {top: 433, height: 183, width: 411},
        window: PORTRAIT,
        insets: INSETS,
      }),
    ).toBe('visible')
  })

  it('tolerates sub-pixel width overflow from layout rounding', () => {
    expect(
      getPlayerVisibility({
        player: {top: 433, height: 183, width: 411.4285717010498},
        window: PORTRAIT,
        insets: INSETS,
      }),
    ).toBe('visible')
  })
})
