import {useCallback} from 'react'
import {Alert} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {getTranslatorLink} from '#/locale/helpers'
import {logger} from '#/logger'
import {setTranslationState} from '#/state/translation'
import {useAnalytics} from '#/analytics'
import {useOpenLink} from './useOpenLink'

/**
 * Attempts on-device translation via expo-translate-text.
 * Uses a lazy require to avoid crashing if the native module
 * isn't linked into the current build.
 */
async function attemptTranslation(
  text: string,
  language: string,
  postUri: string,
): Promise<void> {
  const {onTranslateTask} =
    require('expo-translate-text') as typeof import('expo-translate-text')
  const result = await onTranslateTask({
    input: text,
    targetLangCode: language,
  })

  setTranslationState(postUri, {
    status: 'success',
    translatedText:
      typeof result.translatedTexts === 'string' ? result.translatedTexts : '',
    sourceLanguage: result.sourceLanguage ?? '',
  })
}

/**
 * Native translation hook. Attempts on-device translation using
 * Apple Translation (iOS 18+) or Google ML Kit (Android).
 * Falls back to Google Translate URL if the language pack is
 * unavailable or the user declines to download it.
 *
 * Web uses useTranslate.web.ts which always opens Google Translate.
 */
export function useTranslate() {
  const openLink = useOpenLink()
  const {_} = useLingui()
  const ax = useAnalytics()

  return useCallback(
    async (text: string, language: string, opts?: {postUri?: string}) => {
      // No postUri means non-post context (e.g. DMs) — open Google Translate
      if (!opts?.postUri) {
        const translateUrl = getTranslatorLink(text, language)
        await openLink(translateUrl)
        return
      }

      const postUri = opts.postUri
      setTranslationState(postUri, {status: 'loading'})

      try {
        await attemptTranslation(text, language, postUri)
        ax.metric('translate:result', {method: 'on-device'})
      } catch (err) {
        logger.error('Failed to translate post', {safeMessage: err})
        setTranslationState(postUri, {status: 'idle'})

        // On-device translation failed (language pack missing or user
        // dismissed the download prompt). Show options to retry or
        // fall back to Google Translate.
        ax.metric('translate:result', {method: 'fallback-alert'})
        Alert.alert(
          _(msg`Translation unavailable`),
          _(msg`The required language pack is not installed on your device.`),
          [
            {
              text: _(msg`Download language pack`),
              onPress: async () => {
                setTranslationState(postUri, {status: 'loading'})
                try {
                  await attemptTranslation(text, language, postUri)
                  ax.metric('translate:result', {method: 'on-device'})
                } catch (retryErr) {
                  logger.error('Failed to translate post', {
                    safeMessage: retryErr,
                  })
                  setTranslationState(postUri, {status: 'idle'})
                }
              },
            },
            {
              text: _(msg`Use Google Translate`),
              onPress: () => {
                ax.metric('translate:result', {method: 'google-translate'})
                openLink(getTranslatorLink(text, language))
              },
            },
            {
              text: _(msg`Cancel`),
              style: 'cancel',
            },
          ],
        )
      }
    },
    [_, ax, openLink],
  )
}
