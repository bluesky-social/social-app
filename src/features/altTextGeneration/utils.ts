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
