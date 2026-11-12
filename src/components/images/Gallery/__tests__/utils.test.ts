import {
  MAX_ASPECT_RATIO,
  MIN_ASPECT_RATIO,
} from '#/components/images/Gallery/const'
import {
  computeDims,
  getAspectRatio,
  getContentHeight,
} from '#/components/images/Gallery/utils'

describe('getContentHeight', () => {
  const phone = {gtPhone: false, gtMobile: false}
  const tablet = {gtPhone: true, gtMobile: false}
  const desktop = {gtPhone: true, gtMobile: true}

  it.each([
    ['phone', phone, 200],
    ['tablet', tablet, 260],
    ['desktop', desktop, 300],
  ])('uses the ordinary post height on %s', (_name, bps, height) => {
    expect(getContentHeight({isWithinChat: false, ...bps})).toBe(height)
  })

  it.each([
    ['phone', phone, 150],
    ['tablet', tablet, 190],
    ['desktop', desktop, 220],
  ])('uses the quote height on %s', (_name, bps, height) => {
    expect(
      getContentHeight({isWithinChat: false, isWithinQuote: true, ...bps}),
    ).toBe(height)
  })

  it.each([phone, tablet, desktop])('uses one chat height at %j', bps => {
    expect(getContentHeight({isWithinChat: true, ...bps})).toBe(120)
    expect(
      getContentHeight({isWithinChat: true, isWithinQuote: true, ...bps}),
    ).toBe(120)
  })
})

describe('getAspectRatio', () => {
  it('divides width by height', () => {
    expect(getAspectRatio({width: 300, height: 200})).toBe(1.5)
  })

  it.each([
    [undefined],
    [{}],
    [{width: 0, height: 100}],
    [{width: 100, height: 0}],
    [{width: -1, height: 100}],
  ])('has no ratio for %j', input => {
    expect(getAspectRatio(input)).toBeUndefined()
  })
})

describe('computeDims', () => {
  it('sizes by height and ratio, flooring the width', () => {
    expect(computeDims({height: 200, aspectRatio: 1.25})).toEqual({
      width: 250,
      height: 200,
      aspectRatio: 1.25,
      isCropped: false,
    })
    expect(computeDims({height: 150, aspectRatio: 1.111}).width).toBe(166)
  })

  it('defaults to square when the ratio is missing', () => {
    expect(computeDims({height: 200})).toEqual({
      width: 200,
      height: 200,
      aspectRatio: 1,
      isCropped: false,
    })
  })

  it('clamps landscape images and marks them cropped', () => {
    expect(computeDims({height: 200, aspectRatio: 4})).toEqual({
      width: 300,
      height: 200,
      aspectRatio: MAX_ASPECT_RATIO,
      isCropped: true,
    })
  })

  it('clamps portrait images and marks them cropped', () => {
    const dims = computeDims({height: 300, aspectRatio: 0.25})
    expect(dims.width).toBe(200)
    expect(dims.aspectRatio).toBe(MIN_ASPECT_RATIO)
    expect(dims.isCropped).toBe(true)
  })

  it('does not crop at exactly the limits', () => {
    expect(computeDims({height: 300, aspectRatio: MAX_ASPECT_RATIO})).toEqual(
      expect.objectContaining({width: 450, isCropped: false}),
    )
    expect(computeDims({height: 300, aspectRatio: MIN_ASPECT_RATIO})).toEqual(
      expect.objectContaining({width: 200, isCropped: false}),
    )
  })
})
