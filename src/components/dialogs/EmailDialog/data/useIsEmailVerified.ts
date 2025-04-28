import {useCallback, useState} from 'react'
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
  const [prevIsEmailVerified, setPrevEmailIsVerified] = useState(
    !!agent.session?.emailConfirmed,
  )
  const query = useQuery({
    enabled: !!agent.session,
    initialData: {isEmailVerified: !!agent.session?.emailConfirmed},
    refetchOnWindowFocus: true,
    queryKey: isEmailVerifiedQueryKey,
    queryFn: async () => {
      // will also trigger updates to `#/state/session` data
      const {data} = await agent.resumeSession(agent.session!)
      return {
        isEmailVerified: !!data.emailConfirmed,
      }
    },
  })

  if (query.data.isEmailVerified && !prevIsEmailVerified) {
    setPrevEmailIsVerified(true)
    onVerify?.()
  } else if (!query.data.isEmailVerified && prevIsEmailVerified) {
    setPrevEmailIsVerified(false)
  }

  return query.data
}
