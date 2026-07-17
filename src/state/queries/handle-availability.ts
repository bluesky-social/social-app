import {Client} from '@atproto/lex'
import {type DatetimeString, type HandleString} from '@atproto/syntax'
import {useQuery} from '@tanstack/react-query'

import {
  BSKY_SERVICE,
  BSKY_SERVICE_DID,
  PUBLIC_BSKY_SERVICE,
} from '#/lib/constants'
import {useDebouncedValue} from '#/lib/hooks/useDebouncedValue'
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
    // entryway has a special API for handle availability
    const client = new Client({service: BSKY_SERVICE})
    const data = await client.call(com.atproto.temp.checkHandleAvailability, {
      handle: handle as HandleString,
      birthDate: birthDate as DatetimeString | undefined,
      email,
    })

    const result = data.result

    if (
      bsky.isType(
        com.atproto.temp.checkHandleAvailability.resultAvailable,
        result,
      )
    ) {
      return {available: true} as const
    } else if (
      bsky.isType(
        com.atproto.temp.checkHandleAvailability.resultUnavailable,
        result,
      )
    ) {
      return {
        available: false,
        suggestions: result.suggestions,
      } as const
    } else {
      throw new Error(
        `Unexpected result of \`checkHandleAvailability\`: ${JSON.stringify(data.result)}`,
      )
    }
  } else {
    // 3rd party PDSes won't have this API so just try and resolve the handle
    const client = new Client({service: PUBLIC_BSKY_SERVICE})
    try {
      const res = await client.call(com.atproto.identity.resolveHandle, {
        handle: handle as HandleString,
      })

      if (res.did) {
        return {available: false} as const
      }
    } catch {}
    return {available: true} as const
  }
}
