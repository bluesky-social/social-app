import {Share, type ShareContent} from 'react-native'
// import * as Sharing from 'expo-sharing'
import {setStringAsync} from 'expo-clipboard'
import {t} from '@lingui/core/macro'

import {beginAppInitiatedActivity} from '#/lib/appState'
import * as Toast from '#/components/Toast'
import {IS_ANDROID, IS_IOS} from '#/env'

/**
 * `Share.share` in an app-initiated activity scope. On Android it resolves as
 * soon as the share sheet has launched, before the app has even left, so the
 * scope is left to end with the trip it covers unless the launch fails.
 */
async function share(content: ShareContent) {
  const end = beginAppInitiatedActivity()
  try {
    await Share.share(content)
  } catch (e) {
    end()
    throw e
  }
}

/**
 * This function shares a URL using the native Share API if available, or copies it to the clipboard
 * and displays a toast message if not (mostly on web)
 * @param {string} url - A string representing the URL that needs to be shared or copied to the
 * clipboard.
 */
export async function shareUrl(url: string) {
  if (IS_ANDROID) {
    await share({message: url})
  } else if (IS_IOS) {
    await share({url})
  } else {
    // React Native Share is not supported by web. Web Share API
    // has increasing but not full support, so default to clipboard
    setStringAsync(url)
    Toast.show(t`Copied to clipboard`, {
      type: 'success',
    })
  }
}

/**
 * This function shares a text using the native Share API if available, or copies it to the clipboard
 * and displays a toast message if not (mostly on web)
 *
 * @param {string} text - A string representing the text that needs to be shared or copied to the
 * clipboard.
 */
export async function shareText(text: string) {
  if (IS_ANDROID || IS_IOS) {
    await share({message: text})
  } else {
    await setStringAsync(text)
    Toast.show(t`Copied to clipboard`, {
      type: 'success',
    })
  }
}
