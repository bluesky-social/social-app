import {Linking} from 'react-native'
import * as auth from '@adxp/auth'
import {InAppBrowser} from 'react-native-inappbrowser-reborn'
import {isWeb} from '../platform/detection'
import {makeAppUrl} from '../platform/urls'
import * as env from '../env'

const SCOPE = auth.writeCap(
  'did:key:z6MkfRiFMLzCxxnw6VMrHK8pPFt4QAHS3jX3XM87y9rta6kP',
  'did:example:microblog',
)

export async function isAuthed(authStore: auth.BrowserStore) {
  return await authStore.hasUcan(SCOPE)
}

export async function logout(authStore: auth.BrowserStore) {
  await authStore.reset()
}

export async function parseUrlForUcan() {
  // @ts-ignore window is defined -prf
  const fragment = window.location.hash
  if (fragment.length < 1) {
    return undefined
  }
  try {
    const ucan = await auth.parseLobbyResponseHashFragment(fragment)
    // @ts-ignore window is defined -prf
    window.location.hash = ''
    return ucan
  } catch (err) {
    return undefined
  }
}

export async function requestAppUcan(authStore: auth.BrowserStore) {
  const did = await authStore.getDid()
  const returnUrl = makeAppUrl()
  const fragment = auth.requestAppUcanHashFragment(did, SCOPE, returnUrl)
  const url = `${env.AUTH_LOBBY}#${fragment}`

  if (isWeb) {
    // @ts-ignore window is defined -prf
    window.location.href = url
    return false
  }

  if (await InAppBrowser.isAvailable()) {
    const res = await InAppBrowser.openAuth(url, returnUrl, {
      // iOS Properties
      ephemeralWebSession: false,
      // Android Properties
      showTitle: false,
      enableUrlBarHiding: true,
      enableDefaultShare: false,
    })
    if (res.type === 'success' && res.url) {
      Linking.openURL(res.url)
    } else {
      console.error('Bad response', res)
      return false
    }
  } else {
    Linking.openURL(url)
  }
  return true
}
