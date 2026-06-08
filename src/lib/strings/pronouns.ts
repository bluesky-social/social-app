import {forceLTR} from './bidi'

/**
 * Normalizes free-form pronouns text for display. Pronouns are stored verbatim
 * but conventionally shown lowercased and trimmed (e.g. "she/her").
 */
export function sanitizePronouns(
  pronouns: string,
  forceLeftToRight = true,
): string {
  const trimmed = pronouns.trim().toLowerCase()
  if (!trimmed) {
    return ''
  }
  return forceLeftToRight ? forceLTR(trimmed) : trimmed
}
