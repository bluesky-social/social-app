import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  moderatePost,
} from '@atproto/api'
interface SelfLabel {
  val: string
}

type ModeratePost = typeof moderatePost
type Options = Parameters<ModeratePost>[1] & {
  hiddenPosts?: string[]
}

export function moderatePost_wrapped(
  subject: Parameters<ModeratePost>[0],
  opts: Options,
) {
  const {hiddenPosts = [], ...options} = opts
  const moderations = moderatePost(subject, options)

  if (hiddenPosts.includes(subject.uri)) {
    moderations.content.filter = true
    moderations.content.blur = true
    if (!moderations.content.cause) {
      moderations.content.cause = {
        // @ts-ignore Temporary extension to the moderation system -prf
        type: 'post-hidden',
        source: {type: 'user'},
        priority: 1,
      }
    }
  }

  if (subject.embed) {
    let embedHidden = false
    if (AppBskyEmbedRecord.isViewRecord(subject.embed.record)) {
      embedHidden = hiddenPosts.includes(subject.embed.record.uri)
    }
    if (
      AppBskyEmbedRecordWithMedia.isView(subject.embed) &&
      AppBskyEmbedRecord.isViewRecord(subject.embed.record.record)
    ) {
      embedHidden = hiddenPosts.includes(subject.embed.record.record.uri)
    }
    if (embedHidden) {
      moderations.embed.filter = true
      moderations.embed.blur = true
      if (!moderations.embed.cause) {
        moderations.embed.cause = {
          // @ts-ignore Temporary extension to the moderation system -prf
          type: 'post-hidden',
          source: {type: 'user'},
          priority: 1,
        }
      }
    }
  }

  return moderations
}

export function checkIsModerated(post: AppBskyFeedDefs.PostView): boolean {
  // If there are no labels on the post, it is not moderated
  if (!post.labels?.[0] || !AppBskyFeedPost.isRecord(post.record)) {
    return false
  }

  // If there are labels on the post and none on the record, it is moderated
  const labelValues = post.record.labels?.values
  if (!Array.isArray(labelValues) || labelValues.length === 0) {
    return true
  }

  // If there's a label that exists in the labels but not on the record, then
  // we want to be able to appeal it
  // TODO what happens with 3p-labelers?
  const recordLabels = labelValues as SelfLabel[]
  for (const label of post.labels) {
    if (!recordLabels.some(l => l.val === label.val)) {
      return true
    }
  }

  return false
}
