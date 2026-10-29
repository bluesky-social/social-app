import {type Client} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'

import {PostListFeedAPI} from './posts'

function setup(count: number) {
  const uris = Array.from(
    {length: count},
    (_, i): AtUriString => `at://did:plc:alice/app.bsky.feed.post/${i}`,
  )
  const call = jest.fn((_method: unknown, {uris}: {uris: string[]}) =>
    Promise.resolve({posts: uris.map(uri => ({uri}))}),
  )
  const api = new PostListFeedAPI({
    client: {call} as unknown as Client,
    feedParams: {uris},
  })
  return {api, call, uris}
}

describe('PostListFeedAPI', () => {
  it('fetches every post, 25 at a time', async () => {
    const {api, call, uris} = setup(60)
    const fetched: string[] = []
    let cursor: string | undefined
    do {
      const page = await api.fetch({cursor})
      fetched.push(...page.feed.map(item => item.post.uri))
      cursor = page.cursor
    } while (cursor)

    expect(fetched).toEqual(uris)
    expect(call.mock.calls.map(([, params]) => params.uris.length)).toEqual([
      25, 25, 10,
    ])
  })

  it('has no cursor when one request covers the list', async () => {
    const {api} = setup(25)
    const page = await api.fetch({cursor: undefined})
    expect(page.feed).toHaveLength(25)
    expect(page.cursor).toBeUndefined()
  })

  it('returns an empty page without a request when there are no posts', async () => {
    const {api, call} = setup(0)
    const page = await api.fetch({cursor: undefined})
    expect(page).toEqual({feed: []})
    expect(call).not.toHaveBeenCalled()
  })
})
