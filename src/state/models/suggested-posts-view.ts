import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyFeedFeedViewPost,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
} from '@atproto/api'
type ReasonRepost = AppBskyFeedFeedViewPost.ReasonRepost
import {RootStoreModel} from './root-store'
import {FeedItemModel} from './feed-view'
import {cleanError} from 'lib/strings/errors'

const TEAM_HANDLES = [
  'jay.bsky.social',
  'paul.bsky.social',
  'dan.bsky.social',
  'divy.bsky.social',
  'why.bsky.social',
  'iamrosewang.bsky.social',
]

export class SuggestedPostsView {
  // state
  isLoading = false
  hasLoaded = false
  error = ''

  // data
  posts: FeedItemModel[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  get hasContent() {
    return this.posts.length > 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  // public api
  // =

  async setup() {
    this._xLoading()
    try {
      const responses = await Promise.all(
        TEAM_HANDLES.map(handle =>
          this.rootStore.api.app.bsky.feed
            .getAuthorFeed({author: handle, limit: 10})
            .catch(_err => ({success: false, headers: {}, data: {feed: []}})),
        ),
      )
      runInAction(() => {
        this.posts = mergeAndFilterResponses(this.rootStore, responses)
      })
      this._xIdle()
    } catch (e: any) {
      this.rootStore.log.error('SuggestedPostsView: Failed to load posts', {
        e,
      })
      this._xIdle() // dont bubble to the user
    }
  }

  // state transitions
  // =

  private _xLoading() {
    this.isLoading = true
    this.error = ''
  }

  private _xIdle(err?: any) {
    this.isLoading = false
    this.hasLoaded = true
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Failed to fetch suggested posts', err)
    }
  }
}

function mergeAndFilterResponses(
  store: RootStoreModel,
  responses: GetAuthorFeed.Response[],
): FeedItemModel[] {
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

  // hydrate into models and strip the reasons to hide that these are reposts
  return posts.map((post, i) => {
    delete post.reason
    return new FeedItemModel(store, `post-${i}`, post)
  })
}

function isARepostOfSomeoneElse(post: AppBskyFeedFeedViewPost.Main): boolean {
  return (
    post.reason?.$type === 'app.bsky.feed.feedViewPost#reasonRepost' &&
    post.post.author.did !== (post.reason as ReasonRepost).by.did
  )
}

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000
function isRecentEnough(
  now: number,
  post: AppBskyFeedFeedViewPost.Main,
): boolean {
  return now - Number(new Date(post.post.indexedAt)) < THREE_DAYS
}
