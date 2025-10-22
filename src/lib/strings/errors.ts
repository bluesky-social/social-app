import {t} from '@lingui/macro'

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
  if (str.includes('Bad token scope') || str.includes('Bad token method')) {
    return t`This feature is not available while using an App Password. Please sign in with your main password.`
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
