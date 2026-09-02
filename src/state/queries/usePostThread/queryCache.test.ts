import {QueryClient} from '@tanstack/react-query'

import {findAllPostsInQueryData as findAllPostsInBookmarksQueryData} from '#/state/queries/bookmarks/useBookmarksQuery'
import {
  findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData,
  findPostNumberingInQueryData as findPostNumberingInExploreFeedPreviewsQueryData,
} from '#/state/queries/explore-feed-previews'
import {findAllPostsInQueryData as findAllPostsInNotifsQueryData} from '#/state/queries/notifications/feed'
import {
  findAllPostsInQueryData as findAllPostsInFeedQueryData,
  findPostNumberingInQueryData as findPostNumberingInFeedQueryData,
} from '#/state/queries/post-feed'
import {findAllPostsInQueryData as findAllPostsInQuoteQueryData} from '#/state/queries/post-quotes'
import {findAllPostsInQueryData as findAllPostsInSearchQueryData} from '#/state/queries/search-posts-v2'
import {type app} from '#/lexicons'
import {getThreadPlaceholder} from './queryCache'

jest.mock('#/state/cache/post-shadow', () => ({
  dangerousGetPostShadow: jest.fn(),
  updatePostShadow: jest.fn(),
}))
jest.mock('#/state/queries/bookmarks/useBookmarksQuery', () => ({
  findAllPostsInQueryData: jest.fn(),
}))
jest.mock('#/state/queries/explore-feed-previews', () => ({
  findAllPostsInQueryData: jest.fn(),
  findPostNumberingInQueryData: jest.fn(),
}))
jest.mock('#/state/queries/notifications/feed', () => ({
  findAllPostsInQueryData: jest.fn(),
}))
jest.mock('#/state/queries/post-feed', () => ({
  findAllPostsInQueryData: jest.fn(),
  findPostNumberingInQueryData: jest.fn(),
}))
jest.mock('#/state/queries/post-quotes', () => ({
  findAllPostsInQueryData: jest.fn(),
}))
jest.mock('#/state/queries/search-posts-v2', () => ({
  findAllPostsInQueryData: jest.fn(),
}))
jest.mock('#/state/queries/usePostThread', () => ({
  usePostThreadContext: jest.fn(),
}))

const finders = [
  findAllPostsInBookmarksQueryData,
  findAllPostsInExploreFeedPreviewsQueryData,
  findAllPostsInNotifsQueryData,
  findAllPostsInFeedQueryData,
  findAllPostsInQuoteQueryData,
  findAllPostsInSearchQueryData,
]

function post(uri: string, likeCount: number) {
  return {
    $type: 'app.bsky.feed.defs#postView',
    uri,
    likeCount,
  } as app.bsky.feed.defs.PostView
}

describe('getThreadPlaceholder', () => {
  const queryClient = new QueryClient()

  beforeEach(() => {
    jest.resetAllMocks()
    for (const finder of finders) {
      jest.mocked(finder).mockImplementation(function* () {})
    }
    jest.mocked(findPostNumberingInFeedQueryData).mockReturnValue(undefined)
    jest
      .mocked(findPostNumberingInExploreFeedPreviewsQueryData)
      .mockReturnValue(undefined)
  })

  it('combines feed numbering with the preferred cached post', () => {
    const uri = 'at://did:plc:alice/app.bsky.feed.post/1'
    const notificationPost = post(uri, 4)
    const feedPost = post(uri, 1)
    jest.mocked(findPostNumberingInFeedQueryData).mockReturnValue({
      opThreadPostIndex: 2,
      opThreadPostCount: 4,
    })
    jest.mocked(findAllPostsInNotifsQueryData).mockImplementation(function* () {
      yield notificationPost
      return undefined
    })
    jest.mocked(findAllPostsInFeedQueryData).mockImplementation(function* () {
      yield feedPost
      return undefined
    })

    const placeholder = getThreadPlaceholder(queryClient, uri)

    expect(placeholder?.value).toMatchObject({
      post: notificationPost,
      opThread: true,
      opThreadPostIndex: 2,
      opThreadPostCount: 4,
    })
  })

  it('keeps non-numbered placeholders out of the OP thread', () => {
    const uri = 'at://did:plc:alice/app.bsky.feed.post/1'
    jest.mocked(findAllPostsInFeedQueryData).mockImplementation(function* () {
      yield post(uri, 1)
      return undefined
    })

    const placeholder = getThreadPlaceholder(queryClient, uri)

    expect(placeholder?.value).toMatchObject({opThread: false})
    expect(placeholder?.value).not.toHaveProperty('opThreadPostIndex')
    expect(placeholder?.value).not.toHaveProperty('opThreadPostCount')
  })
})
