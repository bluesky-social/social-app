import {jwtDecode} from 'jwt-decode'

import {isJwtExpired} from '#/lib/jwt'
import {hasProp} from '#/lib/type-guards'
import {logger} from '#/logger'
import * as persisted from '#/state/persisted'
import {type SessionAccount} from './types'

export function readLastActiveAccount() {
  const {currentAccount, accounts} = persisted.get('session')
  return accounts.find(a => a.did === currentAccount?.did)
}

export function isSignupQueued(accessJwt: string | undefined) {
  if (accessJwt) {
    const sessData = jwtDecode(accessJwt)
    return (
      hasProp(sessData, 'scope') &&
      sessData.scope === 'com.atproto.signupQueued'
    )
  }
  return false
}

export function isSessionExpired(account: SessionAccount) {
  try {
    if (account.accessJwt) {
      return isJwtExpired(account.accessJwt)
    }
  } catch (e) {
    logger.error(`session: could not decode jwt`)
  }
  return true
}
