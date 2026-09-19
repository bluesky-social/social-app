import {describe, expect, jest, test} from '@jest/globals'

jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

import {type LinkResolvers, type ResolvedLink} from '#/lib/api/resolve'
import {createThreadStore} from '#/components/ComposerV2/store'
import {
  type PostgateEmbeddingRule,
  type ThreadgateAllowRule,
} from '#/components/ComposerV2/store/types'

const resolvers = {} as LinkResolvers

function makeStore(initialState = {}) {
  let id = 0
  return createThreadStore({
    resolvers,
    initialState,
    __createId: () => `id-${++id}`,
  })
}

function rootId(store: ReturnType<typeof makeStore>) {
  return Object.keys(store.getState().posts)[0]
}

const mentionRule = {
  $type: 'app.bsky.feed.threadgate#mentionRule',
} as const
const followerRule = {
  $type: 'app.bsky.feed.threadgate#followerRule',
} as const
const followingRule = {
  $type: 'app.bsky.feed.threadgate#followingRule',
} as const
const listRule = (list: string) => ({
  $type: 'app.bsky.feed.threadgate#listRule',
  list,
})
const disableRule = {
  $type: 'app.bsky.feed.postgate#disableRule',
} as const

function unknownThreadgateRule() {
  return {
    $type: 'app.bsky.feed.threadgate#futureRule',
    nested: {enabled: true, values: ['opaque']},
  } as unknown as ThreadgateAllowRule
}

function unknownPostgateRule() {
  return {
    $type: 'app.bsky.feed.postgate#futureRule',
    nested: {enabled: true, values: ['opaque']},
  } as unknown as PostgateEmbeddingRule
}

type OpaqueRule = {nested: {enabled: boolean; values?: string[]}}

function opaqueRule(value: unknown) {
  return value as OpaqueRule
}

