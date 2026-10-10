import {describe, expect, jest, test} from '@jest/globals'

jest.mock('#/lib/api/resolve', () => ({resolveLink: jest.fn()}))

import {type LinkResolvers} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'
import {testUploadRuntime} from '#/components/ComposerV2/store/__tests__/uploadTestUtils'

const resolvers = {} as LinkResolvers

describe('explicit post tags', () => {
  test('copies edits, marks dirty, and preserves no-op identity', () => {
    const store = createThreadStore({
      ...testUploadRuntime,
      resolvers,
      __createId: () => 'post-1',
      initialState: {posts: [{tags: ['one']}]},
    })
    const before = store.getState()
    const notify = jest.fn()
    store.subscribe(notify)

    const tags = ['one', 'two']
    store.actions.setPostTags('post-1', tags)
    const after = store.getState()
    tags.push('caller mutation')

    expect(after.posts['post-1'].tags).toEqual(['one', 'two'])
    expect(after.isDirty).toBe(true)
    expect(after).not.toBe(before)
    expect(notify).toHaveBeenCalledTimes(1)

    store.actions.setPostTags('post-1', ['one', 'two'])
    expect(store.getState()).toBe(after)
    expect(notify).toHaveBeenCalledTimes(1)
  })
})
