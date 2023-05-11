import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyFeedGetTimeline as GetTimeline,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
  RichText,
  jsonToLex,
} from '@atproto/api'
import AwaitLock from 'await-lock'
import {bundleAsync} from 'lib/async/bundle'
import sampleSize from 'lodash.samplesize'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'
import {SUGGESTED_FOLLOWS} from 'lib/constants'
import {
  getCombinedCursors,
  getMultipleAuthorsPosts,
  mergePosts,
} from 'lib/api/build-suggested-posts'
import {FeedTuner, FeedViewPostsSlice} from 'lib/api/feed-manip'
import {updateDataOptimistically} from 'lib/async/revertible'
import {PostLabelInfo, PostModeration} from 'lib/labeling/types'
import {
  getEmbedLabels,
  getEmbedMuted,
  getEmbedMutedByList,
  getEmbedBlocking,
  getEmbedBlockedBy,
  getPostModeration,
  mergePostModerations,
  filterAccountLabels,
  filterProfileLabels,
} from 'lib/labeling/helpers'

type FeedViewPost = AppBskyFeedDefs.FeedViewPost
type ReasonRepost = AppBskyFeedDefs.ReasonRepost
type PostView = AppBskyFeedDefs.PostView

const PAGE_SIZE = 30
let _idCounter = 0

export class PostsFeedItemModel {
  // ui state
  _reactKey: string = ''

  // data
  post: PostView
  postRecord?: AppBskyFeedPost.Record
  reply?: FeedViewPost['reply']
  reason?: FeedViewPost['reason']
  richText?: RichText

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: FeedViewPost,
  ) {
    this._reactKey = reactKey
    this.post = v.post
    if (AppBskyFeedPost.isRecord(this.post.record)) {
      const valid = AppBskyFeedPost.validateRecord(this.post.record)
      if (valid.success) {
        this.postRecord = this.post.record
        this.richText = new RichText(this.postRecord, {cleanNewlines: true})
      } else {
        this.postRecord = undefined
        this.richText = undefined
        rootStore.log.warn(
          'Received an invalid app.bsky.feed.post record',
          valid.error,
        )
      }
    } else {
      this.postRecord = undefined
      this.richText = undefined
      rootStore.log.warn(
        'app.bsky.feed.getTimeline or app.bsky.feed.getAuthorFeed served an unexpected record type',
        this.post.record,
      )
    }
    this.reply = v.reply
    this.reason = v.reason
    makeAutoObservable(this, {rootStore: false})
  }

  get rootUri(): string {
    if (this.reply?.root.uri) {
      return this.reply.root.uri
    }
    return this.post.uri
  }

  get isThreadMuted() {
    return this.rootStore.mutedThreads.uris.has(this.rootUri)
  }

  get labelInfo(): PostLabelInfo {
    return {
      postLabels: (this.post.labels || []).concat(
        getEmbedLabels(this.post.embed),
      ),
      accountLabels: filterAccountLabels(this.post.author.labels),
      profileLabels: filterProfileLabels(this.post.author.labels),
      isMuted:
        this.post.author.viewer?.muted ||
        getEmbedMuted(this.post.embed) ||
        false,
      mutedByList:
        this.post.author.viewer?.mutedByList ||
        getEmbedMutedByList(this.post.embed),
      isBlocking:
        !!this.post.author.viewer?.blocking ||
        getEmbedBlocking(this.post.embed) ||
        false,
      isBlockedBy:
        !!this.post.author.viewer?.blockedBy ||
        getEmbedBlockedBy(this.post.embed) ||
        false,
    }
  }

  get moderation(): PostModeration {
    return getPostModeration(this.rootStore, this.labelInfo)
  }

  copy(v: FeedViewPost) {
    this.post = v.post
    this.reply = v.reply
    this.reason = v.reason
  }

  copyMetrics(v: FeedViewPost) {
    this.post.replyCount = v.post.replyCount
    this.post.repostCount = v.post.repostCount
    this.post.likeCount = v.post.likeCount
    this.post.viewer = v.post.viewer
  }

  get reasonRepost(): ReasonRepost | undefined {
    if (this.reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
      return this.reason as ReasonRepost
    }
  }

  async toggleLike() {
    this.post.viewer = this.post.viewer || {}
    if (this.post.viewer.like) {
      const url = this.post.viewer.like
      await updateDataOptimistically(
        this.post,
        () => {
          this.post.likeCount = (this.post.likeCount || 0) - 1
          this.post.viewer!.like = undefined
        },
        () => this.rootStore.agent.deleteLike(url),
      )
    } else {
      await updateDataOptimistically(
        this.post,
        () => {
          this.post.likeCount = (this.post.likeCount || 0) + 1
          this.post.viewer!.like = 'pending'
        },
        () => this.rootStore.agent.like(this.post.uri, this.post.cid),
        res => {
          this.post.viewer!.like = res.uri
        },
      )
    }
  }

  async toggleRepost() {
    this.post.viewer = this.post.viewer || {}
    if (this.post.viewer?.repost) {
      const url = this.post.viewer.repost
      await updateDataOptimistically(
        this.post,
        () => {
          this.post.repostCount = (this.post.repostCount || 0) - 1
          this.post.viewer!.repost = undefined
        },
        () => this.rootStore.agent.deleteRepost(url),
      )
    } else {
      await updateDataOptimistically(
        this.post,
        () => {
          this.post.repostCount = (this.post.repostCount || 0) + 1
          this.post.viewer!.repost = 'pending'
        },
        () => this.rootStore.agent.repost(this.post.uri, this.post.cid),
        res => {
          this.post.viewer!.repost = res.uri
        },
      )
    }
  }

  async toggleThreadMute() {
    if (this.isThreadMuted) {
      this.rootStore.mutedThreads.uris.delete(this.rootUri)
    } else {
      this.rootStore.mutedThreads.uris.add(this.rootUri)
    }
  }

  async delete() {
    await this.rootStore.agent.deletePost(this.post.uri)
    this.rootStore.emitPostDeleted(this.post.uri)
  }
}

