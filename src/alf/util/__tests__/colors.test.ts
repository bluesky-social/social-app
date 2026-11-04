import {alpha, transparentifyColor} from '../colorGeneration'

describe('alpha', () => {
  it('converts hsl() to hsla()', () => {
    expect(alpha('hsl(120 100% 50%)', 0.5)).toBe('hsla(120 100% 50%, 0.5)')
  })

  it('converts hsl() to hsla() - fully transparent', () => {
    expect(alpha('hsl(120 100% 50%)', 0)).toBe('hsla(120 100% 50%, 0)')
  })

  it('converts rgb() to rgba()', () => {
    expect(alpha('rgb(255 0 0)', 0.75)).toBe('rgba(255 0 0, 0.75)')
  })

  it('expands 3-digit hex and appends alpha channel', () => {
    expect(alpha('#abc', 0.4)).toBe('#aabbcc66')
  })

  it('appends alpha to 6-digit hex', () => {
    expect(alpha('#aabbcc', 0.4)).toBe('#aabbcc66')
  })

  it('maps 0 and 1 to the ends of the alpha channel', () => {
    expect(alpha('#aabbcc', 0)).toBe('#aabbcc00')
    expect(alpha('#aabbcc', 1)).toBe('#aabbccff')
    expect(alpha('#abc', 0)).toBe('#aabbcc00')
    expect(alpha('#abc', 1)).toBe('#aabbccff')
  })

  it('rounds to the nearest alpha byte', () => {
    expect(alpha('#aabbcc', 0.5)).toBe('#aabbcc80')
    expect(alpha('#aabbcc', 0.001)).toBe('#aabbcc00')
  })

  /*
   * Opacities under 16/255 make a single hex digit, which alf's own `alpha`
   * repeats rather than zero-pads: 0.06 becomes `ff`, fully opaque
   */
  it.each(Array.from({length: 15}, (_, i) => i + 1))(
    'zero-pads a single-digit alpha byte (%i/255)',
    byte => {
      const expected = '0' + byte.toString(16)
      expect(alpha('#aabbcc', byte / 255)).toBe('#aabbcc' + expected)
      expect(alpha('#abc', byte / 255)).toBe('#aabbcc' + expected)
    },
  )

  it('returns other formats unchanged', () => {
    expect(alpha('blue', 0.5)).toBe('blue')
    expect(alpha('#aabbccdd', 0.5)).toBe('#aabbccdd')
  })

  it('is what `transparentifyColor` uses', () => {
    expect(transparentifyColor).toBe(alpha)
  })
})
