import {clamp} from '../../src/lib/numbers'

describe('clamp', () => {
  const MIN = 2
  const MAX = 58

  const inputs = [-10, -1, 0, 5, 100, 1000]
  const outputs = [2, 2, 2, 5, 58, 58]

  it('correctly clamps any given number', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const result = clamp(input, MIN, MAX)
      expect(result).toBe(outputs[i])
    }
  })
})
