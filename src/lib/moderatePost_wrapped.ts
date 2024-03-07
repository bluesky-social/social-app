import {
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  moderatePost,
  AppBskyActorDefs,
  AppBskyFeedPost,
  AppBskyRichtextFacet,
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
} from '@atproto/api'

type ModeratePost = typeof moderatePost
type Options = Parameters<ModeratePost>[1] & {
  hiddenPosts?: string[]
  mutedWords?: AppBskyActorDefs.MutedWord[]
}

const REGEX = {
  LEADING_TRAILING_PUNCTUATION: /(?:^\p{P}+|\p{P}+$)/gu,
  ESCAPE: /[[\]{}()*+?.\\^$|\s]/g,
  SEPARATORS: /[\/\-\–\—\(\)\[\]\_]+/g,
  WORD_BOUNDARY: /[\s\n\t\r\f\v]+?/g,
}

/**
 * List of 2-letter lang codes for languages that either don't use spaces, or
 * don't use spaces in a way conducive to word-based filtering.
 *
 * For these, we use a simple `String.includes` to check for a match.
 */
const LANGUAGE_EXCEPTIONS = [
  'ja', // Japanese
  'zh', // Chinese
  'ko', // Korean
  'th', // Thai
  'vi', // Vietnamese
]

export function hasMutedWord({
  mutedWords,
  text,
  facets,
  outlineTags,
  languages,
  isOwnPost,
}: {
  mutedWords: AppBskyActorDefs.MutedWord[]
  text: string
  facets?: AppBskyRichtextFacet.Main[]
  outlineTags?: string[]
  languages?: string[]
  isOwnPost: boolean
}) {
  if (isOwnPost) return false

  const exception = LANGUAGE_EXCEPTIONS.includes(languages?.[0] || '')
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

  for (const mute of mutedWords) {
    const mutedWord = mute.value.toLowerCase()
    const postText = text.toLowerCase()

    // `content` applies to tags as well
    if (tags.includes(mutedWord)) return true
    // rest of the checks are for `content` only
    if (!mute.targets.includes('content')) continue
    // single character or other exception, has to use includes
    if ((mutedWord.length === 1 || exception) && postText.includes(mutedWord))
      return true
    // too long
    if (mutedWord.length > postText.length) continue
    // exact match
    if (mutedWord === postText) return true
    // any muted phrase with space or punctuation
    if (/(?:\s|\p{P})+?/u.test(mutedWord) && postText.includes(mutedWord))
      return true

    // check individual character groups
    const words = postText.split(REGEX.WORD_BOUNDARY)
    for (const word of words) {
      if (word === mutedWord) return true

      // compare word without leading/trailing punctuation, but allow internal
      // punctuation (such as `s@ssy`)
      const wordTrimmedPunctuation = word.replace(
        REGEX.LEADING_TRAILING_PUNCTUATION,
        '',
      )

      if (mutedWord === wordTrimmedPunctuation) return true
      if (mutedWord.length > wordTrimmedPunctuation.length) continue

      // handle hyphenated, slash separated words, etc
      if (REGEX.SEPARATORS.test(wordTrimmedPunctuation)) {
        // check against full normalized phrase
        const wordNormalizedSeparators = wordTrimmedPunctuation.replace(
          REGEX.SEPARATORS,
          ' ',
        )
        const mutedWordNormalizedSeparators = mutedWord.replace(
          REGEX.SEPARATORS,
          ' ',
        )
        // hyphenated (or other sep) to spaced words
        if (wordNormalizedSeparators === mutedWordNormalizedSeparators)
          return true

        /* Disabled for now e.g. `super-cool` to `supercool`
        const wordNormalizedCompressed = wordNormalizedSeparators.replace(
          REGEX.WORD_BOUNDARY,
          '',
        )
        const mutedWordNormalizedCompressed =
          mutedWordNormalizedSeparators.replace(/\s+?/g, '')
        // hyphenated (or other sep) to non-hyphenated contiguous word
        if (mutedWordNormalizedCompressed === wordNormalizedCompressed)
          return true
        */

        // then individual parts of separated phrases/words
        const wordParts = wordTrimmedPunctuation.split(REGEX.SEPARATORS)
        for (const wp of wordParts) {
          // still retain internal punctuation
          if (wp === mutedWord) return true
        }
      }
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
  const isOwnPost = subject.author.did === opts.userDid

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

  if (AppBskyFeedPost.isRecord(subject.record)) {
    let muted = hasMutedWord({
      mutedWords,
      text: subject.record.text,
      facets: subject.record.facets || [],
      outlineTags: subject.record.tags || [],
      languages: subject.record.langs,
      isOwnPost,
    })

    if (
      subject.record.embed &&
      AppBskyEmbedImages.isMain(subject.record.embed)
    ) {
      for (const image of subject.record.embed.images) {
        muted =
          muted ||
          hasMutedWord({
            mutedWords,
            text: image.alt,
            facets: [],
            outlineTags: [],
            languages: subject.record.langs,
            isOwnPost,
          })
      }
    }

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

  if (subject.embed) {
    let embedHidden = false
    let embedMuted = false
    let externalMuted = false

    if (AppBskyEmbedRecord.isViewRecord(subject.embed.record)) {
      embedHidden = hiddenPosts.includes(subject.embed.record.uri)
    }
    if (
      AppBskyEmbedRecordWithMedia.isView(subject.embed) &&
      AppBskyEmbedRecord.isViewRecord(subject.embed.record.record)
    ) {
      embedHidden = hiddenPosts.includes(subject.embed.record.record.uri)
    }

    if (AppBskyEmbedRecord.isViewRecord(subject.embed.record)) {
      if (AppBskyFeedPost.isRecord(subject.embed.record.value)) {
        const embeddedPost = subject.embed.record.value

        embedMuted =
          embedMuted ||
          hasMutedWord({
            mutedWords,
            text: embeddedPost.text,
            facets: embeddedPost.facets,
            outlineTags: embeddedPost.tags,
            languages: embeddedPost.langs,
            isOwnPost,
          })

        if (AppBskyEmbedImages.isMain(embeddedPost.embed)) {
          for (const image of embeddedPost.embed.images) {
            embedMuted =
              embedMuted ||
              hasMutedWord({
                mutedWords,
                text: image.alt,
                facets: [],
                outlineTags: [],
                languages: embeddedPost.langs,
                isOwnPost,
              })
          }
        }

        if (AppBskyEmbedExternal.isMain(embeddedPost.embed)) {
          const {external} = embeddedPost.embed

          embedMuted =
            embedMuted ||
            hasMutedWord({
              mutedWords,
              text: external.title + ' ' + external.description,
              facets: [],
              outlineTags: [],
              languages: [],
              isOwnPost,
            })
        }

        if (AppBskyEmbedRecordWithMedia.isMain(embeddedPost.embed)) {
          if (AppBskyEmbedExternal.isMain(embeddedPost.embed.media)) {
            const {external} = embeddedPost.embed.media

            embedMuted =
              embedMuted ||
              hasMutedWord({
                mutedWords,
                text: external.title + ' ' + external.description,
                facets: [],
                outlineTags: [],
                languages: [],
                isOwnPost,
              })
          }

          if (AppBskyEmbedImages.isMain(embeddedPost.embed.media)) {
            for (const image of embeddedPost.embed.media.images) {
              embedMuted =
                embedMuted ||
                hasMutedWord({
                  mutedWords,
                  text: image.alt,
                  facets: [],
                  outlineTags: [],
                  languages: AppBskyFeedPost.isRecord(embeddedPost.record)
                    ? embeddedPost.langs
                    : [],
                  isOwnPost,
                })
            }
          }
        }
      }
    }

    if (AppBskyEmbedExternal.isView(subject.embed)) {
      const {external} = subject.embed

      externalMuted =
        externalMuted ||
        hasMutedWord({
          mutedWords,
          text: external.title + ' ' + external.description,
          facets: [],
          outlineTags: [],
          languages: [],
          isOwnPost,
        })
    }

    if (
      AppBskyEmbedRecordWithMedia.isView(subject.embed) &&
      AppBskyEmbedRecord.isViewRecord(subject.embed.record.record)
    ) {
      if (AppBskyFeedPost.isRecord(subject.embed.record.record.value)) {
        const post = subject.embed.record.record.value
        embedMuted =
          embedMuted ||
          hasMutedWord({
            mutedWords,
            text: post.text,
            facets: post.facets,
            outlineTags: post.tags,
            languages: post.langs,
            isOwnPost,
          })
      }

      if (AppBskyEmbedImages.isView(subject.embed.media)) {
        for (const image of subject.embed.media.images) {
          embedMuted =
            embedMuted ||
            hasMutedWord({
              mutedWords,
              text: image.alt,
              facets: [],
              outlineTags: [],
              languages: AppBskyFeedPost.isRecord(subject.record)
                ? subject.record.langs
                : [],
              isOwnPost,
            })
        }
      }
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
    } else if (externalMuted || embedMuted) {
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

  return moderations
}
