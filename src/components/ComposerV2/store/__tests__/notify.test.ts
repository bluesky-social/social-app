import {describe, expect, jest, test} from '@jest/globals'

/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

import {type LinkResolvers} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'

function makeIdGenerator() {
  let i = 0
  return () => `id-${++i}`
}

const resolvers = {} as LinkResolvers

function rootId(store: ReturnType<typeof createThreadStore>) {
  return Object.keys(store.getState().posts)[0]
}

describe('subscribe / getState', () => {
  test('listener fires on a real change and getState returns a new reference', () => {
    const store = createThreadStore({
      resolvers,
      __createId: makeIdGenerator(),
    })
    const root = rootId(store)
    const before = store.getState()
    const fn = jest.fn()
    const unsubscribe = store.subscribe(fn)

    store.actions.setPostText(root, 'hello')

    expect(fn).toHaveBeenCalledTimes(1)
    const after = store.getState()
    expect(after).not.toBe(before)
    expect(after.posts[root].text).toBe('hello')
    expect(before.posts[root].text).toBe('')
    expect(before.isDirty).toBe(false)
    unsubscribe()
  })

  test('listener does not fire on a no-op and state ref is preserved', () => {
    const store = createThreadStore({
      resolvers,
      __createId: makeIdGenerator(),
    })
    const before = store.getState()
    const fn = jest.fn()
    store.subscribe(fn)

    store.actions.setPostText('does-not-exist', 'hello')

    expect(fn).not.toHaveBeenCalled()
    expect(store.getState()).toBe(before)
  })

  test('unsubscribed listeners stop receiving notifications', () => {
    const store = createThreadStore({
      resolvers,
      __createId: makeIdGenerator(),
    })
    const root = rootId(store)
    const fn = jest.fn()
    const unsubscribe = store.subscribe(fn)

    store.actions.setPostText(root, 'a')
    expect(fn).toHaveBeenCalledTimes(1)
    unsubscribe()
    store.actions.setPostText(root, 'b')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('attachment mutations preserve old snapshots and unrelated post references', () => {
    const store = createThreadStore({resolvers, __createId: makeIdGenerator()})
    const root = rootId(store)
    const other = store.actions.addPost('after', root)
    const before = store.getState()
    const [mediaId] = store.actions.addMedia(root, [
      {kind: 'image', uri: 'file:///a.jpg', width: 10, height: 10},
    ])!
    expect(before.posts[root].attachments.media).toBeUndefined()
    expect(store.getState().posts[other]).toBe(before.posts[other])
    const added = store.getState()
    store.actions.updateMediaAltText(root, mediaId, 'alt')
    const media = added.posts[root].attachments.media
    if (media?.state !== 'resolved' || media.kind !== 'images')
      throw new Error('expected images')
    expect(media.items[0].altText).toBe('')
    store.actions.removeMediaAttachment(root)
    expect(added.posts[root].attachments.media).toBe(media)
    store.actions.removePost(other)
    expect(before.posts[other]).toBeDefined()
    store.destroy()
  })

  test('language and label setters copy caller arrays and preserve old snapshots', () => {
    const store = createThreadStore({
      resolvers,
      __createId: makeIdGenerator(),
    })
    const root = rootId(store)
    const before = store.getState()
    const languages = ['en']
    const labels = ['sexual']

    store.actions.setPostLanguages(root, languages)
    store.actions.setPostLabels(root, labels)
    const after = store.getState()
    languages.push('fr')
    labels.push('nudity')

    expect(before.posts[root].langs).toEqual([])
    expect(before.posts[root].labels).toEqual([])
    expect(after.posts[root].langs).toEqual(['en'])
    expect(after.posts[root].labels).toEqual(['sexual'])
    store.destroy()
  })

  test('empty slot removals preserve the snapshot', () => {
    const store = createThreadStore({resolvers})
    const root = rootId(store)
    const before = store.getState()
    store.actions.removeRecordAttachment(root)
    store.actions.removeMediaAttachment(root)
    store.actions.setPostText(root, '')
    expect(store.getState()).toBe(before)
  })

  test('destroy clears subscribers and stops further notifications', () => {
    const store = createThreadStore({
      resolvers,
      __createId: makeIdGenerator(),
    })
    const root = rootId(store)
    const fn = jest.fn()
    store.subscribe(fn)

    store.destroy()
    store.actions.setPostText(root, 'after destroy')
    expect(fn).not.toHaveBeenCalled()
  })
})
