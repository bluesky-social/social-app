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
 * Starts generating alt text for a composer image as soon as it's added, if
 * the user has opted in and the image has none yet. Generation is abandoned
 * if the user writes their own alt text first, or the image is removed, and
 * restarts if the post language changes before it finishes. Returns whether
 * generation is in progress.
 */
export function useGeneratedAltText({
  image,
  postLanguages,
  onGenerated,
}: {
  image: ComposerImage
  /**
   * Alt text is part of the post, so it's written in the post's language where
   * the model supports it, falling back to the app language.
   */
  postLanguages: string[]
  onGenerated: (alt: string) => void
}) {
  const isEnabled = useIsAltTextGenerationEnabled()
  const {appLanguage} = useLanguagePrefs()
  const languages = [...postLanguages, appLanguage].join(',')
  const [isGenerating, setIsGenerating] = useState(false)
  /*
   * Images that have had alt text at some point, whether generated or written
   * by the user. If the user later clears it, that's deliberate, so don't
   * generate again.
   */
  const hadAltText = useRef(new Set<string>())
  const uri = toFileUri((image.transformed ?? image.source).path)
  const hasAltText = image.alt.length > 0

  const onSuccess = useEffectEvent((alt: string) => {
    if (alt) onGenerated(alt)
  })

  useEffect(() => {
    if (!uri) return
    if (hasAltText) {
      hadAltText.current.add(uri)
      return
    }
    if (!isEnabled || hadAltText.current.has(uri)) return

    const controller = new AbortController()
    setIsGenerating(true)
    generateAltText({
      uri,
      languages: languages.split(','),
      signal: controller.signal,
    })
      .then(onSuccess)
      .catch(e => {
        if (controller.signal.aborted) return
        logger.warn('alt text generation failed', {safeMessage: e})
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsGenerating(false)
      })
    return () => {
      controller.abort()
      setIsGenerating(false)
    }
  }, [uri, hasAltText, isEnabled, languages])

  return isGenerating
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