describe('threadgate and postgate state', () => {
  test('defaults to allow-all replies and allow-all quoting without background work', () => {
    const store = makeStore()

    expect(store.getState()).toMatchObject({
      threadgateAllowRules: undefined,
      postgateEmbeddingRules: [],
      isDirty: false,
    })
    store.destroy()
  })

  test('preserves undefined everybody versus an explicit empty nobody setting', () => {
    const everybody = makeStore({threadgateAllowRules: undefined})
    const nobody = makeStore({threadgateAllowRules: []})

    expect(everybody.getState().threadgateAllowRules).toBeUndefined()
    expect(nobody.getState().threadgateAllowRules).toEqual([])
    everybody.destroy()
    nobody.destroy()
  })

  test('preserves every supported rule, multiple lists, and opaque rules', () => {
    const threadgateAllowRules = [
      mentionRule,
      followerRule,
      followingRule,
      listRule('at://did:plc:list-one/app.bsky.graph.list/one'),
      listRule('at://did:plc:list-two/app.bsky.graph.list/two'),
      unknownThreadgateRule(),
    ] as unknown as ThreadgateAllowRule[]
    const postgateEmbeddingRules = [
      disableRule,
      unknownPostgateRule(),
    ] as unknown as PostgateEmbeddingRule[]
    const store = makeStore({
      threadgateAllowRules,
      postgateEmbeddingRules,
    })

    expect(store.getState().threadgateAllowRules).toEqual(threadgateAllowRules)
    expect(store.getState().postgateEmbeddingRules).toEqual(
      postgateEmbeddingRules,
    )
    expect(store.getState().threadgateAllowRules).not.toBe(threadgateAllowRules)
    expect(store.getState().threadgateAllowRules?.[5]).not.toBe(
      threadgateAllowRules[5],
    )
    expect(store.getState().postgateEmbeddingRules[1]).not.toBe(
      postgateEmbeddingRules[1],
    )

    threadgateAllowRules.push(mentionRule)
    postgateEmbeddingRules.push(disableRule)
    opaqueRule(threadgateAllowRules[5]).nested.enabled = false
    opaqueRule(postgateEmbeddingRules[1]).nested.enabled = false
    expect(store.getState().threadgateAllowRules).toHaveLength(6)
    expect(store.getState().postgateEmbeddingRules).toHaveLength(2)
    expect(
      opaqueRule(store.getState().threadgateAllowRules?.[5]).nested.enabled,
    ).toBe(true)
    expect(
      opaqueRule(store.getState().postgateEmbeddingRules[1]).nested.enabled,
    ).toBe(true)
    store.destroy()
  })

  test('gate edits are dirty, isolated, structurally shared, and no-op when values repeat', () => {
    const store = makeStore()
    const root = rootId(store)
    const other = store.actions.addPost('after', root)
    const before = store.getState()
    const notify = jest.fn()
    store.subscribe(notify)
    const rules = [unknownThreadgateRule()] as ThreadgateAllowRule[]

    store.actions.setThreadgateAllowRules(rules)
    const afterThreadgate = store.getState()
    expect(afterThreadgate.isDirty).toBe(true)
    expect(notify).toHaveBeenCalledTimes(1)
    expect(afterThreadgate.posts[root]).toBe(before.posts[root])
    expect(afterThreadgate.posts[other]).toBe(before.posts[other])
    rules.push(mentionRule)
    opaqueRule(rules[0]).nested.enabled = false
    expect(afterThreadgate.threadgateAllowRules).toHaveLength(1)
    expect(
      opaqueRule(afterThreadgate.threadgateAllowRules?.[0]).nested.enabled,
    ).toBe(true)

    store.actions.setThreadgateAllowRules([
      {
        ...unknownThreadgateRule(),
        nested: {enabled: true, values: ['opaque']},
      } as unknown as ThreadgateAllowRule,
    ])
    expect(notify).toHaveBeenCalledTimes(1)
    expect(store.getState()).toBe(afterThreadgate)

    const postgateRules = [unknownPostgateRule()] as PostgateEmbeddingRule[]
    store.actions.setPostgateConfiguration({
      embeddingRules: postgateRules,
    })
    const afterPostgate = store.getState()
    expect(notify).toHaveBeenCalledTimes(2)
    expect(afterPostgate.posts[root]).toBe(before.posts[root])
    expect(afterPostgate.posts[other]).toBe(before.posts[other])
    postgateRules.push(disableRule)
    opaqueRule(postgateRules[0]).nested.enabled = false
    expect(afterPostgate.postgateEmbeddingRules).toHaveLength(1)
    expect(
      opaqueRule(afterPostgate.postgateEmbeddingRules[0]).nested.enabled,
    ).toBe(true)
    store.actions.setPostgateConfiguration({
      embeddingRules: [unknownPostgateRule()],
    })
    expect(notify).toHaveBeenCalledTimes(2)
    expect(store.getState()).toBe(afterPostgate)

    store.actions.setThreadgateAllowRules([])
    const latest = store.getState()
    expect(notify).toHaveBeenCalledTimes(3)
    expect(latest.posts[root]).toBe(before.posts[root])
    expect(latest.posts[other]).toBe(before.posts[other])
    expect(afterThreadgate.threadgateAllowRules?.[0]).toEqual(
      unknownThreadgateRule(),
    )
    expect(latest.threadgateAllowRules).toEqual([])
    store.actions.setThreadgateAllowRules([])
    expect(notify).toHaveBeenCalledTimes(3)
    expect(store.getState()).toBe(latest)
    store.destroy()
  })

  test('gates survive ordinary post and media edits and are guarded after destroy', () => {
    jest.useFakeTimers()
    const store = makeStore({
      threadgateAllowRules: [mentionRule],
      postgateEmbeddingRules: [disableRule],
    })
    const root = rootId(store)
    const before = store.getState()
    store.actions.setPostText(root, 'text')
    const second = store.actions.addPost('after', root)
    store.actions.addMedia(root, [
      {kind: 'image', uri: 'file:///image.jpg', width: 10, height: 10},
    ])
    store.actions.removePost(second)
    jest.runAllTimers()

    expect(store.getState().threadgateAllowRules).toEqual([mentionRule])
    expect(store.getState().postgateEmbeddingRules).toEqual([disableRule])
    expect(store.getState().threadgateAllowRules).toBe(
      before.threadgateAllowRules,
    )
    expect(store.getState().postgateEmbeddingRules).toBe(
      before.postgateEmbeddingRules,
    )

    store.destroy()
    const destroyed = store.getState()
    store.actions.setThreadgateAllowRules([])
    store.actions.setPostgateEmbeddingRules([])
    expect(store.getState()).toBe(destroyed)
    jest.useRealTimers()
  })

  test('link resolution does not alter shared gate configuration', async () => {
    const resolvedRecord = {
      type: 'record',
      kind: 'post',
      record: {
        uri: 'at://did:plc:author/app.bsky.feed.post/one',
        cid: 'cid',
      },
    } as unknown as ResolvedLink
    let resolveLink!: () => void
    const linkPromise = new Promise<void>(resolve => {
      resolveLink = resolve
    })
    const store = createThreadStore({
      resolvers,
      initialState: {
        threadgateAllowRules: [],
        postgateEmbeddingRules: [disableRule],
        posts: [
          {
            attachments: {
              record: {kind: 'uri', uri: 'https://example.com/post'},
            },
          },
        ],
      },
      __resolveLink: async () => {
        await linkPromise
        return resolvedRecord
      },
    })
    const before = store.getState()
    resolveLink()
    await linkPromise
    await Promise.resolve()

    expect(store.getState().threadgateAllowRules).toBe(
      before.threadgateAllowRules,
    )
    expect(store.getState().postgateEmbeddingRules).toBe(
      before.postgateEmbeddingRules,
    )
    store.destroy()
  })
})
