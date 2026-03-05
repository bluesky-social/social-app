import lande from 'lande'

import {code3ToCode2Strict} from '#/locale/helpers'

// TODO: Replace with expo-guess-language
export function guessLanguage(text: string): string | null {
  const results = lande(text)
  // only return high-confidence results
  if (results[0] && results[0][1] > 0.97) {
    return code3ToCode2Strict(results[0][0]) ?? null
  }
  return null
}
