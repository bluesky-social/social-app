import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedRecord,
} from '@atproto/api'
import lande from 'lande'
import {hasProp} from 'lib/type-guards'
import {LANGUAGES_MAP_CODE2} from '../../locale/languages'
type FeedViewPost = AppBskyFeedDefs.FeedViewPost

export type FeedTunerFn = (
  tuner: FeedTuner,
  slices: FeedViewPostsSlice[],
) => FeedViewPostsSlice[]

export class FeedViewPostsSlice {
  isFlattenedReply = false

  constructor(public items: FeedViewPost[] = []) {}

  get uri() {
    if (this.isFlattenedReply) {
      return this.items[1].post.uri
    }
    return this.items[0].post.uri
  }

  get ts() {
    if (this.items[0].reason?.indexedAt) {
      return this.items[0].reason.indexedAt as string
    }
    return this.items[0].post.indexedAt
  }

  get isThread() {
    return (
      this.items.length > 1 &&
      this.items.every(
        item => item.post.author.did === this.items[0].post.author.did,
      )
    )
  }

  get isFullThread() {
    return this.isThread && !this.items[0].reply
  }

  get rootItem() {
    if (this.isFlattenedReply) {
      return this.items[1]
    }
    return this.items[0]
  }

  get isReply() {
    return (
      AppBskyFeedPost.isRecord(this.rootItem.post.record) &&
      !!this.rootItem.post.record.reply
    )
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
        this.isFlattenedReply = true
        this.items.splice(0, 0, {post: reply.parent})
      }
    }
  }
}

export class FeedTuner {
  seenUris: Set<string> = new Set()

  constructor() {}

  reset() {
    this.seenUris.clear()
  }

  tune(
    feed: FeedViewPost[],
    tunerFns: FeedTunerFn[] = [],
  ): FeedViewPostsSlice[] {
    let slices: FeedViewPostsSlice[] = []

    // arrange the posts into thread slices
    for (let i = feed.length - 1; i >= 0; i--) {
      const item = feed[i]

      const selfReplyUri = getSelfReplyUri(item)
      if (selfReplyUri) {
        const parent = slices.find(item2 => item2.isNextInThread(selfReplyUri))
        if (parent) {
          parent.insert(item)
          continue
        }
      }
      slices.unshift(new FeedViewPostsSlice([item]))
    }

    // run the custom tuners
    for (const tunerFn of tunerFns) {
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
      if (!slice.isThread && !slice.items[0].reason && slice.items[0].reply) {
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

    for (const slice of slices) {
      for (const item of slice.items) {
        this.seenUris.add(item.post.uri)
      }
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
      const reason = slices[i].rootItem.reason
      if (AppBskyFeedDefs.isReasonRepost(reason)) {
        slices.splice(i, 1)
      }
    }
    return slices
  }

  static removeQuotePosts(tuner: FeedTuner, slices: FeedViewPostsSlice[]) {
    for (let i = slices.length - 1; i >= 0; i--) {
      const embed = slices[i].rootItem.post.embed
      if (
        AppBskyEmbedRecord.isView(embed) ||
        AppBskyEmbedRecordWithMedia.isView(embed)
      ) {
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

  static likedRepliesOnly({repliesThreshold}: {repliesThreshold: number}) {
    return (
      tuner: FeedTuner,
      slices: FeedViewPostsSlice[],
    ): FeedViewPostsSlice[] => {
      // remove any replies without at least repliesThreshold likes
      for (let i = slices.length - 1; i >= 0; i--) {
        if (slices[i].isFullThread || !slices[i].isReply) {
          continue
        }

        const item = slices[i].rootItem
        const isRepost = Boolean(item.reason)
        if (!isRepost && (item.post.likeCount || 0) < repliesThreshold) {
          slices.splice(i, 1)
        }
      }
      return slices
    }
  }

  static preferredLangOnly(langsCode2: string[]) {
    const langsCode3 = langsCode2.map(l => LANGUAGES_MAP_CODE2[l]?.code3 || l)
    return (
      tuner: FeedTuner,
      slices: FeedViewPostsSlice[],
    ): FeedViewPostsSlice[] => {
      if (!langsCode2.length) {
        return slices
      }
      for (let i = slices.length - 1; i >= 0; i--) {
        let hasPreferredLang = false
        for (const item of slices[i].items) {
          if (
            hasProp(item.post.record, 'text') &&
            typeof item.post.record.text === 'string'
          ) {
            // Treat empty text the same as no text.
            if (item.post.record.text.length === 0) {
              hasPreferredLang = true
              break
            }

            const res = lande(item.post.record.text)

            if (langsCode3.includes(res[0][0])) {
              hasPreferredLang = true
              break
            }
          } else {
            // no text? roll with it
            hasPreferredLang = true
            break
          }
        }
        if (!hasPreferredLang) {
          slices.splice(i, 1)
        }
      }
      return slices
    }
  }
}

function getSelfReplyUri(item: FeedViewPost): string | undefined {
  if (item.reply) {
    if (AppBskyFeedDefs.isPostView(item.reply.parent)) {
      return item.reply.parent.author.did === item.post.author.did
        ? item.reply.parent.uri
        : undefined
    }
  }
  return undefined
}
