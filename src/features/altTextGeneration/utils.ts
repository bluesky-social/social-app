import {MAX_ALT_TEXT} from '#/lib/constants'
import {enforceLen} from '#/lib/strings/helpers'
import {type ComposerImage} from '#/state/gallery'

/**
 * Whether an image's alt text is a suggestion the user hasn't edited.
 */
export function isGeneratedAltText(image: ComposerImage) {
  return image.alt.length > 0 && image.alt === image.generatedAlt
}

/**
 * What happened to the suggestions for a post's images by the time it was
 * published, or `undefined` if none of them had one.
 */
export function getGeneratedAltTextOutcomes(images: ComposerImage[]) {
  const suggested = images.filter(image => image.generatedAlt)
  if (suggested.length === 0) return undefined
  return {
    kept: suggested.filter(isGeneratedAltText).length,
    edited: suggested.filter(image => image.alt && !isGeneratedAltText(image))
      .length,
    cleared: suggested.filter(image => !image.alt).length,
  }
}

/**
 * Tidies the model's answer. It sometimes labels it anyway, e.g. `en: …`,
 * `[en] …` or `Alt text: …`, or wraps it in quotes.
 */
export function cleanAltText(text: string, language: string) {
  const code = language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const label = new RegExp(
    `^(?:\\[${code}\\]\\s*:?|(?:${code}|alt(?: text)?|description)\\s*:)\\s*`,
    'i',
  )
  const cleaned = text
    .trim()
    .replace(label, '')
    .replace(/^["“]([\s\S]*)["”]$/, '$1')
    .trim()
  return enforceLen(cleaned, MAX_ALT_TEXT, true)
}
