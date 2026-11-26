import {describe, expect, it} from '@jest/globals'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {getAltFromExif} from '#/lib/media/image/altFromMetadata'

describe('getAltFromExif', () => {
  it('returns nothing without metadata', () => {
    expect(getAltFromExif(undefined)).toBeUndefined()
    expect(getAltFromExif(null)).toBeUndefined()
    expect(getAltFromExif({})).toBeUndefined()
  })

  it('reads the IPTC caption first (iOS)', () => {
    expect(
      getAltFromExif({
        '{IPTC}': {'Caption/Abstract': '  A dog on a beach  '},
        '{TIFF}': {ImageDescription: 'Something else'},
      }),
    ).toBe('A dog on a beach')
  })

  it('falls back to the TIFF description (iOS)', () => {
    expect(
      getAltFromExif({
        '{IPTC}': {'Caption/Abstract': '   '},
        '{TIFF}': {ImageDescription: 'A red bicycle'},
      }),
    ).toBe('A red bicycle')
  })

  it('reads the top-level description (Android)', () => {
    expect(getAltFromExif({ImageDescription: 'A bowl of ramen\u0000'})).toBe(
      'A bowl of ramen',
    )
  })

  it('skips descriptions cameras write on their own', () => {
    expect(getAltFromExif({ImageDescription: 'OLYMPUS DIGITAL CAMERA'})).toBe(
      undefined,
    )
    expect(
      getAltFromExif({
        '{TIFF}': {ImageDescription: 'SONY DSC'},
        ImageDescription: 'A lighthouse at dusk',
      }),
    ).toBe('A lighthouse at dusk')
  })

  it('ignores values that are not strings', () => {
    expect(getAltFromExif({ImageDescription: 42, '{IPTC}': 'x'})).toBe(
      undefined,
    )
  })

  it('caps the length at the alt text limit', () => {
    const long = 'a'.repeat(MAX_ALT_TEXT + 50)
    expect(getAltFromExif({ImageDescription: long})).toHaveLength(MAX_ALT_TEXT)
  })
})
