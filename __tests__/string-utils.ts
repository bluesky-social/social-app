import {extractEntities, detectLinkables} from '../src/lib/strings'

describe('extractEntities', () => {
  const knownHandles = new Set(['handle', 'full123.test-of-chars'])
  const inputs = [
    'no mention',
    '@handle middle end',
    'start @handle end',
    'start middle @handle',
    '@handle @handle @handle',
    '@full123.test-of-chars',
    'not@right',
    '@handle!@#$chars',
    '@handle\n@handle',
    'start https://middle.com end',
    'start https://middle.com/foo/bar end',
    'start https://middle.com/foo/bar?baz=bux end',
    'start https://middle.com/foo/bar?baz=bux#hash end',
    'https://start.com/foo/bar?baz=bux#hash middle end',
    'start middle https://end.com/foo/bar?baz=bux#hash',
    'https://newline1.com\nhttps://newline2.com',
    'start middle.com end',
    'start middle.com/foo/bar end',
    'start middle.com/foo/bar?baz=bux end',
    'start middle.com/foo/bar?baz=bux#hash end',
    'start.com/foo/bar?baz=bux#hash middle end',
    'start middle end.com/foo/bar?baz=bux#hash',
    'newline1.com\nnewline2.com',
  ]
  interface Output {
    type: string
    value: string
    noScheme?: boolean
  }
  const outputs: Output[][] = [
    [],
    [{type: 'mention', value: 'handle'}],
    [{type: 'mention', value: 'handle'}],
    [{type: 'mention', value: 'handle'}],
    [
      {type: 'mention', value: 'handle'},
      {type: 'mention', value: 'handle'},
      {type: 'mention', value: 'handle'},
    ],
    [
      {
        type: 'mention',
        value: 'full123.test-of-chars',
      },
    ],
    [],
    [{type: 'mention', value: 'handle'}],
    [
      {type: 'mention', value: 'handle'},
      {type: 'mention', value: 'handle'},
    ],
    [{type: 'link', value: 'https://middle.com'}],
    [{type: 'link', value: 'https://middle.com/foo/bar'}],
    [{type: 'link', value: 'https://middle.com/foo/bar?baz=bux'}],
    [{type: 'link', value: 'https://middle.com/foo/bar?baz=bux#hash'}],
    [{type: 'link', value: 'https://start.com/foo/bar?baz=bux#hash'}],
    [{type: 'link', value: 'https://end.com/foo/bar?baz=bux#hash'}],
    [
      {type: 'link', value: 'https://newline1.com'},
      {type: 'link', value: 'https://newline2.com'},
    ],
    [{type: 'link', value: 'middle.com', noScheme: true}],
    [{type: 'link', value: 'middle.com/foo/bar', noScheme: true}],
    [{type: 'link', value: 'middle.com/foo/bar?baz=bux', noScheme: true}],
    [{type: 'link', value: 'middle.com/foo/bar?baz=bux#hash', noScheme: true}],
    [{type: 'link', value: 'start.com/foo/bar?baz=bux#hash', noScheme: true}],
    [{type: 'link', value: 'end.com/foo/bar?baz=bux#hash', noScheme: true}],
    [
      {type: 'link', value: 'newline1.com', noScheme: true},
      {type: 'link', value: 'newline2.com', noScheme: true},
    ],
  ]
  it('correctly handles a set of text inputs', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const result = extractEntities(input, knownHandles)
      if (!outputs[i].length) {
        expect(result).toBeFalsy()
      } else if (outputs[i].length && !result) {
        expect(result).toBeTruthy()
      } else if (result) {
        expect(result.length).toBe(outputs[i].length)
        for (let j = 0; j < outputs[i].length; j++) {
          expect(result[j].type).toEqual(outputs[i][j].type)
          if (outputs[i][j].noScheme) {
            expect(result[j].value).toEqual(`https://${outputs[i][j].value}`)
          } else {
            expect(result[j].value).toEqual(outputs[i][j].value)
          }
          if (outputs[i]?.[j].type === 'mention') {
            expect(
              input.slice(result[j].index.start, result[j].index.end),
            ).toBe(`@${result[j].value}`)
          } else {
            if (!outputs[i]?.[j].noScheme) {
              expect(
                input.slice(result[j].index.start, result[j].index.end),
              ).toBe(result[j].value)
            } else {
              expect(
                input.slice(result[j].index.start, result[j].index.end),
              ).toBe(result[j].value.slice('https://'.length))
            }
          }
        }
      }
    }
  })
})

describe('detectLinkables', () => {
  const inputs = [
    'no linkable',
    '@start middle end',
    'start @middle end',
    'start middle @end',
    '@start @middle @end',
    '@full123.test-of-chars',
    'not@right',
    '@bad!@#$chars',
    '@newline1\n@newline2',
    'start https://middle.com end',
    'start https://middle.com/foo/bar end',
    'start https://middle.com/foo/bar?baz=bux end',
    'start https://middle.com/foo/bar?baz=bux#hash end',
    'https://start.com/foo/bar?baz=bux#hash middle end',
    'start middle https://end.com/foo/bar?baz=bux#hash',
    'https://newline1.com\nhttps://newline2.com',
    'start middle.com end',
    'start middle.com/foo/bar end',
    'start middle.com/foo/bar?baz=bux end',
    'start middle.com/foo/bar?baz=bux#hash end',
    'start.com/foo/bar?baz=bux#hash middle end',
    'start middle end.com/foo/bar?baz=bux#hash',
    'newline1.com\nnewline2.com',
  ]
  const outputs = [
    ['no linkable'],
    [{link: '@start'}, ' middle end'],
    ['start ', {link: '@middle'}, ' end'],
    ['start middle ', {link: '@end'}],
    [{link: '@start'}, ' ', {link: '@middle'}, ' ', {link: '@end'}],
    [{link: '@full123.test-of-chars'}],
    ['not@right'],
    [{link: '@bad'}, '!@#$chars'],
    [{link: '@newline1'}, '\n', {link: '@newline2'}],
    ['start ', {link: 'https://middle.com'}, ' end'],
    ['start ', {link: 'https://middle.com/foo/bar'}, ' end'],
    ['start ', {link: 'https://middle.com/foo/bar?baz=bux'}, ' end'],
    ['start ', {link: 'https://middle.com/foo/bar?baz=bux#hash'}, ' end'],
    [{link: 'https://start.com/foo/bar?baz=bux#hash'}, ' middle end'],
    ['start middle ', {link: 'https://end.com/foo/bar?baz=bux#hash'}],
    [{link: 'https://newline1.com'}, '\n', {link: 'https://newline2.com'}],
    ['start ', {link: 'middle.com'}, ' end'],
    ['start ', {link: 'middle.com/foo/bar'}, ' end'],
    ['start ', {link: 'middle.com/foo/bar?baz=bux'}, ' end'],
    ['start ', {link: 'middle.com/foo/bar?baz=bux#hash'}, ' end'],
    [{link: 'start.com/foo/bar?baz=bux#hash'}, ' middle end'],
    ['start middle ', {link: 'end.com/foo/bar?baz=bux#hash'}],
    [{link: 'newline1.com'}, '\n', {link: 'newline2.com'}],
  ]
  it('correctly handles a set of text inputs', () => {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const output = detectLinkables(input)
      expect(output).toEqual(outputs[i])
    }
  })
})
