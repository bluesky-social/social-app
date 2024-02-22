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

export function hasMutedWord(
  mutedWords: AppBskyActorDefs.MutedWord[],
  text: string,
  facets?: AppBskyRichtextFacet.Main[],
  outlineTags?: string[],
) {
  const tags = ([] as string[])
    .concat(outlineTags || [])
    .concat(
      facets
        ?.filter(facet => {
          return facet.features.find(feature =>
            AppBskyRichtextFacet.isTag(feature),
          )
        })
        .map(t => t.features[0].tag as string) || [],
    )
    .map(t => t.toLowerCase())

  const words = text.toLowerCase().split(/\s+/)

  for (const mute of mutedWords) {
    const mutedWord = mute.value.toLowerCase()

    // `content` applies to tags as well
    if (tags.includes(mutedWord)) return true
    // rest of the checks are for `content` only
    if (!mute.targets.includes('content')) continue
    // single character, has to use includes
    if (mutedWord.length === 1 && text.includes(mutedWord)) return true
    // too long
    if (mutedWord.length > text.length) continue
    // exact match
    if (mutedWord === text) return true

    // check individual character groups
    for (const word of words) {
      if (word === mutedWord) return true

      const wordNoPunc = word.replace(/\p{P}+$/gu, '')
      const mutedWordNoPunc = mutedWord.replace(/\p{P}+$/gu, '')

      if (mutedWordNoPunc === wordNoPunc) return true
    }
  }

  return false
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
    const muted = hasMutedWord(
      mutedWords,
      subject.record.text,
      subject.record.facets || [],
      subject.record.tags || [],
    )

    if (muted) {
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
  }

  // TODO mute embed
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
