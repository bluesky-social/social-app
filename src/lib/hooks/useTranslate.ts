import {useCallback} from 'react'
import * as IntentLauncher from 'expo-intent-launcher'

import {getTranslatorLink} from '#/locale/helpers'
import {isAndroid} from '#/platform/detection'
import {useOpenLink} from './useOpenLink'

export function useTranslate() {
  const openLink = useOpenLink()

  return useCallback(
    async (text: string, language: string) => {
      const translateUrl = getTranslatorLink(text, language)
      if (isAndroid) {
        try {
          // use getApplicationIconAsync to determine if the translate app is installed
          if (
            !(await IntentLauncher.getApplicationIconAsync(
              'com.google.android.apps.translate',
            ))
          ) {
            throw new Error('Translate app not installed')
          }

          await IntentLauncher.startActivityAsync(
            'android.intent.action.PROCESS_TEXT',
            {
              type: 'text/plain',
              extra: {
                'android.intent.extra.PROCESS_TEXT': text,
                'android.intent.extra.PROCESS_TEXT_READONLY': true,
              },
              packageName: 'com.google.android.apps.translate',
            },
          )
        } catch (err) {
          if (__DEV__) console.error(err)
          // most likely means they don't have the translate app
          await openLink(translateUrl)
        }
      } else {
        await openLink(translateUrl)
      }
    },
    [openLink],
  )
}