export class PostsFeedSliceModel {
  // ui state
  _reactKey: string = ''

  // data
  items: PostsFeedItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    slice: FeedViewPostsSlice,
  ) {
    this._reactKey = reactKey
    for (const item of slice.items) {
      this.items.push(
        new PostsFeedItemModel(rootStore, `item-${_idCounter++}`, item),
      )
    }
    makeAutoObservable(this, {rootStore: false})
  }

  get uri() {
    if (this.isReply) {
      return this.items[1].post.uri
    }
    return this.items[0].post.uri
  }

  get isThread() {
    return (
      this.items.length > 1 &&
      this.items.every(
        item => item.post.author.did === this.items[0].post.author.did,
      )
    )
  }

  get isReply() {
    return this.items.length > 1 && !this.isThread
  }

  get rootItem() {
    if (this.isReply) {
      return this.items[1]
    }
    return this.items[0]
  }

  get moderation() {
    return mergePostModerations(this.items.map(item => item.moderation))
  }

  containsUri(uri: string) {
    return !!this.items.find(item => item.post.uri === uri)
  }

  isThreadParentAt(i: number) {
    if (this.items.length === 1) {
      return false
    }
    return i < this.items.length - 1
  }

  isThreadChildAt(i: number) {
    if (this.items.length === 1) {
      return false
    }
    return i > 0
  }
}

export class PostsFeedModel {
  // state
  isLoading = false
  isRefreshing = false
  hasNewLatest = false
  hasLoaded = false
  isBlocking = false
  isBlockedBy = false
  error = ''
  loadMoreError = ''
  params: GetTimeline.QueryParams | GetAuthorFeed.QueryParams
  hasMore = true
  loadMoreCursor: string | undefined
  pollCursor: string | undefined
  tuner = new FeedTuner()

  // used to linearize async modifications to state
  lock = new AwaitLock()

  // used to track if what's hot is coming up empty
  emptyFetches = 0

