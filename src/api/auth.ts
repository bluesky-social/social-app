import * as auth from '@adxp/auth'
import {isWeb} from '../platform/detection'
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
  if (isWeb) {
    // @ts-ignore window is defined -prf
    const redirectTo = window.location.origin
    const fragment = auth.requestAppUcanHashFragment(did, SCOPE, redirectTo)
    // @ts-ignore window is defined -prf
    window.location.href = `${env.AUTH_LOBBY}#${fragment}`
    return false
  } else {
    // TODO
    console.log('TODO')
  }
  return false
}
