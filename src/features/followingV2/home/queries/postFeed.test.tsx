import {type InfiniteData, QueryClient} from '@tanstack/react-query'

import {
  findAllPostsInQueryData,
  resetProfilePostsQueries,
  RQKEY as LEGACY_RQKEY,
  RQKEY_ROOT,
} from '#/state/queries/post-feed'
import {type app} from '#/lexicons'
import {type FeedDescriptor, RQKEY} from './postFeed'

jest.mock('#/state/preferences/feed-tuners', () => ({}))
jest.mock('#/state/preferences/moderation-opts', () => ({}))
jest.mock('#/state/queries/preferences', () => ({}))
jest.mock('#/state/session', () => ({}))
jest.mock('#/view/com/posts/PostFeedErrorMessage', () => ({}))

const AUTHOR = 'did:plc:author'
const POST_URI = `at://${AUTHOR}/app.bsky.feed.post/1`
const CUSTOM: FeedDescriptor = `feedgen|at://${AUTHOR}/app.bsky.feed.generator/custom`

function feedData(): InfiniteData<{feed: app.bsky.feed.defs.FeedViewPost[]}> {
  return {
    pageParams: [undefined],
    pages: [
      {
        feed: [
          {
            post: {
              uri: POST_URI,
              author: {did: AUTHOR, handle: 'author.test'},
            },
          } as unknown as app.bsky.feed.defs.FeedViewPost,
        ],
      },
    ],
  }
}

function isInvalidated(queryClient: QueryClient) {
  return queryClient.getQueryCache().getAll()[0].state.isInvalidated
}

describe('RQKEY', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('never shares an entry with the legacy key', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(LEGACY_RQKEY(CUSTOM), feedData())

    expect(queryClient.getQueryData(RQKEY(CUSTOM))).toBeUndefined()
  })

  it('is walked by the legacy cache-wide helpers', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(RQKEY('following'), feedData())

    expect([...findAllPostsInQueryData(queryClient, POST_URI)]).toHaveLength(1)
  })

  it('is reached by root invalidation', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(RQKEY('following'), feedData())

    await queryClient.invalidateQueries({queryKey: [RQKEY_ROOT]})

    expect(isInvalidated(queryClient)).toBe(true)
  })

  it('is reset when its feed matches a profile reset', () => {
    jest.useFakeTimers()
    const queryClient = new QueryClient()
    queryClient.setQueryData(RQKEY(CUSTOM), feedData())

    resetProfilePostsQueries(queryClient, AUTHOR)
    jest.runAllTimers()

    expect(queryClient.getQueryData(RQKEY(CUSTOM))).toBeUndefined()
  })

  it('is not reached by legacy single-feed filters', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(RQKEY(CUSTOM), feedData())

    await queryClient.invalidateQueries({queryKey: LEGACY_RQKEY(CUSTOM)})

    expect(isInvalidated(queryClient)).toBe(false)
  })

  it('does not reach legacy entries', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(LEGACY_RQKEY(CUSTOM), feedData())

    await queryClient.invalidateQueries({queryKey: RQKEY(CUSTOM)})

    expect(isInvalidated(queryClient)).toBe(false)
  })
})
