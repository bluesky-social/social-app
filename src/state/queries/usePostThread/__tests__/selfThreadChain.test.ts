import {
  AppBskyUnspeccedDefs,
  type AppBskyUnspeccedGetPostThreadV2,
} from '@atproto/api'

import {extendSelfThreadChain} from '../selfThreadChain'

type RawThreadItem = AppBskyUnspeccedGetPostThreadV2.ThreadItem

const OP_DID = 'did:plc:op'

function post({
  rkey,
  depth,
  did = OP_DID,
  opThread = true,
  moreReplies = 0,
  replyCount = 0,
}: {
  rkey: string
  depth: number
  did?: string
  opThread?: boolean
  moreReplies?: number
  replyCount?: number
}): RawThreadItem {
  const uri = `at://${did}/app.bsky.feed.post/${rkey}`
  return {
    uri,
    depth,
    value: {
      $type: 'app.bsky.unspecced.defs#threadItemPost',
      post: {
        uri,
        author: {did, handle: 'user.test'},
        record: {},
        replyCount,
      },
      moreParents: false,
      moreReplies,
      opThread,
      hiddenByThreadgate: false,
      mutedByViewer: false,
    },
  } as unknown as RawThreadItem
}

const rkeys = (thread: RawThreadItem[]) =>
  thread.map(item => item.uri.split('/').pop())

const depths = (thread: RawThreadItem[]) => thread.map(item => item.depth)

