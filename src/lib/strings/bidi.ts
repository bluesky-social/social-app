import {IS_WEB} from '#/env'

const LEFT_TO_RIGHT_EMBEDDING = '\u202A'
const POP_DIRECTIONAL_FORMATTING = '\u202C'
const languageDirectionCache = new Map<string, boolean>()

/*
 * Force LTR directionality in a string.
 * https://www.unicode.org/reports/tr9/#Directional_Formatting_Characters
 *
 * On web, direction is isolated with CSS instead (direction: ltr + unicode-bidi:
 * isolate on the surrounding Text), so these invisible control characters are not
 * injected. Injecting them leaks the characters into the rendered text, where
 * they end up in copy-paste and break handle lookups in other apps and tools
 * (#8451). Native has no equivalent CSS, so the manual wrapping is kept there.
 */
export function forceLTR(str: string) {
  if (IS_WEB) return str
  return LEFT_TO_RIGHT_EMBEDDING + str + POP_DIRECTIONAL_FORMATTING
}

/**
 * Determines whether a BCP 47 language tag uses a right-to-left script.
 */
export function isRTL(language: string | undefined) {
  if (!language) return false

  const cached = languageDirectionCache.get(language)
  if (cached !== undefined) return cached

  try {
    const isRightToLeft =
      new Intl.Locale(language).getTextInfo().direction === 'rtl'
    languageDirectionCache.set(language, isRightToLeft)
    return isRightToLeft
  } catch {
    languageDirectionCache.set(language, false)
    return false
  }
}
