import {useMemo} from 'react'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {preferencesQueryKey} from '#/state/queries/preferences'
import {useAgent, useSession} from '#/state/session'
import {usePatchAgeAssuranceOtherRequiredData} from '#/ageAssurance'
import {IS_DEV} from '#/env'
import {account} from '#/storage'

// 6s in dev, 48h in prod
const BIRTHDATE_DELAY_HOURS = IS_DEV ? 0.001 : 48

/**
 * Stores the timestamp of the birthday update locally. This is used to
 * debounce birthday updates globally.
 *
 * Use {@link useIsBirthDateUpdateAllowed} to check if an update is allowed.
 */
export function snoozeBirthdateUpdateAllowedForDid(did: string) {
  account.set([did, 'birthdateLastUpdatedAt'], new Date().toISOString())
}

/**
 * Checks if we've already snoozed bday updates. In some cases, if one is
 * present, we don't need to set another, such as in AA when reading initial
 * data on load.
 */
export function hasSnoozedBirthdateUpdateForDid(did: string) {
  return !!account.get([did, 'birthdateLastUpdatedAt'])
}

/**
 * Returns whether a birthdate update is currently allowed, based on the
 * last update timestamp stored locally.
 */
export function useIsBirthdateUpdateAllowed() {
  const {currentAccount} = useSession()
  return useMemo(() => {
    if (!currentAccount) return false
    const lastUpdated = account.get([
      currentAccount.did,
      'birthdateLastUpdatedAt',
    ])
    if (!lastUpdated) return true
    const lastUpdatedDate = new Date(lastUpdated)
    const diffMs = Date.now() - lastUpdatedDate.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return diffHours >= BIRTHDATE_DELAY_HOURS
  }, [currentAccount])
}

export function useBirthdateMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()
  const patchOtherRequiredData = usePatchAgeAssuranceOtherRequiredData()

  return useMutation<void, unknown, {birthDate: Date}>({
    mutationFn: async ({birthDate}: {birthDate: Date}) => {
      const bday = birthDate.toISOString()
      await agent.setPersonalDetails({birthDate: bday})
      // triggers a refetch
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
      /**
       * Also patch the age assurance other required data with the new
       * birthdate, which may change the user's age assurance access level.
       */
      patchOtherRequiredData({birthdate: bday})
      snoozeBirthdateUpdateAllowedForDid(agent.sessionManager.did!)
    },
  })
}
