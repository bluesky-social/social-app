import {normalizeLineSeparators} from '#/lib/strings/line-separators'

describe('normalizeLineSeparatorsForDisplay', () => {
  it('removes unicode line separators before existing newlines', () => {
    expect(
      normalizeLineSeparators(
        'sharing a new library!\u2028\u2028\n\nC++26 is bringing us',
      ),
    ).toBe('sharing a new library!\n\nC++26 is bringing us')
  })

  it('renders standalone unicode line separators as newlines', () => {
    expect(normalizeLineSeparators('one\u2028two\u2029three')).toBe(
      'one\ntwo\nthree',
    )
  })
})
