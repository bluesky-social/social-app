import {XRPCError} from '@atproto/api'
import {t} from '@lingui/core/macro'

export function cleanError(str: any): string {
  if (!str) {
    return ''
  }
  if (typeof str !== 'string') {
    str = str.toString()
  }
  if (isNetworkError(str)) {
    return t`Unable to connect. Please check your internet connection and try again.`
  }
  if (
    str.includes('Upstream Failure') ||
    str.includes('NotEnoughResources') ||
    str.includes('pipethrough network error')
  ) {
    return t`The server appears to be experiencing issues. Please try again in a few moments.`
  }
  /**
   * @see https://github.com/bluesky-social/atproto/blob/255cfcebb54332a7129af768a93004e22c6858e3/packages/pds/src/actor-store/preference/transactor.ts#L24
   */
  if (
    str.includes('Do not have authorization to set preferences') &&
    str.includes('app.bsky.actor.defs#personalDetailsPref')
  ) {
    return t`You cannot update your birthdate while using an app password. Please sign in with your main password to update your birthdate.`
  }
  if (str.includes('Bad token scope') || str.includes('Bad token method')) {
    return t`This feature is not available while using an App Password. Please sign in with your main password.`
  }
  if (str.includes('OAuth credentials are not supported')) {
    return t`This feature is not available when signed in with OAuth. Please manage your account through your hosting provider's website.`
  }
  if (
    str.includes('ScopeMissingError') ||
    str.includes('Missing required scope')
  ) {
    return t`This feature is not available with your current session. Please manage your account through your hosting provider's website, or sign out and sign back in to refresh your permissions.`
  }
  if (
    str.includes('session was deleted by another process') ||
    str.includes('No refresh token available') ||
    str.includes('The session was revoked')
  ) {
    return t`Your session has expired. Please sign in again.`
  }
  if (
    str.includes('Database closed') ||
    str.includes('Database has been disposed')
  ) {
    return t`Session storage is unavailable. Please sign in again.`
  }
  if (str.includes('invalid_dpop_proof') && str.includes('iat claim')) {
    return t`Your device clock appears to be incorrect. Please check your system time settings and try again.`
  }
  if (str.includes('invalid_dpop_proof')) {
    return t`Authentication error. Please try signing in again.`
  }
  if (str.includes('Session resume timed out')) {
    return t`Sign in is taking too long. Please try again.`
  }
  if (
    str.includes('Token set sub mismatch') ||
    str.includes('Stored session sub mismatch')
  ) {
    return t`Session data is corrupted. Please sign in again.`
  }
  if (str.includes('Account has been suspended')) {
    return t`Account has been suspended`
  }
  if (str.includes('Account is deactivated')) {
    return t`Your account is deactivated. If you recently moved to a new hosting provider, reactivate to complete the migration.`
  }
  if (str.includes('Account has been taken down')) {
    return t`Account has been taken down`
  }
  if (str.includes('Account has been deleted')) {
    return t`Account has been deleted`
  }
  if (str.includes('Profile not found')) {
    return t`Profile not found`
  }
  if (str.includes('Unable to resolve handle')) {
    return t`Unable to resolve handle`
  }
  if (str.startsWith('Error: ')) {
    return str.slice('Error: '.length)
  }
  return str
}

const NETWORK_ERRORS = [
  'Abort',
  'Network request failed',
  'Failed to fetch',
  'Load failed',
  'Upstream service unreachable',
  'NetworkError when attempting to fetch resource',
]

export function isNetworkError(e: unknown) {
  const str = String(e)
  for (const err of NETWORK_ERRORS) {
    if (str.includes(err)) {
      return true
    }
  }
  return false
}

export function isErrorMaybeAppPasswordPermissions(e: unknown) {
  if (e instanceof XRPCError && e.error === 'TokenInvalid') {
    return true
  }
  const str = String(e)
  return str.includes('Bad token scope') || str.includes('Bad token method')
}

/**
 * Intended to capture "User cancelled" or "Crop cancelled" errors
 * that we often get from expo modules such @bsky.app/expo-image-crop-tool
 *
 * The exact name has changed in the past so let's just see if the string
 * contains "cancel"
 */
export function isCancelledError(e: unknown) {
  const str = String(e).toLowerCase()
  return str.includes('cancel')
}
