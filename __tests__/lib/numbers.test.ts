import {clamp} from '../../src/lib/numbers'

describe('clamp', () => {
  const inputs: [number, number, number][] = [
    [100, 0, 200],
    [100, 0, 100],
    [0, 0, 100],
    [100, 0, -1],
    [4, 1, 1],
    [100, -100, 0],
    [400, 100, -100],
    [70, -1, 1],
    [Infinity, Infinity, Infinity],
  ]
  const outputs = [100, 100, 0, -1, 1, 0, -100, 1, Infinity]

  it('correctly clamps any given number and range', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const result = clamp(...input)
      expect(result).toEqual(outputs[i])
    }
  })
})
