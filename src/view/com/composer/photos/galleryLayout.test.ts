import {getCarouselTileWidth} from './galleryLayout'

describe('getCarouselTileWidth', () => {
  it('clamps wide landscape images to the max aspect ratio (3/2)', () => {
    // 200/100 = 2.0 -> clamped to 1.5 -> 100 * 1.5 = 150
    expect(getCarouselTileWidth({width: 200, height: 100}, 100)).toBe(150)
  })

  it('clamps tall portrait images to the min aspect ratio (2/3)', () => {
    // 100/200 = 0.5 -> clamped to 0.6667 -> round(100 * 0.6667) = 67
    expect(getCarouselTileWidth({width: 100, height: 200}, 100)).toBe(67)
  })

  it('keeps in-range aspect ratios unchanged', () => {
    // 400/300 = 1.333 (in [0.667, 1.5]) -> 120 * 4/3 = 160
    expect(getCarouselTileWidth({width: 400, height: 300}, 120)).toBe(160)
  })

  it('falls back to square when dimensions are missing or zero', () => {
    expect(getCarouselTileWidth({width: 0, height: 0}, 100)).toBe(100)
  })
})
