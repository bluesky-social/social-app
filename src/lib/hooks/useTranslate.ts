import {useCallback} from 'react'
import * as IntentLauncher from 'expo-intent-launcher'

import {getTranslatorLink} from '#/locale/helpers'
import {IS_ANDROID} from '#/env'
import {useOpenLink} from './useOpenLink'

export function useTranslate() {
  const openLink = useOpenLink()

  return useCallback(
    async (text: string, language: string) => {
      const translateUrl = getTranslatorLink(text, language)
      if (IS_ANDROID) {
        try {
          // use getApplicationIconAsync to determine if the translate app is installed
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
          await openLink(translateUrl)
        }
      } else {
        await openLink(translateUrl)
      }
    },
    [openLink],
  )
}
