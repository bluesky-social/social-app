import {type DatetimeString, type HandleString} from '@atproto/syntax'
import {useQuery} from '@tanstack/react-query'

import {
  BSKY_SERVICE,
  BSKY_SERVICE_DID,
  PUBLIC_BSKY_SERVICE,
} from '#/lib/constants'
import {useDebouncedValue} from '#/lib/hooks/useDebouncedValue'
import {createServiceClient} from '#/lib/lexClient'
import {createFullHandle} from '#/lib/strings/handles'
import {useAnalytics} from '#/analytics'
import {com} from '#/lexicons'
import * as bsky from '#/types/bsky'

export const RQKEY_handleAvailability = (
  handle: string,
  domain: string,
  serviceDid: string,
) => ['handle-availability', {handle, domain, serviceDid}]

export function useHandleAvailabilityQuery(
  {
    username,
    serviceDomain,
    serviceDid,
    enabled,
    birthDate,
    email,
  }: {
    username: string
    serviceDomain: string
    serviceDid: string
    enabled: boolean
    birthDate?: string
    email?: string
  },
  debounceDelayMs = 500,
) {
  const ax = useAnalytics()
  const name = username.trim()
  const debouncedHandle = useDebouncedValue(name, debounceDelayMs)

  return {
    debouncedUsername: debouncedHandle,
    enabled: enabled && name === debouncedHandle,
    query: useQuery({
      enabled: enabled && name === debouncedHandle,
      queryKey: RQKEY_handleAvailability(
        debouncedHandle,
        serviceDomain,
        serviceDid,
      ),
      queryFn: async () => {
        const handle = createFullHandle(name, serviceDomain)
        const res = await checkHandleAvailability(handle, serviceDid, {
          email,
          birthDate,
        })
        if (res.available) {
          ax.metric('signup:handleAvailable', {typeahead: true})
        } else {
          ax.metric('signup:handleTaken', {typeahead: true})
        }
        return res
      },
    }),
  }
}

export async function checkHandleAvailability(
  handle: string,
  serviceDid: string,
  {
    email,
    birthDate,
  }: {
    email?: string
    birthDate?: string
  },
) {
  if (serviceDid === BSKY_SERVICE_DID) {
    /*
     * Runs pre-auth during signup, so it goes through a one-off service client
     * rather than a session-scoped one. The target is the fixed entryway rather
     * than a user-supplied host, but there is still no session to hang a client
     * off.
     */
    const client = createServiceClient(BSKY_SERVICE)
    // entryway has a special API for handle availability
    const data = await client.call(com.atproto.temp.checkHandleAvailability, {
      // the caller assembles this from a validated username and domain
      handle: handle as HandleString,
      // callers pass an ISO date string built from the birth-date picker
      birthDate: birthDate as DatetimeString | undefined,
      email,
    })

    if (
      bsky.isType(
        com.atproto.temp.checkHandleAvailability.resultAvailable,
        data.result,
      )
    ) {
      return {available: true} as const
    } else if (
      bsky.isType(
        com.atproto.temp.checkHandleAvailability.resultUnavailable,
        data.result,
      )
    ) {
      return {
        available: false,
        suggestions: data.result.suggestions,
      } as const
    } else {
      throw new Error(
        `Unexpected result of \`checkHandleAvailability\`: ${JSON.stringify(data.result)}`,
      )
    }
  } else {
    /*
     * 3rd party PDSes won't have this API so just try and resolve the handle.
     * This is an unauthenticated public-appview read, not a call against the
     * user's chosen host.
     */
    const client = createServiceClient(PUBLIC_BSKY_SERVICE)
    try {
      const data = await client.call(com.atproto.identity.resolveHandle, {
        handle: handle as HandleString,
      })

      if (data.did) {
        return {available: false} as const
      }
    } catch {}
    return {available: true} as const
  }
}
