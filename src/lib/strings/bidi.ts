import {IS_WEB} from '#/env'

const LEFT_TO_RIGHT_EMBEDDING = '\u202A'
const POP_DIRECTIONAL_FORMATTING = '\u202C'

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
