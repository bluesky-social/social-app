import {isNetworkError} from '../../src/lib/errors'

describe('isNetworkError', () => {
  const inputs = [
    'TypeError: Network request failed',
    'Uncaught TypeError: Cannot read property x of undefined',
    'Uncaught RangeError',
    'Error: Aborted',
  ]
  const outputs = [true, false, false, true]

  it('correctly distinguishes network errors', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const result = isNetworkError(input)
      expect(result).toEqual(outputs[i])
    }
  })
})
