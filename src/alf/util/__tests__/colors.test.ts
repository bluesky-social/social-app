import {jest} from '@jest/globals'

import {transparentifyColor} from '../colorGeneration'

describe('transparentifyColor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('converts hsl() to hsla()', () => {
    const result = transparentifyColor('hsl(120 100% 50%)', 0.5)
    expect(result).toBe('hsla(120 100% 50%, 0.5)')
  })

  it('converts hsl() to hsla() - fully transparent', () => {
    const result = transparentifyColor('hsl(120 100% 50%)', 0)
    expect(result).toBe('hsla(120 100% 50%, 0)')
  })

  it('converts rgb() to rgba()', () => {
    const result = transparentifyColor('rgb(255 0 0)', 0.75)
    expect(result).toBe('rgba(255 0 0, 0.75)')
  })

  it('expands 3-digit hex and appends alpha channel', () => {
    const result = transparentifyColor('#abc', 0.4)
    expect(result).toBe('#aabbcc66')
  })

  it('appends alpha to 6-digit hex', () => {
    const result = transparentifyColor('#aabbcc', 0.4)
    expect(result).toBe('#aabbcc66')
  })

  it('returns the original string and warns for unsupported formats', () => {
    const unsupported = 'blue'
    const result = transparentifyColor(unsupported, 0.5)
    expect(result).toBe(unsupported)
  })
})
