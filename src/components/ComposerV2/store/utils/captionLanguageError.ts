export type CaptionLanguageError =
  'missing-caption-language' | 'duplicate-caption-language'

/**
 * Captions publish one blob per language, so a blank or repeated language can
 * never be planned correctly. Languages are compared trimmed and exact.
 */
export function captionLanguageError({
  captions,
}: {
  captions: ReadonlyArray<{lang: string}>
}): CaptionLanguageError | undefined {
  const seen = new Set<string>()
  for (const {lang} of captions) {
    const trimmed = lang.trim()
    if (!trimmed) return 'missing-caption-language'
    if (seen.has(trimmed)) return 'duplicate-caption-language'
    seen.add(trimmed)
  }
  return undefined
}
