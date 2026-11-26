import {afterEach, describe, expect, it, jest} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

import {stashPostZoomSource, usePostZoomSource} from './zoomSource'

const DID = 'did:plc:alice'
const HANDLE = 'Alice.test'

function post(rkey: string) {
  return {
    uri: `at://${DID}/app.bsky.feed.post/${rkey}`,
    author: {did: DID, handle: HANDLE},
  }
}

describe('post zoom source', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('matches a thread route by DID or by handle in any case', () => {
    stashPostZoomSource({post: post('a'), identifier: 'source-a'})
    const byHandle = renderHook(() =>
      usePostZoomSource('at://alice.TEST/app.bsky.feed.post/a'),
    )
    expect(byHandle.result.current).toBe('source-a')

    stashPostZoomSource({post: post('b'), identifier: 'source-b'})
    const byDid = renderHook(() =>
      usePostZoomSource(`at://${DID}/app.bsky.feed.post/b`),
    )
    expect(byDid.result.current).toBe('source-b')
  })

  it('ignores a thread for a different post', () => {
    stashPostZoomSource({post: post('c'), identifier: 'source-c'})
    const otherRkey = renderHook(() =>
      usePostZoomSource(`at://${DID}/app.bsky.feed.post/other`),
    )
    expect(otherRkey.result.current).toBeUndefined()

    const otherAuthor = renderHook(() =>
      usePostZoomSource('at://did:plc:bob/app.bsky.feed.post/c'),
    )
    expect(otherAuthor.result.current).toBeUndefined()
  })

  it('is taken once, and kept by the screen that took it', () => {
    stashPostZoomSource({post: post('d'), identifier: 'source-d'})
    const uri = `at://${DID}/app.bsky.feed.post/d`
    const first = renderHook(() => usePostZoomSource(uri))
    first.rerender({})
    expect(first.result.current).toBe('source-d')

    const second = renderHook(() => usePostZoomSource(uri))
    expect(second.result.current).toBeUndefined()
  })

  it('expires', () => {
    jest.useFakeTimers({now: 0})
    stashPostZoomSource({post: post('e'), identifier: 'source-e'})
    jest.setSystemTime(10e3 + 1)
    const {result} = renderHook(() =>
      usePostZoomSource(`at://${DID}/app.bsky.feed.post/e`),
    )
    expect(result.current).toBeUndefined()
  })
})
