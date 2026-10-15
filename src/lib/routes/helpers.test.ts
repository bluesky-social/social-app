import {describe, expect, it} from '@jest/globals'

import {buildStateObject, stripHomeTabBaseRoute} from './helpers'

describe('stripHomeTabBaseRoute', () => {
  it('drops the Home route under a linked HomeTab screen', () => {
    const state = buildStateObject('HomeTab', 'Profile', {name: 'bsky.app'}, [
      {name: 'Home', params: {}},
    ])
    expect(stripHomeTabBaseRoute(state)).toEqual({
      index: 0,
      routes: [
        {
          name: 'HomeTab',
          state: {
            index: 0,
            routes: [{name: 'Profile', params: {name: 'bsky.app'}}],
          },
        },
      ],
    })
  })

  it('leaves a link to Home itself alone', () => {
    const state = buildStateObject('HomeTab', 'Home', {})
    expect(stripHomeTabBaseRoute(state)).toBeUndefined()
  })

  it('leaves other tabs alone', () => {
    const state = buildStateObject('SearchTab', 'Search', {q: 'test'})
    expect(stripHomeTabBaseRoute(state)).toBeUndefined()
  })
})
