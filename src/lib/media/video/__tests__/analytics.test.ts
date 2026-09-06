import {hasPlaybackStarted} from '../analytics'

describe('hasPlaybackStarted', () => {
  it.each([
    [0, false],
    [0.049, false],
    [0.05, true],
    [1, true],
    [Number.NaN, false],
    [Number.POSITIVE_INFINITY, false],
  ])('returns %s for %s seconds', (seconds, expected) => {
    expect(hasPlaybackStarted(seconds)).toBe(expected)
  })
})
