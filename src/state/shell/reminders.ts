import {toSimpleDateString} from '#/lib/strings/time'
import {logger} from '#/logger'
import * as persisted from '#/state/persisted'
import {SessionAccount} from '../session'
import {isOnboardingActive} from './onboarding'

export function shouldRequestEmailConfirmation(account: SessionAccount) {
  // ignore logged out
  if (!account) return false
  // ignore confirmed accounts, this is the success state of this reminder
  if (account.emailConfirmed) return false
  // wait for onboarding to complete
  if (isOnboardingActive()) return false

  const stored = persisted.get('reminders').lastEmailConfirm
  const snoozedAt = stored ? toSimpleDateString(new Date(stored)) : undefined
  const today = toSimpleDateString(new Date())

  logger.debug('Checking email confirmation reminder', {
    today,
    snoozedAt,
  })

  // never been snoozed, new account
  if (!snoozedAt) {
    snooze()
    return true
  }

  // already snoozed today
  if (snoozedAt === today) {
    return false
  }

  // snoozed recently
  if (snoozedAt !== today) {
    snooze()
    return true
  }

  // should never happen
  snooze()
  return true
}

export function snooze() {
  const lastEmailConfirm = new Date().toISOString()
  logger.debug('Snoozing email confirmation reminder', {
    snoozedAt: lastEmailConfirm,
  })
  persisted.write('reminders', {
    ...persisted.get('reminders'),
    lastEmailConfirm,
  })
}
