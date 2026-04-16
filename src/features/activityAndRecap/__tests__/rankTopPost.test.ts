import {describe, expect, test} from '@jest/globals'

import {
  rankTopPost,
  type TopPostCandidate,
} from '#/features/activityAndRecap/reducer/rankTopPost'

function mkPost(
  uri: string,
  likes: number,
  reposts: number,
  replies: number,
  indexedAtMs: number,
): TopPostCandidate {
  return {
    uri,
    cid: `cid-${uri}`,
    likeCount: likes,
    repostCount: reposts,
    replyCount: replies,
    indexedAtMs,
  }
}

describe('rankTopPost', () => {
  test('sorts by likes+reposts+replies descending', () => {
    const input = [
      mkPost('a', 1, 0, 0, 100),
      mkPost('b', 5, 2, 1, 100), // score 8
      mkPost('c', 3, 1, 0, 100), // score 4
    ]
    const out = rankTopPost(input)
    expect(out.map(p => p.uri)).toEqual(['b', 'c', 'a'])
  })

  test('tiebreaker: newer wins', () => {
    const input = [mkPost('old', 2, 2, 0, 1000), mkPost('new', 2, 2, 0, 2000)]
    const out = rankTopPost(input)
    expect(out[0].uri).toBe('new')
  })

  test('does not mutate input', () => {
    const input = [mkPost('a', 1, 0, 0, 100), mkPost('b', 5, 2, 1, 100)]
    const snapshot = JSON.parse(JSON.stringify(input))
    rankTopPost(input)
    expect(input).toEqual(snapshot)
  })

  test('handles empty input', () => {
    expect(rankTopPost([])).toEqual([])
  })

  test('coerces missing count fields to 0', () => {
    const a = {
      uri: 'a',
      cid: 'ca',
      indexedAtMs: 100,
      likeCount: undefined as any,
      repostCount: undefined as any,
      replyCount: undefined as any,
    }
    const b = mkPost('b', 0, 0, 1, 200)
    const out = rankTopPost([a, b])
    expect(out[0].uri).toBe('b')
  })
})
