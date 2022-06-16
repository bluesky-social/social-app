import * as auth from '@adxp/auth'
import * as ucan from 'ucans'
import {makeAppUrl} from '../platform/urls'
import {ReactNativeStore} from '../state/auth'
import * as env from '../env'

export async function requestAppUcan(
  authStore: ReactNativeStore,
  scope: ucan.Capability,
) {
  const did = await authStore.getDid()
  const returnUrl = makeAppUrl()
  const fragment = auth.requestAppUcanHashFragment(did, scope, returnUrl)
  const url = `${env.AUTH_LOBBY}#${fragment}`

  // @ts-ignore window is defined -prf
  window.location.href = url
  return false
}
