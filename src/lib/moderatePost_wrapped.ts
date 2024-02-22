import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  moderatePost,
  AppBskyActorDefs,
  AppBskyFeedPost,
  AppBskyRichtextFacet,
} from '@atproto/api'

type ModeratePost = typeof moderatePost
type Options = Parameters<ModeratePost>[1] & {
  hiddenPosts?: string[]
  mutedWords?: AppBskyActorDefs.MutedWord[]
}

export function moderatePost_wrapped(
  subject: Parameters<ModeratePost>[0],
  opts: Options,
) {
  const {hiddenPosts = [], mutedWords = [], ...options} = opts
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

  if (mutedWords.length && AppBskyFeedPost.isRecord(subject.record)) {
    const {text, ...post} = subject.record
    const tags = ([] as string[]).concat(post.tags || []).concat(
      post.facets
        ?.filter(facet => {
          return facet.features.find(feature =>
            AppBskyRichtextFacet.isTag(feature),
          )
        })
        .map(t => t.features[0].tag as string) || [],
    )
    const allMutedTags = []
    const allMutedWords = []

    for (const word of mutedWords) {
      if (word.targets.includes('tag')) {
        allMutedTags.push(word.value)
      } else {
        allMutedWords.push(word.value)
      }
    }

    for (const mutedWord of allMutedWords) {
      if (text.includes(mutedWord)) {
        moderations.content.filter = true
        moderations.content.blur = true
        if (!moderations.content.cause) {
          moderations.content.cause = {
            // @ts-ignore Temporary extension to the moderation system -prf
            type: 'muted-word',
            source: {type: 'user'},
            priority: 1,
          }
        }
        // only need one
        break
      }
    }

    for (const mutedTag of allMutedTags) {
      if (tags.includes(mutedTag)) {
        moderations.content.filter = true
        moderations.content.blur = true
        if (!moderations.content.cause) {
          moderations.content.cause = {
            // @ts-ignore Temporary extension to the moderation system -prf
            type: 'muted-word',
            source: {type: 'user'},
            priority: 1,
          }
        }
      }
      // only need one
      break
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
