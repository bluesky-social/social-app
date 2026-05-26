import {darken, hexToRgb, lighten, rgbToHex} from './colorGeneration'

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#abcdef')).toEqual({r: 0xab, g: 0xcd, b: 0xef})
  })

  it('parses 6-digit hex without leading #', () => {
    expect(hexToRgb('abcdef')).toEqual({r: 0xab, g: 0xcd, b: 0xef})
  })

  it('parses 3-digit shorthand hex', () => {
    expect(hexToRgb('#abc')).toEqual({r: 0xaa, g: 0xbb, b: 0xcc})
  })

  it('parses 8-digit hex by dropping the alpha channel', () => {
    expect(hexToRgb('#aabbccdd')).toEqual({r: 0xaa, g: 0xbb, b: 0xcc})
  })

  it('handles uppercase digits', () => {
    expect(hexToRgb('#ABCDEF')).toEqual({r: 0xab, g: 0xcd, b: 0xef})
  })

  it('returns null for 4-digit shorthand', () => {
    expect(hexToRgb('#abcd')).toBeNull()
  })

  it('returns null for non-hex characters', () => {
    expect(hexToRgb('#zzzzzz')).toBeNull()
  })

  it('returns null for non-hex words', () => {
    expect(hexToRgb('blue')).toBeNull()
  })

  it('returns null for the empty string', () => {
    expect(hexToRgb('')).toBeNull()
  })

  it('returns null for unexpected lengths', () => {
    expect(hexToRgb('#ab')).toBeNull()
    expect(hexToRgb('#abcde')).toBeNull()
    expect(hexToRgb('#abcdefg')).toBeNull()
  })
})

describe('rgbToHex', () => {
  it('formats integer channels', () => {
    expect(rgbToHex(0xab, 0xcd, 0xef)).toBe('#abcdef')
  })

  it('rounds floating-point channels', () => {
    expect(rgbToHex(170.4, 187.6, 204.5)).toBe('#aabccd')
  })

  it('clamps below zero to 00', () => {
    expect(rgbToHex(-10, 0, 0)).toBe('#000000')
  })

  it('clamps above 255 to ff', () => {
    expect(rgbToHex(300, 255, 255)).toBe('#ffffff')
  })

  it('zero-pads short hex output', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
  })
})

describe('lighten / darken', () => {
  it('lighten increases lightness', () => {
    expect(lighten('#808080', 10)).toBe('#9a9a9a')
  })

  it('darken decreases lightness', () => {
    expect(darken('#808080', 10)).toBe('#676767')
  })

  it('lighten clamps at white', () => {
    expect(lighten('#ffffff', 50)).toBe('#ffffff')
  })

  it('darken clamps at black', () => {
    expect(darken('#000000', 50)).toBe('#000000')
  })

  it('lighten by zero is a no-op', () => {
    expect(lighten('#abcdef', 0)).toBe('#abcdef')
  })

  it('returns the input unchanged for invalid hex', () => {
    expect(lighten('not-a-color', 10)).toBe('not-a-color')
    expect(darken('#zzz', 10)).toBe('#zzz')
  })
})
