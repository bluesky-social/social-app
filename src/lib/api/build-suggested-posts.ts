import {RootStoreModel} from 'state/index'
import {
  AppBskyFeedFeedViewPost,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
} from '@atproto/api'
type ReasonRepost = AppBskyFeedFeedViewPost.ReasonRepost

async function getMultipleAuthorsPosts(
  rootStore: RootStoreModel,
  authors: string[],
  cursor: string | undefined = undefined,
  limit: number = 10,
) {
  const responses = await Promise.all(
    authors.map((author, index) =>
      rootStore.api.app.bsky.feed
        .getAuthorFeed({
          author,
          limit,
          before: cursor ? cursor.split(',')[index] : undefined,
        })
        .catch(_err => ({success: false, headers: {}, data: {feed: []}})),
    ),
  )
  return responses
}

function mergePosts(
  responses: GetAuthorFeed.Response[],
  {repostsOnly, bestOfOnly}: {repostsOnly?: boolean; bestOfOnly?: boolean},
) {
  let posts: AppBskyFeedFeedViewPost.Main[] = []

  if (bestOfOnly) {
    for (const res of responses) {
      if (res.success) {
        // filter the feed down to the post with the most upvotes
        res.data.feed = res.data.feed.reduce(
          (acc: AppBskyFeedFeedViewPost.Main[], v) => {
            if (!acc?.[0] && !v.reason) {
              return [v]
            }
            if (
              acc &&
              !v.reason &&
              v.post.upvoteCount > acc[0].post.upvoteCount
            ) {
              return [v]
            }
            return acc
          },
          [],
        )
      }
    }
  }

  // merge into one array
  for (const res of responses) {
    if (res.success) {
      posts = posts.concat(res.data.feed)
    }
  }

  // filter down to reposts of other users
  const uris = new Set()
  posts = posts.filter(p => {
    if (repostsOnly && !isARepostOfSomeoneElse(p)) {
      return false
    }
    if (uris.has(p.post.uri)) {
      return false
    }
    uris.add(p.post.uri)
    return true
  })

  // sort by index time
  posts.sort((a, b) => {
    return (
      Number(new Date(b.post.indexedAt)) - Number(new Date(a.post.indexedAt))
    )
  })

  return posts
}

function isARepostOfSomeoneElse(post: AppBskyFeedFeedViewPost.Main): boolean {
  return (
    post.reason?.$type === 'app.bsky.feed.feedViewPost#reasonRepost' &&
    post.post.author.did !== (post.reason as ReasonRepost).by.did
  )
}

function getCombinedCursors(responses: GetAuthorFeed.Response[]) {
  let hasCursor = false
  const cursors = responses.map(r => {
    if (r.data.cursor) {
      hasCursor = true
      return r.data.cursor
    }
    return ''
  })
  if (!hasCursor) {
    return undefined
  }
  const combinedCursors = cursors.join(',')
  return combinedCursors
}

function isCombinedCursor(cursor: string) {
  return cursor.includes(',')
}

export {
  getMultipleAuthorsPosts,
  mergePosts,
  getCombinedCursors,
  isCombinedCursor,
}
