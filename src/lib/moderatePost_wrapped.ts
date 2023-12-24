import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  moderatePost,
} from '@atproto/api'

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
