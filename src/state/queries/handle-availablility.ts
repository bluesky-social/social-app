import {useQuery} from '@tanstack/react-query'

import {createFullHandle, isHandleReserved} from '#/lib/strings/handles'
import {useAgent} from '#/state/session'
import {useDebouncedValue} from '#/components/live/utils'

export const RQKEY_handleAvailability = (handle: string) => [
  'handle-availability',
  handle,
]

export function useHandleAvailabilityQuery(
  name: string,
  domain: string,
  enabled: boolean,
  debounceDelayMs = 500,
) {
  name = name.trim()
  const handle = createFullHandle(name, domain)
  const debouncedHandle = useDebouncedValue(handle, debounceDelayMs)
  const agent = useAgent()

  return useQuery({
    enabled: enabled && handle === debouncedHandle,
    queryKey: RQKEY_handleAvailability(debouncedHandle),
    queryFn: async () => {
      const frontSegment = debouncedHandle.split('.')[0]
      if (isHandleReserved(frontSegment)) {
        return {available: false, reason: 'reserved'} as const
      }
      try {
        const res = await agent.resolveHandle({
          handle: debouncedHandle,
        })

        if (res.data.did) {
          return {available: false, reason: 'taken'} as const
        }
      } catch {}

      return {available: true} as const
    },
  })
}
