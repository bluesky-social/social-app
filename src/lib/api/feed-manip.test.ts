import {type app} from '#/lexicons'
import {createFeedViewPostsSlices} from './feed-manip'

jest.mock('./feed/home', () => ({
  FALLBACK_MARKER_POST: {post: {uri: 'at://did:plc:test/app.bsky.feed.post/1'}},
}))

const author = {
  $type: 'app.bsky.actor.defs#profileViewBasic',
  did: 'did:plc:alice',
  handle: 'alice.test',
} as app.bsky.actor.defs.ProfileViewBasic

function post(id: string) {
  return {
    $type: 'app.bsky.feed.defs#postView',
    uri: `at://did:plc:alice/app.bsky.feed.post/${id}`,
    cid: id,
    author,
    record: {
      $type: 'app.bsky.feed.post',
      text: id,
      createdAt: '2026-08-31T00:00:00.000Z',
    },
    indexedAt: '2026-08-31T00:00:00.000Z',
  } as app.bsky.feed.defs.PostView
}

describe('createFeedViewPostsSlices', () => {
  it('preserves selected numbering and infers hydrated parent and root numbering', () => {
    const root = post('root')
    const parent = post('parent')
    const selected = post('selected')
    const feedPost = {
      post: selected,
      reply: {root, parent},
      opThreadPostIndex: 3,
      opThreadPostCount: 4,
    } as app.bsky.feed.defs.FeedViewPost & {
      opThreadPostIndex: number
      opThreadPostCount: number
    }

    const [slice] = createFeedViewPostsSlices([feedPost])

    expect(
      slice.items.map(item => [item.post.uri, item.postNumbering]),
    ).toEqual([
      [root.uri, {opThreadPostIndex: 1, opThreadPostCount: 4}],
      [parent.uri, {opThreadPostIndex: 2, opThreadPostCount: 4}],
      [selected.uri, {opThreadPostIndex: 3, opThreadPostCount: 4}],
    ])
  })
})
