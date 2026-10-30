import {useEffect, useEffectEvent, useRef, useState} from 'react'
import {useQuery} from '@tanstack/react-query'

import {logger} from '#/logger'
import {type ComposerImage} from '#/state/gallery'
import {useLanguagePrefs} from '#/state/preferences'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAnalytics} from '#/analytics'
import {device, useStorage} from '#/storage'
import {generateAltText, getSupportedLanguage} from './model'
import {isGeneratedAltText} from './utils'

/**
 * The user's opt-in, as stored: `undefined` until they first touch the
 * setting. Use {@link useIsAltTextGenerationEnabled} to decide whether to
 * generate.
 */
export function useAltTextGenerationPref() {
  return useStorage(device, ['altTextGenerationEnabled'])
}

/**
 * Whether the user can opt in to alt text generation: the beta flag is on and
 * this device's on-device model can describe images in the user's default post
 * language or the app language.
 */
export function useIsAltTextGenerationAvailable() {
  const ax = useAnalytics()
  const {primaryLanguage, appLanguage} = useLanguagePrefs()
  const isFeatureEnabled = ax.features.enabled(
    ax.features.ComposerAltTextGenerationEnable,
  )
  const {data: isSupported = false} = useQuery({
    queryKey: createQueryKey('altTextGenerationSupport', {
      primaryLanguage,
      appLanguage,
    }),
    queryFn: async () =>
      !!(await getSupportedLanguage([primaryLanguage, appLanguage])),
    enabled: isFeatureEnabled,
    staleTime: STALE.MINUTES.FIVE,
    retry: false,
  })
  return isFeatureEnabled && isSupported
}

/**
 * Whether to generate alt text for images added in the composer. Only an
 * explicit opt-in counts.
 */
export function useIsAltTextGenerationEnabled() {
  const [pref] = useAltTextGenerationPref()
  const isAvailable = useIsAltTextGenerationAvailable()
  return isAvailable && pref === true
}

/**
 * Suggests alt text for a composer image as soon as it's added, if the user
 * has opted in and the image has none yet. The suggestion is written in the
 * post's language, and is regenerated if the post language changes, as long as
 * the user hasn't edited it. Once the user writes their own alt text or clears
 * a suggestion, the image is theirs and nothing is generated for it again.
 * Returns whether generation is in progress.
 */
export function useGeneratedAltText({
  image,
  postLanguages,
  onGenerated,
}: {
  image: ComposerImage
  /** The languages selected in the composer, most preferred first. */
  postLanguages: string[]
  onGenerated: (alt: string) => void
}) {
  const ax = useAnalytics()
  const isEnabled = useIsAltTextGenerationEnabled()
  const [isGenerating, setIsGenerating] = useState(false)
  /** Set once the user writes their own alt text or clears a suggestion. */
  const isOwnedByUser = useRef(false)
  /** The post languages the current suggestion was generated for. */
  const generatedFor = useRef<string | undefined>(undefined)
  const uri = toFileUri((image.transformed ?? image.source).path)
  const languages = postLanguages.join(',')
  const isSuggestion = isGeneratedAltText(image)
  const hasOwnAltText = image.alt.length > 0 && !isSuggestion
  const hasClearedSuggestion = !image.alt && !!image.generatedAlt

  const onSuccess = useEffectEvent(
    (
      result: Awaited<ReturnType<typeof generateAltText>>,
      requestedFor: string,
      durationMs: number,
    ) => {
      if (result?.altText) {
        generatedFor.current = requestedFor
        onGenerated(result.altText)
      }
      ax.metric('altTextGeneration:result', {
        outcome: !result
          ? 'unsupportedLanguage'
          : result.altText
            ? 'generated'
            : 'empty',
        durationMs,
        language: result?.language,
      })
    },
  )

  const onError = useEffectEvent((e: unknown, durationMs: number) => {
    logger.warn('alt text generation failed', {safeMessage: e})
    ax.metric('altTextGeneration:result', {
      outcome: 'failed',
      durationMs,
      errorCode: getErrorCode(e),
    })
  })

  useEffect(() => {
    if (hasOwnAltText || hasClearedSuggestion) {
      isOwnedByUser.current = true
      return
    }
    if (!isEnabled || !uri || isOwnedByUser.current) return
    if (isSuggestion && generatedFor.current === languages) return

    const controller = new AbortController()
    const startedAt = Date.now()
    setIsGenerating(true)
    generateAltText({
      uri,
      languages: languages.split(','),
      signal: controller.signal,
    })
      .then(result => {
        if (controller.signal.aborted) return
        onSuccess(result, languages, Date.now() - startedAt)
      })
      .catch(e => {
        if (controller.signal.aborted) return
        onError(e, Date.now() - startedAt)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsGenerating(false)
      })
    return () => {
      controller.abort()
      setIsGenerating(false)
    }
  }, [
    uri,
    languages,
    isEnabled,
    isSuggestion,
    hasOwnAltText,
    hasClearedSuggestion,
  ])

  return isGenerating
}

/**
 * expo-ai rejects with `LanguageModelError`s, which carry a `code` such as
 * `ERR_MODEL_REFUSAL`. Read it structurally so web doesn't import expo-ai.
 */
function getErrorCode(e: unknown) {
  if (e && typeof e === 'object' && 'code' in e && typeof e.code === 'string') {
    return e.code
  }
  return undefined
}

/**
 * expo-ai only accepts `file://` URLs. Composer images are usually already in
 * that form, but cropped images can come back as bare paths, and pasted ones
 * as data URIs, which aren't supported.
 */
function toFileUri(path: string) {
  if (path.startsWith('file://')) return path
  if (path.startsWith('/')) return `file://${encodeURI(path)}`
  return undefined
}