  // data
  slices: PostsFeedSliceModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    public feedType: 'home' | 'author' | 'suggested' | 'goodstuff',
    params: GetTimeline.QueryParams | GetAuthorFeed.QueryParams,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
        loadMoreCursor: false,
      },
      {autoBind: true},
    )
    this.params = params
  }

  get hasContent() {
    return this.slices.length !== 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  get nonReplyFeed() {
    if (this.feedType === 'author') {
      return this.slices.filter(slice => {
        const params = this.params as GetAuthorFeed.QueryParams
        const item = slice.rootItem
        const isRepost =
          item?.reasonRepost?.by?.handle === params.actor ||
          item?.reasonRepost?.by?.did === params.actor
        const allow =
          !item.postRecord?.reply || // not a reply
          isRepost // but allow if it's a repost
        return allow
      })
    } else {
      return this.slices
    }
  }

  setHasNewLatest(v: boolean) {
    this.hasNewLatest = v
  }

  // public api
  // =

  /**
   * Nuke all data
   */
  clear() {
    this.rootStore.log.debug('FeedModel:clear')
    this.isLoading = false
    this.isRefreshing = false
    this.hasNewLatest = false
    this.hasLoaded = false
    this.error = ''
    this.hasMore = true
    this.loadMoreCursor = undefined
    this.pollCursor = undefined
    this.slices = []
    this.tuner.reset()
  }

  switchFeedType(feedType: 'home' | 'suggested') {
    if (this.feedType === feedType) {
      return
    }
    this.feedType = feedType
    return this.setup()
  }

  get feedTuners() {
    if (this.feedType === 'goodstuff') {
      return [
        FeedTuner.dedupReposts,
        FeedTuner.likedRepliesOnly,
        FeedTuner.preferredLangOnly(
          this.rootStore.preferences.contentLanguages,
        ),
      ]
    }
    if (this.feedType === 'home') {
      return [FeedTuner.dedupReposts, FeedTuner.likedRepliesOnly]
    }
    return []
  }

  /**
   * Load for first render
   */
  setup = bundleAsync(async (isRefreshing: boolean = false) => {
    this.rootStore.log.debug('FeedModel:setup', {isRefreshing})
    if (isRefreshing) {
      this.isRefreshing = true // set optimistically for UI
    }
    await this.lock.acquireAsync()
    try {
      this.setHasNewLatest(false)
      this.tuner.reset()
      this._xLoading(isRefreshing)
      try {
        const res = await this._getFeed({limit: PAGE_SIZE})
        await this._replaceAll(res)
        this._xIdle()
      } catch (e: any) {
        this._xIdle(e)
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Register any event listeners. Returns a cleanup function.
   */
  registerListeners() {
    const sub = this.rootStore.onPostDeleted(this.onPostDeleted.bind(this))
    return () => sub.remove()
  }

  /**
   * Reset and load
   */
  async refresh() {
    await this.setup(true)
  }

  /**
   * Load more posts to the end of the feed
   */
  loadMore = bundleAsync(async () => {
    await this.lock.acquireAsync()
    try {
      if (!this.hasMore || this.hasError) {
        return
      }
      this._xLoading()
      try {
        const res = await this._getFeed({
          cursor: this.loadMoreCursor,
          limit: PAGE_SIZE,
        })
        await this._appendAll(res)
        this._xIdle()
      } catch (e: any) {
        this._xIdle(undefined, e)
        runInAction(() => {
          this.hasMore = false
        })
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Attempt to load more again after a failure
   */
  async retryLoadMore() {
    this.loadMoreError = ''
    this.hasMore = true
    return this.loadMore()
  }

  /**
   * Update content in-place
   */
  update = bundleAsync(async () => {
    await this.lock.acquireAsync()
    try {
      if (!this.slices.length) {
        return
      }
      this._xLoading()
      let numToFetch = this.slices.length
      let cursor
      try {
        do {
          const res: GetTimeline.Response = await this._getFeed({
            cursor,
            limit: Math.min(numToFetch, 100),
          })
          if (res.data.feed.length === 0) {
            break // sanity check
          }
          this._updateAll(res)
          numToFetch -= res.data.feed.length
          cursor = res.data.cursor
        } while (cursor && numToFetch > 0)
        this._xIdle()
      } catch (e: any) {
        this._xIdle() // don't bubble the error to the user
        this.rootStore.log.error('FeedView: Failed to update', {
          params: this.params,
          e,
        })
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Check if new posts are available
   */
  async checkForLatest() {
    if (this.hasNewLatest || this.feedType === 'suggested') {
      return
    }
    const res = await this._getFeed({limit: PAGE_SIZE})
    const tuner = new FeedTuner()
    const slices = tuner.tune(res.data.feed, this.feedTuners)
    this.setHasNewLatest(slices[0]?.uri !== this.slices[0]?.uri)
  }

  /**
   * Fetches the given post and adds it to the top
   * Used by the composer to add their new posts
   */
  async addPostToTop(uri: string) {
    if (!this.slices.length) {
      return this.refresh()
    }
    try {
      const res = await this.rootStore.agent.app.bsky.feed.getPosts({
        uris: [uri],
      })
      const toPrepend = new PostsFeedSliceModel(
        this.rootStore,
        uri,
        new FeedViewPostsSlice(res.data.posts.map(post => ({post}))),
      )
      runInAction(() => {
        this.slices = [toPrepend].concat(this.slices)
      })
    } catch (e) {
      this.rootStore.log.error('Failed to load post to prepend', {e})
    }
  }

  /**
   * Removes posts from the feed upon deletion.
   */
  onPostDeleted(uri: string) {
    let i
    do {
      i = this.slices.findIndex(slice => slice.containsUri(uri))
      if (i !== -1) {
        this.slices.splice(i, 1)
      }
    } while (i !== -1)
  }

  // state transitions
  // =

  _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  _xIdle(error?: any, loadMoreError?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.isBlocking = error instanceof GetAuthorFeed.BlockedActorError
    this.isBlockedBy = error instanceof GetAuthorFeed.BlockedByActorError
    this.error = cleanError(error)
    this.loadMoreError = cleanError(loadMoreError)
    if (error) {
      this.rootStore.log.error('Posts feed request failed', error)
    }
    if (loadMoreError) {
      this.rootStore.log.error(
        'Posts feed load-more request failed',
        loadMoreError,
      )
    }
  }

  // helper functions
  // =

  async _replaceAll(res: GetTimeline.Response | GetAuthorFeed.Response) {
    this.pollCursor = res.data.feed[0]?.post.uri
    return this._appendAll(res, true)
  }

  async _appendAll(
    res: GetTimeline.Response | GetAuthorFeed.Response,
    replace = false,
  ) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    if (replace) {
      this.emptyFetches = 0
    }

    this.rootStore.me.follows.hydrateProfiles(
      res.data.feed.map(item => item.post.author),
    )

    const slices = this.tuner.tune(res.data.feed, this.feedTuners)

    const toAppend: PostsFeedSliceModel[] = []
    for (const slice of slices) {
      const sliceModel = new PostsFeedSliceModel(
        this.rootStore,
        `item-${_idCounter++}`,
        slice,
      )
      toAppend.push(sliceModel)
    }
    runInAction(() => {
      if (replace) {
        this.slices = toAppend
      } else {
        this.slices = this.slices.concat(toAppend)
      }
      if (toAppend.length === 0) {
        this.emptyFetches++
        if (this.emptyFetches >= 10) {
          this.hasMore = false
        }
      }
    })
  }

  _updateAll(res: GetTimeline.Response | GetAuthorFeed.Response) {
    for (const item of res.data.feed) {
      const existingSlice = this.slices.find(slice =>
        slice.containsUri(item.post.uri),
      )
      if (existingSlice) {
        const existingItem = existingSlice.items.find(
          item2 => item2.post.uri === item.post.uri,
        )
        if (existingItem) {
          existingItem.copyMetrics(item)
        }
      }
    }
  }

  protected async _getFeed(
    params: GetTimeline.QueryParams | GetAuthorFeed.QueryParams = {},
  ): Promise<GetTimeline.Response | GetAuthorFeed.Response> {
    params = Object.assign({}, this.params, params)
    if (this.feedType === 'suggested') {
      const responses = await getMultipleAuthorsPosts(
        this.rootStore,
        sampleSize(SUGGESTED_FOLLOWS(String(this.rootStore.agent.service)), 20),
        params.cursor,
        20,
      )
      const combinedCursor = getCombinedCursors(responses)
      const finalData = mergePosts(responses, {bestOfOnly: true})
      const lastHeaders = responses[responses.length - 1].headers
      return {
        success: true,
        data: {
          feed: finalData,
          cursor: combinedCursor,
        },
        headers: lastHeaders,
      }
    } else if (this.feedType === 'home') {
      return this.rootStore.agent.getTimeline(params as GetTimeline.QueryParams)
    } else if (this.feedType === 'goodstuff') {
      const res = await getGoodStuff(
        this.rootStore.session.currentSession?.accessJwt || '',
        params as GetTimeline.QueryParams,
      )
      res.data.feed = (res.data.feed || []).filter(
        item => !item.post.author.viewer?.muted,
      )
      return res
    } else {
      return this.rootStore.agent.getAuthorFeed(
        params as GetAuthorFeed.QueryParams,
      )
    }
  }
}

// HACK
// temporary off-spec route to get the good stuff
// -prf
async function getGoodStuff(
  accessJwt: string,
  params: GetTimeline.QueryParams,
): Promise<GetTimeline.Response> {
  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), 15e3)

  const uri = new URL('https://bsky.social/xrpc/app.bsky.unspecced.getPopular')
  let k: keyof GetTimeline.QueryParams
  for (k in params) {
    if (typeof params[k] !== 'undefined') {
      uri.searchParams.set(k, String(params[k]))
    }
  }

  const res = await fetch(String(uri), {
    method: 'get',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${accessJwt}`,
    },
    signal: controller.signal,
  })

  const resHeaders: Record<string, string> = {}
  res.headers.forEach((value: string, key: string) => {
    resHeaders[key] = value
  })
  let resBody = await res.json()

  clearTimeout(to)

  return {
    success: res.status === 200,
    headers: resHeaders,
    data: jsonToLex(resBody),
  }
}
