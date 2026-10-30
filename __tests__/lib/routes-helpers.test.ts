import {
  buildStateObject,
  getCurrentRoute,
  isStateAtTabRoot,
} from '#/lib/routes/helpers'
import {type State} from '#/lib/routes/types'

describe('getCurrentRoute', () => {
  it('returns Home when there is no state', () => {
    expect(getCurrentRoute(undefined).name).toBe('Home')
  })

  it('descends into nested state using the index', () => {
    const state = {
      index: 0,
      routes: [
        {
          name: 'HomeTab',
          state: {
            index: 1,
            routes: [{name: 'Home'}, {name: 'PostThread'}],
          },
        },
      ],
    } as unknown as State

    expect(getCurrentRoute(state).name).toBe('PostThread')
  })

  /*
   * Right after a cold start from a deep link, nested navigator states are
   * still partial and have no `index`. React Navigation focuses the last
   * route when rehydrating such a state, so getCurrentRoute must do the
   * same (previously it stopped at the tab route, which re-enabled the
   * drawer swipe gesture on top of the deep-linked screen).
   */
  it('descends into partial nested state without an index', () => {
    const state = {
      routes: [
        {
          name: 'HomeTab',
          state: {
            routes: [{name: 'Home'}, {name: 'PostThread'}],
          },
        },
      ],
    } as unknown as State

    expect(getCurrentRoute(state).name).toBe('PostThread')
  })
})

describe('isStateAtTabRoot', () => {
  it('returns true for the initial deep link state of a tab root', () => {
    const state = buildStateObject('HomeTab', 'Home', {}) as unknown as State
    expect(isStateAtTabRoot(state)).toBe(true)
  })

  it('returns false for the initial deep link state of a nested screen', () => {
    const state = buildStateObject(
      'HomeTab',
      'PostThread',
      {name: 'alice.test', rkey: '123'},
      [{name: 'Home', params: {}}],
    ) as unknown as State
    expect(isStateAtTabRoot(state)).toBe(false)
  })
})

describe('buildStateObject', () => {
  it('focuses the deep-linked route in the nested state', () => {
    const state = buildStateObject(
      'HomeTab',
      'PostThread',
      {name: 'alice.test', rkey: '123'},
      [{name: 'Home', params: {}}],
    )

    expect(state).toEqual({
      index: 0,
      routes: [
        {
          name: 'HomeTab',
          state: {
            index: 1,
            routes: [
              {name: 'Home', params: {}},
              {name: 'PostThread', params: {name: 'alice.test', rkey: '123'}},
            ],
          },
        },
      ],
    })
  })

  it('builds a single-route state for the Flat navigator', () => {
    const state = buildStateObject('Flat', 'PostThread', {
      name: 'alice.test',
      rkey: '123',
    })

    expect(state).toEqual({
      index: 0,
      routes: [{name: 'PostThread', params: {name: 'alice.test', rkey: '123'}}],
    })
  })
})
