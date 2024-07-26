import {
  AppBskyActorDefs,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
} from '@atproto/api'

import {isPostInLanguage} from '../../locale/helpers'
import {ReasonFeedSource} from './feed/types'
type FeedViewPost = AppBskyFeedDefs.FeedViewPost

export type FeedTunerFn = (
  tuner: FeedTuner,
  slices: FeedViewPostsSlice[],
) => FeedViewPostsSlice[]

type FeedSliceItem = {
  post: AppBskyFeedDefs.PostView
  parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined
  isParentBlocked: boolean
}

function feedViewPostToSliceItem(feedViewPost: FeedViewPost): FeedSliceItem {
  const parent = feedViewPost.reply?.parent
  const isParentBlocked = AppBskyFeedDefs.isBlockedPost(parent)
  let parentAuthor: AppBskyActorDefs.ProfileViewBasic | undefined
  if (AppBskyFeedDefs.isPostView(parent)) {
    parentAuthor = parent.author
  }
  return {
    post: feedViewPost.post,
    parentAuthor,
    isParentBlocked,
  }
}

export class FeedViewPostsSlice {
  _reactKey: string
  _feedPost: FeedViewPost
  rootUri: string
  hasGap: boolean
  items: FeedSliceItem[]

  constructor(feedPost: FeedViewPost) {
    this._feedPost = feedPost
    this._reactKey = `slice-${feedPost.post.uri}-${
      feedPost.reason?.indexedAt || feedPost.post.indexedAt
    }`
    this.rootUri = (feedPost.reply?.root.uri ?? feedPost.post.uri) as string
    this.items = [feedViewPostToSliceItem(feedPost)]
    this.hasGap = false

    if (feedPost.reply && !feedPost.reason) {
      const {parent, root, grandparentAuthor} = feedPost.reply
      if (
        AppBskyFeedDefs.isPostView(parent) &&
        AppBskyFeedDefs.isPostView(root)
      ) {
        if (parent.uri !== root.uri) {
          this.items.unshift({
            isParentBlocked: Boolean(
              grandparentAuthor?.viewer?.blockedBy ||
                grandparentAuthor?.viewer?.blocking ||
                grandparentAuthor?.viewer?.blockingByList,
            ),
            parentAuthor: grandparentAuthor,
            post: parent,
          })
          if (AppBskyFeedPost.isRecord(parent.record)) {
            let parentReplyRef = parent.record.reply
            if (parentReplyRef?.parent.uri !== root.uri) {
              this.hasGap = true
            }
          }
        }
        this.items.unshift({
          isParentBlocked: false,
          parentAuthor: undefined,
          post: root,
        })
      } else {
        // TODO(dan): Handle deleted, blocked
      }
    }
  }

  get uri() {
    return this._feedPost.post.uri
  }

  get isThread() {
    return (
      this.items.length > 1 &&
      this.items.every(
        item => item.post.author.did === this.items[0].post.author.did,
      )
    )
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

  get includesThreadRoot() {
    return true // TODO(dan): Ensure this is actually the case.
  }

  get likeCount() {
    return this._feedPost.post.likeCount ?? 0
  }

  containsUri(uri: string) {
    return !!this.items.find(item => item.post.uri === uri)
  }

  isFollowingAllAuthors(userDid: string) {
    const feedPost = this._feedPost
    if (feedPost.post.author.did === userDid) {
      return true
    }
    if (AppBskyFeedDefs.isPostView(feedPost.reply?.parent)) {
      const parent = feedPost.reply?.parent
      if (parent?.author.did === userDid) {
        return true
      }
      return (
        parent?.author.viewer?.following &&
        feedPost.post.author.viewer?.following
      )
    }
    return false
  }
}

export class NoopFeedTuner {
  reset() {}
  tune(feed: FeedViewPost[], _opts?: {dryRun: boolean}): FeedViewPostsSlice[] {
    return feed.map(item => new FeedViewPostsSlice(item))
  }
}

export class FeedTuner {
  seenKeys: Set<string> = new Set()
  seenUris: Set<string> = new Set()

  constructor(public tunerFns: FeedTunerFn[]) {}

  reset() {
    this.seenKeys.clear()
    this.seenUris.clear()
  }

  tune(
    feed: FeedViewPost[],
    {dryRun}: {dryRun: boolean} = {
      dryRun: false,
    },
  ): FeedViewPostsSlice[] {
    let slices: FeedViewPostsSlice[] = []

    // TODO(dan): Where should this go?
    // remove posts that are replies, but which don't have the parent
    // hydrated. this means the parent was either deleted or blocked
    feed = feed.filter(item => {
      if (
        AppBskyFeedPost.isRecord(item.post.record) &&
        item.post.record.reply &&
        !item.reply
      ) {
        return false
      }
      return true
    })

    slices = feed.map(item => new FeedViewPostsSlice(item))
    // TODO(dan): Dedupe by root.

    // run the custom tuners
    for (const tunerFn of this.tunerFns) {
      slices = tunerFn(this, slices.slice())
    }

    if (!dryRun) {
      slices = slices.filter(slice => {
        if (this.seenKeys.has(slice._reactKey)) {
          return false
        }
        if (this.seenUris.has(slice.rootUri)) {
          return false
        }
        for (const item of slice.items) {
          // TODO(dan): Dedupe by post too.
          this.seenUris.add(item.post.uri)
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

  static dedupReposts(
    tuner: FeedTuner,
    slices: FeedViewPostsSlice[],
  ): FeedViewPostsSlice[] {
    // remove duplicates caused by reposts
    for (let i = 0; i < slices.length; i++) {
      const item1 = slices[i]
      for (let j = i + 1; j < slices.length; j++) {
        const item2 = slices[j]
        if (item2.isThread) {
          // dont dedup items that are rendering in a thread as this can cause rendering errors
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

  static thresholdRepliesOnly({
    userDid,
    minLikes,
    followedOnly,
  }: {
    userDid: string
    minLikes: number
    followedOnly: boolean
  }) {
    return (
      tuner: FeedTuner,
      slices: FeedViewPostsSlice[],
    ): FeedViewPostsSlice[] => {
      // remove any replies without at least minLikes likes
      for (let i = slices.length - 1; i >= 0; i--) {
        const slice = slices[i]
        if (slice.isReply) {
          if (slice.isThread && slice.includesThreadRoot) {
            continue
          }
          if (slice.isRepost) {
            continue
          }
          if (slice.likeCount < minLikes) {
            slices.splice(i, 1)
          } else if (followedOnly && !slice.isFollowingAllAuthors(userDid)) {
            slices.splice(i, 1)
          }
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
