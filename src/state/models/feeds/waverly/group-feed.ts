import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyFeedGetTimeline as GetTimeline,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
} from '@atproto/api'
import AwaitLock from 'await-lock'
import {bundleAsync} from 'lib/async/bundle'
import {RootStoreModel} from '../../root-store'
import {cleanError} from 'lib/strings/errors'
import {PostsFeedItemModel} from '../post'
import {GroupWave, Recommendation} from 'w2-api/waverly_sdk'
import {ProfileView} from '@waverlyai/atproto-api/dist/client/types/app/bsky/actor/defs'

const PAGE_SIZE = 30
let _idCounter = 0

type QueryParams = GetAuthorFeed.QueryParams

type WaverlyFeed = PostsFeedItemModel | Recommendation

export class GroupFeedModel {
  // state
  isLoading = false
  isRefreshing = false
  hasNewLatest = false
  hasLoaded = false
  isBlocking = false
  isBlockedBy = false
  error = ''
  loadMoreError = ''
  params?: QueryParams
  hasMore = true
  loadMoreCursor: string | undefined = undefined
  pollCursor: string | undefined = undefined
  pageSize = PAGE_SIZE

  // used to linearize async modifications to state
  lock = new AwaitLock()

  // used to track if what's hot is coming up empty
  emptyFetches = 0

  // data
  posts: PostsFeedItemModel[] = []

  _waves: GroupWave[] = []
  _recs: Recommendation[] = []
  feed: WaverlyFeed[] = []
  _groups: ProfileView[] = []

  recGroupToHide: string = '' //'aimagiceveryday.group'

  constructor(
    readonly rootStore: RootStoreModel,
    public feedType: 'demo' | 'author',
    params?: QueryParams,
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
    return this.feed.length !== 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
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
    this.rootStore.log.debug('GroupFeedModel:clear')
    this.isLoading = false
    this.isRefreshing = false
    this.hasNewLatest = false
    this.hasLoaded = false
    this.error = ''
    this.hasMore = true
    this.loadMoreCursor = undefined
    this.pollCursor = undefined
    this.posts = []
  }

