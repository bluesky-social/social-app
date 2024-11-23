import {AppBskyFeedDefs, AppBskyFeedPost} from '@atproto/api'
import * as bcp47Match from 'bcp-47-match'
import lande from 'lande'

import {hasProp} from '#/lib/type-guards'
import {
  AppLanguage,
  LANGUAGES_MAP_CODE2,
  LANGUAGES_MAP_CODE3,
} from './languages'

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

export function code3ToCode2Strict(lang: string): string | undefined {
  if (lang.length === 3) {
    return LANGUAGES_MAP_CODE3[lang]?.code2
  }

  return undefined
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

export function getTranslatorLink(text: string, lang: string): string {
  return `https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(
    text,
  )}`
}

/**
 * Returns a valid `appLanguage` value from an arbitrary string.
 *
 * Contenxt: post-refactor, we populated some user's `appLanguage` setting with
 * `postLanguage`, which can be a comma-separated list of values. This breaks
 * `appLanguage` handling in the app, so we introduced this util to parse out a
 * valid `appLanguage` from the pre-populated `postLanguage` values.
 *
 * The `appLanguage` will continue to be incorrect until the user returns to
 * language settings and selects a new option, at which point we'll re-save
 * their choice, which should then be a valid option. Since we don't know when
 * this will happen, we should leave this here until we feel it's safe to
 * remove, or we re-migrate their storage.
 */
export function sanitizeAppLanguageSetting(appLanguage: string): AppLanguage {
  const langs = appLanguage.split(',').filter(Boolean)

  for (const lang of langs) {
    switch (fixLegacyLanguageCode(lang)) {
      case 'en':
        return AppLanguage.en
      case 'ca':
        return AppLanguage.ca
      case 'de':
        return AppLanguage.de
      case 'en-GB':
        return AppLanguage.en_GB
      case 'es':
        return AppLanguage.es
      case 'fi':
        return AppLanguage.fi
      case 'fr':
        return AppLanguage.fr
      case 'ga':
        return AppLanguage.ga
      case 'hi':
        return AppLanguage.hi
      case 'hu':
        return AppLanguage.hu
      case 'id':
        return AppLanguage.id
      case 'it':
        return AppLanguage.it
      case 'ja':
        return AppLanguage.ja
      case 'ko':
        return AppLanguage.ko
      case 'pl':
        return AppLanguage.pl
      case 'pt-BR':
        return AppLanguage.pt_BR
      case 'ru':
        return AppLanguage.ru
      case 'th':
        return AppLanguage.th
      case 'tr':
        return AppLanguage.tr
      case 'uk':
        return AppLanguage.uk
      case 'zh-CN':
        return AppLanguage.zh_CN
      case 'zh-HK':
        return AppLanguage.zh_HK
      case 'zh-TW':
        return AppLanguage.zh_TW
      default:
        continue
    }
  }
  return AppLanguage.en
}

/**
 * Handles legacy migration for Java devices.
 *
 * {@link https://github.com/bluesky-social/social-app/pull/4461}
 * {@link https://xml.coverpages.org/iso639a.html}
 */
export function fixLegacyLanguageCode(code: string | null): string | null {
  if (code === 'in') {
    // indonesian
    return 'id'
  }
  if (code === 'iw') {
    // hebrew
    return 'he'
  }
  if (code === 'ji') {
    // yiddish
    return 'yi'
  }
  return code
}

/**
 * Find the first language supported by our translation infra. Values should be
 * in order of preference, and match the values of {@link AppLanguage}.
 *
 * If no match, returns `en`.
 */
export function findSupportedAppLanguage(languageTags: (string | undefined)[]) {
  const supported = new Set(Object.values(AppLanguage))
  for (const tag of languageTags) {
    if (!tag) continue
    if (supported.has(tag as AppLanguage)) {
      return tag
    }
  }
  return AppLanguage.en
}
