import {useEffect, useMemo, useState} from 'react'
import {useQuery} from '@tanstack/react-query'

import {useAgent, useSessionApi} from '#/state/session'
import {emitEmailVerified} from '#/components/dialogs/EmailDialog/events'

export type AccountEmailState = {
  isEmailVerified: boolean
  email2FAEnabled: boolean
}

export const accountEmailStateQueryKey = ['accountEmailState'] as const

export function useAccountEmailState() {
  const agent = useAgent()
  const {partialRefreshSession} = useSessionApi()
  const [prevIsEmailVerified, setPrevEmailIsVerified] = useState(
    !!agent.session?.emailConfirmed,
  )
  const state: AccountEmailState = useMemo(
    () => ({
      isEmailVerified: !!agent.session?.emailConfirmed,
      email2FAEnabled: !!agent.session?.emailAuthFactor,
    }),
    [agent.session],
  )

  /**
   * Only here to refetch on focus, when necessary
   */
  useQuery({
    enabled: !!agent.session,
    /**
     * Only refetch if the email verification s incomplete.
     */
    refetchOnWindowFocus: !prevIsEmailVerified,
    queryKey: accountEmailStateQueryKey,
    queryFn: async () => {
      await partialRefreshSession()
      return null
    },
  })

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
