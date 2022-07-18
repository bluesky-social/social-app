import {Linking} from 'react-native'
import * as auth from '@adxp/auth'
import * as ucan from 'ucans'
import {InAppBrowser} from 'react-native-inappbrowser-reborn'
import {isWeb} from '../platform/detection'
import {extractHashFragment, makeAppUrl} from '../platform/urls'
import {ReactNativeStore, parseUrlForUcan} from '../state/lib/auth'
import * as env from '../env'

export async function requestAppUcan(
  authStore: ReactNativeStore,
  scope: ucan.Capability,
) {
  const did = await authStore.getDid()
  const returnUrl = makeAppUrl()
  const fragment = auth.requestAppUcanHashFragment(did, scope, returnUrl)
  const url = `${env.AUTH_LOBBY}#${fragment}`

  if (isWeb) {
    // @ts-ignore window is defined -prf
    window.location.href = url
    return false
  }

  if (await InAppBrowser.isAvailable()) {
    // use in-app browser
    const res = await InAppBrowser.openAuth(url, returnUrl, {
      // iOS Properties
      ephemeralWebSession: false,
      // Android Properties
      showTitle: false,
      enableUrlBarHiding: true,
      enableDefaultShare: false,
    })
    if (res.type === 'success' && res.url) {
      const fragment = extractHashFragment(res.url)
      if (fragment) {
        const ucan = await parseUrlForUcan(fragment)
        if (ucan) {
          await authStore.addUcan(ucan)
          return true
        }
      }
    } else {
      console.log('Not completed', res)
      return false
    }
  } else {
    // use system browser
    Linking.openURL(url)
  }
  return true
}
