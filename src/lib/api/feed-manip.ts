import {
  AppBskyActorDefs,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
} from '@atproto/api'

import {isPostInLanguage} from '../../locale/helpers'
import {FALLBACK_MARKER_POST} from './feed/home'
import {ReasonFeedSource} from './feed/types'

type FeedViewPost = AppBskyFeedDefs.FeedViewPost

export type FeedTunerFn = (
  tuner: FeedTuner,
  slices: FeedViewPostsSlice[],
) => FeedViewPostsSlice[]

type FeedSliceItem = {
  post: AppBskyFeedDefs.PostView
  record: AppBskyFeedPost.Record
  parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined
  isParentBlocked: boolean
}

export class FeedViewPostsSlice {
  _reactKey: string
  _feedPost: FeedViewPost
  items: FeedSliceItem[]
  isIncompleteThread: boolean
  isFallbackMarker: boolean
  rootUri: null | string

  constructor(feedPost: FeedViewPost) {
    const {post, reply, reason} = feedPost
    this.items = []
    this.isIncompleteThread = false
    this.isFallbackMarker = false
    this.rootUri = null
    this._feedPost = feedPost
    this._reactKey = `slice-${post.uri}-${
      feedPost.reason?.indexedAt || post.indexedAt
    }`
    if (feedPost.post.uri === FALLBACK_MARKER_POST.post.uri) {
      this.isFallbackMarker = true
      return
    }
    if (
      !AppBskyFeedPost.isRecord(post.record) ||
      !AppBskyFeedPost.validateRecord(post.record).success
    ) {
      return
    }
    const parent = reply?.parent
    const isParentBlocked = AppBskyFeedDefs.isBlockedPost(parent)
    let parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined
    if (AppBskyFeedDefs.isPostView(parent)) {
      parentAuthor = parent.author
    }
    this.items.push({
      post,
      record: post.record,
      parentAuthor,
      isParentBlocked,
    })
    if (!reply || reason) {
      return
    }
    if (
      !AppBskyFeedDefs.isPostView(parent) ||
      !AppBskyFeedPost.isRecord(parent.record) ||
      !AppBskyFeedPost.validateRecord(parent.record).success
    ) {
      return
    }
    const grandparentAuthor = reply.grandparentAuthor
    this.items.unshift({
      post: parent,
      record: parent.record,
      parentAuthor: grandparentAuthor,
      isParentBlocked: Boolean(
        grandparentAuthor?.viewer?.blockedBy ||
          grandparentAuthor?.viewer?.blocking ||
          grandparentAuthor?.viewer?.blockingByList,
      ),
    })
    const root = reply.root
    if (
      !AppBskyFeedDefs.isPostView(root) ||
      !AppBskyFeedPost.isRecord(root.record) ||
      !AppBskyFeedPost.validateRecord(root.record).success
    ) {
      return
    }
    this.rootUri = root.uri
    if (root.uri === parent.uri) {
      return
    }
    this.items.unshift({
      post: root,
      record: root.record,
      isParentBlocked: false,
      parentAuthor: undefined,
    })
    if (parent.record.reply?.parent.uri !== root.uri) {
      this.isIncompleteThread = true
    }
  }

  get isQuotePost() {
    const embed = this._feedPost.post.embed
    return (
      AppBskyEmbedRecord.isView(embed) ||
      AppBskyEmbedRecordWithMedia.isView(embed)
    )
  }

  get isReply() {
    return (
      AppBskyFeedPost.isRecord(this._feedPost.post.record) &&
      !!this._feedPost.post.record.reply
    )
  }

  get reason() {
    return '__source' in this._feedPost
      ? (this._feedPost.__source as ReasonFeedSource)
      : this._feedPost.reason
  }

  get feedContext() {
    return this._feedPost.feedContext
  }

  get isRepost() {
    const reason = this._feedPost.reason
    return AppBskyFeedDefs.isReasonRepost(reason)
  }

  get likeCount() {
    return this._feedPost.post.likeCount ?? 0
  }

  containsUri(uri: string) {
    return !!this.items.find(item => item.post.uri === uri)
  }

  isFollowingAllAuthors(userDid: string) {
    const feedPost = this._feedPost
    const authors = [feedPost.post.author]
    if (feedPost.reply) {
      if (AppBskyFeedDefs.isPostView(feedPost.reply.parent)) {
        authors.push(feedPost.reply.parent.author)
      }
      if (feedPost.reply.grandparentAuthor) {
        authors.push(feedPost.reply.grandparentAuthor)
      }
      if (AppBskyFeedDefs.isPostView(feedPost.reply.root)) {
        authors.push(feedPost.reply.root.author)
      }
    }
    return authors.every(a => a.did === userDid || a.viewer?.following)
  }
}

