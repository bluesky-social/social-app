import {describe, expect, it} from '@jest/globals'

import {
  type AutocompleteProfile,
  type AutocompleteSearch,
} from '#/components/Autocomplete/types'
import {mergeAutocompleteResults} from '../mergeAutocompleteResults'

function profileItem(
  did: string,
  handle: string,
  displayName?: string,
): AutocompleteProfile {
  return {
    key: did,
    type: 'profile',
    value: '@' + handle,
    profile: {did, handle, displayName},
  }
}

function searchItem(q: string): AutocompleteSearch {
  return {key: `recent-${q}`, type: 'search', value: q}
}

const alice = profileItem('did:1', 'alice.test', 'Alice')
const bob = profileItem('did:2', 'bob.test', 'Bob')
const carol = profileItem('did:3', 'carol.test', 'Carol')

describe('mergeAutocompleteResults', () => {
  it('returns remote items untouched when no sources', () => {
    const result = mergeAutocompleteResults({
      query: 'al',
      remoteItems: [alice, bob],
    })
    expect(result).toEqual([alice, bob])
  })

  it('empty query returns local items in source order, deduped', () => {
    const result = mergeAutocompleteResults({
      query: '',
      sources: [
        {key: 'a', items: [alice, searchItem('cats')]},
        {key: 'b', items: [alice, bob]},
      ],
      remoteItems: [],
    })
    expect(result).toEqual([alice, searchItem('cats'), bob])
  })

  it('typed query pins fuse matches above remote', () => {
    const result = mergeAutocompleteResults({
      query: 'alice',
      sources: [{key: 'recents', items: [bob, alice]}],
      remoteItems: [carol],
    })
    expect(result[0]).toEqual(alice)
    expect(result).toContainEqual(carol)
    expect(result).not.toContainEqual(bob)
  })

  it('pins at most 3 local matches', () => {
    const many = Array.from({length: 6}, (_, i) =>
      profileItem(`did:m${i}`, `alice${i}.test`, `Alice ${i}`),
    )
    const result = mergeAutocompleteResults({
      query: 'alice',
      sources: [{key: 'recents', items: many}],
      remoteItems: [carol],
    })
    expect(result).toHaveLength(4)
    expect(result[3]).toEqual(carol)
  })

  it('dedupes by key, keeping local position with remote profile data', () => {
    const remoteAlice = profileItem('did:1', 'alice.test', 'Alice (new name)')
    const result = mergeAutocompleteResults({
      query: 'alice',
      sources: [{key: 'recents', items: [alice]}],
      remoteItems: [carol, remoteAlice],
    })
    expect(result[0]).toEqual({...alice, profile: remoteAlice.profile})
    expect(result).toHaveLength(2)
  })

  it('matches search-term items by value', () => {
    const cats = searchItem('cats')
    const result = mergeAutocompleteResults({
      query: 'cat',
      sources: [{key: 'recents', items: [bob, cats]}],
      remoteItems: [],
    })
    expect(result).toEqual([cats])
  })
})
