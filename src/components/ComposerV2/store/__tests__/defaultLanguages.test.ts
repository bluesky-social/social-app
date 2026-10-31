import {describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

import {type LinkResolvers} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'
import {testUploadRuntime} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'
import {type ThreadStoreInitialState} from '#/components/ComposerV2/store/types'

function makeStore({
  defaultLanguages,
  initialState,
}: {
  defaultLanguages: readonly string[]
  initialState?: ThreadStoreInitialState
}) {
  let i = 0
  return createThreadStore({
    ...testUploadRuntime,
    resolvers: {} as LinkResolvers,
    defaultLanguages,
    initialState,
    __createId: () => `id-${++i}`,
  })
}

function langsOf(store: ReturnType<typeof makeStore>) {
  return Object.values(store.getState().posts).map(post => post.langs)
}

describe('default post languages', () => {
  test('the initial empty post gets the defaults', () => {
    const store = makeStore({defaultLanguages: ['en', 'de']})
    expect(langsOf(store)).toEqual([['en', 'de']])
  })

  test('posts added later get the defaults', () => {
    const store = makeStore({defaultLanguages: ['en']})
    const root = Object.keys(store.getState().posts)[0]
    const after = store.actions.addPost('after', root)!.addedPostId
    store.actions.addPost('before', after)
    expect(langsOf(store)).toEqual([['en'], ['en'], ['en']])
  })

  test('explicit initial languages are kept', () => {
    const store = makeStore({
      defaultLanguages: ['en'],
      initialState: {posts: [{langs: ['fr']}, {text: 'no langs'}]},
    })
    expect(langsOf(store)).toEqual([['fr'], ['en']])
  })

  test('empty initial languages get the defaults', () => {
    const store = makeStore({
      defaultLanguages: ['en'],
      initialState: {posts: [{langs: []}]},
    })
    expect(langsOf(store)).toEqual([['en']])
  })

  test('mutating the caller array afterwards changes nothing', () => {
    const defaults = ['en']
    const store = makeStore({defaultLanguages: defaults})
    defaults.push('de')
    const root = Object.keys(store.getState().posts)[0]
    store.actions.addPost('after', root)
    expect(langsOf(store)).toEqual([['en'], ['en']])
  })

  test('posts do not share the default array', () => {
    const defaults = ['en']
    const store = makeStore({defaultLanguages: defaults})
    const root = Object.keys(store.getState().posts)[0]
    store.actions.addPost('after', root)
    const [first, second] = langsOf(store)
    expect(first).not.toBe(second)
    expect(first).not.toBe(defaults)
    expect(second).not.toBe(defaults)
  })

  test('applying defaults does not mark the store dirty', () => {
    const store = makeStore({defaultLanguages: ['en']})
    expect(store.getState().isDirty).toBe(false)
  })

  test('setPostLanguages keeps an explicit empty list', () => {
    const store = makeStore({defaultLanguages: ['en']})
    const root = Object.keys(store.getState().posts)[0]
    store.actions.setPostLanguages(root, [])
    expect(store.getState().posts[root].langs).toEqual([])
    expect(store.getState().isDirty).toBe(true)
  })
})
