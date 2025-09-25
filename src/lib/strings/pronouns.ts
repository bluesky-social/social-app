import {forceLTR} from './bidi'

export function sanitizePronouns(
  pronouns: string,
  forceLeftToRight = true,
): string {
  if (!pronouns || pronouns.trim() === '') {
    return ''
  }

  const trimmed = pronouns.trim().toLowerCase()
  return forceLeftToRight ? forceLTR(trimmed) : trimmed
}
