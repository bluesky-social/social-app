import {isNetworkError} from '../../src/lib/strings/errors'

describe('isNetworkError', () => {
  const inputs = [
    'TypeError: Network request failed',
    'Uncaught TypeError: Cannot read property x of undefined',
    'Uncaught RangeError',
    'Error: Aborted',
  ]
  const outputs = [true, false, false, true]

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
    const output = outputs[i]
    it(`correctly distinguishes network errors for ${input}`, () => {
      expect(isNetworkError(input)).toEqual(output)
    })
  }
})
