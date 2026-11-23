import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

import {
  feedItemFromPostSource,
  type PostSource,
  stashPostSource,
  usePostSource,
} from './postSource'

// The real modules pull in Reanimated and the feed list, which need native code.
jest.mock('#/state/queries/feed', () => ({
  isFeedSourceFeedInfo: () => false,
}))
jest.mock('#/view/com/posts/PostFeed', () => ({getItemsForFeedback: () => []}))
jest.mock('#/state/session', () => ({useAppviewClient: () => ({})}))
jest.mock('#/analytics', () => ({useAnalytics: () => ({})}))

const DID = 'did:plc:alice'
const HANDLE = 'alice.test'

let rkey = 0
/** A source for a post no other test uses, since the stash is module state. */
function source(reason?: unknown): PostSource {
  rkey++
  return {
    post: {
      post: {
        uri: `at://${DID}/app.bsky.feed.post/${rkey}`,
        cid: 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm',
        author: {did: DID, handle: HANDLE},
        record: {},
        indexedAt: '2026-11-17T00:00:00.000Z',
      },
      reason,
      feedContext: 'context',
      reqId: 'req',
    },
  } as PostSource
}

function threadUri(source: PostSource, host: string) {
  return source.post.post.uri.replace(DID, host)
}

beforeEach(() => {
  jest.useFakeTimers()
})
afterEach(() => {
  jest.useRealTimers()
})

describe('usePostSource', () => {
  it.each([
    ['DID', DID],
    ['handle', HANDLE],
    ['handle in another case', 'Alice.Test'],
  ])('finds the source from a route with the author’s %s', (_, host) => {
    const stashed = source()
    stashPostSource(stashed)

    const {result} = renderHook(() => usePostSource(threadUri(stashed, host)))

    expect(result.current).toBe(stashed)
  })

  it('gives the source to the first screen that opens the post, and keeps it there', () => {
    const stashed = source()
    stashPostSource(stashed)
    const uri = threadUri(stashed, HANDLE)

    const first = renderHook(() => usePostSource(uri))
    first.rerender(undefined)
    const second = renderHook(() => usePostSource(uri))

    expect(first.result.current).toBe(stashed)
    expect(second.result.current).toBeUndefined()
  })

  it('drops a source that no screen took in time', () => {
    const stashed = source()
    stashPostSource(stashed)

    jest.advanceTimersByTime(11e3)
    const {result} = renderHook(() => usePostSource(threadUri(stashed, DID)))

    expect(result.current).toBeUndefined()
  })

  it('finds nothing for a post that was not opened from a feed', () => {
    const {result} = renderHook(() =>
      usePostSource(`at://${DID}/app.bsky.feed.post/not-stashed`),
    )

    expect(result.current).toBeUndefined()
  })
})

describe('feedItemFromPostSource', () => {
  it('describes the feed item, with the repost it was shown through', () => {
    const repost = {
      $type: 'app.bsky.feed.defs#reasonRepost',
      by: {did: 'did:plc:bob', handle: 'bob.test'},
      uri: 'at://did:plc:bob/app.bsky.feed.repost/1',
      cid: 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm',
      indexedAt: '2026-11-17T00:00:00.000Z',
    }
    const stashed = source(repost)

    expect(feedItemFromPostSource(stashed)).toEqual({
      uri: stashed.post.post.uri,
      authorDid: DID,
      feedContext: 'context',
      reqId: 'req',
      via: {uri: repost.uri, cid: repost.cid},
    })
  })

  it('has no via when the post was not shown as a repost', () => {
    expect(feedItemFromPostSource(source()).via).toBeUndefined()
  })
})
