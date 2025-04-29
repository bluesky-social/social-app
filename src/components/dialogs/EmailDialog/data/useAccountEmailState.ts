import {useCallback, useEffect, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {emitEmailVerified} from '#/components/dialogs/EmailDialog/events'

export type AccountEmailState = {
  isEmailVerified: boolean
  email2FAEnabled: boolean
}

export const accountEmailStateQueryKey = ['accountEmailState'] as const

export function useInvalidateAccountEmailState() {
  const qc = useQueryClient()

  return useCallback(() => {
    return qc.invalidateQueries({
      queryKey: accountEmailStateQueryKey,
    })
  }, [qc])
}

export function useUpdateAccountEmailStateQueryCache() {
  const qc = useQueryClient()

  return useCallback(
    (data: AccountEmailState) => {
      return qc.setQueriesData(
        {
          queryKey: accountEmailStateQueryKey,
        },
        data,
      )
    },
    [qc],
  )
}

export function useAccountEmailState() {
  const agent = useAgent()
  const [prevIsEmailVerified, setPrevEmailIsVerified] = useState(
    !!agent.session?.emailConfirmed,
  )
  const fallbackData: AccountEmailState = {
    isEmailVerified: !!agent.session?.emailConfirmed,
    email2FAEnabled: !!agent.session?.emailAuthFactor,
  }
  const query = useQuery<AccountEmailState>({
    enabled: !!agent.session,
    refetchOnWindowFocus: true,
    queryKey: accountEmailStateQueryKey,
    queryFn: async () => {
      // will also trigger updates to `#/state/session` data
      const {data} = await agent.resumeSession(agent.session!)
      return {
        isEmailVerified: !!data.emailConfirmed,
        email2FAEnabled: !!data.emailAuthFactor,
      }
    },
  })

  const state = query.data ?? fallbackData

  /*
   * This will emit `n` times for each instance of this hook. So the listeners
   * all use `once` to prevent multiple handlers firing.
   */
  useEffect(() => {
    if (state.isEmailVerified && !prevIsEmailVerified) {
      setPrevEmailIsVerified(true)
      emitEmailVerified()
    } else if (!state.isEmailVerified && prevIsEmailVerified) {
      setPrevEmailIsVerified(false)
    }
  }, [state, prevIsEmailVerified])

  return state
}
