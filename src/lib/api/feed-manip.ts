import {AppBskyFeedFeedViewPost} from '@atproto/api'
import lande from 'lande'
type FeedViewPost = AppBskyFeedFeedViewPost.Main
import {hasProp} from '@atproto/lexicon'
import {LANGUAGES_MAP_CODE2} from '../../locale/languages'

export type FeedTunerFn = (
  tuner: FeedTuner,
  slices: FeedViewPostsSlice[],
) => void

export class FeedViewPostsSlice {
  constructor(public items: FeedViewPost[] = []) {}

  get uri() {
    if (this.isReply) {
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

  get isReply() {
    return this.items.length > 1 && !this.isThread
  }

  get rootItem() {
    if (this.isReply) {
      return this.items[1]
    }
    return this.items[0]
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
    if (this.items[0].reply?.parent) {
      this.items.splice(0, 0, {post: this.items[0].reply?.parent})
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
    const slices: FeedViewPostsSlice[] = []

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
      if (
        !slice.isThread &&
        !slice.items[0].reason &&
        slice.items[0].reply?.parent &&
        !this.seenUris.has(slice.items[0].reply?.parent.uri) &&
        !soonToBeSeenUris.has(slice.items[0].reply?.parent.uri)
      ) {
        const uri = slice.items[0].reply?.parent.uri
        slice.flattenReplyParent()
        soonToBeSeenUris.add(uri)
      }
    }

    // sort by slice roots' timestamps
    slices.sort((a, b) => b.ts.localeCompare(a.ts))

    // run the custom tuners
    for (const tunerFn of tunerFns) {
      tunerFn(this, slices)
    }

    for (const slice of slices) {
      for (const item of slice.items) {
        this.seenUris.add(item.post.uri)
      }
    }

    return slices
  }

  static dedupReposts(tuner: FeedTuner, slices: FeedViewPostsSlice[]) {
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
  }

  static likedRepliesOnly(tuner: FeedTuner, slices: FeedViewPostsSlice[]) {
    // remove any replies without at least 2 likes
    for (let i = slices.length - 1; i >= 0; i--) {
      if (slices[i].isFullThread) {
        continue
      }
      const item = slices[i].rootItem
      const isRepost = Boolean(item.reason)
      if (item.reply && !isRepost && item.post.upvoteCount < 2) {
        slices.splice(i, 1)
      }
    }
  }

  static preferredLangOnly(langsCode2: string[]) {
    const langsCode3 = langsCode2.map(l => LANGUAGES_MAP_CODE2[l]?.code3 || l)
    return (tuner: FeedTuner, slices: FeedViewPostsSlice[]) => {
      for (let i = slices.length - 1; i >= 0; i--) {
        let hasPreferredLang = false
        for (const item of slices[i].items) {
          if (
            hasProp(item.post.record, 'text') &&
            typeof item.post.record.text === 'string'
          ) {
            const res = lande(item.post.record.text)
            const contentLangCode3 = res[0][0]
            if (langsCode3.includes(contentLangCode3)) {
              hasPreferredLang = true
              break
            }
          }
        }
        if (!hasPreferredLang) {
          slices.splice(i, 1)
        }
      }
    }
  }
}

function getSelfReplyUri(item: FeedViewPost): string | undefined {
  return item.reply?.parent.author.did === item.post.author.did
    ? item.reply?.parent.uri
    : undefined
}
