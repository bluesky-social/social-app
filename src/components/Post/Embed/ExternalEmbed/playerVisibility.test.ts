import {getPlayerVisibility} from './playerVisibility'

/*
 * Geometry in these tests is taken from a real device capture (411x891dp
 * portrait) or, for the rotation cases, reconstructed from logs, so the
 * expected results describe a device rather than a re-derivation of the
 * formula under test.
 */
const INSETS = {top: 0, bottom: 48}
const PORTRAIT = {width: 411, height: 891}

describe('getPlayerVisibility', () => {
  it('reports a player in the middle of the viewport as visible', () => {
    expect(
      getPlayerVisibility({
        player: {top: 433, height: 183, width: 326},
        viewport: PORTRAIT,
        insets: INSETS,
        isNative: true,
      }),
    ).toBe('visible')
  })

  it('reports a player scrolled below the fold as hidden', () => {
    expect(
      getPlayerVisibility({
        player: {top: 1200, height: 183, width: 326},
        viewport: PORTRAIT,
        insets: INSETS,
        isNative: true,
      }),
    ).toBe('hidden')
  })

  it('reports a player scrolled above the fold as hidden', () => {
    expect(
      getPlayerVisibility({
        player: {top: -400, height: 183, width: 326},
        viewport: PORTRAIT,
        insets: {top: 24, bottom: 48},
        isNative: true,
      }),
    ).toBe('hidden')
  })

  it('counts a player straddling the bottom edge as visible', () => {
    expect(
      getPlayerVisibility({
        player: {top: 800, height: 183, width: 326},
        viewport: PORTRAIT,
        insets: INSETS,
        isNative: true,
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
        viewport: PORTRAIT,
        insets: {top: 0, bottom: 0},
        isNative: true,
      }),
    ).toBe('indeterminate')
  })

  it('tolerates a full-bleed player exactly as wide as the window', () => {
    expect(
      getPlayerVisibility({
        player: {top: 433, height: 183, width: 411},
        viewport: PORTRAIT,
        insets: INSETS,
        isNative: true,
      }),
    ).toBe('visible')
  })

  // Layout rounding can leave a full-bleed view a fraction wider than the window.
  it('tolerates sub-pixel width overflow from layout rounding', () => {
    expect(
      getPlayerVisibility({
        player: {top: 433, height: 183, width: 411.43},
        viewport: PORTRAIT,
        insets: INSETS,
        isNative: true,
      }),
    ).toBe('visible')
  })

  /*
   * Known limitation, the reverse of the case above. Rotating from landscape
   * to portrait, the tree is already portrait-sized while the viewport still
   * says landscape (891x411). A narrow player looks like any other, so no mismatch is
   * flagged and the position comparison runs as-is.
   */
  it('known limitation: does not detect landscape to portrait rotation', () => {
    expect(
      getPlayerVisibility({
        player: {top: 433, height: 453, width: 326},
        viewport: {width: 891, height: 411},
        insets: INSETS,
        isNative: true,
      }),
    ).toBe('visible')
  })

  it('judges the bottom edge by the longer window side on native only', () => {
    const args = {
      player: {top: 600, height: 100, width: 326},
      viewport: {width: 891, height: 411},
      insets: INSETS,
    }
    expect(getPlayerVisibility({...args, isNative: true})).toBe('visible')
    expect(getPlayerVisibility({...args, isNative: false})).toBe('hidden')
  })

  it('accepts a width overflow of exactly the tolerance', () => {
    expect(
      getPlayerVisibility({
        player: {top: 433, height: 183, width: 412},
        viewport: PORTRAIT,
        insets: INSETS,
        isNative: true,
      }),
    ).toBe('visible')
  })

  it('reports indeterminate just past the width tolerance', () => {
    expect(
      getPlayerVisibility({
        player: {top: 433, height: 183, width: 412.01},
        viewport: PORTRAIT,
        insets: INSETS,
        isNative: true,
      }),
    ).toBe('indeterminate')
  })

  it.each([
    ['top', {top: NaN, height: 183, width: 326}],
    ['height', {top: 433, height: NaN, width: 326}],
    ['width', {top: 433, height: 183, width: NaN}],
    ['infinite top', {top: Infinity, height: 183, width: 326}],
  ])('reports indeterminate for a non-finite %s', (_name, player) => {
    expect(
      getPlayerVisibility({
        player,
        viewport: PORTRAIT,
        insets: INSETS,
        isNative: true,
      }),
    ).toBe('indeterminate')
  })

  it('reports indeterminate for a non-finite viewport', () => {
    expect(
      getPlayerVisibility({
        player: {top: 433, height: 183, width: 326},
        viewport: {width: 411, height: NaN},
        insets: INSETS,
        isNative: true,
      }),
    ).toBe('indeterminate')
  })

  describe('insets', () => {
    // Window 891 with a 48 bottom inset: the visible area ends at 843.
    it.each([
      [843, 'visible'],
      [844, 'hidden'],
    ])('bottom inset: player top at %s is %s', (top, expected) => {
      expect(
        getPlayerVisibility({
          player: {top, height: 183, width: 326},
          viewport: PORTRAIT,
          insets: {top: 0, bottom: 48},
          isNative: true,
        }),
      ).toBe(expected)
    })

    // A 24 top inset: the visible area starts at 24.
    it.each([
      [24, 'visible'],
      [23, 'hidden'],
    ])('top inset: player bottom at %s is %s', (bottom, expected) => {
      expect(
        getPlayerVisibility({
          player: {top: bottom - 183, height: 183, width: 326},
          viewport: PORTRAIT,
          insets: {top: 24, bottom: 48},
          isNative: true,
        }),
      ).toBe(expected)
    })
  })
})