describe('extendSelfThreadChain', () => {
  it('does not fetch when the chain tip has a hydrated child', async () => {
    const fetchBelow = jest.fn()
    // the tip has replies, but one is hydrated below it, so the tip did not
    // sit at the response's depth cap and the chain ended for real
    const thread = [
      post({rkey: 'a', depth: 0, replyCount: 1}),
      post({rkey: 'b', depth: 1, replyCount: 1}),
      post({rkey: 'c', depth: 2, replyCount: 1, moreReplies: 0}),
      post({rkey: 'x', depth: 3, did: 'did:plc:other'}),
    ]
    const result = await extendSelfThreadChain({thread, fetchBelow})

    expect(fetchBelow).not.toHaveBeenCalled()
    expect(result).toBe(thread)
  })

  it('extends a chain truncated at the depth cap', async () => {
    const thread = [
      post({rkey: 'a', depth: 0, replyCount: 1}),
      post({rkey: 'b', depth: 1, replyCount: 1}),
      post({rkey: 'c', depth: 2, replyCount: 1}),
      post({rkey: 'd', depth: 3, replyCount: 2, moreReplies: 2}),
    ]
    const fetchBelow = jest
      .fn()
      .mockResolvedValue([
        post({rkey: 'd', depth: 0, replyCount: 2, moreReplies: 1}),
        post({rkey: 'e', depth: 1, replyCount: 1}),
        post({rkey: 'f', depth: 2}),
      ])
    const result = await extendSelfThreadChain({thread, fetchBelow})

    expect(fetchBelow).toHaveBeenCalledTimes(1)
    expect(fetchBelow).toHaveBeenCalledWith(thread[3].uri)
    expect(rkeys(result)).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    // continuation depths are made absolute
    expect(depths(result)).toEqual([0, 1, 2, 3, 4, 5])
    // the old tip's continuation is now hydrated, so moreReplies drops by one
    const tipValue = result[3].value
    if (!AppBskyUnspeccedDefs.isThreadItemPost(tipValue)) {
      throw new Error('expected tip to be a post')
    }
    expect(tipValue.moreReplies).toBe(1)
  })

  it('keeps fetching until the chain ends naturally', async () => {
    const thread = [
      post({rkey: 'a', depth: 0, replyCount: 1}),
      post({rkey: 'b', depth: 1, replyCount: 1}),
      post({rkey: 'c', depth: 2, replyCount: 1}),
      post({rkey: 'd', depth: 3, replyCount: 1, moreReplies: 1}),
    ]
    const pages: RawThreadItem[][] = [
      [
        post({rkey: 'd', depth: 0, replyCount: 1}),
        post({rkey: 'e', depth: 1, replyCount: 1}),
        post({rkey: 'f', depth: 2, replyCount: 1}),
        post({rkey: 'g', depth: 3, replyCount: 1, moreReplies: 1}),
      ],
      [post({rkey: 'g', depth: 0, replyCount: 1}), post({rkey: 'h', depth: 1})],
    ]
    const fetchBelow = jest.fn(() => Promise.resolve(pages.shift()!))
    const result = await extendSelfThreadChain({thread, fetchBelow})

    expect(fetchBelow).toHaveBeenCalledTimes(2)
    expect(rkeys(result)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
    expect(depths(result)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('stops at maxFetches even if the chain continues', async () => {
    const thread = [
      post({rkey: 'a', depth: 0, replyCount: 1}),
      post({rkey: 'b0', depth: 1, replyCount: 1}),
      post({rkey: 'b1', depth: 2, replyCount: 1}),
      post({rkey: 'b2', depth: 3, replyCount: 1, moreReplies: 1}),
    ]
    let n = 2
    const fetchBelow = jest.fn((anchorUri: string) => {
      const anchorRkey = anchorUri.split('/').pop()
      return Promise.resolve([
        post({rkey: anchorRkey!, depth: 0, replyCount: 1}),
        post({rkey: `c${n}`, depth: 1, replyCount: 1}),
        post({rkey: `c${n + 1}`, depth: 2, replyCount: 1}),
        post({rkey: `c${n++}x`, depth: 3, replyCount: 1, moreReplies: 1}),
      ])
    })
    const result = await extendSelfThreadChain({
      thread,
      maxFetches: 2,
      fetchBelow,
    })

    expect(fetchBelow).toHaveBeenCalledTimes(2)
    expect(result.length).toBe(4 + 2 * 3)
  })

  it('stops when the continuation has no OP chain', async () => {
    const thread = [
      post({rkey: 'a', depth: 0, replyCount: 1}),
      post({rkey: 'b', depth: 1, replyCount: 1}),
      post({rkey: 'c', depth: 2, replyCount: 1}),
      post({rkey: 'd', depth: 3, replyCount: 1, moreReplies: 1}),
    ]
    const fetchBelow = jest
      .fn()
      .mockResolvedValue([
        post({rkey: 'd', depth: 0, replyCount: 1}),
        post({rkey: 'x', depth: 1, did: 'did:plc:other'}),
      ])
    const result = await extendSelfThreadChain({thread, fetchBelow})

    expect(fetchBelow).toHaveBeenCalledTimes(1)
    expect(rkeys(result)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('skips the fetch when the tip has no replies', async () => {
    const fetchBelow = jest.fn()
    const thread = [
      post({rkey: 'a', depth: 0, replyCount: 1}),
      post({rkey: 'b', depth: 1, replyCount: 1}),
      post({rkey: 'c', depth: 2, replyCount: 1}),
      post({rkey: 'd', depth: 3, replyCount: 0, moreReplies: 0}),
    ]
    const result = await extendSelfThreadChain({thread, fetchBelow})

    expect(fetchBelow).not.toHaveBeenCalled()
    expect(rkeys(result)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('splices the continuation before trailing sibling branches', async () => {
    const thread = [
      post({rkey: 'a', depth: 0, replyCount: 2}),
      post({rkey: 'b', depth: 1, replyCount: 1}),
      post({rkey: 'c', depth: 2, replyCount: 1}),
      post({rkey: 'd', depth: 3, replyCount: 1, moreReplies: 1}),
      post({rkey: 'z', depth: 1, did: 'did:plc:other', opThread: false}),
    ]
    const fetchBelow = jest
      .fn()
      .mockResolvedValue([
        post({rkey: 'd', depth: 0, replyCount: 1}),
        post({rkey: 'e', depth: 1}),
      ])
    const result = await extendSelfThreadChain({thread, fetchBelow})

    expect(rkeys(result)).toEqual(['a', 'b', 'c', 'd', 'e', 'z'])
    expect(depths(result)).toEqual([0, 1, 2, 3, 4, 1])
  })
})
