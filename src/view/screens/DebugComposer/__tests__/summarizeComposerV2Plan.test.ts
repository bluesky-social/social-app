import {describe, expect, jest, test} from '@jest/globals'

jest.unmock('multiformats/cid')
jest.unmock('multiformats/hashes/hasher')
/* Avoid loading the UI module chain through the real link resolver. */
jest.mock('#/lib/api/resolve', () => ({
  resolveLink: jest.fn(),
}))

import {TID} from '@atproto/common-web'
import {type Client} from '@atproto/lex'

import {summarizeComposerV2Plan} from '#/view/screens/DebugComposer/summarizeComposerV2Plan'
import {
  type ComposerV2PlannerDependencies,
  planComposerV2,
} from '#/components/ComposerV2/planner'
import {
  type ThreadState,
  type ThreadStoreInitialState,
} from '#/components/ComposerV2/store/types'
import {buildThreadState} from '#/components/ComposerV2/store/utils/buildThreadState'

function snapshot(initial: ThreadStoreInitialState): ThreadState {
  let id = 0
  return buildThreadState({input: initial, createId: () => `post-${++id}`})
}

/* Plain text without mentions never reaches the appview client. */
function plan(
  state: ThreadState,
  extra: Partial<ComposerV2PlannerDependencies> = {},
) {
  return planComposerV2({
    snapshot: state,
    dependencies: {
      did: 'did:plc:summary-test',
      appviewClient: {} as Client,
      now: () => new Date('2024-01-01T00:00:00.000Z'),
      __createRkey: (index, createdAt) =>
        TID.fromTime(createdAt.getTime() * 1000, index).toString(),
      ...extra,
    },
  })
}

describe('summarizeComposerV2Plan', () => {
  test('an unexpected planner failure keeps its private cause out of the summary', async () => {
    const cause = new Error('private diagnostic')
    const result = await plan(snapshot({posts: [{text: 'hello'}]}), {
      now: () => {
        throw cause
      },
    })
    expect(result.ok).toBe(false)

    const summary = summarizeComposerV2Plan({result})
    expect(summary).toEqual({
      ok: false,
      errors: [
        {code: 'unexpected-error', postIndex: undefined, collection: undefined},
      ],
    })
    expect(JSON.stringify(summary)).not.toContain('private diagnostic')
  })

  test('readiness failures carry codes and locations, not messages', async () => {
    const state = snapshot({
      posts: [
        {
          attachments: {
            media: {
              kind: 'images',
              items: [{uri: 'file:///image-0.jpg', width: 100, height: 80}],
            },
          },
        },
      ],
    })
    const postId = Object.keys(state.posts)[0]
    const media = state.posts[postId].attachments.media
    if (media?.state !== 'resolved' || media.kind !== 'images') {
      throw new Error('expected image media')
    }
    media.items[0].upload = {
      state: 'failed',
      error: 'private worker detail',
      retryable: false,
    }
    const result = await plan(state)

    const summary = summarizeComposerV2Plan({result})
    expect(summary.ok).toBe(false)
    expect(JSON.stringify(summary)).not.toContain('private worker detail')
    if (!summary.ok) {
      expect(summary.errors[0]).toEqual({
        code: 'media-failed',
        postIndex: 0,
        collection: undefined,
      })
    }
  })

  test('summarizes successful plans without exposing post text', async () => {
    const state = snapshot({posts: [{text: 'extremely private words'}]})
    const result = await plan(state)
    expect(result.ok).toBe(true)
    const summary = summarizeComposerV2Plan({result})
    expect(summary.ok).toBe(true)
    expect(JSON.stringify(summary)).not.toContain('extremely private words')
    if (summary.ok) {
      expect(summary.posts[0].textGraphemes).toBe(23)
      expect(summary.writesByCollection).toEqual({'app.bsky.feed.post': 1})
    }
  })

  test('summarizes reply relationships and per-post gate associations by reference', async () => {
    const state = snapshot({
      posts: [{text: 'root post'}, {text: 'second post'}],
      threadgateAllowRules: [{$type: 'app.bsky.feed.threadgate#mentionRule'}],
      postgateEmbeddingRules: [{$type: 'app.bsky.feed.postgate#disableRule'}],
    })
    const result = await plan(state)
    expect(result.ok).toBe(true)
    const summary = summarizeComposerV2Plan({result})
    expect(summary.ok).toBe(true)
    if (!summary.ok) return

    /* Root post: no reply refs; second post: chained to the root. */
    expect(summary.posts[0].replyRootUri).toBeUndefined()
    expect(summary.posts[0].replyParentUri).toBeUndefined()
    expect(summary.posts[1].replyRootUri).toBe(summary.posts[0].uri)
    expect(summary.posts[1].replyParentUri).toBe(summary.posts[0].uri)

    /* Threadgate on the root only; postgate per post; refs, not payloads. */
    expect(summary.gates).toEqual([
      {
        collection: 'app.bsky.feed.threadgate',
        rkey: summary.posts[0].rkey,
        postUri: summary.posts[0].uri,
      },
      {
        collection: 'app.bsky.feed.postgate',
        rkey: summary.posts[0].rkey,
        postUri: summary.posts[0].uri,
      },
      {
        collection: 'app.bsky.feed.postgate',
        rkey: summary.posts[1].rkey,
        postUri: summary.posts[1].uri,
      },
    ])
    expect(summary.writesByCollection).toEqual({
      'app.bsky.feed.post': 2,
      'app.bsky.feed.threadgate': 1,
      'app.bsky.feed.postgate': 2,
    })
    expect(JSON.stringify(summary)).not.toContain('mentionRule')
    expect(JSON.stringify(summary)).not.toContain('root post')
  })
})
