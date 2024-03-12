import {toHashCode} from 'lib/strings/helpers'

import * as persisted from '#/state/persisted'

import {SessionAccount} from '../session'
import {isOnboardingActive} from './onboarding'

export function shouldRequestEmailConfirmation(account: SessionAccount) {
  if (!account) {
    return false
  }
  if (account.emailConfirmed) {
    return false
  }
  if (isOnboardingActive()) {
    return false
  }
  // only prompt once
  if (persisted.get('reminders').lastEmailConfirm) {
    return false
  }
  const today = new Date()
  // shard the users into 2 day of the week buckets
  // (this is to avoid a sudden influx of email updates when
  // this feature rolls out)
  const code = toHashCode(account.did) % 7
  if (code !== today.getDay() && code !== (today.getDay() + 1) % 7) {
    return false
  }
  return true
}

export function setEmailConfirmationRequested() {
  persisted.write('reminders', {
    ...persisted.get('reminders'),
    lastEmailConfirm: new Date().toISOString(),
  })
}
