import {useCallback, useRef} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export const isEmailVerifiedQueryKey = ['isEmailVerified'] as const

export function useInvalidateIsEmailVerified() {
  const qc = useQueryClient()

  return useCallback(() => {
    return qc.invalidateQueries({
      queryKey: isEmailVerifiedQueryKey,
    })
  }, [qc])
}

export function useIsEmailVerified({
  onVerify,
}: {
  onVerify?: () => void
} = {}) {
  const agent = useAgent()
  const prevIsEmailVerified = useRef(!!agent.session?.emailConfirmed)
  const query = useQuery({
    enabled: !!agent.session,
    initialData: {isEmailVerified: !!agent.session?.emailConfirmed},
    refetchOnWindowFocus: true,
    queryKey: isEmailVerifiedQueryKey,
    queryFn: async () => {
      const {data} = await agent.com.atproto.server.getSession()
      return {
        isEmailVerified: !!data.emailConfirmed,
      }
    },
  })

  // TODO double check racing?
  if (query.data.isEmailVerified && !prevIsEmailVerified.current) {
    console.log('fire')
    prevIsEmailVerified.current = true
    onVerify?.()
  } else if (prevIsEmailVerified.current && !query.data.isEmailVerified) {
    console.log('reset')
    prevIsEmailVerified.current = false
  }

  return query.data
}
