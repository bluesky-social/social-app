import {extractEntities} from '../src/lib/strings'

describe('extractEntities', () => {
  const inputs = [
    'no mention',
    '@start middle end',
    'start @middle end',
    'start middle @end',
    '@start @middle @end',
    '@full123.test-of-chars',
    'not@right',
    '@bad!@#$chars',
    '@newline1\n@newline2',
  ]
  const outputs = [
    undefined,
    [{index: [0, 6], type: 'mention', value: 'start'}],
    [{index: [6, 13], type: 'mention', value: 'middle'}],
    [{index: [13, 17], type: 'mention', value: 'end'}],
    [
      {index: [0, 6], type: 'mention', value: 'start'},
      {index: [7, 14], type: 'mention', value: 'middle'},
      {index: [15, 19], type: 'mention', value: 'end'},
    ],
    [{index: [0, 22], type: 'mention', value: 'full123.test-of-chars'}],
    undefined,
    [{index: [0, 4], type: 'mention', value: 'bad'}],
    [
      {index: [0, 9], type: 'mention', value: 'newline1'},
      {index: [10, 19], type: 'mention', value: 'newline2'},
    ],
  ]
  it('correctly handles a set of text inputs', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const output = extractEntities(input)
      expect(output).toEqual(outputs[i])
      if (output) {
        for (const outputItem of output) {
          expect(input.slice(outputItem.index[0], outputItem.index[1])).toBe(
            `@${outputItem.value}`,
          )
        }
      }
    }
  })
})
