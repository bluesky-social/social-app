import {
  applyFonts,
  MONOSPACE_FONT_FAMILY,
  type MutableTextStyle,
} from '#/alf/fonts'

jest.mock('#/storage', () => ({device: {get: jest.fn(), set: jest.fn()}}))

describe('code fonts', () => {
  it.each(['theme', 'system'] as const)(
    'preserves explicit code typography with the %s text preference',
    fontFamily => {
      const style: MutableTextStyle = {
        fontFamily: MONOSPACE_FONT_FAMILY,
        fontWeight: '700',
        fontStyle: 'italic',
        letterSpacing: 0,
      }
      const original = {...style}
      applyFonts(style, fontFamily)
      expect(style).toEqual(original)
    },
  )

  it('still applies the theme font to normal text', () => {
    const style: MutableTextStyle = {fontWeight: '400'}
    applyFonts(style, 'theme')
    expect(style.fontFamily).toContain('Inter')
    expect(style.fontFamily).not.toBe(MONOSPACE_FONT_FAMILY)
  })
})
