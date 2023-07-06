import {AppBskyFeedDefs, AppBskyFeedPost} from '@atproto/api'
import lande from 'lande'
import {hasProp} from 'lib/type-guards'
import * as bcp47Match from 'bcp-47-match'
import {LANGUAGES_MAP_CODE2, LANGUAGES_MAP_CODE3} from './languages'

export function code2ToCode3(lang: string): string {
  if (lang.length === 2) {
    return LANGUAGES_MAP_CODE2[lang]?.code3 || lang
  }
  return lang
}

export function code3ToCode2(lang: string): string {
  if (lang.length === 3) {
    return LANGUAGES_MAP_CODE3[lang]?.code2 || lang
  }
  return lang
}

export function codeToLanguageName(lang: string): string {
  const lang2 = code3ToCode2(lang)
  return LANGUAGES_MAP_CODE2[lang2]?.name || lang
}

export function getPostLanguage(
  post: AppBskyFeedDefs.PostView,
): string | undefined {
  let candidates: string[] = []
  let postText: string = ''
  if (hasProp(post.record, 'text') && typeof post.record.text === 'string') {
    postText = post.record.text
  }

  if (
    AppBskyFeedPost.isRecord(post.record) &&
    hasProp(post.record, 'langs') &&
    Array.isArray(post.record.langs)
  ) {
    candidates = post.record.langs
  }

  // if there's only one declared language, use that
  if (candidates?.length === 1) {
    return candidates[0]
  }

  // no text? can't determine
  if (postText.trim().length === 0) {
    return undefined
  }

  // run the language model
  let langsProbabilityMap = lande(postText)

  // filter down using declared languages
  if (candidates?.length) {
    langsProbabilityMap = langsProbabilityMap.filter(
      ([lang, _probability]: [string, number]) => {
        return candidates.includes(code3ToCode2(lang))
      },
    )
  }

  if (langsProbabilityMap[0]) {
    return code3ToCode2(langsProbabilityMap[0][0])
  }
}

export function isPostInLanguage(
  post: AppBskyFeedDefs.PostView,
  targetLangs: string[],
): boolean {
  const lang = getPostLanguage(post)
  if (!lang) {
    // the post has no text, so we just say "yes" for now
    return true
  }
  return bcp47Match.basicFilter(lang, targetLangs).length > 0
}

export function getTranslatorLink(lang: string, text: string): string {
  return encodeURI(
    `https://translate.google.com/?sl=auto&tl=${lang}&text=${text}`,
  )
}