export class FeedTuner {
  seenKeys: Set<string> = new Set()

  constructor(public tunerFns: FeedTunerFn[]) {}

  reset() {
    this.seenKeys.clear()
  }

  tune(
    feed: FeedViewPost[],
    {dryRun}: {dryRun: boolean} = {
      dryRun: false,
    },
  ): FeedViewPostsSlice[] {
    let slices: FeedViewPostsSlice[] = feed
      .map(item => new FeedViewPostsSlice(item))
      .filter(s => s.items.length > 0 || s.isFallbackMarker)

    // run the custom tuners
    for (const tunerFn of this.tunerFns) {
      slices = tunerFn(this, slices.slice())
    }

    if (!dryRun) {
      slices = slices.filter(slice => {
        if (this.seenKeys.has(slice._reactKey)) {
          return false
        }
        this.seenKeys.add(slice._reactKey)
        return true
      })
    }

    return slices
  }

  static removeReplies(tuner: FeedTuner, slices: FeedViewPostsSlice[]) {
    for (let i = slices.length - 1; i >= 0; i--) {
      if (slices[i].isReply) {
        slices.splice(i, 1)
      }
    }
    return slices
  }

  static removeReposts(tuner: FeedTuner, slices: FeedViewPostsSlice[]) {
    for (let i = slices.length - 1; i >= 0; i--) {
      if (slices[i].isRepost) {
        slices.splice(i, 1)
      }
    }
    return slices
  }

  static removeQuotePosts(tuner: FeedTuner, slices: FeedViewPostsSlice[]) {
    for (let i = slices.length - 1; i >= 0; i--) {
      if (slices[i].isQuotePost) {
        slices.splice(i, 1)
      }
    }
    return slices
  }

  static dedupThreads(
    tuner: FeedTuner,
    slices: FeedViewPostsSlice[],
  ): FeedViewPostsSlice[] {
    const seenThreadUris = new Set()
    const nextSlices = []
    for (let slice of slices) {
      if (!seenThreadUris.has(slice.rootUri)) {
        seenThreadUris.add(slice.rootUri)
        nextSlices.push(slice)
      }
    }
    return nextSlices
  }

  static dedupReposts(
    tuner: FeedTuner,
    slices: FeedViewPostsSlice[],
  ): FeedViewPostsSlice[] {
    // remove duplicates caused by reposts
    for (let i = 0; i < slices.length; i++) {
      const item1 = slices[i]
      for (let j = i + 1; j < slices.length; j++) {
        const item2 = slices[j]
        if (item2.items.length !== 1) {
          // Don't remove threads below even if individual posts from them appeared as reposts above.
          continue
        }
        if (item1.containsUri(item2.items[0].post.uri)) {
          slices.splice(j, 1)
          j--
        }
      }
    }
    return slices
  }

  static followedRepliesOnly({userDid}: {userDid: string}) {
    return (
      tuner: FeedTuner,
      slices: FeedViewPostsSlice[],
    ): FeedViewPostsSlice[] => {
      for (let i = slices.length - 1; i >= 0; i--) {
        const slice = slices[i]
        if (
          slice.isReply &&
          !slice.isRepost &&
          !slice.isFollowingAllAuthors(userDid)
        ) {
          slices.splice(i, 1)
        }
      }
      return slices
    }
  }

  /**
   * This function filters a list of FeedViewPostsSlice items based on whether they contain text in a
   * preferred language.
   * @param {string[]} preferredLangsCode2 - An array of preferred language codes in ISO 639-1 or ISO 639-2 format.
   * @returns A function that takes in a `FeedTuner` and an array of `FeedViewPostsSlice` objects and
   * returns an array of `FeedViewPostsSlice` objects.
   */
  static preferredLangOnly(preferredLangsCode2: string[]) {
    return (
      tuner: FeedTuner,
      slices: FeedViewPostsSlice[],
    ): FeedViewPostsSlice[] => {
      const candidateSlices = slices.slice()

      // early return if no languages have been specified
      if (!preferredLangsCode2.length || preferredLangsCode2.length === 0) {
        return slices
      }

      for (let i = slices.length - 1; i >= 0; i--) {
        let hasPreferredLang = false
        for (const item of slices[i].items) {
          if (isPostInLanguage(item.post, preferredLangsCode2)) {
            hasPreferredLang = true
            break
          }
        }

        // if item does not fit preferred language, remove it
        if (!hasPreferredLang) {
          candidateSlices.splice(i, 1)
        }
      }

      // if the language filter cleared out the entire page, return the original set
      // so that something always shows
      if (candidateSlices.length === 0) {
        return slices
      }

      return candidateSlices
    }
  }
}
