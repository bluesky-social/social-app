/*
 * No browser exposes an on-device model with image input yet, so web skips
 * bundling expo-ai altogether.
 */

export function getSupportedLanguage(_: string[]): Promise<string | undefined> {
  return Promise.resolve(undefined)
}

export function generateAltText(_: {
  uri: string
  languages: string[]
  signal: AbortSignal
}): Promise<string> {
  return Promise.reject(
    new Error('Alt text generation is not supported on web'),
  )
}
