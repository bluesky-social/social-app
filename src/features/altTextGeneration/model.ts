import {generateAsync, getAvailabilityAsync} from 'expo-ai'
import {Tools} from 'expo-ai/apple'

import {codeToLanguageName} from '#/locale/helpers'
import {cleanAltText} from './utils'

/**
 * The model has to be able to see the image itself. Feature detection rather
 * than OS checks: in practice this is iOS 27 with Apple Intelligence on, in a
 * build made with Xcode 27.
 */
const REQUIREMENTS = {requires: ['images']} as const

/**
 * The first of `languages` (BCP 47 codes) that the system's on-device model
 * can describe images in, if any. Checking never starts a model download.
 */
export async function getSupportedLanguage(languages: string[]) {
  for (const language of new Set(languages)) {
    const availability = await getAvailabilityAsync({
      ...REQUIREMENTS,
      outputLanguage: language,
    })
    if (availability.status === 'available') return language
  }
  return undefined
}

/**
 * One generation at a time. Each request runs its own model session, and
 * adding several images at once shouldn't spin up several of those in
 * parallel.
 */
let queue: Promise<unknown> = Promise.resolve()

/**
 * Drafts alt text for a local image using the on-device model, with Apple
 * Vision OCR available as a tool so that text in the image is quoted
 * accurately. Writes in the first of `languages` the model supports, and
 * resolves to `undefined` if it supports none of them. Rejects if the model
 * is unavailable, refuses, or `signal` aborts.
 */
export function generateAltText({
  uri,
  languages,
  signal,
}: {
  /** A `file://` URL. */
  uri: string
  /** BCP 47 codes of the post's languages, most preferred first. */
  languages: string[]
  signal: AbortSignal
}): Promise<{altText: string; language: string} | undefined> {
  const run = queue.then(async () => {
    const language = await getSupportedLanguage(languages)
    if (!language) return undefined
    const result = await generateAsync(
      'Write alt text for the attached image.',
      {
        ...REQUIREMENTS,
        outputLanguage: language,
        instructions: getInstructions(language),
        tools: [Tools.ocr],
        images: [{uri, label: 'image'}],
        signal,
        // Generations run one at a time, so a stuck one mustn't hold up the rest
        timeoutMs: 60_000,
      },
    )
    return {altText: cleanAltText(result.value, language), language}
  })
  queue = run.catch(() => {})
  return run
}

function getInstructions(language: string) {
  return [
    'You write alt text for images that people attach to their social media posts. Screen readers read alt text aloud to people who are blind or have low vision.',
    'Describe what matters in the image in one to three plain sentences.',
    'If the image contains text, use the OCR tool to read it and include the important text word for word.',
    'Do not start with "Image of" or "Picture of". Do not guess who people are or speculate beyond what is visible.',
    'Respond with only the alt text, without any preamble, quotes or formatting.',
    // Named rather than given as a code, which the model tends to echo back
    `Write the alt text in ${codeToLanguageName(language, 'en')}.`,
  ].join('\n')
}
