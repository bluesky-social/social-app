import {parse} from 'bcp-47'

import {logger} from '#/logger'
import {Schema} from '#/state/persisted/schema'

export function normalizeData(data: Schema) {
  /**
   * Normalize language prefs to ensure that these values only contain 2-letter
   * country codes without region.
   */
  try {
    const next = {...data.languagePrefs}
    next.primaryLanguage = normalizeLanguageTagToTwoLetterCode(
      next.primaryLanguage,
    )
    next.contentLanguages = next.contentLanguages.map(lang =>
      normalizeLanguageTagToTwoLetterCode(lang),
    )
    next.postLanguage = next.postLanguage
      .split(',')
      .map(lang => normalizeLanguageTagToTwoLetterCode(lang))
      .filter(Boolean)
      .join(',')
    next.postLanguageHistory = next.postLanguageHistory.map(postLanguage => {
      return postLanguage
        .split(',')
        .map(lang => normalizeLanguageTagToTwoLetterCode(lang))
        .filter(Boolean)
        .join(',')
    })
    // mutate last in case anything above fails
    data.languagePrefs = next
  } catch (e: any) {
    logger.error(`persisted state: failed to normalize language prefs`, {
      safeMessage: e.message,
    })
  }

  return data
}

export function normalizeLanguageTagToTwoLetterCode(lang: string) {
  const result = parse(lang).language
  return result ?? lang
}
