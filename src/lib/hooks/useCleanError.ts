import {useCallback} from 'react'
import {useLingui} from '@lingui/react/macro'

type CleanedError = {
  raw: string | undefined
  clean: string | undefined
}

export function useCleanError() {
  const {t: l} = useLingui()

  return useCallback<(error?: unknown) => CleanedError>(
    error => {
      if (!error)
        return {
          raw: undefined,
          clean: undefined,
        }

      let raw =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error)

      if (isNetworkError(raw)) {
        return {
          raw,
          clean: l`Unable to connect. Please check your internet connection and try again.`,
        }
      }

      if (
        raw.includes('Upstream Failure') ||
        raw.includes('NotEnoughResources') ||
        raw.includes('pipethrough network error')
      ) {
        return {
          raw,
          clean: l`The server appears to be experiencing issues. Please try again in a few moments.`,
        }
      }

      /**
       * @see https://github.com/bluesky-social/atproto/blob/255cfcebb54332a7129af768a93004e22c6858e3/packages/pds/src/actor-store/preference/transactor.ts#L24
       */
      if (
        raw.includes('Do not have authorization to set preferences') &&
        raw.includes('app.bsky.actor.defs#personalDetailsPref')
      ) {
        return {
          raw,
          clean: l`You cannot update your birthdate while using an app password. Please sign in with your main password to update your birthdate.`,
        }
      }

      if (raw.includes('Bad token scope') || raw.includes('Bad token method')) {
        return {
          raw,
          clean: l`This feature is not available while using an app password. Please sign in with your main password.`,
        }
      }

      if (raw.includes('Rate Limit Exceeded')) {
        return {
          raw,
          clean: l`You've reached the maximum number of requests allowed. Please try again later.`,
        }
      }

      if (raw.startsWith('Error: ')) {
        raw = raw.slice('Error: '.length)
      }

      return {
        raw,
        clean: undefined,
      }
    },
    [l],
  )
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
