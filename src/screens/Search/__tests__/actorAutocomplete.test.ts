import {describe, expect, it} from '@jest/globals'

import {
  completeActorSearchOperator,
  getActorAutocompleteState,
} from '#/screens/Search/actorAutocomplete'

describe('search operator autocomplete', () => {
  it.each([
    ['from:zzs', 'zzs', 0],
    ['cats from:zzs', 'zzs', 5],
    ['cats  from:@zzs', 'zzs', 6],
    ['cats\nfrom:zzs', 'zzs', 5],
  ])('extracts an active from operator from %s', (value, query, tokenStart) => {
    expect(getActorAutocompleteState(value).context).toEqual({
      operator: 'from',
      query,
      tokenStart,
    })
  })

  it.each([
    'cats',
    'cats from:alice.bsky.social more',
    'from:me',
    '"from:alice"',
    'cats "words from:alice"',
    'notfrom:alice',
  ])('does not expose a replacement context for %s', value => {
    expect(getActorAutocompleteState(value).context).toBeNull()
  })

  it.each([
    ['from:zzs', 'zzs', true],
    ['cats from:@zzs', 'zzs', true],
    ['from:', '', false],
    ['from:me', '', true],
    ['from:me ad', '', true],
    ['cats from:alice.bsky.social more', '', true],
    ['ordinary search', 'ordinary search', false],
    ['cats "words from:alice"', 'cats "words from:alice"', false],
  ])(
    'derives autocomplete state from %j',
    (value, query, showFullSearchFallback) => {
      expect(getActorAutocompleteState(value)).toMatchObject({
        query,
        showFullSearchFallback,
      })
    },
  )

  it('does not treat differently-cased Me as the reserved value', () => {
    expect(getActorAutocompleteState('from:Me')).toMatchObject({
      context: {
        operator: 'from',
        query: 'Me',
        tokenStart: 0,
      },
      query: 'Me',
      showFullSearchFallback: true,
    })
  })

  it('completes the operator and preserves preceding terms', () => {
    const value = 'cats from:zzs'
    const context = getActorAutocompleteState(value).context
    expect(context).not.toBeNull()
    expect(completeActorSearchOperator(value, context!, 'zzstoatzz.io')).toBe(
      'cats from:zzstoatzz.io ',
    )
  })
})
