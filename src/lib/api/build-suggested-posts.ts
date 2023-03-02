import {RootStoreModel} from 'state/index'
import {
  AppBskyFeedFeedViewPost,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
} from '@atproto/api'
type ReasonRepost = AppBskyFeedFeedViewPost.ReasonRepost
import {
  DEV_TEAM_HANDLES,
  STAGING_TEAM_HANDLES,
  PROD_TEAM_HANDLES,
} from 'lib/constants'

function getTeamHandles(serviceUrl: string) {
  if (serviceUrl.includes('localhost')) {
    return DEV_TEAM_HANDLES
  } else if (serviceUrl.includes('staging')) {
    return STAGING_TEAM_HANDLES
  } else {
    return PROD_TEAM_HANDLES
  }
}

async function getMultipleAuthorsPosts(
  rootStore: RootStoreModel,
  authors: string[],
  cursor: string | undefined = undefined,
) {
  const responses = await Promise.all(
    authors.map((author, index) =>
      rootStore.api.app.bsky.feed
        .getAuthorFeed({
          author,
          limit: 10,
          before: cursor ? cursor.split(',')[index] : undefined,
        })
        .catch(_err => ({success: false, headers: {}, data: {feed: []}})),
    ),
  )
  return responses
}

function mergeAndFilterMultipleAuthorPostsIntoOneFeed(
  responses: GetAuthorFeed.Response[],
) {
  let posts: AppBskyFeedFeedViewPost.Main[] = []

  // merge into one array
  for (const res of responses) {
    if (res.success) {
      posts = posts.concat(res.data.feed)
    }
  }

  // filter down to reposts of other users
  const now = Date.now()
  const uris = new Set()
  posts = posts.filter(p => {
    if (isARepostOfSomeoneElse(p) && isRecentEnough(now, p)) {
      if (uris.has(p.post.uri)) {
        return false
      }
      uris.add(p.post.uri)
      return true
    }
    return false
  })

  // sort by index time
  posts.sort((a, b) => {
    return (
      Number(new Date(b.post.indexedAt)) - Number(new Date(a.post.indexedAt))
    )
  })

  // strip the reasons to hide that these are reposts
  return posts.map(post => {
    delete post.reason
    return post
  })
}

function isARepostOfSomeoneElse(post: AppBskyFeedFeedViewPost.Main): boolean {
  return (
    post.reason?.$type === 'app.bsky.feed.feedViewPost#reasonRepost' &&
    post.post.author.did !== (post.reason as ReasonRepost).by.did
  )
}

function isRecentEnough(
  now: number,
  post: AppBskyFeedFeedViewPost.Main,
): boolean {
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000
  return now - Number(new Date(post.post.indexedAt)) < THREE_DAYS
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
  getTeamHandles,
  getMultipleAuthorsPosts,
  mergeAndFilterMultipleAuthorPostsIntoOneFeed,
  getCombinedCursors,
  isCombinedCursor,
}
