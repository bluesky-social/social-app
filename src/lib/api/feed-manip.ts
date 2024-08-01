import {
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
  reply?: AppBskyFeedDefs.ReplyRef
}

function toSliceItem(feedViewPost: FeedViewPost): FeedSliceItem {
  return {
    post: feedViewPost.post,
    reply: feedViewPost.reply,
  }
}

export class FeedViewPostsSlice {
  _reactKey: string
  _feedPost: FeedViewPost
  items: FeedSliceItem[]

  constructor(feedPost: FeedViewPost) {
    this._feedPost = feedPost
    this._reactKey = `slice-${feedPost.post.uri}-${
      feedPost.reason?.indexedAt || feedPost.post.indexedAt
    }`
    this.items = [toSliceItem(feedPost)]
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
    return !this.items[0].reply
  }

  get likeCount() {
    return this._feedPost.post.likeCount ?? 0
  }

  containsUri(uri: string) {
    return !!this.items.find(item => item.post.uri === uri)
  }

  isNextInThread(uri: string) {
    return this.items[this.items.length - 1].post.uri === uri
  }

  insert(item: FeedViewPost) {
    const selfReplyUri = getSelfReplyUri(item)
    const i = this.items.findIndex(item2 => item2.post.uri === selfReplyUri)
    if (i !== -1) {
      this.items.splice(i + 1, 0, item)
    } else {
      this.items.push(item)
    }
  }

  flattenReplyParent() {
    if (this.items[0].reply) {
      const reply = this.items[0].reply
      if (AppBskyFeedDefs.isPostView(reply.parent)) {
        this.items.splice(0, 0, {post: reply.parent})
      }
    }
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
    {dryRun, maintainOrder}: {dryRun: boolean; maintainOrder: boolean} = {
      dryRun: false,
      maintainOrder: false,
    },
  ): FeedViewPostsSlice[] {
    let slices: FeedViewPostsSlice[] = []

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

    if (maintainOrder) {
      slices = feed.map(item => new FeedViewPostsSlice(item))
    } else {
      // arrange the posts into thread slices
      for (let i = feed.length - 1; i >= 0; i--) {
        const item = feed[i]

        const selfReplyUri = getSelfReplyUri(item)
        if (selfReplyUri) {
          const index = slices.findIndex(slice =>
            slice.isNextInThread(selfReplyUri),
          )

          if (index !== -1) {
            const parent = slices[index]

            parent.insert(item)

            // If our slice isn't currently on the top, reinsert it to the top.
            if (index !== 0) {
              slices.splice(index, 1)
              slices.unshift(parent)
            }

            continue
          }
        }

        slices.unshift(new FeedViewPostsSlice(item))
      }
    }

    // run the custom tuners
    for (const tunerFn of this.tunerFns) {
      slices = tunerFn(this, slices.slice())
    }

    // remove any items already "seen"
    const soonToBeSeenUris: Set<string> = new Set()
    for (let i = slices.length - 1; i >= 0; i--) {
      if (!slices[i].isThread && this.seenUris.has(slices[i].uri)) {
        slices.splice(i, 1)
      } else {
        for (const item of slices[i].items) {
          soonToBeSeenUris.add(item.post.uri)
        }
      }
    }

    // turn non-threads with reply parents into threads
    for (const slice of slices) {
      if (!slice.isThread && !slice.reason && slice.items[0].reply) {
        const reply = slice.items[0].reply
        if (
          AppBskyFeedDefs.isPostView(reply.parent) &&
          !this.seenUris.has(reply.parent.uri) &&
          !soonToBeSeenUris.has(reply.parent.uri)
        ) {
          const uri = reply.parent.uri
          slice.flattenReplyParent()
          soonToBeSeenUris.add(uri)
        }
      }
    }

    if (!dryRun) {
      slices = slices.filter(slice => {
        if (this.seenKeys.has(slice._reactKey)) {
          return false
        }
        for (const item of slice.items) {
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

  static followedRepliesOnly({userDid}: {userDid: string}) {
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
          if (!slice.isFollowingAllAuthors(userDid)) {
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

function getSelfReplyUri(item: FeedViewPost): string | undefined {
  if (item.reply) {
    if (
      AppBskyFeedDefs.isPostView(item.reply.parent) &&
      !AppBskyFeedDefs.isReasonRepost(item.reason) // don't thread reposted self-replies
    ) {
      return item.reply.parent.author.did === item.post.author.did
        ? item.reply.parent.uri
        : undefined
    }
  }
  return undefined
}