  /**
   * Load for first render
   */
  setup = bundleAsync(async (isRefreshing: boolean = false) => {
    this.rootStore.log.debug('GroupFeedModel:setup', {isRefreshing})
    if (isRefreshing) {
      this.isRefreshing = true // set optimistically for UI
    }
    await this.lock.acquireAsync()
    try {
      this.setHasNewLatest(false)
      this._xLoading(isRefreshing)
      try {
        // For simplicity, only set Waverly 1.0 recs once on setup
        await this._fetchWaves()
        const [posts, recs] = await Promise.all([
          this._getFeed({...this.params, limit: this.pageSize}),
          this._getRecs(),
        ])
        await this._replaceAll(posts)
        this._recs = recs
        this._buildFeed()
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
    if (this.feedType === 'author') await this.setup(true)
    else await this.demoSetup(true)
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
          ...this.params,
          cursor: this.loadMoreCursor,
          limit: this.pageSize,
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
      if (!this.posts.length) {
        return
      }
      this._xLoading()
      let numToFetch = this.posts.length
      let cursor
      try {
        do {
          const res: GetTimeline.Response = await this._getFeed({
            ...this.params,
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
        this.rootStore.log.error('GroupFeedView: Failed to update', e)
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Check if new posts are available
   */
  async checkForLatest() {
    if (this.hasNewLatest || this.isLoading) {
      return
    }
    const res = await this._getFeed({...this.params, limit: 1})
    this.setHasNewLatest(res.data.feed[0]?.post.uri !== this.pollCursor)
  }

  /**
   * Fetches the given post and adds it to the top
   * Used by the composer to add their new posts
   */
  async addPostToTop(uri: string) {
    if (!this.posts.length) {
      return this.refresh()
    }
    try {
      const res = await this.rootStore.agent.app.bsky.feed.getPosts({
        uris: [uri],
      })

      const toPrepend = res.data.posts.map(
        postView =>
          new PostsFeedItemModel(this.rootStore, uri, {post: postView}),
      )
      runInAction(() => {
        this.posts = [...toPrepend].concat(this.posts)
      })
      this._buildFeed()
    } catch (e) {
      this.rootStore.log.error('Failed to load group posts to prepend', {e})
    }
  }

  /**
   * Removes posts from the feed upon deletion.
   */
  onPostDeleted(uri: string) {
    let i
    do {
      i = this.posts.findIndex(post => post.uri === uri)
      if (i !== -1) {
        this.posts.splice(i, 1)
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

  async _replaceAll(res: GetAuthorFeed.Response) {
    this.pollCursor = res.data.feed[0]?.post.uri
    return this._appendAll(res, true)
  }

  async _appendAll(res: GetAuthorFeed.Response, replace = false) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    if (replace) {
      this.emptyFetches = 0
    }

    this.rootStore.me.follows.hydrateMany(
      res.data.feed.map(item => item.post.author),
    )

    const toAppend = res.data.feed.map(
      feedViewPost =>
        new PostsFeedItemModel(
          this.rootStore,
          `item-${_idCounter++}`,
          feedViewPost,
        ),
    )
    runInAction(() => {
      if (replace) {
        this.posts = toAppend
      } else {
        this.posts = this.posts.concat(toAppend)
      }
      if (toAppend.length === 0) {
        this.emptyFetches++
        if (this.emptyFetches >= 10) {
          this.hasMore = false
        }
      }
    })
  }

  _updateAll(res: GetAuthorFeed.Response) {
    for (const item of res.data.feed) {
      const existingPost = this.posts.find(post => post.uri === item.post.uri)
      existingPost?.copyMetrics(item)
    }
  }

  setGroupToHide(groupName: string) {
    this.recGroupToHide = groupName
  }
  _buildFeed() {
    // HACK: used to filter recommendations from the feed for the demo
    console.log('in _buildFeed() with recGroupToHide:', this.recGroupToHide)
    let trimmedRecs = this._recs.slice(0, 2)
    if (this.recGroupToHide !== '') {
      trimmedRecs = trimmedRecs.filter(rec => {
        return rec.sectionTitle !== this.recGroupToHide
      })
    }

    const final = new Array(this.posts.length + trimmedRecs.length).fill(0)
    const postsCopy = [...this.posts]
    postsCopy.sort((a, b) => {
      const postA = a.post.indexedAt
      const postB = b.post.indexedAt
      return postA > postB ? -1 : postA < postB ? 1 : 0
    })

    const pos = [3, 9]
    for (let i = 0; i < final.length; i++) {
      if (pos.includes(i) || postsCopy.length === 0) {
        final[i] = trimmedRecs.shift()
      } else {
        final[i] = postsCopy.shift()
      }
    }

    runInAction(() => {
      this.feed = final
    })
  }

  protected async _fetchWaves() {
    this._waves = []
    const meDid = this.rootStore.me.did
    try {
      const fRes = await this.rootStore.agent.getFollows({actor: meDid})
      const groups = fRes.data.follows.filter(i => i.handle.endsWith('.group'))
      this._groups = groups
      const res = await Promise.all(
        groups.map(g => {
          return this.rootStore.waverlyAgent.api.getGroupWave({groupDid: g.did})
        }),
      )
      res.forEach(r => {
        if (r.getGroupWave) this._waves.push(r.getGroupWave)
      })
    } catch (err) {
      this.rootStore.log.error(`Failed to fetch waves: ${err}`)
      this._waves = []
    }
  }

  protected async _getRecs() {
    if (this.feedType === 'demo')
      return this.rootStore.waverlyAgent.getQueryRecommendations([])
    else if (this._waves.length > 0)
      return this.rootStore.waverlyAgent.getQueryRecommendations(this._waves)
    else return []
  }

  demoSetup = bundleAsync(async (isRefreshing: boolean = false) => {
    this.rootStore.log.debug('GroupFeedModel:demo_setup', {isRefreshing})
    this.clear()
    if (isRefreshing) {
      this.isRefreshing = true // set optimistically for UI
    }
    await this.lock.acquireAsync()
    try {
      this.setHasNewLatest(false)
      this._xLoading(isRefreshing)
      try {
        // For simplicity, only set Waverly 1.0 recs once on setup
        await this._fetchWaves()

        const groupFeeds = await Promise.all(
          this._groups.map(g => {
            return this._getFeed({actor: g.did, limit: this.pageSize})
          }),
        )
        for (const feed of groupFeeds) {
          await this._appendAll(feed)
        }

        const recs = await this._getRecs()
        this._recs = recs
        this._buildFeed()

        this._xIdle()
      } catch (e: any) {
        this._xIdle(e)
      }
    } finally {
      this.lock.release()
    }
  })

  protected async _getFeed({
    actor,
    limit,
    cursor,
  }: {
    actor?: string
    limit?: number
    cursor?: string
  }): Promise<GetAuthorFeed.Response> {
    if (!actor) throw 'Actor is required.'

    return this.rootStore.agent.app.bsky.feed.getAuthorFeed({
      actor,
      limit,
      cursor,
    })
  }
}
