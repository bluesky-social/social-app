import {useCallback} from 'react'
import * as IntentLauncher from 'expo-intent-launcher'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {guessLanguage} from '#/lib/translation/utils'
import {
  getTranslatorLink,
  getTranslatorLinkDeepL,
  getTranslatorLinkLibreTranslate,
} from '#/locale/helpers'
import {
  useLibreTranslateInstance,
  useTranslationProvider,
} from '#/state/preferences'
import {IS_ANDROID} from '#/env'

/**
 * Links out to the user's chosen translation provider (DeepL, Google, or a
 * LibreTranslate instance). On Android with Google selected, tries the native
 * Translate app first and falls back to the web link.
 */
export function useGoogleTranslate() {
  const openLink = useOpenLink()
  const provider = useTranslationProvider()
  const libreTranslateInstance = useLibreTranslateInstance()

  return useCallback(
    async (text: string, targetLangCode: string, sourceLanguage?: string) => {
      let translateUrl
      if (provider === 'deepl') {
        // DeepL's deep-link only prefills with an explicit source language, so
        // use the caller's if given, otherwise detect it from the text. If we
        // still can't determine one, fall back to Google so the text is at
        // least prefilled.
        const deeplSource = sourceLanguage ?? guessLanguage(text)
        if (deeplSource) {
          translateUrl = getTranslatorLinkDeepL(
            text,
            targetLangCode,
            deeplSource,
          )
        } else {
          translateUrl = getTranslatorLink(text, targetLangCode, sourceLanguage)
        }
      } else if (provider === 'libreTranslate') {
        translateUrl = getTranslatorLinkLibreTranslate(
          text,
          targetLangCode,
          sourceLanguage,
          libreTranslateInstance,
        )
      } else {
        translateUrl = getTranslatorLink(text, targetLangCode, sourceLanguage)
      }
      if (IS_ANDROID && provider === 'google') {
        try {
          // use `getApplicationIconAsync` to determine if the translate app is installed
          if (
            !(await IntentLauncher.getApplicationIconAsync(
              'com.google.android.apps.translate',
            ))
          ) {
            throw new Error('Translate app not installed')
          }

          // TODO: this should only be called one at a time, use something like
          // RQ's `scope` - otherwise can trigger the browser to open unexpectedly when the call throws -sfn
          await IntentLauncher.startActivityAsync(
            'android.intent.action.PROCESS_TEXT',
            {
              type: 'text/plain',
              extra: {
                'android.intent.extra.PROCESS_TEXT': text,
                'android.intent.extra.PROCESS_TEXT_READONLY': true,
              },
              // note: to skip the intermediate app select, we need to specify a
              // `className`. however, this isn't safe to hardcode, we'd need to query the
              // package manager for the correct activity. this requires native code, so
              // skip for now -sfn
              // packageName: 'com.google.android.apps.translate',
              // className: 'com.google.android.apps.translate.TranslateActivity',
            },
          )
        } catch (err) {
          if (__DEV__) console.error(err)
          // most likely means they don't have the translate app
          openLink(translateUrl)
        }
      } else {
        openLink(translateUrl)
      }
    },
    [openLink, provider, libreTranslateInstance],
  )
}
