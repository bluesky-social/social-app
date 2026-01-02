import {type AppBskyFeedDefs, AppBskyFeedPost} from '@atproto/api'
import * as bcp47Match from 'bcp-47-match'
import lande from 'lande'

import {hasProp} from '#/lib/type-guards'
import {
  AppLanguage,
  type Language,
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

function getLocalizedLanguage(
  langCode: string,
  appLang: string,
): string | undefined {
  try {
    const allNames = new Intl.DisplayNames([appLang], {
      type: 'language',
      fallback: 'none',
      languageDisplay: 'standard',
    })
    const translatedName = allNames.of(langCode)

    if (translatedName) {
      return translatedName
    }
  } catch (e) {
    // ignore RangeError from Intl.DisplayNames APIs
    if (!(e instanceof RangeError)) {
      throw e
    }
  }
}

export function languageName(language: Language, appLang: string): string {
  // if Intl.DisplayNames is unavailable on the target, display the English name
  if (!Intl.DisplayNames) {
    return language.name
  }

  return getLocalizedLanguage(language.code2, appLang) || language.name
}

export function codeToLanguageName(lang2or3: string, appLang: string): string {
  const code2 = code3ToCode2(lang2or3)
  const knownLanguage = LANGUAGES_MAP_CODE2[code2]

  return knownLanguage ? languageName(knownLanguage, appLang) : code2
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
 * Context: post-refactor, we populated some user's `appLanguage` setting with
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
      case 'an':
        return AppLanguage.an
      case 'ast':
        return AppLanguage.ast
      case 'ca':
        return AppLanguage.ca
      case 'cy':
        return AppLanguage.cy
      case 'da':
        return AppLanguage.da
      case 'de':
        return AppLanguage.de
      case 'el':
        return AppLanguage.el
      case 'en-GB':
        return AppLanguage.en_GB
      case 'eo':
        return AppLanguage.eo
      case 'es':
        return AppLanguage.es
      case 'eu':
        return AppLanguage.eu
      case 'fi':
        return AppLanguage.fi
      case 'fr':
        return AppLanguage.fr
      case 'fy':
        return AppLanguage.fy
      case 'ga':
        return AppLanguage.ga
      case 'gd':
        return AppLanguage.gd
      case 'gl':
        return AppLanguage.gl
      case 'hi':
        return AppLanguage.hi
      case 'hu':
        return AppLanguage.hu
      case 'ia':
        return AppLanguage.ia
      case 'id':
        return AppLanguage.id
      case 'it':
        return AppLanguage.it
      case 'ja':
        return AppLanguage.ja
      case 'km':
        return AppLanguage.km
      case 'ko':
        return AppLanguage.ko
      case 'ne':
        return AppLanguage.ne
      case 'nl':
        return AppLanguage.nl
      case 'pl':
        return AppLanguage.pl
      case 'pt-BR':
        return AppLanguage.pt_BR
      case 'pt-PT':
        return AppLanguage.pt_PT
      case 'ro':
        return AppLanguage.ro
      case 'ru':
        return AppLanguage.ru
      case 'sv':
        return AppLanguage.sv
      case 'th':
        return AppLanguage.th
      case 'tr':
        return AppLanguage.tr
      case 'uk':
        return AppLanguage.uk
      case 'vi':
        return AppLanguage.vi
      case 'zh-Hans-CN':
        return AppLanguage.zh_CN
      case 'zh-Hant-HK':
        return AppLanguage.zh_HK
      case 'zh-Hant-TW':
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

/**
 * Gets region name for a given country code and language.
 *
 * Falls back to English if unavailable/error, and if that fails, returns the country code.
 *
 * Intl.DisplayNames is widely available + has been polyfilled on native
 */
export function regionName(countryCode: string, appLang: string): string {
  const translatedName = getLocalizedRegionName(countryCode, appLang)

  if (translatedName) {
    return translatedName
  }

  // Fallback: get English name. Needed for i.e. Esperanto
  const englishName = getLocalizedRegionName(countryCode, 'en')
  if (englishName) {
    return englishName
  }

  // Final fallback: return country code
  return countryCode
}

function getLocalizedRegionName(
  countryCode: string,
  appLang: string,
): string | undefined {
  try {
    const allNames = new Intl.DisplayNames([appLang], {
      type: 'region',
      fallback: 'none',
    })

    return allNames.of(countryCode)
  } catch (err) {
    console.warn('Error getting localized region name:', err)
    return undefined
  }
}
